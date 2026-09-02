import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/shared/ThemeToggle";

const CONTACTS = [
  { id: "mentor",  name: "Prof. Anita Kamat",  role: "Class Mentor",  avatar: "AK", color: "from-violet-600 to-purple-600" },
  { id: "teacher", name: "Prof. Rajan Shenvi", role: "Class Teacher", avatar: "RS", color: "from-sky-600 to-blue-600" },
  { id: "hod",     name: "Dr. Priya Naik",     role: "HOD",           avatar: "PN", color: "from-rose-600 to-pink-600" },
];

const nowTime = () => {
  const d = new Date();
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const Messages = () => {
  const { logout } = useAuth();
  const [activeContact, setActiveContact] = useState("mentor");
  const [threads, setThreads]             = useState({});
  const [draft, setDraft]                 = useState("");
  const bottomRef                         = useRef(null);

  const messages = threads[activeContact] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeContact]);

  const sendMessage = () => {
    if (!draft.trim()) return;
    const newMsg = { id: Date.now(), from: "me", text: draft.trim(), time: "Today " + nowTime() };
    setThreads(prev => ({ ...prev, [activeContact]: [...(prev[activeContact] || []), newMsg] }));
    setDraft("");
    // Simulate reply after 1.5s
    setTimeout(() => {
      const replies = [
        "Thank you for reaching out. I will get back to you soon.",
        "Noted. We will discuss this further.",
        "Please check the notice board for updates.",
        "I have received your message. Please meet me in my office.",
      ];
      const reply = { id: Date.now() + 1, from: "contact", text: replies[Math.floor(Math.random() * replies.length)], time: "Today " + nowTime() };
      setThreads(prev => ({ ...prev, [activeContact]: [...(prev[activeContact] || []), reply] }));
    }, 1500);
  };

  const contact = CONTACTS.find(c => c.id === activeContact);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Top Bar */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Messages</h1>
          <p className="text-xs text-white/40">Communicate with your Mentor, Teacher, and HOD</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-4">
            <Link to="/student/dashboard" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20 text-sm font-medium">Dashboard</Link>
            <ThemeToggle />
          </div>
          <Link to="/student/leave" className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors">Leave Request</Link>
          <button onClick={logout} className="px-3 py-1.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg border border-red-500/30 text-xs transition-colors">Logout</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden max-w-5xl mx-auto w-full px-6 py-6 gap-5">

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2 ml-1">Contacts</p>
          {CONTACTS.map(c => {
            const msgCount = (threads[c.id] || []).filter(m => m.from === "contact").length;
            const isActive = activeContact === c.id;
            return (
              <button key={c.id} onClick={() => setActiveContact(c.id)}
                className={"w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left " + (isActive ? "bg-white/10 border-white/20" : "bg-white/5 border-transparent hover:bg-white/8 hover:border-white/10")}
              >
                <div className={"w-10 h-10 rounded-full bg-gradient-to-br " + c.color + " flex items-center justify-center text-xs font-bold flex-shrink-0"}>
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={"font-semibold text-sm truncate " + (isActive ? "text-white" : "text-white/70")}>{c.name}</p>
                  <p className="text-xs text-white/40 truncate">{c.role}</p>
                </div>
                {msgCount > 0 && (
                  <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-bold flex-shrink-0">{msgCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {/* Contact Header */}
          <div className={"flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-r " + contact.color + "/10"}>
            <div className={"w-10 h-10 rounded-full bg-gradient-to-br " + contact.color + " flex items-center justify-center text-sm font-bold"}>
              {contact.avatar}
            </div>
            <div>
              <p className="font-bold text-white">{contact.name}</p>
              <p className="text-xs text-white/50">{contact.role}</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>Online
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3" style={{ minHeight: 0, maxHeight: "420px" }}>
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-2 py-12">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={"flex " + (msg.from === "me" ? "justify-end" : "justify-start")}>
                <div className={"max-w-xs lg:max-w-sm " + (msg.from === "me" ? "items-end" : "items-start") + " flex flex-col gap-1"}>
                  <div className={"px-4 py-2.5 rounded-2xl text-sm " + (msg.from === "me" ? "bg-blue-600 text-white rounded-br-sm" : "bg-white/10 text-white/90 rounded-bl-sm")}>
                    {msg.text}
                  </div>
                  <span className="text-xs text-white/25 px-1">{msg.time}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <div className="px-5 py-4 border-t border-white/10 flex gap-3 items-end">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={"Type a message to " + contact.name + "..."}
              rows={2}
              className="flex-1 bg-slate-900/80 text-white rounded-xl px-4 py-2.5 border border-white/10 focus:border-blue-500/70 outline-none text-sm resize-none placeholder-white/25"
            />
            <button onClick={sendMessage}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors flex-shrink-0 shadow-lg shadow-blue-500/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Messages;