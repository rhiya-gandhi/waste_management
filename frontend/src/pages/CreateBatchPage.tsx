import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/supabase';
import { AIImageClassifier } from '../components/AIImageClassifier';
import {
  AIClassificationResult,
  MaterialCategory,
  WasteCondition,
  QuantityUnit,
} from '../types/database.types';
import { Package, PlusCircle, ArrowLeft, MapPin, Scale, Calendar, AlertCircle } from 'lucide-react';

export const CreateBatchPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [materialCategory, setMaterialCategory] = useState<MaterialCategory>('plastic');
  const [quantity, setQuantity] = useState<number>(25);
  const [unit, setUnit] = useState<QuantityUnit>('kg');
  const [contaminationPercent, setContaminationPercent] = useState<number>(5);
  const [condition, setCondition] = useState<WasteCondition>('clean');
  const [readiness, setReadiness] = useState<'immediate' | 'scheduled'>('immediate');
  const [pickupAddress, setPickupAddress] = useState(
    currentUser?.address_line || 'Tower C, Palm Grove Residency, Indiranagar, Bengaluru'
  );
  const [latitude, setLatitude] = useState<number>(currentUser?.latitude || 12.9784);
  const [longitude, setLongitude] = useState<number>(currentUser?.longitude || 77.6408);
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIClassificationResult | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAICompleted = (result: AIClassificationResult, preview: string) => {
    setAiResult(result);
    setImageUrl(preview);
    setMaterialCategory(result.mapped_category);
    if (!title) {
      const formattedTitle = result.detected_class
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      setTitle(`${formattedTitle} Batch`);
    }
    if (result.is_mixed) {
      setCondition('mixed');
      setContaminationPercent(15);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || quantity <= 0 || !pickupAddress) {
      setError('Please fill all required batch fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await DataService.createBatch({
        generator_id: currentUser?.id || 'gen-demo',
        title,
        material_category: materialCategory,
        quantity,
        unit,
        estimated_contamination_percent: contaminationPercent,
        condition_description: condition,
        readiness,
        pickup_address: pickupAddress,
        latitude,
        longitude,
        status: 'available',
        image_url: imageUrl || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
        ai_classification_result: aiResult,
        notes,
      });

      // Navigate straight to deterministic matching engine for instant delight
      navigate(`/batch/${created.id}/match`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish batch listing';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Create New Waste Batch Listing
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload an image for automated vision analysis or manually configure material specifications.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. AI Image Classifier Section */}
      <AIImageClassifier
        onClassificationComplete={handleAICompleted}
        initialCategory={materialCategory}
      />

      {/* 2. Structured Batch Details Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Package className="w-5 h-5 text-brand-600" />
          Batch Specifications & Logistics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Batch Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Segregated Clean PET Bottles (Indiranagar Society)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirmed Material Category *
            </label>
            <select
              value={materialCategory}
              onChange={(e) => setMaterialCategory(e.target.value as MaterialCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500 bg-white"
            >
              <option value="plastic">Plastic (Bottles, Films, Polyethylene)</option>
              <option value="paper_cardboard">Paper & Cardboard (Boxes, Pulp)</option>
              <option value="metal">Metal (Aluminum cans, Scrap steel)</option>
              <option value="glass">Glass (Bottles, Beverage Jars)</option>
              <option value="e_waste">E-Waste (Circuits, Electronics)</option>
              <option value="organic">Organic / Compostable</option>
              <option value="textile">Textile / Footwear</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as QuantityUnit)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500 bg-white"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="tonnes">Tonnes</option>
                <option value="bags">Bags</option>
                <option value="items">Items</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Estimated Contamination: {contaminationPercent}%
              </label>
              <span className="text-[10px] text-slate-400">Recyclers specify max thresholds</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={contaminationPercent}
              onChange={(e) => setContaminationPercent(parseInt(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0% Pure</span>
              <span>25% Moderate</span>
              <span>50%+ Mixed</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as WasteCondition)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500 bg-white"
            >
              <option value="clean">Clean (Rinsed & Dried)</option>
              <option value="lightly_soiled">Lightly Soiled</option>
              <option value="heavily_soiled">Heavily Soiled</option>
              <option value="mixed">Mixed Stream</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pickup Address *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="e.g. Tower C, Palm Grove Residency, Indiranagar, Bengaluru"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Note: Exact street address is protected by RLS and revealed only to an assigned collector.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-xs"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Handling Notes / Access Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Segregated in blue bags, security gate entry via Gate 2"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-600/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            {isSubmitting ? 'Publishing Batch...' : 'Publish & Find Recyclers'}
          </button>
        </div>
      </form>
    </div>
  );
};
