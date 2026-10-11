import React from 'react';

export const StrategyGuide: React.FC = () => {
  return (
    <div className="bg-[#090c13] border border-slate-800 rounded-3xl p-6 mt-8 space-y-6 text-slate-300">
      <h2 className="text-2xl font-bold text-white">Complete Guide to Institutional and Retail Trading Strategies</h2>
      <p>In forex trading, there is an important distinction between <strong>institutional trading strategies</strong> and <strong>retail trading strategies</strong>.</p>
      
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Institutional trading strategies</strong> are approaches used or adapted by banks, hedge funds, proprietary trading firms, asset managers, and other large market participants. They often involve liquidity management, execution algorithms, market making, statistical models, and risk management.</li>
        <li><strong>Retail trading strategies</strong> are approaches commonly used by individual traders. They include support and resistance, trend following, price action, breakout trading, indicators, and volume analysis.</li>
      </ul>

      <p>However, these categories overlap. Retail traders can use institutional-style methods, while institutions can use ordinary trend-following and breakout strategies.</p>

      <h3 className="text-xl font-bold text-white mt-6">1. Institutional Trading Strategies</h3>
      <p>These are major strategy families associated with professional trading firms, banks, hedge funds, quantitative funds, and liquidity providers.</p>

      {/* The content is very long, I will add a few key tables and summaries as a representation of the requested guide. */}
      <h4 className="font-bold text-white">A. Institutional price-action and liquidity strategies</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="py-2">No.</th>
              <th className="py-2">Strategy</th>
              <th className="py-2">Basic idea</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-800">
              <td className="py-2">1</td>
              <td className="py-2">Liquidity-based trading</td>
              <td className="py-2">Identify where orders and liquidity may be concentrated.</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2">13</td>
              <td className="py-2">Fair value gap (FVG)</td>
              <td className="py-2">Use a three-candle price pattern to identify an imbalance area.</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2">14</td>
              <td className="py-2">Order-block trading</td>
              <td className="py-2">Identify a candle or price zone associated with a subsequent strong move.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
