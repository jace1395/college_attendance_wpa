import React from 'react';

const DefaulterHeatmap = ({ data = null }) => {
  if (!data || !data.streams || !data.years || !data.data) {
    return <div className="text-white/60 text-sm">No data available</div>;
  }

  // Get min/max to normalize colors for heatmap
  const allValues = data.data.flat();
  const max = Math.max(...allValues);

  const getHeatmapColor = (val) => {
    // We'll use a red scale since it's "defaulters" (higher = worse/more red)
    if (val === 0) return 'bg-slate-800';
    const intensity = Math.max(0.1, val / max); // 0.1 to 1.0
    // Return inline style with opacity
    return `rgba(239, 68, 68, ${intensity})`; // Tailwind red-500 equivalent
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 border border-slate-700 bg-slate-800 text-slate-300 font-medium text-sm text-left">
              Stream / Year
            </th>
            {data.years.map((year, idx) => (
              <th key={idx} className="p-2 border border-slate-700 bg-slate-800 text-slate-300 font-medium text-sm text-center">
                {year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.streams.map((stream, rIdx) => (
            <tr key={rIdx}>
              <td className="p-2 border border-slate-700 bg-slate-800 text-slate-300 font-medium text-sm">
                {stream}
              </td>
              {data.data[rIdx].map((val, cIdx) => (
                <td 
                  key={cIdx} 
                  className="p-3 border border-slate-700 text-center font-bold text-white transition-colors hover:ring-2 ring-white/20 cursor-pointer"
                  style={{ backgroundColor: getHeatmapColor(val) }}
                  title={`${val} Defaulters`}
                >
                  {val > 0 ? val : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DefaulterHeatmap;
