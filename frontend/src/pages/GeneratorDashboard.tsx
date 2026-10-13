import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WasteBatch } from '../types/database.types';
import { DataService } from '../services/supabase';
import { StatusBadge } from '../components/StatusBadge';
import { PlusCircle, Search, Package, MapPin, ArrowRight, RefreshCw, Sparkles, Scale } from 'lucide-react';

export const GeneratorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [batches, setBatches] = useState<WasteBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await DataService.getBatches({ generatorId: currentUser?.id });
      setBatches(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const totalKg = batches.reduce((acc, b) => acc + (b.unit === 'tonnes' ? b.quantity * 1000 : b.quantity), 0);
  const activeBatches = batches.filter((b) => ['available', 'collection_requested', 'assigned', 'picked_up'].includes(b.status));
  const confirmedBatches = batches.filter((b) => b.status === 'confirmed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Generator Logistics Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong className="text-slate-700">{currentUser?.full_name}</strong> • Facility: {currentUser?.address_line || 'Indiranagar Cluster'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh listings"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/create-batch"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-600/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            Create Waste Listing
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Listings</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{batches.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active In-Transit</span>
          <p className="text-2xl font-extrabold text-sky-600 mt-1">{activeBatches.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Volume Logged</span>
          <p className="text-2xl font-extrabold text-brand-600 mt-1">{totalKg.toLocaleString()} <span className="text-sm font-semibold">kg</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Handover Confirmed</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{confirmedBatches.length}</p>
        </div>
      </div>

      {/* Batches Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Your Waste Batches</h2>
          <span className="text-xs text-slate-500">{batches.length} Batches Total</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
            <p className="text-xs">Loading listings from database...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No waste batches listed yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Start by uploading a waste photograph with AI inspection to find compatible nearby recyclers.
            </p>
            <Link
              to="/create-batch"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Create First Batch
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {batch.image_url ? (
                    <img
                      src={batch.image_url}
                      alt={batch.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/batch/${batch.id}`}
                        className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors"
                      >
                        {batch.title}
                      </Link>
                      <StatusBadge status={batch.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        {batch.quantity} {batch.unit}
                      </span>
                      <span>•</span>
                      <span className="capitalize text-slate-600 font-medium">
                        {batch.material_category.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">
                        Contamination: <strong>{batch.estimated_contamination_percent}%</strong>
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-md">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {batch.pickup_address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <Link
                    to={`/batch/${batch.id}/match`}
                    className="px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs border border-brand-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-brand-600" />
                    Match Recyclers
                  </Link>

                  <Link
                    to={`/batch/${batch.id}`}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1"
                  >
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
