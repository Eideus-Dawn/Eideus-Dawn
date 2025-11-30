
import { EngineState, Transform, Modifier, Slot } from '../types';

const createEmptySlots = (count: number): Slot[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `slot-${i}`,
    name: "Empty",
    description: "Waiting for narrative emergence...",
    active: false,
    associatedWith: undefined
  }));
};

const createModifier = (id: string, name: string, type: string, desc: string): Modifier => ({
  id,
  name,
  type,
  description: desc,
  slots: createEmptySlots(7),
  score: 0
});

export const initialEngineState: EngineState = {
  player: {
    name: null,
    status: "Amnesiac"
  },
  tavernNPCs: [
    { name: "Unknown Patron 1", relationship: 0, description: "A shadowy figure." },
    { name: "Unknown Patron 2", relationship: 0, description: "A shadowy figure." },
    { name: "Unknown Patron 3", relationship: 0, description: "A shadowy figure." },
    { name: "Unknown Patron 4", relationship: 0, description: "A shadowy figure." },
    { name: "Unknown Patron 5", relationship: 0, description: "A shadowy figure." },
    { name: "Unknown Patron 6", relationship: 0, description: "A shadowy figure." },
  ],
  identity: {
    id: 'transform-identity',
    name: 'Identity Phase',
    description: 'The Protagonist and their closest bonds.',
    modifiers: [
      createModifier('id-mod-1', 'Pending Bond A', 'Supporting NPC', 'Highest relationship NPC will appear here.'),
      createModifier('id-mod-2', 'Pending Bond B', 'Supporting NPC', 'Second highest relationship NPC.'),
      createModifier('id-mod-3', 'Pending Bond C', 'Supporting NPC', 'Third highest relationship NPC.')
    ]
  },
  world: {
    id: 'transform-world',
    name: 'World Phase',
    description: 'The setting and environment.',
    modifiers: [
      createModifier('world-mod-1', 'Novelty', 'Theme', '7 unique aspects of this world (Wonders, Magic, Physics).'),
      createModifier('world-mod-2', 'Geopolitics', 'Factions', '7 main powers, nations, or cities.'),
      createModifier('world-mod-3', 'Local Geography', 'Location', '7 key local landmarks relevant to the story.')
    ]
  },
  story: {
    id: 'transform-story',
    name: 'Inception Phase',
    description: 'The narrative drivers.',
    modifiers: [
      createModifier('story-mod-1', 'Protagonists', 'Allies', '7 entities or NPCs derived from Identity bonds.'),
      createModifier('story-mod-2', 'Antagonists', 'Enemies', '7 forces opposing the player.'),
      createModifier('story-mod-3', 'Mutation', 'Chaos', '7 random story drivers/plot twists.')
    ]
  },
  npcArchive: {},
  memoryLattices: [[]], // Start with one empty lattice page
  memoryRegistry: {}
};
