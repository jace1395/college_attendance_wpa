import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SubjectReports from './SubjectReports';
import Pagination from '../../components/shared/Pagination';
import ThemeToggle from '../../components/shared/ThemeToggle';
import apiClient from '../../services/apiClient';

const SubjectDetail = () => {
  const { subject_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'reports'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Ticket Modal State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketDate, setTicketDate] = useState('');
  const [ticketReason, setTicketReason] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  const getMinMaxDates = () => {
    const today = new Date();
    const day = today.getDay();
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (day === 0) return { min: yesterdayStr, max: yesterdayStr }; // Sunday -> Saturday only
    if (day === 1) return { min: todayStr, max: todayStr };         // Monday -> Monday only
    return { min: yesterdayStr, max: todayStr };                    // Otherwise Yesterday & Today
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketDate || !ticketReason) return;
    setTicketSubmitting(true);
    try {
      await apiClient.post('/api/attendance/tickets/', {
        subject_id: subject_id,
        date: ticketDate,
        reason: ticketReason
      });
      alert('Ticket raised successfully!');
      setShowTicketModal(false);
      setTicketDate('');
      setTicketReason('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to raise ticket.');
    } finally {
      setTicketSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchSubjectData = async () => {
      setLoading(true);
      try {
        const { data: response } = await apiClient.get(`/api/student/subject/${subject_id}/?page=${currentPage}`);
        // Backend pagination wraps the actual dictionary inside 'results'
        const responseData = response.results || response;
        setData(responseData);
        
        if (response.count) {
          setTotalPages(Math.ceil(response.count / 10));
        }
      } catch (err) {
        console.error("Failed to fetch subject details", err);
        setData({ subjects: [], subject_attendance_history: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectData();
  }, [subject_id, currentPage]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const subject = data.subjects?.[0] || {};
  const history = data.subject_attendance_history || [];

  // Strict Color Coding Logic for Grid
  const getStatusColor = (status) => {
    switch(status) {
      case 'Present': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Absent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'On Duty': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Non-Instructional': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-700/50 text-white/70 border-white/10';
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat text-white pb-10"
      style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}
    >
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md pointer-events-none"></div>

      <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto min-h-screen flex flex-col">
        {/* Breadcrumb Navigation */}
        <Link to="/student/dashboard" className="text-blue-400 hover:text-blue-300 mb-6 inline-flex items-center gap-2 font-medium w-fit">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </Link>
        
        {/* Header Block */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">{subject.subject_name || "Subject Details"}</h1>
            <p className="text-white/60">Taught by: {subject.teacher_name || "-"}</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/student/settings" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20 text-sm font-medium">Settings</Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl w-fit border border-white/10">
            <button 
                onClick={() => setActiveTab('grid')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
                Attendance Grid
            </button>
            <button 
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
                Reports
            </button>
            <button 
                onClick={() => setShowTicketModal(true)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
                Raise Ticket
            </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'grid' ? (
            <div className="animate-fade-in-up">
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm font-medium"><div className="w-3 h-3 rounded-full bg-green-500"></div> Present</div>
                    <div className="flex items-center gap-2 text-sm font-medium"><div className="w-3 h-3 rounded-full bg-red-500"></div> Absent</div>
                    <div className="flex items-center gap-2 text-sm font-medium"><div className="w-3 h-3 rounded-full bg-blue-500"></div> On Duty</div>
                    <div className="flex items-center gap-2 text-sm font-medium"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Non-Instructional</div>
                </div>

                {/* Excel-Like Grid */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/80 border-b border-white/10">
                                    <th className="p-4 font-semibold text-white/90 border-r border-white/5">Date</th>
                                    <th className="p-4 font-semibold text-white/90 border-r border-white/5">Day</th>
                                    <th className="p-4 font-semibold text-white/90">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((record, idx) => {
                                    const dateObj = new Date(record.date);
                                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                    
                                    return (
                                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4 border-r border-white/5 text-white/80">{record.date}</td>
                                            <td className="p-4 border-r border-white/5 text-white/80">{dayName}</td>
                                            <td className="p-4 font-medium">
                                                <span className={`px-3 py-1 rounded-md border ${getStatusColor(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-white/50">No attendance records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {history.length > 0 && (
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
        ) : (
            <SubjectReports subject={subject} history={history} />
        )}

        {/* Ticket Modal */}
        {showTicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTicketModal(false)}></div>
            <div className="bg-slate-800/90 backdrop-blur-xl border border-white/20 w-full max-w-md rounded-3xl shadow-2xl relative z-10 p-8 animate-fade-in-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Raise Ticket</h3>
                <button onClick={() => setShowTicketModal(false)} className="text-white/40 hover:text-white bg-white/5 p-2 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <form onSubmit={handleTicketSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Discrepancy Date</label>
                  <input 
                    type="date"
                    required
                    value={ticketDate}
                    onChange={(e) => setTicketDate(e.target.value)}
                    min={getMinMaxDates().min}
                    max={getMinMaxDates().max}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                  />
                  <p className="text-xs text-white/40 mt-1">You can only raise tickets within 24 hours of the class.</p>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Reason</label>
                  <textarea 
                    required
                    value={ticketReason}
                    onChange={(e) => setTicketReason(e.target.value)}
                    placeholder="E.g., I was present but marked absent."
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 min-h-[100px]"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={ticketSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl mt-4 disabled:opacity-50"
                >
                  {ticketSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SubjectDetail;
