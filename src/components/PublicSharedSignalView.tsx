import React, { useState, useEffect } from 'react';
import type { SharedSignal, TradingSignal } from '../types';
import { getSharedSignalById } from '../firebase';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Target,
  BarChart2,
  Brain,
  Layers,
  Flame,
  Globe,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Zap,
  ArrowRight,
  Send,
  MessageCircle,
  Linkedin,
  Compass,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface PublicSharedSignalViewProps {
  shareId: string;
  onNavigateHome: () => void;
  currentUserSignedIn?: boolean;
}

export const PublicSharedSignalView: React.FC<PublicSharedSignalViewProps> = ({
  shareId,
  onNavigateHome,
  currentUserSignedIn,
}) => {
  const [signal, setSignal] = useState<SharedSignal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadSharedSignal = async () => {
      setIsLoading(true);
      setError(null);
      let foundData: SharedSignal | null = null;

      // 1. Try Firestore
      try {
        foundData = await getSharedSignalById(shareId);
      } catch (err: any) {
        console.warn('Firestore fetch note:', err);
      }

      // 2. Try server cache endpoint
      if (!foundData) {
        try {
          const res = await fetch(`/api/share-signal/${encodeURIComponent(shareId)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.signal) {
              foundData = json.signal as SharedSignal;
            }
          }
        } catch (err) {
          console.warn('Server share fetch note:', err);
        }
      }

      // 3. Try localStorage cache
      if (!foundData && typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`shared_signal_${shareId}`);
          if (cached) {
            foundData = JSON.parse(cached) as SharedSignal;
          }
        } catch (_) {}
      }

      if (isMounted) {
        if (foundData) {
          setSignal(foundData);
        } else {
          setError('The requested shared signal could not be found or may have expired.');
        }
        setIsLoading(false);
      }
    };

    if (shareId) {
      loadSharedSignal();
    }

    return () => {
      isMounted = false;
    };
  }, [shareId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isBuy = signal?.direction === 'BUY';
  const shareText = signal
    ? `🎯 ${signal.pair} [${signal.direction}] Setup | Entry: ${signal.entryPrice} | TP1: ${signal.tp1} | SL: ${signal.stopLoss} | R/R: ${signal.riskReward} | ${signal.confidence}% Confidence.`
    : 'Forex Signal Analysis:';

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${window.location.href}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex flex-col items-center justify-center space-y-4 px-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center animate-pulse">
          <Sparkles className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-xs text-slate-400 font-mono tracking-wider">
          Loading Public Trade Signal Analysis...
        </p>
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex flex-col items-center justify-center space-y-5 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Globe className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h2 className="text-xl font-bold text-white">Signal Analysis Not Found</h2>
          <p className="text-xs text-slate-400">
            {error || 'This shared trading setup link is invalid or may have been removed by the trader.'}
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
        >
          Open Forex Signal Analyzer
        </button>
      </div>
    );
  }

  // Calculate pips for R/R visual display
  const entryNum = parseFloat(signal.entryPrice) || 0;
  const slNum = parseFloat(signal.stopLoss) || 0;
  const tp1Num = parseFloat(signal.tp1) || 0;
  const isJpy = signal.pair.includes('JPY');
  const isGold = signal.pair.includes('XAU');
  const mult = isGold ? 10 : (isJpy ? 100 : 10000);
  const riskPips = entryNum && slNum ? Math.abs(Math.round((entryNum - slNum) * mult)) : 25;
  const rewardPips = entryNum && tp1Num ? Math.abs(Math.round((tp1Num - entryNum) * mult)) : 65;

  return (
    <div className="min-h-screen bg-[#070a10] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Public Header */}
      <header className="border-b border-amber-500/20 bg-[#0b0e14]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3.5 cursor-pointer" onClick={onNavigateHome}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0b0e14] rounded-[10px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Forex Signal <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">Analyzer</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Public Verified Setup
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                View-Only Institutional Price Action & VSA Signal Presentation
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={onNavigateHome}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <span>{currentUserSignedIn ? 'Back to Terminal' : 'Scan Your Chart'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 w-full">
        {/* Creator & Verification Ribbon */}
        <div className="bg-[#0b0e19] border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
              {signal.authorName ? signal.authorName.charAt(0).toUpperCase() : 'T'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  Shared by {signal.authorName || 'Verified Prop Trader'}
                </span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Verified Setup
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Created: {new Date(signal.createdAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Social Quick Share Bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden md:inline">Share:</span>
            <button
              onClick={handleShareTwitter}
              title="Share on X (Twitter)"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <svg className="w-3.5 h-3.5 fill-current text-sky-400" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <button
              onClick={handleShareTelegram}
              title="Share on Telegram"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
            </button>
            <button
              onClick={handleShareWhatsApp}
              title="Share on WhatsApp"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <button
              onClick={handleShareLinkedIn}
              title="Share on LinkedIn"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <Linkedin className="w-3.5 h-3.5 text-blue-400" />
            </button>
          </div>
        </div>

        {/* Primary Signal Hero Card */}
        <div className="bg-[#0b0e19] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xl ${
                isBuy
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-rose-500/10'
              }`}>
                {isBuy ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
              </div>

              <div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                    isBuy
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {signal.direction} SIGNAL
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {signal.pair}
                  </h1>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {signal.timeframe}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs font-medium text-amber-300 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    {signal.analysisType}
                  </span>
                </div>
              </div>
            </div>

            {/* Confidence & R/R Badges */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="bg-[#070a12] border border-slate-800 px-4 py-2.5 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  Confluence
                </div>
                <div className="text-base font-bold text-amber-400 font-mono">
                  {signal.confidence}% High Prob
                </div>
              </div>

              <div className="bg-[#070a12] border border-slate-800 px-4 py-2.5 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Target className="w-3 h-3 text-emerald-400" />
                  Risk : Reward
                </div>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {signal.riskReward}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-xl bg-[#070a12] border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Entry</span>
              <div className="text-xl font-black text-white font-mono mt-1">{signal.entryPrice}</div>
              <span className="text-[10px] text-slate-500">Market execution</span>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">Invalidation Stop Loss</span>
              <div className="text-xl font-black text-rose-400 font-mono mt-1">{signal.stopLoss}</div>
              <span className="text-[10px] text-rose-300/70">{riskPips} pips risk</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Take Profit 1</span>
              <div className="text-xl font-black text-emerald-400 font-mono mt-1">{signal.tp1}</div>
              <span className="text-[10px] text-emerald-300/70">Scale out 50% (+{rewardPips}p)</span>
            </div>

            {signal.tp2 && (
              <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/25">
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Take Profit 2</span>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1">{signal.tp2}</div>
                <span className="text-[10px] text-emerald-300/70">Secondary liquidity pool</span>
              </div>
            )}

            {signal.tp3 && (
              <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20">
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Take Profit 3</span>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1">{signal.tp3}</div>
                <span className="text-[10px] text-emerald-300/70">Runner target</span>
              </div>
            )}
          </div>

          {/* Dynamic R/R Visual Bar Chart */}
          <div className="p-4 rounded-xl bg-[#070a12] border border-slate-800 space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-sans font-semibold">Visual Risk-to-Reward Execution Bar:</span>
              <span className="text-amber-400 font-bold">{signal.riskReward} Mathematical Expectancy</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
              <div
                style={{ width: `${Math.min(45, Math.max(15, Math.round((riskPips / (riskPips + rewardPips || 1)) * 100)))}%` }}
                className="bg-rose-500 flex items-center justify-center text-[9px] text-white font-bold"
                title={`Risk: ${riskPips} pips`}
              >
                1R Risk
              </div>
              <div
                style={{ width: `${Math.min(85, Math.max(55, Math.round((rewardPips / (riskPips + rewardPips || 1)) * 100)))}%` }}
                className="bg-emerald-500 flex items-center justify-center text-[9px] text-slate-950 font-black"
                title={`Reward: ${rewardPips} pips`}
              >
                Reward Target ({signal.riskReward})
              </div>
            </div>
          </div>
        </div>

        {/* Volume Spread Analysis (VSA) Card */}
        {signal.vsaSignalType && (
          <div className="bg-[#0b0e19] border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Volume Spread Analysis (VSA)</h3>
                  <p className="text-xs text-slate-400">Volume and spread dynamics validated</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {signal.vsaSignalType}
              </span>
            </div>

            {signal.vsaExplanation && (
              <p className="text-xs text-slate-300 leading-relaxed bg-[#070a12] p-4 rounded-xl border border-slate-800">
                {signal.vsaExplanation}
              </p>
            )}
          </div>
        )}

        {/* Detailed Quantitative Confluence Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#0b0e19] border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Market Structure & Liquidity Flow</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {signal.marketStructure}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0e19] border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-sky-300 uppercase tracking-wider">
              <Target className="w-4 h-4 text-sky-400" />
              <span>Key Supply & Demand Zones</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {signal.supportResistance}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0e19] border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Market Psychology & Order Flow</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {signal.marketPsychology}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0e19] border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>Candlestick Confirmation</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {signal.candlestickConfirmation}
            </p>
          </div>
        </div>

        {/* Chart Screenshot (if provided) */}
        {signal.imageUrl && (
          <div className="bg-[#0b0e19] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Original Technical Chart Screenshot</span>
            </h4>
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#05070d]">
              <img
                src={signal.imageUrl}
                alt={`${signal.pair} Chart`}
                className="w-full max-h-[500px] object-contain mx-auto"
              />
            </div>
          </div>
        )}

        {/* Call to Action Footer Card */}
        <div className="bg-gradient-to-r from-[#0d1322] via-[#090e1a] to-[#0d1322] border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">Generate Your Own Institutional AI Signals</h3>
            <p className="text-xs text-slate-400">
              Upload any chart screenshot (Forex, Crypto, Metals, Stocks, Indices) and receive instant, precise Entry, Stop Loss, Take Profit targets, and VSA confluence.
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/20 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Scan Chart on Forex Signal Analyzer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
};
