import React from 'react';

interface WatermarkProps {
  text?: string;
  opacity?: number;
  color?: string;
}

export function Watermark({ 
  text = "GeoExplorer", 
  opacity = 0.05,
  color = "#000000" 
}: WatermarkProps) {
  const width = 300;
  const height = 300;
  
  // SVG pattern for better performance and crisp rendering
  const svgString = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .text {
          fill: ${color};
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 24px;
          font-weight: 800;
          text-transform: uppercase;
        }
      </style>
      <text 
        x="50%" 
        y="50%" 
        class="text"
        transform="rotate(-45 ${width/2} ${height/2})" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        ${text}
      </text>
    </svg>
  `;

  const encodedSvg = encodeURIComponent(svgString);
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
      style={{
        backgroundImage: `url("${dataUri}")`,
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
        opacity: opacity,
      }}
    />
  );
}
