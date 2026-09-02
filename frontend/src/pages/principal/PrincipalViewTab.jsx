import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS_PRESENT = '#a855f7';
const COLORS_ABSENT  = '#ef4444';

const PrincipalViewTab = ({ streams }) => {
  const [selectedStream, setSelectedStream] = useState(streams?.[0] || 'BCA');
  const [streamData, setStreamData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Deep Dive Modal
  const [detailClass, setDetailClass] = useState(null);
  const [detailData, setDetailData]   = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch stream summary on tab/filter change
  useEffect(() => {
    if (!selectedStream) return;
    const fetchStream = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/principal/stream-view/?stream=${selectedStream}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStreamData(data.classes || []);
      } catch {
        setStreamData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStream();
  }, [selectedStream]);

  // Fetch deep-dive detail for a specific class
  const openDeepDive = async (cls) => {
    setDetailClass(cls);
    setDetailData(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/principal/class-detail/?class_id=${cls.class_id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDetailData(data);
    } catch {
      // Fallback empty structure for demo
      setDetailData({
        class_name: cls.year ? `${cls.year} ${selectedStream}` : cls.class_name || 'Class',
        total:   cls.total   || 0,
        present: cls.present || 0,
        absent:  cls.absent  || 0,
        subjects: [],
        weekly_trend: [],
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => { setDetailClass(null); setDetailData(null); };

  const pieData = detailData ? [
    { name: 'Present', value: detailData.present },
    { name: 'Absent',  value: detailData.absent  },
  ] : [];

  return (
    <div className="animate-fade-in-up">
      {/* Stream Selector */}
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

      {/* Class Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : streamData.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <svg className="w-16 h-16 mx-auto mb-4 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No class data available. Will populate from API.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {streamData.map((item, idx) => {
            const percent = item.total > 0 ? ((item.present / item.total) * 100).toFixed(1) : 0;
            return (
              <div key={item.class_id || idx} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all">
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

                <button
                  onClick={() => openDeepDive(item)}
                  className="mt-5 w-full bg-purple-600/30 hover:bg-purple-600/60 border border-purple-500/30 text-purple-200 hover:text-white py-2.5 rounded-xl font-bold text-sm transition-all relative z-10 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Deep Dive Modal ── */}
      {detailClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal}></div>

          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 w-full max-w-3xl rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden animate-fade-in-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-slate-900/95 backdrop-blur-xl z-10">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {detailData?.class_name || `${detailClass.year} ${selectedStream}`}
                </h2>
                <p className="text-white/40 text-sm">Deep Dive Analysis</p>
              </div>
              <button onClick={closeModal} className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : detailData ? (
              <div className="p-6 flex flex-col gap-8">

                {/* Summary Row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Students', value: detailData.total,   color: 'text-white' },
                    { label: 'Present',         value: detailData.present, color: 'text-green-400' },
                    { label: 'Absent',          value: detailData.absent,  color: 'text-red-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{s.label}</p>
                      <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pie Chart — Present vs Absent */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-white/70 mb-4">Present vs Absent</h4>
                    {pieData.every(p => p.value === 0) ? (
                      <div className="flex items-center justify-center h-40 text-white/30 text-sm">No data yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            <Cell fill={COLORS_PRESENT} />
                            <Cell fill={COLORS_ABSENT} />
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Bar Chart — Per-Subject Attendance */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-white/70 mb-4">Subject-wise Attendance %</h4>
                    {!detailData.subjects || detailData.subjects.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-white/30 text-sm">No subject data yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={detailData.subjects} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                          <Bar dataKey="pct" name="Attendance %" fill={COLORS_PRESENT} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Weekly Trend — Line Chart placeholder */}
                {detailData.weekly_trend && detailData.weekly_trend.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-white/70 mb-4">Weekly Attendance Trend</h4>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={detailData.weekly_trend} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                        <Bar dataKey="pct" name="Avg %" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalViewTab;
