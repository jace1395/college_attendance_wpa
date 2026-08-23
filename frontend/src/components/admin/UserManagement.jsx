import React, { useState } from 'react';

const UserManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState('students');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Mock Users
  const [users, setUsers] = useState([
    { id: '2511011', name: 'Jace Doe', email: '2511011.jace.sdcce@vvm.edu.in', role: 'student', status: 'active' },
    { id: '2411022', name: 'Alice Smith', email: '2411022.alice.sdcce@vvm.edu.in', role: 'student', status: 'active' },
    { id: 'T001', name: 'Sumit Kumar', email: 'sumit.kumar@vvm.edu.in', role: 'teacher', status: 'active' },
    { id: 'P001', name: 'Dr. Prita', email: 'principal@vvm.edu.in', role: 'principal', status: 'active' },
  ]);

  const filteredUsers = users.filter(u => {
      if (activeSubTab === 'students') return u.role === 'student';
      if (activeSubTab === 'teachers') return u.role === 'teacher';
      if (activeSubTab === 'admins') return u.role === 'principal' || u.role === 'admin';
      return true;
  });

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.csv')) {
            simulateCsvUpload(file);
        } else {
            setUploadStatus({ type: 'error', msg: 'Please drop a valid .csv file' });
            setTimeout(() => setUploadStatus(null), 3000);
        }
    }
  };

  const simulateCsvUpload = (file) => {
      setUploadStatus({ type: 'loading', msg: `Uploading ${file.name}...` });
      
      // Simulating FormData POST to /api/admin/users/bulk
      setTimeout(() => {
          setUploadStatus({ type: 'success', msg: 'CSV Processed! 45 users added successfully.' });
          setTimeout(() => setUploadStatus(null), 4000);
      }, 2000);
  };

  const handleDelete = (id) => {
      if (window.confirm(`Are you sure you want to deactivate user ${id}?`)) {
          setUsers(users.map(u => u.id === id ? { ...u, status: 'inactive' } : u));
      }
  };

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">
        
        {/* Top Action Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg">
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 w-full lg:w-auto overflow-x-auto">
                <button 
                    onClick={() => setActiveSubTab('students')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeSubTab === 'students' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'}`}
                >
                    Manage Students
                </button>
                <button 
                    onClick={() => setActiveSubTab('teachers')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeSubTab === 'teachers' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'}`}
                >
                    Manage Teachers
                </button>
                <button 
                    onClick={() => setActiveSubTab('admins')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeSubTab === 'admins' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'}`}
                >
                    Manage Admins
                </button>
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex-1 lg:flex-none bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-transform transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Add User
                </button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            {/* Drag & Drop Zone */}
            <div className="lg:w-1/3 shrink-0">
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`h-full min-h-[200px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-center transition-all ${
                        isDragOver ? 'border-blue-400 bg-blue-500/10 scale-105' : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                >
                    {uploadStatus ? (
                        <div className={`animate-fade-in-up flex flex-col items-center gap-3 ${uploadStatus.type === 'error' ? 'text-red-400' : uploadStatus.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                            {uploadStatus.type === 'loading' && <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>}
                            {uploadStatus.type === 'success' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                            {uploadStatus.type === 'error' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>}
                            <p className="font-semibold">{uploadStatus.msg}</p>
                        </div>
                    ) : (
                        <>
                            <svg className={`w-12 h-12 mb-4 transition-colors ${isDragOver ? 'text-blue-400' : 'text-white/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            <h3 className="font-bold text-lg mb-1">Bulk Upload CSV</h3>
                            <p className="text-sm text-white/50">Drag and drop your user data file here.</p>
                        </>
                    )}
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-white/10 text-white/50 text-sm">
                                <th className="p-4 font-medium">ID</th>
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium text-center">Status</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                <tr key={user.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                                    <td className="p-4 font-mono text-sm text-white/80">{user.id}</td>
                                    <td className="p-4 font-bold">{user.name}</td>
                                    <td className="p-4 text-sm text-white/60">{user.email}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors" title="Edit">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                disabled={user.status === 'inactive'}
                                                className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                                                title="Deactivate"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-white/40">No users found in this category.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Add User Modal */}
        {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                
                <div className="bg-slate-800 border border-slate-600 w-full max-w-md rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden animate-fade-in-up">
                    <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700">
                        <h3 className="font-bold text-lg text-white">Create New User</h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    
                    <div className="p-6 flex flex-col gap-4">
                        <div>
                            <label className="block text-sm text-white/60 mb-1 ml-1">Full Name</label>
                            <input type="text" className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1 ml-1">Email Address</label>
                            <input type="email" className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-white/60 mb-1 ml-1">Role</label>
                                <select className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500 appearance-none">
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="principal">Principal</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-1 ml-1">Department/Class</label>
                                <input type="text" className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 px-6 py-4 flex justify-end gap-3 border-t border-slate-700">
                        <button 
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                alert('User added successfully!');
                                setIsAddModalOpen(false);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition-transform transform hover:-translate-y-0.5"
                        >
                            Save User
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default UserManagement;
