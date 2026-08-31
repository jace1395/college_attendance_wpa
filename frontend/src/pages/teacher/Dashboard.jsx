import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/shared/ThemeToggle';

/* ─── Mock Data ──────────────────────────────────────────────────────────── */
const MOCK_TEACHERS = [
  { id: 'T001', name: 'Sumit Kumar', email: 'sumit.kumar@vvm.edu.in', department: 'BVoc' },
  { id: 'T002', name: 'Anita Desai', email: 'anita.desai@vvm.edu.in', department: 'BBA' },
  { id: 'T003', name: 'Rajiv Menon', email: 'rajiv.menon@vvm.edu.in', department: 'BCA' },
  { id: 'T004', name: 'Priya Shah', email: 'priya.shah@vvm.edu.in', department: 'BCom' },
];

const TIME_SLOTS = ['08:15-10:15', '10:15-12:15', '12:15-14:15', '14:15-16:15'];
const CLASSROOMS = ['A101', 'A102', 'B201', 'B202', 'Lab 1', 'Lab 2', 'F101', 'F102'];

const MOCK_DUTIES = [
  { id: 'D001', teacher: 'Sumit Kumar', date: '2026-09-01', slot: '08:15-10:15', room: 'F101' },
  { id: 'D002', teacher: 'Anita Desai', date: '2026-09-01', slot: '10:15-12:15', room: 'A101' },
  { id: 'D003', teacher: 'Rajiv Menon', date: '2026-09-02', slot: '14:15-16:15', room: 'Lab 1' },
];

