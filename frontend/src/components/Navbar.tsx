import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Recycle, MapPin, PlusCircle, ShieldCheck, Truck, Factory, LogOut, User } from 'lucide-react';
import { UserRole } from '../types/database.types';

export const Navbar: React.FC = () => {
  const { currentUser, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Recycle className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                WasteRoute
              </span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-brand-600">
                Circular Logistics
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'text-brand-700 bg-brand-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {currentUser && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard') ? 'text-brand-700 bg-brand-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </Link>

                {currentUser.role === 'generator' && (
                  <Link
                    to="/create-batch"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    New Listing
                  </Link>
                )}

                <Link
                  to="/recyclers"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/recyclers') ? 'text-brand-700 bg-brand-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Recyclers
                </Link>

                <Link
                  to="/map"
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/map') ? 'text-brand-700 bg-brand-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Map View
                </Link>

                {currentUser.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin') ? 'text-purple-700 bg-purple-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Admin Desk
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* User Controls & Demo Switcher */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Role Switcher (Crucial for live hackathon demo flow) */}
            <div className="hidden sm:flex items-center gap-1 text-xs bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-slate-500 px-1 font-medium">Demo Role:</span>
              {(['generator', 'collector', 'recycler', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => switchDemoRole(r)}
                  className={`px-2 py-1 rounded text-xs font-semibold capitalize transition-all ${
                    currentUser?.role === r
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                    {currentUser.full_name?.charAt(0) || <User className="w-4 h-4" />}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                      {currentUser.full_name}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize font-medium">{currentUser.role}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
