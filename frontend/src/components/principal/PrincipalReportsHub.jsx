import React, { useState } from 'react';

const PrincipalReportsHub = ({ streams }) => {
  const [stream, setStream] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [dateRange, setDateRange] = useState('monthly');
  const [isExporting, setIsExporting] = useState(false);

  // Mock data mapping
  const yearsOptions = ['First Year', 'Second Year', 'Third Year'];
  const semOptionsMap = {
    'First Year': ['Semester 1', 'Semester 2'],
    'Second Year': ['Semester 3', 'Semester 4'],
    'Third Year': ['Semester 5', 'Semester 6']
  };

  const handleExport = (format) => {
    setIsExporting(true);
    // Simulate API fetch delay
    setTimeout(() => {
        setIsExporting(false);
        // Simulate file download by creating a blob and URL
        const blob = new Blob([`Mock ${format.toUpperCase()} data for ${stream}`], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${stream}_${new Date().getTime()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 1500);
  };

  const mockPreviewData = [
      { id: 1, class: 'SY BVoc(ST)', subject: 'Web Development', present: 45, absent: 5, avg: '90%' },
      { id: 2, class: 'SY BVoc(ST)', subject: 'Software Engineering', present: 38, absent: 12, avg: '76%' },
      { id: 3, class: 'FY BCA', subject: 'Mathematics', present: 50, absent: 2, avg: '96%' },
      { id: 4, class: 'TY BBA', subject: 'Marketing', present: 20, absent: 25, avg: '44%' },
  ].filter(d => {
      // Very loose mock filtering for UI demonstration
      if (stream && !d.class.includes(stream.slice(0,4))) return false;
      return true;
  });

  return (
    <div className="animate-fade-in-up flex flex-col gap-8">
        {/* Cascading Filters */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                Report Filters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/60 font-medium ml-1">Stream</label>
                    <select 
                        value={stream} 
                        onChange={(e) => { setStream(e.target.value); setYear(''); setSemester(''); }}
                        className="bg-slate-900/50 text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-blue-500 appearance-none shadow-inner"
                    >
                        <option value="">Select Stream</option>
                        {streams?.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/60 font-medium ml-1">Year / Class</label>
                    <select 
                        value={year} 
                        onChange={(e) => { setYear(e.target.value); setSemester(''); }}
                        disabled={!stream}
                        className={`bg-slate-900/50 text-white rounded-xl px-4 py-3 outline-none border border-white/10 appearance-none shadow-inner transition-colors ${!stream ? 'opacity-50 cursor-not-allowed' : 'focus:border-blue-500 cursor-pointer'}`}
                    >
                        <option value="">Select Year</option>
                        {yearsOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/60 font-medium ml-1">Semester</label>
                    <select 
                        value={semester} 
                        onChange={(e) => setSemester(e.target.value)}
                        disabled={!year}
                        className={`bg-slate-900/50 text-white rounded-xl px-4 py-3 outline-none border border-white/10 appearance-none shadow-inner transition-colors ${!year ? 'opacity-50 cursor-not-allowed' : 'focus:border-blue-500 cursor-pointer'}`}
                    >
                        <option value="">Select Semester</option>
                        {year && semOptionsMap[year].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/60 font-medium ml-1">Date Range</label>
                    <select 
                        value={dateRange} 
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-slate-900/50 text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-blue-500 appearance-none shadow-inner"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="semester">Full Semester</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Data Preview & Actions */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 flex-1 min-h-[400px]">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold">Data Preview</h2>
                
                {/* Export Action Bar */}
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting || !stream}
                        className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isExporting ? <span className="animate-pulse">Exporting...</span> : 'Export PDF'}
                    </button>
                    <button 
                        onClick={() => handleExport('xlsx')}
                        disabled={isExporting || !stream}
                        className="bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isExporting ? <span className="animate-pulse">Exporting...</span> : 'Export XLSX'}
                    </button>
                    <button 
                        onClick={() => handleExport('csv')}
                        disabled={isExporting || !stream}
                        className="bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isExporting ? <span className="animate-pulse">Exporting...</span> : 'Export CSV'}
                    </button>
                </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-white/50 text-sm">
                            <th className="pb-3 pr-4 font-medium">Class</th>
                            <th className="pb-3 pr-4 font-medium">Subject</th>
                            <th className="pb-3 pr-4 font-medium">Present</th>
                            <th className="pb-3 pr-4 font-medium">Absent</th>
                            <th className="pb-3 font-medium">Avg Attendance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockPreviewData.length > 0 ? mockPreviewData.map(d => (
                            <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 pr-4 font-semibold">{d.class}</td>
                                <td className="py-4 pr-4 text-white/80">{d.subject}</td>
                                <td className="py-4 pr-4 text-green-400">{d.present}</td>
                                <td className="py-4 pr-4 text-red-400">{d.absent}</td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${parseInt(d.avg) >= 75 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {d.avg}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-white/40">Select a Stream to generate report preview.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default PrincipalReportsHub;
