import React, { useState, useEffect, useCallback } from 'react';
import type { WatchlistItem } from '../types';
import {
  Newspaper,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Globe,
  ExternalLink,
  Radio,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface MarketNewsCardProps {
  watchlistItems: WatchlistItem[];
}

export interface NewsItem {
  id: string;
  pair: string;
  title: string;
  source: string;
  time: string;
  impact: 'High' | 'Medium' | 'Low';
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  url?: string;
  publishedDate?: string;
}

export const MarketNewsCard: React.FC<MarketNewsCardProps> = ({ watchlistItems }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const watchlistedPairs = watchlistItems.map((w) => w.pair.toUpperCase());

  const fetchLiveNews = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const pairParam = watchlistedPairs.join(',');
      const res = await fetch(`/api/market-news?pairs=${encodeURIComponent(pairParam)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.news) && json.news.length > 0) {
          setNewsFeed(json.news);
          const nowStr = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          setLastSyncTime(`Live • ${nowStr}`);
          if (isManual) {
            setSyncStatus('Real macroeconomic news updated.');
            setTimeout(() => setSyncStatus(null), 3000);
          }
        }
      }
    } catch (err) {
      console.warn('Live news fetch note:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [watchlistedPairs.join(',')]);

  useEffect(() => {
    fetchLiveNews(false);
    // Auto refresh live news every 60 seconds
    const interval = setInterval(() => {
      fetchLiveNews(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchLiveNews]);

  const handleManualRefresh = () => {
    fetchLiveNews(true);
  };

  // Filter or prioritize based on current user watchlist
  const relevantNews = newsFeed.filter((item) => {
    if (watchlistedPairs.length === 0) return true;
    return watchlistedPairs.some(
      (p) => item.pair.toUpperCase() === p || item.pair.includes(p) || p.includes(item.pair.split('/')[0])
    );
  });

  const displayNews = relevantNews.length > 0 ? relevantNews : newsFeed;

  return (
    <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Watchlist Fundamental Market News</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                <span>Real Live News</span>
              </span>
              {watchlistedPairs.length > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Filtered to Watchlist ({watchlistedPairs.length})
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Live macroeconomic headlines & central bank sentiment verified from financial feeds (ForexLive, Reuters, Bloomberg, WSJ).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lastSyncTime && (
            <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
              {lastSyncTime}
            </span>
          )}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            className="px-2.5 py-1.5 bg-[#090d16] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-800 cursor-pointer transition-colors disabled:opacity-50"
            title="Fetch latest live market news"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* News Items List */}
      {isLoading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-[#080c14] border border-slate-800/80 animate-pulse space-y-2"
            >
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-4 bg-slate-800/60 rounded w-4/5" />
              <div className="h-3 bg-slate-900 rounded w-full" />
            </div>
          ))}
        </div>
      ) : displayNews.length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-xs bg-[#080c14] rounded-xl border border-slate-800">
          <Globe className="w-6 h-6 mx-auto mb-2 text-slate-600" />
          <span>No live news found at this moment. Click Refresh to query live feeds.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {displayNews.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-[#080c14] border border-slate-800/80 hover:border-slate-700 transition-all space-y-2 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.pair}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.impact === 'High'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : item.impact === 'Medium'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.impact} Impact
                  </span>
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.sentiment === 'Bullish'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : item.sentiment === 'Bearish'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.sentiment === 'Bullish' ? (
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    ) : item.sentiment === 'Bearish' ? (
                      <TrendingDown className="w-3 h-3 text-rose-400" />
                    ) : null}
                    {item.sentiment}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {item.source} • {item.time}
                </span>
              </div>

              {/* Title with optional real article link */}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-200 group-hover:text-amber-300 transition-colors hover:underline"
                >
                  <span>{item.title}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-400 shrink-0" />
                </a>
              ) : (
                <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h4>
              )}

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {item.summary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
