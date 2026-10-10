import type { SampleChartPreset } from '../types';

// Helper to generate clean SVG candlestick chart screenshots as data URLs
function createChartSvg(pair: string, tf: string, trend: 'bullish' | 'bearish' | 'consolidation'): string {
  const isBull = trend === 'bullish';
  const primaryColor = isBull ? '#10b981' : '#ef4444';
  const secondaryColor = isBull ? '#34d399' : '#f87171';
  
  const candles = isBull ? [
    { x: 30, o: 170, c: 155, h: 145, l: 180, green: true },
    { x: 65, o: 155, c: 160, h: 150, l: 165, green: false },
    { x: 100, o: 160, c: 140, h: 135, l: 165, green: true },
    { x: 135, o: 140, c: 145, h: 135, l: 150, green: false },
    { x: 170, o: 145, c: 120, h: 115, l: 150, green: true },
    { x: 205, o: 120, c: 125, h: 115, l: 130, green: false },
    { x: 240, o: 125, c: 105, h: 95, l: 130, green: true },
    { x: 275, o: 105, c: 90, h: 80, l: 110, green: true },
    { x: 310, o: 90, c: 95, h: 85, l: 100, green: false },
    { x: 345, o: 95, c: 70, h: 60, l: 100, green: true },
    { x: 380, o: 70, c: 55, h: 48, l: 75, green: true },
    { x: 415, o: 55, c: 50, h: 42, l: 60, green: true },
  ] : [
    { x: 30, o: 60, c: 75, h: 55, l: 80, green: false },
    { x: 65, o: 75, c: 70, h: 65, l: 80, green: true },
    { x: 100, o: 70, c: 95, h: 65, l: 100, green: false },
    { x: 135, o: 95, c: 90, h: 85, l: 105, green: true },
    { x: 170, o: 90, c: 120, h: 85, l: 125, green: false },
    { x: 205, o: 120, c: 115, h: 110, l: 125, green: true },
    { x: 240, o: 115, c: 140, h: 110, l: 145, green: false },
    { x: 275, o: 140, c: 155, h: 135, l: 165, green: false },
    { x: 310, o: 155, c: 150, h: 145, l: 160, green: true },
    { x: 345, o: 150, c: 175, h: 145, l: 180, green: false },
    { x: 380, o: 175, c: 190, h: 170, l: 200, green: false },
    { x: 415, o: 190, c: 198, h: 185, l: 205, green: false },
  ];

  const svgCandles = candles.map(c => `
    <line x1="${c.x}" y1="${c.h}" x2="${c.x}" y2="${c.l}" stroke="${c.green ? '#10b981' : '#ef4444'}" stroke-width="1.5"/>
    <rect x="${c.x - 7}" y="${Math.min(c.o, c.c)}" width="14" height="${Math.max(Math.abs(c.c - c.o), 4)}" fill="${c.green ? '#10b981' : '#ef4444'}" rx="1"/>
  `).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 250" width="460" height="250">
    <rect width="460" height="250" fill="#0d1117"/>
    <!-- Grid -->
    <line x1="0" y1="50" x2="460" y2="50" stroke="#1f293d" stroke-dasharray="3 3"/>
    <line x1="0" y1="100" x2="460" y2="100" stroke="#1f293d" stroke-dasharray="3 3"/>
    <line x1="0" y1="150" x2="460" y2="150" stroke="#1f293d" stroke-dasharray="3 3"/>
    <line x1="0" y1="200" x2="460" y2="200" stroke="#1f293d" stroke-dasharray="3 3"/>
    <line x1="115" y1="0" x2="115" y2="250" stroke="#1f293d" stroke-dasharray="3 3"/>
    <line x1="230" y1="0" x2="230" y2="250" stroke="#1f293d" stroke-dasharray="3 3"/>
    <line x1="345" y1="0" x2="345" y2="250" stroke="#1f293d" stroke-dasharray="3 3"/>
    <!-- EMA 21 indicator line -->
    <path d="${isBull ? 'M 20 180 Q 150 145 280 90 T 440 45' : 'M 20 60 Q 150 100 280 155 T 440 205'}" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-opacity="0.8"/>
    <!-- Candlesticks -->
    ${svgCandles}
    <!-- Level line -->
    <line x1="0" y1="${isBull ? '65' : '185'}" x2="460" y2="${isBull ? '65' : '185'}" stroke="${primaryColor}" stroke-width="1.5" stroke-dasharray="4 2"/>
    <rect x="380" y="${isBull ? '53' : '173'}" width="70" height="18" fill="${primaryColor}" rx="3"/>
    <text x="415" y="${isBull ? '66' : '186'}" fill="#ffffff" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">KEY ZONE</text>
    <!-- Watermark Header -->
    <rect x="12" y="10" width="160" height="26" fill="#161e2e" rx="4" stroke="#2a354a"/>
    <text x="22" y="27" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">${pair}</text>
    <text x="80" y="27" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">● ${tf}</text>
    <text x="125" y="27" fill="${primaryColor}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold">${isBull ? '▲ BUY' : '▼ SELL'}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_CHARTS: SampleChartPreset[] = [
  {
    id: 'btcusdt-4h-buy',
    title: 'BTC/USDT (4H) - Crypto Bullish Breakout & Retest',
    pair: 'BTC/USDT',
    timeframe: '4H',
    type: 'Cryptocurrency Range Breakout & Daily Support Retest',
    description: 'Bitcoin bullish structure break above $64,200 with heavy spot volume and 4H EMA continuation.',
    imageUrl: createChartSvg('BTC/USDT', '4H', 'bullish'),
    suggestedSignal: {
      pair: 'BTC/USDT',
      direction: 'BUY',
      timeframe: '4H',
      analysisType: 'Crypto Range High Breakout & Liquidity Absorption',
      entryPrice: '64850.00',
      stopLoss: '63600.00',
      tp1: '66200.00',
      tp2: '67800.00',
      tp3: '70500.00',
      riskReward: '1:3.2',
      confidence: 91,
      marketStructure: 'Bitcoin broke decisively above the 3-week range high with high volume displacement. Clean higher-low printed at the 0.382 Fibonacci retracement on the 4H chart.',
      supportResistance: 'Prior range resistance at $64,200 now acts as major support floor. Invalidation stop loss safely placed below $63,600 structural low. Target 1 sits at $66,200.',
      marketPsychology: 'Aggressive short liquidations catalyzed the impulsive move. Funding rates remain neutral, indicating organic spot accumulation rather than over-leveraged retail speculation.',
      candlestickConfirmation: '4H Bullish Marubozu candle closing at the upper 5% of its range, followed by a low-volume retest hammer.'
    }
  },
  {
    id: 'usdjpy-h1-sell',
    title: 'USD/JPY (1H) - Liquidity Sweep & Resistance Reject',
    pair: 'USD/JPY',
    timeframe: '1H',
    type: 'Price Action & Institutional Liquidity Sweep',
    description: 'Bearish pin-bar rejection at 154.850 resistance with double top structure and bearish divergence.',
    imageUrl: createChartSvg('USD/JPY', '1H', 'bearish'),
    suggestedSignal: {
      pair: 'USD/JPY',
      direction: 'SELL',
      timeframe: '1H',
      analysisType: 'Institutional Liquidity Sweep & Resistance Rejection',
      entryPrice: '154.680',
      stopLoss: '155.050',
      tp1: '154.100',
      tp2: '153.600',
      tp3: '152.950',
      riskReward: '1:3.2',
      confidence: 91,
      marketStructure: 'Clean break of 1H market structure (BOS) below recent swing low. Price conducted an Asian session high liquidity sweep followed by aggressive institutional displacement downward.',
      supportResistance: 'Primary resistance holds at 154.850 - 155.000 psychological zone. Prior support at 154.100 now acts as immediate target (TP1). Major demand rests at 152.950.',
      marketPsychology: 'Late breakout buyers were trapped above 154.800 before smart money absorbed liquidity and triggered stops. High probability exhaustion setup.',
      candlestickConfirmation: 'Long upper shadow rejection candle (Shooting Star) on 1H followed by solid bearish displacement candle closing below the 21 EMA.'
    }
  },
  {
    id: 'eurusd-4h-buy',
    title: 'EUR/USD (4H) - Bullish Breakout & Daily Retest',
    pair: 'EUR/USD',
    timeframe: '4H',
    type: 'Trend Continuation & Fair Value Gap Retest',
    description: 'Bullish order block retest following a clean breakout above the descending channel resistance.',
    imageUrl: createChartSvg('EUR/USD', '4H', 'bullish'),
    suggestedSignal: {
      pair: 'EUR/USD',
      direction: 'BUY',
      timeframe: '4H',
      analysisType: 'Breakout & Bullish Order Block Retest',
      entryPrice: '1.0845',
      stopLoss: '1.0805',
      tp1: '1.0905',
      tp2: '1.0965',
      tp3: '1.1040',
      riskReward: '1:3.0',
      confidence: 89,
      marketStructure: 'Consecutive higher highs (HH) and higher lows (HL) confirmed on 4H chart. Price broke a 3-week descending trendline with strong volume expansion.',
      supportResistance: 'Key horizontal polarity pivot at 1.0830 - 1.0845 flipped from resistance to rock-solid dynamic support. Next major weekly resistance stands at 1.1040.',
      marketPsychology: 'Bears attempting to short the trendline were thoroughly squeezed. Institutional orderflow indicates steady spot accumulation into shallow pullbacks.',
      candlestickConfirmation: 'Bullish engulfing candle printed at the 4H 50% Fibonacci retracement level with lower wick rejection of the discount zone.'
    }
  },
  {
    id: 'gbpusd-m15-sell',
    title: 'GBP/USD (15M) - London Session Supply Reversal',
    pair: 'GBP/USD',
    timeframe: '15M',
    type: 'Intraday London Open High Rejection',
    description: 'Judas swing fakeout above Asian session high followed by an impulsive bearish shift.',
    imageUrl: createChartSvg('GBP/USD', '15M', 'bearish'),
    suggestedSignal: {
      pair: 'GBP/USD',
      direction: 'SELL',
      timeframe: '15M',
      analysisType: 'Intraday Liquidity Grab & Supply Reversal',
      entryPrice: '1.2920',
      stopLoss: '1.2948',
      tp1: '1.2875',
      tp2: '1.2830',
      tp3: '1.2780',
      riskReward: '1:2.7',
      confidence: 87,
      marketStructure: 'Classic London session Judas Swing. Price engineered buy-side liquidity above Asian highs at 1.2935 before rapid change of character (CHoCH) on the 15M chart.',
      supportResistance: 'Immediate supply zone 1.2930 - 1.2945 rejected. Target 1 sits at London Open price, with target 2 at previous day low (1.2830).',
      marketPsychology: 'Retail momentum traders bought the false London breakout and are now holding underwater positions as market makers push price lower.',
      candlestickConfirmation: '15M Bearish railroad track reversal pattern leaving an unfilled Fair Value Gap (FVG) overhead.'
    }
  },
  {
    id: 'xauusd-1h-buy',
    title: 'XAU/USD Gold (1H) - Demand Zone Spring & Rebound',
    pair: 'XAU/USD',
    timeframe: '1H',
    type: 'Wyckoff Spring & Key Demand Reaction',
    description: 'Gold testing multi-day support base with high volume absorption and bullish MACD divergence.',
    imageUrl: createChartSvg('XAU/USD', '1H', 'bullish'),
    suggestedSignal: {
      pair: 'XAU/USD',
      direction: 'BUY',
      timeframe: '1H',
      analysisType: 'Wyckoff Spring & Key Institutional Demand',
      entryPrice: '2648.50',
      stopLoss: '2635.00',
      tp1: '2670.00',
      tp2: '2695.00',
      tp3: '2725.00',
      riskReward: '1:3.4',
      confidence: 93,
      marketStructure: 'Wyckoff Accumulation Phase C Spring confirmed. Price dipped below $2640 support to test seller conviction, followed by rapid aggressive absorption.',
      supportResistance: 'Major institutional psychological shelf at $2640. Overhead resistance targets located at $2670, $2695, and prior all-time swing high $2725.',
      marketPsychology: 'Heavy retail panic selling into the support floor was entirely matched by central bank and institutional limit buy orders.',
      candlestickConfirmation: 'Massive bullish hammer candle with 3x average volume wick showing unambiguous rejection of lower prices.'
    }
  }
];
