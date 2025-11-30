import React from 'react';
import { Transform, Modifier, Slot } from '../types';

interface TransformColumnProps {
  transform: Transform;
  colorTheme: 'green' | 'yellow' | 'red';
}

const TransformColumn: React.FC<TransformColumnProps> = ({ transform, colorTheme }) => {
  
  const getGlowText = () => {
    switch(colorTheme) {
      case 'green': return 'text-green-400 glow-text-green';
      case 'yellow': return 'text-yellow-400 glow-text-yellow';
      case 'red': return 'text-red-400 glow-text-red';
    }
  };

  const getBorderColor = () => {
    switch(colorTheme) {
      case 'green': return 'border-green-500/30';
      case 'yellow': return 'border-yellow-500/30';
      case 'red': return 'border-red-500/30';
    }
  };

   const getBgGlow = () => {
    switch(colorTheme) {
      case 'green': return 'bg-green-500/5';
      case 'yellow': return 'bg-yellow-500/5';
      case 'red': return 'bg-red-500/5';
    }
  };

  return (
    <div className={`flex flex-col h-full p-4 w-full ${getBgGlow()}`}>
      {/* Header */}
      <div className="mb-4 text-center border-b border-white/10 pb-2">
        <h2 className={`text-xl font-bold uppercase tracking-widest ${getGlowText()}`}>
          {transform.name}
        </h2>
        <p className="text-xs text-gray-500 uppercase">{transform.description}</p>
      </div>

      {/* Modifiers Container (The "3" in 1x3x7) */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        {transform.modifiers.map((mod, modIndex) => (
          <div key={mod.id} className={`bg-eid-panel border ${getBorderColor()} rounded-lg p-3 relative`}>
             {/* Modifier Header */}
            <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-black border ${getBorderColor()} ${getGlowText()}`}>
                    {modIndex + 1}
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${getGlowText()}`}>{mod.name}</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{mod.type}</p>
                  </div>
               </div>
               {mod.score !== undefined && (
                 <div className="text-xs font-mono text-gray-400">
                   REL: <span className={mod.score > 50 ? 'text-green-400' : 'text-gray-500'}>{mod.score}%</span>
                 </div>
               )}
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 mb-3 italic leading-tight">{mod.description}</p>

            {/* Slots (The "7" in 1x3x7) */}
            <div className="grid grid-cols-1 gap-1.5">
              {mod.slots.map((slot, slotIndex) => (
                <div 
                  key={slot.id} 
                  className={`
                    relative group flex items-center gap-2 p-1.5 rounded 
                    transition-all duration-300
                    ${slot.active ? `bg-white/5 border-l-2 ${getBorderColor()}` : 'opacity-40 hover:opacity-70'}
                  `}
                >
                  <div className="text-[9px] font-mono text-gray-600 w-3">{slotIndex + 1}</div>
                  <div className="flex-1 overflow-hidden">
                    <div className={`text-xs font-medium truncate ${slot.active ? 'text-gray-200' : 'text-gray-600'}`}>
                      {slot.name}
                    </div>
                  </div>
                  
                  {/* Tooltip for Slot Description */}
                  {slot.active && (
                    <div className="absolute z-50 left-0 bottom-full mb-1 hidden group-hover:block w-full bg-black border border-gray-700 p-2 text-xs text-gray-300 rounded shadow-xl pointer-events-none">
                       {slot.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransformColumn;