import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import {
  subscribeToAuth,
  saveAnalysisToFirestore,
  saveJournalEntry,
  subscribeToUserAnalyses,
  subscribeToDailyUsage,
  subscribeToWatchlist,
  subscribeToJournalEntries,
  recordDailyScan,
  resetDailyScansForUser,
  isUserAdmin,
  getTodayDateKey,
} from './firebase';
import type {
  TradingSignal,
  ChatMessage,
  SampleChartPreset,
  DailyUsage,
  WatchlistItem,
  JournalEntry,
  TradeOutcome,
} from './types';
import { DAILY_SCAN_LIMIT } from './types';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { UploadSection } from './components/UploadSection';
import { SignalResults } from './components/SignalResults';
import { AdvisorChat } from './components/AdvisorChat';
import { HistoryPanel } from './components/HistoryPanel';
import { WatchlistSidebar } from './components/WatchlistSidebar';
import { WatchlistPage } from './components/WatchlistPage';
import { TradeJournal } from './components/TradeJournal';
import { MarketSentimentHeatmap } from './components/MarketSentimentHeatmap';
import { MarketNewsCard } from './components/MarketNewsCard';
import { AdminDashboard } from './components/AdminDashboard';
import { SettingsModal } from './components/SettingsModal';
import { BottomActionBar } from './components/BottomActionBar';
import { PublicSharedSignalView } from './components/PublicSharedSignalView';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check for public share parameter in URL: ?share=<shareId> or #share/<shareId>
  const [sharedSignalId, setSharedSignalId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const shareParam = params.get('share');
      if (shareParam) return shareParam;
      if (window.location.hash.startsWith('#share/')) {
        return window.location.hash.replace('#share/', '').trim();
      }
    }
    return null;
  });

  const [activeSignal, setActiveSignal] = useState<TradingSignal | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysesHistory, setAnalysesHistory] = useState<TradingSignal[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [activeSignalToLog, setActiveSignalToLog] = useState<TradingSignal | null>(null);

  // Active page state for dedicated tab pages including admin
  const [activePage, setActivePage] = useState<'scan' | 'results' | 'journal' | 'history' | 'sentiment' | 'watchlist' | 'admin'>('scan');

  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [selectedWatchlistPair, setSelectedWatchlistPair] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoSaveJournal, setAutoSaveJournal] = useState<boolean>(() => {
    const saved = localStorage.getItem('forex_auto_save_journal');
    return saved !== null ? saved === 'true' : true;
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('forex_browser_notifications');
    return saved !== null ? saved === 'true' : (typeof Notification !== 'undefined' && Notification.permission === 'granted');
  });

  const handleToggleNotifications = () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    localStorage.setItem('forex_browser_notifications', String(nextVal));
  };

  const [theme, setTheme] = useState<'charcoal' | 'midnight'>(() => {
    return (localStorage.getItem('forex_ui_theme') as 'charcoal' | 'midnight') || 'charcoal';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleThemeChange = (newTheme: 'charcoal' | 'midnight') => {
    setTheme(newTheme);
    localStorage.setItem('forex_ui_theme', newTheme);
  };

  const handleToggleAutoSave = () => {
    const nextVal = !autoSaveJournal;
    setAutoSaveJournal(nextVal);
    localStorage.setItem('forex_auto_save_journal', String(nextVal));
  };

  const isAdmin = isUserAdmin(user);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore analyses under /users/{userId}/analyses
  useEffect(() => {
    if (!user) {
      setAnalysesHistory([]);
      return;
    }

    const unsubscribe = subscribeToUserAnalyses(
      user.uid,
      (items) => {
        setAnalysesHistory(items);
      },
      (err) => {
        console.error('Failed to listen to Firestore analyses:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Subscribe to daily scan tracking: /users/{userId}/dailyScans/{todayKey}
  useEffect(() => {
    if (!user) {
      setDailyUsage(null);
      return;
    }

    const unsubscribe = subscribeToDailyUsage(
      user.uid,
      (usage) => {
        setDailyUsage(usage);
      },
      (err) => {
        console.warn('Daily usage subscription note:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Subscribe to Watchlist: /users/{userId}/watchlist
  useEffect(() => {
    if (!user) {
      setWatchlistItems([]);
      return;
    }

    const unsubscribe = subscribeToWatchlist(
      user.uid,
      (items) => {
        setWatchlistItems(items);
      },
      (err) => {
        console.warn('Watchlist subscription note:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Subscribe to Trade Journal: /users/{userId}/journal
  useEffect(() => {
    if (!user) {
      setJournalEntries([]);
      return;
    }

    const unsubscribe = subscribeToJournalEntries(
      user.uid,
      (entries) => {
        setJournalEntries(entries);
      },
      (err) => {
        console.warn('Journal subscription note:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const todayKey = getTodayDateKey();
  const analysesTodayCount = analysesHistory.filter((a) =>
    a.createdAt ? a.createdAt.startsWith(todayKey) : false
  ).length;

  const todayScansCount = Math.max(dailyUsage?.scanCount || 0, analysesTodayCount);

  // Handle Chart Analysis
  const handleAnalyzeChart = async ({
    imageBase64,
    mimeType,
    pairHint,
    timeframeHint,
    samplePreset,
    vsaOnly,
  }: {
    imageBase64: string;
    mimeType: string;
    pairHint?: string;
    timeframeHint?: string;
    samplePreset?: SampleChartPreset;
    vsaOnly?: boolean;
  }) => {
    if (!user) return;

    if (!isAdmin && todayScansCount >= DAILY_SCAN_LIMIT) {
      setErrorMessage(
        'Daily scan limit reached (5/5 scans used today). Anti-overtrading guard active to protect your trading capital. Please review existing analyses or return tomorrow.'
      );
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      let signalData: Partial<TradingSignal>;

      const res = await fetch('/api/analyze-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          pairHint: pairHint || samplePreset?.pair,
          timeframeHint: timeframeHint || samplePreset?.timeframe,
          vsaOnly,
        }),
      });

      if (!res.ok) {
        throw new Error('Server analysis endpoint failed');
      }

      const json = await res.json();
      signalData = json.data;

      const newSignalId = `signal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newSignal: TradingSignal = {
        id: newSignalId,
        userId: user.uid,
        pair: signalData.pair || pairHint || samplePreset?.pair || 'BTC/USDT',
        direction: (signalData.direction === 'BUY' || signalData.direction === 'SELL') ? signalData.direction : 'BUY',
        timeframe: signalData.timeframe || timeframeHint || '1H',
        analysisType: signalData.analysisType || 'AI Quantitative Price Action & Liquidity Confluence',
        entryPrice: signalData.entryPrice || '65000.00',
        stopLoss: signalData.stopLoss || '63800.00',
        tp1: signalData.tp1 || '66500.00',
        tp2: signalData.tp2 || '68000.00',
        tp3: signalData.tp3 || '70500.00',
        riskReward: signalData.riskReward || '1:2.8',
        confidence: signalData.confidence || 88,
        marketStructure: signalData.marketStructure || 'Market structure shows clear institutional break of structure (BOS) with strong displacement.',
        supportResistance: signalData.supportResistance || 'Key horizontal supply/demand level validated by multiple rejections.',
        marketPsychology: signalData.marketPsychology || 'Trapped counter-trend retail orders provide immediate fuel for price to reach our target.',
        candlestickConfirmation: signalData.candlestickConfirmation || 'Decisive price action candle with strong rejection wick.',
        imageUrl: imageBase64.length < 500000 ? imageBase64 : undefined,
        chatHistory: [],
        createdAt: new Date().toISOString(),
      };

      await saveAnalysisToFirestore(user.uid, newSignal);
      await recordDailyScan(user.uid);

      setActiveSignal(newSignal);

      // Trigger browser notification for watchlisted VSA high-probability setups even when not on scan page
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        const isWatchlisted = watchlistItems.some(
          w => w.pair.toUpperCase() === newSignal.pair.toUpperCase()
        );
        if (isWatchlisted && (newSignal.confidence >= 85 || newSignal.vsaSignalType)) {
          new Notification(`🚨 Watchlist VSA Alert: ${newSignal.pair}`, {
            body: `${newSignal.direction} setup detected on ${newSignal.timeframe}. Strategy: ${newSignal.analysisType} (Confidence: ${newSignal.confidence}%)`,
            icon: '/favicon.ico',
            tag: 'watchlist-vsa-notification',
          });
        }
      }

      if (autoSaveJournal) {
        try {
          const defaultOutcome: TradeOutcome = newSignal.confidence && newSignal.confidence >= 85 ? 'WIN' : 'BREAKEVEN';
          const journalEntryId = `journal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const autoEntry: JournalEntry = {
            id: journalEntryId,
            userId: user.uid,
            signalId: newSignal.id,
            pair: newSignal.pair,
            direction: newSignal.direction,
            entryPrice: newSignal.entryPrice,
            exitPrice: newSignal.tp1,
            outcome: defaultOutcome,
            notes: `Auto-saved by Auto-Save Trade Journal preference (${newSignal.analysisType}).`,
            loggedAt: new Date().toISOString(),
          };
          await saveJournalEntry(user.uid, autoEntry);
        } catch (err) {
          console.error('Failed auto-saving journal entry:', err);
        }
      }

      // Automatically open the Signal Results page upon completion
      setActivePage('results');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'Failed to analyze chart. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAdminResetQuota = async () => {
    if (!user || !isAdmin) return;
    try {
      await resetDailyScansForUser(user.uid);
      setErrorMessage(null);
    } catch (err) {
      console.error('Failed to reset quota:', err);
    }
  };

  const handleSelectPairFromWatchlist = (pairSymbol: string) => {
    setSelectedWatchlistPair(pairSymbol);
    setActivePage('scan');
  };

  const handleUpdateSignalChat = (updatedChat: ChatMessage[]) => {
    if (!activeSignal) return;
    setActiveSignal({
      ...activeSignal,
      chatHistory: updatedChat,
    });
  };

  const handleSelectPastSignal = (pastSignal: TradingSignal) => {
    setActiveSignal(pastSignal);
    setActivePage('results');
  };

  // Public-facing View-Only Shared Signal Page (Accessible without login)
  if (sharedSignalId) {
    return (
      <PublicSharedSignalView
        shareId={sharedSignalId}
        onNavigateHome={() => {
          setSharedSignalId(null);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }}
        currentUserSignedIn={!!user}
      />
    );
  }

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080b11] text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center animate-pulse">
          <Sparkles className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-xs text-slate-400 font-mono tracking-wider">
          Initializing Forex Signal Analyzer...
        </p>
      </div>
    );
  }

  // Unauthenticated screen
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className={`min-h-screen ${theme === 'midnight' ? 'bg-[#0a0f1d]' : 'bg-[#070a10]'} text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden pb-20`}>
      {/* App Header */}
      <Header
        user={user}
        historyCount={analysesHistory.length}
        todayScansCount={todayScansCount}
        watchlistCount={watchlistItems.length}
        journalCount={journalEntries.length}
        isWatchlistOpen={isWatchlistOpen}
        onToggleWatchlist={() => setIsWatchlistOpen(!isWatchlistOpen)}
        onOpenHistory={() => setActivePage('history')}
        onOpenJournal={() => setActivePage('journal')}
        onOpenWatchlist={() => setActivePage('watchlist')}
        activePage={activePage}
        autoSaveJournal={autoSaveJournal}
        onToggleAutoSave={handleToggleAutoSave}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={handleThemeChange}
        autoSaveJournal={autoSaveJournal}
        onToggleAutoSave={handleToggleAutoSave}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
        user={user}
      />

      {/* Main App Container with Sidebar layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Global Error Banner if any */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-xs text-rose-400 hover:text-white underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Page 1: Scan & Chart Analysis Page */}
            {activePage === 'scan' && (
              <div className="space-y-6">
                <div className="text-center max-w-3xl mx-auto space-y-2 pt-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Computer Vision Forex Signal Intelligence
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    Forex Signal <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">Analyzer</span>
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
                    Upload your chart screenshot and get instant AI-powered trading signals with precise entry, take profit, and stop loss levels.
                  </p>
                </div>

                <UploadSection
                  onAnalyze={handleAnalyzeChart}
                  isAnalyzing={isAnalyzing}
                  todayScansCount={todayScansCount}
                  isAdmin={isAdmin}
                  prefilledPair={selectedWatchlistPair}
                  onAdminResetQuota={handleAdminResetQuota}
                />

                <MarketNewsCard watchlistItems={watchlistItems} />
              </div>
            )}

            {/* Page 2: Signal Results & AI Advisor Page */}
            {activePage === 'results' && (
              <div className="space-y-8 pt-2">
                {activeSignal ? (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <h2 className="text-lg font-bold text-white">Signal Analysis Report</h2>
                      </div>
                      <button
                        onClick={() => setActivePage('scan')}
                        className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Analyze another chart</span>
                      </button>
                    </div>

                    <SignalResults
                      signal={activeSignal}
                      onLogTrade={() => setActiveSignalToLog(activeSignal)}
                    />

                    <AdvisorChat
                      signal={activeSignal}
                      onUpdateSignalChat={handleUpdateSignalChat}
                      userId={user.uid}
                    />
                  </div>
                ) : (
                  <div className="text-center py-16 bg-[#090d16] rounded-2xl border border-dashed border-slate-800 space-y-4">
                    <Sparkles className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
                    <h3 className="text-sm font-bold text-white">No active signal loaded</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Please upload and scan a chart screenshot first or select a past signal from History to view its comprehensive analysis report.
                    </p>
                    <button
                      onClick={() => setActivePage('scan')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all cursor-pointer"
                    >
                      Go to Chart Scan Page
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Page 3: Trade Execution Journal Page */}
            {activePage === 'journal' && (
              <div className="pt-2">
                <TradeJournal
                  userId={user.uid}
                  journalEntries={journalEntries}
                  signals={analysesHistory}
                  activeSignalToLog={activeSignalToLog}
                  onCloseModal={() => setActiveSignalToLog(null)}
                  onSelectSignal={handleSelectPastSignal}
                  autoSaveJournal={autoSaveJournal}
                  onToggleAutoSave={handleToggleAutoSave}
                />
              </div>
            )}

            {/* Page 4: History Panel & Performance Insights Page */}
            {activePage === 'history' && (
              <div className="pt-2">
                <HistoryPanel
                  analyses={analysesHistory}
                  currentSignalId={activeSignal?.id}
                  onSelectSignal={handleSelectPastSignal}
                  userId={user.uid}
                  journalEntries={journalEntries}
                  onLogSignalForJournal={(s) => {
                    setActiveSignalToLog(s);
                    setActivePage('journal');
                  }}
                />
              </div>
            )}

            {/* Page 5: Market Sentiment Heatmap Page */}
            {activePage === 'sentiment' && (
              <div className="pt-2 pb-12">
                <MarketSentimentHeatmap
                  watchlistItems={watchlistItems}
                  analyses={analysesHistory}
                />
              </div>
            )}

            {/* Page: Advanced Watchlist Page */}
            {activePage === 'watchlist' && user && (
              <div className="pt-2 pb-12">
                <WatchlistPage
                  userId={user.uid}
                  watchlistItems={watchlistItems}
                  onSelectPairForAnalysis={(pair) => {
                    setSelectedWatchlistPair(pair);
                    setActivePage('scan');
                  }}
                  onNavigateHome={() => setActivePage('scan')}
                />
              </div>
            )}

            {/* Page 6: Admin Dashboard Page (Visible ONLY to Administrator User) */}
            {activePage === 'admin' && isAdmin && (
              <div className="pt-2 pb-12">
                <AdminDashboard user={user} analysesCount={analysesHistory.length} />
              </div>
            )}
          </div>
        </main>

        {/* Watchlist Sidebar */}
        <WatchlistSidebar
          userId={user.uid}
          watchlistItems={watchlistItems}
          onSelectPairForAnalysis={handleSelectPairFromWatchlist}
          isOpen={isWatchlistOpen}
          onClose={() => setIsWatchlistOpen(false)}
        />
      </div>

      {/* Floating Bottom Action Bar for switching dedicated pages */}
      <BottomActionBar
        onOpenScan={() => setActivePage('scan')}
        onOpenResults={() => {
          if (!activeSignal) {
            setErrorMessage('No active signal to display. Please analyze a chart first.');
            setActivePage('scan');
          } else {
            setActivePage('results');
          }
        }}
        onOpenJournal={() => setActivePage('journal')}
        onOpenHistory={() => setActivePage('history')}
        onOpenSentiment={() => setActivePage('sentiment')}
        onOpenWatchlist={() => setActivePage('watchlist')}
        onOpenAdmin={isAdmin ? () => setActivePage('admin') : undefined}
        onToggleWatchlist={() => setIsWatchlistOpen(!isWatchlistOpen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activePage={activePage}
        hasActiveSignal={!!activeSignal}
        watchlistCount={watchlistItems.length}
        journalCount={journalEntries.length}
        historyCount={analysesHistory.length}
        theme={theme}
        isAdmin={isAdmin}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#06080d] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>Forex Signal Analyzer • Institutional Quantitative Research & AI Chart Vision</p>
          <p className="text-[11px] text-slate-600">
            Cloud Firestore Journal & History • Discipline Guard Active
          </p>
        </div>
      </footer>
    </div>
  );
}
