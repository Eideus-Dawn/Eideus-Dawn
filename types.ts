
export interface Slot {
  id: string;
  name: string;
  description: string;
  active: boolean;
  associatedWith?: string; // Name of the NPC this slot is narratively linked to
}

export interface Modifier {
  id: string;
  name: string; // The Name of the Modifier (e.g., "Grom the Orc" or "Geopolitics")
  type: string; // "NPC", "Theme", "Faction", etc.
  description: string;
  slots: Slot[]; // The 7 items under this modifier
  score?: number; // For Identity NPCs (Relationship Score)
}

export interface Transform {
  id: string;
  name: string;
  description: string;
  modifiers: Modifier[]; // The 3 modifiers
}

// --- MEMORY SYSTEM TYPES ---

export enum FaceType {
  FRONT = 'FRONT',   // Input Hash
  BACK = 'BACK',     // Output Hash
  TOP = 'TOP',       // Scene Summary
  BOTTOM = 'BOTTOM', // Vector/Embedding
  LEFT = 'LEFT',     // Tags
  RIGHT = 'RIGHT'    // Names
}

export interface MemoryNode {
  x: number;
  y: number;
  z: number;
  latticeIndex: number;
  timestamp: number;
  faces: Record<FaceType, string>; // Stores hashes pointing to registry
}

export interface ContentRegistry {
  [hash: string]: any; // Maps hash -> actual content (string, number[], etc.)
}

export interface EngineState {
  identity: Transform;
  world: Transform;
  story: Transform;
  player: {
    name: string | null;
    status: string;
  };
  tavernNPCs: { name: string; relationship: number; description: string }[];
  npcArchive: Record<string, Slot[]>; // Stores slots of NPCs who have left the active Identity party
  
  // Memory Store
  memoryLattices: MemoryNode[][]; // Pages of 343 nodes (7x7x7)
  memoryRegistry: ContentRegistry;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}
