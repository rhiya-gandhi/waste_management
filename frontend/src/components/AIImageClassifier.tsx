import React, { useState, useRef } from 'react';
import { Upload, Camera, Sparkles, Check, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AIClassificationResult, MaterialCategory } from '../types/database.types';
import { classifyWastePhoto } from '../services/aiClassifier';

interface AIImageClassifierProps {
  onClassificationComplete: (result: AIClassificationResult, previewUrl: string) => void;
  initialCategory?: MaterialCategory;
}

const CATEGORY_OPTIONS: { value: MaterialCategory; label: string }[] = [
  { value: 'plastic', label: 'Plastic (Bottles, Containers, Wraps)' },
  { value: 'paper_cardboard', label: 'Paper & Cardboard (Boxes, Packaging, Newspaper)' },
  { value: 'metal', label: 'Metal (Cold drink cans, Tins, Foil)' },
  { value: 'glass', label: 'Glass (Bottles, Jars)' },
  { value: 'organic', label: 'Organic (Food scraps, Vegetable peels, Tea/Coffee)' },
  { value: 'e_waste', label: 'Electronic Waste (Cables, Chargers, Batteries)' },
  { value: 'textile', label: 'Clothes & Footwear' },
  { value: 'other', label: 'Other Waste' },
];

export const AIImageClassifier: React.FC<AIImageClassifierProps> = ({
  onClassificationComplete,
  initialCategory = 'plastic',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState<boolean>(true); // Default true for convenience
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [classificationResult, setClassificationResult] = useState<AIClassificationResult | null>(null);
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
        setErrorMessage('Please choose a valid photo file (JPEG, PNG).');
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
      setErrorMessage('Please select or snap a photo of the waste first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await classifyWastePhoto(selectedFile, consentGiven);
      if (response.success && response.result) {
        setClassificationResult(response.result);
        setSelectedCategory(response.result.mapped_category);
        setIsUserCorrected(false);

        onClassificationComplete(response.result, previewUrl || '');
      } else {
        setErrorMessage(response.error || 'Could not analyze photograph.');
      }
    } catch {
      setErrorMessage('Failed to connect to image detector.');
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
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            Step 1: Upload Waste Photo
          </h3>
          <p className="text-xs text-slate-500">
            Our AI vision detector will instantly tell you what kind of waste it is.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Upload Box */}
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[220px] ${
              previewUrl
                ? 'border-brand-400 bg-brand-50/20'
                : 'border-slate-300 hover:border-brand-500 bg-slate-50/60 hover:bg-slate-50'
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
              <div className="relative w-full h-44 rounded-xl overflow-hidden group">
                <img
                  src={previewUrl}
                  alt="Waste item preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                  <RefreshCw className="w-4 h-4" /> Tap to change photo
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Tap here to take or choose photo
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports camera pictures and screenshots
                </p>
              </>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="mt-3">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>Allow AI to analyze this waste photo</span>
            </label>
          </div>

          {errorMessage && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Button */}
          <button
            type="button"
            disabled={!selectedFile || isAnalyzing}
            onClick={handleRunClassification}
            className={`mt-4 w-full py-3 px-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              !selectedFile || isAnalyzing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/20'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Detecting waste...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Detect Waste with AI
              </>
            )}
          </button>
        </div>

        {/* AI Detection Result for Common Man */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between min-h-[260px]">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              AI Detection Result
            </h4>

            {classificationResult ? (
              <div className="space-y-3">
                <div className="p-4 bg-white rounded-2xl border border-brand-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Detected Waste:</span>
                    <span className="text-sm font-black text-slate-900 capitalize bg-brand-50 text-brand-800 px-2.5 py-0.5 rounded-lg">
                      {classificationResult.mapped_category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Item Detail:</span>
                    <span className="font-semibold text-slate-700 capitalize">
                      {classificationResult.detected_class.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Condition:</span>
                    {classificationResult.is_mixed ? (
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Mixed Waste
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Clean / Segregated
                      </span>
                    )}
                  </div>
                </div>

                {/* If AI was mistaken, simple dropdown to adjust */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Not correct? Choose waste type manually:
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryOverride(e.target.value as MaterialCategory)}
                    className="w-full text-xs font-medium rounded-lg border-slate-300 bg-slate-50 py-1.5 px-2 focus:ring-brand-500"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No waste scanned yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload an image on the left and tap "Detect Waste with AI".
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-200 flex items-center justify-between">
            <span>Model: OpenCLIP Waste Classifier</span>
            <span>Accurate &bull; Fast</span>
          </div>
        </div>
      </div>
    </div>
  );
};
