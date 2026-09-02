import React, { useState, useEffect, useMemo } from 'react';

const YEARS   = ['FY', 'SY', 'TY'];
const STREAMS = ['BVoc', 'BCA', 'BBA', 'BCom', 'BBA(FS)'];

const UserManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState('students');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Empty state — will be populated from API
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [yearFilter,   setYearFilter]   = useState('All');
  const [streamFilter, setStreamFilter] = useState('All');
  const [searchQuery,  setSearchQuery]  = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('role', activeSubTab === 'students' ? 'student' : activeSubTab === 'teachers' ? 'teacher' : 'admin');
        if (yearFilter   !== 'All') params.set('year',   yearFilter);
        if (streamFilter !== 'All') params.set('stream', streamFilter);
        const res = await fetch(`/api/admin/users/?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUsers(data.users || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [activeSubTab, yearFilter, streamFilter]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.id?.toString().toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const showYearStreamFilters = activeSubTab === 'students' || activeSubTab === 'teachers';

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

  const simulateCsvUpload = (file) => {
    setUploadStatus({ type: 'loading', msg: `Uploading ${file.name}...` });
    // POST to /api/admin/users/bulk/
    setTimeout(() => {
      setUploadStatus({ type: 'success', msg: 'CSV Processed! Users added successfully.' });
      setTimeout(() => setUploadStatus(null), 4000);
    }, 2000);
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to deactivate user ${id}?`)) {
      setUsers(users.map(u => u.id === id ? { ...u, status: 'inactive' } : u));
      // TODO: PATCH /api/admin/users/{id}/deactivate/
    }
  };

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">

      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg">
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 w-full lg:w-auto overflow-x-auto">
          {[
            { key: 'students', label: 'Manage Students' },
            { key: 'teachers', label: 'Manage Teachers' },
            { key: 'admins',   label: 'Manage Admins' },
            { key: 'hods',     label: 'Manage HODs' },
            { key: 'mentors',  label: 'Manage Mentors' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveSubTab(tab.key); setYearFilter('All'); setStreamFilter('All'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeSubTab === tab.key ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
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

      {/* Filters Bar (Year + Stream + Search) */}
      {showYearStreamFilters && (
        <div className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">Filter:</span>

          {/* Search */}
          <div className="relative">
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search name / email / ID..."
              className="bg-slate-900/60 text-white/80 rounded-xl pl-9 pr-4 py-2 text-xs border border-white/10 focus:border-blue-500 outline-none w-48 transition-colors"
            />
          </div>

          {/* Year filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Year:</span>
            <div className="flex bg-slate-900/60 p-0.5 rounded-lg border border-white/10">
              {['All', ...YEARS].map(y => (
                <button key={y} onClick={() => setYearFilter(y)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${yearFilter === y ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}>
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Stream filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Stream:</span>
            <select
              value={streamFilter}
              onChange={e => setStreamFilter(e.target.value)}
              className="bg-slate-900/60 text-white/80 rounded-xl px-3 py-2 text-xs border border-white/10 focus:border-blue-500 outline-none appearance-none cursor-pointer"
            >
              <option value="All">All Streams</option>
              {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {(yearFilter !== 'All' || streamFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => { setYearFilter('All'); setStreamFilter('All'); setSearchQuery(''); }}
              className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

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
                {uploadStatus.type === 'error'   && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>}
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
                  {showYearStreamFilters && <th className="p-4 font-medium">Year / Stream</th>}
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400 mx-auto"></div>
                  </td></tr>
                ) : filteredUsers.length > 0 ? filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                    <td className="p-4 font-mono text-sm text-white/80">{user.id}</td>
                    <td className="p-4 font-bold">{user.name}</td>
                    <td className="p-4 text-sm text-white/60">{user.email}</td>
                    {showYearStreamFilters && (
                      <td className="p-4 text-sm text-white/50">
                        {user.year && <span className="mr-2 text-xs bg-white/10 px-2 py-0.5 rounded-md font-mono">{user.year}</span>}
                        {user.stream && <span className="text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-md">{user.stream}</span>}
                      </td>
                    )}
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
                        {user.role !== 'student' && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={user.status === 'inactive'}
                            className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Deactivate"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-white/40">
                      {loading ? '' : 'No users found. Data will appear after API integration.'}
                    </td>
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
                  <label className="block text-sm text-white/60 mb-1 ml-1">Stream</label>
                  <select className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500 appearance-none">
                    <option value="">—</option>
                    {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1 ml-1">Year</label>
                <select className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-600 focus:border-blue-500 appearance-none">
                  <option value="">—</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-slate-900 px-6 py-4 flex justify-end gap-3 border-t border-slate-700">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-white/70 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { alert('User added successfully!'); setIsAddModalOpen(false); }}
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
