import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/shared/ThemeToggle';

const NoticeBoard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inbox');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetch notices
    setTimeout(() => {
      setMessages([]);
      setLoading(false);
    }, 500);
  }, []);

  const displayedMessages = messages.filter(m => m.type === activeTab);

  return (
    <div 
      className="min-h-screen bg-cover bg-fixed text-white"
      style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}
    >
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md fixed pointer-events-none"></div>

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Notice Board</h1>
          <div className="flex items-center gap-4">
            <Link to="/student/dashboard" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20 text-sm font-medium">Dashboard</Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Main Gmail-style Layout */}
        <div className="flex flex-1 gap-6 overflow-hidden min-h-[500px]">
          
          {/* Sidebar */}
          <div className="w-64 shrink-0 flex flex-col gap-4">
            <button 
              onClick={() => setIsComposeOpen(true)}
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-2xl py-4 px-6 shadow-lg flex items-center justify-center gap-2 transition-transform transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Raise Ticket
            </button>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex-1">
              <button 
                onClick={() => setActiveTab('inbox')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'inbox' ? 'bg-blue-500/20 text-blue-400 font-medium' : 'hover:bg-white/5 text-white/70'}`}
              >
                <div className="flex justify-between items-center">
                  <span>Inbox</span>
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">1</span>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('sent')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'sent' ? 'bg-blue-500/20 text-blue-400 font-medium' : 'hover:bg-white/5 text-white/70'}`}
              >
                Sent
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/40">
              <h2 className="font-semibold capitalize">{activeTab}</h2>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              {displayedMessages.map(msg => (
                <div 
                  key={msg.id}
                  className={`flex items-center gap-4 p-4 border-b border-white/5 hover:shadow-md cursor-pointer transition-all rounded-xl ${msg.read === false ? 'bg-white/10 font-semibold' : 'hover:bg-white/5'}`}
                >
                  <div className="w-48 truncate shrink-0">{msg.sender}</div>
                  <div className="flex-1 truncate">
                    <span>{msg.subject}</span>
                    <span className="text-white/50 font-normal mx-2">-</span>
                    <span className="text-white/50 font-normal">{msg.body}</span>
                  </div>
                  <div className="w-24 text-right text-sm text-white/60 shrink-0">{msg.time}</div>
                </div>
              ))}
              {displayedMessages.length === 0 && (
                <div className="h-full flex items-center justify-center text-white/40">
                  No messages here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsComposeOpen(false)}></div>
          
          <div className="bg-slate-800 border border-slate-600 w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden animate-fade-in-up">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700">
              <h3 className="font-bold">Raise Ticket</h3>
              <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center border-b border-slate-700 pb-2">
                <span className="text-slate-400 w-32 text-sm">From:</span>
                <input type="text" disabled value={user?.email || ''} className="bg-transparent flex-1 outline-none text-white/70 text-sm" />
              </div>
              
              <div className="flex items-center border-b border-slate-700 pb-2">
                <span className="text-slate-400 w-32 text-sm">Subject:</span>
                <select className="bg-transparent flex-1 outline-none text-white text-sm appearance-none">
                  <option className="bg-slate-800">Web Development</option>
                  <option className="bg-slate-800">Software Engineering</option>
                  <option className="bg-slate-800">Database Systems</option>
                </select>
              </div>

              <div className="flex items-center border-b border-slate-700 pb-2">
                <span className="text-slate-400 w-32 text-sm">Date of Absence:</span>
                <input 
                  type="date" 
                  className="bg-transparent flex-1 outline-none text-white text-sm" 
                  min={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="text-xs text-blue-400 font-medium">
                Note: Tickets can only be raised for absences within the last 24 hours.
              </div>
              
              <textarea 
                className="w-full h-32 bg-transparent outline-none text-white placeholder-slate-500 resize-none mt-2"
                placeholder="Please state the reason for absence..."
              ></textarea>
            </div>
            
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-t border-slate-700">
              <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Attach File">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
              </button>
              <button 
                onClick={() => setIsComposeOpen(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NoticeBoard;
