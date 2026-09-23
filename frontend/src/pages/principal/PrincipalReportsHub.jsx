import React, { useState, useEffect, useMemo } from "react";
import apiClient from '../../services/apiClient';

const getCurrentSemester = () => {
  const month = new Date().getMonth() + 1;
  return month >= 6 && month <= 11 ? "odd" : "even";
};

const getAvailableSemesters = (yearLabel) => {
  const period = getCurrentSemester();
  const allSems = {
    "First Year":  { odd: ["Semester 1"], even: ["Semester 1", "Semester 2"] },
    "Second Year": { odd: ["Semester 3"], even: ["Semester 3", "Semester 4"] },
    "Third Year":  { odd: ["Semester 5"], even: ["Semester 5", "Semester 6"] },
  };
  return (allSems[yearLabel] || {})[period] || [];
};

const getCurrentSemesterLabel = (yearLabel) => {
  const period = getCurrentSemester();
  const current = {
    "First Year":  { odd: "Semester 1", even: "Semester 2" },
    "Second Year": { odd: "Semester 3", even: "Semester 4" },
    "Third Year":  { odd: "Semester 5", even: "Semester 6" },
  };
  return (current[yearLabel] || {})[period] || "";
};

const ALLOWED_PROGRAMMES = ["BCom", "BCA", "BVoc", "BBA", "BBA(FS)"];

const PROGRAMME_COLORS = {
  BCom:      { tab: "from-violet-600 to-purple-600",  pill: "bg-violet-500/20 border-violet-500/40 text-violet-300", accent: "#8b5cf6" },
  BCA:       { tab: "from-sky-600 to-blue-600",        pill: "bg-sky-500/20 border-sky-500/40 text-sky-300",         accent: "#0ea5e9" },
  BVoc:      { tab: "from-emerald-600 to-teal-600",    pill: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300", accent: "#10b981" },
  BBA:       { tab: "from-amber-600 to-orange-600",    pill: "bg-amber-500/20 border-amber-500/40 text-amber-300",   accent: "#f59e0b" },
  "BBA(FS)": { tab: "from-rose-600 to-pink-600",       pill: "bg-rose-500/20 border-rose-500/40 text-rose-300",      accent: "#f43f5e" },
};

const ChevronDown = () => (
  <svg className="w-4 h-4 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

const StatCard = ({ label, value, icon, colorClass, accent, onClick }) => (
  <div
    onClick={onClick}
    className={"flex flex-col gap-2 rounded-2xl p-5 border " + colorClass + " flex-1 min-w-[120px] relative overflow-hidden " + (onClick ? "cursor-pointer hover:brightness-110 " : "")}
    style={{ boxShadow: accent ? "0 0 24px " + accent + "22" : undefined }}
  >
    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 blur-2xl"
      style={{ background: accent || "white" }} />
    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent ? accent + "33" : "rgba(255,255,255,0.1)" }}>
      {icon}
    </div>
    <span className="text-3xl font-extrabold text-white leading-none tracking-tight">{value}</span>
    <span className="text-xs text-white/50 uppercase tracking-widest font-semibold">{label}</span>
  </div>
);

