import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/supabase';
import { WasteBatch, CollectionRequest } from '../types/database.types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Truck,
  Package,
  MapPin,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Camera,
  Navigation,
} from 'lucide-react';

export const CollectorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [availableRequests, setAvailableRequests] = useState<CollectionRequest[]>([]);
  const [assignedBatches, setAssignedBatches] = useState<WasteBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'assigned'>('available');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get collection requests needing assignment
      const allRequests = await DataService.getCollectionRequests();
      setAvailableRequests(allRequests.filter((r) => r.status === 'requested'));

      // 2. Get batches assigned to this collector
      const allBatches = await DataService.getBatches();
      setAssignedBatches(
        allBatches.filter((b) => ['assigned', 'picked_up', 'delivered'].includes(b.status))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleAcceptAssignment = async (requestId: string) => {
    if (!currentUser) return;
    try {
      await DataService.acceptCollectionAssignment(requestId, currentUser.id);
      alert('Assignment accepted! Moved to your Active Transits tab.');
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to accept assignment');
    }
  };

  const handleTransition = async (batchId: string, targetStatus: 'picked_up' | 'delivered', notes: string) => {
    if (!currentUser) return;
    try {
      await DataService.updateBatchStatus(
        batchId,
        targetStatus,
        currentUser.id,
        'collector',
        notes
      );
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed transition');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-7 h-7 text-sky-600" />
            Collector Logistics Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Driver: <strong className="text-slate-700">{currentUser?.full_name}</strong> • Vehicle Depot: {currentUser?.address_line || 'Depot 12'}
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'available'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Dispatches Awaiting Pickup ({availableRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'assigned'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Active Logistics Jobs ({assignedBatches.length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
          <p className="text-xs">Refreshing dispatch queue...</p>
        </div>
      ) : activeTab === 'available' ? (
        <div className="space-y-4">
          {availableRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No collection requests pending pickup</p>
              <p className="text-xs text-slate-400 mt-1">
                Generators post new batch dispatches which appear here in real-time.
              </p>
            </div>
          ) : (
            availableRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {req.batch?.title || 'Recyclable Batch'}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Dispatch Requested
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Volume: <strong>{req.batch?.quantity} {req.batch?.unit}</strong> • Target Facility:{' '}
                    <strong className="text-brand-700">{req.recycler?.facility_name || 'Verified Recycler'}</strong>
                  </p>

                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Pickup: {req.batch?.pickup_address}
                  </p>
                </div>

                <button
                  onClick={() => handleAcceptAssignment(req.id)}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition-all self-end md:self-center"
                >
                  Accept Pickup Job
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {assignedBatches.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No active transportation jobs</p>
            </div>
          ) : (
            assignedBatches.map((batch) => (
              <div
                key={batch.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{batch.title}</h3>
                      <StatusBadge status={batch.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {batch.quantity} {batch.unit} • {batch.material_category.replace('_', ' ')}
                    </p>
                  </div>

                  <Link
                    to={`/batch/${batch.id}`}
                    className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1 self-start"
                  >
                    View Timeline <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Workflow Action Controls */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    📍 <strong>Pickup Point:</strong> {batch.pickup_address}
                  </div>

                  <div className="flex items-center gap-2">
                    {batch.status === 'assigned' && (
                      <button
                        onClick={() =>
                          handleTransition(batch.id, 'picked_up', 'Collector confirmed physical pickup on-site')
                        }
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Confirm Physical Pickup
                      </button>
                    )}

                    {batch.status === 'picked_up' && (
                      <button
                        onClick={() =>
                          handleTransition(
                            batch.id,
                            'delivered',
                            'Batch arrived at recycler facility gate for inspection'
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirm Gate Delivery
                      </button>
                    )}

                    {batch.status === 'delivered' && (
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                        Awaiting Recycler Quality Sign-off
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
