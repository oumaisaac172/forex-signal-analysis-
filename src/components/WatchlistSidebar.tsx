import React, { useState, useEffect } from 'react';
import type { WatchlistItem } from '../types';
import { addToWatchlist, removeFromWatchlist, toggleWatchlistAlert } from '../firebase';
import { ALL_AVAILABLE_PAIRS, DEFAULT_WATCHLIST_PAIRS, generateMarketQuote } from '../data/marketData';
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
  X,
  Bell,
  BellOff,
  BellRing,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface WatchlistSidebarProps {
  userId: string;
  watchlistItems: WatchlistItem[];
  onSelectPairForAnalysis: (pair: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const WatchlistSidebar: React.FC<WatchlistSidebarProps> = ({
  userId,
  watchlistItems,
  onSelectPairForAnalysis,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Browser notifications toggle state
  const [masterAlertsEnabled, setMasterAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('watchlist_alerts_master') === 'true';
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermissionStatus(getNotificationPermission());
    }
  }, []);

  const handleToggleMasterAlerts = async () => {
    if (!isNotificationSupported()) {
      setAlertFeedback('Browser notifications are not supported on this device or browser.');
      return;
    }

    if (!masterAlertsEnabled) {
      // Request permission if not already granted
      const permission = await requestNotificationPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        setMasterAlertsEnabled(true);
        localStorage.setItem('watchlist_alerts_master', 'true');
        setAlertFeedback('AI Setup browser notifications enabled!');

        // Dispatch initial sample notification for first watchlist pair
        const targetPair = watchlistItems[0]?.pair || 'EUR/USD';
        sendSetupAlertNotification({
          pair: targetPair,
          direction: targetPair.includes('JPY') ? 'SELL' : 'BUY',
          timeframe: '1H',
          analysisType: 'Institutional Liquidity Sweep & Trend Confluence',
          entryPrice: generateMarketQuote(targetPair).price,
          onClick: () => onSelectPairForAnalysis(targetPair),
        });
      } else if (permission === 'denied') {
        setMasterAlertsEnabled(false);
        localStorage.setItem('watchlist_alerts_master', 'false');
        setAlertFeedback('Notification permission blocked in browser settings. Please allow notifications.');
      }
    } else {
      setMasterAlertsEnabled(false);
      localStorage.setItem('watchlist_alerts_master', 'false');
      setAlertFeedback('AI Setup notifications disabled.');
    }

    setTimeout(() => setAlertFeedback(null), 4000);
  };

  const handleTestNotification = (pair: string) => {
    if (!isNotificationSupported()) {
      setAlertFeedback('Notifications not supported.');
      return;
    }
    if (Notification.permission !== 'granted') {
      handleToggleMasterAlerts();
      return;
    }
    const q = generateMarketQuote(pair);
    const sent = sendSetupAlertNotification({
      pair,
      direction: q.isBullish ? 'BUY' : 'SELL',
      timeframe: '1H',
      analysisType: 'Fair Value Gap Inversion & Support Bounce',
      entryPrice: q.price,
      onClick: () => onSelectPairForAnalysis(pair),
    });
    if (sent) {
      setAlertFeedback(`Test AI alert sent for ${pair}!`);
      setTimeout(() => setAlertFeedback(null), 3500);
    }
  };

  const handleTogglePairAlert = async (e: React.MouseEvent, item: WatchlistItem) => {
    e.stopPropagation();
    const current = item.alertsEnabled !== false; // default true
    const next = !current;

    // If enabling and master alerts is off, also prompt master
    if (next && !masterAlertsEnabled) {
      await handleToggleMasterAlerts();
    }

    try {
      await toggleWatchlistAlert(userId, item.id, next);
    } catch (err) {
      console.error('Failed to toggle pair alert:', err);
    }
  };

  // Set of already added pairs
  const addedPairSet = new Set(watchlistItems.map((i) => i.pair.toUpperCase()));

  const handleAddPair = async (pairName: string, category = 'Major') => {
    try {
      setIsAdding(true);
      await addToWatchlist(userId, pairName, category, true);
      setShowAddMenu(false);
      setSearchTerm('');
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePair = async (e: React.MouseEvent, pairId: string) => {
    e.stopPropagation();
    try {
      await removeFromWatchlist(userId, pairId);
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
  };

  const handleAddDefaults = async () => {
    for (const p of DEFAULT_WATCHLIST_PAIRS) {
      if (!addedPairSet.has(p.toUpperCase())) {
        await addToWatchlist(
          userId,
          p,
          p.includes('XAU') ? 'Metal' : p.includes('JPY') ? 'Cross' : 'Major',
          true
        );
      }
    }
  };

  const availableToAdd = ALL_AVAILABLE_PAIRS.filter(
    (p) =>
      !addedPairSet.has(p.pair.toUpperCase()) &&
      p.pair.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 right-0 z-50 bg-[#0b0e17] border-l border-slate-800/90 flex flex-col transition-all duration-300 w-80 sm:w-88 shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:hidden lg:w-0'
        }`}
      >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080b12]">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Star className="w-4 h-4 fill-amber-400/20" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Favorite Watchlist</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                {watchlistItems.length}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Market quotes & AI signal scanner</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="Add Currency Pair"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-medium hidden sm:inline">Add</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer lg:hidden"
              title="Close Watchlist"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* AI Browser Notification Master Toggle Bar */}
      <div className="p-3 bg-[#0d1220] border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`p-1.5 rounded-lg transition-colors ${
                masterAlertsEnabled && permissionStatus === 'granted'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800/80 text-slate-500 border border-slate-700'
              }`}
            >
              {masterAlertsEnabled ? (
                <BellRing className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <BellOff className="w-3.5 h-3.5" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <span>AI Setup Alerts</span>
                {masterAlertsEnabled && permissionStatus === 'granted' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Browser notification when setup is detected
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={masterAlertsEnabled}
            onClick={handleToggleMasterAlerts}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              masterAlertsEnabled && permissionStatus === 'granted'
                ? 'bg-amber-500 justify-end'
                : 'bg-slate-700 justify-start'
            }`}
            title="Toggle Browser Notifications for Watchlist Setups"
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
          </button>
        </div>

        {/* Feedback / Permission Notice */}
        {alertFeedback && (
          <div className="mt-2 text-[10px] p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3 h-3 shrink-0 text-amber-400" />
            <span>{alertFeedback}</span>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="mt-2 text-[10px] p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 shrink-0 text-rose-400" />
            <span>Browser notifications blocked. Click the lock icon in your URL bar to allow.</span>
          </div>
        )}
      </div>

      {/* Add Pair Dropdown / Search Modal */}
      {showAddMenu && (
        <div className="p-3 bg-[#0e1320] border-b border-slate-800 animate-in fade-in duration-200 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span>Add Pair to Watchlist</span>
            <button
              onClick={() => setShowAddMenu(false)}
              className="text-slate-500 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              placeholder="Search pair e.g. GBP/JPY..."
              className="w-full bg-[#080b12] border border-slate-700 rounded-lg pl-7.5 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              autoFocus
            />
          </div>

          {/* Pair suggestions */}
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            {availableToAdd.length === 0 ? (
              <div className="text-[11px] text-slate-500 text-center py-2">
                {searchTerm ? 'No matching pairs found.' : 'All popular pairs already in watchlist.'}
              </div>
            ) : (
              availableToAdd.map((p) => (
                <button
                  key={p.pair}
                  type="button"
                  disabled={isAdding}
                  onClick={() => handleAddPair(p.pair, p.category)}
                  className="w-full text-left p-1.5 rounded-md hover:bg-slate-800/80 flex items-center justify-between text-xs text-slate-200 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold">{p.pair}</span>
                    <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-slate-400 rounded">
                      {p.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 font-medium">
                    + Add
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Watchlist Items Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {watchlistItems.length === 0 ? (
          <div className="text-center py-8 px-3 bg-[#080b12] rounded-xl border border-dashed border-slate-800 space-y-3">
            <Bookmark className="w-7 h-7 text-slate-600 mx-auto" />
            <div>
              <h4 className="text-xs font-semibold text-slate-300">Your Watchlist is Empty</h4>
              <p className="text-[10px] text-slate-500 mt-1">
                Save your favorite forex pairs for instant market tracking and AI setup alerts.
              </p>
            </div>
            <button
              onClick={handleAddDefaults}
              className="w-full py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Popular Pairs</span>
            </button>
          </div>
        ) : (
          watchlistItems.map((item) => {
            const quote = generateMarketQuote(item.pair);
            const isPairAlertActive = item.alertsEnabled !== false;

            return (
              <div
                key={item.id}
                onClick={() => onSelectPairForAnalysis(item.pair)}
                className="bg-[#090d16] hover:bg-[#0d1222] border border-slate-800/90 hover:border-amber-500/40 rounded-xl p-3 transition-all cursor-pointer group relative shadow-md"
                title={`Click to analyze ${item.pair}`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-black text-sm text-white group-hover:text-amber-300 transition-colors">
                      {item.pair}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 font-medium">
                      {quote.category}
                    </span>
                  </div>

                  {/* Actions: Bell Toggle & Delete */}
                  <div className="flex items-center space-x-1">
                    {/* Specific Pair Alert Bell Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleTogglePairAlert(e, item)}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        masterAlertsEnabled && isPairAlertActive
                          ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10'
                          : 'text-slate-600 hover:text-slate-400 opacity-70 group-hover:opacity-100'
                      }`}
                      title={
                        isPairAlertActive
                          ? `AI alerts active for ${item.pair} (Click to mute)`
                          : `Alerts muted for ${item.pair} (Click to enable)`
                      }
                    >
                      {masterAlertsEnabled && isPairAlertActive ? (
                        <Bell className="w-3 h-3 fill-amber-400/20" />
                      ) : (
                        <BellOff className="w-3 h-3" />
                      )}
                    </button>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemovePair(e, item.id)}
                      className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Price & 24h Change */}
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-base font-extrabold text-white font-mono tracking-tight">
                    {quote.price}
                  </span>

                  <div
                    className={`flex items-center space-x-1 text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                      quote.isBullish
                        ? 'text-emerald-400 bg-emerald-500/15'
                        : 'text-rose-400 bg-rose-500/15'
                    }`}
                  >
                    {quote.isBullish ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {quote.isBullish ? '+' : ''}
                      {quote.change24h}%
                    </span>
                  </div>
                </div>

                {/* High / Low Range & Quick Test Alert / Scan */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800/60 pt-1.5">
                  <div className="space-x-2">
                    <span>
                      L: <strong className="text-slate-400">{quote.low}</strong>
                    </span>
                    <span>
                      H: <strong className="text-slate-400">{quote.high}</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {masterAlertsEnabled && isPairAlertActive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestNotification(item.pair);
                        }}
                        className="text-amber-400 hover:text-amber-300 underline font-sans text-[9px] cursor-pointer"
                        title="Simulate AI setup alert notification"
                      >
                        Test
                      </button>
                    )}
                    <span className="text-amber-400/90 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform font-sans">
                      <span>Scan</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-[#080b12] text-center">
        <p className="text-[10px] text-slate-500">
          Saved in Cloud Firestore • AI monitors watchlist pairs for institutional setups
        </p>
      </div>
    </div>
    </>
  );
};
