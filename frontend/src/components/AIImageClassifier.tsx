import React, { useState, useRef } from 'react';
import { Upload, Camera, Sparkles, Check, AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { AIClassificationResult, MaterialCategory } from '../types/database.types';
import { classifyWastePhoto } from '../services/aiClassifier';

interface AIImageClassifierProps {
  onClassificationComplete: (result: AIClassificationResult, previewUrl: string) => void;
  initialCategory?: MaterialCategory;
}

const CATEGORY_OPTIONS: { value: MaterialCategory; label: string }[] = [
  { value: 'plastic', label: 'Plastic (PET, HDPE, Containers, Films)' },
  { value: 'paper_cardboard', label: 'Paper & Cardboard (Boxes, Office, Pulp)' },
  { value: 'metal', label: 'Metal (Aluminum cans, Steel, Wiring)' },
  { value: 'glass', label: 'Glass (Bottles, Jars, Containers)' },
  { value: 'e_waste', label: 'E-Waste (Electronics, Circuit boards, Cables)' },
  { value: 'organic', label: 'Organic / Compostable' },
  { value: 'textile', label: 'Textiles & Footwear' },
  { value: 'other', label: 'Other / Specialized Stream' },
];

export const AIImageClassifier: React.FC<AIImageClassifierProps> = ({
  onClassificationComplete,
  initialCategory = 'plastic',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [classificationResult, setClassificationResult] = useState<AIClassificationResult | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual correction state
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory>(initialCategory);
  const [isUserCorrected, setIsUserCorrected] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload a valid image file (JPEG, PNG, WEBP).');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setClassificationResult(null);
    }
  };

  const handleRunClassification = async () => {
    if (!selectedFile) {
      setErrorMessage('Please choose or capture a photograph first.');
      return;
    }
    if (!consentGiven) {
      setErrorMessage('Please grant consent to process the image for material detection.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await classifyWastePhoto(selectedFile, consentGiven);
      if (response.success && response.result) {
        setClassificationResult(response.result);
        setIsFallbackMode(response.isFallback);
        setSelectedCategory(response.result.mapped_category);
        setIsUserCorrected(false);

        onClassificationComplete(response.result, previewUrl || '');
      } else {
        setErrorMessage(response.error || 'Failed to analyze photograph.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during classification.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCategoryOverride = (newCat: MaterialCategory) => {
    setSelectedCategory(newCat);
    setIsUserCorrected(true);

    if (classificationResult) {
      const updated: AIClassificationResult = {
        ...classificationResult,
        mapped_category: newCat,
        user_corrected: true,
      };
      setClassificationResult(updated);
      onClassificationComplete(updated, previewUrl || '');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            AI-Assisted Material Inspection
          </h3>
          <p className="text-xs text-slate-500">
            Powered by <code className="text-brand-700 bg-brand-50 px-1 py-0.5 rounded">ysfad/openclip-finetune-waste</code> (MIT)
          </p>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Stage 6 AI
        </span>
      </div>

      {/* Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[220px] ${
              previewUrl
                ? 'border-brand-300 bg-brand-50/20'
                : 'border-slate-300 hover:border-brand-500 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="relative w-full h-44 rounded-lg overflow-hidden group">
                <img
                  src={previewUrl}
                  alt="Waste item preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                  <RefreshCw className="w-4 h-4" /> Change Image
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Select or drag a waste batch photograph
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPEG, PNG, WEBP (Max 10MB)
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-100"
                >
                  <Camera className="w-3.5 h-3.5" /> Browse Photos
                </button>
              </>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>
                <strong>Explicit Processing Consent:</strong> I agree to submit this waste photograph for automated material classification. No biometric or private identity data is stored.
              </span>
            </label>
          </div>

          {errorMessage && (
            <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Trigger Action */}
          <button
            type="button"
            disabled={!selectedFile || !consentGiven || isAnalyzing}
            onClick={handleRunClassification}
            className={`mt-4 w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              !selectedFile || !consentGiven || isAnalyzing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/20'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing visual stream...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Waste Photograph
              </>
            )}
          </button>
        </div>

        {/* Results & Verification Panel */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col justify-between min-h-[320px]">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Detection Diagnostics & Calibration
            </h4>

            {classificationResult ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-white rounded-xl border border-brand-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Detected Class:</span>
                    <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {classificationResult.detected_class}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Uncalibrated Similarity Score:
                    </span>
                    <span className="text-xs font-mono font-semibold text-brand-700">
                      {classificationResult.raw_confidence_score} (Raw Similarity)
                    </span>
                  </div>

                  {classificationResult.is_mixed && (
                    <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-1.5 text-xs text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{classificationResult.contamination_assessment}</span>
                    </div>
                  )}

                  {isFallbackMode && (
                    <div className="mt-2.5 p-2 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                      Note: Live FastAPI endpoint is currently offline; running client-side inspection heuristic.
                    </div>
                  )}
                </div>

                {/* Manual Correction Selector */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm or Manually Correct Material Category:
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryOverride(e.target.value as MaterialCategory)}
                    className="w-full text-xs font-medium rounded-lg border-slate-300 bg-slate-50 focus:border-brand-500 focus:ring-brand-500 py-2 px-2.5"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {isUserCorrected && (
                    <p className="text-[11px] text-brand-700 font-medium mt-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3 text-brand-600" />
                      Manual correction recorded for transparency.
                    </p>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-100/70 p-2.5 rounded-lg border border-slate-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500 inline mr-1" />
                  <strong>Honest AI Disclosure:</strong> Visual classifiers cannot verify resin density, chemical polymer codes, or toxic contamination. The confirmed material category above will govern recycler matching.
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">No analysis performed yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload an image and click analyze to extract candidates and review matching compatibility.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
            <span>Model: OpenCLIP ViT-B-16</span>
            <span>Classes: 30 Types</span>
          </div>
        </div>
      </div>
    </div>
  );
};
