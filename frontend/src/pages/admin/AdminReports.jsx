import React, { useState } from 'react';
import { exportData } from '../../../utils/apiUtils';

const AdminReports = () => {
  const [role, setRole] = useState('');
  const [stream, setStream] = useState('');
  const [dateRange, setDateRange] = useState('monthly');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format) => {
    setIsExporting(true);
    await exportData(format, { role, stream, dateRange }, 'Admin_Global_Report');
    setIsExporting(false);
  };

  return (
    <div className="animate-fade-in-up flex flex-col gap-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Global System Reports
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/60 font-medium ml-1">Target Role</label>
                    <select 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)}
                        className="bg-slate-900/50 text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-blue-500 appearance-none shadow-inner"
                    >
                        <option value="">All Roles</option>
                        <option value="student">Students</option>
                        <option value="teacher">Teachers</option>
                        <option value="principal">Principals / Admins</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/60 font-medium ml-1">Stream / Department</label>
                    <select 
                        value={stream} 
                        onChange={(e) => setStream(e.target.value)}
                        className="bg-slate-900/50 text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-blue-500 appearance-none shadow-inner"
                    >
                        <option value="">All Streams</option>
                        <option value="BVoc">BVoc</option>
                        <option value="BCA">BCA</option>
                        <option value="BBA">BBA</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/60 font-medium ml-1">Date Range</label>
                    <select 
                        value={dateRange} 
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-slate-900/50 text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-blue-500 appearance-none shadow-inner"
                    >
                        <option value="daily">Daily (Today)</option>
                        <option value="weekly">This Week</option>
                        <option value="monthly">This Month</option>
                        <option value="all_time">All Time</option>
                    </select>
                </div>
            </div>

            <div className="border-t border-white/10 mt-4 pt-6 flex flex-wrap gap-4 items-center justify-between">
                <p className="text-white/50 text-sm">Select filters and generate a secure data dump.</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting}
                        className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 min-w-[140px]"
                    >
                        {isExporting ? 'Generating...' : 'Export PDF'}
                    </button>
                    <button 
                        onClick={() => handleExport('xlsx')}
                        disabled={isExporting}
                        className="bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 min-w-[140px]"
                    >
                        {isExporting ? 'Generating...' : 'Export XLSX'}
                    </button>
                    <button 
                        onClick={() => handleExport('csv')}
                        disabled={isExporting}
                        className="bg-white/10 text-white border border-white/20 hover:bg-white/20 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 min-w-[140px]"
                    >
                        {isExporting ? 'Generating...' : 'Export CSV'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminReports;
