import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';

const ManageHODsView = ({ departments, setResetModalUser }) => {
  const [selectedDept, setSelectedDept] = useState('all');
  const [hierarchyData, setHierarchyData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHODs = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/api/admin/hierarchy/hods/?department=${selectedDept}`);
        if (selectedDept === 'all') {
          setHierarchyData(data.departments_hierarchy || []);
        } else {
          setHierarchyData([data]);
        }
      } catch (err) {
        console.error("Failed to fetch HODs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHODs();
  }, [selectedDept]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-400"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {hierarchyData.length > 0 ? hierarchyData.map((deptData, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl w-full">
              <div className="bg-slate-900/50 p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    {deptData.department.name} Department
                  </h2>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    Head of Department
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deptData.hods && deptData.hods.length > 0 ? deptData.hods.map(hod => (
                      <div key={hod.id} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{hod.name}</div>
                          <div className="text-sm text-slate-400">{hod.email}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${hod.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {hod.status}
                          </span>
                          <button
                            onClick={() => setResetModalUser(hod)}
                            className="p-2 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 transition-colors"
                            title="Reset Password"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-sm text-slate-500 italic">No HOD assigned to this department.</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    Department Teachers ({deptData.teachers?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {deptData.teachers && deptData.teachers.length > 0 ? deptData.teachers.map(t => (
                      <div key={t.id} className="bg-slate-900 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 flex items-center gap-2">
                        <span>{t.name}</span>
                        <div className={`w-2 h-2 rounded-full ${t.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                    )) : (
                      <div className="text-sm text-slate-500 italic">No teachers in this department.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-3xl p-12 text-center text-slate-400 w-full">
              <p>No department data found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageHODsView;
