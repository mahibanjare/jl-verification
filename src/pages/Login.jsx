import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';
import { APP_NAME, LOGO, homeFor } from '../config';
import Footer from '../components/Footer';

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, session, login } = useAuthStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    if (user && session) navigate(homeFor(user.role), { replace: true });
    if (params.get('expired')) toast.error('Session expired — please log in again');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id || !password) return toast.error('Please enter User ID and Password');
    setSubmitting(true);
    try {
      // Password is checked server-side (SHA-256 hashed in the sheet); the
      // server returns a session token + the user's role.
      const res = await api.login(id.trim(), password);
      login(res.user, res.session);
      toast.success(`Welcome, ${res.user.name}`);
      navigate(homeFor(res.user.role), { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const input = 'block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all';

  return (
    <div className="h-[100dvh] overflow-y-auto w-full flex flex-col bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="flex flex-col items-center space-y-3">
            {LOGO ? (
              <img src={LOGO} alt={APP_NAME} className="w-16 h-16 rounded-2xl object-contain bg-white shadow-lg p-1" />
            ) : (
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldCheck size={30} className="text-white" />
              </div>
            )}
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>JAIN &amp; LUNKAD</h1>
              <p className="text-gray-600 text-sm font-medium">FI / CPV Verification Portal</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="id" className="text-sm font-medium text-gray-700">User ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                <input id="id" type="text" autoComplete="username" autoCapitalize="none" value={id} onChange={(e) => setId(e.target.value)} className={input} placeholder="Enter user ID" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input
                  id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={`${input} pr-12`} placeholder="Enter password"
                />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={submitting}
              className={`w-full py-3 px-4 text-base font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : 'Sign In'}
            </button>
            <p className="text-[11px] text-center text-slate-500">5 wrong attempts lock the account for 15 minutes.</p>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
