import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';

const ManagePrincipalView = () => {
  const [principal, setPrincipal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [resetMessage, setResetMessage] = useState(null);

  useEffect(() => {
    fetchPrincipal();
  }, []);

  const fetchPrincipal = async () => {
    try {
      const { data } = await apiClient.get('/api/admin/principal-management/');
      setPrincipal(data);
      setName(data.name || '');
      setEmail(data.email || '');
    } catch (err) {
      setMessage({ text: 'Error fetching principal data. Ensure a Principal user exists.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setResetMessage(null);
    try {
      await apiClient.post('/api/admin/principal-management/', {
        action: 'update',
        name,
        email
      });
      setMessage({ text: 'Principal details updated successfully.', type: 'success' });
      fetchPrincipal();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to update principal.', type: 'error' });
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm("Are you sure you want to reset the Principal's password to the default system password?")) return;
    
    setMessage({ text: '', type: '' });
    setResetMessage(null);
    try {
      const { data } = await apiClient.post('/api/admin/principal-management/', {
        action: 'reset_password'
      });
      setResetMessage(`Password successfully reset. The new password is: ${data.default_password}`);
      setMessage({ text: 'Password reset successful.', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to reset password.', type: 'error' });
    }
  };

  if (loading) {
    return <div className="text-white/60 p-6 text-center animate-pulse">Loading Principal details...</div>;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto shadow-xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-purple-500/20 rounded-2xl text-purple-400 shrink-0 border border-purple-500/30">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Principal Oversight Config</h2>
          <p className="text-white/50 text-sm mt-1">Manage the Principal's identity and credentials</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={message.type === 'success' ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"}></path></svg>
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      {resetMessage && (
        <div className="p-5 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-6">
          <p className="text-purple-300 font-medium">Important:</p>
          <p className="text-white mt-1">{resetMessage}</p>
          <p className="text-purple-300/70 text-sm mt-2">Please copy and communicate this to the Principal securely.</p>
        </div>
      )}

      {!principal ? (
        <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-white/60">No Principal user found in the system.</p>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">Principal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Dr. John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">Principal Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="principal@college.edu"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleResetPassword}
              className="w-full sm:w-auto px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Reset Password
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all text-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ManagePrincipalView;
