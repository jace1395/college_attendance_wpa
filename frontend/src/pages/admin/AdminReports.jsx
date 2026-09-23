import React, { useState, useEffect } from 'react';
import { exportData } from '../../utils/apiUtils';
import apiClient from '../../services/apiClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const AdminReports = () => {
  const [role, setRole] = useState('');
  const [stream, setStream] = useState('');
  const [dateRange, setDateRange] = useState('monthly');
  const [isExporting, setIsExporting] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const [loadingGraph, setLoadingGraph] = useState(true);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupFormat, setBackupFormat] = useState('excel');

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const { data } = await apiClient.get('/api/admin/reports/graph-data/');
        setGraphData(data);
      } catch (err) {
        console.error('Failed to load graph data', err);
      } finally {
        setLoadingGraph(false);
      }
    };
    fetchGraphData();
  }, []);

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/api/reports/global/', { 
        params: { role, stream, dateRange, export_format: format },
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system_report.${format === 'excel' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report', err);
    } finally {
      setIsExporting(false);
      setShowBackupModal(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Visual Overview Card */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl h-[400px]">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white mb-6">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          Overall Attendance by Stream (%)
        </h2>
        
        {loadingGraph ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff50" axisLine={false} tickLine={false} />
              <YAxis stroke="#ffffff50" axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Export Reports Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Global System Reports
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <option value="BCom">BCom</option>
              <option value="BBA">BBA</option>
              <option value="BBA(FS)">BBA(FS)</option>
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
              onClick={() => setShowBackupModal(true)}
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50 min-w-35 flex items-center gap-2"
            >
              {isExporting ? 'Generating...' : 'Download Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Download Report</h3>
              <button onClick={() => setShowBackupModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Select the format for the system report.</p>

              <div className="space-y-3">
                {[
                  { id: 'excel', label: 'Excel (.xlsx)', desc: 'Grouped into sheets by Stream' },
                  { id: 'pdf', label: 'PDF Report (.pdf)', desc: 'Formatted tabular report' },
                  { id: 'csv', label: 'CSV (.csv)', desc: 'Raw data suitable for scripts' }
                ].map(format => (
                  <label key={format.id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${backupFormat === format.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}>
                    <input
                      type="radio"
                      name="format"
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-full"
                      checked={backupFormat === format.id}
                      onChange={() => setBackupFormat(format.id)}
                    />
                    <div>
                      <span className={`block font-semibold text-sm ${backupFormat === format.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>{format.label}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{format.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExport(backupFormat === 'excel' ? 'xlsx' : backupFormat)}
                  disabled={isExporting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isExporting ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    "Download"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
