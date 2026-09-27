import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';

const ManageMentorsView = ({ departments, streams, setResetModalUser, handleDelete, setEditModalUser, refreshTrigger }) => {
  const [selectedDept, setSelectedDept] = useState('all');
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedMentor, setExpandedMentor] = useState(null);

  const [assignStreamUser, setAssignStreamUser] = useState(null);
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/api/admin/hierarchy/mentors/?department=${selectedDept}`);
      setMentors(data.mentors || []);
    } catch (err) {
      console.error("Failed to fetch mentors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [selectedDept, refreshTrigger]);

  const handleAssignStream = async (e) => {
    e.preventDefault();
    setIsAssigning(true);
    try {
      await apiClient.post('/api/admin/assign-mentor/', {
        teacher_id: assignStreamUser.id,
        stream_id: selectedStreamId
      });
      alert('Mentor successfully assigned to stream!');
      setAssignStreamUser(null);
      setSelectedStreamId('');
      fetchMentors();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign stream');
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedMentor(expandedMentor === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Filters Card */}
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 flex flex-wrap gap-4 items-center shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-400">Department:</span>
          <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
          >
            <option value="all">All Departments</option>
            <option value="none">No Department</option>
            {departments.map(d => (
              <option key={d.id} value={d.id.toString()}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center p-12 w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-400"></div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl w-full">
          <div className="bg-slate-900/50 p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                Mentors
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-semibold">
                  {mentors.length} Mentors
                </span>
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto w-full p-4">
            <div className="space-y-4">
              {mentors.length > 0 ? mentors.map(mentor => (
                <div key={mentor.id} className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden">
                  <div 
                    className="p-4 flex flex-wrap justify-between items-center cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => toggleExpand(mentor.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-500/20 p-3 rounded-xl text-indigo-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{mentor.name}</h3>
                        <p className="text-sm text-slate-400">{mentor.department_name} • {mentor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                      <span className="text-sm font-semibold text-slate-300 bg-slate-900 px-3 py-1 rounded-lg">
                        {mentor.mentees.length} Mentees
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${mentor.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {mentor.status}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAssignStreamUser(mentor); }}
                        className="p-2 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors"
                        title="Assign Stream to Mentor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditModalUser(mentor); }}
                        className="p-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors"
                        title="Edit Mentor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setResetModalUser(mentor); }}
                        className="p-2 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 transition-colors"
                        title="Reset Password"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(mentor.id); }}
                        className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                        title="Delete/Deactivate Mentor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                      <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedMentor === mentor.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>

                  {/* Mentees Accordion */}
                  {expandedMentor === mentor.id && (
                    <div className="border-t border-slate-700 bg-slate-900/50 p-4">
                      <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Assigned Mentees</h4>
                      {mentor.mentees.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="text-slate-500 border-b border-slate-700">
                                <th className="pb-2 font-medium">Roll No</th>
                                <th className="pb-2 font-medium">Name</th>
                                <th className="pb-2 font-medium">Stream</th>
                                <th className="pb-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mentor.mentees.map(mentee => (
                                <tr key={mentee.id} className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                                  <td className="py-2 text-slate-300 font-mono">{mentee.roll_no}</td>
                                  <td className="py-2 text-white font-medium">{mentee.name}</td>
                                  <td className="py-2 text-slate-400">
                                    {[mentee.stream, mentee.year, mentee.division ? `Div ${mentee.division}` : ''].filter(Boolean).join(' ') || '-'}
                                  </td>
                                  <td className="py-2">
                                    <span className={`w-2 h-2 inline-block rounded-full mr-2 ${mentee.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span className="text-slate-400 text-xs capitalize">{mentee.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No mentees assigned.</p>
                      )}
                    </div>
                  )}
                </div>
              )) : (
                <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-3xl p-12 text-center text-slate-400 w-full">
                  <p>No mentors found in this department.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Assign Stream Modal */}
      {assignStreamUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isAssigning && setAssignStreamUser(null)}></div>

          <div className="bg-slate-800 border border-slate-600 w-full max-w-md rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700">
              <h3 className="font-bold text-lg text-white">Assign Mentees (By Stream)</h3>
              <button onClick={() => !isAssigning && setAssignStreamUser(null)} className="text-slate-400 hover:text-white" disabled={isAssigning}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleAssignStream}>
              <div className="p-6 flex flex-col gap-4">
                <p className="text-white/80 text-sm">
                  Make <strong>{assignStreamUser.name}</strong> the mentor for all active students in a specific stream. This permanently updates their records.
                </p>
                <div>
                  <label className="block text-sm text-white/60 mb-1 ml-1">Stream</label>
                  <select 
                    required
                    value={selectedStreamId}
                    onChange={(e) => setSelectedStreamId(e.target.value)}
                    className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500 appearance-none"
                  >
                    <option value="">Select a stream...</option>
                    {streams && streams.length > 0 ? (
                        streams.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))
                    ) : (
                        <option value="">No streams available</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="bg-slate-900 px-6 py-4 flex justify-end gap-3 border-t border-slate-700">
                <button type="button" onClick={() => setAssignStreamUser(null)} className="px-4 py-2 text-white/70 hover:text-white transition-colors" disabled={isAssigning}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !selectedStreamId}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition-transform transform disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning...' : 'Assign Stream'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMentorsView;
