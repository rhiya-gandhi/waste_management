import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Recycle,
  Sparkles,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Building2,
  Factory,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { currentUser, switchDemoRole } = useAuth();

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-brand-50/50 via-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100/70 border border-brand-200 text-brand-800 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                AI-Driven Circular Logistics Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Bridging waste generators with{' '}
                <span className="text-brand-600 underline decoration-brand-300 decoration-wavy underline-offset-8">
                  verified recyclers
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                WasteRoute empowers societies, campuses, offices, and institutions to log recyclable batches with AI image inspection, discover compatible licensed recyclers based on deterministic quality criteria, and track material handover transparently.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to={currentUser ? '/create-batch' : '/register'}
                  className="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-lg shadow-brand-600/25 flex items-center gap-2 transition-transform hover:-translate-y-0.5"
                >
                  Create Waste Listing
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/recyclers"
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-sm flex items-center gap-2 transition-colors"
                >
                  Explore Recycler Directory
                </Link>
              </div>

              {/* Quick Demo Switcher on Hero */}
              <div className="pt-6 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  ⚡ 1-Click Role Switcher for Hackathon Judges & Testing:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => switchDemoRole('generator')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors"
                  >
                    Generator (Palm Grove Society)
                  </button>
                  <button
                    onClick={() => switchDemoRole('collector')}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200 transition-colors"
                  >
                    Collector (Ravi Logistics)
                  </button>
                  <button
                    onClick={() => switchDemoRole('recycler')}
                    className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold border border-purple-200 transition-colors"
                  >
                    Recycler (EcoPlast Hub)
                  </button>
                  <button
                    onClick={() => switchDemoRole('admin')}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors"
                  >
                    Admin (KYC Desk)
                  </button>
                </div>
              </div>
            </div>

            {/* Visual Feature Card */}
            <div className="lg:col-span-5">
              <div className="relative bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Live Waste Batch Pipeline
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md font-semibold">
                    Demo Mode Active
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">PET Plastic Bottles (45 kg)</span>
                      <span className="text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                        Available
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Indiranagar Community Drive • Contamination: 5%
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                      <span>Top Match: EcoPlast Hub</span>
                      <span className="font-bold text-brand-600">89% Match (14.5 km)</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">Cardboard Boxes (120 kg)</span>
                      <span className="text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded">
                        Assigned
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Assigned to Ravi CleanLogistics • Pickup in Progress
                    </p>
                  </div>

                  <div className="p-3 bg-brand-50 rounded-xl border border-brand-200 text-xs text-brand-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>PostgreSQL Row Level Security ensures tamper-proof handover logging.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step End-to-End Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">
            End-To-End Architecture
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How WasteRoute Coordinates Circular Recycling
          </h3>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Eliminating speculation with image-assisted categorization, deterministic constraint matching, and audited handover confirmations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-base mb-4">
              1
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">List & Inspect</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload batch photograph. OpenCLIP AI suggests candidate category and flags mixed conditions, with manual verification.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base mb-4">
              2
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Rule-Based Match</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deterministic matching tests contamination ceiling, batch volume, and Haversine distance, excluding unverified recyclers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base mb-4">
              3
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Dispatch & Transit</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Authorized collectors accept dispatches, verify physical pickup, and transport batch safely to the target facility gate.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base mb-4">
              4
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Handover Proof</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Recycler inspects delivered weight and quality, signing off the handover record into an immutable audit history timeline.
            </p>
          </div>
        </div>
      </section>

      {/* Stakeholder Ecosystem */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-2xl font-bold text-slate-900">Built for Multi-Sided Coordination</h3>
            <p className="text-xs text-slate-500 mt-2">
              Each stakeholder accesses specialized tools and strictly scoped database privileges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <Building2 className="w-8 h-8 text-brand-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">Waste Generators</h4>
              <p className="text-xs text-slate-600">
                Apartment complexes, universities, hospitals, and offices effortlessly find verified off-takers without guesswork.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <Truck className="w-8 h-8 text-sky-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">Logistics Collectors</h4>
              <p className="text-xs text-slate-600">
                Drivers and waste haulers find clustered pickups, optimize routes, and submit tamper-proof delivery handoffs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <Factory className="w-8 h-8 text-purple-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">Recycling Facilities</h4>
              <p className="text-xs text-slate-600">
                Define exact input material specifications, contamination ceilings, and receive pre-sorted batches meeting their processing line needs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
