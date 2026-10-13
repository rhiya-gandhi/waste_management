import React from 'react';
import { Recycle, Shield, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Recycle className="w-5 h-5 text-brand-400" />
              <span className="font-bold text-lg">WasteRoute</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering circular logistics by connecting verified waste generators with certified recyclers and tracking material handovers end-to-end.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-400" /> AI Classification
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Powered by open-source vision architecture (<span className="text-brand-300 font-mono">ysfad/openclip-finetune-waste</span>, MIT License) with transparent confidence scoring and user verification.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-brand-400" /> Trust & Privacy
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Row-Level Security (RLS) enforcement, address masking for generator safety, and tamper-evident audit history on every status transition.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Roles & Access</h4>
            <ul className="text-xs space-y-1.5 text-slate-400">
              <li>Generators: Log & classify waste batches</li>
              <li>Collectors: Accept pickup dispatches</li>
              <li>Recyclers: Inspect & sign off handovers</li>
              <li>Admins: Verify facility accreditations</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} WasteRoute Circular Platform. Built for Hackathons & Sustainable Cities.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Designed with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for zero-waste communities.
          </p>
        </div>
      </div>
    </footer>
  );
};
