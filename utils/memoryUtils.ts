
// Hashing function for content addressing
export const generateHash = (content: any): string => {
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; 
  }
  return `0x${Math.abs(hash).toString(16)}-${str.length}`;
};

// Cosine Similarity for Vector Search
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Map a linear count to 3D grid coordinates (7x7x7)
export const getNextCoordinate = (currentCount: number): {x: number, y: number, z: number} => {
  // A Lattice is 7x7x7 = 343 nodes
  // Indices 0-6
  const z = Math.floor(currentCount / 49);
  const remainderZ = currentCount % 49;
  const y = Math.floor(remainderZ / 7);
  const x = remainderZ % 7;
  return { x, y, z };
};

// Jaccard Index for Tag Overlap (Associative Resonance)
export const calculateJaccardIndex = (tagsA: string[], tagsB: string[]): number => {
  if (!tagsA.length || !tagsB.length) return 0;
  
  const setA = new Set(tagsA.map(t => t.toLowerCase().trim()));
  const setB = new Set(tagsB.map(t => t.toLowerCase().trim()));
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return intersection.size / union.size;
};

// Simple keyword matching score
export const calculateKeywordScore = (text: string, query: string): number => {
  if (!text || !query) return 0;
  const normText = text.toLowerCase();
  const normQuery = query.toLowerCase();
  if (normText.includes(normQuery)) return 1.0;
  
  const queryWords = normQuery.split(' ').filter(w => w.length > 3);
  if (queryWords.length === 0) return 0;

  let matches = 0;
  queryWords.forEach(word => {
    if (normText.includes(word)) matches++;
  });

  return matches / queryWords.length;
};
