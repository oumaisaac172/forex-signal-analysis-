import React, { useState } from 'react';
import { Play, TrendingUp } from 'lucide-react';

interface StrategyResult {
  strategy: string;
  winRate: number;
}

export const StrategyBacktester: React.FC<{ activeStrategies: string[] }> = ({ activeStrategies }) => {
  const [results, setResults] = useState<StrategyResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runBacktest = () => {
    setIsRunning(true);
    // Simulate backtesting process
    setTimeout(() => {
      const newResults = activeStrategies.map(strategy => ({
        strategy,
        winRate: Math.floor(Math.random() * 40) + 50, // Random win-rate between 50-90%
      }));
      setResults(newResults);
      setIsRunning(false);
    }, 1500);
  };

  return (
    <div className="bg-[#090c13] border border-slate-800 rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          <h3 className="font-semibold text-white">Strategy Backtester</h3>
        </div>
        <button
          onClick={runBacktest}
          disabled={isRunning || activeStrategies.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {isRunning ? 'Backtesting...' : 'Run Backtest'}
          {!isRunning && <Play className="w-4 h-4" />}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => (
            <div key={result.strategy} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <span className="text-slate-300">{result.strategy}</span>
              <span className="text-emerald-400 font-bold">{result.winRate}% Win-Rate</span>
            </div>
          ))}
        </div>
      )}
      
      {activeStrategies.length === 0 && (
        <p className="text-sm text-slate-500">Enable at least one strategy to run a backtest.</p>
      )}
    </div>
  );
};
