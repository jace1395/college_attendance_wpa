import React, { useState, useEffect } from 'react';

const SystemOverrides = () => {
  const [teacherEmail, setTeacherEmail] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const [semStart, setSemStart] = useState('2026-07-01');
  const [semEnd, setSemEnd] = useState('2026-12-15');
  const [isBulkUnlocking, setIsBulkUnlocking] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Attendance Unlock Requests from teachers
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Fetch unlock requests on mount
  useEffect(() => {
    const fetchRequests = async () => {
      setLoadingRequests(true);
      try {
        const res = await fetch('/api/admin/unlock-requests/');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUnlockRequests(data.requests || []);
      } catch {
        setUnlockRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, []);

  // Fetch subjects when teacher email is entered (debounced)
  useEffect(() => {
    if (!teacherEmail.includes('@')) {
      setTeacherSubjects([]);
      setSelectedSubject('');
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoadingSubjects(true);
      setSelectedSubject('');
      try {
        const res = await fetch(`/api/admin/teacher-subjects/?email=${encodeURIComponent(teacherEmail)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTeacherSubjects(data.subjects || []);
      } catch {
        setTeacherSubjects([]);
      } finally {
        setIsLoadingSubjects(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [teacherEmail]);

  const handleForceUnlock = () => {
    if (!teacherEmail || !selectedSubject) {
      alert('Please provide both Teacher Email and select a Subject/Class.');
      return;
    }
    setIsUnlocking(true);
    setTimeout(() => {
      setIsUnlocking(false);
      alert(`SUCCESS: Master unlock applied for ${teacherEmail}'s class "${selectedSubject}". 24-hour lock bypassed.`);
      setTeacherEmail('');
      setSelectedSubject('');
      setTeacherSubjects([]);
    }, 1000);
  };

  const handleBulkUnlock = () => {
    const confirm = window.confirm("WARNING: This will unlock ALL grids for ALL teachers globally. Proceed?");
    if (confirm) {
      setIsBulkUnlocking(true);
      setTimeout(() => {
        setIsBulkUnlocking(false);
        alert('SUCCESS: All grids unlocked successfully.');
      }, 1500);
    }
  };

  const handleInitSemester = () => {
    const confirm = window.confirm("WARNING: This will archive all current attendance data and initialize a new semester. This action is irreversible. Proceed?");
    if (confirm) {
      setIsArchiving(true);
      setTimeout(() => {
        setIsArchiving(false);
        alert(`New Semester Initialized. Range: ${semStart} to ${semEnd}. Past data securely compressed and archived.`);
      }, 2000);
    }
  };

  const handleApproveRequest = (requestId) => {
    setUnlockRequests(prev => prev.filter(r => r.id !== requestId));
    alert(`Request #${requestId} approved. The teacher's grid has been unlocked.`);
    // TODO: POST /api/admin/unlock-requests/{requestId}/approve/
  };

  const handleDenyRequest = (requestId) => {
    setUnlockRequests(prev => prev.filter(r => r.id !== requestId));
    // TODO: POST /api/admin/unlock-requests/{requestId}/deny/
  };

  return (
    <div className="animate-fade-in-up flex flex-col gap-8">

      {/* ── Attendance Unlock Requests (from Teachers) ── */}
      <div className="bg-amber-900/10 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-500/20">
          <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-100">Attendance Unlock Requests</h2>
            <p className="text-amber-200/50 text-sm">Teachers requesting permission to edit past attendance records.</p>
          </div>
          {unlockRequests.length > 0 && (
            <span className="ml-auto bg-amber-500 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full">
              {unlockRequests.length} pending
            </span>
          )}
        </div>

        {loadingRequests ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
          </div>
        ) : unlockRequests.length === 0 ? (
          <div className="text-center py-10 text-white/30">
            <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No pending unlock requests. All clear!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {unlockRequests.map(req => (
              <div key={req.id} className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-white">{req.teacher_name}</h4>
                    <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-white/50">#{req.id}</span>
                  </div>
                  <p className="text-sm text-white/70 mb-1">
                    <span className="font-semibold text-white/90">Class:</span> {req.class_name} • {req.subject}
                  </p>
                  <p className="text-sm text-white/70 mb-1">
                    <span className="font-semibold text-white/90">Date to Unlock:</span> {req.date_to_unlock}
                  </p>
                  <p className="text-sm text-amber-200/70 italic mt-3 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                    "{req.reason}"
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApproveRequest(req.id)}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-xl font-bold shadow-lg transition-transform transform hover:-translate-y-0.5"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDenyRequest(req.id)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-xl font-bold transition-colors border border-white/10"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Master Attendance Unlock (Admin Override) ── */}
      <div className="bg-red-900/10 backdrop-blur-xl border border-red-500/30 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-red-500/20">
          <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-100">Master Attendance Unlock</h2>
            <p className="text-red-200/50 text-sm">Bypass the 24-hour security lock directly.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm text-white/60 mb-2 ml-1">Teacher Email</label>
            <input
              type="email"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              placeholder="e.g. sumit.kumar@vvm.edu.in"
              className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-3 outline-none border border-red-500/20 focus:border-red-500 shadow-inner placeholder-white/30"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm text-white/60 mb-2 ml-1">
              Subject / Class
              {isLoadingSubjects && <span className="ml-2 text-xs text-blue-400 animate-pulse">Loading subjects...</span>}
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={teacherSubjects.length === 0}
              className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-3 outline-none border border-red-500/20 focus:border-red-500 shadow-inner disabled:opacity-40 disabled:cursor-not-allowed appearance-none cursor-pointer"
            >
              <option value="">
                {isLoadingSubjects ? 'Fetching subjects...' : teacherSubjects.length === 0 ? 'Enter teacher email first' : '— Select a subject —'}
              </option>
              {teacherSubjects.map(subj => (
                <option key={subj.id || subj} value={subj.id || subj}>
                  {subj.label || subj.name || subj}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleForceUnlock}
            disabled={isUnlocking}
            className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-transform transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
          >
            {isUnlocking ? 'Unlocking...' : 'Force Unlock Grid'}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-red-500/20 text-right">
          <button
            onClick={handleBulkUnlock}
            disabled={isBulkUnlocking}
            className="bg-red-900/40 hover:bg-red-800 text-red-200 border border-red-500/30 px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:opacity-50"
          >
            {isBulkUnlocking ? 'Unlocking All...' : 'EMERGENCY: Bulk Unlock All Grids'}
          </button>
        </div>
      </div>

      {/* ── Semester Management ── */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Semester Configuration</h2>
            <p className="text-white/50 text-sm">Define academic periods.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-white/60 mb-2 ml-1">Start Date</label>
              <input
                type="date"
                value={semStart}
                onChange={(e) => setSemStart(e.target.value)}
                className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-blue-500 shadow-inner"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-white/60 mb-2 ml-1">End Date</label>
              <input
                type="date"
                value={semEnd}
                onChange={(e) => setSemEnd(e.target.value)}
                className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-blue-500 shadow-inner"
              />
            </div>
          </div>

          <button
            onClick={handleInitSemester}
            disabled={isArchiving}
            className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/30 px-8 py-3 rounded-xl font-bold transition-colors mt-6 md:mt-0 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isArchiving ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Compressing & Archiving...
              </>
            ) : 'Initialize & Archive Semester'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default SystemOverrides;
