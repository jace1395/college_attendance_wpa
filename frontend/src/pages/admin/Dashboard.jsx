import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/shared/ThemeToggle';

/* ─── Mock Data ──────────────────────────────────────────────────────────── */
const MOCK_STATS = {
  total_students: 3450, total_teachers: 142, active_sessions: 312, last_backup: '2026-08-31 02:00 AM',
};

const MOCK_TEACHERS = [
  { id: 'T001', name: 'Sumit Kumar', email: 'sumit.kumar@vvm.edu.in', dept: 'BVoc', is_hod: false, is_mentor: true, is_timetable: false },
  { id: 'T002', name: 'Anita Desai', email: 'anita.desai@vvm.edu.in', dept: 'BBA', is_hod: true, is_mentor: false, is_timetable: false },
  { id: 'T003', name: 'Rajiv Menon', email: 'rajiv.menon@vvm.edu.in', dept: 'BCA', is_hod: false, is_mentor: false, is_timetable: true },
  { id: 'T004', name: 'Priya Shah', email: 'priya.shah@vvm.edu.in', dept: 'BCom', is_hod: false, is_mentor: true, is_timetable: false },
  { id: 'T005', name: 'Ravi Iyer', email: 'ravi.iyer@vvm.edu.in', dept: 'MCA', is_hod: false, is_mentor: false, is_timetable: false },
];

const MOCK_AUDIT_LOGS = [
  { action: 'User Created', target: '2511011.alice.sdcce@vvm.edu.in', timestamp: '10:15 AM — Today', color: 'bg-green-500' },
  { action: 'System Backup', target: 'DB_Auto_Routine', timestamp: '02:00 AM — Today', color: 'bg-blue-500' },
  { action: 'Role Modified', target: 'sumit.kumar → HOD', timestamp: '04:30 PM — Yesterday', color: 'bg-purple-500' },
  { action: 'Bulk Upload', target: '45 Students Added via CSV', timestamp: '09:00 AM — Yesterday', color: 'bg-yellow-500' },
  { action: 'Batch Archived', target: 'TY BVoc 2022-23', timestamp: '03:15 PM — 2 days ago', color: 'bg-red-500' },
];

/* ─── File Upload Card ───────────────────────────────────────────────────── */
const BulkUploadCard = ({ title, description, acceptedFormats, id, onUpload }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setUploading(true);
    setTimeout(() => { setUploading(false); setDone(true); onUpload?.(f); }, 1200);
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
      <p className="text-white font-black text-sm mb-1">{title}</p>
      <p className="text-white/50 text-xs mb-4">{description}</p>
      <div
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${done ? 'border-green-500/50 bg-green-500/10' : 'border-white/20 hover:border-blue-400/50'}`}
        onClick={() => document.getElementById(`admin-file-${id}`)?.click()}
      >
        <input id={`admin-file-${id}`} type="file" accept={acceptedFormats.join(',')} className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Uploading...
          </div>
        ) : done ? (
          <p className="text-green-400 text-sm font-bold">✓ {file?.name} uploaded</p>
        ) : (
          <div>
            <p className="text-white/40 text-sm">Click to upload</p>
            <p className="text-white/25 text-xs mt-1">{acceptedFormats.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Toggle Switch ──────────────────────────────────────────────────────── */
const Toggle = ({ checked, onChange, id }) => (
  <button
    id={id}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-all focus:outline-none ${checked ? 'bg-blue-600' : 'bg-white/20'}`}
  >
    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

