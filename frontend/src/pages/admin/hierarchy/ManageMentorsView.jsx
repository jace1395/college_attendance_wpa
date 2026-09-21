import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';

const ManageMentorsView = ({ departments, setResetModalUser }) => {
  const [selectedDept, setSelectedDept] = useState('all');
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedMentor, setExpandedMentor] = useState(null);

  useEffect(() => {
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
    fetchMentors();
  }, [selectedDept]);

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
                                  <td className="py-2 text-slate-400">{mentee.stream || '-'}</td>
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
    </div>
  );
};

export default ManageMentorsView;
