
import React, { useRef, useEffect, useState } from 'react';
import { MindMapData } from '../types';

interface MindMapProps {
  data: MindMapData;
}

export const MindMap: React.ReactElement | null = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<React.ReactElement[]>([]);

  // Calculate layout on load
  useEffect(() => {
    if (!data || !data.nodes || !containerRef.current) return;

    // Use a fixed size for the "paper" to ensure consistent positioning logic
    const centerX = 500;
    const centerY = 400;
    const radius = 280; // Distance of nodes from center

    const calculatedLines: React.ReactElement[] = [];
    const nodes = data.nodes || [];
    const nodeCount = nodes.length;
    if (nodeCount === 0) return;
    
    const angleStep = (2 * Math.PI) / nodeCount;

    nodes.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top (-90deg)
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      // Control point for curve (midpoint but slightly pushed out)
      const cpX = centerX + (radius * 0.5) * Math.cos(angle + 0.2); 
      const cpY = centerY + (radius * 0.5) * Math.sin(angle + 0.2);

      // Create a curved path
      const pathData = `M ${centerX} ${centerY} Q ${cpX} ${cpY} ${x} ${y}`;
      
      // Assign a color based on index
      const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];
      const color = colors[index % colors.length];

      calculatedLines.push(
        <path 
          key={index}
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="6" // Thicker lines
          strokeLinecap="round"
          strokeDasharray="12 6" // Dashed line for "stitch" look
          className="animate-draw opacity-60"
        />
      );
    });

    setLines(calculatedLines);
  }, [data]);

  const downloadPoster = () => {
    alert("Pro Tip: Use your browser's 'Print' feature (Ctrl+P) and select 'Save as PDF' to save this high-quality poster!");
  };

  if (!data || !data.nodes) return null;

  // Layout Constants
  const centerX = 500;
  const centerY = 400;
  const radius = 280;
  const nodes = data.nodes || [];
  const angleStep = (2 * Math.PI) / (nodes.length || 1);
  
  // Style Palette
  const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      {/* Controls */}
      <div className="mb-4 flex gap-3">
        <button 
          onClick={downloadPoster}
          className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2 animate-pulse"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Save Poster
        </button>
      </div>

      {/* Styled Responsive Container - Automatically adjusts layout height below on smaller screens */}
      <div 
        className="w-full flex justify-center overflow-hidden" 
        style={{ height: 'calc(800px * var(--scale, 1))' }}
      >
        {/* Canvas Area */}
        <div 
          className="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden border-8 border-white ring-4 ring-indigo-50 shrink-0"
          style={{ 
            width: '1000px', 
            height: '800px',
            transform: 'scale(var(--scale, 1))',
            transformOrigin: 'top center',
          }}
          ref={containerRef}
        >
          {/* Responsive CSS Variables */}
          <style>{`
            :root {
              --scale: 1;
            }
            @media (max-width: 1024px) {
              :root { --scale: 0.8; }
            }
            @media (max-width: 768px) {
              :root { --scale: 0.58; }
            }
            @media (max-width: 640px) {
              :root { --scale: 0.48; }
            }
            @media (max-width: 480px) {
              :root { --scale: 0.35; }
            }
            @media (max-width: 380px) {
              :root { --scale: 0.29; }
            }
          `}</style>

        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }}>
        </div>

        {/* SVG Layer for Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {lines}
        </svg>

        {/* --- Central Node (Updated with Emoji) --- */}
        <div 
          className="absolute z-20 flex flex-col items-center justify-center text-center bg-white border-8 border-indigo-200 rounded-full shadow-2xl overflow-hidden"
          style={{
            left: centerX,
            top: centerY,
            width: '280px',
            height: '280px',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="relative z-10 flex flex-col items-center justify-center p-4">
            <div className="w-32 h-32 mb-2 flex items-center justify-center text-[8rem] leading-none drop-shadow-sm select-none">
               {data.center?.emoji || '🌟'}
            </div>
            <h1 className="text-3xl font-black text-slate-800 font-display leading-none px-2 uppercase break-words w-full drop-shadow-sm">
              {data.center?.title_en || 'Topic'}
            </h1>
            <p className="text-xl font-bold text-indigo-500 font-sans mt-1">
              {data.center?.title_vi || 'Chủ đề'}
            </p>
          </div>
        </div>

        {/* --- Child Nodes --- */}
        {nodes.map((node, index) => {
           const angle = index * angleStep - Math.PI / 2;
           const x = centerX + radius * Math.cos(angle);
           const y = centerY + radius * Math.sin(angle);
           const color = colors[index % colors.length];

           return (
             <div
                key={index}
                className="absolute z-10 flex flex-col items-center bg-white p-3 rounded-2xl shadow-lg border-4 transition-transform hover:scale-110 hover:z-30 duration-300"
                style={{
                  left: x,
                  top: y,
                  width: '180px',
                  borderColor: color,
                  transform: 'translate(-50%, -50%)'
                }}
             >
                {/* Emoji Container */}
                <div className="w-24 h-24 mb-2 bg-slate-50 rounded-full border-2 border-slate-100 flex items-center justify-center">
                   <span className="text-6xl select-none leading-none drop-shadow-sm">{node.emoji}</span>
                </div>

                {/* Text Label */}
                <div className="text-center w-full bg-slate-50 rounded-lg py-1 px-2">
                   <div className="text-xl font-black text-slate-800 leading-tight capitalize">
                      {node.text_en}
                   </div>
                   <div className="text-sm font-bold opacity-70" style={{ color: color }}>
                      {node.text_vi}
                   </div>
                </div>

                {/* Number Badge */}
                <div 
                  className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  {index + 1}
                </div>
             </div>
           );
        })}
        
        {/* Footer Credit */}
        <div className="absolute bottom-4 right-6 text-slate-300 font-bold text-sm uppercase tracking-widest">
           Kids Mindmap Maker • A1 Level
        </div>
      </div>
    </div>
  </div>
  );
};
