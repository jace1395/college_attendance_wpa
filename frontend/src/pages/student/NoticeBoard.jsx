import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FILTER_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'general', label: 'General' },
];

const NoticeBoard = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ticket State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState({ subject: '', reason: '' });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [lastLectureDate, setLastLectureDate] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/student/notifications/?email=${user.email}`);
        if (!response.ok) throw new Error('API not available');
        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch subjects for ticket modal
    const fetchDashboard = async () => {
       try {
         const response = await fetch(`/api/student/dashboard/?email=${user.email}`);
         if (response.ok) {
            const data = await response.json();
            if (data.subjects) setSubjects(data.subjects);
            // Mock last lecture date to yesterday for testing, in reality this should come from API
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            setLastLectureDate(yesterday);
         }
       } catch(e) {}
    };

    fetchNotifications();
    fetchDashboard();
  }, [user]);

  const canRaiseTicket = useMemo(() => {
    if (!lastLectureDate) return false;
    const now = new Date();
    const last = new Date(lastLectureDate);
    const diffHours = (now - last) / (1000 * 60 * 60);
    const todayDay = now.getDay(); // 0 = Sunday, 1 = Monday
    
    // Exception: If today is Sunday, allow tickets for Saturday
    if (todayDay === 0 && last.getDay() === 6 && diffHours <= 48) return true;
    
    // Exception: If today is Monday, allow tickets for Monday (and maybe Friday? The req says "allow tickets for that Monday")
    if (todayDay === 1 && diffHours <= 24) return true;

    return diffHours <= 24;
  }, [lastLectureDate]);

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setTicketSubmitting(true);
    try {
      // Placeholder for ticket API
      // await apiClient.post('/api/student/ticket/', { ...ticketData, date: lastLectureDate });
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Ticket submitted successfully! (Placeholder API)');
      setShowTicketModal(false);
      setTicketData({ subject: '', reason: '' });
    } catch (err) {
      alert('Failed to submit ticket');
    } finally {
      setTicketSubmitting(false);
    }
  };

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'warning':   return { dot: 'bg-red-500',    badge: 'bg-red-500/20 text-red-300 border-red-500/30',    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' };
      case 'attendance_update': return { dot: 'bg-blue-500', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' };
      default:          return { dot: 'bg-green-500',   badge: 'bg-green-500/20 text-green-300 border-green-500/30',  icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed text-white pb-10"
      style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}
    >
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md pointer-events-none"></div>

      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto min-h-screen flex flex-col">

        {/* Breadcrumb Navigation */}
        <Link to="/student/dashboard" className="text-blue-400 hover:text-blue-300 mb-6 inline-flex items-center gap-2 font-medium w-fit">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-blue-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-white/50 text-sm ml-[52px]">
              Automated attendance alerts and system updates from your teachers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/settings"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20 text-sm font-medium"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 mb-6 overflow-x-auto shrink-0">
          {FILTER_TYPES.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeFilter === f.key ? 'bg-blue-600 text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications Feed */}
        <div className="flex-1 flex flex-col gap-3">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/30 gap-4 py-20">
              <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-lg font-medium">No notifications yet</p>
              <p className="text-sm">Attendance updates from your teachers will appear here.</p>
            </div>
          ) : (
            filtered.map((notif, idx) => {
              const style = getTypeStyle(notif.type);
              return (
                <div
                  key={notif.id || idx}
                  className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                    !notif.read
                      ? 'bg-blue-500/10 border-blue-500/20 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="relative mt-1 shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.badge} border`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={style.icon} />
                      </svg>
                    </div>
                    {!notif.read && (
                      <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${style.dot} border-2 border-slate-900`}></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className={`font-semibold text-white ${!notif.read ? 'font-bold' : ''}`}>
                        {notif.title || 'Attendance Updated'}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${style.badge}`}>
                        {notif.type === 'attendance_update' ? 'Attendance' : notif.type === 'warning' ? 'Warning' : 'Info'}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">{notif.message || notif.body}</p>
                  </div>

                  <div className="text-xs text-white/30 font-mono whitespace-nowrap shrink-0 mt-1">
                    {notif.timestamp || notif.time}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Raise Ticket FAB */}
        {canRaiseTicket && (
          <button 
            onClick={() => setShowTicketModal(true)}
            className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 shadow-2xl flex items-center justify-center gap-2 transition-transform hover:scale-105 z-40"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
            <span className="font-bold pr-2 hidden md:block">Raise Ticket</span>
          </button>
        )}

        {/* Ticket Modal */}
        {showTicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                  Raise Attendance Ticket
                </h3>
                <button onClick={() => setShowTicketModal(false)} className="text-white/50 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <form onSubmit={handleTicketSubmit} className="p-6 flex flex-col gap-5">
                
                <div>
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-2 block">Subject</label>
                  <select 
                    required
                    value={ticketData.subject} 
                    onChange={e => setTicketData({...ticketData, subject: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-2 block">Lecture Date</label>
                  <input 
                    type="text" 
                    disabled 
                    value={lastLectureDate ? lastLectureDate.toLocaleDateString() : ''}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-white/30 mt-2">Tickets can only be raised for the most recent lecture.</p>
                </div>

                <div>
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-2 block">Reason</label>
                  <textarea 
                    required
                    rows="3"
                    value={ticketData.reason}
                    onChange={e => setTicketData({...ticketData, reason: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors resize-none"
                    placeholder="Briefly explain the discrepancy..."
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 mt-2">
                  <button type="button" onClick={() => setShowTicketModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={ticketSubmitting} className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50">
                    {ticketSubmitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default NoticeBoard;
