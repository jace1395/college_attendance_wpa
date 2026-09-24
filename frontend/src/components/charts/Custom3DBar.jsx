import React from 'react';

const Custom3DBar = (props) => {
  const { x, y, width, height, fill } = props;
  
  if (height === undefined || height <= 0) return null;

  // Depth of the 3D effect
  const depth = 10;
  
  // Front Face
  const pathFront = `
    M ${x},${y}
    L ${x + width},${y}
    L ${x + width},${y + height}
    L ${x},${y + height}
    Z
  `;
  
  // Top Face (skewed)
  const pathTop = `
    M ${x},${y}
    L ${x + depth},${y - depth}
    L ${x + width + depth},${y - depth}
    L ${x + width},${y}
    Z
  `;
  
  // Side Face (skewed)
  const pathSide = `
    M ${x + width},${y}
    L ${x + width + depth},${y - depth}
    L ${x + width + depth},${y + height - depth}
    L ${x + width},${y + height}
    Z
  `;

  return (
    <g>
      {/* Top Face - Lighter Shade */}
      <path d={pathTop} fill={fill} opacity={0.8} />
      {/* Side Face - Darker Shade */}
      <path d={pathSide} fill={fill} opacity={0.5} />
      {/* Front Face */}
      <path d={pathFront} fill={fill} />
    </g>
  );
};

export default Custom3DBar;
