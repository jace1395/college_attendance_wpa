import React, { useState, useMemo } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:15-12:15", "12:15-1:15", "2:00-3:00", "3:00-4:00"];
const SUBJECTS = ["Accountancy", "Economics", "Business Law", "Mathematics", "Data Structures", "Cloud Computing", "Web Development", "Marketing", "Finance", "HR Management", "Banking", "Financial Markets"];

const TEACHERS_DATA = [
  { id: 1, name: "Prof. Anita Kamat", dept: "Commerce", schedule: { Monday: ["8:00-9:00", "10:00-11:00"], Tuesday: ["9:00-10:00"], Wednesday: ["11:15-12:15", "2:00-3:00"], Thursday: [], Friday: ["8:00-9:00", "12:15-1:15"], Saturday: ["9:00-10:00"] } },
  { id: 2, name: "Prof. Rajan Shenvi", dept: "Computer Science", schedule: { Monday: ["9:00-10:00", "11:15-12:15"], Tuesday: ["8:00-9:00", "10:00-11:00"], Wednesday: ["9:00-10:00"], Thursday: ["11:15-12:15", "3:00-4:00"], Friday: ["10:00-11:00"], Saturday: [] } },
  { id: 3, name: "Prof. Priya Naik", dept: "Commerce", schedule: { Monday: ["12:15-1:15"], Tuesday: ["11:15-12:15", "2:00-3:00"], Wednesday: ["8:00-9:00", "10:00-11:00"], Thursday: ["9:00-10:00"], Friday: ["11:15-12:15"], Saturday: ["10:00-11:00"] } },
  { id: 4, name: "Prof. Suresh Lotlikar", dept: "Vocational Studies", schedule: { Monday: ["2:00-3:00", "3:00-4:00"], Tuesday: ["12:15-1:15"], Wednesday: ["12:15-1:15", "3:00-4:00"], Thursday: ["8:00-9:00", "10:00-11:00"], Friday: ["9:00-10:00"], Saturday: ["8:00-9:00", "11:15-12:15"] } },
  { id: 5, name: "Prof. Divya Sawant", dept: "Business Admin", schedule: { Monday: [], Tuesday: ["3:00-4:00"], Wednesday: ["11:15-12:15"], Thursday: ["12:15-1:15", "2:00-3:00"], Friday: ["3:00-4:00", "8:00-9:00"], Saturday: ["2:00-3:00"] } },
  { id: 6, name: "Prof. Omkar Borkar", dept: "Financial Services", schedule: { Monday: ["11:15-12:15"], Tuesday: ["8:00-9:00", "12:15-1:15"], Wednesday: ["2:00-3:00", "3:00-4:00"], Thursday: ["10:00-11:00"], Friday: ["12:15-1:15", "2:00-3:00"], Saturday: ["3:00-4:00"] } },
];

const DOT_COLORS = ["bg-violet-400", "bg-sky-400", "bg-emerald-400", "bg-amber-400", "bg-rose-400", "bg-cyan-400"];

const TeacherMonitor = () => {
  const [search, setSearch] = useState("");
  const [dayFilter, setDay] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return TEACHERS_DATA.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.dept.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [search]);

  const totalPeriods = t => Object.values(t.schedule).reduce((s, a) => s + a.length, 0);
  const dayPeriods = (t, d) => t.schedule[d] || [];

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-white/90">Teacher Monir</h3>
          <p className="text-xs text-white/40 mt-0.5">Assigned Teacher a class to Monitor</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teacher or dept..."
              className="bg-slate-900/80 text-white/80 rounded-xl pl-9 pr-4 py-2 text-xs border border-white/10 focus:border-blue-500/60 outline-none w-48 transition-colors" />
          </div>
          <select value={dayFilter} onChange={e => setDay(e.target.value)}
            className="bg-slate-900/80 text-white/80 rounded-xl px-3 py-2 text-xs border border-white/10 outline-none appearance-none cursor-pointer">
            <option value="All">All Days</option>
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TEACHERS_DATA.map((t, i) => {
          const total = totalPeriods(t);
          const dLoad = dayFilter !== "All" ? dayPeriods(t, dayFilter).length : total;
          const busyPct = Math.round((total / (DAYS.length * PERIODS.length)) * 100);
          return (
            <button key={t.id} onClick={() => setSelected(selected?.id === t.id ? null : t)}
              className={"rounded-2xl p-4 border text-left transition-all " + (selected?.id === t.id ? "bg-blue-600/20 border-blue-500/40" : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20")}>
              <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 " + DOT_COLORS[i % DOT_COLORS.length] + "/20"}>
                <span className={DOT_COLORS[i % DOT_COLORS.length].replace("bg-", "text-")}>{t.name.split(" ").map(w => w[0]).slice(1, 3).join("")}</span>
              </div>
              <p className="font-bold text-white/80 text-xs leading-tight truncate">{t.name.split(" ").slice(1).join(" ")}</p>
              <p className="text-white/40 text-xs truncate">{t.dept}</p>
              <p className={"text-xs font-bold mt-2 " + (dayFilter !== "All" ? (dLoad > 3 ? "text-red-400" : "text-green-400") : "text-white/60")}>
                {dayFilter !== "All" ? dLoad + " period" + (dLoad !== 1 ? "s" : "") + " today" : total + " total periods"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Detail Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white/80">
            {selected ? selected.name + " — Schedule" : "All Teachers — Weekly Schedule"}
          </h3>
          {selected && <button onClick={() => setSelected(null)} className="text-xs text-white/40 hover:text-white transition-colors">Show all</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 min-w-[140px]">Teacher</th>
                {(dayFilter !== "All" ? [dayFilter] : DAYS).map(d => (
                  <th key={d} className="px-3 py-3 min-w-[100px]">{d}</th>
                ))}
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(selected ? [selected] : filtered).map((t, ti) => (
                <tr key={t.id} className={"border-t border-white/5 " + (selected?.id === t.id ? "bg-blue-600/5" : "hover:bg-white/5 transition-colors")}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-white/80 text-xs">{t.name.split(" ").slice(0, 2).join(" ")}</p>
                    <p className="text-white/40 text-xs">{t.dept}</p>
                  </td>
                  {(dayFilter !== "All" ? [dayFilter] : DAYS).map(d => {
                    const slots = dayPeriods(t, d);
                    const heavy = slots.length >= 4;
                    return (
                      <td key={d} className="px-3 py-3">
                        {slots.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {slots.map(s => (
                              <span key={s} className={"text-xs px-1.5 py-0.5 rounded font-medium " + (heavy ? "bg-red-500/20 text-red-300" : "bg-blue-500/15 text-blue-300")}>
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right">
                    <span className={"font-bold text-sm " + (totalPeriods(t) >= 20 ? "text-red-400" : "text-green-400")}>{totalPeriods(t)}</span>
                    <span className="text-white/30 text-xs"> / {DAYS.length * PERIODS.length}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500/30"></span>Normal load</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500/30"></span>Heavy load (4+ periods/day)</span>
          <span className="flex items-center gap-1.5 ml-auto"><strong className="text-green-400">20+</strong> total = overloaded</span>
        </div>
      </div>
    </div>
  );
};

export default TeacherMonitor;