import React, { useState, useMemo } from "react";

const PROGRAMMES = ["BCom", "BCA", "BVoc", "BBA", "BBA(FS)"];

const PROG_COLORS = {
  BCom:      "bg-violet-500/20 text-violet-300 border-violet-500/30",
  BCA:       "bg-sky-500/20 text-sky-300 border-sky-500/30",
  BVoc:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  BBA:       "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "BBA(FS)": "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const PROG_DATA = [
  { programme: "BCom",     total: 10, present: 7, absent: 3, avgPct: 71.2 },
  { programme: "BCA",      total: 8,  present: 6, absent: 2, avgPct: 76.5 },
  { programme: "BVoc",     total: 6,  present: 5, absent: 1, avgPct: 72.8 },
  { programme: "BBA",      total: 9,  present: 7, absent: 2, avgPct: 74.1 },
  { programme: "BBA(FS)", total: 5,  present: 4, absent: 1, avgPct: 78.0 },
];

const SHORT_ATT_STUDENTS = [
  { name: "Sneha Vernekar",  roll: "BC004", programme: "BCom",  pct: 70.0 },
  { name: "Tanvi Lotlikar",  roll: "BC008", programme: "BCom",  pct: 47.5 },
  { name: "Pooja Nayak",     roll: "CA004", programme: "BCA",   pct: 62.5 },
  { name: "Aditi Gaonkar",   roll: "CA008", programme: "BCA",   pct: 50.0 },
  { name: "Deepika Fal",     roll: "BV004", programme: "BVoc",  pct: 68.8 },
  { name: "Shruti Dessai",   roll: "BA004", programme: "BBA",   pct: 65.0 },
  { name: "Leena Bhosle",    roll: "BA008", programme: "BBA",   pct: 56.3 },
  { name: "Sanika Fal",      roll: "FS004", programme: "BBA(FS)", pct: 67.5 },
  { name: "Rahul Gawade",    roll: "BA001", programme: "BBA",   pct: 91.3 },
  { name: "Megha Shirodkar", roll: "BC006", programme: "BCom",  pct: 75.0 },
];

const PctBadge = ({ pct }) => (
  <span className={"text-xs font-bold px-2.5 py-1 rounded-full border " + (pct >= 75 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30")}>
    {pct.toFixed(1)}%
  </span>
);

const MiniBar = ({ pct, good }) => (
  <div className="w-full bg-slate-800/60 rounded-full h-2 overflow-hidden">
    <div className={"h-full rounded-full transition-all duration-500 " + (good ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-red-500 to-orange-400")}
      style={{ width: pct + "%" }} />
  </div>
);

const AdminStudentReports = () => {
  const [progFilter, setProgFilter] = useState("All");
  const [search, setSearch]         = useState("");
  const [exported, setExported]     = useState(false);

  const totals = useMemo(() => ({
    students: PROG_DATA.reduce((s, p) => s + p.total, 0),
    present:  PROG_DATA.reduce((s, p) => s + p.present, 0),
    absent:   PROG_DATA.reduce((s, p) => s + p.absent, 0),
    avgPct:   (PROG_DATA.reduce((s, p) => s + p.avgPct, 0) / PROG_DATA.length).toFixed(1),
  }), []);

  const filteredShort = SHORT_ATT_STUDENTS.filter(s => {
    const matchProg = progFilter === "All" || s.programme === progFilter;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.roll.toLowerCase().includes(search.toLowerCase());
    return matchProg && matchSearch;
  });

  const shortCount = SHORT_ATT_STUDENTS.filter(s => s.pct < 75).length;

  const handleExport = () => {
    const rows = ["Roll No,Name,Programme,Attendance %", ...SHORT_ATT_STUDENTS.filter(s => s.pct < 75).map(s => s.roll + "," + s.name + "," + s.programme + "," + s.pct)].join("\n");
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: totals.students, color: "bg-blue-500/10 border-blue-500/30", val_color: "text-white" },
          { label: "Avg Attendance", value: totals.avgPct + "%", color: "bg-green-500/10 border-green-500/30", val_color: "text-green-400" },
          { label: "Short Attendance (<75%)", value: shortCount, color: "bg-red-500/10 border-red-500/30", val_color: "text-red-400" },
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
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="text-sm font-bold text-white/80">Programme-wise Summary</h3>
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
              {PROG_DATA.map(p => {
                const good = p.avgPct >= 75;
                return (
                  <tr key={p.programme} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3">
                      <span className={"text-xs font-bold px-2.5 py-1 rounded-full border " + PROG_COLORS[p.programme]}>{p.programme}</span>
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
              <th className="px-5 py-3">Programme</th><th className="px-5 py-3">Attendance</th>
              <th className="px-5 py-3">Bar</th>
            </tr></thead>
            <tbody>
              {filteredShort.length > 0 ? filteredShort.map(s => (
                <tr key={s.roll} className={"border-t border-white/5 transition-colors hover:bg-white/5 " + (s.pct < 75 ? "bg-red-900/10" : "")}>
                  <td className="px-5 py-3 font-mono text-purple-300 text-xs">{s.roll}</td>
                  <td className="px-5 py-3 font-semibold text-white/90">{s.name}</td>
                  <td className="px-5 py-3"><span className={"text-xs font-bold px-2 py-0.5 rounded-md border " + PROG_COLORS[s.programme]}>{s.programme}</span></td>
                  <td className="px-5 py-3"><PctBadge pct={s.pct} /></td>
                  <td className="px-5 py-3 w-36"><MiniBar pct={s.pct} good={s.pct >= 75} /></td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-white/30 text-sm">No students match the filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminStudentReports;