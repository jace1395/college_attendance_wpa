import React, { useState } from 'react';

const SystemOverrides = () => {
  const [teacherEmail, setTeacherEmail] = useState('');
  const [classId, setClassId] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const [semStart, setSemStart] = useState('2026-07-01');
  const [semEnd, setSemEnd] = useState('2026-12-15');
  const [isBulkUnlocking, setIsBulkUnlocking] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleForceUnlock = () => {
      if (!teacherEmail || !classId) {
          alert('Please provide both Teacher Email and Class ID.');
          return;
      }
      setIsUnlocking(true);
      // Simulate POST request
      setTimeout(() => {
          setIsUnlocking(false);
          alert(`SUCCESS: Master unlock applied for ${teacherEmail}'s Class ${classId}. 24-hour lock bypassed.`);
          setTeacherEmail('');
          setClassId('');
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

  return (
    <div className="animate-fade-in-up flex flex-col gap-8">
        
        {/* Master Unlock */}
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
                    <label className="block text-sm text-white/60 mb-2 ml-1">Class ID</label>
                    <input 
                        type="text"
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        placeholder="e.g. BVC_SEM3_WD"
                        className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-3 outline-none border border-red-500/20 focus:border-red-500 shadow-inner placeholder-white/30"
                    />
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

        {/* Semester Management */}
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
