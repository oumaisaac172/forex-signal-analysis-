import React, { useState, useRef, useEffect } from 'react';
import { SAMPLE_CHARTS } from '../data/sampleCharts';
import type { SampleChartPreset } from '../types';
import { DAILY_SCAN_LIMIT } from '../types';
import { processChartImage } from '../utils/imageProcessor';
import { AnnotationCanvas } from './AnnotationCanvas';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Crown,
  Lock,
  RotateCcw,
  Pencil,
} from 'lucide-react';

interface UploadSectionProps {
  onAnalyze: (payload: {
    imageBase64: string;
    mimeType: string;
    pairHint?: string;
    samplePreset?: SampleChartPreset;
    vsaOnly?: boolean;
  }) => Promise<void>;
  isAnalyzing: boolean;
  todayScansCount: number;
  isAdmin: boolean;
  prefilledPair?: string;
  onAdminResetQuota?: () => Promise<void>;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onAnalyze,
  isAnalyzing,
  todayScansCount,
  isAdmin,
  prefilledPair,
  onAdminResetQuota,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [pairHint, setPairHint] = useState<string>('');
  const [vsaOnly, setVsaOnly] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<SampleChartPreset | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [resettingQuota, setResettingQuota] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);

  // Sync prefilledPair when user clicks a pair from Watchlist
  useEffect(() => {
    if (prefilledPair) {
      setPairHint(prefilledPair.toUpperCase());
    }
  }, [prefilledPair]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLimitReached = !isAdmin && todayScansCount >= DAILY_SCAN_LIMIT;
  const remainingScans = Math.max(0, DAILY_SCAN_LIMIT - todayScansCount);

  // Allow pasting screenshots directly from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = (file: File) => {
    setInputError(null);
    if (!file.type.startsWith('image/')) {
      setInputError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setInputError('Image size exceeds 15MB limit. Please upload a smaller screenshot.');
      return;
    }

    setMimeType(file.type);
    setActivePreset(null);
    setPairHint(''); // Reset hint so Gemini AI computer vision detects the exact crypto or forex pair from the image
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      if (result) {
        const optimized = await processChartImage(result);
        setSelectedImage(optimized);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const convertSvgToPngDataUrl = (svgUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 920;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0d1117';
          ctx.fillRect(0, 0, 920, 500);
          ctx.drawImage(img, 0, 0, 920, 500);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(svgUrl);
        }
      };
      img.onerror = () => resolve(svgUrl);
      img.src = svgUrl;
    });
  };

  const handleSelectPreset = async (preset: SampleChartPreset) => {
    setActivePreset(preset);
    setPairHint(preset.pair);
    setInputError(null);

    let rawData = preset.imageUrl;
    if (preset.imageUrl.includes('svg')) {
      rawData = await convertSvgToPngDataUrl(preset.imageUrl);
    }
    const optimized = await processChartImage(rawData);
    setSelectedImage(optimized);
    setMimeType('image/png');
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setActivePreset(null);
    setPairHint('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) {
      setInputError(
        'Daily limit reached (5/5 scans used today). Anti-overtrading guard active to protect your capital.'
      );
      return;
    }

    if (!selectedImage) {
      setInputError('Please upload a chart screenshot or choose a sample chart.');
      return;
    }
    setInputError(null);
    await onAnalyze({
      imageBase64: selectedImage,
      mimeType,
      pairHint: pairHint.trim() || undefined,
      samplePreset: activePreset || undefined,
      vsaOnly,
    });
  };

  const handleAdminReset = async () => {
    if (!onAdminResetQuota) return;
    try {
      setResettingQuota(true);
      await onAdminResetQuota();
      setInputError(null);
    } finally {
      setResettingQuota(false);
    }
  };

  return (
    <div className="bg-[#090c13] border border-slate-800/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-8">
      {/* Upload Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <UploadCloud className="w-6 h-6 text-amber-400" />
            Chart Screenshot Upload
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Upload from TradingView, MetaTrader, or cTrader. AI detects asset, timeframe, and market structure from screenshot.
          </p>
        </div>

        {/* Daily Scan Counter & Discipline Guard Bar */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAdmin ? (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Admin: Unlimited Scans</span>
              {onAdminResetQuota && (
                <button
                  type="button"
                  onClick={handleAdminReset}
                  disabled={resettingQuota}
                  className="ml-2 text-[10px] text-amber-400 hover:text-white underline cursor-pointer flex items-center gap-0.5"
                  title="Reset daily scan count for testing"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Count ({todayScansCount})</span>
                </button>
              )}
            </div>
          ) : (
            <div className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
              isLimitReached
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}>
              <ShieldAlert className={`w-4 h-4 ${isLimitReached ? 'text-rose-400' : 'text-amber-400'}`} />
              <div>
                <span className="font-semibold">Discipline Guard: </span>
                <span className="font-mono font-bold text-amber-300">
                  {todayScansCount}/{DAILY_SCAN_LIMIT}
                </span>
                <span className="text-[11px] text-slate-400 ml-1">
                  ({remainingScans} left today)
                </span>
              </div>
              {/* Visual 5-pip indicators */}
              <div className="flex items-center gap-1 ml-1">
                {Array.from({ length: DAILY_SCAN_LIMIT }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx < todayScansCount
                        ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overtrading Warning Banner when limit reached */}
      {isLimitReached && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start space-x-3 shadow-lg">
          <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-300 text-sm">
              Daily Scan Limit Reached (5/5 Used) — Anti-Overtrading Guard Active
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Professional prop firms enforce strict daily trade and scan boundaries. Over-analyzing charts causes psychological fatigue, revenge trading, and forced setups. Review your past trades in the <strong>Analysis History</strong> panel. Your quota resets at 00:00 UTC.
            </p>
          </div>
        </div>
      )}

      {inputError && !isLimitReached && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{inputError}</span>
        </div>
      )}

      {/* Main Upload / Preview Area */}
      {!selectedImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!isLimitReached) fileInputRef.current?.click();
          }}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all flex flex-col items-center justify-center relative group ${
            isLimitReached
              ? 'opacity-60 cursor-not-allowed border-slate-800 bg-[#080b11]'
              : isDragOver
              ? 'border-amber-400 bg-amber-500/10 cursor-pointer'
              : 'border-slate-700/80 hover:border-amber-500/50 bg-[#0a0d16]/80 hover:bg-[#0c111c] cursor-pointer'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={isLimitReached}
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all shadow-lg shadow-amber-500/10">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            {isLimitReached
              ? 'Daily Scan Limit Reached (5/5)'
              : 'Drag & drop your chart screenshot here'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {isLimitReached ? (
              <span className="text-rose-400">Locked until next trading session to avoid overtrading.</span>
            ) : (
              <>
                or <span className="text-amber-400 font-medium underline underline-offset-2">browse files</span> on your computer (PNG, JPG, WebP supported)
              </>
            )}
          </p>
          <div className="flex items-center space-x-4 text-[11px] text-slate-500">
            <span>TradingView Screenshots</span>
            <span>•</span>
            <span>MetaTrader MT4 / MT5</span>
            <span>•</span>
            <span>Max 15MB</span>
          </div>
        </div>
      ) : (
        /* Image Preview Box */
        <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black/60 shadow-inner group">
          <div className="absolute top-3 right-3 z-20 flex items-center space-x-2">
            {activePreset && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                Preset: {activePreset.pair}
              </span>
            )}
            {!isAnnotating && (
              <button
                type="button"
                onClick={() => setIsAnnotating(true)}
                className="p-1.5 bg-black/70 hover:bg-amber-600/80 text-white rounded-lg backdrop-blur-md transition-colors cursor-pointer"
                title="Annotate image"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleClearImage}
              className="p-1.5 bg-black/70 hover:bg-rose-600/80 text-white rounded-lg backdrop-blur-md transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isAnnotating ? (
            <div className="p-4 bg-[#070a10]">
              <AnnotationCanvas
                imageSrc={selectedImage}
                onSave={(annotated) => {
                  setSelectedImage(annotated);
                  setIsAnnotating(false);
                }}
                onCancel={() => setIsAnnotating(false)}
              />
            </div>
          ) : (
            <div className="max-h-[360px] overflow-hidden flex items-center justify-center bg-[#070a10]">
              <img
                src={selectedImage}
                alt="Uploaded Chart"
                className="w-full h-auto max-h-[360px] object-contain"
              />
            </div>
          )}

          <div className="px-4 py-2.5 bg-[#0b0f19] border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400">
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Chart Loaded & Ready For Analysis (Timeframe & Asset Auto-Detected)
              </span>
              <span className="flex items-center gap-1 text-[11px] text-amber-300 font-mono">
                <Sparkles className="w-3 h-3 text-amber-400" />
                ✨ VSA Smart Axis & Timestamp Optimizer Active (Price Axis & Timestamp OCR Enhanced)
              </span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer font-medium self-start sm:self-auto"
            >
              Replace image
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Quick Sample Presets Bar */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Or Try A Preset Forex Chart Setup:
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">Click to instant-load</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_CHARTS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                activePreset?.id === preset.id
                  ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10'
                  : 'border-slate-800 bg-[#090d16] hover:border-slate-700 hover:bg-[#0d1220]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{preset.pair}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                  preset.suggestedSignal.direction === 'BUY'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {preset.suggestedSignal.direction}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">
                {preset.timeframe} • {preset.type.split('&')[0]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Optional Asset Hint Input (Timeframe is obtained from screenshot automatically) */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          Asset / Crypto / Forex Pair <span className="text-slate-500">(Optional hint or auto-detected by AI from screenshot)</span>
        </label>
        <input
          type="text"
          value={pairHint}
          onChange={(e) => setPairHint(e.target.value.toUpperCase())}
          placeholder="e.g. BTC/USDT, ETH/USD, SOL/USD, EUR/USD, GBP/JPY, XAU/USD"
          className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {/* VSA High Probability Mode Toggle */}
      <div className="p-4 rounded-xl bg-[#0a0d16] border border-slate-800 flex items-center justify-between">
        <div className="space-y-0.5 pr-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">VSA High Probability Mode</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              VSA Concept
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            When turned on, trade signals are generated strictly based on Volume Spread Analysis (No Demand, No Supply, Stopping Volume, Buying/Selling Climax, Effort vs Result).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVsaOnly(!vsaOnly)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            vsaOnly ? 'bg-amber-500' : 'bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              vsaOnly ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Primary Gold Action Button */}
      <div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedImage || isAnalyzing || isLimitReached}
          className={`w-full py-4 px-6 rounded-xl font-bold text-sm tracking-wide text-slate-950 uppercase transition-all shadow-xl flex items-center justify-center space-x-2.5 ${
            isLimitReached
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-amber-500/25 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none cursor-pointer'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-900 border-t-amber-100 rounded-full animate-spin" />
              <span>Scanning Candlesticks, Timeframe & Calculating Signal...</span>
            </>
          ) : isLimitReached ? (
            <>
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Daily Limit Reached (5/5 Scans Used)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>Analyze & Generate Signal</span>
            </>
          )}
        </button>

        {!isAdmin && (
          <div className="text-center text-[11px] text-slate-500 mt-2">
            Discipline Rule: Maximum 5 scans allowed per user per day • Resets midnight UTC
          </div>
        )}
      </div>
    </div>
  );
};
