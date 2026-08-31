import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SubjectReports from './components/SubjectReports';

const SubjectDetail = () => {
  const { subject_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'reports'

  useEffect(() => {
    const fetchSubjectData = async () => {
      setLoading(true);
      setTimeout(() => {
        // Updated mock data structure based on requirements
        const mockData = {
          "student": {
            "student_id": "2511011",
            "name": "JACE",
            "email": "2511011.jace.sdcce@vvm.edu.in",
            "program": "BVoc Software Technologies",
            "current_semester": 3,
            "available_semesters": [1, 2, 3],
            "overall_attendance": 78.5
          },
          "subjects": [
            {
              "subject_id": subject_id, // Match URL param
              "subject_name": subject_id === 'BVC301' ? "Web Development" : subject_id === 'BVC302' ? "Software Engineering" : "Database Systems",
              "teacher_name": "Sumit Kumar",
              "total_classes_conducted": 20,
              "classes_attended": 16,
              "attendance_percentage": 80.0
            }
          ],
          "subject_attendance_history": [
            { "date": "2026-08-18", "status": "Present", "type": "Instructional" },
            { "date": "2026-08-19", "status": "On Duty", "type": "Instructional" },
            { "date": "2026-08-20", "status": "Present", "type": "Instructional" },
            { "date": "2026-08-21", "status": "Absent", "type": "Instructional" },
            { "date": "2026-08-22", "status": "Non-Instructional", "type": "Non-Instructional" }
          ]
        };
        
        setData(mockData);
        setLoading(false);
      }, 500);
    };

    fetchSubjectData();
  }, [subject_id]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const subject = data.subjects[0];
  const history = data.subject_attendance_history;

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
      className="min-h-screen bg-cover bg-fixed text-white pb-10"
      style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}
    >
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md fixed pointer-events-none"></div>

      <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto min-h-screen flex flex-col">
        {/* Breadcrumb Navigation */}
        <Link to="/student/dashboard" className="text-blue-400 hover:text-blue-300 mb-6 inline-flex items-center gap-2 font-medium w-fit">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </Link>
        
        {/* Header Block */}
        <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{subject.subject_name}</h1>
            <p className="text-xl text-white/70">{subject.teacher_name} | {subject.subject_id}</p>
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
                                    <th className="p-4 font-semibold text-white/90 border-r border-white/5">Type</th>
                                    <th className="p-4 font-semibold text-white/90 border-r border-white/5">Status</th>
                                    <th className="p-4 font-semibold text-white/90">Remarks</th>
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
                                            <td className="p-4 border-r border-white/5 text-white/60">{record.type}</td>
                                            <td className="p-4 border-r border-white/5 font-medium">
                                                <span className={`px-3 py-1 rounded-md border ${getStatusColor(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-white/50">-</td>
                                        </tr>
                                    );
                                })}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-white/50">No attendance records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ) : (
            <SubjectReports subject={subject} history={history} />
        )}

      </div>
    </div>
  );
};

export default SubjectDetail;
