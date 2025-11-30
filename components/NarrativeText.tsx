import React from 'react';

interface NarrativeTextProps {
  text: string;
}

const NarrativeText: React.FC<NarrativeTextProps> = ({ text }) => {
  // 1. Split text into paragraphs based on double newlines
  const paragraphs = text.split(/\n\s*\n/);

  return (
    <div className="space-y-4 font-serif">
      {paragraphs.map((para, i) => (
        // NARRATIVE: Default styling (Soft Cyan)
        <p key={i} className="leading-relaxed text-cyan-200/90 text-base">
          {/* 
            Regex Logic:
            ("[^"]+") captures text in double quotes (Speech)
            (\*\*[^*]+\*\*) captures text in double asterisks (Locations/Key Items)
            
            We split by these groups so we can map over them and apply styles.
          */}
          {para.split(/("[^"]+"|\*\*[^*]+\*\*)/g).map((part, j) => {
            if (part.startsWith('"') && part.endsWith('"')) {
              // SPEECH: Bright Green
              return (
                <span key={j} className="text-emerald-400 font-sans font-medium">
                  {part}
                </span>
              );
            } else if (part.startsWith('**') && part.endsWith('**')) {
              // LOCATIONS/KEY ITEMS: Bright Yellow
              return (
                <span key={j} className="text-yellow-400 font-bold tracking-wide">
                  {part.slice(2, -2)}
                </span>
              );
            } else {
              // Standard Narrative Text
              return <span key={j}>{part}</span>;
            }
          })}
        </p>
      ))}
    </div>
  );
};

export default NarrativeText;