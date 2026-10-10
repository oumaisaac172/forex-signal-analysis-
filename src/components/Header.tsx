import React from 'react';
import type { User } from 'firebase/auth';
import { logOut, isUserAdmin } from '../firebase';
import { DAILY_SCAN_LIMIT } from '../types';
import {
  TrendingUp,
  ShieldCheck,
  LogOut,
  Cpu,
  User as UserIcon,
  Crown,
  ShieldAlert,
  Bookmark,
  BookOpen,
  History,
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  historyCount: number;
  todayScansCount: number;
  watchlistCount: number;
  journalCount?: number;
  isWatchlistOpen: boolean;
  onToggleWatchlist: () => void;
  onOpenHistory: () => void;
  onOpenJournal?: () => void;
  onOpenWatchlist?: () => void;
  activePage?: string;
  autoSaveJournal?: boolean;
  onToggleAutoSave?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  todayScansCount,
  watchlistCount,
  journalCount = 0,
  historyCount,
  onOpenWatchlist,
  onOpenJournal,
  onOpenHistory,
  activePage,
}) => {
  const isAdmin = isUserAdmin(user);
  const remaining = Math.max(0, DAILY_SCAN_LIMIT - todayScansCount);

  return (
    <header className="border-b border-amber-500/20 bg-[#0b0e14]/95 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0b0e14] rounded-[10px] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Forex Signal <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">Analyzer</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                AI Vision
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Institutional-Grade Price Action & Candlestick Signal Engine
            </p>
          </div>
        </div>

        {/* Center Desktop Quick Nav */}
        {user && onOpenWatchlist && (
          <div className="hidden lg:flex items-center space-x-1.5 bg-[#070b13] p-1 rounded-xl border border-slate-800">
            <button
              onClick={onOpenWatchlist}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activePage === 'watchlist'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Watchlist</span>
              {watchlistCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {watchlistCount}
                </span>
              )}
            </button>

            {onOpenJournal && (
              <button
                onClick={onOpenJournal}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activePage === 'journal'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>Journal</span>
                {journalCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {journalCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={onOpenHistory}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activePage === 'history'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {historyCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Right User Profile & Status */}
        <div className="flex items-center space-x-3">
          {user && (
            <>
              {/* Daily Quota Badge */}
              {isAdmin ? (
                <div
                  className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10"
                  title="Administrator privileges: Unlimited daily scans active"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin: Unlimited Scans</span>
                </div>
              ) : (
                <div
                  className={`hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    remaining === 0
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : remaining === 1
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/80'
                  }`}
                  title="Anti-overtrading discipline rule: Max 5 chart scans per day"
                >
                  <ShieldAlert className={`w-3.5 h-3.5 ${remaining === 0 ? 'text-rose-400' : 'text-amber-400'}`} />
                  <span>
                    Daily Scans: <strong className="font-mono">{todayScansCount}/{DAILY_SCAN_LIMIT}</strong>
                  </span>
                </div>
              )}

              {/* User Pill */}
              <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-amber-500/30 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden xl:block text-left text-xs">
                  <div className="font-medium text-slate-200 truncate max-w-[120px] flex items-center gap-1">
                    <span>{user.displayName || user.email?.split('@')[0] || 'Trader'}</span>
                    {isAdmin && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    {isAdmin ? (
                      <span className="text-amber-300 font-semibold">System Administrator</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Prop Trader</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={() => logOut()}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
