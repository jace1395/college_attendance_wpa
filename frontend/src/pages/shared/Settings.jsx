import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import Layout from '../../components/shared/Layout';

/**
 * Universal Settings Page — works for all roles (Admin, Principal, Teacher, Student).
 * Accessible at /settings. Fetches profile from /api/auth/me/ which is JWT-aware.
 */
const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get('/api/auth/me/');
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: '', message: '' });

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsChanging(true);
    try {
      await apiClient.post('/api/auth/change-password/', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' });
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update password.';
      setPasswordStatus({
        type: 'error',
        message: Array.isArray(errorMsg) ? errorMsg.join(' ') : errorMsg,
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Layout>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Account Settings</h2>
        <p className="text-gray-500 dark:text-white/50">Manage your profile and security</p>
      </div>

      {loading ? (
        /* Skeleton Loader */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl p-8 h-72">
            <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="mb-4">
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-gray-100 dark:bg-slate-700/50 rounded-xl"></div>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl p-8 h-72">
            <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-6"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="mb-4">
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
                <div className="h-10 bg-gray-100 dark:bg-slate-700/50 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section A: Profile Info */}
          <div className="bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-sm h-fit">
            <h3 className="text-lg font-bold mb-6 text-indigo-600 dark:text-indigo-300 border-b border-gray-200 dark:border-white/10 pb-3">
              Profile Information
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Name', value: profile?.name },
                { label: 'Email', value: profile?.email },
                { label: 'Role', value: profile?.role },
                { label: 'Department', value: profile?.department },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1">
                    {label}
                  </label>
                  <div className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white/90 capitalize">
                    {value || <span className="text-gray-400 dark:text-white/30 italic">Not set</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Change Password */}
          <div className="bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-red-500 dark:text-red-300 border-b border-gray-200 dark:border-white/10 pb-3">
              Security
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-5">
              {passwordStatus.message && (
                <div className={`p-4 rounded-xl text-sm border ${
                  passwordStatus.type === 'error'
                    ? 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-200'
                    : 'bg-green-50 dark:bg-green-500/20 border-green-200 dark:border-green-500/50 text-green-700 dark:text-green-200'
                }`}>
                  {passwordStatus.message}
                </div>
              )}

              {[
                { id: 'old_password', label: 'Current Password', placeholder: 'Enter current password' },
                { id: 'new_password', label: 'New Password', placeholder: 'Min 8 chars, uppercase, number, special' },
                { id: 'confirm_password', label: 'Confirm New Password', placeholder: 'Repeat new password' },
              ].map(({ id, label, placeholder }) => (
                <div key={id}>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-1">
                    {label}
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData[id]}
                    onChange={(e) => setPasswordData({ ...passwordData, [id]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-400/40 transition-all"
                  />
                </div>
              ))}

              <p className="text-xs text-gray-400 dark:text-white/30">
                Password must be ≥8 characters with at least one uppercase letter, one digit, and one special character (e.g. @, #, $).
              </p>

              <button
                type="submit"
                disabled={isChanging}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChanging ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Settings;
