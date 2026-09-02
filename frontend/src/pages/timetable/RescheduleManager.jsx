import React, { useState } from "react";

const CLASSES   = ["FY BCom","SY BCom","TY BCom","FY BCA","SY BCA","TY BCA","FY BVoc","SY BVoc","FY BBA","SY BBA","TY BBA"];
const TEACHERS  = ["Prof. Anita Kamat","Prof. Rajan Shenvi","Prof. Priya Naik","Prof. Suresh Lotlikar","Prof. Divya Sawant","Prof. Omkar Borkar"];
const DAYS      = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const PERIODS   = ["8:00-9:00","9:00-10:00","10:00-11:00","11:15-12:15","12:15-1:15","2:00-3:00","3:00-4:00"];
const REASONS   = ["Teacher on Leave","Exam/Assessment","Venue Conflict","Holiday Adjustment","Guest Lecture","Lab Maintenance","Other"];

const MOCK_HISTORY = [];

const inp = "w-full bg-slate-900/70 text-white/90 rounded-xl px-4 py-2.5 border border-white/10 focus:border-blue-500/70 outline-none text-sm appearance-none cursor-pointer placeholder-white/25";
const lbl = "block text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5";
const err = "text-red-400 text-xs mt-1 ml-1";

const RescheduleManager = () => {
  const empty = { class: "", teacher: "", origDate: "", origPeriod: "", newDate: "", newPeriod: "", reason: "", note: "" };
  const [form, setForm]         = useState(empty);
  const [errors, setErrors]     = useState({});
  const [history, setHistory]   = useState(MOCK_HISTORY);
  const [success, setSuccess]   = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.class)      e.class      = "Select a class.";
    if (!form.teacher)    e.teacher    = "Select a teacher.";
    if (!form.origDate)   e.origDate   = "Select original date.";
    if (!form.origPeriod) e.origPeriod = "Select original period.";
    if (!form.newDate)    e.newDate    = "Select new date.";
    if (!form.newPeriod)  e.newPeriod  = "Select new period.";
    if (!form.reason)     e.reason     = "Select a reason.";
    if (form.origDate && form.newDate && form.newDate < form.origDate && form.newDate !== form.origDate) {
      // allow same day or future
    }
    return e;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const next = {
      id: "RS" + String(history.length + 100 + 1).padStart(3, "0"),
      class: form.class, teacher: form.teacher,
      origDate: form.origDate, origPeriod: form.origPeriod,
      newDate: form.newDate, newPeriod: form.newPeriod,
      reason: form.reason,
    };
    setHistory(prev => [next, ...prev]);
    setForm(empty); setErrors({});
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3500);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <div>
        <h3 className="text-sm font-bold text-white/90">Rescheduling Manager</h3>
        <p className="text-xs text-white/40 mt-0.5">Move a class slot to a new date and period</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-500/15 border border-green-500/30 rounded-2xl px-5 py-4">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-green-300 font-semibold text-sm">Class rescheduled successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className={lbl}>Class *</label>
            <select className={inp} value={form.class} onChange={set("class")}>
              <option value="">Select class...</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
            {errors.class && <p className={err}>{errors.class}</p>}
          </div>
          <div>
            <label className={lbl}>Teacher *</label>
            <select className={inp} value={form.teacher} onChange={set("teacher")}>
              <option value="">Select teacher...</option>
              {TEACHERS.map(t => <option key={t}>{t}</option>)}
            </select>
            {errors.teacher && <p className={err}>{errors.teacher}</p>}
          </div>
          <div>
            <label className={lbl}>Reason *</label>
            <select className={inp} value={form.reason} onChange={set("reason")}>
              <option value="">Select reason...</option>
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
            {errors.reason && <p className={err}>{errors.reason}</p>}
          </div>

          {/* Original slot */}
          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5 bg-red-500/5 border border-red-500/10 rounded-xl p-4">
            <p className="sm:col-span-2 text-xs font-bold text-red-400 uppercase tracking-wider">Original Slot</p>
            <div>
              <label className={lbl}>Date *</label>
              <input type="date" className={inp + " [color-scheme:dark]"} value={form.origDate} onChange={set("origDate")}/>
              {errors.origDate && <p className={err}>{errors.origDate}</p>}
            </div>
            <div>
              <label className={lbl}>Period *</label>
              <select className={inp} value={form.origPeriod} onChange={set("origPeriod")}>
                <option value="">Select period...</option>
                {PERIODS.map(p => <option key={p}>{p}</option>)}
              </select>
              {errors.origPeriod && <p className={err}>{errors.origPeriod}</p>}
            </div>
          </div>

          {/* New slot */}
          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5 bg-green-500/5 border border-green-500/10 rounded-xl p-4">
            <p className="sm:col-span-2 text-xs font-bold text-green-400 uppercase tracking-wider">New Slot</p>
            <div>
              <label className={lbl}>Date *</label>
              <input type="date" className={inp + " [color-scheme:dark]"} value={form.newDate} onChange={set("newDate")}/>
              {errors.newDate && <p className={err}>{errors.newDate}</p>}
            </div>
            <div>
              <label className={lbl}>Period *</label>
              <select className={inp} value={form.newPeriod} onChange={set("newPeriod")}>
                <option value="">Select period...</option>
                {PERIODS.map(p => <option key={p}>{p}</option>)}
              </select>
              {errors.newPeriod && <p className={err}>{errors.newPeriod}</p>}
            </div>
          </div>

          {/* Note */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={lbl}>Additional Note</label>
            <textarea rows={2} className={"resize-none " + inp} placeholder="Any additional instructions..." value={form.note} onChange={set("note")}/>
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <button type="button" onClick={() => { setForm(empty); setErrors({}); }} className="px-5 py-2 text-white/50 hover:text-white text-sm mr-3 transition-colors">Clear</button>
          <button type="submit" className="px-7 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg text-sm transition-all">Reschedule Class</button>
        </div>
      </form>

      {/* History */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="text-sm font-bold text-white/80">Reschedule History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead><tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">ID</th><th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Teacher</th><th className="px-4 py-3 text-red-400">From</th>
              <th className="px-4 py-3 text-green-400">To</th><th className="px-4 py-3">Reason</th>
            </tr></thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-amber-300 text-xs">{h.id}</td>
                  <td className="px-4 py-3 font-semibold text-white/90">{h.class}</td>
                  <td className="px-4 py-3 text-white/60">{h.teacher.split(" ").slice(-2).join(" ")}</td>
                  <td className="px-4 py-3 text-red-400 text-xs">{h.origDate}<br/><span className="text-white/40">{h.origPeriod}</span></td>
                  <td className="px-4 py-3 text-green-400 text-xs">{h.newDate}<br/><span className="text-white/40">{h.newPeriod}</span></td>
                  <td className="px-4 py-3"><span className="bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded-md">{h.reason}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RescheduleManager;