import React, { useState, useEffect, useMemo, useRef } from 'react';
import apiClient from '../../services/apiClient';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const SubjectReports = ({ subject, history }) => {
  const [filter, setFilter] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(''); // for monthly filter: 'YYYY-MM'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const chartScrollRef = useRef(null);

  useEffect(() => {
    if (!subject?.subject_id) return;
    const fetchReport = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/api/reports/student/me/', {
          params: { subject_id: subject.subject_id }
        });
        const chartData = data.chart_data || [];
        setReportData(chartData);

        // Auto-select the most recent month
        if (chartData.length > 0) {
          const sorted = [...chartData].sort((a, b) => b.date.localeCompare(a.date));
          const latestDate = sorted[0].date; // 'YYYY-MM-DD'
          setSelectedMonth(latestDate.slice(0, 7)); // 'YYYY-MM'
        }
      } catch (err) {
        console.error("Failed to fetch report data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [subject?.subject_id]);

  const semesterStartDate = subject?.semesterStartDate || '2026-07-01';
  const semesterEndDate = subject?.semesterEndDate || '2026-12-31';

  // Get all available months from data
  const availableMonths = useMemo(() => {
    const months = new Set(reportData.map(r => r.date.slice(0, 7)));
    return [...months].sort();
  }, [reportData]);

  const handleDateChange = (type, val) => {
    if (val && (val < semesterStartDate || val > semesterEndDate)) {
      alert(`Please select a date within the current semester (${semesterStartDate} to ${semesterEndDate}).`);
      if (type === 'start') setStartDate('');
      else setEndDate('');
      return;
    }
    if (type === 'start') {
      setStartDate(val);
      if (endDate && new Date(endDate) < new Date(val)) {
        setEndDate(val);
      }
    } else {
      if (startDate && new Date(val) < new Date(startDate)) {
        setEndDate(startDate);
      } else {
        setEndDate(val);
      }
    }
  };

  const handleWeeklyClick = (data) => {
    if (data && data.originalRecords && data.originalRecords.length > 0) {
      const dates = data.originalRecords.map(r => new Date(r.rawDate).getTime());
      const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
      const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
      setStartDate(minDate);
      setEndDate(maxDate);
      setFilter('daily');
    }
  };

  const scrollChart = (dir) => {
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
    }
  };

  // Process data for charts
  const chartData = useMemo(() => {
    if (!reportData || reportData.length === 0) return [];
    const sorted = [...reportData].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filter === 'daily') {
      let filtered = sorted;
      if (startDate) filtered = filtered.filter(r => r.date >= startDate);
      if (endDate) filtered = filtered.filter(r => r.date <= endDate);
      return filtered.map(record => ({
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: record.date,
        present: record.present,
        absent: record.absent,
        total: record.present + record.absent
      }));
    }

    if (filter === 'weekly') {
      const weeks = [];
      let currentWeek = [];
      let weekStart = null;
      sorted.forEach((record) => {
        const d = new Date(record.date);
        if (currentWeek.length === 0) weekStart = d;
        const diffDays = Math.floor((d - weekStart) / (1000 * 60 * 60 * 24));
        if (diffDays >= 7) {
          weeks.push([...currentWeek]);
          currentWeek = [record];
          weekStart = d;
        } else {
          currentWeek.push(record);
        }
      });
      if (currentWeek.length > 0) weeks.push(currentWeek);
      return weeks.map(week => {
        const attended = week.reduce((sum, r) => sum + r.present, 0);
        const total = week.reduce((sum, r) => sum + r.present + r.absent, 0);
        const startStr = new Date(week[0].date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        const endStr = new Date(week[week.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        return {
          range: `${startStr} - ${endStr}`,
          percentage: total > 0 ? (attended / total) * 100 : 0,
          attended,
          total,
          originalRecords: week.map(r => ({ ...r, rawDate: r.date }))
        };
      });
    }

    if (filter === 'monthly') {
      let filtered = sorted;
      if (selectedMonth) {
        filtered = filtered.filter(r => r.date.startsWith(selectedMonth));
      }
      const attended = filtered.reduce((sum, r) => sum + r.present, 0);
      const total = filtered.reduce((sum, r) => sum + r.present + r.absent, 0);
      const missed = total - attended;
      const [year, mo] = (selectedMonth || filtered[0]?.date?.slice(0, 7) || '2026-01').split('-');
      const monthName = new Date(parseInt(year), parseInt(mo) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return {
        type: 'pie',
        monthName,
        total,
        attended,
        percentage: total > 0 ? ((attended / total) * 100).toFixed(1) : 0,
        data: [
          { name: 'Attended', value: attended, fill: '#22c55e' },
          { name: 'Missed', value: missed, fill: '#ef4444' }
        ]
      };
    }

    if (filter === 'custom') {
      let filtered = sorted;
      if (startDate) filtered = filtered.filter(r => r.date >= startDate);
      if (endDate) filtered = filtered.filter(r => r.date <= endDate);
      const spanDays = startDate && endDate ? (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) : 0;
      if (spanDays > 30) {
        const attended = filtered.reduce((sum, r) => sum + r.present, 0);
        const total = filtered.reduce((sum, r) => sum + r.present + r.absent, 0);
        const missed = total - attended;
        return {
          type: 'pie',
          monthName: 'Custom Range',
          total,
          attended,
          percentage: total > 0 ? ((attended / total) * 100).toFixed(1) : 0,
          data: [
            { name: 'Attended', value: attended, fill: '#22c55e' },
            { name: 'Missed', value: missed, fill: '#ef4444' }
          ]
        };
      }
      return filtered.map(record => ({
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: record.date,
        present: record.present,
        absent: record.absent,
        total: record.present + record.absent
      }));
    }

    return [];
  }, [reportData, filter, startDate, endDate, selectedMonth]);

  // Summary stats
  const summary = useMemo(() => {
    if (!reportData || reportData.length === 0) return { total: 0, attended: 0, percentage: 0 };
    let filtered = [...reportData];
    if (filter === 'monthly' && selectedMonth) {
      filtered = filtered.filter(r => r.date.startsWith(selectedMonth));
    } else if ((filter === 'custom' || filter === 'daily') && (startDate || endDate)) {
      if (startDate) filtered = filtered.filter(r => r.date >= startDate);
      if (endDate) filtered = filtered.filter(r => r.date <= endDate);
    }
    const total = filtered.reduce((sum, r) => sum + r.present + r.absent, 0);
    const attended = filtered.reduce((sum, r) => sum + r.present, 0);
    return { total, attended, percentage: total > 0 ? ((attended / total) * 100).toFixed(1) : 0 };
  }, [reportData, filter, startDate, endDate, selectedMonth]);

  if (loading) {
    return (
      <div className="animate-fade-in-up flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isDailyOrCustomBar = (filter === 'daily' || filter === 'custom') && Array.isArray(chartData);
  const isWeekly = filter === 'weekly' && Array.isArray(chartData);
  const barWidth = isDailyOrCustomBar ? Math.max(chartData.length * 36, 600) : '100%';

  return (
    <div className="animate-fade-in-up">
      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <span className="text-sm font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Filter By:</span>
        <div className="flex overflow-x-auto whitespace-nowrap gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/5 w-full md:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {['daily', 'weekly', 'monthly'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => setFilter('custom')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'custom' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            Custom
          </button>
        </div>

        {/* Month Selector — shown only for Monthly filter */}
        {filter === 'monthly' && (
          <div className="flex items-center gap-2 ml-0 md:ml-auto bg-slate-900/50 px-3 py-1.5 rounded-xl border border-white/5">
            <svg className="w-4 h-4 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm text-white outline-none cursor-pointer"
            >
              {availableMonths.map(m => {
                const [y, mo] = m.split('-');
                const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return <option key={m} value={m} className="bg-slate-800 text-white">{label}</option>;
              })}
            </select>
          </div>
        )}

        {/* Custom Date Picker */}
        {filter === 'custom' && (
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center ml-0 md:ml-auto bg-slate-900/50 p-2 md:p-1.5 rounded-xl border border-white/5 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-white/40 text-xs">From</span>
              <input type="date" value={startDate} min={semesterStartDate} max={semesterEndDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="bg-transparent text-sm text-white outline-none border-b border-white/20 focus:border-blue-400 px-1 w-full md:w-auto [color-scheme:dark]"
              />
            </div>
            <span className="text-white/40 hidden md:inline">to</span>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-white/40 text-xs">To</span>
              <input type="date" value={endDate} min={semesterStartDate} max={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="bg-transparent text-sm text-white outline-none border-b border-white/20 focus:border-blue-400 px-1 w-full md:w-auto [color-scheme:dark]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mb-6 bg-blue-900/20 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-medium text-blue-100">
          In this period, you attended <strong className="text-white text-2xl mx-1">{summary.attended}/{summary.total}</strong> classes.
        </h3>
        <p className="text-blue-300/70 mt-1">That's an attendance rate of {summary.percentage}% for the selected range.</p>
      </div>

      {/* Chart Panel */}
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Attendance Trend</h3>
          {/* Scroll arrows — only for daily/custom bar charts */}
          {isDailyOrCustomBar && chartData.length > 10 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollChart(-1)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                title="Scroll left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs text-white/40">{chartData.length} days</span>
              <button
                onClick={() => scrollChart(1)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                title="Scroll right"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Monthly Pie Chart */}
        {chartData.type === 'pie' ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-900 dark:text-white">
            <h4 className="text-xl font-bold mb-1">{chartData.monthName}</h4>
            <p className="text-sm text-gray-500 dark:text-white/60 mb-4">{chartData.percentage}% Attendance</p>
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {chartData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : isWeekly ? (
          /* Weekly Bar Chart — fixed width, no scroll needed */
          <div className="h-[300px] text-gray-900 dark:text-white">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: 'currentColor' }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  formatter={(value, name, props) => [`${value.toFixed(1)}% (${props.payload.attended}/${props.payload.total})`, 'Attendance']}
                />
                <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} onClick={handleWeeklyClick} className="cursor-pointer hover:opacity-80" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* Daily / Custom — SCROLLABLE horizontal chart */
          <div className="relative text-gray-900 dark:text-white">
            {/* Fade edges to indicate scrollability */}
            {chartData.length > 10 && (
              <>
                <div className="absolute left-0 top-0 bottom-[28px] w-8 bg-gradient-to-r from-slate-900/60 to-transparent z-10 pointer-events-none rounded-l-xl" />
                <div className="absolute right-0 top-0 bottom-[28px] w-8 bg-gradient-to-l from-slate-900/60 to-transparent z-10 pointer-events-none rounded-r-xl" />
              </>
            )}
            <div
              ref={chartScrollRef}
              className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-white/5"
            >
              <div style={{ width: barWidth, minWidth: '100%' }}>
                <BarChart
                  width={typeof barWidth === 'number' ? barWidth : undefined}
                  height={300}
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'currentColor' }} interval={0} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={false} tickLine={false} axisLine={false} domain={[0, 1]} width={20} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="present" name="Present" fill="#22c55e" radius={[3, 3, 0, 0]} stackId="a" isAnimationActive={false} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[3, 3, 0, 0]} stackId="a" isAnimationActive={false} />
                </BarChart>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectReports;
