import React, { useState } from 'react';
import { Database, Activity, CheckCircle2, ShieldCheck, Server, Radio, RefreshCw, Cpu, Layers, Globe, Key, AlertCircle, Sparkles } from 'lucide-react';

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

export const MultiSourceMarketDataView: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<'tradingview' | 'forex_api' | 'mt5' | 'ctrader'>('tradingview');
  const [fallbackProvider, setFallbackProvider] = useState<string>('forex_api');
  const [symbol, setSymbol] = useState<string>('GBPUSD');
  const [timeframe, setTimeframe] = useState<string>('M15');
  
  // Connection states
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionLog, setConnectionLog] = useState<string>('Connected successfully to primary WebSocket feed.');
  
  // Credentials / config
  const [apiKey, setApiKey] = useState<string>('live_fx_api_sec_994821');
  const [mt5Server, setMt5Server] = useState<string>('MetaQuotes-Demo');
  const [mt5Login, setMt5Login] = useState<string>('50192841');
  const [ctraderAccountId, setCtraderAccountId] = useState<string>('CT-8821940');

  // Simulated live unified candle stream
  const [latestCandle, setLatestCandle] = useState<UnifiedCandle>({
    provider: 'tradingview',
    symbol: 'GBPUSD',
    timeframe: 'M15',
    timestamp: new Date().toISOString(),
    open: 1.3042,
    high: 1.3068,
    low: 1.3035,
    close: 1.3062,
    volume: 14250,
    volumeType: 'tick_volume',
    isClosed: false,
    receivedAt: new Date().toISOString()
  });

  const handleTestConnection = () => {
    setIsConnecting(true);
    setConnectionLog(`Testing connection to ${selectedProvider.toUpperCase()}...`);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      const now = new Date().toISOString();
      setConnectionLog(`[SUCCESS] Connected to ${selectedProvider.toUpperCase()} for ${symbol} (${timeframe}) at ${now}`);
      setLatestCandle({
        provider: selectedProvider,
        symbol: symbol.toUpperCase(),
        timeframe: timeframe,
        timestamp: now,
        open: 1.3045,
        high: 1.3072,
        low: 1.3040,
        close: 1.3068,
        volume: 18900,
        volumeType: selectedProvider === 'mt5' || selectedProvider === 'ctrader' ? 'real_volume' : 'tick_volume',
        isClosed: false,
        receivedAt: now
      });
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0e172a] via-[#101728] to-[#080d1a] border border-cyan-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xl">
                <Globe className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Multi-Source Market Data Architecture
                </h1>
                <p className="text-sm text-slate-300">
                  Unified VSA intelligence powered by TradingView charts, forex APIs, MetaTrader 5, and cTrader adapters.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold font-mono ${
              isConnected ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}>
              <Radio className={`w-4 h-4 ${isConnected ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
              <span>{isConnected ? `${selectedProvider.toUpperCase()} Connected` : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Provider Selection & Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              Data Source Selection
            </h3>

            <div className="space-y-3">
              {[
                { id: 'tradingview', name: 'TradingView-Compatible Chart', desc: 'Authorized charting & WebSocket feed' },
                { id: 'forex_api', name: 'Forex Market Data API', desc: 'REST & WebSocket institutional forex feed' },
                { id: 'mt5', name: 'MetaTrader 5 Bridge', desc: 'Connected to MT5 terminal via MQL5 bridge' },
                { id: 'ctrader', name: 'cTrader Open API', desc: 'Direct FIX / Open API streaming feed' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id as any)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                    selectedProvider === p.id
                      ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-950/30'
                      : 'bg-[#060911] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">{p.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.desc}</div>
                  </div>
                  {selectedProvider === p.id && (
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>

            {/* Symbol & Timeframe */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-[#030509] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full bg-[#030509] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                >
                  {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'].map(tf => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Credentials / Config based on provider */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adapter Authentication</span>
              {selectedProvider === 'forex_api' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">API Key / Token</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-[#030509] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}
              {selectedProvider === 'mt5' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">MT5 Server</label>
                    <input
                      type="text"
                      value={mt5Server}
                      onChange={(e) => setMt5Server(e.target.value)}
                      className="w-full bg-[#030509] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Account Login / ID</label>
                    <input
                      type="text"
                      value={mt5Login}
                      onChange={(e) => setMt5Login(e.target.value)}
                      className="w-full bg-[#030509] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
              {selectedProvider === 'ctrader' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">cTrader Account ID</label>
                  <input
                    type="text"
                    value={ctraderAccountId}
                    onChange={(e) => setCtraderAccountId(e.target.value)}
                    className="w-full bg-[#030509] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}
              {selectedProvider === 'tradingview' && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300">
                  Connected via authorized TradingView charting widget with secure WebSocket market data bridge.
                </div>
              )}

              <button
                onClick={handleTestConnection}
                disabled={isConnecting}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                {isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                <span>{isConnecting ? 'Establishing Connection...' : 'Test & Initialize Connection'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Unified Market Data Model Output & Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Unified Model JSON Output */}
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                Unified Market Data Model (JSON Output)
              </h3>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Normalized Schema Active
              </span>
            </div>

            <p className="text-xs text-slate-400">
              All incoming tick and OHLC responses from {selectedProvider.toUpperCase()} are automatically normalized into this strict common structure before VSA analysis:
            </p>

            <div className="bg-[#030509] rounded-xl p-4 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
              <pre>{JSON.stringify(latestCandle, null, 2)}</pre>
            </div>
          </div>

          {/* Connection Log & Fallback Settings */}
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Connection Diagnostics & Fallback Configuration
            </h3>

            <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 space-y-2 font-mono text-xs">
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Connection Log</div>
              <div className="text-emerald-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {connectionLog}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fallback Provider (Automatic Failover)</label>
                <select
                  value={fallbackProvider}
                  onChange={(e) => setFallbackProvider(e.target.value)}
                  className="w-full bg-[#030509] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="forex_api">Forex Market Data API</option>
                  <option value="tradingview">TradingView Feed</option>
                  <option value="mt5">MetaTrader 5 Bridge</option>
                  <option value="ctrader">cTrader Open API</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Strict Symbol & Timeframe Compatibility check enabled for failovers.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};
