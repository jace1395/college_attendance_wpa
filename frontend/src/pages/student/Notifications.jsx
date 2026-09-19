import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import Layout from '../../components/shared/Layout';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await apiClient.get('/api/student/notifications/');
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      // Mark as read could be implemented here via an API call
    }
    if (notif.action_url) {
      navigate(notif.action_url);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Notifications</h2>
          <Link to="/student/dashboard" className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors border border-gray-200 dark:border-slate-700">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="flex flex-col gap-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-5 rounded-xl border flex items-start gap-4 transition-colors ${
                  notif.action_url ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/80' : ''
                } ${
                  notif.type === 'warning'
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/20'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                }`}
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-bold ${notif.type === 'warning' ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{notif.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-lg">No notifications yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;
