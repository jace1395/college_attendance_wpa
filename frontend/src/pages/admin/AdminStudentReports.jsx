import React, { useState, useEffect, useMemo } from "react";

const PROGRAMMES = ["BCom", "BCA", "BVoc", "BBA", "BBA(FS)"];
const DIVISIONS  = ["A", "B", "C", "D"];

const PROG_COLORS = {
  BCom:      "bg-violet-500/20 text-violet-300 border-violet-500/30",
  BCA:       "bg-sky-500/20 text-sky-300 border-sky-500/30",
  BVoc:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  BBA:       "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "BBA(FS)": "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const PctBadge = ({ pct }) => (
  <span className={"text-xs font-bold px-2.5 py-1 rounded-full border " + (pct >= 75 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30")}>
    {typeof pct === 'number' ? pct.toFixed(1) : pct}%
  </span>
);

const MiniBar = ({ pct, good }) => (
  <div className="w-full bg-slate-800/60 rounded-full h-2 overflow-hidden">
    <div className={"h-full rounded-full transition-all duration-500 " + (good ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-red-500 to-orange-400")}
      style={{ width: pct + "%" }} />
  </div>
);

const AdminStudentReports = () => {
  const [progData, setProgData]           = useState([]);
  const [shortAttStudents, setShortAtt]   = useState([]);
  const [loadingProg, setLoadingProg]     = useState(true);
  const [loadingShort, setLoadingShort]   = useState(true);

  // Filters
  const [progFilter, setProgFilter]       = useState("All");
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [search, setSearch]               = useState("");

  // Date range mode
  const [reportMode, setReportMode]       = useState("semester"); // 'semester' | 'custom'
  const [customStart, setCustomStart]     = useState("");
  const [customEnd, setCustomEnd]         = useState("");

  const [exported, setExported]           = useState(false);

  useEffect(() => {
    // Fetch programme-wise summary
    const fetchProg = async () => {
      setLoadingProg(true);
      try {
        const params = new URLSearchParams();
        if (progFilter !== "All") params.set("programme", progFilter);
        if (reportMode === "custom" && customStart) params.set("start", customStart);
        if (reportMode === "custom" && customEnd)   params.set("end",   customEnd);
        const res = await fetch(`/api/admin/reports/programme-summary/?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProgData(data.results || []);
      } catch {
        setProgData([]);
      } finally {
        setLoadingProg(false);
      }
    };

    // Fetch short attendance students
    const fetchShort = async () => {
      setLoadingShort(true);
      try {
        const params = new URLSearchParams();
        if (progFilter !== "All")     params.set("programme", progFilter);
        if (divisionFilter !== "All") params.set("division",  divisionFilter);
        if (reportMode === "custom" && customStart) params.set("start", customStart);
        if (reportMode === "custom" && customEnd)   params.set("end",   customEnd);
        const res = await fetch(`/api/admin/reports/short-attendance/?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setShortAtt(data.students || []);
      } catch {
        setShortAtt([]);
      } finally {
        setLoadingShort(false);
      }
    };

    fetchProg();
    fetchShort();
  }, [progFilter, divisionFilter, reportMode, customStart, customEnd]);

  const totals = useMemo(() => ({
    students: progData.reduce((s, p) => s + (p.total || 0), 0),
    present:  progData.reduce((s, p) => s + (p.present || 0), 0),
    absent:   progData.reduce((s, p) => s + (p.absent || 0), 0),
    avgPct:   progData.length ? (progData.reduce((s, p) => s + (p.avgPct || 0), 0) / progData.length).toFixed(1) : '—',
  }), [progData]);

  const shortCount   = shortAttStudents.filter(s => s.pct < 75).length;
  const filteredShort = shortAttStudents.filter(s => {
    const matchProg  = progFilter     === "All" || s.programme === progFilter;
    const matchDiv   = divisionFilter === "All" || s.division  === divisionFilter;
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.roll?.toLowerCase().includes(search.toLowerCase());
    return matchProg && matchDiv && matchSearch;
  });

  const handleExport = () => {
    if (shortAttStudents.length === 0) { alert('No data to export.'); return; }
    const rows = ["Roll No,Name,Programme,Division,Attendance %",
      ...shortAttStudents.filter(s => s.pct < 75).map(s =>
        `${s.roll},${s.name},${s.programme},${s.division || '—'},${s.pct}`
      )].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "short_attendance_report.csv";
    document.body.appendChild(a); a.click();
    URL.revokeObjectURL(url); document.body.removeChild(a);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-500/20 rounded-xl">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-white/90">Student Attendance Reports</h2>
          <p className="text-xs text-white/40">Programme-wise overview and short attendance tracker</p>
        </div>
      </div>

      {/* Date Range Controls */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <span className="text-sm text-white/60 font-medium">Report Period:</span>
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/10 gap-1">
          {['semester', 'custom'].map(mode => (
            <button key={mode} onClick={() => setReportMode(mode)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${reportMode === mode ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}>
              {mode === 'semester' ? 'Current Semester' : 'Custom Range'}
            </button>
          ))}
        </div>
        {reportMode === 'custom' && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/50">From:</label>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                className="bg-slate-900/60 text-white text-sm rounded-lg px-3 py-1.5 border border-white/10 focus:border-blue-500 outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/50">To:</label>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                className="bg-slate-900/60 text-white text-sm rounded-lg px-3 py-1.5 border border-white/10 focus:border-blue-500 outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Students",       value: totals.students, color: "bg-blue-500/10 border-blue-500/30",   val_color: "text-white" },
          { label: "Avg Attendance",        value: totals.avgPct + (totals.avgPct !== '—' ? "%" : ""), color: "bg-green-500/10 border-green-500/30",  val_color: "text-green-400" },
          { label: "Short Attendance (<75%)", value: shortCount,  color: "bg-red-500/10 border-red-500/30",     val_color: "text-red-400" },
          { label: "Total Absent (classes)", value: totals.absent, color: "bg-amber-500/10 border-amber-500/30", val_color: "text-amber-400" },
        ].map(c => (
          <div key={c.label} className={"rounded-2xl p-5 border " + c.color + " relative overflow-hidden"}>
            <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1">{c.label}</p>
            <p className={"text-3xl font-extrabold tracking-tight " + c.val_color}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Programme-wise Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white/80">Programme-wise Summary</h3>
          {loadingProg && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-400 border-b-2"></div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead><tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
              <th className="px-5 py-3">Programme</th>
              <th className="px-5 py-3 text-white/60">Total</th>
              <th className="px-5 py-3 text-green-400">Present</th>
              <th className="px-5 py-3 text-red-400">Absent</th>
              <th className="px-5 py-3">Avg Att %</th>
              <th className="px-5 py-3">Bar</th>
            </tr></thead>
            <tbody>
              {progData.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-white/30 text-sm">
                  {loadingProg ? 'Loading...' : 'No data available. Data will appear after API integration.'}
                </td></tr>
              ) : progData.map(p => {
                const good = p.avgPct >= 75;
                return (
                  <tr key={p.programme} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3">
                      <span className={"text-xs font-bold px-2.5 py-1 rounded-full border " + (PROG_COLORS[p.programme] || "bg-white/10 text-white/60 border-white/20")}>{p.programme}</span>
                    </td>
                    <td className="px-5 py-3 text-white/60 font-bold">{p.total}</td>
                    <td className="px-5 py-3 text-green-400 font-bold">{p.present}</td>
                    <td className="px-5 py-3 text-red-400 font-bold">{p.absent}</td>
                    <td className="px-5 py-3"><PctBadge pct={p.avgPct} /></td>
                    <td className="px-5 py-3 w-40"><MiniBar pct={p.avgPct} good={good} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Short Attendance Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-white/80">Short Attendance Students</h3>
            <p className="text-xs text-white/40 mt-0.5">Students with attendance below 75%</p>
          </div>
          <div className="ml-auto flex gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
                className="bg-slate-900/80 text-white/80 rounded-xl pl-9 pr-4 py-2 text-xs border border-white/10 focus:border-blue-500/60 outline-none w-40 transition-colors" />
            </div>

            {/* Programme filter */}
            <select value={progFilter} onChange={e => setProgFilter(e.target.value)}
              className="bg-slate-900/80 text-white/80 rounded-xl px-3 py-2 text-xs border border-white/10 focus:border-blue-500/60 outline-none appearance-none cursor-pointer">
              <option value="All">All Programmes</option>
              {PROGRAMMES.map(p => <option key={p}>{p}</option>)}
            </select>

            {/* Division filter */}
            <select value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)}
              className="bg-slate-900/80 text-white/80 rounded-xl px-3 py-2 text-xs border border-white/10 focus:border-blue-500/60 outline-none appearance-none cursor-pointer">
              <option value="All">All Divisions</option>
              {DIVISIONS.map(d => <option key={d}>Div {d}</option>)}
            </select>

            {/* Export CSV */}
            <button onClick={handleExport}
              className={"flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs transition-all border " + (exported ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25")}>
              {exported ? "Exported!" : "Export CSV"}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead><tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
              <th className="px-5 py-3">Roll No</th><th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Programme</th><th className="px-5 py-3">Division</th>
              <th className="px-5 py-3">Attendance</th><th className="px-5 py-3">Bar</th>
            </tr></thead>
            <tbody>
              {loadingShort ? (
                <tr><td colSpan="6" className="px-5 py-10 text-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-400 border-b-2 mx-auto"></div></td></tr>
              ) : filteredShort.length > 0 ? filteredShort.map(s => (
                <tr key={s.roll} className={"border-t border-white/5 transition-colors hover:bg-white/5 " + (s.pct < 75 ? "bg-red-900/10" : "")}>
                  <td className="px-5 py-3 font-mono text-purple-300 text-xs">{s.roll}</td>
                  <td className="px-5 py-3 font-semibold text-white/90">{s.name}</td>
                  <td className="px-5 py-3"><span className={"text-xs font-bold px-2 py-0.5 rounded-md border " + (PROG_COLORS[s.programme] || "bg-white/10 text-white/60 border-white/20")}>{s.programme}</span></td>
                  <td className="px-5 py-3 text-white/60 text-xs font-mono">{s.division || '—'}</td>
                  <td className="px-5 py-3"><PctBadge pct={s.pct} /></td>
                  <td className="px-5 py-3 w-36"><MiniBar pct={s.pct} good={s.pct >= 75} /></td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-white/30 text-sm">
                  No students match the filter. Data appears after API integration.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminStudentReports;