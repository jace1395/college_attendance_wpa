import React from 'react';

const RankedBarList = ({ data = [], threshold = 75 }) => {
  // Sort data ascending (lowest first, which need attention)
  const sortedData = [...data].sort((a, b) => a.value - b.value);

  return (
    <div className="w-full space-y-4">
      {sortedData.map((item, idx) => {
        const isBelowThreshold = item.value < threshold;
        return (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-white/80">{item.name}</span>
              <span className={isBelowThreshold ? 'text-red-400' : 'text-green-400'}>
                {item.value}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${isBelowThreshold ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(item.value, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RankedBarList;
