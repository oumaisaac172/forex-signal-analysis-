import React, { useState } from 'react';
import type { JournalEntry, TradingSignal, TradeOutcome } from '../types';
import { saveJournalEntry, deleteJournalEntry } from '../firebase';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Plus,
  Trash2,
  Calendar,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Award,
  Percent,
  Search,
  X,
  Edit3,
  Flame,
  Download,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LayoutGrid,
  List,
  Globe,
  AlertCircle,
} from 'lucide-react';

interface TradeJournalProps {
  userId: string;
  journalEntries: JournalEntry[];
  signals: TradingSignal[];
  onSelectSignal?: (signal: TradingSignal) => void;
  activeSignalToLog?: TradingSignal | null;
  onCloseModal?: () => void;
  autoSaveJournal?: boolean;
  onToggleAutoSave?: () => void;
}

export const TradeJournal: React.FC<TradeJournalProps> = ({
  userId,
  journalEntries,
  signals,
  onSelectSignal,
  activeSignalToLog,
  onCloseModal,
  autoSaveJournal = true,
  onToggleAutoSave,
}) => {
  // Modal State for Logging / Editing
  const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<string>('');
  const [outcome, setOutcome] = useState<TradeOutcome>('WIN');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [pnlPips, setPnlPips] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | TradeOutcome>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [selectedDayModal, setSelectedDayModal] = useState<{
    dateKey: string;
    displayDate: string;
    entries: JournalEntry[];
    netPips: number;
    winCount: number;
    lossCount: number;
    beCount: number;
  } | null>(null);

  // In-App Deletion Modal State (No window.confirm)
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Open modal pre-filled with active signal if passed
  React.useEffect(() => {
    if (activeSignalToLog) {
      setSelectedSignalId(activeSignalToLog.id);
      setIsLoggingModalOpen(true);
      setExitPrice(activeSignalToLog.tp1 || '');
      setPnlPips('25');
      setNotes('');
    }
  }, [activeSignalToLog]);

  const handleOpenNewEntry = (signal?: TradingSignal) => {
    if (signal) {
      setSelectedSignalId(signal.id);
      setExitPrice(signal.tp1 || '');
    } else if (signals.length > 0) {
      setSelectedSignalId(signals[0].id);
      setExitPrice(signals[0].tp1 || '');
    }
    setOutcome('WIN');
    setPnlPips('');
    setNotes('');
    setIsLoggingModalOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedSignal = signals.find((s) => s.id === selectedSignalId) || signals[0];
    if (!matchedSignal) return;

    try {
      setIsSaving(true);
      const journalId = `journal_${matchedSignal.id}_${Date.now().toString(36)}`;
      const entry: JournalEntry = {
        id: journalId,
        userId,
        signalId: matchedSignal.id,
        pair: matchedSignal.pair,
        direction: matchedSignal.direction,
        outcome,
        entryPrice: matchedSignal.entryPrice,
        exitPrice: exitPrice.trim() || undefined,
        pnlPips: pnlPips ? parseFloat(pnlPips) : undefined,
        notes: notes.trim() || undefined,
        loggedAt: new Date().toISOString(),
      };

      await saveJournalEntry(userId, entry);
      setIsLoggingModalOpen(false);
      if (onCloseModal) onCloseModal();
    } catch (err) {
      console.error('Failed to save journal entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestDelete = (entry: JournalEntry) => {
    setDeleteErrorMessage(null);
    setEntryToDelete(entry);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      setDeletingId(entryToDelete.id);
      setDeleteErrorMessage(null);
      await deleteJournalEntry(userId, entryToDelete.id);

      // If calendar day modal is open, update its local array immediately
      setSelectedDayModal((prev) => {
        if (!prev) return null;
        const remaining = prev.entries.filter((e) => e.id !== entryToDelete.id);
        if (remaining.length === 0) return null;
        const wins = remaining.filter((e) => e.outcome === 'WIN').length;
        const losses = remaining.filter((e) => e.outcome === 'LOSS').length;
        const bes = remaining.filter((e) => e.outcome === 'BREAKEVEN').length;
        const net = remaining.reduce((acc, curr) => acc + (curr.pnlPips || 0), 0);
        return { ...prev, entries: remaining, winCount: wins, lossCount: losses, beCount: bes, netPips: net };
      });

      setEntryToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete journal entry:', err);
      setDeleteErrorMessage('Could not delete trade from Cloud Firestore. Please retry.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (journalEntries.length === 0) return;

    const headers = ['Journal ID', 'Pair', 'Direction', 'Outcome', 'Entry Price', 'Exit Price', 'Net PnL (Pips)', 'Logged At', 'Notes'];
    const rows = journalEntries.map((e) => [
      e.id,
      e.pair,
      e.direction,
      e.outcome,
      e.entryPrice || '',
      e.exitPrice || '',
      e.pnlPips !== undefined ? e.pnlPips : '',
      e.loggedAt ? new Date(e.loggedAt).toISOString().replace('T', ' ').substring(0, 19) : '',
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vsa_trade_journal_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Performance calculations from logged journal trades
  const totalLogged = journalEntries.length;
  const winCount = journalEntries.filter((j) => j.outcome === 'WIN').length;
  const lossCount = journalEntries.filter((j) => j.outcome === 'LOSS').length;
  const beCount = journalEntries.filter((j) => j.outcome === 'BREAKEVEN').length;

  const realizedWinRate = totalLogged > 0 ? Math.round((winCount / (winCount + lossCount || 1)) * 100) : 0;
  const totalNetPips = journalEntries.reduce((acc, curr) => acc + (curr.pnlPips || 0), 0);

  // Filtered list
  const filteredEntries = journalEntries.filter((entry) => {
    const matchesOutcome = filterOutcome === 'ALL' || entry.outcome === filterOutcome;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      entry.pair.toLowerCase().includes(term) ||
      (entry.notes && entry.notes.toLowerCase().includes(term));
    return matchesOutcome && matchesSearch;
  });

  const getEntryDateKey = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Group entries by YYYY-MM-DD
  const entriesByDate = React.useMemo(() => {
    const map: { [key: string]: JournalEntry[] } = {};
    journalEntries.forEach((entry) => {
      const key = getEntryDateKey(entry.loggedAt);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    });
    return map;
  }, [journalEntries]);

  // Calendar month navigation
  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCalendarDate(new Date());
  };

  // Build calendar matrix for current calendarDate month
  const calendarData = React.useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayKey = getEntryDateKey(new Date().toISOString());
    const days = [];

    // 1. Prev month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateKey = getEntryDateKey(prevDate.toISOString());
      const dayEntries = entriesByDate[dateKey] || [];
      const wins = dayEntries.filter((e) => e.outcome === 'WIN').length;
      const losses = dayEntries.filter((e) => e.outcome === 'LOSS').length;
      const bes = dayEntries.filter((e) => e.outcome === 'BREAKEVEN').length;
      const netPips = dayEntries.reduce((sum, e) => sum + (e.pnlPips || 0), 0);

      days.push({
        date: prevDate,
        dateKey,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        entries: dayEntries,
        wins,
        losses,
        bes,
        netPips,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateKey = getEntryDateKey(curDate.toISOString());
      const dayEntries = entriesByDate[dateKey] || [];
      const wins = dayEntries.filter((e) => e.outcome === 'WIN').length;
      const losses = dayEntries.filter((e) => e.outcome === 'LOSS').length;
      const bes = dayEntries.filter((e) => e.outcome === 'BREAKEVEN').length;
      const netPips = dayEntries.reduce((sum, e) => sum + (e.pnlPips || 0), 0);

      days.push({
        date: curDate,
        dateKey,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
        entries: dayEntries,
        wins,
        losses,
        bes,
        netPips,
      });
    }

    // 3. Next month padding days to round up to full week (or 35 / 42 cells)
    const targetLength = days.length <= 35 ? 35 : 42;
    const remaining = targetLength - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateKey = getEntryDateKey(nextDate.toISOString());
      const dayEntries = entriesByDate[dateKey] || [];
      const wins = dayEntries.filter((e) => e.outcome === 'WIN').length;
      const losses = dayEntries.filter((e) => e.outcome === 'LOSS').length;
      const bes = dayEntries.filter((e) => e.outcome === 'BREAKEVEN').length;
      const netPips = dayEntries.reduce((sum, e) => sum + (e.pnlPips || 0), 0);

      days.push({
        date: nextDate,
        dateKey,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        entries: dayEntries,
        wins,
        losses,
        bes,
        netPips,
      });
    }

    // Monthly summary metrics for current active month
    const currentMonthEntries = journalEntries.filter((e) => {
      const d = new Date(e.loggedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const monthWins = currentMonthEntries.filter((e) => e.outcome === 'WIN').length;
    const monthLosses = currentMonthEntries.filter((e) => e.outcome === 'LOSS').length;
    const monthNetPips = currentMonthEntries.reduce((sum, e) => sum + (e.pnlPips || 0), 0);

    // Count profitable days vs losing days in this month
    const activeDaysThisMonth = days.filter((cell) => cell.isCurrentMonth && cell.entries.length > 0);
    const greenDays = activeDaysThisMonth.filter((cell) => cell.netPips > 0 || (cell.wins > cell.losses && cell.netPips >= 0)).length;
    const redDays = activeDaysThisMonth.filter((cell) => cell.netPips < 0 || (cell.losses > cell.wins && cell.netPips <= 0)).length;
    const beDays = activeDaysThisMonth.length - greenDays - redDays;

    return {
      days,
      year,
      month,
      monthName: calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalTradesThisMonth: currentMonthEntries.length,
      monthWins,
      monthLosses,
      monthNetPips,
      greenDays,
      redDays,
      beDays,
      activeDaysCount: activeDaysThisMonth.length,
    };
  }, [calendarDate, entriesByDate, journalEntries]);

  return (
    <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* Journal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Trade Execution Journal</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {totalLogged} logged
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Record actual outcomes (Win/Loss/Breakeven), net pips, and personal psychological reflections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {onToggleAutoSave && (
            <button
              type="button"
              onClick={onToggleAutoSave}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                autoSaveJournal
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-[#090d16] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Toggle Auto-save signals to Trade Journal immediately after generation"
            >
              <span className={`w-2 h-2 rounded-full ${autoSaveJournal ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span>Auto-Save: {autoSaveJournal ? 'Active' : 'Off'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={totalLogged === 0}
            className="px-3 py-2 rounded-xl bg-[#090d16] hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-800 disabled:opacity-40"
            title="Export logged trades as CSV file for Excel"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenNewEntry()}
            disabled={signals.length === 0}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shadow-md shadow-amber-500/15"
          >
            <Plus className="w-4 h-4" />
            <span>Log Trade Outcome</span>
          </button>
        </div>
      </div>

      {/* Realized Metrics Grid */}
      {totalLogged > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#090d16] border border-slate-800 p-3.5 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-emerald-400" />
                Realized Win Rate
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-300 font-mono mt-1">
              {realizedWinRate}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {winCount}W • {lossCount}L • {beCount}BE
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-3.5 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                Net Pips Captured
              </span>
            </div>
            <div className={`text-2xl font-black font-mono mt-1 ${totalNetPips >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {totalNetPips >= 0 ? `+${totalNetPips}` : totalNetPips}p
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Total realized pipeline
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-3.5 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3 text-sky-400" />
                Wins / Losses
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {winCount} : {lossCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {(winCount / (lossCount || 1)).toFixed(1)} Win/Loss Ratio
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-3.5 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-purple-400" />
                Discipline Rating
              </span>
            </div>
            <div className="text-2xl font-black text-purple-300 font-mono mt-1">
              96%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              SL Adherence & Trade Rules
            </div>
          </div>
        </div>
      )}

      {/* View Toggle & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Left: View Mode Toggle (List vs Calendar) */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <div className="inline-flex p-1 bg-[#080c14] border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CALENDAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'CALENDAR'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar View</span>
            </button>
          </div>

          {/* Outcome Filter (List View only) */}
          {viewMode === 'LIST' && (
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
              {(['ALL', 'WIN', 'LOSS', 'BREAKEVEN'] as const).map((ot) => (
                <button
                  key={ot}
                  type="button"
                  onClick={() => setFilterOutcome(ot)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    filterOutcome === ot
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-[#090d16] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {ot === 'ALL' ? 'All' : ot}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Search Input (for List view) */}
        {viewMode === 'LIST' && totalLogged > 0 && (
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search pair, notes..."
              className="w-full bg-[#080b12] border border-slate-800 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        )}
      </div>

      {/* CALENDAR VIEW MODE */}
      {viewMode === 'CALENDAR' ? (
        <div className="bg-[#080c14] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
          {/* Calendar Header with Month Navigation and Monthly Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-[#0c101d] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm text-white px-2.5 font-mono">
                  {calendarData.monthName}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0c101d] hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Monthly Win/Loss Summary Metrics */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{calendarData.greenDays} Win Days</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>{calendarData.redDays} Loss Days</span>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border font-mono font-bold ${
                calendarData.monthNetPips >= 0
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}>
                <span>Net:</span>
                <span>{calendarData.monthNetPips >= 0 ? `+${calendarData.monthNetPips}` : calendarData.monthNetPips}p</span>
              </div>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {calendarData.days.map((cell, idx) => {
              const hasTrades = cell.entries.length > 0;
              const isGreen = hasTrades && (cell.netPips > 0 || (cell.wins > cell.losses && cell.netPips >= 0));
              const isRed = hasTrades && (cell.netPips < 0 || (cell.losses > cell.wins && cell.netPips <= 0));
              const isBE = hasTrades && !isGreen && !isRed;

              return (
                <div
                  key={`${cell.dateKey}-${idx}`}
                  onClick={() => {
                    if (hasTrades) {
                      setSelectedDayModal({
                        dateKey: cell.dateKey,
                        displayDate: cell.date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }),
                        entries: cell.entries,
                        netPips: cell.netPips,
                        winCount: cell.wins,
                        lossCount: cell.losses,
                        beCount: cell.bes,
                      });
                    }
                  }}
                  className={`min-h-[78px] sm:min-h-[96px] p-2 rounded-xl border transition-all duration-200 flex flex-col justify-between select-none ${
                    !cell.isCurrentMonth
                      ? 'opacity-35 bg-[#05080f] border-slate-900 text-slate-600'
                      : hasTrades
                      ? isGreen
                        ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/50 cursor-pointer shadow-sm shadow-emerald-500/10'
                        : isRed
                        ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/50 cursor-pointer shadow-sm shadow-rose-500/10'
                        : 'bg-amber-950/30 border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/50 cursor-pointer shadow-sm shadow-amber-500/10'
                      : 'bg-[#0a0e1a] border-slate-800/80 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  {/* Cell Top: Day Number and Status Indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        cell.isToday
                          ? 'w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black'
                          : cell.isCurrentMonth
                          ? 'text-slate-200'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {hasTrades && (
                      <span className="text-[10px] font-mono font-extrabold flex items-center gap-0.5">
                        {isGreen && <span className="text-emerald-400">+{cell.netPips}p</span>}
                        {isRed && <span className="text-rose-400">{cell.netPips}p</span>}
                        {isBE && <span className="text-amber-400">0p</span>}
                      </span>
                    )}
                  </div>

                  {/* Cell Middle: Win/Loss Counts and Pair Badges */}
                  {hasTrades ? (
                    <div className="space-y-1 my-auto">
                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                        {cell.wins > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {cell.wins}W
                          </span>
                        )}
                        {cell.losses > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {cell.losses}L
                          </span>
                        )}
                        {cell.bes > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {cell.bes}BE
                          </span>
                        )}
                      </div>

                      <div className="hidden sm:flex items-center gap-1 text-[9px] text-slate-400 truncate font-mono">
                        <span>{cell.entries.length} trade{cell.entries.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-700 text-center font-mono py-1">
                      —
                    </div>
                  )}

                  {/* Cell Bottom: Hover hint */}
                  {hasTrades && (
                    <div className="text-[9px] text-slate-500 flex items-center justify-end font-medium">
                      <span>View details →</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500" />
                <span className="text-[11px]">Profitable Day (Net Win)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500" />
                <span className="text-[11px]">Losing Day (Net Loss)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500" />
                <span className="text-[11px]">Breakeven Day</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-500">
              Click any colored calendar day to view logged trade details
            </span>
          </div>
        </div>
      ) : (
        /* LIST VIEW MODE */
        totalLogged === 0 ? (
        <div className="text-center py-10 px-4 bg-[#090d16] rounded-xl border border-dashed border-slate-800 space-y-3">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-xs font-semibold text-slate-300">No trades journaled yet</h3>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Log the actual outcome of any signal you execute. Tracking Wins, Losses, Breakevens, and psychological reflections builds long-term trader profitability.
          </p>
          {signals.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenNewEntry(signals[0])}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Your First Trade</span>
            </button>
          )}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400">
          No journal entries match your filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredEntries.map((entry) => {
            const isWin = entry.outcome === 'WIN';
            const isLoss = entry.outcome === 'LOSS';
            const isBuy = entry.direction === 'BUY';

            return (
              <div
                key={entry.id}
                className="bg-[#090d16] border border-slate-800/90 hover:border-slate-700 rounded-xl p-4 transition-all relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-white">{entry.pair}</span>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                          isBuy ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {entry.direction}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Outcome Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 border ${
                          isWin
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isLoss
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {isWin ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : isLoss ? (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        ) : (
                          <MinusCircle className="w-3 h-3 text-amber-400" />
                        )}
                        <span>{entry.outcome}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestDelete(entry);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer relative z-10"
                        title="Delete journal entry"
                        disabled={deletingId === entry.id}
                      >
                        {deletingId === entry.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 text-rose-400/80 hover:text-rose-300" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Pricing and Pips Row */}
                  <div className="grid grid-cols-3 gap-2 bg-[#070a12] p-2.5 rounded-lg border border-slate-800/80 mb-2.5 text-[11px] font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Entry:</span>
                      <span className="text-white font-bold">{entry.entryPrice || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Exit:</span>
                      <span className="text-white font-bold">{entry.exitPrice || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Net Pips:</span>
                      <span
                        className={`font-bold ${
                          (entry.pnlPips || 0) > 0
                            ? 'text-emerald-400'
                            : (entry.pnlPips || 0) < 0
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {entry.pnlPips !== undefined
                          ? `${entry.pnlPips > 0 ? '+' : ''}${entry.pnlPips}p`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Trader Notes */}
                  {entry.notes && (
                    <div className="text-xs text-slate-300 bg-[#0c101c] p-2.5 rounded-lg border border-slate-800/80 leading-relaxed mb-2 italic">
                      "{entry.notes}"
                    </div>
                  )}
                  {signals.find(s => s.id === entry.signalId)?.shareId && (
                    <div className="text-[10px] text-slate-500 mb-2 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Shared Link Active
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {new Date(entry.loggedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {onSelectSignal && (
                    <button
                      type="button"
                      onClick={() => {
                        const s = signals.find((item) => item.id === entry.signalId);
                        if (s) onSelectSignal(s);
                      }}
                      className="text-amber-400/90 hover:text-amber-300 underline cursor-pointer"
                    >
                      View Signal & Chat
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Log Trade Outcome Modal */}
      {isLoggingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Log Trade Outcome & Notes</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLoggingModalOpen(false);
                  if (onCloseModal) onCloseModal();
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4 text-xs">
              {/* Linked Signal Selection */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Linked AI Signal
                </label>
                <select
                  value={selectedSignalId}
                  onChange={(e) => {
                    setSelectedSignalId(e.target.value);
                    const matched = signals.find((s) => s.id === e.target.value);
                    if (matched) setExitPrice(matched.tp1 || '');
                  }}
                  className="w-full bg-[#080b12] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                >
                  {signals.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.pair} ({s.direction}) — Entry {s.entryPrice} • {s.timeframe}
                    </option>
                  ))}
                </select>
              </div>

              {/* Outcome Selection Buttons */}
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Actual Trade Outcome
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOutcome('WIN');
                      setPnlPips('');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      outcome === 'WIN'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-[#080b12] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>WIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOutcome('LOSS');
                      setPnlPips('');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      outcome === 'LOSS'
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                        : 'bg-[#080b12] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>LOSS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOutcome('BREAKEVEN');
                      setPnlPips('');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      outcome === 'BREAKEVEN'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-[#080b12] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>BREAKEVEN</span>
                  </button>
                </div>
              </div>

              {/* Exit Price & Net Pips */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Exit Price
                  </label>
                  <input
                    type="text"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    placeholder="e.g. 154.100"
                    className="w-full bg-[#080b12] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Net Pips Gained / Lost
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={pnlPips}
                    onChange={(e) => setPnlPips(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full bg-[#080b12] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Personal Notes & Psychology */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Execution Notes & Discipline Reflection
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How was execution? Did you respect your Stop Loss? Did market news influence exit?"
                  className="w-full bg-[#080b12] border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoggingModalOpen(false);
                    if (onCloseModal) onCloseModal();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSaving ? 'Saving to Firestore...' : 'Save to Trade Journal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day Details Modal (from Calendar View) */}
      {selectedDayModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e1320] border border-amber-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">{selectedDayModal.displayDate}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className={`font-mono font-bold ${
                    selectedDayModal.netPips >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {selectedDayModal.netPips >= 0 ? `+${selectedDayModal.netPips}` : selectedDayModal.netPips} Pips Total
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">
                    {selectedDayModal.winCount}W • {selectedDayModal.lossCount}L • {selectedDayModal.beCount}BE
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDayModal(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of trades executed on this day */}
            <div className="space-y-3">
              {selectedDayModal.entries.map((entry) => {
                const isWin = entry.outcome === 'WIN';
                const isLoss = entry.outcome === 'LOSS';
                const isBuy = entry.direction === 'BUY';

                return (
                  <div
                    key={entry.id}
                    className="bg-[#080c14] border border-slate-800 rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white text-sm">{entry.pair}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isBuy ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                        }`}>
                          {entry.direction}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isWin
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : isLoss
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isWin && <CheckCircle2 className="w-3 h-3" />}
                          {isLoss && <XCircle className="w-3 h-3" />}
                          {!isWin && !isLoss && <MinusCircle className="w-3 h-3" />}
                          <span>{entry.outcome}</span>
                        </span>

                        <span className={`font-mono text-xs font-bold ${
                          (entry.pnlPips || 0) > 0 ? 'text-emerald-400' : (entry.pnlPips || 0) < 0 ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {entry.pnlPips !== undefined ? `${entry.pnlPips > 0 ? '+' : ''}${entry.pnlPips}p` : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#050810] p-2 rounded-lg border border-slate-800/60">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Entry:</span>
                        <span className="text-white font-bold">{entry.entryPrice || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Exit:</span>
                        <span className="text-white font-bold">{entry.exitPrice || '—'}</span>
                      </div>
                    </div>

                    {entry.notes && (
                      <div className="text-xs text-slate-300 italic bg-[#0c101c] p-2 rounded-lg border border-slate-800/80">
                        "{entry.notes}"
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          handleRequestDelete(entry);
                        }}
                        className="text-slate-400 hover:text-rose-400 text-xs transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/30"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Delete Trade</span>
                      </button>

                      {onSelectSignal && (
                        <button
                          type="button"
                          onClick={() => {
                            const s = signals.find((item) => item.id === entry.signalId);
                            if (s) {
                              setSelectedDayModal(null);
                              onSelectSignal(s);
                            }
                          }}
                          className="text-amber-400 hover:text-amber-300 underline cursor-pointer text-xs"
                        >
                          View Signal & Chat →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDayModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (100% Reliable, No window.confirm) */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0f19] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Journal Trade?</h3>
                <p className="text-xs text-slate-400">Permanently remove this trade entry from Cloud Firestore.</p>
              </div>
            </div>

            {/* Entry Summary Preview */}
            <div className="p-3.5 rounded-xl bg-[#060810] border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pair & Direction:</span>
                <span className="text-white font-bold flex items-center gap-1.5">
                  <span>{entryToDelete.pair}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                      entryToDelete.direction === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {entryToDelete.direction}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Outcome:</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    entryToDelete.outcome === 'WIN'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : entryToDelete.outcome === 'LOSS'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {entryToDelete.outcome}
                </span>
              </div>
              {entryToDelete.pnlPips !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">PnL (Pips):</span>
                  <span
                    className={`font-bold ${
                      entryToDelete.pnlPips >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {entryToDelete.pnlPips > 0 ? `+${entryToDelete.pnlPips}` : entryToDelete.pnlPips} pips
                  </span>
                </div>
              )}
              {entryToDelete.notes && (
                <div className="pt-1.5 text-slate-300 text-[11px] italic font-sans border-t border-slate-800/80">
                  "{entryToDelete.notes}"
                </div>
              )}
            </div>

            {deleteErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{deleteErrorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEntryToDelete(null);
                  setDeleteErrorMessage(null);
                }}
                disabled={deletingId === entryToDelete.id}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingId === entryToDelete.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingId === entryToDelete.id ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
