
import { GoogleGenAI } from "@google/genai";
import { MemoryNode, FaceType, ContentRegistry } from "../types";
import { generateHash, getNextCoordinate, cosineSimilarity, calculateJaccardIndex, calculateKeywordScore } from "../utils/memoryUtils";

interface TurnData {
  input: string;
  output: string;
}

export interface RetrievedMemory {
  node: MemoryNode;
  relevance: number;
  summary: string;
  tags: string[];
}

/**
 * 1. Generate Embedding
 * 2. Extract Metadata
 * 3. Store in Lattice
 */
export const processTurn = async (
  turnData: TurnData, 
  apiKey: string,
  currentLatticeLength: number,
  currentLatticeIndex: number
): Promise<{ newNode: MemoryNode, newRegistryData: ContentRegistry }> => {
  
  if (!apiKey) throw new Error("No API Key for Memory Service");
  
  // Optimization: Don't process empty or extremely short turns
  if (turnData.input.length < 2 || turnData.output.length < 5) {
     throw new Error("Turn data too short for memory processing");
  }

  const ai = new GoogleGenAI({ apiKey });

  // 1. Generate Embedding (Robust)
  const contextText = `User: ${turnData.input}\nGM: ${turnData.output}`;
  const embedding = await getEmbedding(contextText, apiKey);

  // 2. Extract Metadata
  const analysisPrompt = `
    Analyze this RPG turn.
    Input: "${turnData.input}"
    Output: "${turnData.output}"

    Return JSON with:
    - "scene": A short 10-word summary of the event.
    - "names": List of proper names mentioned.
    - "tags": List of abstract thematic tags (e.g. "Combat", "Betrayal").
  `;

  let metadata = { scene: "Unanalyzed", names: [], tags: [] };
  try {
    const metaResult = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: analysisPrompt,
      config: { responseMimeType: 'application/json' }
    });
    if (metaResult.text) {
      metadata = JSON.parse(metaResult.text);
    }
  } catch (e) {
    console.warn("Metadata extraction failed:", e);
  }

  // 3. Construct Node
  const inputHash = generateHash(turnData.input);
  const outputHash = generateHash(turnData.output);
  const sceneHash = generateHash(metadata.scene);
  const embeddingHash = generateHash(embedding);
  const tagsHash = generateHash(metadata.tags.join(", "));
  const namesHash = generateHash(metadata.names.join(", "));

  const { x, y, z } = getNextCoordinate(currentLatticeLength);

  const newNode: MemoryNode = {
    x, y, z,
    latticeIndex: currentLatticeIndex,
    timestamp: Date.now(),
    faces: {
      [FaceType.FRONT]: inputHash,
      [FaceType.BACK]: outputHash,
      [FaceType.TOP]: sceneHash,
      [FaceType.BOTTOM]: embeddingHash,
      [FaceType.LEFT]: tagsHash,
      [FaceType.RIGHT]: namesHash
    }
  };

  const newRegistryData: ContentRegistry = {
    [inputHash]: turnData.input,
    [outputHash]: turnData.output,
    [sceneHash]: metadata.scene,
    [embeddingHash]: embedding,
    [tagsHash]: metadata.tags.join(", "),
    [namesHash]: metadata.names.join(", ")
  };

  return { newNode, newRegistryData };
};

/**
 * Helper to get embedding via SDK with fallback.
 * Returns a zero vector if the API fails, preventing app crash.
 */
export const getEmbedding = async (text: string, apiKey: string): Promise<number[]> => {
  if (!apiKey) return new Array(768).fill(0);
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const result = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text, 
    });

    if (result.embedding && result.embedding.values) {
        return result.embedding.values;
    }
  } catch (e: any) {
    // Graceful degradation: Log warning but keep app running
    console.warn("Embedding API failed (Using placeholder vector):", e.message);
  }
  
  // Return zero vector on failure to allow game to proceed
  return new Array(768).fill(0);
};

/**
 * THE QUANTUM RAG ENGINE
 * 
 * Performs a multi-modal search across the lattice:
 * 1. Direct Phase: Vector + Keyword search.
 * 2. Entanglement Phase: Boosts nodes sharing tags with high-relevance nodes from Phase 1.
 * 3. Ranking Phase: Sorts and returns top matches.
 */
export const queryLattice = (
  queryText: string,
  queryEmbedding: number[],
  lattices: MemoryNode[][],
  registry: ContentRegistry,
  resonanceDepth: number = 1
): RetrievedMemory[] => {
  const allNodes = lattices.flat();
  if (allNodes.length === 0) return [];

  // --- PHASE 1: DIRECT SEARCH ---
  let nodeScores = allNodes.map(node => {
    let score = 0;

    // A. Vector Similarity (Bottom Face)
    const nodeVec = registry[node.faces[FaceType.BOTTOM]] as number[];
    // Ensure we have a valid vector
    if (nodeVec && Array.isArray(nodeVec) && nodeVec.length === queryEmbedding.length) {
       const vectorScore = cosineSimilarity(queryEmbedding, nodeVec);
       score += vectorScore * 0.6; // 60% weight on semantic meaning
    }

    // B. Keyword Match (Front/Back Faces - I/O)
    const inputContent = registry[node.faces[FaceType.FRONT]] as string;
    const outputContent = registry[node.faces[FaceType.BACK]] as string;
    const keywordScore = Math.max(
      calculateKeywordScore(inputContent, queryText),
      calculateKeywordScore(outputContent, queryText)
    );
    score += keywordScore * 0.2; // 20% weight on literal keywords

    return { node, score };
  });

  // --- PHASE 2: QUANTUM ENTANGLEMENT (Tag Resonance) ---
  // Identify "Attractor Tags" from the top scoring nodes
  const topDirectNodes = [...nodeScores].sort((a, b) => b.score - a.score).slice(0, 5);
  const attractorTags = new Set<string>();
  
  topDirectNodes.forEach(item => {
    const tagString = registry[item.node.faces[FaceType.LEFT]] as string;
    if (tagString) {
      tagString.split(',').forEach(t => attractorTags.add(t.trim()));
    }
  });

  if (attractorTags.size > 0) {
    nodeScores = nodeScores.map(item => {
       const tagString = registry[item.node.faces[FaceType.LEFT]] as string;
       if (!tagString) return item;

       const nodeTags = tagString.split(',').map(t => t.trim());
       // Calculate overlap with Attractor Tags
       const intersection = nodeTags.filter(t => attractorTags.has(t));
       
       // Resonance Boost:
       // If a node shares tags with the "Best Matches", it gets a score boost.
       // This allows finding memories that are thematically linked but vectorially distant.
       const resonance = (intersection.length / Math.max(1, attractorTags.size)) * 0.3; // Up to 30% boost
       
       return { ...item, score: item.score + resonance };
    });
  }

  // --- PHASE 3: RANKING & FORMATTING ---
  // Filter out zero scores
  const ranked = nodeScores.filter(n => n.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);

  return ranked.map(item => {
    const summary = registry[item.node.faces[FaceType.TOP]] as string;
    const tagString = registry[item.node.faces[FaceType.LEFT]] as string;
    return {
      node: item.node,
      relevance: item.score,
      summary: summary || "Memory Node",
      tags: tagString ? tagString.split(', ') : []
    };
  });
};
