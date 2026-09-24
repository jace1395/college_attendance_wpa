import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import apiClient from '../../services/apiClient';

const COLORS_PRESENT = '#a855f7';
const COLORS_ABSENT  = '#ef4444';

const PrincipalViewTab = ({ streams, defaultSubTab, defaultParams }) => {
  const [subTab, setSubTab] = useState(defaultSubTab || 'Trends');
  
  // States for Trends
  // Initialize stream from graph click if provided
  const initialStream = (defaultParams?.streams?.length > 0) ? defaultParams.streams[0] : (streams?.[0] || 'BCA');
  const [selectedStream, setSelectedStream] = useState(initialStream);

  // Auto-open class if requested from graph click
  const [autoOpenClassId, setAutoOpenClassId] = useState(defaultParams?.classes?.length === 1 ? defaultParams.classes[0] : null);
  const [streamData, setStreamData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for other tabs
  const [mentorData, setMentorData] = useState([]);
  const [divisionData, setDivisionData] = useState([]);
  
  // Accordion state for mentors
  const [expandedMentor, setExpandedMentor] = useState(null);
  const [mentorMentees, setMentorMentees] = useState([]);
  const [loadingMentees, setLoadingMentees] = useState(false);

  // Deep Dive Modal
  const [detailClass, setDetailClass] = useState(null);
  const [detailData, setDetailData]   = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch data based on active sub-tab
  useEffect(() => {
    if (subTab === 'Trends') {
      if (!selectedStream) return;
      const fetchStream = async () => {
        setLoading(true);
        try {
          const { data } = await apiClient.get(`/api/principal/stream-view/?stream=${selectedStream}`);
          const fetchedClasses = data.classes || [];
          setStreamData(fetchedClasses);

          // If a class was clicked on the graph, auto open its deep dive modal once
          if (autoOpenClassId) {
             const clsToOpen = fetchedClasses.find(c => String(c.class_id) === String(autoOpenClassId));
             if (clsToOpen) {
                 openDeepDive(clsToOpen);
             }
             setAutoOpenClassId(null); // Clear it so it doesn't repeatedly open
          }
        } catch {
          setStreamData([]);
        } finally {
          setLoading(false);
        }
      };
      fetchStream();
    } else if (subTab === 'Mentor Oversight') {
      const fetchMentors = async () => {
        setLoading(true);
        try {
          const { data } = await apiClient.get('/api/principal/mentor-oversight/');
          setMentorData(data.mentors || []);
        } catch { }
        finally { setLoading(false); }
      };
      fetchMentors();
    } else if (subTab === 'Division Analysis') {
      const fetchDivisions = async () => {
        setLoading(true);
        try {
          const { data } = await apiClient.get('/api/reports/principal/division-analysis/');
          setDivisionData(data.divisions || []);
        } catch { }
        finally { setLoading(false); }
      };
      fetchDivisions();
    }
  }, [subTab, selectedStream]);

  // Fetch deep-dive detail for a specific class
  const openDeepDive = async (cls) => {
    setDetailClass(cls);
    setDetailData(null);
    setLoadingDetail(true);
    try {
      const { data } = await apiClient.get(`/api/principal/class-detail/?class_id=${cls.class_id}`);
      setDetailData(data);
    } catch {
      setDetailData(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleMentorAccordion = async (mentorId) => {
    if (expandedMentor === mentorId) {
      setExpandedMentor(null);
      setMentorMentees([]);
      return;
    }
    setExpandedMentor(mentorId);
    setLoadingMentees(true);
    try {
      const { data } = await apiClient.get(`/api/users/mentees/?mentor_id=${mentorId}`);
      setMentorMentees(data.mentees || []);
    } catch {
      setMentorMentees([]);
    } finally {
      setLoadingMentees(false);
    }
  };

  const closeModal = () => { setDetailClass(null); setDetailData(null); };

  const pieData = detailData ? [
    { name: 'Present', value: detailData.present },
    { name: 'Absent',  value: detailData.absent  },
  ] : [];

  return (
    <div className="animate-fade-in-up flex flex-col gap-6 w-full">
      
      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-white/10 w-fit mb-4 shadow-sm">
        {['Trends', 'Mentor Oversight', 'Division Analysis'].map(t => (
          <button 
            key={t} 
            onClick={() => setSubTab(t)}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              subTab === t ? 'bg-purple-600 text-white shadow' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === 'Trends' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h3 className="text-2xl font-semibold">Stream Breakdown</h3>
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="bg-slate-900/50 text-white rounded-xl px-4 py-2 border border-white/10 outline-none focus:border-purple-500"
            >
              {streams?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : streamData.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <p>No class data available for this stream.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {streamData.map((item, idx) => {
                const percent = item.total > 0 ? ((item.present / item.total) * 100).toFixed(1) : 0;
                return (
                  <div key={item.class_id || idx} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
                    <h4 className="text-2xl font-bold mb-4 relative z-10 text-white">{item.year} {selectedStream}</h4>

                    <div className="space-y-4 relative z-10 text-white">
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
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {subTab === 'Mentor Oversight' && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-6 text-white">Mentor Oversight</h3>
          {loading ? (
             <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-white">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-sm">
                    <th className="pb-3">Mentor Name</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Mentees Count</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mentorData.map(m => (
                    <React.Fragment key={m.id}>
                      <tr 
                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => toggleMentorAccordion(m.id)}
                      >
                        <td className="py-3 font-semibold flex items-center gap-2">
                          <svg className={`w-4 h-4 transition-transform ${expandedMentor === m.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          {m.name}
                        </td>
                        <td className="py-3 text-white/70">{m.department}</td>
                        <td className="py-3">{m.mentees_count}</td>
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${m.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                      {expandedMentor === m.id && (
                        <tr className="bg-white/5">
                          <td colSpan="4" className="p-4">
                            {loadingMentees ? (
                              <div className="flex justify-center"><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500"></div></div>
                            ) : mentorMentees.length === 0 ? (
                              <div className="text-white/50 text-sm">No mentees found for this mentor.</div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {mentorMentees.map(mentee => (
                                  <div key={mentee.id} className="bg-slate-800/80 p-3 rounded-lg border border-white/10 flex flex-col">
                                    <span className="font-bold text-white text-sm">{mentee.name}</span>
                                    <span className="text-white/50 text-xs">{mentee.roll_no} | {mentee.stream}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {subTab === 'Division Analysis' && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-6 text-white">Division Analysis</h3>
          {loading ? (
             <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-white">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-sm">
                    <th className="pb-3">Stream</th>
                    <th className="pb-3">Subject</th>
                    <th className="pb-3">Division</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Present</th>
                    <th className="pb-3">Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {divisionData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-white/50 italic">
                        No divisions have been set up in the database yet.
                      </td>
                    </tr>
                  ) : (
                    divisionData.map((d, idx) => (
                      <tr key={d.class_id || idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 font-semibold">{d.stream}</td>
                        <td className="py-3 text-white/70">{d.subject}</td>
                        <td className="py-3 text-purple-400 font-bold">
                          {d.division && d.stream !== 'BVoc' ? `Div ${d.division}` : <span className="text-white/30 font-normal">N/A</span>}
                        </td>
                        <td className="py-3">{d.total}</td>
                        <td className="py-3">{d.present}</td>
                        <td className={`py-3 font-bold ${d.pct >= 75 ? 'text-green-400' : 'text-red-400'}`}>{d.pct}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Deep Dive Modal ── */}
      {detailClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal}></div>

          <div className="bg-slate-900 text-white border border-white/20 w-full max-w-3xl rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-slate-900/95 backdrop-blur-xl z-20">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {detailData?.class_name || `${detailClass.year} ${selectedStream}`}
                  {detailData?.division && (
                    <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-500/30">
                      Div {detailData.division}
                    </span>
                  )}
                </h2>
                <div className="flex gap-4 mt-2">
                  <p className="text-white/60 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Teacher: {detailData?.teacher_name || 'Loading...'}
                  </p>
                  <p className="text-white/60 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Mentor: {detailData?.mentor_name || 'Loading...'}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors self-start">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : detailData ? (
              <div className="p-6 flex flex-col gap-8 bg-slate-900">

                {/* Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Students', value: detailData.total,   color: 'text-white', bg: 'bg-slate-800' },
                    { label: 'Present',         value: detailData.present, color: 'text-green-400', bg: 'bg-green-900/20' },
                    { label: 'Absent',          value: detailData.absent,  color: 'text-red-400', bg: 'bg-red-900/20' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center border border-white/5`}>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{s.label}</p>
                      <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pie Chart — Present vs Absent */}
                  <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-white/70 mb-4">Present vs Absent (Daily)</h4>
                    {pieData.every(p => p.value === 0) ? (
                      <div className="flex items-center justify-center h-40 text-white/30 text-sm">No data yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} isAnimationActive={false}>
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
                  <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-white/70 mb-4">Subject-wise Attendance % (Monthly)</h4>
                    {!detailData.subjects || detailData.subjects.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-white/30 text-sm">No subject data yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={detailData.subjects} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="subject" tick={{ fontSize: 12, fill: 'currentColor' }} interval={0} angle={-45} textAnchor="end" height={60} />
                          <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                          <Bar dataKey="pct" name="Attendance %" fill={COLORS_PRESENT} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Weekly Trend — Line Chart */}
                {detailData.weekly_trend && detailData.weekly_trend.length > 0 && (
                  <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-white/70 mb-4">Weekly Attendance Trend (Last 4 Weeks)</h4>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={detailData.weekly_trend} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'currentColor' }} interval={0} angle={-45} textAnchor="end" height={60} />
                        <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                        <Bar dataKey="pct" name="Avg %" fill="#0ea5e9" radius={[4, 4, 0, 0]} isAnimationActive={false} />
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
