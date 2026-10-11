import React, { useState, useEffect } from 'react';
import { GitBranch, Users, Check, Search, ShieldCheck, Zap, RotateCcw } from 'lucide-react';
import { institutionalStrategyCategories, retailStrategyCategories, institutionalStrategies, retailStrategies } from '../data/strategies';
import { getUserStrategies, saveUserStrategies } from '../firebase';
import { StrategyGuide } from './StrategyGuide';
import { StrategyEffectivenessDashboard } from './StrategyEffectivenessDashboard';
import { StrategyBacktester } from './StrategyBacktester';

export const ForexAnalysisModels: React.FC<{ userId: string }> = ({ userId }) => {
  const [activeStrategies, setActiveStrategies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (userId) {
      getUserStrategies(userId).then((strategies) => {
        if (strategies) {
          setActiveStrategies(strategies);
        } else {
          // Default all to active if no settings found
          setActiveStrategies([...institutionalStrategies, ...retailStrategies]);
        }
      });
    }
  }, [userId]);

  const toggleStrategy = (strategy: string) => {
    const newStrategies = activeStrategies.includes(strategy)
      ? activeStrategies.filter((s) => s !== strategy)
      : [...activeStrategies, strategy];
    
    setActiveStrategies(newStrategies);
    saveUserStrategies(userId, newStrategies);
  };

  const toggleCategory = (categoryStrategies: string[]) => {
    const allActive = categoryStrategies.every(s => activeStrategies.includes(s));
    let newStrategies: string[];
    if (allActive) {
      // remove all in category
      newStrategies = activeStrategies.filter(s => !categoryStrategies.includes(s));
    } else {
      // add all in category that aren't already included
      const union = new Set([...activeStrategies, ...categoryStrategies]);
      newStrategies = Array.from(union);
    }
    setActiveStrategies(newStrategies);
    saveUserStrategies(userId, newStrategies);
  };

  const handleSelectAll = () => {
    const all = [...institutionalStrategies, ...retailStrategies];
    setActiveStrategies(all);
    saveUserStrategies(userId, all);
  };

  const handleDeselectAll = () => {
    setActiveStrategies([]);
    saveUserStrategies(userId, []);
  };

  const filteredInstitutional = institutionalStrategyCategories.map(cat => ({
    ...cat,
    strategies: cat.strategies.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(cat => cat.strategies.length > 0);

  const filteredRetail = retailStrategyCategories.map(cat => ({
    ...cat,
    strategies: cat.strategies.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(cat => cat.strategies.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            Comprehensive Institutional & Retail Strategy Engine
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Toggle individual trading strategies on or off under their broad categories. All enabled strategies are fully functional and actively enforced in real-time AI signal generation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-medium transition-all"
          >
            Enable All ({institutionalStrategies.length + retailStrategies.length})
          </button>
          <button
            onClick={handleDeselectAll}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition-all"
          >
            Disable All
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search any institutional or retail strategy (e.g. Order Blocks, FVG, RSI, VSA)..."
          className="w-full pl-11 pr-4 py-3 bg-[#090c13] border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active status summary */}
        <div className="bg-[#090c13] border border-cyan-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Institutional Strategies Active</div>
              <div className="text-xs text-slate-400">
                {institutionalStrategies.filter(s => activeStrategies.includes(s)).length} of {institutionalStrategies.length} enabled
              </div>
            </div>
          </div>
          <div className="text-cyan-400 font-bold text-lg">
            {Math.round((institutionalStrategies.filter(s => activeStrategies.includes(s)).length / institutionalStrategies.length) * 100)}%
          </div>
        </div>

        <div className="bg-[#090c13] border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Retail Strategies Active</div>
              <div className="text-xs text-slate-400">
                {retailStrategies.filter(s => activeStrategies.includes(s)).length} of {retailStrategies.length} enabled
              </div>
            </div>
          </div>
          <div className="text-amber-400 font-bold text-lg">
            {Math.round((retailStrategies.filter(s => activeStrategies.includes(s)).length / retailStrategies.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Institutional Strategies Section */}
      <div className="bg-[#090c13] border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Institutional Trading Strategies</h3>
              <p className="text-xs text-slate-400">Liquidity management, execution algorithms, order blocks & market making models</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {filteredInstitutional.map((cat, idx) => {
            const catAllActive = cat.strategies.every(s => activeStrategies.includes(s));
            return (
              <div key={idx} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-cyan-300 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    {cat.category} ({cat.strategies.length})
                  </h4>
                  <button
                    onClick={() => toggleCategory(cat.strategies)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/25 transition-all"
                  >
                    {catAllActive ? 'Deselect Category' : 'Select Category'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                  {cat.strategies.map((s) => {
                    const isActive = activeStrategies.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleStrategy(s)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all ${
                          isActive
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-white shadow-sm shadow-cyan-500/10'
                            : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isActive ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600 bg-slate-900'}`}>
                          {isActive && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="truncate">{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Retail Strategies Section */}
      <div className="bg-[#090c13] border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Retail Trading Strategies</h3>
              <p className="text-xs text-slate-400">Support & resistance, trend following, indicators, oscillators & VSA</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {filteredRetail.map((cat, idx) => {
            const catAllActive = cat.strategies.every(s => activeStrategies.includes(s));
            return (
              <div key={idx} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-amber-300 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    {cat.category} ({cat.strategies.length})
                  </h4>
                  <button
                    onClick={() => toggleCategory(cat.strategies)}
                    className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/25 transition-all"
                  >
                    {catAllActive ? 'Deselect Category' : 'Select Category'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                  {cat.strategies.map((s) => {
                    const isActive = activeStrategies.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleStrategy(s)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all ${
                          isActive
                            ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-sm shadow-amber-500/10'
                            : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isActive ? 'bg-amber-500 border-amber-500' : 'border-slate-600 bg-slate-900'}`}>
                          {isActive && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="truncate">{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <StrategyGuide />
      <StrategyEffectivenessDashboard />
      <StrategyBacktester activeStrategies={activeStrategies} />
    </div>
  );
};