/* ─── Assign Duty Form ───────────────────────────────────────────────────── */
const AssignDutyModal = ({ teachers, onClose, onAssign }) => {
  const [form, setForm] = useState({ teacher: '', date: '', slot: '', room: '' });
  const [saved, setSaved] = useState(false);

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.teacher || !form.date || !form.slot || !form.room) return;
    onAssign(form);
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-slate-900 border border-white/20 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-sky-600/30 to-blue-600/30 border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Assign Monitoring Duty</h3>
            <p className="text-white/60 text-xs mt-0.5">Fill in all fields to assign</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">
          {saved ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-white font-black text-lg">Duty Assigned!</p>
              <p className="text-white/60 text-sm mt-1">{form.teacher} assigned to {form.room} on {form.date}</p>
              <button onClick={onClose} className="mt-6 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-black transition-colors">Close</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Teacher */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1.5">Teacher *</label>
                <select required value={form.teacher} onChange={e => handleChange('teacher', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500">
                  <option value="">Select a teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.name}>{t.name} ({t.department})</option>)}
                </select>
              </div>
              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1.5">Date *</label>
                <input required type="date" value={form.date} onChange={e => handleChange('date', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500" />
              </div>
              {/* Time Slot */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1.5">Time Slot *</label>
                <select required value={form.slot} onChange={e => handleChange('slot', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500">
                  <option value="">Select time slot...</option>
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* Classroom */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1.5">Classroom *</label>
                <select required value={form.room} onChange={e => handleChange('room', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500">
                  <option value="">Select classroom...</option>
                  {CLASSROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" id="assign-duty-submit-btn"
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-sky-600/20 mt-2">
                Assign Duty
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── File Upload Section ────────────────────────────────────────────────── */
const FileUploadCard = ({ title, description, icon, acceptedFormats, onUpload, id }) => {
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    setUploaded(file.name);
    onUpload?.(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center text-sky-400">
          {icon}
        </div>
        <div>
          <h4 className="text-white font-black">{title}</h4>
          <p className="text-white/50 text-xs">{description}</p>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${dragging ? 'border-sky-400 bg-sky-500/10' : uploaded ? 'border-green-500/50 bg-green-500/10' : 'border-white/20 hover:border-sky-400/50 hover:bg-white/5'}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-input-${id}`)?.click()}
      >
        <input
          id={`file-input-${id}`}
          type="file"
          accept={acceptedFormats.join(',')}
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
        {uploaded ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-green-400 font-bold text-sm">{uploaded}</p>
            <p className="text-white/40 text-xs">Click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            <p className="text-white/50 text-sm">Drag & drop or click to upload</p>
            <p className="text-white/30 text-xs">{acceptedFormats.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Timetable Monitoring Panel ─────────────────────────────────────────── */
const TimetableMonitoringPanel = ({ duties }) => {
  const [counts, setCounts] = useState({});
  const [submitted, setSubmitted] = useState({});

  const handleSubmit = (duty) => {
    const count = parseInt(counts[duty.id] || 0);
    setSubmitted(prev => ({
      ...prev,
      [duty.id]: { count, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
    }));
  };

  const downloadData = Object.entries(submitted).map(([id, s]) => {
    const d = duties.find(x => x.id === id);
    return { Teacher: d?.teacher, Room: d?.room, Slot: d?.slot, Present: s.count, Time: s.time };
  });

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-black text-white mb-4">Monitoring — Live Class Report</h3>
      {duties.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center text-white/40">No duties assigned today.</div>
      )}
      {duties.map(duty => {
        const result = submitted[duty.id];
        return (
          <div key={duty.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-white font-black text-lg">{duty.room}</p>
                <p className="text-white/50 text-sm">{duty.teacher} · <span className="text-sky-300">{duty.slot}</span> · {duty.date}</p>
              </div>
              {result && (
                <div className="flex items-center gap-4 bg-sky-600/20 border border-sky-500/30 rounded-2xl px-4 py-3">
                  <div className="text-center"><p className="text-sky-300 text-xs">Present</p><p className="text-white font-black text-xl">{result.count}</p></div>
                  <div className="text-center"><p className="text-sky-300 text-xs">Reported</p><p className="text-white/80 text-sm font-bold">{result.time}</p></div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number" min="0"
                value={counts[duty.id] || ''}
                onChange={e => setCounts(prev => ({ ...prev, [duty.id]: e.target.value }))}
                placeholder="Enter present count..."
                className="flex-1 max-w-xs bg-slate-800 text-white text-base rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-sky-500 transition-colors"
              />
              <button
                onClick={() => handleSubmit(duty)}
                disabled={!counts[duty.id]}
                className="px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl transition-all hover:-translate-y-0.5 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Submit to Principal
              </button>
            </div>
            {result && (
              <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Report sent at {result.time}
              </p>
            )}
          </div>
        );
      })}
      {Object.keys(submitted).length > 0 && (
        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'monitoring_report.json'; a.click(); URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download Monitoring Report
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Main Timetable Dashboard ───────────────────────────────────────────── */
const TimetableDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [duties, setDuties] = useState(MOCK_DUTIES);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [filterDate, setFilterDate] = useState('');

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filteredDuties = filterDate ? duties.filter(d => d.date === filterDate) : duties;

  const handleAssign = (form) => {
    const newDuty = { id: `D${Date.now()}`, teacher: form.teacher, date: form.date, slot: form.slot, room: form.room };
    setDuties(prev => [...prev, newDuty]);
  };

  return (
    <div className="min-h-screen bg-cover bg-fixed text-white pb-16" style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}>
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md fixed pointer-events-none" />
      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">VVM <span className="text-sky-400">TIMETABLE</span></h1>
            <p className="text-white/50 text-sm mt-0.5">Timetable Incharge Panel</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ThemeToggle />
            <button onClick={handleLogout} id="timetable-logout-btn" className="px-3 py-2 sm:px-4 bg-red-500/20 text-red-200 hover:bg-red-500/40 rounded-xl border border-red-500/30 text-sm font-bold transition-colors">
              Logout
            </button>
          </div>
        </div>

        {/* Profile + Tabs */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-cyan-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
                {(user?.name || 'T')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-black">{user?.name || 'Timetable Incharge'}</h2>
                <p className="text-white/60 text-sm">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-sky-500/30 border border-sky-500/40 rounded-full text-sky-300 text-xs font-bold">Timetable Incharge</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10">
              {['dashboard', 'monitoring', 'timetable management'].map(tab => (
                <button key={tab} id={`timetable-tab-${tab.replace(/ /g, '-')}`} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-sky-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                  {tab === 'monitoring' ? '📊 Monitoring' : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Dashboard Tab ─────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-xl border border-sky-500/20 rounded-3xl p-6 shadow-xl">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Teachers</p>
                <p className="text-4xl font-black text-sky-400">{MOCK_TEACHERS.length}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6 shadow-xl">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Duties Assigned</p>
                <p className="text-4xl font-black text-amber-400">{duties.length}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6 shadow-xl">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Time Slots</p>
                <p className="text-4xl font-black text-green-400">{TIME_SLOTS.length}</p>
              </div>
            </div>

            {/* Recent Duties */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white">Monitoring Duties</h3>
                <button onClick={() => setShowAssignModal(true)} id="open-assign-duty-btn"
                  className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-black rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-sky-600/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Assign Duty
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-white/40 uppercase tracking-wider border-b border-white/10">
                      <th className="text-left pb-3">Teacher</th>
                      <th className="text-center pb-3">Date</th>
                      <th className="text-center pb-3">Time Slot</th>
                      <th className="text-right pb-3">Classroom</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {duties.map(d => (
                      <tr key={d.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 text-white font-bold text-sm">{d.teacher}</td>
                        <td className="py-3 text-center text-white/70 text-sm">{d.date}</td>
                        <td className="py-3 text-center">
                          <span className="px-3 py-1 bg-sky-500/20 border border-sky-500/30 rounded-full text-sky-300 text-xs font-bold">{d.slot}</span>
                        </td>
                        <td className="py-3 text-right text-white/70 text-sm">{d.room}</td>
                      </tr>
                    ))}
                    {duties.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-10 text-white/40">No duties assigned yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Monitoring Tab — live class report ──────────────────────────── */}
        {activeTab === 'monitoring' && (
          <TimetableMonitoringPanel duties={duties} />
        )}
        {activeTab === 'timetable management' && (
          <div className="space-y-8">
            <h3 className="text-xl font-black text-white">Timetable Management</h3>

            {/* Upload Section — only Timetable (Bulk Duties removed) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FileUploadCard
                id="timetable"
                title="Upload Timetable"
                description="Upload the master schedule for the semester"
                acceptedFormats={['.csv', '.xls', '.xlsx']}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                onUpload={(file) => console.log('Timetable uploaded:', file.name)}
              />
            </div>

            {/* Assign Duty form card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-black text-white">Assign Monitoring Duty</h4>
                  <p className="text-white/50 text-sm mt-1">Assign a teacher to monitor a classroom during a specific time slot</p>
                </div>
                <button onClick={() => setShowAssignModal(true)} id="assign-duty-btn"
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-sm rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-sky-600/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Assign Duty
                </button>
              </div>

              {/* Duty filter */}
              <div className="flex items-center gap-3 mb-4">
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                  className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500" />
                {filterDate && (
                  <button onClick={() => setFilterDate('')} className="text-white/50 hover:text-white text-xs px-3 py-2 bg-white/5 rounded-xl border border-white/10 transition-colors">
                    Clear
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-white/40 uppercase tracking-wider border-b border-white/10">
                      <th className="text-left pb-3">Teacher</th>
                      <th className="text-center pb-3">Date</th>
                      <th className="text-center pb-3">Time Slot</th>
                      <th className="text-right pb-3">Classroom</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredDuties.map(d => (
                      <tr key={d.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 text-white font-bold text-sm">{d.teacher}</td>
                        <td className="py-3 text-center text-white/70 text-sm">{d.date}</td>
                        <td className="py-3 text-center">
                          <span className="px-3 py-1 bg-sky-500/20 border border-sky-500/30 rounded-full text-sky-300 text-xs font-bold">{d.slot}</span>
                        </td>
                        <td className="py-3 text-right text-white/70 text-sm">{d.room}</td>
                      </tr>
                    ))}
                    {filteredDuties.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-white/40 text-sm">No duties for this date.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Teacher List */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h4 className="text-lg font-black text-white mb-4">Teacher Directory</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_TEACHERS.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-4 bg-slate-900/40 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center font-black text-sm shadow-md">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{t.name}</p>
                      <p className="text-white/50 text-xs">{t.department} · {t.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {showAssignModal && (
        <AssignDutyModal
          teachers={MOCK_TEACHERS}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
};

export default TimetableDashboard;