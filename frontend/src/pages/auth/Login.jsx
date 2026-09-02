import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const getSuffix = () => {
    // If username starts with a digit, assume it's a student roll number
    if (username && /^\d/.test(username)) {
      return '.sdcce@vvm.edu.in';
    }
    return '@vvm.edu.in';
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    const fullEmail = `${username}${getSuffix()}`;

    try {
      const role = await login(fullEmail);

      // Navigate based on assigned role
      switch (role) {
        case 'student':
          navigate('/student/dashboard');
          break;
        case 'principal':
          navigate('/principal/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'timetable_incharge':
          navigate('/timetable/dashboard');
          break;
        case 'teacher':
        default:
          navigate('/teacher/dashboard');
          break;
      }
    } catch (err) {
      setError('Failed to login. Please try again.');
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 relative"
      style={{ backgroundImage: 'url("/imgs/login-signup.jpg")' }}
    >
      <div className="relative z-10 w-full max-w-md bg-white/30 backdrop-blur-2xl border border-white/40 p-8 sm:p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden">
        {/* Abstract decorative shapes inside the card for premium feel */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/30 blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-blue-400/30 blur-3xl mix-blend-overlay"></div>

        <div className="relative z-20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-white/90 text-sm">
              {isLogin ? 'Enter your credentials to access your dashboard' : 'Join the College Attendance System'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center backdrop-blur-sm">
                {error}
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-white mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-700/70 transition-all border-none"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-white">Username</label>
                <div className="group relative cursor-help">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/70 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute bottom-full right-0 mb-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-700">
                      <p className="font-semibold mb-1">Format Guide:</p>
                      <ul className="space-y-1 text-slate-300">
                        <li><span className="text-blue-300">Principal:</span> principal</li>
                        <li><span className="text-blue-300">Admin:</span> admin</li>
                        <li><span className="text-blue-300">Teacher:</span> firstname.lastname</li>
                        <li><span className="text-blue-300">Student:</span> 0000000.name</li>
                      </ul>
                      <div className="absolute -bottom-1 right-1.5 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 transform rotate-45"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative flex items-stretch">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-l-xl bg-slate-700/50 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-700/70 transition-all border-none"
                  placeholder="e.g. name/number.name"
                />
                <div className="flex items-center px-4 bg-slate-800/60 rounded-r-xl border-l border-white/10 text-white/70 text-sm whitespace-nowrap">
                  {getSuffix()}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-700/70 transition-all border-none pr-12"
                  placeholder="enter the pasword"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <a href="#" className="text-sm text-white/90 hover:text-white transition-colors">Forgot password?</a>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-white/90">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white font-bold hover:underline transition-all"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


