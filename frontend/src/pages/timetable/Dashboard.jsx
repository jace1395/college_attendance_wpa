import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import TimetableEditor   from "./TimetableEditor";
import RescheduleManager from "./RescheduleManager";
import TeacherMonitor    from "./TeacherMonitor";
import ThemeToggle from "../../components/shared/ThemeToggle";

const TABS = [
  { id: "overview",   label: "Overview",        icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
  { id: "edit",       label: "Edit Timetable",  icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { id: "reschedule", label: "Reschedule",      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "monitor",    label: "Teacher Monitor", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
];

const STATS = [
  { label: "Total Classes/Week",   value: "168", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400" },
  { label: "Active Teachers",      value: "6",   icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400" },
  { label: "Reschedules This Month",value: "3",  icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", color: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400" },
  { label: "Pending Conflicts",    value: "2",   icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "bg-red-500/10 border-red-500/30", text: "text-red-400" },
];

const RECENT_CHANGES = [];

const TimetableDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div
      className="min-h-screen text-white bg-cover bg-fixed"
      style={{ backgroundImage: "url('/imgs/login-signup.jpg')" }}
    >
      <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6 min-h-screen">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-xl border border-amber-500/20">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Timetable Incharge</h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-amber-500/20 border-amber-500/40 text-amber-300">
                Dashboard
              </span>
            </div>
            <p className="text-sm text-white/40 ml-11">Welcome, {user?.name || "Timetable Incharge"} | Manage schedules, reschedule classes, monitor teachers</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={logout}
              className="px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-xl border border-red-500/30 text-sm transition-colors">
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 overflow-x-auto flex-shrink-0">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={"flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all " + (activeTab === tab.id ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg" : "text-white/50 hover:text-white hover:bg-white/5")}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}/>
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6 animate-fade-in-up">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map(s => (
                  <div key={s.label} className={"rounded-2xl p-5 border relative overflow-hidden " + s.color}>
                    <svg className={"w-8 h-8 mb-3 " + s.text} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.icon}/>
                    </svg>
                    <p className={"text-3xl font-extrabold tracking-tight " + s.text}>{s.value}</p>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Edit Timetable",  tab: "edit",       desc: "Modify existing slots",    color: "from-sky-600 to-blue-600",     icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
                  { label: "Reschedule",      tab: "reschedule", desc: "Move a class to new slot", color: "from-amber-600 to-orange-600",  icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                  { label: "Teacher Monitor", tab: "monitor",    desc: "View teacher workloads",   color: "from-emerald-600 to-teal-600",  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
                ].map(q => (
                  <button key={q.tab} onClick={() => setActiveTab(q.tab)}
                    className={"flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left group"}>
                    <div className={"p-3 rounded-xl bg-gradient-to-br " + q.color + " flex-shrink-0 shadow-lg"}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={q.icon}/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-white/90">{q.label}</p>
                      <p className="text-xs text-white/40">{q.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-white/80 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Recent Changes
                </h3>
                <div className="flex flex-col gap-3">
                  {RECENT_CHANGES.map((r, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-900/40 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                      <span className={"w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-lg " + r.color} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white/80">{r.action}</p>
                        <p className="text-xs text-white/40">{r.detail}</p>
                      </div>
                      <p className="text-xs text-white/30 font-mono whitespace-nowrap">{r.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "edit"       && <TimetableEditor />}
          {activeTab === "reschedule" && <RescheduleManager />}
          {activeTab === "monitor"    && <TeacherMonitor />}

        </div>
      </div>
    </div>
  );
};

export default TimetableDashboard;