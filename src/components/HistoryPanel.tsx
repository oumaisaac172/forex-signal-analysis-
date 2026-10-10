import React, { useState } from 'react';
import type { TradingSignal, JournalEntry } from '../types';
import { deleteAnalysisFromFirestore } from '../firebase';
import { PerformanceInsights } from './PerformanceInsights';
import {
  History,
  TrendingUp,
  TrendingDown,
  Trash2,
  Calendar,
  Search,
  ChevronRight,
  Database,
  BarChart2,
  BookOpen,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react';

interface HistoryPanelProps {
  analyses: TradingSignal[];
  currentSignalId?: string;
  onSelectSignal: (signal: TradingSignal) => void;
  userId: string;
  journalEntries?: JournalEntry[];
  onLogSignalForJournal?: (signal: TradingSignal) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  analyses,
  currentSignalId,
  onSelectSignal,
  userId,
  journalEntries = [],
  onLogSignalForJournal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vsaFilter, setVsaFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getVSASignalTag = (item: TradingSignal) => {
    const text = `${item.analysisType} ${item.marketPsychology} ${item.candlestickConfirmation} ${item.supportResistance} ${item.marketStructure}`.toLowerCase();
    if (text.includes('no demand')) return 'No Demand';
    if (text.includes('no supply')) return 'No Supply';
    if (text.includes('buying climax')) return 'Buying Climax';
    if (text.includes('selling climax')) return 'Selling Climax';
    if (text.includes('effort') || text.includes('effort vs result')) return 'Effort vs Result';
    if (text.includes('stopping volume')) return 'Stopping Volume';
    return null;
  };

  const filtered = analyses.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.pair.toLowerCase().includes(term) ||
      item.direction.toLowerCase().includes(term) ||
      item.analysisType.toLowerCase().includes(term) ||
      item.timeframe.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (vsaFilter !== 'ALL') {
      const tag = getVSASignalTag(item);
      if (vsaFilter === 'BUYING_SELLING_CLIMAX') {
        if (tag !== 'Buying Climax' && tag !== 'Selling Climax') return false;
      } else {
        if (tag !== vsaFilter) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    if (sortBy === 'confidence') {
      return (b.confidence || 0) - (a.confidence || 0);
    }
    if (sortBy === 'rr') {
      const parseRR = (rr?: string) => {
        if (!rr) return 0;
        const parts = rr.split(':');
        return parts.length === 2 ? parseFloat(parts[1]) || 0 : 0;
      };
      return parseRR(b.riskReward) - parseRR(a.riskReward);
    }
    return 0;
  });

  const handleDelete = async (e: React.MouseEvent, signalId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved signal analysis from Cloud Firestore?')) {
      return;
    }
    try {
      setDeletingId(signalId);
      await deleteAnalysisFromFirestore(userId, signalId);
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Recharts Performance Insights Card */}
      {analyses.length > 0 && (
        <PerformanceInsights analyses={analyses} journalEntries={journalEntries} />
      )}

      {/* 2. Analysis History List Container */}
      <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Analysis History</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {analyses.length} saved
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Stored in Cloud Firestore: <code className="text-amber-300 font-mono text-[11px]">/users/{userId.slice(0, 8)}.../analyses</code></span>
            </p>
          </div>

          {/* Search input */}
          {analyses.length > 0 && (
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter pair, direction..."
                className="w-full bg-[#080b12] border border-slate-800 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* VSA Filters & Sort Bar */}
        {analyses.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#080b12] p-3 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                <span>VSA Filter:</span>
              </span>
              {[
                { label: 'All', value: 'ALL' },
                { label: 'No Demand', value: 'No Demand' },
                { label: 'No Supply', value: 'No Supply' },
                { label: 'Buying/Selling Climax', value: 'BUYING_SELLING_CLIMAX' },
                { label: 'Effort vs Result', value: 'Effort vs Result' },
                { label: 'Stopping Volume', value: 'Stopping Volume' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setVsaFilter(tab.value)}
                  className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    vsaFilter === tab.value
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#0e131f] border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="confidence">Highest Confidence</option>
                <option value="rr">Highest R:R</option>
              </select>
            </div>
          </div>
        )}

        {/* History Items List */}
        {analyses.length === 0 ? (
          <div className="text-center py-10 px-4 bg-[#090d16] rounded-xl border border-dashed border-slate-800">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-slate-300">No signals saved yet</h3>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
              Upload and analyze any Forex chart screenshot. Every generated signal is automatically archived under your Firebase UID for future review, and real-time performance insights will visualize your trade distribution.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No signals match "{searchTerm}".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((item) => {
              const isBuy = item.direction === 'BUY';
              const isCurrent = item.id === currentSignalId;
              const journalEntry = journalEntries.find((j) => j.signalId === item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectSignal(item)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-[#141b2a] border-amber-500 shadow-md shadow-amber-500/10'
                      : 'bg-[#090d16] border-slate-800 hover:border-slate-700 hover:bg-[#0c111e]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-white">{item.pair}</span>
                        <span className="text-[10px] text-slate-400 px-1.5 py-0.2 bg-slate-800 rounded">
                          {item.timeframe}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {journalEntry ? (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border ${
                              journalEntry.outcome === 'WIN'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : journalEntry.outcome === 'LOSS'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                            title={`Journaled: ${journalEntry.outcome}`}
                          >
                            {journalEntry.outcome}
                          </span>
                        ) : onLogSignalForJournal ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLogSignalForJournal(item);
                            }}
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700 transition-colors cursor-pointer"
                            title="Log outcome to Trade Journal"
                          >
                            + Journal
                          </button>
                        ) : null}

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isBuy
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {item.direction}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, item.id)}
                          disabled={deletingId === item.id}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                          title="Delete from Firestore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-1 mb-1.5">
                      {item.analysisType}
                    </div>

                    {(() => {
                      const vsaTag = getVSASignalTag(item);
                      return vsaTag ? (
                        <div className="mb-2">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1">
                            <span>VSA: {vsaTag}</span>
                          </span>
                        </div>
                      ) : null;
                    })()}

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#070a12] p-2 rounded-lg border border-slate-800/80 mb-2 font-mono">
                      <div>
                        <span className="text-slate-500 block">Entry Price:</span>
                        <span className="text-amber-300 font-bold">{item.entryPrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Risk:Reward:</span>
                        <span className="text-emerald-400 font-bold">{item.riskReward}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formatDate(item.createdAt)}
                    </span>

                    <span className="text-amber-400/90 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Load</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
