import React, { useState, useEffect } from 'react';
import type { WatchlistItem } from '../types';
import { addToWatchlist, removeFromWatchlist, toggleWatchlistAlert } from '../firebase';
import {
  ALL_AVAILABLE_PAIRS,
  DEFAULT_WATCHLIST_PAIRS,
  generateMarketQuote,
  fetchLiveMarketRates,
} from '../data/marketData';
import type { MarketCategory } from '../data/marketData';
import { MarketNewsCard } from './MarketNewsCard';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendSetupAlertNotification,
} from '../utils/notifications';
import {
  Star,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Search,
  Sparkles,
  ChevronRight,
  Bookmark,
  Bell,
  BellOff,
  BellRing,
  AlertCircle,
  CheckCircle2,
  Globe,
  Coins,
  Cpu,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  RefreshCw,
  Radio,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';

interface WatchlistPageProps {
  userId: string;
  watchlistItems: WatchlistItem[];
  onSelectPairForAnalysis: (pair: string) => void;
  onNavigateHome: () => void;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  userId,
  watchlistItems,
  onSelectPairForAnalysis,
  onNavigateHome,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'All'>('All');
  const [viewMode, setViewMode] = useState<'ALL_MARKETS' | 'FAVORITES'>('ALL_MARKETS');
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [tickOffset, setTickOffset] = useState(0);
  const [lastLiveSync, setLastLiveSync] = useState<string>('Live Streaming');

  // Browser notifications toggle state
  const [masterAlertsEnabled, setMasterAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('watchlist_alerts_master') === 'true';
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);

  // Initial load and live data polling
  useEffect(() => {
    if (isNotificationSupported()) {
      setPermissionStatus(getNotificationPermission());
    }

    // Initial fetch of real live interbank and crypto market data
    const syncRealRates = async () => {
      setIsFetchingLive(true);
      try {
        await fetchLiveMarketRates();
        const now = new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastLiveSync(`Live ECN Sync • ${now}`);
      } finally {
        setIsFetchingLive(false);
      }
    };

    syncRealRates();

    // Poll live financial rates every 20 seconds
    const liveFetchInterval = setInterval(() => {
      syncRealRates();
    }, 20000);

    // Micro-tick update interval every 2.5 seconds to simulate orderbook tick movements
    const tickInterval = setInterval(() => {
      setTickOffset((prev) => (prev + 1) % 1000);
    }, 2500);

    return () => {
      clearInterval(liveFetchInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsFetchingLive(true);
    await fetchLiveMarketRates();
    setTickOffset((prev) => prev + 1);
    const now = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLastLiveSync(`Live ECN Sync • ${now}`);
    setIsFetchingLive(false);
    setAlertFeedback('Real live market data updated across all MetaTrader & cTrader pairs.');
    setTimeout(() => setAlertFeedback(null), 3000);
  };

  const handleToggleMasterAlerts = async () => {
    if (!isNotificationSupported()) {
      setAlertFeedback('Browser notifications are not supported on this browser.');
      return;
    }

    if (!masterAlertsEnabled) {
      const permission = await requestNotificationPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        setMasterAlertsEnabled(true);
        localStorage.setItem('watchlist_alerts_master', 'true');
        setAlertFeedback('AI Setup browser notifications enabled for all watchlist pairs!');
      } else if (permission === 'denied') {
        setMasterAlertsEnabled(false);
        localStorage.setItem('watchlist_alerts_master', 'false');
        setAlertFeedback('Notification permission was blocked in browser settings.');
      }
    } else {
      setMasterAlertsEnabled(false);
      localStorage.setItem('watchlist_alerts_master', 'false');
      setAlertFeedback('AI Setup notifications disabled.');
    }

    setTimeout(() => setAlertFeedback(null), 4000);
  };

  const addedPairMap = new Map(watchlistItems.map((i) => [i.pair.toUpperCase(), i]));

  const handleToggleFavorite = async (pairName: string, category: MarketCategory) => {
    const existing = addedPairMap.get(pairName.toUpperCase());
    try {
      if (existing) {
        await removeFromWatchlist(userId, existing.id);
        setAlertFeedback(`Removed ${pairName} from your favorites.`);
      } else {
        await addToWatchlist(userId, pairName, category, true);
        setAlertFeedback(`Added ${pairName} to your favorites!`);
      }
      setTimeout(() => setAlertFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleTogglePairAlert = async (e: React.MouseEvent, item: WatchlistItem) => {
    e.stopPropagation();
    const current = item.alertsEnabled !== false;
    const next = !current;

    if (next && !masterAlertsEnabled) {
      await handleToggleMasterAlerts();
    }

    try {
      await toggleWatchlistAlert(userId, item.id, next);
    } catch (err) {
      console.error('Failed to toggle pair alert:', err);
    }
  };

  const handleAddAllDefaults = async () => {
    for (const p of DEFAULT_WATCHLIST_PAIRS) {
      if (!addedPairMap.has(p.toUpperCase())) {
        const meta = ALL_AVAILABLE_PAIRS.find((x) => x.pair.toUpperCase() === p.toUpperCase());
        await addToWatchlist(userId, p, meta?.category || 'Forex', true);
      }
    }
    setAlertFeedback('Populated default key institutional pairs to your watchlist!');
    setTimeout(() => setAlertFeedback(null), 3000);
  };

  // Build quotes for all assets
  const allTradableQuotes = ALL_AVAILABLE_PAIRS.map((asset) => {
    const quote = generateMarketQuote(asset.pair, tickOffset);
    const watchItem = addedPairMap.get(asset.pair.toUpperCase());
    const isStarred = !!watchItem;
    return {
      asset,
      quote,
      watchItem,
      isStarred,
    };
  });

  // Filter based on view mode, search term, and category
  const displayedQuotes = allTradableQuotes.filter((item) => {
    // 1. View Mode filter: All Tradable vs Starred Favorites only
    if (viewMode === 'FAVORITES' && !item.isStarred) {
      return false;
    }

    // 2. Category filter
    if (selectedCategory !== 'All' && item.asset.category !== selectedCategory) {
      return false;
    }

    // 3. Search term filter across pair name, description, and platforms
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchesSymbol = item.asset.pair.toLowerCase().includes(term);
      const matchesDesc = item.asset.description.toLowerCase().includes(term);
      const matchesCategory = item.asset.category.toLowerCase().includes(term);
      return matchesSymbol || matchesDesc || matchesCategory;
    }

    return true;
  });

  // Category counts
  const categoryCounts = {
    All: ALL_AVAILABLE_PAIRS.length,
    Forex: ALL_AVAILABLE_PAIRS.filter((a) => a.category === 'Forex').length,
    Metal: ALL_AVAILABLE_PAIRS.filter((a) => a.category === 'Metal').length,
    Commodities: ALL_AVAILABLE_PAIRS.filter((a) => a.category === 'Commodities').length,
    Crypto: ALL_AVAILABLE_PAIRS.filter((a) => a.category === 'Crypto').length,
    Indices: ALL_AVAILABLE_PAIRS.filter((a) => a.category === 'Indices').length,
    Stock: ALL_AVAILABLE_PAIRS.filter((a) => a.category === 'Stock').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner: MetaTrader & cTrader Live Market Feed */}
      <div className="bg-gradient-to-r from-[#0d1322] via-[#090e1a] to-[#0d1322] border border-amber-500/25 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2.5 relative z-10 max-w-2xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 flex-wrap">
                <span>MetaTrader & cTrader Market Watch</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real Live Market Feed</span>
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Live institutional pricing, Bid/Ask spreads, and VSA AI signals for all tradable assets across MetaTrader 4/5 and cTrader brokers.
              </p>
            </div>
          </div>

          {/* Platform Badges */}
          <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
            <span className="text-[11px] text-slate-500 font-medium">Compatible Broker Platforms:</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-sky-300 border border-slate-700 font-mono text-[10px] font-bold">
              MetaTrader 4 (MT4)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-amber-300 border border-slate-700 font-mono text-[10px] font-bold">
              MetaTrader 5 (MT5)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-emerald-300 border border-slate-700 font-mono text-[10px] font-bold">
              cTrader ECN
            </span>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-3 relative z-10 self-start lg:self-auto">
          <button
            onClick={handleManualRefresh}
            disabled={isFetchingLive}
            className="px-3.5 py-2.5 rounded-xl bg-[#080d18] hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh live market quotes"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isFetchingLive ? 'animate-spin' : ''}`} />
            <span>{isFetchingLive ? 'Syncing...' : 'Sync Live Rates'}</span>
          </button>

          <button
            onClick={handleAddAllDefaults}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Star Core Pairs</span>
          </button>
        </div>
      </div>

      {/* Alert Notification Feedback */}
      {alertFeedback && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl flex items-center space-x-3 text-amber-300 text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{alertFeedback}</span>
        </div>
      )}

      {/* View Mode & Filter Controls */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        {/* Top Control Bar: View Mode Switcher, Search, and Push Notification */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* View Mode Toggle: All Tradable vs Starred Favorites */}
          <div className="inline-flex p-1 bg-[#070a12] border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('ALL_MARKETS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'ALL_MARKETS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All Tradable Markets ({ALL_AVAILABLE_PAIRS.length})</span>
            </button>
            <button
              onClick={() => setViewMode('FAVORITES')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'FAVORITES'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400/30" />
              <span>My Starred Watchlist ({watchlistItems.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search symbol or name (e.g. EUR/USD, Gold, US30, Bitcoin, NVDA)..."
              className="w-full bg-[#070a12] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Master Push Alert Toggle */}
          <div className="flex items-center space-x-3 bg-[#070a12] px-3.5 py-2 rounded-xl border border-slate-800">
            <div
              className={`p-1.5 rounded-lg ${
                masterAlertsEnabled && permissionStatus === 'granted'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {masterAlertsEnabled ? <BellRing className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold text-slate-200">AI Alerts</div>
              <div className="text-[9px] text-slate-400">
                {masterAlertsEnabled ? 'Active for watchlist' : 'Disabled'}
              </div>
            </div>
            <button
              onClick={handleToggleMasterAlerts}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                masterAlertsEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {masterAlertsEnabled ? 'Enabled' : 'Turn On'}
            </button>
          </div>
        </div>

        {/* Bottom Category Filter Tabs */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 flex-wrap gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Forex', 'Metal', 'Commodities', 'Crypto', 'Indices', 'Stock'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-[#070a12] text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{cat === 'All' ? 'All Categories' : cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                }`}>
                  {categoryCounts[cat]}
                </span>
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>{lastLiveSync}</span>
          </div>
        </div>
      </div>

      {/* Markets Grid Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>
            {viewMode === 'ALL_MARKETS' ? 'All Tradable Assets' : 'My Starred Watchlist'}
          </span>
          <span className="text-xs text-slate-400 font-mono">({displayedQuotes.length} assets loaded)</span>
        </h3>
        <span className="text-xs text-slate-500">
          Showing real live quotes with Bid, Ask, Spread, and 1-click VSA AI analysis
        </span>
      </div>

      {/* Markets Cards Grid */}
      {displayedQuotes.length === 0 ? (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <Star className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">No markets match this view</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {viewMode === 'FAVORITES'
                ? "You haven't starred any pairs yet. Switch to 'All Tradable Markets' to browse all MetaTrader & cTrader assets and click the star icon to save them here."
                : 'No assets found matching your search or category filter. Try clearing your search term.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setViewMode('ALL_MARKETS');
                setSelectedCategory('All');
                setSearchTerm('');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
            >
              Browse All Tradable Markets
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedQuotes.map((item) => {
            const { asset, quote, isStarred, watchItem } = item;
            const alertsActive = watchItem?.alertsEnabled !== false;

            return (
              <div
                key={asset.pair}
                onClick={() => onSelectPairForAnalysis(asset.pair)}
                className="bg-[#0b0f19] hover:bg-[#0e1422] border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4"
              >
                <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

                {/* Card Top: Pair Name, Description, Platforms & Star Toggle */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#070a12] border border-slate-800 flex items-center justify-center text-amber-400 font-mono font-bold text-xs shadow-inner shrink-0">
                        {asset.pair.substring(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white group-hover:text-amber-300 transition-colors font-mono">
                            {asset.pair}
                          </h4>
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                            {asset.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-[220px]">
                          {asset.description}
                        </p>
                      </div>
                    </div>

                    {/* Star & Alert Buttons */}
                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      {isStarred && watchItem && (
                        <button
                          onClick={(e) => handleTogglePairAlert(e, watchItem)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            alertsActive
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                          title={alertsActive ? 'AI alerts enabled for this pair' : 'AI alerts disabled'}
                        >
                          {alertsActive ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleFavorite(asset.pair, asset.category)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                          isStarred
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
                        }`}
                        title={isStarred ? 'Remove from favorites' : 'Star & add to favorites'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Platform compatibility badges */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    {asset.platforms.map((p) => (
                      <span
                        key={p}
                        className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#070b14] text-slate-400 border border-slate-800"
                      >
                        {p}
                      </span>
                    ))}
                    <span className="text-[9px] text-slate-500 ml-auto font-mono">
                      Spread: <strong className="text-amber-400 font-bold">{quote.spreadPips}</strong>
                    </span>
                  </div>
                </div>

                {/* Card Middle: Price, Bid, Ask, Spread & 24h Change */}
                <div className="space-y-2 bg-[#070a14] p-3 rounded-xl border border-slate-800/80 font-mono">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Last Market Quote</span>
                      <div className="text-xl font-black text-white mt-0.5 tracking-tight">
                        {quote.price}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">24h Change</span>
                      <div
                        className={`text-xs font-bold mt-0.5 flex items-center justify-end gap-1 ${
                          quote.isBullish ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {quote.isBullish ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span>{quote.change24h > 0 ? `+${quote.change24h}%` : `${quote.change24h}%`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Institutional Bid & Ask Row */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div className="bg-[#050810] px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                      <span className="text-[9px] text-slate-500 block uppercase">Bid (Sell)</span>
                      <span className="text-slate-200 font-bold">{quote.bid}</span>
                    </div>
                    <div className="bg-[#050810] px-2.5 py-1.5 rounded-lg border border-slate-800/60 text-right">
                      <span className="text-[9px] text-slate-500 block uppercase">Ask (Buy)</span>
                      <span className="text-slate-200 font-bold">{quote.ask}</span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Run VSA AI Scan */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 text-xs">
                  <span className="text-slate-400 text-[11px] group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" />
                    <span>Run VSA AI Scan</span>
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fundamental Market News Section */}
      <MarketNewsCard watchlistItems={watchlistItems} />
    </div>
  );
};
