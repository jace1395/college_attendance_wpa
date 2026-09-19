import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/shared/Layout';

const TimeTable = () => {
  const [timetable, setTimetable] = useState([]);
  const [isPastSixPM, setIsPastSixPM] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check time logic
    const checkTime = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 18) { // 18 = 6 PM
        setIsPastSixPM(true);
      } else {
        setIsPastSixPM(false);
      }
    };

    checkTime();

    // Mock API fetch (made instant)
    setTimetable([]);
    setLoading(false);

    // Optional: set interval to check time every minute
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);

  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Timetable</h1>
          <Link to="/student/dashboard" className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors border border-gray-200 dark:border-slate-700">
            Back to Dashboard
          </Link>
        </div>
        
        {isPastSixPM ? (
          // Glassmorphism Alert Card
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 shadow-2xl text-center mt-10 relative overflow-hidden">
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl mix-blend-overlay pointer-events-none"></div>
             <div className="relative z-10">
               <svg className="w-20 h-20 mx-auto text-blue-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               <h2 className="text-3xl font-bold mb-4">Classes are over for today!</h2>
               <p className="text-xl text-white/70">Tomorrow's timetable will be uploaded shortly.</p>
             </div>
          </div>
        ) : (
          // Timetable List
          <div className="space-y-4 mt-6">
            {timetable.map((slot, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between shadow-lg hover:bg-white/15 "
              >
                <div className="flex items-center gap-6 mb-4 md:mb-0">
                  <div className="bg-blue-500/20 text-blue-300 font-bold px-4 py-2 rounded-xl whitespace-nowrap border border-blue-500/30">
                    {slot.time}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{slot.subject}</h3>
                    <p className="text-white/60">{slot.teacher}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/80 bg-slate-900/40 px-4 py-2 rounded-lg border border-white/5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  {slot.room}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
};

export default TimeTable;
