import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const PrincipalMonitoringTab = () => {
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDuties = async () => {
      try {
        const { data } = await apiClient.get('/api/principal/monitoring-duties/');
        setDuties(data);
      } catch (err) {
        console.error("Failed to load monitoring duties", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDuties();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
        Monitoring Duties Overview
      </h2>
      
      {duties.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
          <p className="text-gray-500 dark:text-white/60">No monitoring duties recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 text-sm tracking-wider uppercase">
                <th className="py-4 px-4 font-semibold">Date</th>
                <th className="py-4 px-4 font-semibold">Time Slot</th>
                <th className="py-4 px-4 font-semibold">Teacher</th>
                <th className="py-4 px-4 font-semibold">Room</th>
                <th className="py-4 px-4 font-semibold">Students</th>
                <th className="py-4 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {duties.map((duty) => (
                <tr key={duty.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">{duty.date}</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-white/80">{duty.time_slot}</td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{duty.teacher_name}</p>
                    <p className="text-xs text-gray-500 dark:text-white/50">{duty.teacher_dept}</p>
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-white/80 font-mono">
                    {duty.room_no}
                    {duty.class_name && <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">{duty.class_name}</div>}
                  </td>
                  <td className="py-4 px-4">
                    {duty.status === 'Completed' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {duty.total_students}/{duty.enrolled_students} <span className="text-gray-500 dark:text-white/50 text-sm">Present</span>
                        </span>
                        {duty.enrolled_students > 0 && (
                          duty.total_students / duty.enrolled_students < 0.5 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">Low</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">Good</span>
                          )
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-white/30 italic">Pending</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {duty.status === 'Completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PrincipalMonitoringTab;
