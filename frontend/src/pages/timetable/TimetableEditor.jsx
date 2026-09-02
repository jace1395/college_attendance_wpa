import React, { useState } from "react";

const DAYS  = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const PERIODS = ["8:00-9:00","9:00-10:00","10:00-11:00","11:15-12:15","12:15-1:15","2:00-3:00","3:00-4:00"];

const TEACHERS = ["Prof. Anita Kamat","Prof. Rajan Shenvi","Prof. Priya Naik","Prof. Suresh Lotlikar","Prof. Divya Sawant","Prof. Omkar Borkar"];
const SUBJECTS = ["Accountancy","Economics","Business Law","Mathematics","Data Structures","Cloud Computing","Web Development","Marketing","Finance","HR Management","Banking","Financial Markets"];
const ROOMS    = ["Room 101","Room 102","Room 201","Lab A","Lab B","Seminar Hall","Room 301"];

const INITIAL_TT = (() => {
  const tt = {};
  DAYS.forEach(d => {
    tt[d] = {};
    PERIODS.forEach((p, pi) => {
      const teacher = TEACHERS[(DAYS.indexOf(d) + pi) % TEACHERS.length];
      const subject = SUBJECTS[(DAYS.indexOf(d) * 2 + pi) % SUBJECTS.length];
      const room    = ROOMS[(pi) % ROOMS.length];
      tt[d][p] = { teacher, subject, room };
    });
  });
  return tt;
})();

const SLOT_COLORS = [
  "bg-violet-500/15 border-violet-500/20 hover:bg-violet-500/25",
  "bg-sky-500/15 border-sky-500/20 hover:bg-sky-500/25",
  "bg-emerald-500/15 border-emerald-500/20 hover:bg-emerald-500/25",
  "bg-amber-500/15 border-amber-500/20 hover:bg-amber-500/25",
  "bg-rose-500/15 border-rose-500/20 hover:bg-rose-500/25",
  "bg-cyan-500/15 border-cyan-500/20 hover:bg-cyan-500/25",
  "bg-orange-500/15 border-orange-500/20 hover:bg-orange-500/25",
];

const MOCK_SCHEDULE = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
};

const TimetableEditor = () => {
  const [timetable, setTimetable] = useState(INITIAL_TT);
  const [editing, setEditing]     = useState(null); // { day, period }
  const [editData, setEditData]   = useState({ teacher: "", subject: "", room: "" });
  const [saved, setSaved]         = useState(false);

  const openEdit = (day, period) => {
    setEditing({ day, period });
    setEditData({ ...timetable[day][period] });
  };

  const saveEdit = () => {
    if (!editData.teacher || !editData.subject || !editData.room) return;
    setTimetable(prev => ({
      ...prev,
      [editing.day]: { ...prev[editing.day], [editing.period]: { ...editData } }
    }));
    setEditing(null);
  };

  const handleSaveAll = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inp = "w-full bg-slate-900/80 text-white/90 rounded-xl px-4 py-2.5 border border-white/10 focus:border-blue-500/70 outline-none text-sm appearance-none cursor-pointer";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-white/90">Timetable Editor</h3>
          <p className="text-xs text-white/40 mt-0.5">Click any slot to edit teacher, subject, or room</p>
        </div>
        <button onClick={handleSaveAll}
          className={"px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg " + (saved ? "bg-green-500/30 text-green-300 border border-green-500/40" : "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/30 shadow-blue-500/20")}>
          {saved ? "Saved!" : "Save Timetable"}
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 shadow-xl">
        <table className="text-xs min-w-full">
          <thead>
            <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-semibold text-left min-w-[80px]">Day / Period</th>
              {PERIODS.map(p => (
                <th key={p} className="px-3 py-3 font-semibold text-center min-w-[120px]">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, di) => (
              <tr key={day} className="border-t border-white/5">
                <td className="px-4 py-2 font-bold text-white/70 whitespace-nowrap">{day}</td>
                {PERIODS.map((period, pi) => {
                  const slot = timetable[day]?.[period];
                  const colorClass = SLOT_COLORS[(di + pi) % SLOT_COLORS.length];
                  return (
                    <td key={period} className="px-2 py-2">
                      <button
                        onClick={() => openEdit(day, period)}
                        className={"w-full rounded-xl border px-2 py-2 text-left transition-all group " + colorClass}
                      >
                        <p className="font-bold text-white/90 truncate text-xs leading-tight">{slot?.subject}</p>
                        <p className="text-white/50 text-xs truncate mt-0.5">{slot?.teacher?.split(" ").slice(-1)[0]}</p>
                        <p className="text-white/30 text-xs truncate">{slot?.room}</p>
                        <p className="text-white/20 text-xs mt-1 group-hover:text-blue-400 transition-colors">Click to edit</p>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative z-10 bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700">
              <div>
                <h3 className="font-bold text-white">Edit Slot</h3>
                <p className="text-xs text-white/40">{editing.day} &bull; {editing.period}</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5">Subject</label>
                <select className={inp} value={editData.subject} onChange={e => setEditData(p => ({ ...p, subject: e.target.value }))}>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5">Teacher</label>
                <select className={inp} value={editData.teacher} onChange={e => setEditData(p => ({ ...p, teacher: e.target.value }))}>
                  {TEACHERS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5">Room</label>
                <select className={inp} value={editData.room} onChange={e => setEditData(p => ({ ...p, room: e.target.value }))}>
                  {ROOMS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-slate-900 px-6 py-4 flex justify-end gap-3 border-t border-slate-700">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-white/60 hover:text-white text-sm transition-colors">Cancel</button>
              <button onClick={saveEdit} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-lg transition-all">Save Slot</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableEditor;