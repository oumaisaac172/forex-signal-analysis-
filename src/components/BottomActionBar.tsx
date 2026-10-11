import React from 'react';
import {
  UploadCloud,
  TrendingUp,
  BookOpen,
  History,
  BarChart3,
  Bookmark,
  Settings,
  Crown,
  Cpu,
  CreditCard,
  Database,
  Sparkles,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';



interface BottomActionBarProps {
  onOpenScan: () => void;
  onOpenResults: () => void;
  onOpenJournal: () => void;
  onOpenHistory: () => void;
  onOpenSentiment: () => void;
  onOpenWatchlist: () => void;
  onOpenAnalysisModels: () => void;
  onOpenMarketData: () => void;
  onOpenVsaAnalysis: () => void;
  onOpenPayment: () => void;
  onOpenAdmin?: () => void;
  onToggleWatchlist: () => void;
  onOpenSettings: () => void;
  activePage: 'scan' | 'results' | 'journal' | 'history' | 'sentiment' | 'watchlist' | 'admin' | 'analysis-models' | 'payment' | 'market-data' | 'vsa-analysis';
  hasActiveSignal: boolean;
  watchlistCount: number;
  journalCount: number;
  historyCount: number;
  theme: 'charcoal' | 'midnight';
  isAdmin?: boolean;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  onOpenScan,
  onOpenResults,
  onOpenJournal,
  onOpenHistory,
  onOpenSentiment,
  onOpenWatchlist,
  onOpenAnalysisModels,
  onOpenMarketData,
  onOpenVsaAnalysis,
  onOpenPayment,
  onOpenAdmin,
  onToggleWatchlist,
  onOpenSettings,
  activePage,
  hasActiveSignal,
  watchlistCount,
  journalCount,
  historyCount,
  theme,
  isAdmin,
}) => {
  return (
    <div className="fixed bottom-2 left-0 right-0 z-40 px-2 sm:px-4 pointer-events-none flex justify-center">
      <div
        className={`pointer-events-auto inline-flex items-center gap-1 sm:gap-1.5 px-3 py-2 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-x-auto max-w-full ${
          theme === 'midnight'
            ? 'bg-[#0f172a]/95 border-cyan-500/30 text-slate-200 shadow-cyan-950/50'
            : 'bg-[#0c101d]/95 border-amber-500/30 text-slate-200 shadow-amber-950/50'
        }`}
      >
        {/* Scan Page Button */}
        <button
          onClick={onOpenScan}
          title="Chart Scan Page"
          className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activePage === 'scan'
              ? theme === 'midnight'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'bg-amber-500 text-slate-950 font-bold shadow'
              : theme === 'midnight'
              ? 'hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300'
              : 'hover:bg-amber-500/20 hover:text-amber-300 text-slate-300'
          }`}
        >
          <UploadCloud className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Scan</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-700/60 shrink-0" />

        {/* Signal Results Page Button */}
        <button
          onClick={onOpenResults}
          title="Signal Results & AI Advisor Page"
          className={`relative flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activePage === 'results'
              ? theme === 'midnight'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'bg-amber-500 text-slate-950 font-bold shadow'
              : hasActiveSignal
              ? theme === 'midnight'
                ? 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
                : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
              : theme === 'midnight'
              ? 'hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-400'
              : 'hover:bg-amber-500/20 hover:text-amber-300 text-slate-400'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Analysis</span>
          {hasActiveSignal && activePage !== 'results' && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          )}
        </button>

        <div className="w-[1px] h-5 bg-slate-700/60 shrink-0" />

        {/* Trade Journal Page Button */}
        <button
          onClick={onOpenJournal}
          title="Trade Journal Page"
          className={`relative flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activePage === 'journal'
              ? theme === 'midnight'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'bg-amber-500 text-slate-950 font-bold shadow'
              : theme === 'midnight'
              ? 'hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300'
              : 'hover:bg-amber-500/20 hover:text-amber-300 text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Journal</span>
          {journalCount > 0 && activePage !== 'journal' && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-500 text-white">
              {journalCount}
            </span>
          )}
        </button>

        <div className="w-[1px] h-5 bg-slate-700/60 shrink-0" />

        {/* History & Performance Page Button */}
        <button
          onClick={onOpenHistory}
          title="History & Performance Page"
          className={`relative flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activePage === 'history'
              ? theme === 'midnight'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'bg-amber-500 text-slate-950 font-bold shadow'
              : theme === 'midnight'
              ? 'hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300'
              : 'hover:bg-amber-500/20 hover:text-amber-300 text-slate-300'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">History</span>
          {historyCount > 0 && activePage !== 'history' && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/30 text-purple-300">
              {historyCount}
            </span>
          )}
        </button>

        <div className="w-[1px] h-5 bg-slate-700/60 shrink-0" />

        {/* Market Sentiment Heatmap Page Button */}
        <button
          onClick={onOpenSentiment}
          title="Market Sentiment Heatmap Page"
          className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activePage === 'sentiment'
              ? theme === 'midnight'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'bg-amber-500 text-slate-950 font-bold shadow'
              : theme === 'midnight'
              ? 'hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300'
              : 'hover:bg-amber-500/20 hover:text-amber-300 text-slate-300'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Sentiment</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-700/60 shrink-0" />

        {/* Analysis Models Page Button */}
        <button
          onClick={onOpenAnalysisModels}
          title="Forex Analysis Models"
          className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activePage === 'analysis-models'
              ? theme === 'midnight'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'bg-amber-500 text-slate-950 font-bold shadow'
              : theme === 'midnight'
              ? 'hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300'
              : 'hover:bg-amber-500/20 hover:text-amber-300 text-slate-300'
          }`}
        >
          <Cpu className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Models</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-700/60 shrink-0" />

        {/* Multi-Source Market Data Integration Button */}
        <button
          onClick={onOpenMarketData}
          title="Multi-Source Market Data (TradingView, MT5, cTrader, APIs)"
          className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activePage === 'market-data'
              ? theme === 'midnight'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'bg-amber-500 text-slate-950 font-bold shadow'
              : theme === 'midnight'
              ? 'hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300'
              : 'hover:bg-amber-500/20 hover:text-amber-300 text-slate-300'
          }`}
        >
          <Database className="w-4 h-4 shrink-0 text-cyan-400" />
          <span className="hidden md:inline">Data Sources</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-700/60 shrink-0" />

        {/* AI Signal VSA Analysis Button */}
        <button
          onClick={onOpenVsaAnalysis}
          title="AI Signal VSA Analysis & Jesse Livermore Engine"
          className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activePage === 'vsa-analysis'
              ? theme === 'midnight'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'bg-amber-500 text-slate-950 font-bold shadow'
              : theme === 'midnight'
              ? 'hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300'
              : 'hover:bg-amber-500/20 hover:text-amber-300 text-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="hidden md:inline">VSA Analysis</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-700/60 shrink-0" />

        {/* Payment Page Button */}
        <button
          onClick={onOpenPayment}
          title="Subscription Payment"
          className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activePage === 'payment'
              ? theme === 'midnight'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'bg-amber-500 text-slate-950 font-bold shadow'
              : theme === 'midnight'
              ? 'hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300'
              : 'hover:bg-amber-500/20 hover:text-amber-300 text-slate-300'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Payment</span>
        </button>

        {/* Administrator Dashboard Button (STRICTLY Visible to Administrator User ONLY) */}
        {isAdmin === true && Boolean(onOpenAdmin) ? (
          <>
            <div className="w-[1px] h-5 bg-slate-700/60 shrink-0" />
            <button
              type="button"
              onClick={onOpenAdmin}
              title="Administrator Command Center (Admin Only)"
              aria-label="Administrator Command Center"
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activePage === 'admin'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow'
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
              }`}
            >
              <Crown className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="hidden md:inline">Admin</span>
            </button>
          </>
        ) : null}

        <div className="w-[1px] h-5 bg-slate-700/60 shrink-0" />

        {/* Watchlist Page Button */}
        <button
          onClick={onOpenWatchlist}
          title="Advanced Watchlist Page"
          className={`relative flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activePage === 'watchlist'
              ? theme === 'midnight'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'bg-amber-500 text-slate-950 font-bold shadow'
              : theme === 'midnight'
              ? 'hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300'
              : 'hover:bg-amber-500/20 hover:text-amber-300 text-slate-300'
          }`}
        >
          <Bookmark className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="hidden md:inline">Watchlist</span>
          {watchlistCount > 0 && activePage !== 'watchlist' && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300">
              {watchlistCount}
            </span>
          )}
        </button>

        <div className="w-[1px] h-5 bg-slate-700/60 shrink-0" />

        {/* PWA Install Button */}
        <div className="flex items-center shrink-0">
          <PWAInstallButton />
        </div>

        {/* Settings Modal */}
        <button
          onClick={onOpenSettings}
          title="Settings & Theme"
          className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            theme === 'midnight'
              ? 'hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300'
              : 'hover:bg-amber-500/20 hover:text-amber-300 text-slate-300'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0 text-slate-300" />
        </button>
      </div>
    </div>
  );
};
