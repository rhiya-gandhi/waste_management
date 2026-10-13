import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Recycle, UserPlus, Shield } from 'lucide-react';
import { UserRole } from '../types/database.types';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('generator');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await register(email, fullName, role, address);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-brand-500/20">
            <Recycle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create an Account</h2>
          <p className="text-xs text-slate-500 mt-1">
            Join the WasteRoute circular network
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full / Organization Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Green Valley Society or Ravi Hauling"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@domain.com"
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
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500 bg-white"
            >
              <option value="generator">Waste Generator (Societies, Offices, Campuses)</option>
              <option value="collector">Logistics Collector (Trucks, Pickups, Drivers)</option>
              <option value="recycler">Recycler (Processing Plants & Materials Facilities)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3 text-slate-400" />
              Admin role cannot be self-assigned. Recycler accounts require admin KYC verification.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Address / Operating Base</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Indiranagar Sector 4, Bengaluru"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {isSubmitting ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