const PrincipalReportsHub = ({ streams, onNavigateToView }) => {
  const programmes = ALLOWED_PROGRAMMES;

  const [activeProg, setActiveProg]   = useState(programmes[0]);
  const [year, setYear]               = useState("");
  const [semester, setSemester]       = useState("");
  const [dateRange, setDateRange]     = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd]     = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupFormat, setBackupFormat] = useState('excel');

  const [hubData, setHubData] = useState({ class_data: [], students: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHubData = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (activeProg) queryParams.append('programme', activeProg);
        if (year) queryParams.append('year', year);
        if (dateRange) queryParams.append('dateRange', dateRange);
        
        const { data } = await apiClient.get(`/api/principal/reports-hub/?${queryParams.toString()}`);
        setHubData(data);
      } catch (err) {
        console.error("Failed to load reports hub data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHubData();
  }, [activeProg, year, dateRange, customStart, customEnd]);

  const yearsOptions = ["First Year", "Second Year", "Third Year"];

  const handleYearChange = (y) => {
    setYear(y);
    setSemester(getCurrentSemesterLabel(y));
  };

  const availableSemesters = useMemo(() => getAvailableSemesters(year), [year]);

  const handleProgChange = (prog) => {
    setActiveProg(prog);
    setYear("");
    setSemester("");
    setSearchQuery("");
  };

  const allStudents    = hubData.students || [];
  const totalEnrolled  = allStudents.length;

  const filteredStudents = useMemo(() => {
    let list = allStudents;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q));
    }
    return list;
  }, [allStudents, searchQuery]);

  const classData = hubData.class_data || [];

  const summary = useMemo(() => {
    const total   = filteredStudents.reduce((s, d) => s + d.total, 0);
    const present = filteredStudents.reduce((s, d) => s + d.attended, 0);
    const absent  = filteredStudents.reduce((s, d) => s + d.absent, 0);
    const pct     = total ? ((present / total) * 100).toFixed(1) : "0.0";
    return { total, present, absent, pct };
  }, [filteredStudents]);

  const progColor  = PROGRAMME_COLORS[activeProg] || PROGRAMME_COLORS["BCom"];
  const pctBar     = summary.total ? ((summary.present / summary.total) * 100) : 0;
  const pctGood    = parseFloat(summary.pct) >= 75;

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/api/reports/global/', { 
        params: { stream: activeProg, dateRange, export_format: format },
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `principal_report_${activeProg}_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : format}`);
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
    <div className="flex flex-col gap-5 ">

      {/* PROGRAMME TABS */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 pt-4 pb-5 shadow-xl">
        <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-3">Select Programme</p>
        <div className="flex flex-wrap gap-2">
          {programmes.map(prog => {
            const col = PROGRAMME_COLORS[prog] || PROGRAMME_COLORS["BCom"];
            const isActive = activeProg === prog;
            return (
              <button
                key={prog}
                onClick={() => handleProgChange(prog)}
                className={"relative flex flex-col items-center gap-0.5 rounded-xl px-5 py-3 font-bold text-sm   border focus:outline-none focus:ring-2 focus:ring-white/20 " + (
                  isActive
                    ? "bg-gradient-to-br " + col.tab + " text-white border-transparent shadow-lg "
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="text-sm font-extrabold tracking-wide">{prog}</span>
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-white/70" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 pt-4 pb-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h2 className="text-sm font-bold text-white/90">Filters</h2>
          <span className={"ml-1 text-xs font-bold px-2.5 py-0.5 rounded-full border " + progColor.pill}>{activeProg}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">Year / Class</label>
            <div className="relative">
              <select
                value={year}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full bg-slate-900/80 text-white/90 rounded-xl px-4 py-2.5 pr-9 outline-none border border-white/10 focus:border-blue-500/70 appearance-none text-sm cursor-pointer"
              >
                <option value="">All Years</option>
                {yearsOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">
              Semester {year && <span className="text-purple-400 normal-case font-normal">(up to current)</span>}
            </label>
            <div className="relative">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                disabled={!year}
                className={"w-full bg-slate-900/80 text-white/90 rounded-xl px-4 py-2.5 pr-9 outline-none border border-white/10 appearance-none text-sm " + (!year ? "opacity-40 cursor-not-allowed" : "focus:border-blue-500/70 cursor-pointer")}
              >
                <option value="">All Semesters</option>
                {availableSemesters.map(s => (
                  <option key={s} value={s}>{s}{s === getCurrentSemesterLabel(year) ? " (Current)" : ""}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">Date Range</label>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-slate-900/80 text-white/90 rounded-xl px-4 py-2.5 pr-9 outline-none border border-white/10 focus:border-blue-500/70 appearance-none text-sm cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="semester">Full Semester</option>
                <option value="custom">Custom Range</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></div>
            </div>
            {dateRange === 'custom' && (
              <div className="flex gap-2 mt-1">
                <input type="date" value={customStart} onChange={e => {
                  const val = e.target.value;
                  setCustomStart(val);
                  if (customEnd && new Date(customEnd) < new Date(val)) setCustomEnd(val);
                }}
                  className="flex-1 bg-slate-900/80 text-white/80 text-xs rounded-lg px-3 py-2 border border-white/10 focus:border-blue-500 outline-none" />
                <span className="text-white/30 self-center text-xs">→</span>
                <input type="date" value={customEnd} max={new Date().toISOString().split('T')[0]} onChange={e => {
                  const val = e.target.value;
                  if (customStart && new Date(val) < new Date(customStart)) setCustomEnd(customStart);
                  else setCustomEnd(val);
                }}
                  className="flex-1 bg-slate-900/80 text-white/80 text-xs rounded-lg px-3 py-2 border border-white/10 focus:border-blue-500 outline-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ATTENDANCE OVERVIEW */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 pt-4 pb-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-sm font-bold text-white/90">Attendance Overview</h2>
          <span className={"ml-1 text-xs font-bold px-2.5 py-0.5 rounded-full border " + progColor.pill}>
            {activeProg}{year ? " - " + year : ""}
          </span>
          <span className="ml-auto text-xs text-white/30 capitalize">{dateRange} view</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="Total Enrolled" value={totalEnrolled} colorClass="bg-purple-500/10 border-purple-500/30" accent="#8b5cf6" onClick={onNavigateToView}
            icon={<svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
          />
          <StatCard label="Showing" value={filteredStudents.length} colorClass="bg-blue-500/10 border-blue-500/30" accent="#3b82f6"
            icon={<svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>}
          />
          <StatCard label="Total Classes" value={summary.total} colorClass="bg-slate-500/20 border-slate-500/30" accent="#64748b"
            icon={<svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
          />
          <StatCard label="Attendance %" value={summary.pct + "%"} colorClass={pctGood ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"} accent={pctGood ? "#22c55e" : "#ef4444"}
            icon={pctGood ? <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> : <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}
          />
        </div>

        <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden mb-1">
          <div
            className={"h-full rounded-full   " + (pctGood ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-red-500 to-orange-400")}
            style={{ width: pctBar + "%" }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/30 mt-1 mb-5">
          <span>0%</span>
          <span className={"font-semibold " + (pctGood ? "text-green-400" : "text-red-400")}>{summary.pct}% overall attendance</span>
          <span>100%</span>
        </div>

        <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">Class Breakdown</p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Class</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold text-white/60">Total</th>
                <th className="px-4 py-3 font-semibold text-green-400">Present</th>
                <th className="px-4 py-3 font-semibold text-red-400">Absent</th>
                <th className="px-4 py-3 font-semibold">Att %</th>
              </tr>
            </thead>
            <tbody>
              {classData.map(d => {
                const pct = ((d.present / d.total) * 100).toFixed(1);
                const good = parseFloat(pct) >= 75;
                return (
                  <tr key={d.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white/90">{d.class}</td>
                    <td className="px-4 py-3 text-white/60">{d.subject}</td>
                    <td className="px-4 py-3 text-white/60 font-bold">{d.total}</td>
                    <td className="px-4 py-3 text-green-400 font-bold">{d.present}</td>
                    <td className="px-4 py-3 text-red-400 font-bold">{d.absent}</td>
                    <td className="px-4 py-3">
                      <span className={"px-2.5 py-1 rounded-lg text-xs font-bold " + (good ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT REPORT TABLE */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 pt-4 pb-5 shadow-xl">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-sm font-bold text-white/90">Student Attendance Report</h2>
            <span className={"text-xs font-bold px-2.5 py-0.5 rounded-full border " + progColor.pill}>{activeProg}</span>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative">
              <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search name or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900/80 text-white/90 rounded-xl pl-9 pr-4 py-2 text-sm border border-white/10 focus:border-blue-500/70 outline-none w-48 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowBackupModal(true)}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 px-4 py-2 rounded-xl font-semibold text-xs disabled:opacity-40 whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              {isExporting ? "Generating..." : "Download Report"}
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-3 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500/50"></span>
            &gt;= 75% - Safe
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500/50"></span>
            &lt; 75% - Short Attendance
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold w-8">#</th>
                <th className="px-4 py-3 font-semibold">Roll No.</th>
                <th className="px-4 py-3 font-semibold">Student Name</th>
                <th className="px-4 py-3 font-semibold">Year</th>
                <th className="px-4 py-3 font-semibold text-white/60">Total</th>
                <th className="px-4 py-3 font-semibold text-green-400">Attended</th>
                <th className="px-4 py-3 font-semibold text-red-400">Absent</th>
                <th className="px-4 py-3 font-semibold">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? filteredStudents.map((s, idx) => {
                const pct = ((s.attended / s.total) * 100).toFixed(1);
                const low = parseFloat(pct) < 75;
                return (
                  <tr key={s.roll} className={"border-t border-white/5 transition-colors hover:bg-white/5 " + (low ? "bg-red-900/10" : "")}>
                    <td className="px-4 py-3 text-white/25 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-purple-300 font-semibold text-xs">{s.roll}</td>
                    <td className="px-4 py-3 font-semibold text-white/90">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-white/10 text-white/60 text-xs font-bold px-2 py-0.5 rounded-md">{s.year}</span>
                    </td>
                    <td className="px-4 py-3 text-white/50">{s.total}</td>
                    <td className="px-4 py-3 text-green-400 font-bold">{s.attended}</td>
                    <td className="px-4 py-3 text-red-400 font-bold">{s.absent}</td>
                    <td className="px-4 py-3">
                      <span className={"px-3 py-1 rounded-full text-xs font-bold " + (low ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400")}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="8" className="px-4 py-14 text-center text-white/30 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                      No students match your search or filters.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-xs text-white/40 border-t border-white/10 pt-4 items-center">
          <span>
            Showing <strong className="text-white/70">{filteredStudents.length}</strong> of{" "}
            <strong className="text-white/70">{totalEnrolled}</strong> enrolled students
          </span>
          <span className="text-white/20">|</span>
          <span className="text-green-400">
            Safe (&gt;=75%): <strong>{filteredStudents.filter(s => (s.attended / s.total) * 100 >= 75).length}</strong>
          </span>
          <span className="text-white/20">|</span>
          <span className="text-red-400">
            Short Attendance: <strong>{filteredStudents.filter(s => (s.attended / s.total) * 100 < 75).length}</strong>
          </span>
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

export default PrincipalReportsHub;
