import React, { useEffect, useState } from 'react';
import { DataService } from '../services/supabase';
import { RecyclerFacility, WasteBatch, MaterialCategory } from '../types/database.types';
import { MapView } from '../components/MapView';
import { MapPin, Filter, Factory, Package, RefreshCw, ShieldCheck } from 'lucide-react';

export const MapViewPage: React.FC = () => {
  const [recyclers, setRecyclers] = useState<RecyclerFacility[]>([]);
  const [batches, setBatches] = useState<WasteBatch[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const recs = await DataService.getRecyclers();
      setRecyclers(recs);
      const b = await DataService.getBatches();
      setBatches(b.filter((item) => ['available', 'assigned'].includes(item.status)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecyclers = selectedCategory === 'all'
    ? recyclers
    : recyclers.filter((r) =>
        r.accepted_materials?.some((m) => m.material_category === selectedCategory)
      );

  const filteredBatches = selectedCategory === 'all'
    ? batches
    : batches.filter((b) => b.material_category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-brand-600" />
            Circular Infrastructure Map
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            OpenStreetMap geospatial visualization • Coordinates protected by privacy masking
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs rounded-xl border-slate-300 bg-white font-medium py-2 px-3 focus:ring-brand-500"
          >
            <option value="all">All Material Categories</option>
            <option value="plastic">Plastics Only</option>
            <option value="paper_cardboard">Paper & Cardboard Only</option>
            <option value="metal">Metals Only</option>
            <option value="glass">Glass Only</option>
            <option value="e_waste">E-Waste Only</option>
          </select>

          <button
            onClick={loadData}
            title="Refresh map points"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400">Loading map markers...</div>
      ) : (
        <>
          {/* Leaflet Map Component */}
          <MapView
            recyclers={filteredRecyclers}
            batches={filteredBatches}
            height="500px"
            maskPrivateAddresses={true}
          />

          {/* List-Based Fallback and Directory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Recyclers Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Factory className="w-4 h-4 text-emerald-600" /> Verified Processing Plants
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {filteredRecyclers.length} Facilities
                </span>
              </h3>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredRecyclers.map((r) => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{r.facility_name}</span>
                      <span className="text-slate-500 font-normal">Max Radius: {r.max_distance_km} km</span>
                    </div>
                    <p className="text-[11px] text-slate-500">📍 {r.facility_address}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Batches Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-sky-600" /> Available Waste Batches
                </span>
                <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                  {filteredBatches.length} Batches
                </span>
              </h3>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredBatches.map((b) => (
                  <div key={b.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{b.title}</span>
                      <span className="text-brand-700 font-semibold">{b.quantity} {b.unit}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      📍 {b.pickup_address.split(',').slice(-2).join(',') || 'Neighborhood Sector'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
