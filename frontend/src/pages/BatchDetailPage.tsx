import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/supabase';
import { WasteBatch, WasteStatusHistory } from '../types/database.types';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { MapView } from '../components/MapView';
import {
  Package,
  ArrowLeft,
  Search,
  MapPin,
  Calendar,
  Scale,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

export const BatchDetailPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [batch, setBatch] = useState<WasteBatch | null>(null);
  const [history, setHistory] = useState<WasteStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const b = await DataService.getBatchById(batchId);
      setBatch(b);
      const h = await DataService.getStatusHistory(batchId);
      setHistory(h);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [batchId]);

  const handleCancelBatch = async () => {
    if (!batch || !currentUser) return;
    if (!confirm('Are you sure you want to cancel this batch listing?')) return;
    try {
      await DataService.updateBatchStatus(
        batch.id,
        'cancelled',
        currentUser.id,
        currentUser.role,
        'Batch cancelled by generator'
      );
      loadData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel batch');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
        <p className="text-sm">Retrieving batch details and audit trail...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <p className="text-sm font-semibold text-slate-800">Batch listing not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-xs text-brand-600 font-semibold underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Listings
      </button>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-5">
          {batch.image_url ? (
            <img
              src={batch.image_url}
              alt={batch.title}
              className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
              <Package className="w-8 h-8" />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {batch.title}
              </h1>
              <StatusBadge status={batch.status} size="lg" />
            </div>

            <p className="text-xs text-slate-500">
              Batch ID: <code className="font-mono text-slate-600 font-medium">{batch.id}</code> • Created:{' '}
              {new Date(batch.created_at).toLocaleDateString()}
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap pt-1">
              <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-500" />
                {batch.quantity} {batch.unit}
              </span>
              <span className="capitalize font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                {batch.material_category.replace('_', ' ')}
              </span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                Condition: <strong className="capitalize">{batch.condition_description}</strong>
              </span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                Contamination: <strong>{batch.estimated_contamination_percent}%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start shrink-0">
          {batch.status === 'available' && (
            <>
              <Link
                to={`/batch/${batch.id}/match`}
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-600/20 flex items-center gap-1.5 transition-transform hover:-translate-y-0.5"
              >
                <Search className="w-3.5 h-3.5" />
                Find Matching Recyclers
              </Link>
              <button
                onClick={handleCancelBatch}
                className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel
              </button>
            </>
          )}

          {batch.status === 'confirmed' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Handover verified & certified by recycler.</span>
            </div>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {actionError}
        </div>
      )}

      {/* Grid: Details & Map + Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Details & Geolocation */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Inspection Card (if available) */}
          {batch.ai_classification_result && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-600" /> AI Vision Metadata
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Model Architecture</span>
                  <span className="font-semibold text-slate-800">{batch.ai_classification_result.model_name}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Detected Class</span>
                  <span className="font-semibold text-slate-800 font-mono">{batch.ai_classification_result.detected_class}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Similarity Score</span>
                  <span className="font-semibold text-brand-700 font-mono">{batch.ai_classification_result.raw_confidence_score} (Raw)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">User Verification</span>
                  <span className="font-semibold text-slate-800">
                    {batch.ai_classification_result.user_corrected ? 'Manually Corrected' : 'Confirmed by User'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Location & Map */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-600" /> Geolocation & Pickup Point
            </h3>
            <p className="text-xs text-slate-700">
              📍 <strong>Address:</strong> {batch.pickup_address}
            </p>
            {batch.notes && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <strong>Handling Notes:</strong> {batch.notes}
              </p>
            )}

            <div className="pt-2">
              <MapView batches={[batch]} zoom={13} height="280px" maskPrivateAddresses={false} />
            </div>
          </div>
        </div>

        {/* Right Column: Immutable Audit Timeline */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              Auditable Status Timeline
            </h3>
            <span className="text-[11px] font-mono text-slate-400">PostgreSQL Log</span>
          </div>

          <Timeline history={history} />
        </div>
      </div>
    </div>
  );
};
