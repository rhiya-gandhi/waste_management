import React, { useEffect, useState } from 'react';
import { DataService } from '../services/supabase';
import { RecyclerFacility, MaterialCategory } from '../types/database.types';
import { Factory, ShieldCheck, MapPin, Search, Filter, RefreshCw, Scale } from 'lucide-react';

export const RecyclerDirectoryPage: React.FC = () => {
  const [recyclers, setRecyclers] = useState<RecyclerFacility[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await DataService.getRecyclers();
      setRecyclers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = recyclers.filter((r) => {
    const matchesSearch =
      r.facility_name.toLowerCase().includes(search.toLowerCase()) ||
      r.facility_address.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' ||
      r.accepted_materials?.some((m) => m.material_category === filterCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Factory className="w-6 h-6 text-brand-600" />
            Verified Recycler Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified off-takers and processing plants with auditable acceptance rules
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search facility name, industrial area, or street address..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:ring-brand-500 bg-white"
          >
            <option value="all">All Material Categories</option>
            <option value="plastic">Plastics Only</option>
            <option value="paper_cardboard">Paper & Cardboard Only</option>
            <option value="metal">Metals Only</option>
            <option value="glass">Glass Only</option>
            <option value="e_waste">E-Waste Only</option>
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="py-24 text-center text-slate-400">Loading verified recyclers...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <p className="text-sm font-semibold">No recycling facilities match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {r.facility_name}
                  </h3>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  📍 {r.facility_address}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-slate-600 pt-1">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    Reg: {r.business_reg_number}
                  </span>
                  <span>•</span>
                  <span>Service Radius: <strong>{r.max_distance_km} km</strong></span>
                </div>

                {/* Accepted Materials List */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Accepted Materials:
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {r.accepted_materials?.map((m) => (
                      <div key={m.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center justify-between">
                        <span className="capitalize font-semibold text-slate-800">
                          {m.material_category.replace('_', ' ')}
                        </span>
                        <div className="text-right text-[11px]">
                          <span className="font-bold text-brand-700">₹{m.price_per_kg}/kg</span>
                          <span className="text-slate-400 block text-[10px]">Contam ≤ {m.max_contamination_percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Contact: <span className="text-slate-600 font-medium">{r.contact_email || r.contact_phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
