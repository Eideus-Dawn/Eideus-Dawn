
import React, { useMemo } from 'react';
import { MemoryNode, ContentRegistry, FaceType } from '../types';
import { NodeDetail } from './NodeDetail';

interface LatticeVisualizerProps {
  lattice: MemoryNode[]; // The currently viewed lattice page
  registry: ContentRegistry;
  pageIndex: number;
  
  // Controlled State
  axis: 'x' | 'y' | 'z';
  sliceIndex: number;
  onSliceChange: (val: number) => void;
  activeFace: FaceType;
}

const LatticeVisualizer: React.FC<LatticeVisualizerProps> = ({ 
  lattice, 
  registry, 
  pageIndex,
  axis,
  sliceIndex,
  onSliceChange,
  activeFace
}) => {
  const [selectedNode, setSelectedNode] = React.useState<MemoryNode | null>(null);
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);

  // Construct the 7x7 grid based on the Slice Axis
  const grid = useMemo(() => {
    const map = new Map<string, MemoryNode>();
    lattice.forEach(node => {
      // Filter by the active slice plane
      let match = false;
      let gridKey = ''; // "col,row"

      switch (axis) {
        case 'z': // Top-Down View: X (col) vs Y (row)
          if (node.z === sliceIndex) {
            match = true;
            gridKey = `${node.x},${node.y}`;
          }
          break;
        case 'y': // Front View: X (col) vs Z (row)
          if (node.y === sliceIndex) {
            match = true;
            gridKey = `${node.x},${node.z}`;
          }
          break;
        case 'x': // Side View: Y (col) vs Z (row)
          if (node.x === sliceIndex) {
            match = true;
            gridKey = `${node.y},${node.z}`;
          }
          break;
      }

      if (match) {
        map.set(gridKey, node);
      }
    });
    return map;
  }, [lattice, axis, sliceIndex]);

  // Helper to resolve the display text based on Active Face
  const getFaceData = (node: MemoryNode) => {
    const key = node.faces[activeFace];
    const data = registry[key];
    
    if (activeFace === FaceType.BOTTOM) return "Vector Data [Hidden]";
    if (Array.isArray(data)) return data.join(", ");
    return data;
  };

  const getFaceLabel = () => {
    switch (activeFace) {
      case FaceType.FRONT: return "INPUT (FRONT)";
      case FaceType.BACK: return "OUTPUT (BACK)";
      case FaceType.TOP: return "SCENE (TOP)";
      case FaceType.BOTTOM: return "VECTOR (BOTTOM)";
      case FaceType.LEFT: return "TAGS (LEFT)";
      case FaceType.RIGHT: return "NAMES (RIGHT)";
      default: return "DATA";
    }
  };

  const renderGridCell = (col: number, row: number) => {
    const node = grid.get(`${col},${row}`);
    const isPopulated = !!node;
    const isHovered = hoveredNode === `${col},${row}`;

    const cellData = node ? getFaceData(node) : '';

    // Dynamic color based on face type
    let accentColor = 'purple';
    if (activeFace === FaceType.FRONT) accentColor = 'green'; // Input
    if (activeFace === FaceType.BACK) accentColor = 'blue';   // Output
    if (activeFace === FaceType.TOP) accentColor = 'yellow';  // Scene
    if (activeFace === FaceType.LEFT) accentColor = 'red';    // Tags
    if (activeFace === FaceType.RIGHT) accentColor = 'cyan';  // Names

    const borderColor = `border-${accentColor}-500/50`;
    const bgColor = `bg-${accentColor}-900/20`;
    const hoverBg = `hover:bg-${accentColor}-500/30`;
    const shadow = `hover:shadow-[0_0_15px_rgba(var(--color-${accentColor}-500),0.5)]`;
    const dotColor = `bg-${accentColor}-400`;

    // Tailwind JIT interpolation limitation workaround:
    // We'll use style objects for dynamic colors to ensure reliability if classes aren't purged correctly
    const dynamicStyle = isPopulated ? {
       borderColor: isPopulated ? `var(--${accentColor}-border, rgba(168,85,247,0.5))` : undefined,
    } : {};

    return (
      <div
        key={`${col}-${row}`}
        onClick={() => node && setSelectedNode(node)}
        onMouseEnter={() => setHoveredNode(`${col},${row}`)}
        onMouseLeave={() => setHoveredNode(null)}
        className={`
          relative aspect-square border transition-all duration-300 cursor-pointer
          flex items-center justify-center
          ${isPopulated 
            ? `${bgColor} ${borderColor} ${hoverBg}` 
            : 'border-white/5 bg-transparent'}
        `}
      >
        {isPopulated && (
          <>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColor}`} style={{backgroundColor: accentColor === 'purple' ? '#c084fc' : undefined}} />
            
            {/* Tooltip */}
            <div className={`
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 
                bg-black/95 border border-white/20 text-[10px] text-white z-20 pointer-events-none
                transition-opacity duration-200 rounded shadow-xl
                ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}>
                <div className="font-bold mb-1 text-xs text-gray-400 font-mono">
                   {/* Show full 3D coords */}
                   NODE [{node?.x},{node?.y},{node?.z}]
                </div>
                <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">{getFaceLabel()}</div>
                <div className="line-clamp-4 text-gray-200 leading-tight">
                    {cellData || "No Data"}
                </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full p-4 relative">
      {/* Header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-xl font-bold tracking-widest text-white">
            LATTICE SCAN
          </h2>
          <p className="text-[10px] text-gray-400 font-mono uppercase">
            PAGE {pageIndex + 1} | AXIS: <span className="text-id-glow">{axis.toUpperCase()}</span> | FACE: <span className="text-white">{activeFace}</span>
          </p>
        </div>
      </div>

      {/* Slice Slider */}
      <div className="mb-4 bg-black/20 p-2 rounded border border-white/5">
        <div className="flex justify-between w-full text-[10px] text-gray-400 font-mono mb-1">
           <span>SLICE LAYER ({axis.toUpperCase()} = {sliceIndex})</span>
        </div>
        <input
          type="range"
          min="0"
          max="6"
          step="1"
          value={sliceIndex}
          onChange={(e) => onSliceChange(parseInt(e.target.value))}
          className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white"
        />
        <div className="flex justify-between w-full text-[10px] text-gray-600 font-mono mt-1">
            <span>0</span><span>6</span>
        </div>
      </div>

      {/* The 7x7 Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-7 gap-1.5 p-3 border border-white/10 rounded-xl bg-black/40 relative">
         {/* Axis Indicators */}
         <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-[9px] text-gray-600 -rotate-90">
            {axis === 'z' ? 'Y-AXIS' : axis === 'y' ? 'Z-AXIS' : 'Z-AXIS'}
         </div>
         <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-gray-600">
            {axis === 'z' ? 'X-AXIS' : axis === 'y' ? 'X-AXIS' : 'Y-AXIS'}
         </div>

         {Array.from({ length: 7 }).map((_, row) => (
            Array.from({ length: 7 }).map((_, col) => renderGridCell(col, row))
         ))}
      </div>
      
      {/* Stats Footer */}
      <div className="mt-6 flex justify-between text-[10px] text-gray-600 font-mono uppercase">
          <span>Active Nodes: {grid.size}</span>
          <span>View: {axis === 'z' ? 'Axial' : axis === 'y' ? 'Coronal' : 'Sagittal'}</span>
      </div>

      {/* Detail Overlay */}
      {selectedNode && (
        <NodeDetail 
            node={selectedNode} 
            registry={registry} 
            onClose={() => setSelectedNode(null)} 
        />
      )}
    </div>
  );
};

export default LatticeVisualizer;
