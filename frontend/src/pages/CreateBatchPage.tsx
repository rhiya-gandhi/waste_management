import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/supabase';
import { AIImageClassifier } from '../components/AIImageClassifier';
import { AIClassificationResult, MaterialCategory } from '../types/database.types';
import {
  Upload,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Truck,
  Recycle,
} from 'lucide-react';

export const CreateBatchPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIClassificationResult | null>(null);
  const [userComment, setUserComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAICompleted = (result: AIClassificationResult, preview: string) => {
    setAiResult(result);
    setImageUrl(preview);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiResult) {
      setError('Please upload a photo and click "Analyze Waste Photograph" first.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Human-friendly title based on AI detection
      const humanCategoryTitle = aiResult.detected_class
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      // Default reasonable volume based on common household/society waste
      const estimatedWeightKg = aiResult.is_mixed ? 15 : 10;

      // 1. Create the waste batch with the user's note
      const created = await DataService.createBatch({
        generator_id: currentUser?.id || 'gen-demo',
        title: `${humanCategoryTitle} Pickup`,
        material_category: aiResult.mapped_category,
        quantity: estimatedWeightKg,
        unit: 'kg',
        estimated_contamination_percent: aiResult.is_mixed ? 25 : 5,
        condition_description: aiResult.is_mixed ? 'mixed' : 'clean',
        readiness: 'immediate',
        pickup_address: currentUser?.address_line || 'Tower C, Palm Grove Residency, Indiranagar',
        latitude: currentUser?.latitude || 12.9784,
        longitude: currentUser?.longitude || 77.6408,
        status: 'collection_requested',
        image_url: imageUrl || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
        ai_classification_result: aiResult,
        notes: userComment || 'No specific notes provided. Ready for pickup.',
      });

      // 2. Automatically dispatch to the nearest available collector & recycler
      const recyclers = await DataService.getRecyclers();
      const targetRecycler = recyclers[0] || null;

      if (targetRecycler) {
        await DataService.createCollectionRequest({
          batch_id: created.id,
          recycler_id: targetRecycler.id,
        });
      }

      setSuccessMessage('Pickup request created successfully! A nearby collector has been notified.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request pickup';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Friendly Header for the Common Man */}
      <div className="bg-gradient-to-r from-emerald-600 to-brand-600 rounded-3xl p-6 text-white shadow-lg shadow-brand-500/15">
        <div className="flex items-center gap-2 text-emerald-100 text-xs font-semibold uppercase tracking-wider">
          <Recycle className="w-4 h-4" /> Simple Waste Disposal
        </div>
        <h1 className="text-2xl font-black mt-1">
          Upload Photo & Request Pickup
        </h1>
        <p className="text-xs text-emerald-100 mt-1 max-w-xl">
          1. Upload a picture of your waste &bull; 2. AI automatically identifies it &bull; 3. Add any note for the collector and click Submit!
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Step 1: Upload and AI Detection */}
      <div className="space-y-4">
        <AIImageClassifier
          onClassificationComplete={handleAICompleted}
        />
      </div>

      {/* Step 2: Only ONE Comment Box and Submit Button */}
      {aiResult && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-brand-200 p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MessageSquare className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">
              Note for the Collector
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Add any message or details about this waste:
            </label>
            <textarea
              rows={3}
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="e.g. 2 large plastic bags, kept near Flat 302 / Security Gate 1. Please call on arrival."
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              💡 The collector assigned to your pickup will read this message directly.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>📍 Pickup Location: <strong>{currentUser?.address_line || 'Indiranagar Society, Bengaluru'}</strong></span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Nearest Collector will be alerted
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Dispatching Collector...' : 'Submit & Request Pickup'}
          </button>
        </form>
      )}
    </div>
  );
};
