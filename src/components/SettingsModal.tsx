import React from 'react';
import type { User } from 'firebase/auth';
import {
  Settings,
  X,
  Palette,
  BookOpen,
  Cpu,
  ShieldCheck,
  Check,
  Bell,
  Database,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'charcoal' | 'midnight';
  onThemeChange: (theme: 'charcoal' | 'midnight') => void;
  autoSaveJournal: boolean;
  onToggleAutoSave: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  user: User | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  autoSaveJournal,
  onToggleAutoSave,
  notificationsEnabled,
  onToggleNotifications,
  user,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0d121f] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#080b12]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Settings className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Trader Preferences & Settings</h2>
              <p className="text-[11px] text-slate-400">Customize appearance, automation, and alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Color Theme Customization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                UI Color Theme Customization
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                {theme === 'charcoal' ? 'Deep Charcoal' : 'Midnight Blue'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Select your preferred trading terminal visual palette for extended chart analysis sessions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Deep Charcoal Theme Option */}
              <div
                onClick={() => onThemeChange('charcoal')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  theme === 'charcoal'
                    ? 'bg-[#070a12] border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-[#090d16] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-[#0b0e14] border border-amber-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    <span className="text-sm font-bold text-white">Deep Charcoal</span>
                  </div>
                  {theme === 'charcoal' && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Obsidian black & rich slate background</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Warm gold & amber institutional accents</span>
                  </div>
                </div>
              </div>

              {/* Midnight Blue Theme Option */}
              <div
                onClick={() => onThemeChange('midnight')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  theme === 'midnight'
                    ? 'bg-[#0a0f1d] border-cyan-500 shadow-lg shadow-cyan-500/10'
                    : 'bg-[#090d16] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-[#0f172a] border border-cyan-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                    <span className="text-sm font-bold text-white">Midnight Blue</span>
                  </div>
                  {theme === 'midnight' && (
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Deep navy blue & slate-900 background</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Electric cyan & vibrant trading highlights</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Section 2: Watchlist VSA Browser Notifications */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Watchlist VSA Browser Notifications
            </label>
            <div className="flex items-center justify-between bg-[#080b12] p-4 rounded-xl border border-slate-800">
              <div>
                <div className="text-sm font-bold text-white">Background Alerts for Watchlisted Pairs</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Triggers native browser notifications when high-probability VSA setups are detected for pairs in your watchlist, even when not on the scan page.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!('Notification' in window)) {
                    alert('Browser notifications are not supported by your browser.');
                    return;
                  }
                  if (Notification.permission === 'granted') {
                    new Notification('🔔 Forex Signal Analyzer', { body: 'Browser notifications are already active for your watchlist!' });
                    onToggleNotifications();
                  } else {
                    const perm = await Notification.requestPermission();
                    if (perm === 'granted') {
                      new Notification('🚀 Notifications Enabled!', { body: 'You will now receive alerts for watchlisted VSA setups.' });
                    }
                    onToggleNotifications();
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ml-3 ${
                  notificationsEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {notificationsEnabled ? 'Notifications Active' : 'Enable Notifications'}
              </button>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Section 3: Automation Preferences */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Trade Journal Automation
            </label>
            <div className="flex items-center justify-between bg-[#080b12] p-4 rounded-xl border border-slate-800">
              <div>
                <div className="text-sm font-bold text-white">Auto-Save Signals to Trade Journal</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatically log generated AI signals into your Cloud Firestore trade journal without manual steps.
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleAutoSave}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${
                  autoSaveJournal ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Section 4: Profile & System Info */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Connected Trader Account & Cloud Session
            </label>
            <div className="bg-[#080b12] p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Authenticated Email:</span>
                <span className="font-mono text-white font-medium">{user?.email || 'Anonymous Trader'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Database Backend:</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  Cloud Firestore Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Vision Engine:</span>
                <span className="font-mono text-amber-300 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" />
                  Google Gemini 2.5 Flash Vision
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-800 bg-[#080b12]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
