import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PrincipalReportsHub from '../principal/PrincipalReportsHub';
import PrincipalViewTab from '../principal/PrincipalViewTab';
import PrincipalNoticeBoard from '../principal/PrincipalNoticeBoard';
import ThemeToggle from '../../components/shared/ThemeToggle';

const HODDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [department, setDepartment] = useState('BCA');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
      // Mock fetch HOD details
      setDepartment('BCA');
  }, []);

  const streams = [department];

  return (
    <div 
      className="min-h-screen bg-cover bg-fixed transition-colors duration-300 dark:bg-slate-900 dark:text-white bg-slate-50 text-slate-900 pb-10"
      style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}
    >
      <div className="absolute inset-0 dark:bg-slate-900/80 bg-white/90 backdrop-blur-md fixed pointer-events-none transition-colors duration-300"></div>

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold tracking-wider">
            VVM <span className="text-purple-500">HOD PORTAL</span>
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 text-red-600 dark:text-red-200 hover:bg-red-500/40 rounded-xl backdrop-blur-md transition-colors border border-red-500/30 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center mb-6 gap-4 border-b dark:border-white/10 border-slate-300 pb-4">
          <div>
            <h2 className="text-2xl font-bold dark:text-white/90 text-slate-800">Welcome, {user?.name || "HOD"}</h2>
            <p className="text-purple-600 dark:text-purple-300 font-medium">Department: {department}</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 dark:bg-slate-900/50 bg-white/50 p-1.5 rounded-2xl border dark:border-white/10 border-slate-200 shadow-sm">
              {['dashboard', 'view', 'reports', 'notices'].map(tab => (
                  <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                          activeTab === tab ? 'bg-purple-600 text-white shadow-lg' : 'dark:text-white/60 text-slate-600 hover:text-purple-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                  >
                      {tab}
                  </button>
              ))}
          </div>
        </div>

        <div className="mt-4 flex-1">
          {activeTab === 'dashboard' && (
            <div className="dark:bg-white/5 bg-white backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 text-center py-10 shadow-xl animate-fade-in-up">
               <p className="text-xl dark:text-white/60 text-slate-500 mb-4">Welcome to the standalone HOD Dashboard.</p>
               <button onClick={() => setActiveTab('reports')} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-xl transition-all">View Department Reports</button>
            </div>
          )}
          {activeTab === 'reports' && <PrincipalReportsHub streams={streams} onNavigateToView={() => setActiveTab('view')} />}
          {activeTab === 'view' && <PrincipalViewTab streams={streams} />}
          {activeTab === 'notices' && <PrincipalNoticeBoard />}
        </div>
      </div>
    </div>
  );
};

export default HODDashboard;
