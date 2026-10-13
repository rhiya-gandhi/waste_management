import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DataService } from '../services/supabase';
import { WasteBatch, RecyclerFacility } from '../types/database.types';
import { rankMatchingRecyclers, MatchResult } from '../services/matchingEngine';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MapPin,
  Truck,
  ShieldCheck,
  Send,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const RecyclerMatchingPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();

  const [batch, setBatch] = useState<WasteBatch | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingRecyclerId, setRequestingRecyclerId] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const loadData = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const b = await DataService.getBatchById(batchId);
      setBatch(b);

      if (b) {
        // Fetch all verified facilities
        const recyclers = await DataService.getRecyclers(true);
        const ranked = rankMatchingRecyclers(b, recyclers);
        setMatchResults(ranked);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [batchId]);

  const handleRequestCollection = async (recyclerId: string) => {
    if (!batch) return;
    setRequestingRecyclerId(recyclerId);
    try {
      await DataService.createCollectionRequest({
        batch_id: batch.id,
        recycler_id: recyclerId,
      });

      // Update batch status to collection_requested
      await DataService.updateBatchStatus(
        batch.id,
        'collection_requested',
        batch.generator_id,
        'generator',
        'Generator requested collection dispatch'
      );

      setRequestSuccess('Collection request dispatched! Notified matching logistics collectors.');
      setTimeout(() => {
        navigate(`/batch/${batch.id}`);
      }, 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to request collection');
    } finally {
      setRequestingRecyclerId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
        <p className="text-sm">Running deterministic matching rules against verified recycler registry...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <p className="text-sm font-semibold text-slate-800">Batch not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-xs text-brand-600 font-semibold underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const matchingCount = matchResults.filter((m) => m.isMatch).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Batch
      </button>

      {/* Batch Header Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
            Deterministic Rule Matcher
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Matching Recyclers for "{batch.title}"
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Category: <strong className="capitalize text-slate-700">{batch.material_category.replace('_', ' ')}</strong> • Volume: <strong className="text-slate-700">{batch.quantity} {batch.unit}</strong> • Contamination: <strong className="text-slate-700">{batch.estimated_contamination_percent}%</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="text-xs font-semibold text-slate-600">
            Found <strong className="text-brand-600 text-base">{matchingCount}</strong> Compatible Facilities
          </span>
        </div>
      </div>

      {requestSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{requestSuccess}</span>
        </div>
      )}

      {/* Matching Results List */}
      <div className="space-y-4">
        {matchResults.map(({ recycler, isMatch, score, distanceKm, matchingRule, reasons, disqualificationReasons }) => (
          <div
            key={recycler.id}
            className={`bg-white rounded-2xl border p-6 transition-all ${
              isMatch
                ? 'border-brand-200 shadow-sm hover:border-brand-400'
                : 'border-slate-200 opacity-70 bg-slate-50/50'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">
                    {recycler.facility_name}
                  </h3>
                  {recycler.verification_status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Pending Verification
                    </span>
                  )}
                  {distanceKm !== null && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {distanceKm} km away
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  📍 {recycler.facility_address} • Reg: <code className="text-slate-600 font-mono text-[11px]">{recycler.business_reg_number}</code>
                </p>

                {matchingRule && (
                  <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                    <span className="font-semibold text-brand-700">
                      Off-take Rate: ₹{matchingRule.price_per_kg}/kg
                    </span>
                    <span>•</span>
                    <span>Max Contamination: {matchingRule.max_contamination_percent}%</span>
                    <span>•</span>
                    <span>Capacity: {matchingRule.min_quantity_kg}kg - {matchingRule.max_quantity_kg ? matchingRule.max_quantity_kg + 'kg' : '∞'}</span>
                  </div>
                )}

                {/* Match Diagnostics / Explanations */}
                <div className="pt-2">
                  {isMatch ? (
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-brand-700 uppercase tracking-wider">
                        Criteria Met:
                      </p>
                      <ul className="text-xs text-slate-600 space-y-0.5">
                        {reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                        Disqualification Reasons:
                      </p>
                      <ul className="text-xs text-rose-600 space-y-0.5">
                        {disqualificationReasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <XCircle className="w-3 h-3 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Column */}
              <div className="flex flex-col items-end justify-between gap-3 shrink-0 lg:border-l lg:border-slate-100 lg:pl-6">
                {isMatch && (
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Compatibility</span>
                    <p className="text-2xl font-black text-brand-600">{score}%</p>
                  </div>
                )}

                {isMatch ? (
                  <button
                    disabled={requestingRecyclerId === recycler.id || batch.status !== 'available'}
                    onClick={() => handleRequestCollection(recycler.id)}
                    className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-600/20 flex items-center gap-1.5 transition-all disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {requestingRecyclerId === recycler.id
                      ? 'Dispatching...'
                      : 'Request Collection Pickup'}
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">
                    Not eligible for this batch
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
