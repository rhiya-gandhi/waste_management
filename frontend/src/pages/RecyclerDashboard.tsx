import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/supabase';
import {
  RecyclerFacility,
  AcceptedMaterial,
  WasteBatch,
  MaterialCategory,
} from '../types/database.types';
import {
  Factory,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  PlusCircle,
  FileCheck,
  RefreshCw,
  Package,
} from 'lucide-react';

export const RecyclerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [facility, setFacility] = useState<RecyclerFacility | null>(null);
  const [materials, setMaterials] = useState<AcceptedMaterial[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<WasteBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Handover confirmation modal state
  const [activeBatchForHandover, setActiveBatchForHandover] = useState<WasteBatch | null>(null);
  const [receivedKg, setReceivedKg] = useState<number>(0);
  const [assessedContamination, setAssessedContamination] = useState<number>(0);
  const [qualityAccepted, setQualityAccepted] = useState<boolean>(true);
  const [handoverNotes, setHandoverNotes] = useState<string>('');
  const [isSubmittingHandover, setIsSubmittingHandover] = useState<boolean>(false);

  // Add rule modal state
  const [showAddRule, setShowAddRule] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<MaterialCategory>('plastic');
  const [newMaxContamination, setNewMaxContamination] = useState<number>(15);
  const [newMinKg, setNewMinKg] = useState<number>(10);
  const [newPrice, setNewPrice] = useState<number>(12);

  const loadData = async () => {
    setLoading(true);
    try {
      const recyclers = await DataService.getRecyclers(true);
      const fac =
        recyclers.find((r) => r.user_id === currentUser?.id) ||
        recyclers[0]; // Fallback to first demo recycler
      setFacility(fac);
      setMaterials(fac.accepted_materials || []);

      // Get batches that have been delivered to gate
      const allBatches = await DataService.getBatches();
      setPendingDeliveries(allBatches.filter((b) => b.status === 'delivered'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleOpenHandover = (batch: WasteBatch) => {
    setActiveBatchForHandover(batch);
    setReceivedKg(batch.quantity);
    setAssessedContamination(batch.estimated_contamination_percent);
    setQualityAccepted(true);
    setHandoverNotes('Material inspected at intake gate. Specifications validated.');
  };

  const handleConfirmHandover = async () => {
    if (!activeBatchForHandover || !facility) return;
    setIsSubmittingHandover(true);
    try {
      await DataService.confirmHandover({
        collection_request_id: 'cr-demo',
        batch_id: activeBatchForHandover.id,
        recycler_id: facility.id,
        received_quantity: receivedKg,
        quantity_unit: 'kg',
        assessed_contamination_percent: assessedContamination,
        quality_accepted: qualityAccepted,
        rejection_reason: qualityAccepted ? undefined : 'Excessive contamination at sorting stage',
        digital_signature_or_code: 'SIG-VERIFIED-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      });

      alert('Handover sign-off recorded! Batch is now officially Confirmed in the audit log.');
      setActiveBatchForHandover(null);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to confirm handover');
    } finally {
      setIsSubmittingHandover(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facility) return;
    try {
      const created = await DataService.saveAcceptedMaterial({
        recycler_id: facility.id,
        material_category: newCategory,
        specific_subtypes: ['Standard segregated stream'],
        max_contamination_percent: newMaxContamination,
        min_quantity_kg: newMinKg,
        price_per_kg: newPrice,
        accepts_pickup: true,
        accepts_dropoff: true,
      });
      setMaterials([...materials, created]);
      setShowAddRule(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save material rule');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {facility?.facility_name || 'Recycling Facility Hub'}
            </h1>
            {facility?.verification_status === 'verified' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Facility
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Pending Admin Review
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registration: <code className="font-mono">{facility?.business_reg_number}</code> • Location: {facility?.facility_address}
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Grid: Pending Handover Deliveries & Accepted Material Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Pending Intake Deliveries */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-purple-600" />
              Incoming Gate Deliveries ({pendingDeliveries.length})
            </h2>
            <span className="text-xs text-slate-500">Requires Recycler Handover Sign-off</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading deliveries...</div>
          ) : pendingDeliveries.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No batches waiting at intake gate</p>
              <p className="text-xs text-slate-400 mt-1">
                When a collector marks a batch as "Delivered to Facility", it will appear here for weighing and quality certification.
              </p>
            </div>
          ) : (
            pendingDeliveries.map((batch) => (
              <div
                key={batch.id}
                className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{batch.title}</h3>
                    <p className="text-xs text-slate-500">
                      Declared: {batch.quantity} {batch.unit} • {batch.material_category} • Estimated Contamination: {batch.estimated_contamination_percent}%
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    Delivered at Gate
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">📍 From: {batch.pickup_address}</span>
                  <button
                    onClick={() => handleOpenHandover(batch)}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Inspect & Sign-off Handover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Accepted Material Rules */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-brand-600" />
                Material Acceptance Criteria
              </h3>
              <p className="text-[11px] text-slate-400">Rules applied by the deterministic matcher</p>
            </div>
            <button
              onClick={() => setShowAddRule(!showAddRule)}
              className="text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg border border-brand-200 transition-colors flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add Rule
            </button>
          </div>

          {/* Add Rule Form */}
          {showAddRule && (
            <form onSubmit={handleCreateRule} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Add Material Specification</h4>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MaterialCategory)}
                  className="w-full text-xs rounded-lg border-slate-300 py-1.5"
                >
                  <option value="plastic">Plastic</option>
                  <option value="paper_cardboard">Paper & Cardboard</option>
                  <option value="metal">Metal</option>
                  <option value="glass">Glass</option>
                  <option value="e_waste">E-Waste</option>
                  <option value="organic">Organic</option>
                  <option value="textile">Textile</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600">Max Contam %</label>
                  <input
                    type="number"
                    value={newMaxContamination}
                    onChange={(e) => setNewMaxContamination(parseFloat(e.target.value))}
                    className="w-full text-xs rounded-lg border-slate-300 py-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600">Min kg</label>
                  <input
                    type="number"
                    value={newMinKg}
                    onChange={(e) => setNewMinKg(parseFloat(e.target.value))}
                    className="w-full text-xs rounded-lg border-slate-300 py-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600">₹ Rate/kg</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                    className="w-full text-xs rounded-lg border-slate-300 py-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddRule(false)}
                  className="text-xs px-2.5 py-1 text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs px-3 py-1 bg-brand-600 text-white rounded-lg font-semibold"
                >
                  Save Specification
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2.5">
            {materials.map((m) => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="capitalize">{m.material_category.replace('_', ' ')}</span>
                  <span className="text-brand-700 font-mono">₹{m.price_per_kg}/kg</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Max Contamination: {m.max_contamination_percent}%</span>
                  <span>Min Quantity: {m.min_quantity_kg} kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Handover Sign-Off Modal */}
      {activeBatchForHandover && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                Final Handover Verification
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                Intake Sign-off for "{activeBatchForHandover.title}"
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Verified Weight Received (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={receivedKg}
                  onChange={(e) => setReceivedKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assessed Contamination: {assessedContamination}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={assessedContamination}
                  onChange={(e) => setAssessedContamination(parseInt(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qualityAccepted}
                    onChange={(e) => setQualityAccepted(e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span>Quality passes intake standards. Authorize official recycling sign-off.</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Intake Inspection Notes
                </label>
                <input
                  type="text"
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveBatchForHandover(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingHandover}
                onClick={handleConfirmHandover}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-600/20 flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" />
                {isSubmittingHandover ? 'Recording...' : 'Certify Handover & Update Timeline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