/* ─── Admin Dashboard ────────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState(MOCK_TEACHERS);

  // Forms
  const [userForm, setUserForm] = useState({ name: '', email: '', roll: '', role: 'student' });
  const [batchForm, setBatchForm] = useState({ subject: '', teacher: '', year: '', division: '' });
  const [enrollForm, setEnrollForm] = useState({ student: '', batch: '', action: 'add' });

  // Archive confirm
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  // Notifications
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const toggleRole = (teacherId, role) => {
    setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, [role]: !t[role] } : t));
    const t = teachers.find(t => t.id === teacherId);
    showToast(`${t?.name} — ${role} role toggled`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users & Roles' },
    { key: 'data', label: 'Data Entry' },
    { key: 'danger', label: '⚠ Archive Student' },
  ];

  return (
    <div className="min-h-screen bg-cover bg-fixed text-white pb-16" style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}>
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md fixed pointer-events-none" />
      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-black">ADMIN <span className="text-blue-400">CONSOLE</span></h1>
              <p className="text-white/50 text-xs">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ThemeToggle />
            <button onClick={handleLogout} id="admin-logout-btn" className="px-3 py-2 sm:px-4 bg-red-500/20 text-red-200 hover:bg-red-500/40 rounded-xl border border-red-500/30 text-sm font-bold transition-colors">
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/60 border border-white/10 p-1.5 rounded-2xl w-fit">
          {TABS.map(tab => (
            <button key={tab.key} id={`admin-tab-${tab.key}`} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-white/50 hover:text-white hover:bg-white/5'} ${tab.key === 'danger' ? 'hover:bg-red-600/30 hover:text-red-300' : ''}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Students', value: MOCK_STATS.total_students, color: 'blue', glow: 'shadow-blue-500/10' },
                { label: 'Total Teachers', value: MOCK_STATS.total_teachers, color: 'purple', glow: 'shadow-purple-500/10' },
                { label: 'Active Sessions', value: MOCK_STATS.active_sessions, color: 'green', glow: 'shadow-green-500/15' },
                { label: 'Last Backup', value: 'Today 02:00 AM', color: 'yellow', glow: 'shadow-yellow-500/10' },
              ].map((card, idx) => (
                <div key={idx} className={`bg-white/5 backdrop-blur-xl border border-${card.color}-500/20 rounded-3xl p-6 shadow-xl ${card.glow} relative overflow-hidden group`}>
                  <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${card.color}-500/15 rounded-full blur-xl group-hover:bg-${card.color}-500/25 transition-colors`} />
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">{card.label}</p>
                  {idx === 2 ? (
                    <div className="flex items-center gap-3">
                      <p className="text-4xl font-black text-green-400">{card.value}</p>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                      </span>
                    </div>
                  ) : (
                    <p className={`text-${idx === 3 ? 'xl mt-1' : '4xl'} font-black text-white`}>{card.value}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Audit Log */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                System Audit Trail
              </h3>
              <div className="space-y-3">
                {MOCK_AUDIT_LOGS.map((log, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className={`mt-1.5 w-2.5 h-2.5 rounded-full ${log.color} shadow-lg shrink-0`} />
                      <div>
                        <p className="font-bold text-white text-sm">{log.action}</p>
                        <p className="text-white/50 text-xs">{log.target}</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/30 font-mono mt-2 sm:mt-0">{log.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Users & Roles Tab ─────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-8">
          {/* Cascading Filter */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
              <h3 className="text-base font-black text-white mb-4">Filter Users</h3>
              <div className="flex flex-wrap gap-3">
                <select
                  className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  defaultValue=""
                >
                  <option value="">All Roles</option>
                  <option>Teacher</option>
                  <option>Student</option>
                  <option>HOD</option>
                  <option>Mentor</option>
                  <option>Timetable Incharge</option>
                  <option>Principal</option>
                  <option>Admin</option>
                </select>
                <select
                  className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  defaultValue=""
                >
                  <option value="">All Streams</option>
                  <option>BVoc</option>
                  <option>BCA</option>
                  <option>BCom</option>
                  <option>BBA</option>
                  <option>BBA(FS)</option>
                  <option>MCom</option>
                  <option>LLB</option>
                </select>
                <select
                  className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  defaultValue=""
                >
                  <option value="">All Years</option>
                  <option>FY</option>
                  <option>SY</option>
                  <option>TY</option>
                </select>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors">Apply Filter</button>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm font-bold rounded-xl transition-colors">Clear</button>
              </div>
            </div>

            {/* Bulk Upload Cards */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white mb-4">Bulk Uploads</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <BulkUploadCard id="users" title="Bulk Upload Users" description="Students / Teachers via CSV" acceptedFormats={['.csv', '.xlsx']}
                  onUpload={f => showToast(`Users uploaded: ${f.name}`)} />
                <BulkUploadCard id="timetable" title="Bulk Upload Timetable" description="Master schedule upload" acceptedFormats={['.csv', '.xlsx']}
                  onUpload={f => showToast(`Timetable uploaded: ${f.name}`)} />
                <BulkUploadCard id="mentors" title="Bulk Assign Mentors" description="Roll → Mentor email mapping" acceptedFormats={['.csv', '.xlsx']}
                  onUpload={f => showToast(`Mentors assigned from: ${f.name}`)} />
              </div>
            </div>

            {/* Role Management Table */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white mb-6">Role Management</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="text-xs text-white/40 uppercase tracking-wider border-b border-white/10">
                      <th className="text-left pb-3">Teacher</th>
                      <th className="text-center pb-3">HOD</th>
                      <th className="text-center pb-3">Timetable Incharge</th>
                      <th className="text-center pb-3">Mentor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {teachers.map(t => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 pr-4">
                          <p className="text-white font-bold text-sm">{t.name}</p>
                          <p className="text-white/40 text-xs">{t.dept} · {t.email}</p>
                        </td>
                        <td className="py-4 text-center">
                          <Toggle id={`hod-${t.id}`} checked={t.is_hod} onChange={() => toggleRole(t.id, 'is_hod')} />
                        </td>
                        <td className="py-4 text-center">
                          <Toggle id={`timetable-${t.id}`} checked={t.is_timetable} onChange={() => toggleRole(t.id, 'is_timetable')} />
                        </td>
                        <td className="py-4 text-center">
                          <Toggle id={`mentor-${t.id}`} checked={t.is_mentor} onChange={() => toggleRole(t.id, 'is_mentor')} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Data Entry Tab ────────────────────────────────────────────── */}
        {activeTab === 'data' && (
          <div className="space-y-6">

            {/* Add/Edit User */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white mb-5">Add / Edit User</h3>
              <form onSubmit={e => { e.preventDefault(); showToast(`User ${userForm.name} saved!`); setUserForm({ name: '', email: '', roll: '', role: 'student' }); }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5 font-semibold">Full Name *</label>
                  <input id="user-form-name" required value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5 font-semibold">Email *</label>
                  <input id="user-form-email" required type="email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="user@vvm.edu.in"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5 font-semibold">Roll No (Students only)</label>
                  <input id="user-form-roll" value={userForm.roll} onChange={e => setUserForm(p => ({ ...p, roll: e.target.value }))}
                    placeholder="2511011"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5 font-semibold">Role *</label>
                  <select id="user-form-role" value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="principal">Principal</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" id="save-user-btn" className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-600/20">
                    Save User
                  </button>
                </div>
              </form>
            </div>

            {/* Create Class Batch */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white mb-5">Create Class Batch</h3>
              <form onSubmit={e => { e.preventDefault(); showToast(`Class batch created!`); setBatchForm({ subject: '', teacher: '', year: '', division: '' }); }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5 font-semibold">Subject *</label>
                  <input id="batch-subject" required value={batchForm.subject} onChange={e => setBatchForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="Web Development"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5 font-semibold">Teacher *</label>
                  <select id="batch-teacher" required value={batchForm.teacher} onChange={e => setBatchForm(p => ({ ...p, teacher: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                    <option value="">Select teacher...</option>
                    {MOCK_TEACHERS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5 font-semibold">Academic Year *</label>
                  <input id="batch-year" required value={batchForm.year} onChange={e => setBatchForm(p => ({ ...p, year: e.target.value }))}
                    placeholder="2026-27"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5 font-semibold">Division (Optional)</label>
                  <select id="batch-division" value={batchForm.division} onChange={e => setBatchForm(p => ({ ...p, division: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                    <option value="">None</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" id="create-batch-btn" className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-600/20">
                    Create Batch
                  </button>
                </div>
              </form>
            </div>

            {/* Manual Enrollment */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white mb-5">Manual Enrollment</h3>
              <form onSubmit={e => { e.preventDefault(); showToast(`Student ${enrollForm.action === 'add' ? 'added to' : 'removed from'} batch!`); setEnrollForm({ student: '', batch: '', action: 'add' }); }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5 font-semibold">Student Roll / Email *</label>
                  <input id="enroll-student" required value={enrollForm.student} onChange={e => setEnrollForm(p => ({ ...p, student: e.target.value }))}
                    placeholder="2511011"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5 font-semibold">Class Batch *</label>
                  <input id="enroll-batch" required value={enrollForm.batch} onChange={e => setEnrollForm(p => ({ ...p, batch: e.target.value }))}
                    placeholder="BVC_SEM3_WD"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5 font-semibold">Action *</label>
                  <select id="enroll-action" value={enrollForm.action} onChange={e => setEnrollForm(p => ({ ...p, action: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                    <option value="add">Add Student</option>
                    <option value="remove">Remove Student</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <button type="submit" id="enroll-btn" className={`px-8 py-2.5 font-black rounded-xl transition-all hover:-translate-y-0.5 shadow-lg ${enrollForm.action === 'remove' ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20 text-white' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 text-white'}`}>
                    {enrollForm.action === 'add' ? 'Add to Batch' : 'Remove from Batch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Danger Zone Tab ───────────────────────────────────────────── */}
        {activeTab === 'danger' && (
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <h3 className="text-xl font-black text-red-300">Archive Student</h3>
              </div>
              <p className="text-white/50 text-sm mb-6">Select individual students to archive. This sets <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-amber-300">is_archived = True</code> — they disappear from active lists but data is preserved.</p>

              {/* Student batch-selection */}
              <div className="bg-slate-900/60 border border-red-500/20 rounded-2xl p-5">
                <h4 className="text-white font-black mb-3 text-sm">Select Students to Archive</h4>
                <div className="space-y-2 mb-4">
                  {[
                    { roll: '2511001', name: 'Alice Johnson', stream: 'BVoc', year: 'SY' },
                    { roll: '2411031', name: 'Rahul Mehta', stream: 'LLB', year: 'TY' },
                    { roll: '2311045', name: 'Priya Sharma', stream: 'BBA', year: 'TY' },
                    { roll: '2511008', name: 'Arjun Nair', stream: 'BVoc', year: 'SY' },
                  ].map(s => (
                    <label key={s.roll} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                      <input type="checkbox" className="w-4 h-4 accent-red-500 rounded" />
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">{s.name}</p>
                        <p className="text-white/40 text-xs">{s.roll} · {s.stream} · {s.year}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {!archiveConfirm ? (
                  <button
                    id="archive-btn"
                    onClick={() => setArchiveConfirm(true)}
                    className="px-6 py-2.5 bg-red-600/80 hover:bg-red-600 text-white font-black text-sm rounded-xl border border-red-500 transition-all hover:-translate-y-0.5 shadow-lg shadow-red-600/20"
                  >
                    Archive Selected Students
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-600/20 border border-red-500/40 rounded-xl">
                      <p className="text-red-300 text-sm font-semibold">⚠ Are you sure? Selected students will be archived. Data is preserved.</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        id="archive-confirm-btn"
                        onClick={() => { setArchiveConfirm(false); showToast('Selected students archived. Data preserved.', 'success'); }}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-xl transition-all"
                      >
                        ✓ Confirm Archive
                      </button>
                      <button
                        onClick={() => setArchiveConfirm(false)}
                        className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-black text-sm rounded-xl border border-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
