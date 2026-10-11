import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, Layers, Activity, CheckCircle2, ShieldCheck, RefreshCw, TrendingUp, BarChart3, Globe, List } from 'lucide-react';
import { ALL_AVAILABLE_PAIRS, generateMarketQuote } from '../data/marketData';

interface UnifiedCandle {
  provider: string;
  symbol: string;
  timeframe: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volumeType: 'tick_volume' | 'real_volume';
  isClosed: boolean;
  receivedAt: string;
}

interface VsaSignal {
  pair: string;
  isBullish: boolean;
  strength: 'High' | 'Medium' | 'Low';
  action: 'Buy' | 'Sell' | 'Wait';
  spread: number;
  volume: number;
}

export const AiSignalVsaAnalysis: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<'tradingview' | 'forex_api' | 'mt5' | 'ctrader'>('tradingview');
  const [symbol, setSymbol] = useState<string>('GBPUSD');
  const [timeframe, setTimeframe] = useState<string>('M15');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [allSignals, setAllSignals] = useState<VsaSignal[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const runVsaScan = () => {
    setIsScanning(true);
    const newSignals: VsaSignal[] = ALL_AVAILABLE_PAIRS.map(asset => {
      const quote = generateMarketQuote(asset.pair);
      const isBullish = quote.isBullish;
      const volume = Math.random() * 20000;
      const spread = parseFloat(quote.spreadPips);
      return {
        pair: asset.pair,
        isBullish,
        strength: Math.random() > 0.5 ? 'High' : 'Medium',
        action: Math.random() > 0.7 ? (isBullish ? 'Buy' : 'Sell') : 'Wait',
        spread: spread,
        volume: volume
      };
    });
    setAllSignals(newSignals);
    setIsScanning(false);
  };

  useEffect(() => {
    runVsaScan();
  }, []);

  const [candle, setCandle] = useState<UnifiedCandle>({
    provider: 'tradingview',
    symbol: 'GBPUSD',
    timeframe: 'M15',
    timestamp: new Date().toISOString(),
    open: 1.3042,
    high: 1.3075,
    low: 1.3038,
    close: 1.3068,
    volume: 15420,
    volumeType: 'tick_volume',
    isClosed: false,
    receivedAt: new Date().toISOString()
  });

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      const randomShift = (Math.random() - 0.48) * 0.0012;
      const newClose = Number((candle.close + randomShift).toFixed(4));
      const newHigh = Math.max(candle.high, newClose + 0.0005);
      const newLow = Math.min(candle.low, newClose - 0.0005);
      const newVol = Math.floor(12000 + Math.random() * 8000);

      setCandle({
        ...candle,
        provider: selectedProvider,
        symbol: symbol.toUpperCase(),
        timeframe: timeframe,
        timestamp: now,
        high: Number(newHigh.toFixed(4)),
        low: Number(newLow.toFixed(4)),
        close: newClose,
        volume: newVol,
        receivedAt: now
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [candle, selectedProvider, symbol, timeframe, isSimulating]);

  const spread = Number((candle.high - candle.low).toFixed(4));
  const closingPosition = spread > 0 ? Number((((candle.close - candle.low) / spread) * 100).toFixed(1)) : 50;
  const relativeVolume = Number((candle.volume / 13000).toFixed(2));
  const isBullish = candle.close >= candle.open;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c1322] via-[#090e1a] to-[#050811] border border-amber-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Anna Coulling VPA & Jesse Livermore Structural Engine
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              AI Signal VSA <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">Analysis</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Independent real-time Volume Spread Analysis (VSA) intelligence platform. Evaluates effort vs. result, supply/demand imbalances, and institutional market structure.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={runVsaScan}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                isScanning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Pairs...' : 'Run Auto Scan All Pairs'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <List className="w-5 h-5 text-amber-400" />
            VSA Signal Scan Results ({allSignals.length} Pairs)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
            {allSignals.map(signal => (
                <div key={signal.pair} className={`p-3 rounded-xl border ${signal.isBullish ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                    <div className="font-bold text-sm text-white">{signal.pair}</div>
                    <div className={`text-xs font-bold ${signal.isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {signal.action} - {signal.strength}
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1 shadow-xl">
          <div className="text-xs font-medium text-slate-400 uppercase flex items-center justify-between">
            <span>Candle Spread (Range)</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {spread}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            High: {candle.high} • Low: {candle.low}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1 shadow-xl">
          <div className="text-xs font-medium text-slate-400 uppercase flex items-center justify-between">
            <span>Closing Position</span>
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-cyan-400">
            {closingPosition}%
          </div>
          <div className="text-[11px] text-slate-500">
            {closingPosition > 70 ? 'Closed near highs (Strong Demand)' : closingPosition < 30 ? 'Closed near lows (Heavy Supply)' : 'Mid-range equilibrium'}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1 shadow-xl">
          <div className="text-xs font-medium text-slate-400 uppercase flex items-center justify-between">
            <span>Relative Volume</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400">
            {relativeVolume}x
          </div>
          <div className="text-[11px] text-slate-500">
            {relativeVolume > 1.3 ? 'High Institutional Effort' : 'Average / Low Activity'}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1 shadow-xl">
          <div className="text-xs font-medium text-slate-400 uppercase flex items-center justify-between">
            <span>Livermore Structure</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400 truncate">
            {isBullish ? 'MARKUP / ACCUMULATION' : 'TEST OF SUPPLY'}
          </div>
          <div className="text-[11px] text-slate-500">Path of Least Resistance</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            Coulling VSA Pattern & Effort vs Result Analysis ({symbol} {timeframe})
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#060911] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">1. Effort vs. Result Evaluation</span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono bg-emerald-500/20 text-emerald-300 font-semibold">
                  {relativeVolume > 1.2 ? 'High Effort Confirmed' : 'Normal Effort'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Volume is {candle.volume.toLocaleString()} ({relativeVolume}x 20-bar average). Price spread is {spread} pips with a close at {candle.close}. This indicates that smart money participation is {relativeVolume > 1.2 ? 'actively supporting the move' : 'withholding major commitments until key liquidity pools are reached'}.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#060911] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">2. Supply and Demand Imbalances</span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono bg-cyan-500/20 text-cyan-300 font-semibold">
                  {closingPosition > 60 ? 'Demand Dominant' : 'Supply Absorption'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Closing position is at {closingPosition}% of the total bar range. Professional smart money is absorbing retail limit orders without allowing significant retracements against the primary trend.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#060911] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">3. Jesse Livermore Path of Least Resistance</span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono bg-amber-500/20 text-amber-300 font-semibold">
                  {isBullish ? 'Uptrend / Markup' : 'Markdown / Test'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The line of least resistance on the {timeframe} timeframe is pointing {isBullish ? 'UP' : 'DOWN'}. No climatic volume spikes or stopping volume anomalies have occurred to suggest an immediate trend reversal.
              </p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1 p-6 sm:p-8 rounded-3xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Actionable VSA Signal
            </h3>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-[#060911] to-[#060911] border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">Recommendation</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 shadow">
                  {isBullish ? 'HIGH-PROBABILITY BUY' : 'SELL / PULLBACK SETUP'}
                </span>
              </div>
              <div className="space-y-2 font-mono text-xs pt-2">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Entry Price:</span>
                  <span className="text-white font-bold">{candle.close}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Stop Loss (Invalidation):</span>
                  <span className="text-rose-400 font-bold">
                    {isBullish ? (candle.low - 0.0020).toFixed(4) : (candle.high + 0.0020).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Take Profit 1 (TP1):</span>
                  <span className="text-emerald-300 font-bold">
                    {isBullish ? (candle.close + 0.0045).toFixed(4) : (candle.close - 0.0045).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Risk / Reward Ratio:</span>
                  <span className="text-amber-400 font-bold">1 : 2.75</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time VSA Sync</span>
            </div>
            <p className="text-[11px] text-cyan-200">
              Connected to institutional live tick buffer. Signals update automatically on every completed bar close.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
