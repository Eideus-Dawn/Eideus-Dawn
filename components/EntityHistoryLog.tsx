import React from 'react';
import { ChatMessage } from '../types';
import NarrativeText from './NarrativeText';

interface EntityHistoryLogProps {
  entityName: string;
  entityType: 'npc' | 'location';
  messages: ChatMessage[];
  onBack: () => void;
}

const EntityHistoryLog: React.FC<EntityHistoryLogProps> = ({ entityName, entityType, messages, onBack }) => {
  // Filter messages that contain the entity name (case-insensitive)
  const relevantMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(entityName.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-eid-panel/50">
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/20">
        <button 
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{entityName}</h3>
          <span className="text-[10px] text-gray-500 uppercase">{entityType === 'npc' ? 'Sub-Network Entity' : 'Geographic Node'}</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {relevantMessages.length === 0 ? (
          <div className="text-gray-500 text-xs italic text-center mt-10">
            No specific historical records found for this entity yet.
          </div>
        ) : (
          relevantMessages.map((msg, idx) => (
            <div key={idx} className="relative pl-4 border-l border-white/10">
              <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-eid-accent border border-white/20"></div>
              <div className="text-[10px] text-gray-500 mb-1 font-mono">
                T-{Math.floor((Date.now() - msg.timestamp) / 1000)}s
              </div>
              <div className="text-sm">
                {/* Use the same formatted text component for rich styling */}
                <NarrativeText text={msg.content} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EntityHistoryLog;
