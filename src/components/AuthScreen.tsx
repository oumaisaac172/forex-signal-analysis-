import React, { useState } from 'react';
import { signInWithGoogle } from '../firebase';
import { TrendingUp, Shield, Zap, Target, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Failed to authenticate with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* App Emblem & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-xl shadow-amber-500/25 mb-4">
            <div className="bg-[#0b0f19] p-2.5 rounded-xl">
              <TrendingUp className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Forex Signal <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">Analyzer</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Upload your chart screenshot and get instant AI-powered trading signals with precise entry, take profit, and stop loss levels.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0d121c]/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/80 relative">
          <div className="border-b border-slate-800/80 pb-5 mb-6 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Institutional Terminal Access
            </span>
            <h2 className="text-lg font-semibold text-white mt-3">Sign in to your trading dashboard</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your generated signals and custom AI chat sessions are secured and synced across devices in Cloud Firestore.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-In Action */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 py-3.5 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-lg shadow-amber-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating with Google...</span>
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="font-semibold text-slate-900">Continue with Google Account</span>
                <ArrowRight className="w-4 h-4 text-slate-900 ml-1" />
              </>
            )}
          </button>

          {/* Feature Highlights */}
          <div className="mt-8 space-y-3 pt-6 border-t border-slate-800/80">
            <div className="flex items-center space-x-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span>Computer vision analysis of TradingView & MetaTrader charts</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <Target className="w-3.5 h-3.5" />
              </div>
              <span>Institutional Entry, Stop Loss, and multiple Take Profit levels</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span>Saved signal history synced directly to Cloud Firestore</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-center text-slate-500 mt-6">
          Encrypted authentication via Google Firebase. No financial advice; practice responsible risk management.
        </p>
      </div>
    </div>
  );
};
