import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/shared/ThemeToggle";

const RECIPIENTS = [
  { id: "mentor",  label: "Class Mentor",  icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "hod",     label: "HOD",           icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
];

const LEAVE_TYPES = ["Medical", "Personal", "Family Emergency", "Other"];

const StatusPill = ({ status }) => {
  const map = {
    Approved: "bg-green-500/20 text-green-400 border-green-500/30",
    Rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    Pending:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };
  return (
    <span className={"text-xs font-bold px-2.5 py-1 rounded-full border " + (map[status] || map.Pending)}>
      {status}
    </span>
  );
};

const LeaveRequest = () => {
  const { user, logout } = useAuth();
  const [leaveType, setLeaveType]     = useState("");
  const [fromDate, setFromDate]       = useState("");
  const [toDate, setToDate]           = useState("");
  const [recipient, setRecipient]     = useState("");
  const [reason, setReason]           = useState("");
  const [errors, setErrors]           = useState({});
  const [submitted, setSubmitted]     = useState(false);
  const [history, setHistory]         = useState([]);

  const validate = () => {
    const e = {};
    if (!leaveType)    e.leaveType = "Select a leave type.";
    if (!fromDate)     e.fromDate  = "Select start date.";
    if (!toDate)       e.toDate    = "Select end date.";
    if (fromDate && toDate && toDate < fromDate) e.toDate = "End date must be after start date.";
    if (!recipient)    e.recipient = "Select a recipient.";
    if (!reason.trim()) e.reason   = "Please provide a reason.";
    if (reason.length < 20) e.reason = "Reason must be at least 20 characters.";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const newRequest = {
      id: "LR" + String(history.length + 100 + 1).padStart(3, "0"),
      type: leaveType,
      from: fromDate,
      to: toDate,
      status: "Pending",
      recipient: RECIPIENTS.find(r => r.id === recipient)?.label || recipient,
    };
    setHistory(prev => [newRequest, ...prev]);
    setSubmitted(true);
    setLeaveType(""); setFromDate(""); setToDate(""); setRecipient(""); setReason(""); setErrors({});
    setTimeout(() => setSubmitted(false), 4000);
  };

  const inp = "w-full bg-slate-900/70 text-white rounded-xl px-4 py-2.5 border border-white/10 focus:border-blue-500/70 outline-none text-sm transition-colors";
  const err = "text-red-400 text-xs mt-1 ml-1";

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 shrink-0">
          <h1 className="text-3xl font-bold">Leave Application</h1>
          <div className="flex items-center gap-4">
            <Link to="/student/dashboard" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20 text-sm font-medium">Dashboard</Link>
            <ThemeToggle />
            <button onClick={logout} className="px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-xl border border-red-500/30 text-sm transition-colors">Logout</button>
          </div>
        </div>

        {/* Success Toast */}
        {submitted && (
          <div className="flex items-center gap-3 bg-green-500/15 border border-green-500/30 rounded-2xl px-5 py-4 animate-fade-in-up">
            <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="text-green-300 font-semibold text-sm">Leave request submitted successfully! It appears below as <strong>Pending</strong>.</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white/90 mb-5 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            New Leave Application
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Leave Type */}
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Leave Type</label>
              <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className={inp + " appearance-none"}>
                <option value="">Select type...</option>
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.leaveType && <p className={err}>{errors.leaveType}</p>}
            </div>

            {/* Recipient */}
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Send To</label>
              <div className="flex gap-2">
                {RECIPIENTS.map(r => (
                  <button type="button" key={r.id}
                    onClick={() => setRecipient(r.id)}
                    className={"flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all " + (recipient === r.id ? "bg-blue-600/30 border-blue-500/60 text-blue-300" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white")}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={r.icon}/></svg>
                    {r.label}
                  </button>
                ))}
              </div>
              {errors.recipient && <p className={err}>{errors.recipient}</p>}
            </div>

            {/* From Date */}
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">From Date</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className={inp + " [color-scheme:dark]"} />
              {errors.fromDate && <p className={err}>{errors.fromDate}</p>}
            </div>

            {/* To Date */}
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">To Date</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className={inp + " [color-scheme:dark]"} />
              {errors.toDate && <p className={err}>{errors.toDate}</p>}
            </div>

            {/* Reason — full width */}
            <div className="sm:col-span-2">
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">
                Reason <span className="normal-case font-normal text-white/30">(min 20 characters)</span>
              </label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
                placeholder="Describe your reason for leave..."
                className={inp + " resize-none"}
              />
              <div className="flex justify-between mt-0.5">
                {errors.reason ? <p className={err}>{errors.reason}</p> : <span />}
                <span className={"text-xs " + (reason.length < 20 ? "text-red-400" : "text-green-400")}>{reason.length} chars</span>
              </div>
            </div>

            {/* File Upload (mock) */}
            <div className="sm:col-span-2">
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Attachment <span className="normal-case font-normal">(optional — medical certificate, etc.)</span></label>
              <div className="border border-dashed border-white/20 rounded-xl p-5 text-center text-white/30 text-sm hover:border-white/40 transition-colors cursor-pointer">
                <svg className="w-6 h-6 mx-auto mb-1 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                Click to attach file
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit"
              className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm">
              Submit Application
            </button>
          </div>
        </form>

        {/* History Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
          <h2 className="text-sm font-bold text-white/80 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            My Leave History
          </h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Sent To</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-purple-300 text-xs">{h.id}</td>
                    <td className="px-4 py-3 font-semibold text-white/80">{h.type}</td>
                    <td className="px-4 py-3 text-white/50">{h.from}</td>
                    <td className="px-4 py-3 text-white/50">{h.to}</td>
                    <td className="px-4 py-3 text-white/60">{h.recipient}</td>
                    <td className="px-4 py-3"><StatusPill status={h.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl mt-6">
          <h2 className="text-sm font-bold text-white/80 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            Notifications
          </h2>
          <div className="space-y-3">
            {[1, 2].map((_, i) => (
              <Link to="/student/dashboard" key={i} className="block bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors shadow-sm group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold text-white/90 group-hover:text-purple-400 transition-colors">Attendance Uploaded</span>
                  <span className="text-xs text-white/40">Today, 10:30 AM</span>
                </div>
                <p className="text-xs text-white/60 mb-2">Prof. John Doe has uploaded attendance for Advanced Programming.</p>
                <span className="text-xs font-semibold text-purple-400/80 group-hover:text-purple-400 flex items-center gap-1">
                  View Attendance <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeaveRequest;