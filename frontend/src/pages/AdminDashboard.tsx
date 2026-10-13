import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/supabase';
import { RecyclerFacility, WasteBatch } from '../types/database.types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  Users,
  Factory,
  Package,
  TrendingUp,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [recyclers, setRecyclers] = useState<RecyclerFacility[]>([]);
  const [batches, setBatches] = useState<WasteBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [activeRecycler, setActiveRecycler] = useState<RecyclerFacility | null>(null);
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const recs = await DataService.getRecyclers(true); // include pending
      setRecyclers(recs);
      const b = await DataService.getBatches();
      setBatches(b);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleDecision = async (status: 'verified' | 'rejected') => {
    if (!activeRecycler || !currentUser) return;
    setIsUpdating(true);
    try {
      await DataService.updateRecyclerVerification(
        activeRecycler.id,
        status,
        currentUser.id,
        decisionNotes || (status === 'verified' ? 'Approved by admin' : 'Rejected by admin')
      );
      alert(`Facility status updated to ${status}.`);
      setActiveRecycler(null);
      setDecisionNotes('');
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update verification status');
    } finally {
      setIsUpdating(false);
    }
  };

  const pendingRecyclers = recyclers.filter((r) => r.verification_status === 'pending');
  const verifiedRecyclers = recyclers.filter((r) => r.verification_status === 'verified');
  const totalVolumeDiverted = batches
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.unit === 'tonnes' ? b.quantity * 1000 : b.quantity), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-purple-600" />
            Compliance & Verification Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Admin: <strong className="text-slate-700">{currentUser?.full_name}</strong> • RLS Authorization Role: <code className="text-purple-700 font-mono">admin</code>
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Operational Reports (Actual Database Queries) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending KYC Audits</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingRecyclers.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Recyclers</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{verifiedRecyclers.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Batches</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{batches.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Certified Diverted</span>
          <p className="text-2xl font-extrabold text-brand-600 mt-1">{totalVolumeDiverted.toLocaleString()} <span className="text-sm font-semibold">kg</span></p>
        </div>
      </div>

      {/* Pending Verifications Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Factory className="w-5 h-5 text-amber-600" />
            Recycler Applications Awaiting Verification
          </h2>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            {pendingRecyclers.length} Pending
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading applications...</div>
        ) : pendingRecyclers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Verification inbox is clear!</p>
            <p className="text-xs text-slate-400 mt-1">
              All registered recycling facilities have been reviewed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingRecyclers.map((rec) => (
              <div
                key={rec.id}
                className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{rec.facility_name}</h3>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Pending Audit
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Registration: <code className="font-mono text-slate-700 font-semibold">{rec.business_reg_number}</code> • Service Radius: {rec.max_distance_km} km
                  </p>
                  <p className="text-xs text-slate-600">
                    📍 {rec.facility_address} • Contact: {rec.contact_phone || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      setActiveRecycler(rec);
                      setDecisionNotes('Audited facility machinery, waste disposal certifications, and pollution compliance.');
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    Review Application
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Recyclers List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Active Verified Facilities ({verifiedRecyclers.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {verifiedRecyclers.map((r) => (
            <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>{r.facility_name}</span>
                <span className="text-emerald-700 text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">Verified</span>
              </div>
              <p className="text-[11px] text-slate-500">{r.facility_address}</p>
              <p className="text-[10px] text-slate-400 italic">Audit Note: {r.verification_notes || 'Verified'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      {activeRecycler && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                Admin KYC Audit
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                Verify "{activeRecycler.facility_name}"
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Reg: <code className="font-mono">{activeRecycler.business_reg_number}</code> • {activeRecycler.facility_address}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Audit Notes / Justification *
              </label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Enter justification for approval or reason for rejection..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveRecycler(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleDecision('rejected')}
                className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
              >
                Reject Application
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleDecision('verified')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Certify Recycler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
