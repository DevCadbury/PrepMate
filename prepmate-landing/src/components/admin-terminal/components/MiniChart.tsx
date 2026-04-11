import React from 'react';

interface MiniChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: string | number;
}

export const MiniChart: React.FC<MiniChartProps> = ({ 
  data, 
  color = 'var(--admin-primary)', 
  height = 40,
  width = '100%' 
}) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Normalize data points to 0-100 for SVG path
  const normalizedData = data.map(d => ((d - min) / range) * 100);
  
  // Generate SVG path for a line chart
  const pathData = normalizedData.map((val, idx) => {
    const x = (idx / (normalizedData.length - 1)) * 100;
    const y = 100 - val; // Invert y since SVG 0,0 is top-left
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate path for area fill (straight to bottom corners)
  const fillPathData = `${pathData} L 100 100 L 0 100 Z`;

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 -5 100 110" 
      preserveAspectRatio="none"
      className="overflow-visible inline-block"
    >
      <defs>
        <linearGradient id={`gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <path 
        d={fillPathData} 
        fill={`url(#gradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`} 
        stroke="none" 
      />
      
      {/* Line */}
      <path 
        d={pathData} 
        fill="none" 
        stroke={color} 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
