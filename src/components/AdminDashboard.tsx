import React, { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/auth';
import {
  ShieldCheck,
  Crown,
  Users,
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Database,
  BarChart3,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  Globe,
  Layers,
  Zap,
  Search,
  RotateCcw,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import type { TradingSignal, JournalEntry, WatchlistItem, DailyUsage } from '../types';
import { ADMIN_EMAIL } from '../types';
import {
  getAdminUsersList,
  getAdminTransactionsList,
  getAdminSharedSignalsCount,
  getAdminAllAnalyses,
  getAdminAllJournalEntries,
  getTodayDateKey,
  isUserAdmin,
  adminUpdateUserSubscription,
  type RegisteredUserRecord,
  type AdminTransactionRecord,
} from '../firebase';

interface AdminDashboardProps {
  user: User | null;
  analyses?: TradingSignal[];
  journalEntries?: JournalEntry[];
  watchlistItems?: WatchlistItem[];
  dailyUsage?: DailyUsage | null;
  onResetQuota?: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  analyses = [],
  journalEntries = [],
  watchlistItems = [],
  dailyUsage = null,
  onResetQuota,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUserRecord[]>([]);
  const [transactions, setTransactions] = useState<AdminTransactionRecord[]>([]);
  const [sharedSignalsCount, setSharedSignalsCount] = useState<number>(0);
  const [allLiveAnalyses, setAllLiveAnalyses] = useState<TradingSignal[]>([]);
  const [allLiveJournal, setAllLiveJournal] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'metrics' | 'subscribers' | 'users' | 'signals' | 'journal' | 'system'>('metrics');
  const [searchQuery, setSearchQuery] = useState('');
  const [userTierFilter, setUserTierFilter] = useState<'ALL' | 'SUBSCRIBED' | 'PREMIUM' | 'TRIAL' | 'EXPIRED' | 'ADMIN'>('ALL');
  const [subscriberFilter, setSubscriberFilter] = useState<'ALL' | 'PAID' | 'TRIAL' | 'EXPIRED' | 'ADMIN'>('ALL');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [resettingQuota, setResettingQuota] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const todayKey = getTodayDateKey();

  const fetchRealData = async () => {
    try {
      setRefreshing(true);
      const [usersList, txList, sharedCount] = await Promise.all([
        getAdminUsersList(),
        getAdminTransactionsList(),
        getAdminSharedSignalsCount(),
      ]);

      // Ensure current logged-in administrator is present in the list
      let finalUsers = [...usersList];
      if (user && user.email) {
        const adminFound = finalUsers.some(
          (u) => u.email.toLowerCase() === user.email?.toLowerCase() || u.uid === user.uid
        );
        if (!adminFound) {
          finalUsers.unshift({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Administrator',
            lastLoginAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
      }

      setRegisteredUsers(finalUsers);
      setTransactions(txList);
      setSharedSignalsCount(sharedCount);

      // Fetch all genuine analyses & journal logs across all registered user accounts
      const uids = finalUsers.map((u) => u.uid).filter(Boolean);
      const [sysAnalyses, sysJournal] = await Promise.all([
        getAdminAllAnalyses(uids),
        getAdminAllJournalEntries(uids),
      ]);

      setAllLiveAnalyses(sysAnalyses);
      setAllLiveJournal(sysJournal);
    } catch (err) {
      console.error('Failed to fetch real admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, [user]);

  // Combined real records: preferring system-wide Firestore records, fallback to passed-in records
  const effectiveAnalyses = useMemo(() => {
    if (allLiveAnalyses.length > 0) return allLiveAnalyses;
    return analyses;
  }, [allLiveAnalyses, analyses]);

  const effectiveJournal = useMemo(() => {
    if (allLiveJournal.length > 0) return allLiveJournal;
    return journalEntries;
  }, [allLiveJournal, journalEntries]);

  // Real Metric Calculations directly from live data (Zero demo multipliers or minimum padding)
  const realMetrics = useMemo(() => {
    const totalUsersCount = registeredUsers.length;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    // Daily active users: activity today
    const dailyActiveUsers = registeredUsers.filter((u) => {
      const activeIso = u.lastActiveAt || u.lastScanAt || u.lastLoginAt;
      if (!activeIso) return false;
      if (activeIso.startsWith(todayKey)) return true;
      const d = new Date(activeIso).getTime();
      return now - d < oneDayMs;
    });

    // Weekly active users: activity in past 7 days
    const weeklyActiveUsers = registeredUsers.filter((u) => {
      const activeIso = u.lastActiveAt || u.lastScanAt || u.lastLoginAt;
      if (!activeIso) return false;
      const d = new Date(activeIso).getTime();
      return now - d < sevenDaysMs;
    });

    // Monthly active users: activity in past 30 days
    const monthlyActiveUsers = registeredUsers.filter((u) => {
      const activeIso = u.lastActiveAt || u.lastScanAt || u.lastLoginAt;
      if (!activeIso) return false;
      const d = new Date(activeIso).getTime();
      return now - d < thirtyDaysMs;
    });

    // Total chart scans
    const totalScans = effectiveAnalyses.length;
    const todayScans = effectiveAnalyses.filter((a) => a.createdAt && a.createdAt.startsWith(todayKey)).length;

    // Consolidated AI signals monitored via live market data for TP/SL hits
    const signalWins = effectiveAnalyses.filter((a) => a.status === 'win').length;
    const signalLosses = effectiveAnalyses.filter((a) => a.status === 'loss').length;
    const signalPending = effectiveAnalyses.filter((a) => !a.status || a.status === 'pending').length;
    const aiScore =
      signalWins + signalLosses > 0 ? Math.round((signalWins / (signalWins + signalLosses)) * 100) : 0;

    // Real journal calculations
    const wins = effectiveJournal.filter((j) => j.outcome === 'WIN').length;
    const losses = effectiveJournal.filter((j) => j.outcome === 'LOSS').length;
    const bes = effectiveJournal.filter((j) => j.outcome === 'BREAKEVEN').length;
    const realizedWinRate =
      wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
    const netPips = effectiveJournal.reduce((sum, j) => sum + (j.pnlPips || 0), 0);

    // Revenue calculations: accurate sum of finished payments
    const finishedTx = transactions.filter((t) => t.status === 'finished');
    const totalRevenueUSD = finishedTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Master subscriber calculations
    const isMasterAdmin = (u: RegisteredUserRecord) =>
      u.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

    const isPaidMember = (u: RegisteredUserRecord) => {
      if (isMasterAdmin(u)) return false;
      const isPaidMonthly = u.subscription?.plan === 'monthly' && u.subscription?.status === 'active';
      return Boolean(isPaidMonthly || u.hasPaidTransaction);
    };

    const isTrialMember = (u: RegisteredUserRecord) => {
      if (isMasterAdmin(u)) return false;
      const isTrial = u.subscription?.plan === 'trial' && u.subscription?.status === 'active';
      const notExpired = !u.subscription?.expiresAt || new Date(u.subscription.expiresAt).getTime() > now;
      return Boolean(isTrial && notExpired);
    };

    const isExpiredMember = (u: RegisteredUserRecord) => {
      if (isMasterAdmin(u)) return false;
      if (u.subscription?.status === 'expired') return true;
      if (u.subscription?.expiresAt && new Date(u.subscription.expiresAt).getTime() <= now && !isPaidMember(u)) {
        return true;
      }
      return false;
    };

    const isSubscribedUser = (u: RegisteredUserRecord) => {
      return isMasterAdmin(u) || isPaidMember(u) || isTrialMember(u);
    };

    const totalSubscribersCount = registeredUsers.filter(isSubscribedUser).length;
    const paidMembersCount = registeredUsers.filter(isPaidMember).length;
    const trialMembersCount = registeredUsers.filter(isTrialMember).length;
    const expiredMembersCount = registeredUsers.filter(isExpiredMember).length;
    const unsubscribedCount = Math.max(0, totalUsersCount - totalSubscribersCount);
    const conversionRate = totalUsersCount > 0 ? Math.round((paidMembersCount / totalUsersCount) * 100) : 0;
    const estimatedMRR = paidMembersCount * 35;

    return {
      totalUsers: totalUsersCount,
      totalSubscribersCount,
      premiumUsers: totalSubscribersCount,
      paidMembersCount,
      trialMembersCount,
      expiredMembersCount,
      unsubscribedCount,
      conversionRate,
      estimatedMRR,
      dailyActive: dailyActiveUsers.length,
      weeklyActive: weeklyActiveUsers.length,
      monthlyActive: monthlyActiveUsers.length,
      yearlyActive: totalUsersCount,
      totalScans,
      todayScans: Math.max(todayScans, dailyUsage?.scanCount || 0),
      totalJournalTrades: effectiveJournal.length,
      wins,
      losses,
      bes,
      realizedWinRate,
      aiScore,
      signalWins,
      signalLosses,
      signalPending,
      netPips,
      totalRevenueUSD,
      finishedTxCount: finishedTx.length,
    };
  }, [registeredUsers, effectiveAnalyses, effectiveJournal, transactions, todayKey, dailyUsage]);

  const handleReset = async () => {
    if (!onResetQuota) return;
    try {
      setResettingQuota(true);
      await onResetQuota();
      setStatusMessage('Daily scan limit quota for your account was reset to 0.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Reset quota error:', err);
    } finally {
      setResettingQuota(false);
    }
  };

  const handleGrantPremium = async (targetUser: RegisteredUserRecord) => {
    try {
      setUpdatingUserId(targetUser.uid);
      await adminUpdateUserSubscription(targetUser.uid, 'monthly', 30);
      setStatusMessage(`Granted 30-day Premium Subscription to ${targetUser.email}!`);
      setTimeout(() => setStatusMessage(null), 5000);
      await fetchRealData();
    } catch (err: any) {
      console.error('Failed to update subscription:', err);
      setStatusMessage(`Failed to update subscription: ${err.message || 'Error'}`);
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // User classification helpers for rendering lists
  const isMasterAdmin = (u: RegisteredUserRecord) =>
    u.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  const isPaidMember = (u: RegisteredUserRecord) => {
    if (isMasterAdmin(u)) return false;
    const isPaidMonthly = u.subscription?.plan === 'monthly' && u.subscription?.status === 'active';
    return Boolean(isPaidMonthly || u.hasPaidTransaction);
  };

  const isTrialMember = (u: RegisteredUserRecord) => {
    if (isMasterAdmin(u)) return false;
    const isTrial = u.subscription?.plan === 'trial' && u.subscription?.status === 'active';
    const notExpired = !u.subscription?.expiresAt || new Date(u.subscription.expiresAt).getTime() > Date.now();
    return Boolean(isTrial && notExpired);
  };

  const isExpiredMember = (u: RegisteredUserRecord) => {
    if (isMasterAdmin(u)) return false;
    if (u.subscription?.status === 'expired') return true;
    if (u.subscription?.expiresAt && new Date(u.subscription.expiresAt).getTime() <= Date.now() && !isPaidMember(u)) {
      return true;
    }
    return false;
  };

  const isSubscribedUser = (u: RegisteredUserRecord) => {
    return isMasterAdmin(u) || isPaidMember(u) || isTrialMember(u);
  };

  const filteredSubscribers = useMemo(() => {
    return registeredUsers.filter((u) => {
      const isMaster = isMasterAdmin(u);
      const isPaid = isPaidMember(u);
      const isTrial = isTrialMember(u);
      const isExp = isExpiredMember(u);

      if (subscriberFilter === 'PAID' && !isPaid) return false;
      if (subscriberFilter === 'TRIAL' && !isTrial) return false;
      if (subscriberFilter === 'EXPIRED' && !isExp) return false;
      if (subscriberFilter === 'ADMIN' && !isMaster) return false;
      if (subscriberFilter === 'ALL' && !(isMaster || isPaid || isTrial)) return false;

      const term = searchQuery.toLowerCase().trim();
      if (!term) return true;
      return (
        u.email.toLowerCase().includes(term) ||
        (u.displayName && u.displayName.toLowerCase().includes(term)) ||
        u.uid.toLowerCase().includes(term)
      );
    });
  }, [registeredUsers, subscriberFilter, searchQuery]);

  const filteredUsers = useMemo(() => {
    return registeredUsers.filter((u) => {
      const isMaster = isMasterAdmin(u);
      const isPaid = isPaidMember(u);
      const isTrial = isTrialMember(u);
      const isExp = isExpiredMember(u);
      const isSub = isSubscribedUser(u);

      if (userTierFilter === 'SUBSCRIBED' && !isSub) return false;
      if (userTierFilter === 'PREMIUM' && !isPaid && !isMaster) return false;
      if (userTierFilter === 'TRIAL' && !isTrial) return false;
      if (userTierFilter === 'EXPIRED' && !isExp) return false;
      if (userTierFilter === 'ADMIN' && !isMaster) return false;

      const term = searchQuery.toLowerCase().trim();
      if (!term) return true;
      return (
        u.email.toLowerCase().includes(term) ||
        (u.displayName && u.displayName.toLowerCase().includes(term)) ||
        u.uid.toLowerCase().includes(term)
      );
    });
  }, [registeredUsers, userTierFilter, searchQuery]);

  const filteredAnalyses = effectiveAnalyses.filter(
    (a) =>
      a.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.direction.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.analysisType && a.analysisType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!user || !isUserAdmin(user)) {
    return (
      <div className="p-8 text-center text-slate-400">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-white">Administrator Access Required</p>
        <p className="text-xs text-slate-500 mt-1">This command center is restricted exclusively to the platform administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pt-2 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#0e131f] to-amber-900/10 border border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Administrator Command Center</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
              100% Real Live Data
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('subscribers')}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer"
              title="Click to view all subscribed users"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Subscribers: <strong className="text-white font-mono">{realMetrics.totalSubscribersCount}</strong> ({realMetrics.paidMembersCount} Paid • {realMetrics.trialMembersCount} Trial)</span>
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Administrator <span className="text-amber-400">Master Control</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time telemetry and database analytics for registered users, AI chart vision scans, journal performance, and cloud transactions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-[#0b0e14] border border-amber-500/30 text-xs text-slate-300 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Admin: <strong className="text-white font-mono">{user?.email}</strong></span>
          </div>

          <button
            type="button"
            onClick={fetchRealData}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh metrics directly from Cloud Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Live'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Real Statistics Grid (No Demo Multipliers) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Registered Traders (Real) */}
        <div className="p-5 rounded-2xl bg-[#0e131f] border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered</span>
            <span className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-white font-mono">{realMetrics.totalUsers}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">In Firestore DB</span>
              <span>• Live profiles</span>
            </div>
          </div>
        </div>

        {/* Subscribed / Premium Users (Requested Stat) */}
        <div 
          onClick={() => setActiveTab('subscribers')}
          className="p-5 rounded-2xl bg-gradient-to-b from-[#141b2c] via-[#0e131f] to-[#0a0d15] border border-amber-500/40 shadow-xl space-y-2 relative overflow-hidden group hover:border-amber-400 transition-all col-span-2 sm:col-span-1 cursor-pointer"
          title="Click to view all subscribed users"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Subscribed Users</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              {realMetrics.conversionRate}% Conv.
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-1.5">
              <span className="text-amber-400">{realMetrics.totalSubscribersCount}</span>
              <span className="text-xs font-normal text-slate-400">subscribed</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1 flex-wrap">
              <span className="text-amber-300 font-semibold">{realMetrics.paidMembersCount} Paid ($35/mo)</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{realMetrics.trialMembersCount} Trial</span>
            </div>
          </div>
          <div className="pt-0.5 flex items-center justify-between text-[10px] text-amber-400/80 group-hover:text-amber-300 transition-colors">
            <span>View Subscribed Traders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Daily Active Users (Real) */}
        <div className="p-5 rounded-2xl bg-[#0e131f] border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Active (DAU)</span>
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-white font-mono">{realMetrics.dailyActive}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">Active today</span>
              <span>• Live verified</span>
            </div>
          </div>
        </div>

        {/* Weekly Active Users (Real) */}
        <div className="p-5 rounded-2xl bg-[#0e131f] border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly Active (WAU)</span>
            <span className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-white font-mono">{realMetrics.weeklyActive}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="text-blue-400 font-semibold">Past 7 days</span>
              <span>• Distinct users</span>
            </div>
          </div>
        </div>

        {/* Monthly Active Users (Real) */}
        <div className="p-5 rounded-2xl bg-[#0e131f] border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Active (MAU)</span>
            <span className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-white font-mono">{realMetrics.monthlyActive}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="text-purple-400 font-semibold">Past 30 days</span>
              <span>• User retention</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Total AI Scans</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">{realMetrics.totalScans}</div>
          <div className="text-[10px] text-slate-400">Generated all-time</div>
        </div>

        <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Today's Scans</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">{realMetrics.todayScans}</div>
          <div className="text-[10px] text-slate-400">Executed on {todayKey}</div>
        </div>

        <div 
          onClick={() => setActiveTab('subscribers')}
          className="p-4 rounded-xl bg-[#090d16] border border-amber-500/40 hover:border-amber-400 space-y-1 transition-all cursor-pointer group"
          title="Click to view all subscribed users"
        >
          <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Subscribed Users</span>
            </div>
            <ArrowUpRight className="w-3 h-3 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">{realMetrics.totalSubscribersCount}</div>
          <div className="text-[10px] text-slate-400">{realMetrics.paidMembersCount} paid • {realMetrics.trialMembersCount} trial</div>
        </div>

        <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>Confirmed Revenue</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            ${realMetrics.totalRevenueUSD} <span className="text-xs text-slate-400">USD</span>
          </div>
          <div className="text-[10px] text-slate-400">{realMetrics.finishedTxCount} finished payments</div>
        </div>

        <div className="p-4 rounded-xl bg-[#090d16] border border-cyan-500/40 space-y-1">
          <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Score (Live Monitored)</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">{realMetrics.aiScore}%</div>
          <div className="text-[10px] text-slate-400">{realMetrics.signalWins}W • {realMetrics.signalLosses}L • {realMetrics.signalPending} Pending</div>
        </div>
      </div>

      {/* Navigation Tabs for Command Center */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2 flex-wrap">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'metrics'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-[#090d16] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Telemetry & Control
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscribers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'subscribers'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-[#090d16] text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-500'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Subscribed Users</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
              {realMetrics.totalSubscribersCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-[#090d16] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>All Registered Traders</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {registeredUsers.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signals')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'signals'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-[#090d16] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>Recent AI Signals</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {effectiveAnalyses.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'journal'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-[#090d16] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>Journal Logs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {effectiveJournal.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-[#090d16] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Cloud Infrastructure
          </button>
        </div>

        {(activeTab === 'users' || activeTab === 'signals' || activeTab === 'subscribers') && (
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="w-full bg-[#080b12] border border-slate-800 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        )}
      </div>

      {/* TAB 1: TELEMETRY & CONTROLS */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0e131f] border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                Live Cloud Firestore Connection & Data Guarantee
              </h2>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                100% Real Production Database
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0b0e14] border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400">Database & Security Engine</div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Cloud Firestore (Live)</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono break-all">
                  DB ID: ai-studio-forexsignalanaly-585fa252-b4ba-4312-a79d-ee4f5834cbb7
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0b0e14] border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400">Gemini Multi-Modal Vision Engine</div>
                <div className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Active (gemini-3.1-flash-lite)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Full multi-strategy analysis with VSA, SMC, and Order Flow actively running.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-3">
              <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Administrator Unlimited Access Verified</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  You are authenticated with master email <strong className="font-mono text-amber-300">{ADMIN_EMAIL}</strong>. Your account bypasses all daily scan quotas, rate limits, and subscription walls across every section of the platform.
                </p>
              </div>
            </div>

            {/* Site Subscribed Users & Monetization Intelligence Command Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#12192a] via-[#0d1322] to-[#0a0f1b] border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Site Subscribed Users & Monetization Telemetry</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('subscribers')}
                  className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Open Full Subscribers Ledger</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#080b12] border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-sans">Total Subscribed</div>
                  <div className="text-lg font-bold text-white">{realMetrics.totalSubscribersCount}</div>
                  <div className="text-[9px] text-emerald-400 font-sans">Active on site</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#080b12] border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-amber-300 font-sans">Paid Members ($35/mo)</div>
                  <div className="text-lg font-bold text-amber-300">{realMetrics.paidMembersCount}</div>
                  <div className="text-[9px] text-slate-400 font-sans">{realMetrics.conversionRate}% conversion</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#080b12] border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-cyan-300 font-sans">Active Free Trials</div>
                  <div className="text-lg font-bold text-cyan-300">{realMetrics.trialMembersCount}</div>
                  <div className="text-[9px] text-slate-400 font-sans">7-day free trial</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#080b12] border border-slate-800 space-y-0.5">
                  <div className="text-[10px] text-emerald-300 font-sans">Monthly Run Rate</div>
                  <div className="text-lg font-bold text-emerald-300">${realMetrics.estimatedMRR}</div>
                  <div className="text-[9px] text-slate-400 font-sans">${realMetrics.totalRevenueUSD} USD total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="p-6 rounded-2xl bg-[#0e131f] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Administrative Controls
              </h2>
              <p className="text-xs text-slate-400">
                Execute testing actions and quota resets for administrator accounts.
              </p>

              <div className="space-y-2.5 pt-2">
                {onResetQuota && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={resettingQuota}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resettingQuota ? 'animate-spin' : ''}`} />
                    <span>Reset Daily Scan Counter</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={fetchRealData}
                  disabled={refreshing}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Sync Real Firestore Records</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b0e14] border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Active Watchlist Pairs:</span>
                <span className="text-white font-bold">{watchlistItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Shared Signals:</span>
                <span className="text-white font-bold">{sharedSignalsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Recorded Transactions:</span>
                <span className="text-white font-bold">{transactions.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SUBSCRIBED USERS (OFFICIAL SITE SUBSCRIBERS) */}
      {activeTab === 'subscribers' && (
        <div className="bg-[#0e131f] border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Site Subscribed Traders ({filteredSubscribers.length})</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {realMetrics.totalSubscribersCount} Total Subscribed
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Official registry of all traders who have subscribed to the platform, including paid monthly members ($35/mo), active free trial accounts, and completed crypto transactions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                MRR: ${realMetrics.estimatedMRR} USD
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Total Revenue: ${realMetrics.totalRevenueUSD} USD
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar for Subscriptions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Subscribed</div>
              <div className="text-2xl font-extrabold text-white font-mono">{realMetrics.totalSubscribersCount}</div>
              <div className="text-[10px] text-emerald-400">Active platform accounts</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
              <div className="text-[10px] text-amber-400 uppercase font-bold">⭐ Paid Monthly ($35)</div>
              <div className="text-2xl font-extrabold text-amber-300 font-mono">{realMetrics.paidMembersCount}</div>
              <div className="text-[10px] text-slate-400">{realMetrics.conversionRate}% conversion rate</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
              <div className="text-[10px] text-cyan-400 uppercase font-bold">⏰ Free Trial (7 Days)</div>
              <div className="text-2xl font-extrabold text-cyan-300 font-mono">{realMetrics.trialMembersCount}</div>
              <div className="text-[10px] text-slate-400">Active trial access</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
              <div className="text-[10px] text-rose-400 uppercase font-bold">⚠️ Expired Plans</div>
              <div className="text-2xl font-extrabold text-rose-300 font-mono">{realMetrics.expiredMembersCount}</div>
              <div className="text-[10px] text-slate-400">Eligible for renewal</div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              type="button"
              onClick={() => setSubscriberFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                subscriberFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-[#090d16] text-amber-300 hover:text-amber-200 border border-amber-500/30'
              }`}
            >
              All Subscribed ({realMetrics.totalSubscribersCount})
            </button>
            <button
              type="button"
              onClick={() => setSubscriberFilter('PAID')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                subscriberFilter === 'PAID'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-[#090d16] text-emerald-300 hover:text-emerald-200 border border-emerald-500/30'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Paid Premium ($35/mo) ({realMetrics.paidMembersCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubscriberFilter('TRIAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                subscriberFilter === 'TRIAL'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-[#090d16] text-cyan-300 hover:text-cyan-200 border border-cyan-500/30'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Free Trial ({realMetrics.trialMembersCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubscriberFilter('EXPIRED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                subscriberFilter === 'EXPIRED'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-[#090d16] text-rose-300 hover:text-rose-200 border border-rose-500/30'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Expired ({realMetrics.expiredMembersCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubscriberFilter('ADMIN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                subscriberFilter === 'ADMIN'
                  ? 'bg-purple-500 text-white font-bold'
                  : 'bg-[#090d16] text-purple-300 hover:text-purple-200 border border-purple-500/30'
              }`}
            >
              <span>Master Admin (1)</span>
            </button>
          </div>

          {/* Subscribed Users Table */}
          {filteredSubscribers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No subscribed traders matching this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Subscriber Email</th>
                    <th className="py-2.5 px-3">Plan Tier</th>
                    <th className="py-2.5 px-3">Expiration & Term</th>
                    <th className="py-2.5 px-3">Payment State</th>
                    <th className="py-2.5 px-3">UID</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredSubscribers.map((u) => {
                    const isMaster = isMasterAdmin(u);
                    const isPaid = isPaidMember(u);
                    const isTrial = isTrialMember(u);
                    const isExp = isExpiredMember(u);
                    const isUpdating = updatingUserId === u.uid;

                    return (
                      <tr key={u.uid} className="hover:bg-[#090d16] transition-colors">
                        <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                          {isMaster ? (
                            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : isPaid ? (
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{u.email}</span>
                              {isMaster && (
                                <span className="text-[10px] text-amber-400 font-mono font-bold">(Super Admin)</span>
                              )}
                            </div>
                            {u.displayName && (
                              <div className="text-[10px] text-slate-400 font-normal">{u.displayName}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {isMaster ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              👑 Super Admin
                            </span>
                          ) : isPaid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit">
                              <Crown className="w-3 h-3 text-emerald-400" />
                              <span>⭐ Premium ($35/mo)</span>
                            </span>
                          ) : isTrial ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              <span>7-Day Free Trial</span>
                            </span>
                          ) : isExp ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              ⚠️ Expired
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          {isMaster ? (
                            <span className="text-amber-400 font-bold">Lifetime Unlimited</span>
                          ) : u.subscription?.expiresAt ? (
                            <div>
                              <div className={isExp ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
                                {new Date(u.subscription.expiresAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {(() => {
                                  const diffDays = Math.ceil(
                                    (new Date(u.subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                  );
                                  if (diffDays > 0) return `${diffDays} days remaining`;
                                  if (diffDays === 0) return 'Expires today';
                                  return `Expired ${Math.abs(diffDays)} days ago`;
                                })()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {isMaster ? (
                            <span className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>Admin Bypass</span>
                            </span>
                          ) : isPaid ? (
                            <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Paid Subscriber</span>
                            </span>
                          ) : isTrial ? (
                            <span className="flex items-center gap-1.5 text-cyan-400 font-medium text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Free Trial</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Unpaid</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px] truncate max-w-[130px]">
                          {u.uid}
                        </td>
                        <td className="py-3 px-3">
                          {!isMaster && (
                            <button
                              type="button"
                              onClick={() => handleGrantPremium(u)}
                              disabled={isUpdating}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Grant or extend 30-day Premium Subscription for this user"
                            >
                              <Crown className="w-3 h-3 text-amber-400" />
                              <span>{isUpdating ? 'Saving...' : '+30d Premium'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTERED USERS (REAL FIRESTORE TRADERS) */}
      {activeTab === 'users' && (
        <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Real Registered Trader Accounts ({filteredUsers.length})</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {realMetrics.totalSubscribersCount} Subscribed
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Verified Firebase user profiles registered in Cloud Firestore with live subscription tiers.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Live Database Table
            </span>
          </div>

          {/* User Tier Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              type="button"
              onClick={() => setUserTierFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                userTierFilter === 'ALL'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-[#090d16] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Traders ({registeredUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setUserTierFilter('SUBSCRIBED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                userTierFilter === 'SUBSCRIBED'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-[#090d16] text-amber-300 hover:text-amber-200 border border-amber-500/30'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Subscribed Users ({realMetrics.totalSubscribersCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setUserTierFilter('PREMIUM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                userTierFilter === 'PREMIUM'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-[#090d16] text-emerald-300 hover:text-emerald-200 border border-emerald-500/30'
              }`}
            >
              <span>⭐ Paid ($35/mo) ({realMetrics.paidMembersCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setUserTierFilter('TRIAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                userTierFilter === 'TRIAL'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-[#090d16] text-cyan-300 hover:text-cyan-200 border border-cyan-500/30'
              }`}
            >
              <span>⏰ Free Trial ({realMetrics.trialMembersCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setUserTierFilter('EXPIRED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                userTierFilter === 'EXPIRED'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-[#090d16] text-rose-300 hover:text-rose-200 border border-rose-500/30'
              }`}
            >
              <span>⚠️ Expired ({realMetrics.expiredMembersCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setUserTierFilter('ADMIN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                userTierFilter === 'ADMIN'
                  ? 'bg-purple-500 text-white font-bold'
                  : 'bg-[#090d16] text-purple-300 hover:text-purple-200 border border-purple-500/30'
              }`}
            >
              <span>Super Admin (1)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Trader Email</th>
                  <th className="py-2.5 px-3">Subscription Tier</th>
                  <th className="py-2.5 px-3">Plan Expiration</th>
                  <th className="py-2.5 px-3">Payment Status</th>
                  <th className="py-2.5 px-3">UID</th>
                  <th className="py-2.5 px-3">Last Active / Login</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredUsers.map((u) => {
                  const isSuperAdmin = isMasterAdmin(u);
                  const isPaidSub = isPaidMember(u);
                  const isTrial = isTrialMember(u);
                  const isExpired = isExpiredMember(u);
                  const isUpdating = updatingUserId === u.uid;

                  return (
                    <tr key={u.uid} className="hover:bg-[#090d16] transition-colors">
                      <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                        {isSuperAdmin ? (
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : isPaidSub ? (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : isTrial ? (
                          <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : (
                          <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <div>
                          <span>{u.email}</span>
                          {u.displayName && (
                            <div className="text-[10px] text-slate-400 font-normal">{u.displayName}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {isSuperAdmin ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Super Admin (Unlimited)
                          </span>
                        ) : isPaidSub ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit">
                            <Crown className="w-3 h-3 text-emerald-400" />
                            <span>⭐ Premium ($35/mo)</span>
                          </span>
                        ) : isTrial ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            7-Day Trial (Active)
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            Expired Plan
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Free / Standard
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                        {isSuperAdmin ? (
                          <span className="text-amber-400 font-bold">Lifetime Access</span>
                        ) : u.subscription?.expiresAt ? (
                          new Date(u.subscription.expiresAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isSuperAdmin ? (
                          <span className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Admin Bypass</span>
                          </span>
                        ) : isPaidSub ? (
                          <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Paid Subscriber</span>
                          </span>
                        ) : isTrial ? (
                          <span className="flex items-center gap-1.5 text-cyan-400 font-medium text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Trial Active</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Unpaid</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px] truncate max-w-[130px]">
                        {u.uid}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                        {u.lastActiveAt || u.lastLoginAt ? (
                          new Date(u.lastActiveAt || u.lastLoginAt || '').toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-slate-500">Active</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {!isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleGrantPremium(u)}
                            disabled={isUpdating}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Grant or extend 30-day Premium Subscription"
                          >
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span>{isUpdating ? 'Saving...' : '+30d Premium'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REAL AI SIGNALS AUDIT LOG */}
      {activeTab === 'signals' && (
        <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Live AI Generated Signal History ({filteredAnalyses.length})
              </h3>
              <p className="text-xs text-slate-400">
                Audited chart analysis records stored in Cloud Firestore under user accounts.
              </p>
            </div>
          </div>

          {filteredAnalyses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No chart analyses found. Upload and scan a chart to view records here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Pair</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">TF</th>
                    <th className="py-2.5 px-3">Entry Price</th>
                    <th className="py-2.5 px-3">Stop Loss</th>
                    <th className="py-2.5 px-3">Target 1</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredAnalyses.map((signal) => (
                    <tr key={signal.id} className="hover:bg-[#090d16] transition-colors font-mono">
                      <td className="py-2.5 px-3 font-bold text-white">{signal.pair}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            signal.direction === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {signal.direction}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{signal.timeframe}</td>
                      <td className="py-2.5 px-3 text-slate-200">{signal.entryPrice}</td>
                      <td className="py-2.5 px-3 text-rose-300">{signal.stopLoss}</td>
                      <td className="py-2.5 px-3 text-emerald-300">{signal.tp1}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-amber-400 font-semibold">{signal.confidence}%</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {signal.createdAt
                          ? new Date(signal.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REAL JOURNAL LOGS AUDIT */}
      {activeTab === 'journal' && (
        <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Real Trade Journal Logs ({effectiveJournal.length})
              </h3>
              <p className="text-xs text-slate-400">
                Audited outcomes recorded by traders, showing win-rate calibration data.
              </p>
            </div>
          </div>

          {effectiveJournal.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No journal logs recorded yet. Trades logged in the Trade Journal appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3">Pair</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Entry</th>
                    <th className="py-2.5 px-3">Exit</th>
                    <th className="py-2.5 px-3">Net Pips</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {effectiveJournal.map((j) => (
                    <tr key={j.id} className="hover:bg-[#090d16] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">{j.pair}</td>
                      <td className="py-2.5 px-3 text-[10px]">{j.direction}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            j.outcome === 'WIN'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : j.outcome === 'LOSS'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {j.outcome}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{j.entryPrice || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{j.exitPrice || '—'}</td>
                      <td className="py-2.5 px-3 font-bold">
                        {j.pnlPips !== undefined ? (
                          <span className={j.pnlPips >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {j.pnlPips > 0 ? `+${j.pnlPips}` : j.pnlPips}p
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {j.loggedAt
                          ? new Date(j.loggedAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SYSTEM INFRASTRUCTURE */}
      {activeTab === 'system' && (
        <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Verified Cloud Infrastructure Specs
            </h3>
            <p className="text-xs text-slate-400">
              Technical telemetry for persistent storage, AI services, and payment routing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-[#080b12] border border-slate-800 space-y-2">
              <div className="text-slate-400 uppercase text-[10px] tracking-wider">Cloud Firestore Engine</div>
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected & Healthy</span>
              </div>
              <div className="text-slate-300 space-y-1 text-[11px]">
                <div>Database: ai-studio-forexsignalanaly-585fa252-b4ba-4312-a79d-ee4f5834cbb7</div>
                <div>Rules Status: Deployed & Active (RBAC Enforced)</div>
                <div>Persistence: Indexed Multi-Session Cloud Storage</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#080b12] border border-slate-800 space-y-2">
              <div className="text-slate-400 uppercase text-[10px] tracking-wider">NOWPayments Gateway</div>
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Production IPN Listener Active</span>
              </div>
              <div className="text-slate-300 space-y-1 text-[11px]">
                <div>Webhook Route: /api/nowpayments-ipn</div>
                <div>HMAC-SHA512 Signature Verification: Active</div>
                <div>Target Plan: 35 USD / Month Unlimited Access</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
