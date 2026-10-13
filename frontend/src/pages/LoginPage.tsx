import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Recycle, LogIn, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { UserRole } from '../types/database.types';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide an email address.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await login(email);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    switchDemoRole(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-brand-500/20">
            <Recycle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In to WasteRoute</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access role-specific logistics and recycling controls
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. society@wasteroute.local"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Test Personas */}
        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-3 text-center">
            🚀 1-Click Fast Sign-In with Demo Personas:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('generator')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 font-semibold text-left transition-colors"
            >
              🏢 Generator
              <span className="block text-[10px] text-slate-400 font-normal">Palm Grove Society</span>
            </button>
            <button
              onClick={() => handleQuickLogin('collector')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-200 font-semibold text-left transition-colors"
            >
              🚚 Collector
              <span className="block text-[10px] text-slate-400 font-normal">Ravi CleanLogistics</span>
            </button>
            <button
              onClick={() => handleQuickLogin('recycler')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-slate-200 hover:border-purple-200 font-semibold text-left transition-colors"
            >
              🏭 Recycler
              <span className="block text-[10px] text-slate-400 font-normal">EcoPlast Circular Hub</span>
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-200 font-semibold text-left transition-colors"
            >
              🛡️ System Admin
              <span className="block text-[10px] text-slate-400 font-normal">KYC & Verifications</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
