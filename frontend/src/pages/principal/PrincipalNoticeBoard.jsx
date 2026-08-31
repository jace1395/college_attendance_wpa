import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

const PrincipalNoticeBoard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inbox');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Compose Modal State
  const [toSearch, setToSearch] = useState('');
  const [selectedTo, setSelectedTo] = useState([]);
  const [showToDropdown, setShowToDropdown] = useState(false);
  
  // Mock Messages
  const messages = [
    { id: 1, sender: "Sumit Kumar (Teacher)", subject: "Leave Application", body: "I am unwell today...", time: "10:30 AM", type: 'inbox', read: false },
    { id: 2, sender: "Admin", subject: "System Upgrade", body: "Servers will be upgraded tonight.", time: "Yesterday", type: 'inbox', read: true },
    { id: 3, sender: "Me", subject: "College Assembly Broadcast", body: "Please gather at 10 AM.", time: "Aug 15", type: 'sent' }
  ];

  const filteredMessages = messages
    .filter(m => m.type === activeTab)
    .filter(m => {
        if (activeFilter === 'Unread') return !m.read;
        if (activeFilter === 'From Teachers') return m.sender.includes('Teacher');
        return true;
    });

  // Broadcast capability options
  const availableRecipients = [
      "ALL TEACHERS",
      "ALL STUDENTS",
      "ALL BVoc STUDENTS",
      "ALL BBA STUDENTS",
      "Sumit Kumar",
      "Jace Doe"
  ].filter(r => !selectedTo.includes(r) && r.toLowerCase().includes(toSearch.toLowerCase()));

  const handleSelectTo = (recipient) => {
      setSelectedTo([...selectedTo, recipient]);
      setToSearch('');
      setShowToDropdown(false);
  };

  const handleRemoveTo = (recipient) => {
      setSelectedTo(selectedTo.filter(r => r !== recipient));
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-fade-in-up relative">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex-1 shadow-xl">
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

        {/* Main View */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-xl">
            {/* Header / Filters */}
            <div className="p-4 border-b border-white/10 flex flex-wrap justify-between items-center bg-slate-900/40 gap-4">
                <h2 className="font-semibold capitalize text-lg">{activeTab}</h2>
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                    {['All', 'Unread', 'From Teachers'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                                activeFilter === f ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-transparent border-white/20 text-white/60 hover:text-white'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* List */}
            <div className="overflow-y-auto flex-1 p-2">
                {filteredMessages.map(msg => (
                <div 
                    key={msg.id}
                    className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 border-b border-white/5 hover:shadow-md cursor-pointer transition-all rounded-xl ${msg.read === false ? 'bg-white/10 font-semibold border-l-4 border-l-blue-500' : 'hover:bg-white/5 border-l-4 border-l-transparent'}`}
                >
                    <div className="w-full md:w-48 truncate shrink-0">{msg.sender}</div>
                    <div className="flex-1 truncate">
                    <span>{msg.subject}</span>
                    <span className="hidden md:inline text-white/50 font-normal mx-2">-</span>
                    <span className="block md:inline text-white/50 font-normal text-sm md:text-base mt-1 md:mt-0">{msg.body}</span>
                    </div>
                    <div className="md:w-24 md:text-right text-xs md:text-sm text-white/60 shrink-0">{msg.time}</div>
                </div>
                ))}
                {filteredMessages.length === 0 && (
                <div className="h-full flex items-center justify-center text-white/40">
                    No messages match this view.
                </div>
                )}
            </div>
        </div>

        {/* Floating Action Button (FAB) */}
        <button 
            onClick={() => setIsComposeOpen(true)}
            className="absolute bottom-6 right-6 md:bottom-8 md:right-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 shadow-2xl transition-transform transform hover:-translate-y-2 hover:shadow-blue-500/50 z-20"
        >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
        </button>

        {/* Compose Modal */}
        {isComposeOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsComposeOpen(false)}></div>
                
                <div className="bg-slate-800 border border-slate-600 w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-visible animate-fade-in-up">
                    <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700 rounded-t-2xl">
                        <h3 className="font-bold text-lg text-red-400 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                            Broadcast Notice
                        </h3>
                        <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    
                    <div className="p-6 flex flex-col gap-4">
                        {/* From Field - Locked */}
                        <div className="flex flex-col sm:flex-row sm:items-center border-b border-slate-700 pb-2">
                            <span className="text-slate-400 w-16 text-sm mb-1 sm:mb-0">From:</span>
                            <input type="text" disabled value={`${user?.name} <${user?.email}>`} className="bg-transparent flex-1 outline-none text-white/50 text-sm cursor-not-allowed" />
                        </div>
                        
                        {/* Custom Searchable Multi-Select "To" */}
                        <div className="flex flex-col sm:flex-row sm:items-start border-b border-slate-700 pb-2 relative z-50">
                            <span className="text-slate-400 w-16 text-sm mt-1 mb-1 sm:mb-0">To:</span>
                            <div className="flex-1 flex flex-wrap gap-2">
                                {selectedTo.map(r => (
                                    <span key={r} className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-md text-xs flex items-center gap-1 font-semibold tracking-wider">
                                        {r}
                                        <button onClick={() => handleRemoveTo(r)} className="hover:text-white">&times;</button>
                                    </span>
                                ))}
                                <div className="relative flex-1 min-w-[150px]">
                                    <input 
                                        type="text"
                                        value={toSearch}
                                        onChange={(e) => setToSearch(e.target.value)}
                                        onFocus={() => setShowToDropdown(true)}
                                        placeholder={selectedTo.length === 0 ? "Search recipients or groups..." : ""}
                                        className="bg-transparent w-full outline-none text-white text-sm py-1"
                                    />
                                    {showToDropdown && availableRecipients.length > 0 && (
                                        <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                                            {availableRecipients.map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => handleSelectTo(r)}
                                                    className={`w-full text-left px-4 py-2 text-sm text-white transition-colors ${r.startsWith('ALL ') ? 'bg-slate-700 font-bold border-b border-slate-600' : 'hover:bg-blue-600'}`}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="flex items-center border-b border-slate-700 pb-2 mt-2">
                            <input type="text" placeholder="Subject" className="bg-transparent flex-1 outline-none text-white placeholder-slate-500 font-medium" />
                        </div>
                        
                        {/* Body */}
                        <textarea 
                            className="w-full h-48 bg-transparent outline-none text-white placeholder-slate-500 resize-none mt-2"
                            placeholder="Write your broadcast notice here..."
                        ></textarea>
                    </div>
                    
                    <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-t border-slate-700 rounded-b-2xl">
                        <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Attach File">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        </button>
                        <button 
                            onClick={() => setIsComposeOpen(false)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg transition-transform transform hover:-translate-y-1"
                        >
                            Broadcast Send
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default PrincipalNoticeBoard;
