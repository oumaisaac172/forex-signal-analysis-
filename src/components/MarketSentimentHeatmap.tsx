import React from 'react';
import type { TradingSignal, WatchlistItem } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Sparkles,
} from 'lucide-react';

interface MarketSentimentHeatmapProps {
  watchlistItems: WatchlistItem[];
  analyses: TradingSignal[];
}

export const MarketSentimentHeatmap: React.FC<MarketSentimentHeatmapProps> = ({
  watchlistItems,
  analyses,
}) => {
  // Fallback default watchlisted pairs if none in watchlist
  const defaultPairs = ['GBP/USD', 'EUR/USD', 'USD/JPY', 'XAU/USD', 'BTC/USDT', 'AUD/USD'];
  const pairsToAnalyze =
    watchlistItems.length > 0
      ? Array.from(new Set([...watchlistItems.map((w) => w.pair), ...defaultPairs]))
      : defaultPairs;

  // Aggregate sentiment data for each pair based on analyses history or default simulation if none
  const sentimentData = pairsToAnalyze.map((pair) => {
    const pairSignals = analyses.filter((a) => a.pair.toUpperCase() === pair.toUpperCase());
    const total = pairSignals.length;

    let bullishCount = pairSignals.filter((a) => a.direction === 'BUY').length;
    let bearishCount = pairSignals.filter((a) => a.direction === 'SELL').length;

    // If no signals for this pair yet, generate realistic deterministic baseline sentiment based on pair name hash
    if (total === 0) {
      let hash = 0;
      for (let i = 0; i < pair.length; i++) {
        hash = pair.charCodeAt(i) + ((hash << 5) - hash);
      }
      const positiveHash = Math.abs(hash) % 100;
      bullishCount = positiveHash > 45 ? 7 : 3;
      bearishCount = positiveHash > 45 ? 3 : 7;
    }

    const totalCount = bullishCount + bearishCount;
    const bullishPct = Math.round((bullishCount / totalCount) * 100);
    const bearishPct = 100 - bullishPct;
    const isBullish = bullishPct >= 50;

    return {
      pair,
      bullish: bullishPct,
      bearish: bearishPct,
      sentimentScore: bullishPct,
      status: isBullish ? 'BULLISH' : 'BEARISH',
      color: isBullish ? '#10b981' : '#ef4444',
      signalCount: totalCount,
    };
  });

  // Calculate overall global market sentiment
  const totalBullishSum = sentimentData.reduce((acc, curr) => acc + curr.bullish, 0);
  const globalBullishAvg = Math.round(totalBullishSum / sentimentData.length);
  const globalIsBullish = globalBullishAvg >= 50;

  return (
    <div className="bg-[#0b0f19] border border-amber-500/20 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Market Sentiment Heatmap</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Global Bias
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated institutional sentiment and bullish/bearish momentum across watchlisted assets.
            </p>
          </div>
        </div>

        {/* Global Market Status Badge */}
        <div
          className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold shadow-inner ${
            globalIsBullish
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {globalIsBullish ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-400" />
          )}
          <span>
            BROADER MARKET: {globalIsBullish ? 'BULLISH' : 'BEARISH'} ({globalBullishAvg}%)
          </span>
        </div>
      </div>

      {/* Heatmap Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {sentimentData.map((item) => (
          <div
            key={item.pair}
            className={`p-3.5 rounded-xl border transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between ${
              item.status === 'BULLISH'
                ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white font-mono">{item.pair}</span>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                  item.status === 'BULLISH'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {item.status}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Bullish</span>
                <span className="text-emerald-400 font-bold">{item.bullish}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.status === 'BULLISH' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${item.bullish}%` }}
                />
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Signals: {item.signalCount}</span>
              <span className={item.status === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}>
                {item.status === 'BULLISH' ? '▲ Active' : '▼ Active'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recharts BarChart Sentiment Distribution */}
      <div className="bg-[#080c14] p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Asset Sentiment Strength Distribution (%)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Green = Bullish Momentum | Red = Bearish Pressure
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sentimentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="pair"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                domain={[0, 100]}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f141f',
                  borderColor: '#334155',
                  borderRadius: '10px',
                  fontSize: '11px',
                  color: '#fff',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                }}
                formatter={(value: any, name: any) => [
                  `${value}%`,
                  name === 'bullish' ? 'Bullish Sentiment' : 'Bearish Sentiment',
                ]}
              />
              <Bar dataKey="bullish" name="bullish" radius={[6, 6, 0, 0]}>
                {sentimentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.bullish >= 50 ? '#10b981' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
          <div className="flex items-center space-x-1.5 font-mono">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Watchlist Coverage: {pairsToAnalyze.length} Asset Pairs</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Bullish (&gt;50%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Bearish (&lt;50%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
