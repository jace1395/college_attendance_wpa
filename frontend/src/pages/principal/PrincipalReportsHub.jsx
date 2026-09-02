import React, { useState, useMemo } from "react";

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

const STUDENTS_BY_PROGRAMME = {
  BCom: [
    { roll: "BC001", name: "Aarav Sharma",    year: "FY", total: 80, attended: 75, absent: 5  },
    { roll: "BC002", name: "Priya Naik",      year: "SY", total: 80, attended: 65, absent: 15 },
    { roll: "BC003", name: "Rohit Dessai",    year: "FY", total: 80, attended: 79, absent: 1  },
    { roll: "BC004", name: "Sneha Vernekar",  year: "TY", total: 80, attended: 56, absent: 24 },
    { roll: "BC005", name: "Kiran Kamat",     year: "SY", total: 80, attended: 80, absent: 0  },
    { roll: "BC006", name: "Megha Shirodkar", year: "TY", total: 80, attended: 60, absent: 20 },
    { roll: "BC007", name: "Suraj Gawas",     year: "FY", total: 80, attended: 72, absent: 8  },
    { roll: "BC008", name: "Tanvi Lotlikar",  year: "SY", total: 80, attended: 38, absent: 42 },
    { roll: "BC009", name: "Akash Parsekar",  year: "TY", total: 80, attended: 77, absent: 3  },
    { roll: "BC010", name: "Pallavi Amonkar", year: "FY", total: 80, attended: 68, absent: 12 },
  ],
  BCA: [
    { roll: "CA001", name: "Nikhil Parab",    year: "FY", total: 80, attended: 78, absent: 2  },
    { roll: "CA002", name: "Riya Shenvi",     year: "SY", total: 80, attended: 70, absent: 10 },
    { roll: "CA003", name: "Dev Malvankar",   year: "TY", total: 80, attended: 80, absent: 0  },
    { roll: "CA004", name: "Pooja Nayak",     year: "FY", total: 80, attended: 50, absent: 30 },
    { roll: "CA005", name: "Arnav Chari",     year: "SY", total: 80, attended: 76, absent: 4  },
    { roll: "CA006", name: "Manasi Kholkar",  year: "TY", total: 80, attended: 62, absent: 18 },
    { roll: "CA007", name: "Tushar Bhandari", year: "FY", total: 80, attended: 80, absent: 0  },
    { roll: "CA008", name: "Aditi Gaonkar",   year: "SY", total: 80, attended: 40, absent: 40 },
  ],
  BVoc: [
    { roll: "BV001", name: "Vikram Sinai",     year: "FY", total: 80, attended: 74, absent: 6  },
    { roll: "BV002", name: "Anjali Fernandes", year: "SY", total: 80, attended: 60, absent: 20 },
    { roll: "BV003", name: "Sagar Naik",       year: "TY", total: 80, attended: 78, absent: 2  },
    { roll: "BV004", name: "Deepika Fal",      year: "FY", total: 80, attended: 55, absent: 25 },
    { roll: "BV005", name: "Harish Raikar",    year: "SY", total: 80, attended: 80, absent: 0  },
    { roll: "BV006", name: "Smita Sawant",     year: "TY", total: 80, attended: 66, absent: 14 },
  ],
  BBA: [
    { roll: "BA001", name: "Rahul Gawade",    year: "FY", total: 80, attended: 73, absent: 7  },
    { roll: "BA002", name: "Neha Borkar",     year: "SY", total: 80, attended: 69, absent: 11 },
    { roll: "BA003", name: "Arjun Naik",      year: "TY", total: 80, attended: 79, absent: 1  },
    { roll: "BA004", name: "Shruti Dessai",   year: "FY", total: 80, attended: 52, absent: 28 },
    { roll: "BA005", name: "Vivek Parsekar",  year: "SY", total: 80, attended: 80, absent: 0  },
    { roll: "BA006", name: "Kavya Shirodkar", year: "TY", total: 80, attended: 58, absent: 22 },
    { roll: "BA007", name: "Omkar Tari",      year: "FY", total: 80, attended: 77, absent: 3  },
    { roll: "BA008", name: "Leena Bhosle",    year: "SY", total: 80, attended: 45, absent: 35 },
    { roll: "BA009", name: "Pratik Velip",    year: "TY", total: 80, attended: 76, absent: 4  },
  ],
  "BBA(FS)": [
    { roll: "FS001", name: "Gaurav Hegde",   year: "FY", total: 80, attended: 71, absent: 9  },
    { roll: "FS002", name: "Roshni Kamat",   year: "SY", total: 80, attended: 68, absent: 12 },
    { roll: "FS003", name: "Nitin Lotlikar", year: "TY", total: 80, attended: 77, absent: 3  },
    { roll: "FS004", name: "Sanika Fal",     year: "FY", total: 80, attended: 54, absent: 26 },
    { roll: "FS005", name: "Yash Amonkar",   year: "SY", total: 80, attended: 80, absent: 0  },
  ],
};

