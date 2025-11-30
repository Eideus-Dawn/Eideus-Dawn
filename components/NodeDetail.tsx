
import React from 'react';
import { FaceType, MemoryNode, ContentRegistry } from '../types';

interface NodeDetailProps {
  node: MemoryNode | null;
  registry: ContentRegistry;
  onClose: () => void;
}

export const NodeDetail: React.FC<NodeDetailProps> = ({ node, registry, onClose }) => {
  if (!node) return null;

  const resolve = (face: FaceType) => {
    const key = node.faces[face];
    const data = registry[key];
    
    if (face === FaceType.BOTTOM) {
        return "Vector[768]"; // Don't show raw float array
    }
    return data;
  };

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-eid-panel border-l border-white/10 p-6 shadow-2xl z-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
        <h3 className="text-id-glow font-bold text-lg tracking-widest font-mono">NODE_{node.x}{node.y}{node.z}</h3>
        <button onClick={onClose} className="text-red-400 hover:text-red-300 font-mono">[CLOSE]</button>
      </div>

      <div className="space-y-6 font-mono text-sm">
        {Object.values(FaceType).map((face) => (
          <div key={face} className="group">
            <h4 className="text-xs uppercase text-gray-500 mb-1 flex items-center gap-2">
              <span className={`w-2 h-2 inline-block rounded-full ${
                face === FaceType.FRONT ? 'bg-green-500' :
                face === FaceType.BACK ? 'bg-blue-500' :
                'bg-purple-500'
              }`}></span>
              {face} Face
              <span className="ml-auto text-[10px] opacity-30">{node.faces[face].substring(0, 8)}...</span>
            </h4>
            <div className="p-3 bg-black/40 border border-white/5 rounded text-gray-300 break-words group-hover:border-id-glow/30 transition-colors">
              {resolve(face) || <span className="italic text-gray-600">Null</span>}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-[10px] text-gray-600 text-center font-mono">
          HASH_ID: {node.faces[FaceType.FRONT].substring(0,16)}
      </div>
    </div>
  );
};
