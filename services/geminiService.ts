
import { GoogleGenAI } from "@google/genai";
import { EngineState, Transform } from "../types";
import { RetrievedMemory } from "./memoryService";

const JSON_STRUCTURE_HINT = `
{
  "meta": { "sceneChange": boolean },
  "playerUpdate": { "name": "string or null", "status": "string or null" },
  "tavernUpdate": [ { "name": "string", "relationship": number, "description": "string" } ],
  "identityUpdate": { 
    "modifiers": [ 
      { 
        "index": number, "name": "string", "description": "string", "score": number,
        "slots": [ { "index": number, "name": "string", "description": "string", "active": boolean, "associatedWith": "string" } ]
      } 
    ] 
  },
  "worldUpdate": { 
     "modifiers": [ 
      { 
        "index": number, "name": "string", 
        "slots": [ { "index": number, "name": "string", "description": "string", "active": boolean, "associatedWith": "string" } ]
      } 
    ]
  },
  "storyUpdate": { 
     "modifiers": [ 
      { 
        "index": number, "name": "string", 
        "slots": [ { "index": number, "name": "string", "description": "string", "active": boolean, "associatedWith": "string" } ]
      } 
    ]
  }
}
`;

const SYSTEM_INSTRUCTION = `
You are the Eideus Dawn RPG Engine. You act as the Game Master (GM) and the Narrative Architect.

**Core Directive:**
Run a text-based RPG demo showcasing the "1x3x7" engine structure. 
Do not break character as the GM in your text response.

**Length & Pacing Constraints (IMPORTANT):**
1.  **Narrative Descriptions:** Keep environmental descriptions and action sequences concise (approx. max 500 tokens). Focus on atmosphere and immediate relevance.
2.  **Dialogue:** Keep spoken conversation snappy, realistic, and reactive (approx. max 300 tokens). Avoid long monologues.

**Narrative Formatting Rules (CRITICAL):**
To support the visual interface, you MUST format the narrative text as follows:
1.  **Dialogue:** Enclose ALL spoken words by characters in double quotes. Example: "Who goes there?" he asked.
2.  **Locations & Key Entities:** Enclose ALL proper names of Locations (e.g., The Rusty Anchor, Mount Doom) and Key Items/NPCs in double asterisks. Example: We arrived at **The Gilded Spire**.
3.  **Narrative:** Use standard text for descriptions and actions.

**Game Phases & Logic:**
1.  **Opening Scene:** The player is in a tavern with 6 NPCs. The player has AMNESIA.
    *   Goal: Naturally prompt the player to choose a name.
    *   Goal: Facilitate dialogue.
2.  **Identity Phase (The 3 Modifiers):**
    *   Track relationship scores (hidden 0-100) for the 6 Tavern NPCs.
    *   The top 3 NPCs with the highest scores become the 3 ACTIVE MODIFIERS for the "Identity Transform".
    *   **Identity Slots (7 per Modifier):** As the player interacts with a Supporting NPC, fill their 7 slots with "Child NPCs" or specific "Aspects" related to them.
3.  **World Phase (The 3 Modifiers):**
    *   **Novelty:** Invent and track 7 unique world aspects (Wonders, Magic, Physics).
    *   **Geopolitics:** Invent and track 7 Factions/Nations.
    *   **Local Geography (CRITICAL):** Invent and track 7 Local Landmarks.
    *   **ASSOCIATION:** When creating a Local Landmark (World Mod 3), you MUST try to associate it with one of the active Identity Phase NPCs if narrative fits. This allows the graph to link the location to that character.
4.  **Inception/Story Phase (The 3 Modifiers):**
    *   **Protagonists:** 7 Helpful entities.
    *   **Antagonists:** 7 Opposing forces/villains.
    *   **Mutation:** 7 Random plot twists.

**Identity Swap Protocol (CRITICAL):**
*   **Replacement Rule:** Whenever the set of top 3 Supporting NPCs changes (a new NPC enters the top 3, replacing an old one):
    *   You MUST output the FULL \`identityUpdate\` for that modifier index (0, 1, or 2).
    *   This update MUST include the new NPC's \`name\` AND all 7 of their \`slots\`.
    *   If the new NPC has been an Identity Modifier before, RESTORE their previous 7 slots (if narrative permits). 
    *   If they are new to the Identity Transform, generate 7 new slots for them.

**Data Consistency & Rules:**
*   **Diff-Only Updates:** You do NOT need to output the full JSON state every turn. Only output fields that have CHANGED.
*   **Rolling Context / Scene Changes (CRITICAL):**
    *   If the narrative involves the player moving to a COMPLETELY NEW geographic location (leaving the tavern, entering a dungeon, traveling to a new city):
    *   Set \`"meta": { "sceneChange": true }\` in your JSON response.
    *   This signals the engine to wipe the chat history.
    *   Because history is wiped, you MUST ensure the JSON state (Persistent Nodes) contains all critical quest/item data needed for the next scene.
*   **The 80% Threshold Rule:** 
    *   IF a Tavern NPC's relationship score reaches >= 80:
        1. Populate all 7 of their Identity Slots (Minor NPCs).
        2. Populate 1 specific World Slot in "Local Geography" (Home Town/Region) linked to them.
        3. Populate 1 specific World Slot in "Geopolitics" (Race/Civilization) linked to them.
*   **Reputation Cascade:** If the player betrays a Main NPC, update the descriptions of their associated Minor NPCs (Identity Slots) to reflect hostility.

**Output Protocol (STREAMING):**
1.  **Narrative First:** Output the story text immediately. Follow the Markdown rules ("quotes" for speech, **asterisks** for locations).
2.  **Separator:** Once the narrative is complete, output exactly this separator on a new line: |||JSON|||
3.  **Game State:** Immediately follow the separator with a valid JSON object matching this structure (Minified JSON is fine):
    ${JSON_STRUCTURE_HINT}

Do NOT include the 'narrative' field inside the JSON.
`;