const CLASS_DATA_BY_PROGRAMME = {
  BCom: [
    { id: 1, class: "FY BCom", subject: "Accountancy",    total: 60, present: 54, absent: 6  },
    { id: 2, class: "SY BCom", subject: "Economics",       total: 58, present: 46, absent: 12 },
    { id: 3, class: "TY BCom", subject: "Business Law",    total: 55, present: 48, absent: 7  },
  ],
  BCA: [
    { id: 4, class: "FY BCA",  subject: "Mathematics",     total: 52, present: 50, absent: 2  },
    { id: 5, class: "SY BCA",  subject: "Data Structures", total: 50, present: 40, absent: 10 },
    { id: 6, class: "TY BCA",  subject: "Cloud Computing", total: 48, present: 45, absent: 3  },
  ],
  BVoc: [
    { id: 7, class: "FY BVoc", subject: "Web Development",    total: 45, present: 40, absent: 5  },
    { id: 8, class: "SY BVoc", subject: "Software Eng.",      total: 45, present: 33, absent: 12 },
    { id: 9, class: "TY BVoc", subject: "Project Management", total: 42, present: 39, absent: 3  },
  ],
  BBA: [
    { id: 10, class: "FY BBA", subject: "Marketing",     total: 45, present: 20, absent: 25 },
    { id: 11, class: "SY BBA", subject: "Finance",       total: 44, present: 38, absent: 6  },
    { id: 12, class: "TY BBA", subject: "HR Management", total: 43, present: 41, absent: 2  },
  ],
  "BBA(FS)": [
    { id: 13, class: "FY BBA(FS)", subject: "Financial Mkt.", total: 30, present: 27, absent: 3 },
    { id: 14, class: "SY BBA(FS)", subject: "Banking",         total: 28, present: 20, absent: 8 },
    { id: 15, class: "TY BBA(FS)", subject: "Insurance",       total: 27, present: 24, absent: 3 },
  ],
};

const ChevronDown = () => (
  <svg className="w-4 h-4 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

const StatCard = ({ label, value, icon, colorClass, accent, onClick }) => (
  <div
    onClick={onClick}
    className={"flex flex-col gap-2 rounded-2xl p-5 border " + colorClass + " flex-1 min-w-[120px] relative overflow-hidden " + (onClick ? "cursor-pointer hover:brightness-110 transition-all" : "")}
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
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const allStudents    = STUDENTS_BY_PROGRAMME[activeProg] || [];
  const totalEnrolled  = allStudents.length;

  const filteredStudents = useMemo(() => {
    let list = allStudents;
    if (year) {
      const abbr = { "First Year": "FY", "Second Year": "SY", "Third Year": "TY" }[year] || "";
      if (abbr) list = list.filter(s => s.year === abbr);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q));
    }
    return list;
  }, [allStudents, year, searchQuery]);

  const classData = CLASS_DATA_BY_PROGRAMME[activeProg] || [];

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

  const handleExport = (format) => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      const blob = new Blob(["Mock " + format.toUpperCase() + " data for " + activeProg], { type: "text/plain" });
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "attendance_report_" + activeProg + "_" + new Date().getTime() + "." + format;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">

      {/* PROGRAMME TABS */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 pt-4 pb-5 shadow-xl">
        <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-3">Select Programme</p>
        <div className="flex flex-wrap gap-2">
          {programmes.map(prog => {
            const col = PROGRAMME_COLORS[prog] || PROGRAMME_COLORS["BCom"];
            const isActive = activeProg === prog;
            const count = (STUDENTS_BY_PROGRAMME[prog] || []).length;
            return (
              <button
                key={prog}
                onClick={() => handleProgChange(prog)}
                className={"relative flex flex-col items-center gap-0.5 rounded-xl px-5 py-3 font-bold text-sm transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-white/20 " + (
                  isActive
                    ? "bg-gradient-to-br " + col.tab + " text-white border-transparent shadow-lg scale-105"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="text-sm font-extrabold tracking-wide">{prog}</span>
                <span className={"text-xs font-medium " + (isActive ? "text-white/80" : "text-white/30")}>
                  {count} students
                </span>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></div>
            </div>
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
            className={"h-full rounded-full transition-all duration-700 " + (pctGood ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-red-500 to-orange-400")}
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
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all disabled:opacity-40 whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              {isExporting ? "Exporting..." : "Export PDF"}
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-green-500/15 text-green-300 border border-green-500/30 hover:bg-green-500/25 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all disabled:opacity-40 whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,3.5L18.5,9H13V3.5M8,11H11V13H8V11M8,15H11V17H8V15M12,11H16V13H12V11M12,15H16V17H12V15Z"/>
              </svg>
              {isExporting ? "Exporting..." : "Export Excel"}
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

    </div>
  );
};

export default PrincipalReportsHub;
