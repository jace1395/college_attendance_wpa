import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

// Import sub-components
import ManageStudentsView from './hierarchy/ManageStudentsView';
import ManageTeachersView from './hierarchy/ManageTeachersView';
import ManageHODsView from './hierarchy/ManageHODsView';
import ManageMentorsView from './hierarchy/ManageMentorsView';
import ManagePrincipalView from './hierarchy/ManagePrincipalView';

const UserManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState('students');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // New User State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student',
    stream: '',
    department: '',
    year: '',
    roll_no: ''
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Password Reset State
  const [resetModalUser, setResetModalUser] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  // Global Hierarchy Filters
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [streams, setStreams] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const { data } = await apiClient.get('/api/admin/hierarchy/filters/');
        setDepartments(data.departments);
        setStreams(data.streams);
        setClasses(data.classes);
      } catch (err) {
        console.error("Failed to fetch hierarchy filters:", err);
      } finally {
        setFiltersLoading(false);
      }
    };
    fetchFilters();
  }, []);

  // Drag and Drop Handlers
  const handleDragOver  = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = ()  => setIsDragOver(false);
  const handleDrop      = (e) => {
    e.preventDefault(); setIsDragOver(false);
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

  const simulateCsvUpload = async (file) => {
    setUploadStatus({ type: 'loading', msg: `Uploading ${file.name}...` });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'users');
      await apiClient.post('/api/attendance/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus({ type: 'success', msg: 'CSV Processed! Users added successfully.' });
      setTimeout(() => window.location.reload(), 2000); // Reload to fetch fresh data
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed. Please check the file format.';
      setUploadStatus({ type: 'error', msg });
    } finally {
      setTimeout(() => setUploadStatus(null), 4000);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to deactivate user ${id}?`)) {
      try {
        await apiClient.patch(`/api/admin/users/${id}/deactivate/`);
        alert("User deactivated successfully!");
        window.location.reload();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to deactivate user.');
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setIsResetting(true);
    try {
      await apiClient.post(`/api/admin/users/${resetModalUser.id}/reset-password/`, {
        admin_password: adminPassword,
      });
      const year = new Date().getFullYear();
      alert(`Password reset to default (Sdcce@${year})`);
      setResetModalUser(null);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid admin password or request failed';
      setResetError(msg);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      await apiClient.post('/api/admin/users/', newUser);
      alert('User added successfully!');
      setIsAddModalOpen(false);
      setNewUser({ name: '', email: '', role: 'student', stream: '', department: '', year: '', roll_no: '' });
      window.location.reload(); 
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg">
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 w-full lg:w-auto overflow-x-auto">
          {[
            { key: 'students', label: 'Manage Students' },
            { key: 'teachers', label: 'Manage Teachers' },
            { key: 'hods',     label: 'Manage HODs' },
            { key: 'mentors',  label: 'Manage Mentors' },
            { key: 'principal',label: 'Manage Principal' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeSubTab === tab.key ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 lg:flex-none bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-transform transform flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add User
          </button>
        </div>
      </div>

      {/* Bulk Upload CSV - Horizontal Compact Banner */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-center p-6 gap-4 text-center sm:text-left transition-all shadow-sm ${
          isDragOver ? 'border-blue-400 bg-blue-500/10' : 'border-white/20 bg-white/5 hover:border-white/40'
        }`}
      >
        {uploadStatus ? (
          <div className={`flex items-center gap-3 ${uploadStatus.type === 'error' ? 'text-red-400' : uploadStatus.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
            {uploadStatus.type === 'loading' && <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-400"></div>}
            {uploadStatus.type === 'success' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
            {uploadStatus.type === 'error'   && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>}
            <p className="font-semibold">{uploadStatus.msg}</p>
          </div>
        ) : (
          <>
            <div className={`p-3 rounded-full ${isDragOver ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/40'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Bulk Upload Users</h3>
              <p className="text-sm text-white/50">Drag and drop a .csv file here to add multiple users at once.</p>
            </div>
            <button className="hidden sm:block ml-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors border border-white/10">
              Browse File
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-6 items-start">
        {/* Main Content Area */}
        <div className="flex-1 w-full">
          {filtersLoading ? (
             <div className="flex justify-center p-12">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
             </div>
          ) : (
            <>
              {activeSubTab === 'students' && (
                <ManageStudentsView 
                  departments={departments} 
                  streams={streams} 
                  classes={classes} 
                  setResetModalUser={setResetModalUser} 
                  handleDelete={handleDelete}
                />
              )}
              {activeSubTab === 'teachers' && (
                <ManageTeachersView 
                  departments={departments} 
                  setResetModalUser={setResetModalUser} 
                  handleDelete={handleDelete}
                />
              )}
              {activeSubTab === 'hods' && (
                <ManageHODsView 
                  departments={departments} 
                  setResetModalUser={setResetModalUser} 
                  handleDelete={handleDelete}
                />
              )}
              {activeSubTab === 'mentors' && (
                <ManageMentorsView 
                  departments={departments} 
                  classes={classes} 
                  setResetModalUser={setResetModalUser} 
                  handleDelete={handleDelete}
                />
              )}
              {activeSubTab === 'principal' && (
                <ManagePrincipalView />
              )}
            </>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>

          <div className="bg-slate-800 border border-slate-600 w-full max-w-md rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700">
              <h3 className="font-bold text-lg text-white">Create New User</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1 ml-1">Full Name</label>
                  <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1 ml-1">Email Address</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1 ml-1">Roll Number / ID</label>
                  <input type="text" value={newUser.roll_no} onChange={e => setNewUser({...newUser, roll_no: e.target.value})} className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1 ml-1">Role</label>
                    <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500 appearance-none">
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="hod">HOD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1 ml-1">Department</label>
                    <select value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500 appearance-none">
                      <option value="">—</option>
                      {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {newUser.role === 'student' && (
                    <div className="flex-1">
                      <label className="block text-sm text-white/60 mb-1 ml-1">Stream</label>
                      <select value={newUser.stream} onChange={e => setNewUser({...newUser, stream: e.target.value})} className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500 appearance-none">
                        <option value="">—</option>
                        {streams.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                  {newUser.role === 'student' && (
                    <div className="flex-1">
                      <label className="block text-sm text-white/60 mb-1 ml-1">Year</label>
                      <select value={newUser.year} onChange={e => setNewUser({...newUser, year: e.target.value})} className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500 appearance-none">
                        <option value="">—</option>
                        <option value="FY">FY</option>
                        <option value="SY">SY</option>
                        <option value="TY">TY</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 px-6 py-4 flex justify-end gap-3 border-t border-slate-700">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-white/70 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition-transform transform disabled:opacity-50"
                >
                  {isCreatingUser ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isResetting && setResetModalUser(null)}></div>

          <div className="bg-slate-800 border border-slate-600 w-full max-w-md rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700">
              <h3 className="font-bold text-lg text-white">Reset Password</h3>
              <button onClick={() => !isResetting && setResetModalUser(null)} className="text-slate-400 hover:text-white" disabled={isResetting}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="p-6 flex flex-col gap-4">
                <p className="text-white/80 text-sm">
                  Are you sure you want to reset <strong>{resetModalUser.name}</strong>'s password to the system default? Please enter your admin password to confirm.
                </p>
                {resetError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
                    {resetError}
                  </div>
                )}
                <div>
                  <label className="block text-sm text-white/60 mb-1 ml-1">Admin Password</label>
                  <input 
                    type="password" 
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500" 
                    placeholder="Enter your admin password"
                  />
                </div>
              </div>

              <div className="bg-slate-900 px-6 py-4 flex justify-end gap-3 border-t border-slate-700">
                <button type="button" onClick={() => setResetModalUser(null)} className="px-4 py-2 text-white/70 hover:text-white transition-colors" disabled={isResetting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !adminPassword}
                  className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition-transform transform disabled:opacity-50"
                >
                  {isResetting ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
