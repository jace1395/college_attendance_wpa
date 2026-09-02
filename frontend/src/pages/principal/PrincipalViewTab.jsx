import React, { useState } from 'react';

const PrincipalViewTab = ({ streams }) => {
  const [selectedStream, setSelectedStream] = useState(streams?.[0] || 'BCA');

  const streamData = {
    BCA: [
      { year: 'FY', present: 120, absent: 10, total: 130 },
      { year: 'SY', present: 115, absent: 15, total: 130 },
      { year: 'TY', present: 110, absent: 20, total: 130 },
    ],
    BCom: [
      { year: 'FY', present: 180, absent: 20, total: 200 },
      { year: 'SY', present: 190, absent: 10, total: 200 },
      { year: 'TY', present: 175, absent: 25, total: 200 },
    ],
  };

  const data = streamData[selectedStream] || streamData['BCA'];

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h3 className="text-2xl font-semibold">Stream Breakdown</h3>
        <select 
          value={selectedStream}
          onChange={(e) => setSelectedStream(e.target.value)}
          className="bg-slate-900/50 text-white rounded-xl px-4 py-2 border border-white/10 outline-none focus:border-purple-500"
        >
          {streams?.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.map((item, idx) => {
          const percent = ((item.present / item.total) * 100).toFixed(1);
          return (
            <div key={idx} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
              <h4 className="text-2xl font-bold mb-4 relative z-10">{item.year} {selectedStream}</h4>
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-white/60">Total Students</span>
                  <span className="font-bold text-lg">{item.total}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-white/60">Present</span>
                  <span className="font-bold text-lg text-green-400">{item.present}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-white/60">Absent</span>
                  <span className="font-bold text-lg text-red-400">{item.absent}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-white/60">Attendance %</span>
                  <span className={`font-bold text-2xl ${percent >= 75 ? 'text-green-400' : 'text-red-400'}`}>{percent}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrincipalViewTab;
