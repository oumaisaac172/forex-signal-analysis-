import React, { useState, useEffect } from 'react';
import type { TradingSignal } from '../types';
import { publishSharedSignal } from '../firebase';
import {
  Share2,
  X,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Send,
  MessageCircle,
  Linkedin,
} from 'lucide-react';

interface ShareSignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: TradingSignal;
  authorName?: string;
}

export const ShareSignalModal: React.FC<ShareSignalModalProps> = ({
  isOpen,
  onClose,
  signal,
  authorName,
}) => {
  const [shareId, setShareId] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const generateLink = async () => {
      setIsPublishing(true);
      setError(null);
      let resolvedId = '';

      // 1. Try server persistence endpoint
      try {
        const res = await fetch('/api/share-signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signal, authorName }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.shareId) {
            resolvedId = data.shareId;
            if (data.sharedData) {
              try {
                localStorage.setItem(`shared_signal_${resolvedId}`, JSON.stringify(data.sharedData));
              } catch (_) {}
            }
          }
        }
      } catch (e) {
        console.warn('Server share persistence note:', e);
      }

      // 2. Try Firestore if user is logged in
      try {
        const firestoreId = await publishSharedSignal(signal, authorName);
        if (firestoreId && !resolvedId) {
          resolvedId = firestoreId;
        }
      } catch (err: any) {
        console.warn('Firestore share note:', err);
      }

      // 3. Fallback ID if both failed
      if (!resolvedId) {
        resolvedId = `share_${(signal.id || 'signal').replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now().toString(36)}`;
        try {
          localStorage.setItem(`shared_signal_${resolvedId}`, JSON.stringify(signal));
        } catch (_) {}
      }

      if (isMounted) {
        setShareId(resolvedId);
        const base = window.location.origin + window.location.pathname;
        const fullUrl = `${base}?share=${encodeURIComponent(resolvedId)}`;
        setShareUrl(fullUrl);
        setIsPublishing(false);
      }
    };

    generateLink();

    return () => {
      isMounted = false;
    };
  }, [isOpen, signal, authorName]);

  if (!isOpen) return null;

  const isBuy = signal.direction === 'BUY';
  const shareText = `🎯 ${signal.pair} [${signal.direction}] Setup | Entry: ${signal.entryPrice} | TP1: ${signal.tp1} | SL: ${signal.stopLoss} | R/R: ${signal.riskReward} | ${signal.confidence}% Confidence. Analyzed with Forex Signal Analyzer:`;

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareReddit = () => {
    const title = `${signal.pair} ${signal.direction} Trading Signal (${signal.riskReward} R/R)`;
    const url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#0b0e17] border border-amber-500/30 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden space-y-5 p-6">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Share Signal Analysis</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Public Web Link
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Generate a public view-only link to share on social media or with trading communities.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signal Summary Card Preview */}
        <div className="p-4 rounded-xl bg-[#070a12] border border-slate-800/80 space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase flex items-center gap-1 ${
                isBuy
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {isBuy ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {signal.direction}
              </span>
              <span className="text-base font-black text-white font-mono">{signal.pair}</span>
              <span className="text-xs text-slate-400 font-mono">({signal.timeframe})</span>
            </div>
            <div className="text-xs font-mono font-bold text-amber-400">
              R/R {signal.riskReward}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-[#05070d] p-2.5 rounded-lg border border-slate-800/60">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Entry</span>
              <span className="font-bold text-white">{signal.entryPrice}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Stop Loss</span>
              <span className="font-bold text-rose-400">{signal.stopLoss}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Take Profit 1</span>
              <span className="font-bold text-emerald-400">{signal.tp1}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 truncate">
            <span className="text-amber-400 font-semibold">{signal.analysisType}</span> • {signal.confidence}% Confidence Score
          </div>
        </div>

        {/* Share Link Input Bar */}
        <div className="space-y-2 relative z-10">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              Public View-Only Link
            </span>
            <span className="text-[10px] text-slate-500">No login required for viewers</span>
          </label>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={isPublishing ? 'Generating public link...' : shareUrl}
              className="flex-1 bg-[#070a12] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500 select-all"
            />
            <button
              onClick={handleCopyLink}
              disabled={isPublishing || !shareUrl}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Social Media Share Buttons */}
        <div className="space-y-2.5 relative z-10 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Share Directly on Social Media
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* X / Twitter */}
            <button
              onClick={handleShareTwitter}
              disabled={!shareUrl}
              className="p-2.5 rounded-xl bg-[#070a12] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current text-sky-400" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>X (Twitter)</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleShareTelegram}
              disabled={!shareUrl}
              className="p-2.5 rounded-xl bg-[#070a12] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-sky-400" />
              <span>Telegram</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              disabled={!shareUrl}
              className="p-2.5 rounded-xl bg-[#070a12] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={handleShareLinkedIn}
              disabled={!shareUrl}
              className="p-2.5 rounded-xl bg-[#070a12] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Linkedin className="w-4 h-4 text-blue-400" />
              <span>LinkedIn</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs relative z-10">
          <span className="text-slate-500 text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>View-only permissions enforced</span>
          </span>

          <a
            href={shareUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline"
          >
            <span>Preview Public Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
