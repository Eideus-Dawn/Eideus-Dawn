
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Transform } from '../types';

interface NPC {
  name: string;
  relationship: number;
}

interface Props {
  npcs: NPC[];
  identityTransform: Transform;
  worldTransform: Transform;
  onSelectLeaf: (name: string, type: 'npc' | 'location') => void;
}

type ViewMode = 'overview' | 'detail';

const RelationshipGraph: React.FC<Props> = ({ npcs, identityTransform, worldTransform, onSelectLeaf }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [focusedNPC, setFocusedNPC] = useState<string | null>(null);

  // Resize Handler with ResizeObserver
  useEffect(() => {
    if (!wrapperRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(wrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleReset = () => {
    setViewMode('overview');
    setFocusedNPC(null);
  };

  // Reset view if data changes significantly (e.g. New Game)
  useEffect(() => {
     if (npcs.length === 0) handleReset();
  }, [npcs]);

  // D3 Render Logic
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const width = dimensions.width;
    const height = dimensions.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const minDim = Math.min(width, height);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear canvas

    // --- DEFS (Gradients/Filters) ---
    const defs = svg.append("defs");
    const glowFilter = defs.append("filter").attr("id", "glow");
    glowFilter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Background Click -> Reset
    svg.append("rect")
       .attr("width", width)
       .attr("height", height)
       .attr("fill", "transparent")
       .on("click", handleReset);

    // =================================================================================
    // MODE: OVERVIEW (Orbit)
    // =================================================================================
    if (viewMode === 'overview') {
      const radius = minDim / 2 - 50;

      // Player Node
      const playerGroup = svg.append('g')
        .attr('transform', `translate(${centerX}, ${centerY})`);
      
      playerGroup.append('circle')
        .attr('r', 20)
        .attr('fill', '#fff')
        .attr('filter', 'url(#glow)');
      
      playerGroup.append('text')
        .attr('y', 35)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '10px')
        .text('YOU');

      // NPCs
      if (npcs.length > 0) {
        const angleStep = (2 * Math.PI) / npcs.length;
        npcs.forEach((npc, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          // Link
          svg.append('line')
            .attr('x1', centerX)
            .attr('y1', centerY)
            .attr('x2', x)
            .attr('y2', y)
            .attr('stroke', '#4ade80')
            .attr('stroke-width', Math.max(1, npc.relationship / 10))
            .attr('opacity', Math.max(0.2, npc.relationship / 100));

          const nodeGroup = svg.append('g')
            .attr('transform', `translate(${x}, ${y})`)
            .style('cursor', 'pointer')
            .on('click', (e) => {
              e.stopPropagation();
              setFocusedNPC(npc.name);
              setViewMode('detail');
            });

          nodeGroup.append('circle')
            .attr('r', 8 + (npc.relationship / 10))
            .attr('fill', '#1e293b')
            .attr('stroke', '#4ade80')
            .attr('stroke-width', 2);

          nodeGroup.append('text')
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')
            .text(npc.name.split(' ')[0]);

          nodeGroup.append('text')
            .attr('y', -15)
            .attr('text-anchor', 'middle')
            .attr('fill', '#4ade80')
            .attr('font-size', '9px')
            .text(`${npc.relationship}%`);
        });
      } else {
        // Empty State Placeholder
        svg.append('text')
          .attr('x', centerX)
          .attr('y', centerY + 60)
          .attr('text-anchor', 'middle')
          .attr('fill', '#555')
          .attr('font-size', '12px')
          .text('Waiting for Connections...');
      }
    }

    // =================================================================================
    // MODE: DETAIL (Radial Fan Layout)
    // =================================================================================
    if (viewMode === 'detail' && focusedNPC) {
      // 1. Identify Data
      const npcData = npcs.find(n => n.name === focusedNPC);
      // Try to find matching Modifier in Identity Transform to get Child Slots
      const modifier = identityTransform.modifiers.find(
        m => m.name.toLowerCase() === focusedNPC?.toLowerCase() || 
             m.name.toLowerCase().includes(focusedNPC?.toLowerCase() || "___")
      );
      
      // Get active child NPCs (from Identity)
      const childNodes = modifier ? modifier.slots.filter(s => s.active || s.name !== "Empty") : [];
      
      // Get locations (from World -> Local Geography)
      const rawLocationNodes = worldTransform.modifiers[2]?.slots || [];
      const locationNodes = rawLocationNodes.filter(s => {
         const isActive = s.active || s.name !== "Empty";
         const isAssociated = s.associatedWith && focusedNPC && s.associatedWith.toLowerCase().includes(focusedNPC.toLowerCase());
         return isActive && isAssociated;
      });

      const detailRadius = minDim * 0.35; // Responsive radius for the fan

      // 2. Render Center Node (The Focused NPC)
      const centerGroup = svg.append('g')
        .attr('transform', `translate(${centerX}, ${centerY})`)
        .style('cursor', 'pointer')
        .on('click', handleReset); // Click center to go back

      centerGroup.append('circle')
        .attr('r', 30)
        .attr('fill', '#4ade80')
        .attr('filter', 'url(#glow)')
        .attr('opacity', 0.8);

      centerGroup.append('text')
        .attr('y', 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .attr('font-weight', 'bold')
        .attr('font-size', '10px')
        .text(focusedNPC?.split(' ')[0]);
      
      centerGroup.append('text')
        .attr('y', 45)
        .attr('text-anchor', 'middle')
        .attr('fill', '#4ade80')
        .attr('font-size', '10px')
        .text('RETURN');

      // Helper function to calculate fan positions
      // startAngle in degrees, sweep in degrees
      const getFanPositions = (count: number, startAngle: number, sweep: number) => {
        if (count === 0) return [];
        if (count === 1) return [startAngle + sweep / 2];
        const step = sweep / (count - 1);
        return Array.from({ length: count }, (_, i) => startAngle + (i * step));
      };

      // 3. Render Right Cluster (Child NPCs) - Arc from -30 to +30 degrees (East)
      if (childNodes.length > 0) {
        const angles = getFanPositions(childNodes.length, -45, 90); // 90 degree sweep
        
        childNodes.forEach((child, i) => {
          const angleRad = (angles[i] * Math.PI) / 180;
          const x = centerX + Math.cos(angleRad) * detailRadius;
          const y = centerY + Math.sin(angleRad) * detailRadius;

          // Link
          svg.append('line')
            .attr('x1', centerX + 25)
            .attr('y1', centerY)
            .attr('x2', x)
            .attr('y2', y)
            .attr('stroke', '#4ade80')
            .attr('stroke-width', 1)
            .attr('opacity', 0.5)
            .attr('stroke-dasharray', '4');

          const node = svg.append('g')
            .attr('transform', `translate(${x}, ${y})`)
            .style('cursor', 'pointer')
            .on('click', (e) => {
               e.stopPropagation();
               onSelectLeaf(child.name, 'npc');
            });

          node.append('circle')
            .attr('r', 6)
            .attr('fill', '#000')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);

          // Text anchored left for right-side nodes
          node.append('text')
            .attr('x', 10)
            .attr('y', 3)
            .attr('text-anchor', 'start')
            .attr('fill', '#ddd')
            .attr('font-size', '10px')
            .text(child.name);
        });
        
        // Label for Cluster (East)
        svg.append('text')
           .attr('x', centerX + detailRadius + 40)
           .attr('y', centerY)
           .attr('text-anchor', 'middle')
           .attr('fill', '#4ade80')
           .attr('font-size', '9px')
           .attr('text-transform', 'uppercase')
           .attr('transform', `rotate(90, ${centerX + detailRadius + 40}, ${centerY})`)
           .text('Surfaced Ties');
      }

      // 4. Render Left Cluster (Locations) - Arc from 150 to 210 degrees (West)
      if (locationNodes.length > 0) {
        const angles = getFanPositions(locationNodes.length, 135, 90); // 135 to 225

        locationNodes.forEach((loc, i) => {
          const angleRad = (angles[i] * Math.PI) / 180;
          const x = centerX + Math.cos(angleRad) * detailRadius;
          const y = centerY + Math.sin(angleRad) * detailRadius;

           // Link
           svg.append('line')
           .attr('x1', centerX - 25)
           .attr('y1', centerY)
           .attr('x2', x)
           .attr('y2', y)
           .attr('stroke', '#facc15') // Yellow for World
           .attr('stroke-width', 1)
           .attr('opacity', 0.5);

          const node = svg.append('g')
            .attr('transform', `translate(${x}, ${y})`)
            .style('cursor', 'pointer')
             .on('click', (e) => {
               e.stopPropagation();
               onSelectLeaf(loc.name, 'location');
            });

          node.append('rect')
            .attr('x', -6)
            .attr('y', -6)
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', '#000')
            .attr('stroke', '#facc15')
            .attr('stroke-width', 1);

          // Text anchored right for left-side nodes
          node.append('text')
            .attr('x', -10)
            .attr('y', 3)
            .attr('text-anchor', 'end')
            .attr('fill', '#ddd')
            .attr('font-size', '10px')
            .text(loc.name);
        });

         // Label for Cluster (West)
         svg.append('text')
         .attr('x', centerX - detailRadius - 40)
         .attr('y', centerY)
         .attr('text-anchor', 'middle')
         .attr('fill', '#facc15')
         .attr('font-size', '9px')
         .attr('text-transform', 'uppercase')
         .attr('transform', `rotate(-90, ${centerX - detailRadius - 40}, ${centerY})`)
         .text('Affected Areas');
      } else if (childNodes.length === 0) {
         // Fallback if empty
         svg.append('text')
         .attr('x', centerX)
         .attr('y', centerY + 60)
         .attr('text-anchor', 'middle')
         .attr('fill', '#555')
         .attr('font-size', '9px')
         .text('No active sub-nodes');
      }
    }

  }, [npcs, dimensions, viewMode, focusedNPC, identityTransform, worldTransform, onSelectLeaf]);

  return (
    <div ref={wrapperRef} className="w-full h-full relative overflow-hidden bg-black/20">
        <div className="absolute top-4 left-4 text-[10px] uppercase text-gray-500 tracking-widest pointer-events-none">
          {viewMode === 'overview' ? 'Macro Relational Web' : 'Micro Interaction Node'}
        </div>
        <svg ref={svgRef} className="w-full h-full block"></svg>
        
        {viewMode === 'detail' && (
           <button 
             onClick={handleReset}
             className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/10 text-white text-xs rounded border border-white/20 hover:bg-white/20"
           >
             Return to Web
           </button>
        )}
    </div>
  );
};

export default RelationshipGraph;
