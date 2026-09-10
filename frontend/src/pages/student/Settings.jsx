import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ThemeToggle from '../../components/shared/ThemeToggle';

const Settings = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get('/api/auth/me/');
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
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
        new_password: passwordData.new_password
      });
      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' });
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update password.';
      setPasswordStatus({ type: 'error', message: Array.isArray(errorMsg) ? errorMsg[0] : errorMsg });
    } finally {
      setIsChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat text-white pb-10"
      style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}
    >
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md pointer-events-none"></div>

      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto min-h-screen flex flex-col">
        {/* Breadcrumb Navigation */}
        <Link to="/student/dashboard" className="text-blue-400 hover:text-blue-300 mb-6 inline-flex items-center gap-2 font-medium w-fit">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </Link>
        
        {/* Header Block */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">Account Settings</h1>
            <p className="text-white/60">Manage your profile and security</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section A: Profile Info */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl h-fit">
            <h2 className="text-xl font-bold mb-6 text-indigo-300 border-b border-white/10 pb-2">Profile Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/50 mb-1">Name</label>
                <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/90">
                  {profile?.name || '-'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/50 mb-1">Email</label>
                <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/90">
                  {profile?.email || '-'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/50 mb-1">Department</label>
                <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/90">
                  {profile?.department || 'General'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/50 mb-1">Role</label>
                <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/90 capitalize">
                  {profile?.role || 'Student'}
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Change Password */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-red-300 border-b border-white/10 pb-2">Security</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-5">
              {passwordStatus.message && (
                <div className={`p-4 rounded-xl text-sm backdrop-blur-sm border ${passwordStatus.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-green-500/20 border-green-500/50 text-green-200'}`}>
                  {passwordStatus.message}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={isChanging}
                className="w-full py-3.5 px-4 bg-red-500/80 hover:bg-red-600/80 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {isChanging ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
