import React from 'react';
import { Sector } from 'recharts';

const Custom3DPie = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  // Adding a drop shadow offset for the 3D effect
  const depth = 8;
  const shadowY = depth;

  return (
    <g>
      {/* Shadow / Depth Layer */}
      <Sector
        cx={cx}
        cy={cy + shadowY}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
      {/* Top Layer */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export default Custom3DPie;
