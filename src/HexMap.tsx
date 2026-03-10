import React from 'react';
import { TERRAIN_COLORS, getNeighbor } from './engine';

export type HexData = {
  q: number;
  r: number;
  terrain: string;
  roads: number[];
  rivers: number[];
  feature: string | null;
  events: string[];
};

interface HexMapProps {
  hexes: Record<string, HexData>;
  partyHex: { q: number; r: number } | null;
  selectedHex: { q: number; r: number } | null;
  onSelectHex: (q: number, r: number) => void;
  onExplore: (dir: number) => void;
}

const HEX_SIZE = 40;

function hexToPixel(q: number, r: number, size: number) {
  const x = size * 1.5 * q;
  const y = size * Math.sqrt(3) * (r + 0.5 * Math.abs(q % 2));
  return { x, y };
}

function getHexPoints(size: number) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_rad = (Math.PI / 180) * (60 * i + 30);
    points.push(`${size * Math.cos(angle_rad)},${size * Math.sin(angle_rad)}`);
  }
  return points.join(" ");
}

function getEdgeMidpoint(edge: number, size: number) {
  const h = size * Math.sqrt(3) / 2;
  const w = size * 0.75;
  switch (edge) {
    case 6: return { x: 0, y: -h };
    case 1: return { x: w, y: -h / 2 };
    case 2: return { x: w, y: h / 2 };
    case 3: return { x: 0, y: h };
    case 4: return { x: -w, y: h / 2 };
    case 5: return { x: -w, y: -h / 2 };
  }
  return { x: 0, y: 0 };
}

export default function HexMap({ hexes, partyHex, selectedHex, onSelectHex, onExplore }: HexMapProps) {
  const getGhostHexes = () => {
    if (!partyHex) return [];
    const ghosts = [];
    for (let i = 1; i <= 6; i++) {
      const n = getNeighbor(partyHex.q, partyHex.r, i);
      const key = `${n.q},${n.r}`;
      if (!hexes[key]) {
        ghosts.push({ ...n, dir: i });
      }
    }
    return ghosts;
  };

  const ghosts = getGhostHexes();
  
  // Calculate viewBox
  const center = partyHex ? hexToPixel(partyHex.q, partyHex.r, HEX_SIZE) : { x: 0, y: 0 };
  const viewBoxSize = 800;
  const viewBox = `${center.x - viewBoxSize / 2} ${center.y - viewBoxSize / 2} ${viewBoxSize} ${viewBoxSize}`;

  return (
    <div className="w-full h-full bg-slate-100 overflow-hidden relative border-r border-slate-300">
      <svg viewBox={viewBox} className="w-full h-full cursor-grab active:cursor-grabbing">
        {/* Render Explored Hexes */}
        {Object.values(hexes).map(h => {
          const { x, y } = hexToPixel(h.q, h.r, HEX_SIZE);
          const isSelected = selectedHex?.q === h.q && selectedHex?.r === h.r;
          const isParty = partyHex?.q === h.q && partyHex?.r === h.r;
          
          return (
            <g 
              key={`${h.q},${h.r}`} 
              transform={`translate(${x},${y})`} 
              onClick={() => onSelectHex(h.q, h.r)}
              className="cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <polygon 
                points={getHexPoints(HEX_SIZE)} 
                fill={TERRAIN_COLORS[h.terrain] || '#ccc'} 
                stroke={isSelected ? "#000" : "#64748b"} 
                strokeWidth={isSelected ? 3 : 1} 
              />
              
              {/* Roads */}
              {h.roads.map(edge => {
                const mid = getEdgeMidpoint(edge, HEX_SIZE);
                return <line key={`road-${edge}`} x1="0" y1="0" x2={mid.x} y2={mid.y} stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
              })}
              
              {/* Rivers */}
              {h.rivers.map(edge => {
                const mid = getEdgeMidpoint(edge, HEX_SIZE);
                return <line key={`river-${edge}`} x1="0" y1="0" x2={mid.x} y2={mid.y} stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
              })}
              
              {/* Feature Marker */}
              {h.feature && (
                <circle cx="0" cy="-10" r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" />
              )}
              
              {/* Coordinates */}
              <text textAnchor="middle" y="15" fontSize="10" fill="#1e293b" fontWeight="bold" className="pointer-events-none select-none">
                {h.q},{h.r}
              </text>

              {/* Party Marker */}
              {isParty && (
                <circle cx="0" cy="0" r="8" fill="#eab308" stroke="#000" strokeWidth="2" className="animate-pulse" />
              )}
            </g>
          );
        })}

        {/* Render Ghost Hexes for Exploration */}
        {ghosts.map(g => {
          const { x, y } = hexToPixel(g.q, g.r, HEX_SIZE);
          return (
            <g 
              key={`ghost-${g.dir}`} 
              transform={`translate(${x},${y})`} 
              onClick={() => onExplore(g.dir)} 
              className="cursor-pointer group"
            >
              <polygon 
                points={getHexPoints(HEX_SIZE)} 
                fill="rgba(255,255,255,0.5)" 
                stroke="#9ca3af" 
                strokeDasharray="4 4" 
                className="group-hover:fill-blue-100 transition-colors" 
              />
              <text textAnchor="middle" y="5" fontSize="12" fill="#6b7280" className="group-hover:fill-blue-800 font-medium pointer-events-none select-none">
                Explore
              </text>
            </g>
          );
        })}
      </svg>
      
      <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow text-sm backdrop-blur-sm">
        <h4 className="font-bold mb-2">Legend</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(TERRAIN_COLORS).map(([name, color]) => (
            <div key={name} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
              <span>{name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-4 h-1 bg-[#78350f]"></div>
            <span>Road</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-4 h-1 bg-[#3b82f6]"></div>
            <span>River</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-4 h-4 rounded-full bg-[#ef4444] border-2 border-white"></div>
            <span>Feature</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-4 h-4 rounded-full bg-[#eab308] border-2 border-black"></div>
            <span>Party</span>
          </div>
        </div>
      </div>
    </div>
  );
}
