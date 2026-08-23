import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    // Ensure email domain is vvm.edu.in
    if (!email.endsWith('@vvm.edu.in')) {
      setError('Please use your @vvm.edu.in email address');
      return;
    }

    try {
      const role = await login(email);
      
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
              <label className="block text-sm font-medium text-white mb-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-700/70 transition-all border-none"
                placeholder="you@vvm.edu.in"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-700/70 transition-all border-none"
                placeholder="••••••••"
              />
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