/**
 * Minimizes the state to only send active/relevant data to the LLM to save context tokens.
 */
const createStateContext = (state: EngineState): any => {
  const simplifyTransform = (t: Transform) => ({
    modifiers: t.modifiers.map(m => ({
      name: m.name,
      description: m.description, // Keep description for context
      score: m.score, // Important for Identity
      slots: m.slots.filter(s => s.active || s.name !== "Empty").map(s => ({
        name: s.name,
        description: s.description,
        associatedWith: s.associatedWith
      }))
    }))
  });

  return {
    player: state.player,
    tavernNPCs: state.tavernNPCs,
    identity: simplifyTransform(state.identity),
    world: simplifyTransform(state.world),
    story: simplifyTransform(state.story)
  };
};

export const streamGameResponse = async function* (
  history: { role: string; content: string }[],
  currentInput: string,
  gameState: EngineState,
  apiKey: string,
  relevantMemories: RetrievedMemory[] = []
) {
  if (!apiKey) throw new Error("API Key not found. Please provide a valid Gemini API Key in the settings menu.");

  const ai = new GoogleGenAI({ apiKey });

  // Inject current game state into the prompt context
  const stateContext = JSON.stringify(createStateContext(gameState));
  
  // Format Memories
  let memoryContext = "";
  if (relevantMemories.length > 0) {
    memoryContext = `
[RECALLED MEMORIES (Use these to inform the narrative)]:
${relevantMemories.map((m, i) => `
${i+1}. [${m.relevance.toFixed(2)}] Summary: ${m.summary} | Tags: ${m.tags.join(', ')}
`).join('')}
`;
  }

  const contextualizedInput = `
[PERSISTENT WORLD STATE]: 
${stateContext}
${memoryContext}
[PLAYER INPUT]: 
${currentInput}
`;

  const contents = [
    ...history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })),
    {
      role: 'user',
      parts: [{ text: contextualizedInput }]
    }
  ];

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    }
  });

  for await (const chunk of responseStream) {
    yield chunk.text;
  }
};
