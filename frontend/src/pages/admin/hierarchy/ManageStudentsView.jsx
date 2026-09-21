import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';

const ManageStudentsView = ({ departments, streams, classes, setResetModalUser, handleDelete }) => {
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStream, setSelectedStream] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Derived filtered options
  const filteredStreams = selectedDept === 'all' 
    ? streams 
    : streams.filter(s => s.department_id.toString() === selectedDept);
    
  const filteredClasses = selectedStream === 'all'
    ? classes.filter(c => filteredStreams.some(s => s.name === c.stream_name))
    : classes.filter(c => c.stream_name === streams.find(s => s.id.toString() === selectedStream)?.name);

  // Reset downstream filters when upstream changes
  useEffect(() => {
    setSelectedStream('all');
    setSelectedClass('all');
  }, [selectedDept]);

  useEffect(() => {
    setSelectedClass('all');
  }, [selectedStream]);

  // Fetch student data when class is selected
  useEffect(() => {
    if (selectedClass === 'all') {
      setClassData(null);
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/api/admin/hierarchy/students/?class_batch=${selectedClass}`);
        setClassData(data.class_batch);
        setStudents(data.students);
      } catch (err) {
        console.error("Failed to fetch students:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClass]);

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
            <option value="all">Select Department</option>
            {departments.map(d => (
              <option key={d.id} value={d.id.toString()}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-400">Stream:</span>
          <select 
            value={selectedStream} 
            onChange={(e) => setSelectedStream(e.target.value)}
            disabled={selectedDept === 'all'}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none disabled:opacity-50"
          >
            <option value="all">Select Stream</option>
            {filteredStreams.map(s => (
              <option key={s.id} value={s.id.toString()}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-400">Class:</span>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={selectedStream === 'all'}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none disabled:opacity-50"
          >
            <option value="all">Select Class</option>
            {filteredClasses.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedClass === 'all' ? (
        <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-3xl p-12 text-center text-slate-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          <h3 className="text-xl font-bold text-slate-300 mb-2">Select a Class</h3>
          <p>Please select a Department, Stream, and Class to view enrolled students.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-12 w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl w-full">
          {/* Header Card */}
          {classData && (
            <div className="bg-slate-900/50 p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {classData.name}
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-semibold">
                    {students.length} Enrolled
                  </span>
                </h2>
                <p className="text-slate-400 mt-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Teacher: <span className="text-white font-medium">{classData.teacher_name}</span>
                </p>
              </div>
            </div>
          )}

          {/* Student Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/30 border-b border-white/10 text-white/50 text-sm">
                  <th className="p-4 font-medium">Roll No</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? students.map(student => (
                  <tr key={student.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                    <td className="p-4 font-mono text-sm text-white/80">{student.roll_no || student.id}</td>
                    <td className="p-4 font-bold">{student.name}</td>
                    <td className="p-4 text-sm text-white/60">{student.email}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${student.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button
                          onClick={() => setResetModalUser(student)}
                          className="p-2 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 transition-colors"
                          title="Reset Password"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-white/40">
                      No students enrolled in this class.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudentsView;
