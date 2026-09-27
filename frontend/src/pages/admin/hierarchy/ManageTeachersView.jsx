import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';

const ManageTeachersView = ({ departments, setResetModalUser, handleDelete, setEditModalUser, refreshTrigger }) => {
  const [selectedDept, setSelectedDept] = useState('all');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [assignModalUser, setAssignModalUser] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [assignDivision, setAssignDivision] = useState('BVoc');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/api/admin/hierarchy/teachers/?department=${selectedDept}`);
      setTeachers(data.teachers || []);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [selectedDept, refreshTrigger]);

  useEffect(() => {
    if (assignModalUser) {
      const fetchSubjects = async () => {
        try {
          const { data } = await apiClient.get('/api/admin/assign-subject/');
          setAllSubjects(data || []);
        } catch (err) {
          console.error("Failed to fetch subjects");
        }
      };
      fetchSubjects();
    }
  }, [assignModalUser]);

  const handleAssignSubject = async (e) => {
    e.preventDefault();
    setIsAssigning(true);
    try {
      await apiClient.post('/api/admin/assign-subject/', {
        teacher_id: assignModalUser.id,
        subject_id: selectedSubjectId,
        division: assignDivision
      });
      alert('Subject assigned successfully!');
      setAssignModalUser(null);
      setSelectedSubjectId('');
      setAssignDivision('BVoc');
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign subject');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignSubject = async (batchId) => {
    if (!window.confirm("Are you sure you want to remove this assigned subject?")) return;
    try {
      await apiClient.delete(`/api/admin/assign-subject/?batch_id=${batchId}`);
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove subject');
    }
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl w-full">
          <div className="bg-slate-900/50 p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                Teachers
                <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full font-semibold">
                  {teachers.length} Found
                </span>
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/30 border-b border-white/10 text-white/50 text-sm">
                  <th className="p-4 font-medium">Name & Email</th>
                  <th className="p-4 font-medium">Department</th>
                  <th className="p-4 font-medium">Classes Assigned</th>
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length > 0 ? teachers.map(teacher => (
                  <tr key={teacher.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{teacher.name}</div>
                      <div className="text-sm text-white/60">{teacher.email}</div>
                    </td>
                    <td className="p-4 text-white/80">{teacher.department_name}</td>
                    <td className="p-4">
                      {teacher.classes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.classes.map(c => (
                            <span key={c.id} className="bg-slate-800 text-xs px-2 py-1 rounded border border-white/10 text-slate-300 flex items-center gap-1 group cursor-default" title={`${c.stream} - Sem ${c.semester}`}>
                              <span>{c.subject_name} {c.division ? `(${c.division})` : ''}</span>
                              <button 
                                onClick={() => handleUnassignSubject(c.id)}
                                className="text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                title="Remove Subject"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-white/40 italic">None</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${teacher.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setAssignModalUser(teacher)}
                          className="p-2 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors"
                          title="Assign Subject"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        </button>
                        <button
                          onClick={() => setEditModalUser(teacher)}
                          className="p-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors"
                          title="Edit Teacher"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button
                          onClick={() => setResetModalUser(teacher)}
                          className="p-2 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 transition-colors"
                          title="Reset Password"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                          title="Delete/Deactivate Teacher"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-white/40">
                      No teachers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Subject Modal */}
      {assignModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isAssigning && setAssignModalUser(null)}></div>

          <div className="bg-slate-800 border border-slate-600 w-full max-w-md rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700">
              <h3 className="font-bold text-lg text-white">Assign Subject</h3>
              <button onClick={() => !isAssigning && setAssignModalUser(null)} className="text-slate-400 hover:text-white" disabled={isAssigning}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleAssignSubject}>
              <div className="p-6 flex flex-col gap-4">
                <p className="text-white/80 text-sm">
                  Assign a new subject to <strong>{assignModalUser.name}</strong>.
                </p>
                <div>
                  <label className="block text-sm text-white/60 mb-1 ml-1">Subject</label>
                  <select 
                    required
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500 appearance-none"
                  >
                    <option value="">Select a subject...</option>
                    {allSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.stream} - Sem {s.semester})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1 ml-1">Stream / Batch</label>
                  <select 
                    value={assignDivision}
                    onChange={(e) => setAssignDivision(e.target.value)}
                    className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500 appearance-none"
                  >
                    <option value="BVoc">BVoc</option>
                    <option value="BCA">BCA</option>
                    <option value="BCom">BCom</option>
                    <option value="BBA">BBA</option>
                    <option value="BBA(FS)">BBA(FS)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-900 px-6 py-4 flex justify-end gap-3 border-t border-slate-700">
                <button type="button" onClick={() => setAssignModalUser(null)} className="px-4 py-2 text-white/70 hover:text-white transition-colors" disabled={isAssigning}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !selectedSubjectId}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition-transform transform disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning...' : 'Assign Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTeachersView;
