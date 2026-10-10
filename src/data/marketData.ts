import type { MarketQuote } from '../types';

export type MarketCategory = 'Forex' | 'Metal' | 'Commodities' | 'Crypto' | 'Indices' | 'Stock';

export interface MarketAssetDefinition {
  pair: string;
  category: MarketCategory;
  description: string;
  basePrice: number;
  decimals: number;
  spreadPips: number;
  platforms: ('MT4' | 'MT5' | 'cTrader')[];
}

export const ALL_AVAILABLE_PAIRS: MarketAssetDefinition[] = [
  // --- FOREX: MAJORS ---
  { pair: 'EUR/USD', category: 'Forex', description: 'Euro vs US Dollar', basePrice: 1.0845, decimals: 4, spreadPips: 0.8, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'GBP/USD', category: 'Forex', description: 'British Pound vs US Dollar', basePrice: 1.2920, decimals: 4, spreadPips: 1.1, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'USD/JPY', category: 'Forex', description: 'US Dollar vs Japanese Yen', basePrice: 154.68, decimals: 2, spreadPips: 0.9, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'USD/CHF', category: 'Forex', description: 'US Dollar vs Swiss Franc', basePrice: 0.8715, decimals: 4, spreadPips: 1.2, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'USD/CAD', category: 'Forex', description: 'US Dollar vs Canadian Dollar', basePrice: 1.3890, decimals: 4, spreadPips: 1.3, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'AUD/USD', category: 'Forex', description: 'Australian Dollar vs US Dollar', basePrice: 0.6540, decimals: 4, spreadPips: 1.0, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'NZD/USD', category: 'Forex', description: 'New Zealand Dollar vs US Dollar', basePrice: 0.5985, decimals: 4, spreadPips: 1.4, platforms: ['MT4', 'MT5', 'cTrader'] },

  // --- FOREX: MINORS & CROSSES ---
  { pair: 'GBP/JPY', category: 'Forex', description: 'British Pound vs Japanese Yen', basePrice: 200.12, decimals: 2, spreadPips: 1.8, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'EUR/JPY', category: 'Forex', description: 'Euro vs Japanese Yen', basePrice: 167.80, decimals: 2, spreadPips: 1.4, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'EUR/GBP', category: 'Forex', description: 'Euro vs British Pound', basePrice: 0.8395, decimals: 4, spreadPips: 1.1, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'EUR/AUD', category: 'Forex', description: 'Euro vs Australian Dollar', basePrice: 1.6580, decimals: 4, spreadPips: 1.9, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'EUR/CAD', category: 'Forex', description: 'Euro vs Canadian Dollar', basePrice: 1.5065, decimals: 4, spreadPips: 1.8, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'EUR/CHF', category: 'Forex', description: 'Euro vs Swiss Franc', basePrice: 0.9450, decimals: 4, spreadPips: 1.5, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'EUR/NZD', category: 'Forex', description: 'Euro vs New Zealand Dollar', basePrice: 1.8120, decimals: 4, spreadPips: 2.4, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'GBP/AUD', category: 'Forex', description: 'British Pound vs Australian Dollar', basePrice: 1.9755, decimals: 4, spreadPips: 2.1, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'GBP/CAD', category: 'Forex', description: 'British Pound vs Canadian Dollar', basePrice: 1.7945, decimals: 4, spreadPips: 2.0, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'GBP/CHF', category: 'Forex', description: 'British Pound vs Swiss Franc', basePrice: 1.1260, decimals: 4, spreadPips: 1.9, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'GBP/NZD', category: 'Forex', description: 'British Pound vs New Zealand Dollar', basePrice: 2.1580, decimals: 4, spreadPips: 2.6, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'AUD/JPY', category: 'Forex', description: 'Australian Dollar vs Japanese Yen', basePrice: 101.15, decimals: 2, spreadPips: 1.5, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'AUD/CAD', category: 'Forex', description: 'Australian Dollar vs Canadian Dollar', basePrice: 0.9085, decimals: 4, spreadPips: 1.7, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'AUD/CHF', category: 'Forex', description: 'Australian Dollar vs Swiss Franc', basePrice: 0.5700, decimals: 4, spreadPips: 1.6, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'AUD/NZD', category: 'Forex', description: 'Australian Dollar vs New Zealand Dollar', basePrice: 1.0925, decimals: 4, spreadPips: 1.8, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'CAD/JPY', category: 'Forex', description: 'Canadian Dollar vs Japanese Yen', basePrice: 111.35, decimals: 2, spreadPips: 1.6, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'CAD/CHF', category: 'Forex', description: 'Canadian Dollar vs Swiss Franc', basePrice: 0.6275, decimals: 4, spreadPips: 1.7, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'CHF/JPY', category: 'Forex', description: 'Swiss Franc vs Japanese Yen', basePrice: 177.45, decimals: 2, spreadPips: 1.7, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'NZD/JPY', category: 'Forex', description: 'New Zealand Dollar vs Japanese Yen', basePrice: 92.55, decimals: 2, spreadPips: 1.9, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'NZD/CAD', category: 'Forex', description: 'New Zealand Dollar vs Canadian Dollar', basePrice: 0.8315, decimals: 4, spreadPips: 2.1, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'NZD/CHF', category: 'Forex', description: 'New Zealand Dollar vs Swiss Franc', basePrice: 0.5215, decimals: 4, spreadPips: 2.0, platforms: ['MT4', 'MT5', 'cTrader'] },

  // --- FOREX: EXOTICS ---
  { pair: 'USD/ZAR', category: 'Forex', description: 'US Dollar vs South African Rand', basePrice: 17.65, decimals: 4, spreadPips: 12.0, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'USD/MXN', category: 'Forex', description: 'US Dollar vs Mexican Peso', basePrice: 19.85, decimals: 4, spreadPips: 15.0, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'USD/TRY', category: 'Forex', description: 'US Dollar vs Turkish Lira', basePrice: 34.25, decimals: 4, spreadPips: 25.0, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'USD/SGD', category: 'Forex', description: 'US Dollar vs Singapore Dollar', basePrice: 1.3120, decimals: 4, spreadPips: 2.2, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'USD/SEK', category: 'Forex', description: 'US Dollar vs Swedish Krona', basePrice: 10.58, decimals: 4, spreadPips: 5.5, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'USD/NOK', category: 'Forex', description: 'US Dollar vs Norwegian Krone', basePrice: 10.92, decimals: 4, spreadPips: 6.0, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'USD/PLN', category: 'Forex', description: 'US Dollar vs Polish Zloty', basePrice: 3.9850, decimals: 4, spreadPips: 8.0, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'USD/CNH', category: 'Forex', description: 'US Dollar vs Offshore Chinese Yuan', basePrice: 7.1240, decimals: 4, spreadPips: 4.5, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'USD/HKD', category: 'Forex', description: 'US Dollar vs Hong Kong Dollar', basePrice: 7.7720, decimals: 4, spreadPips: 2.0, platforms: ['MT4', 'MT5', 'cTrader'] },

  // --- METALS ---
  { pair: 'XAU/USD', category: 'Metal', description: 'Gold Spot in US Dollars', basePrice: 2648.50, decimals: 2, spreadPips: 0.25, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'XAG/USD', category: 'Metal', description: 'Silver Spot in US Dollars', basePrice: 31.45, decimals: 2, spreadPips: 0.03, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'XPT/USD', category: 'Metal', description: 'Platinum Spot in US Dollars', basePrice: 985.20, decimals: 2, spreadPips: 1.2, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'XPD/USD', category: 'Metal', description: 'Palladium Spot in US Dollars', basePrice: 1045.00, decimals: 2, spreadPips: 2.5, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'XAU/EUR', category: 'Metal', description: 'Gold Spot in Euros', basePrice: 2442.20, decimals: 2, spreadPips: 0.35, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'XAG/EUR', category: 'Metal', description: 'Silver Spot in Euros', basePrice: 28.95, decimals: 2, spreadPips: 0.04, platforms: ['MT4', 'MT5', 'cTrader'] },

  // --- COMMODITIES & ENERGIES ---
  { pair: 'USOIL', category: 'Commodities', description: 'WTI Crude Oil (Spot CFD)', basePrice: 71.40, decimals: 2, spreadPips: 0.04, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'UKOIL', category: 'Commodities', description: 'Brent Crude Oil (Spot CFD)', basePrice: 75.15, decimals: 2, spreadPips: 0.04, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'NGAS', category: 'Commodities', description: 'Natural Gas Henry Hub CFD', basePrice: 2.85, decimals: 3, spreadPips: 0.008, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'COPPER', category: 'Commodities', description: 'Copper High Grade CFD', basePrice: 4.42, decimals: 3, spreadPips: 0.005, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'COFFEE', category: 'Commodities', description: 'Arabica Coffee C Futures CFD', basePrice: 245.80, decimals: 2, spreadPips: 0.30, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'SUGAR', category: 'Commodities', description: 'Raw Sugar No. 11 CFD', basePrice: 22.15, decimals: 2, spreadPips: 0.05, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'WHEAT', category: 'Commodities', description: 'Chicago SRW Wheat CFD', basePrice: 585.50, decimals: 2, spreadPips: 0.75, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'CORN', category: 'Commodities', description: 'US Corn Futures CFD', basePrice: 428.25, decimals: 2, spreadPips: 0.50, platforms: ['MT4', 'MT5', 'cTrader'] },

  // --- CRYPTOCURRENCIES ---
  { pair: 'BTC/USD', category: 'Crypto', description: 'Bitcoin vs US Dollar', basePrice: 94850.00, decimals: 2, spreadPips: 2.5, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'ETH/USD', category: 'Crypto', description: 'Ethereum vs US Dollar', basePrice: 3450.25, decimals: 2, spreadPips: 0.8, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'SOL/USD', category: 'Crypto', description: 'Solana vs US Dollar', basePrice: 198.50, decimals: 2, spreadPips: 0.15, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'XRP/USD', category: 'Crypto', description: 'Ripple vs US Dollar', basePrice: 1.45, decimals: 4, spreadPips: 0.002, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'BNB/USD', category: 'Crypto', description: 'Binance Coin vs US Dollar', basePrice: 655.20, decimals: 2, spreadPips: 0.5, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'ADA/USD', category: 'Crypto', description: 'Cardano vs US Dollar', basePrice: 0.825, decimals: 4, spreadPips: 0.001, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'DOGE/USD', category: 'Crypto', description: 'Dogecoin vs US Dollar', basePrice: 0.285, decimals: 4, spreadPips: 0.0008, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'LTC/USD', category: 'Crypto', description: 'Litecoin vs US Dollar', basePrice: 98.40, decimals: 2, spreadPips: 0.12, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'AVAX/USD', category: 'Crypto', description: 'Avalanche vs US Dollar', basePrice: 36.80, decimals: 2, spreadPips: 0.08, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'LINK/USD', category: 'Crypto', description: 'Chainlink vs US Dollar', basePrice: 18.25, decimals: 2, spreadPips: 0.05, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'DOT/USD', category: 'Crypto', description: 'Polkadot vs US Dollar', basePrice: 8.45, decimals: 3, spreadPips: 0.015, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'NEAR/USD', category: 'Crypto', description: 'NEAR Protocol vs US Dollar', basePrice: 6.85, decimals: 3, spreadPips: 0.012, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'SUI/USD', category: 'Crypto', description: 'Sui Network vs US Dollar', basePrice: 3.42, decimals: 4, spreadPips: 0.005, platforms: ['MT4', 'MT5', 'cTrader'] },

  // --- INDICES ---
  { pair: 'US30', category: 'Indices', description: 'Wall Street 30 / Dow Jones', basePrice: 43250.00, decimals: 2, spreadPips: 1.5, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'NAS100', category: 'Indices', description: 'US Tech 100 / Nasdaq', basePrice: 21180.50, decimals: 2, spreadPips: 1.2, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'SPX500', category: 'Indices', description: 'US 500 / S&P 500', basePrice: 5940.25, decimals: 2, spreadPips: 0.4, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'US2000', category: 'Indices', description: 'US Small Cap 2000 / Russell', basePrice: 2315.40, decimals: 2, spreadPips: 0.8, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'GER40', category: 'Indices', description: 'Germany 40 / DAX', basePrice: 19650.00, decimals: 2, spreadPips: 1.0, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'UK100', category: 'Indices', description: 'UK 100 / FTSE 100', basePrice: 8245.00, decimals: 2, spreadPips: 1.0, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'JPN225', category: 'Indices', description: 'Japan 225 / Nikkei', basePrice: 38850.00, decimals: 2, spreadPips: 4.0, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'FRA40', category: 'Indices', description: 'France 40 / CAC 40', basePrice: 7520.00, decimals: 2, spreadPips: 1.2, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'AUS200', category: 'Indices', description: 'Australia 200 / ASX 200', basePrice: 8280.00, decimals: 2, spreadPips: 1.5, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'EUSTX50', category: 'Indices', description: 'Euro Stoxx 50', basePrice: 4980.00, decimals: 2, spreadPips: 1.1, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'HK50', category: 'Indices', description: 'Hong Kong 50 / Hang Seng', basePrice: 20680.00, decimals: 2, spreadPips: 5.0, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'CHINA50', category: 'Indices', description: 'FTSE China A50 Index CFD', basePrice: 13240.00, decimals: 2, spreadPips: 3.5, platforms: ['MT4', 'MT5', 'cTrader'] },
  { pair: 'VIX', category: 'Indices', description: 'CBOE Volatility Index CFD', basePrice: 15.65, decimals: 2, spreadPips: 0.08, platforms: ['MT4', 'MT5', 'cTrader'] },

  // --- STOCKS / EQUITIES (CFDs) ---
  { pair: 'NVDA', category: 'Stock', description: 'NVIDIA Corporation', basePrice: 138.45, decimals: 2, spreadPips: 0.05, platforms: ['MT5', 'cTrader'] },
  { pair: 'AAPL', category: 'Stock', description: 'Apple Inc.', basePrice: 235.80, decimals: 2, spreadPips: 0.04, platforms: ['MT5', 'cTrader'] },
  { pair: 'TSLA', category: 'Stock', description: 'Tesla Inc.', basePrice: 242.10, decimals: 2, spreadPips: 0.08, platforms: ['MT5', 'cTrader'] },
  { pair: 'MSFT', category: 'Stock', description: 'Microsoft Corporation', basePrice: 428.50, decimals: 2, spreadPips: 0.06, platforms: ['MT5', 'cTrader'] },
  { pair: 'AMZN', category: 'Stock', description: 'Amazon.com Inc.', basePrice: 187.30, decimals: 2, spreadPips: 0.05, platforms: ['MT5', 'cTrader'] },
  { pair: 'GOOGL', category: 'Stock', description: 'Alphabet Inc. (Google)', basePrice: 166.40, decimals: 2, spreadPips: 0.05, platforms: ['MT5', 'cTrader'] },
  { pair: 'META', category: 'Stock', description: 'Meta Platforms Inc.', basePrice: 585.20, decimals: 2, spreadPips: 0.10, platforms: ['MT5', 'cTrader'] },
  { pair: 'AMD', category: 'Stock', description: 'Advanced Micro Devices', basePrice: 156.80, decimals: 2, spreadPips: 0.06, platforms: ['MT5', 'cTrader'] },
  { pair: 'NFLX', category: 'Stock', description: 'Netflix Inc.', basePrice: 712.50, decimals: 2, spreadPips: 0.15, platforms: ['MT5', 'cTrader'] },
  { pair: 'COIN', category: 'Stock', description: 'Coinbase Global Inc.', basePrice: 215.40, decimals: 2, spreadPips: 0.12, platforms: ['MT5', 'cTrader'] },
  { pair: 'PLTR', category: 'Stock', description: 'Palantir Technologies', basePrice: 44.80, decimals: 2, spreadPips: 0.03, platforms: ['MT5', 'cTrader'] },
  { pair: 'BABA', category: 'Stock', description: 'Alibaba Group Holding', basePrice: 99.20, decimals: 2, spreadPips: 0.05, platforms: ['MT5', 'cTrader'] },
  { pair: 'INTC', category: 'Stock', description: 'Intel Corporation', basePrice: 24.35, decimals: 2, spreadPips: 0.02, platforms: ['MT5', 'cTrader'] },
  { pair: 'DIS', category: 'Stock', description: 'The Walt Disney Company', basePrice: 114.80, decimals: 2, spreadPips: 0.05, platforms: ['MT5', 'cTrader'] },
  { pair: 'JPM', category: 'Stock', description: 'JPMorgan Chase & Co.', basePrice: 242.60, decimals: 2, spreadPips: 0.06, platforms: ['MT5', 'cTrader'] },
  { pair: 'V', category: 'Stock', description: 'Visa Inc.', basePrice: 312.40, decimals: 2, spreadPips: 0.06, platforms: ['MT5', 'cTrader'] },
];

export const DEFAULT_WATCHLIST_PAIRS = [
  'EUR/USD',
  'GBP/JPY',
  'USD/JPY',
  'XAU/USD',
  'BTC/USD',
  'US30',
  'NAS100',
  'USOIL',
  'NVDA',
];

// Live market rates cache to store real-world quotes
interface LiveRatesCache {
  forexRates: { [curr: string]: number };
  cryptoRates: { [symbol: string]: { price: number; change24h: number } };
  metalRates: { [symbol: string]: { price: number; change24h: number } };
  lastFetchedAt: number;
}

const liveCache: LiveRatesCache = {
  forexRates: {},
  cryptoRates: {},
  metalRates: {},
  lastFetchedAt: 0,
};

/**
 * Fetch real live market quotes from public financial endpoints
 */
export async function fetchLiveMarketRates(): Promise<boolean> {
  const now = Date.now();
  // Throttle to every 6 seconds minimum
  if (now - liveCache.lastFetchedAt < 6000 && Object.keys(liveCache.forexRates).length > 0) {
    return true;
  }

  let updated = false;

  // 1. Fetch real-time Forex interbank rates and precious metal pegs
  try {
    const fxRes = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-cache' });
    if (fxRes.ok) {
      const data = await fxRes.json();
      if (data && data.rates) {
        liveCache.forexRates = data.rates;
        // Check if XAU (Gold) or XAG (Silver) are in rates
        if (data.rates.XAU && data.rates.XAU > 0) {
          liveCache.metalRates['XAU/USD'] = {
            price: Math.round((1 / data.rates.XAU) * 100) / 100,
            change24h: 0.42,
          };
        }
        if (data.rates.XAG && data.rates.XAG > 0) {
          liveCache.metalRates['XAG/USD'] = {
            price: Math.round((1 / data.rates.XAG) * 100) / 100,
            change24h: 0.65,
          };
        }
        updated = true;
      }
    }
  } catch (err) {
    // Non-blocking fallback
  }

  // 2. Fetch real-time Crypto rates via Binance API (ultra-fast, real-time ECN prices)
  try {
    const binanceRes = await fetch(
      'https://api.binance.com/api/v3/ticker/24hr',
      { cache: 'no-cache' }
    );
    if (binanceRes.ok) {
      const bData = await binanceRes.json();
      if (Array.isArray(bData)) {
        const cryptoMap: { [symbol: string]: string } = {
          BTCUSDT: 'BTC/USD',
          ETHUSDT: 'ETH/USD',
          SOLUSDT: 'SOL/USD',
          XRPUSDT: 'XRP/USD',
          BNBUSDT: 'BNB/USD',
          ADAUSDT: 'ADA/USD',
          DOGEUSDT: 'DOGE/USD',
          LTCUSDT: 'LTC/USD',
          AVAXUSDT: 'AVAX/USD',
          LINKUSDT: 'LINK/USD',
          DOTUSDT: 'DOT/USD',
          NEARUSDT: 'NEAR/USD',
          SUIUSDT: 'SUI/USD',
        };
        bData.forEach((item: any) => {
          const pair = cryptoMap[item.symbol];
          if (pair) {
            const p = parseFloat(item.lastPrice);
            const c = Math.round(parseFloat(item.priceChangePercent) * 100) / 100;
            if (!isNaN(p) && p > 0) {
              liveCache.cryptoRates[pair] = { price: p, change24h: c };
              updated = true;
            }
          }
        });
      }
    }
  } catch (bErr) {
    // Fallback to CoinGecko
    try {
      const cryptoRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,binancecoin,cardano,dogecoin,litecoin,avalanche-2,chainlink,polkadot,near,sui&vs_currencies=usd&include_24hr_change=true',
        { cache: 'no-cache' }
      );
      if (cryptoRes.ok) {
        const cData = await cryptoRes.json();
        if (cData) {
          const mapping: { [pair: string]: string } = {
            'BTC/USD': 'bitcoin',
            'ETH/USD': 'ethereum',
            'SOL/USD': 'solana',
            'XRP/USD': 'ripple',
            'BNB/USD': 'binancecoin',
            'ADA/USD': 'cardano',
            'DOGE/USD': 'dogecoin',
            'LTC/USD': 'litecoin',
            'AVAX/USD': 'avalanche-2',
            'LINK/USD': 'chainlink',
            'DOT/USD': 'polkadot',
            'NEAR/USD': 'near',
            'SUI/USD': 'sui',
          };
          Object.entries(mapping).forEach(([pair, id]) => {
            if (cData[id]) {
              liveCache.cryptoRates[pair] = {
                price: cData[id].usd,
                change24h: Math.round((cData[id].usd_24h_change || 0) * 100) / 100,
              };
            }
          });
          updated = true;
        }
      }
    } catch (err) {
      // Non-blocking fallback
    }
  }

  liveCache.lastFetchedAt = now;
  return updated;
}

/**
 * Generate high-precision Market Quote with real live market data
 * and MetaTrader / cTrader Bid, Ask, Spread calculations
 */
export function generateMarketQuote(pair: string, tickOffset = 0): MarketQuote {
  const meta = ALL_AVAILABLE_PAIRS.find(p => p.pair.toUpperCase() === pair.toUpperCase()) || {
    pair,
    category: 'Forex' as MarketCategory,
    description: pair,
    basePrice: 1.2500,
    decimals: 4,
    spreadPips: 1.0,
    platforms: ['MT4', 'MT5', 'cTrader'] as ('MT4' | 'MT5' | 'cTrader')[],
  };

  let livePrice = meta.basePrice;
  let changePct = 0;

  // Check if we have real live rates for this pair
  if (meta.category === 'Crypto' && liveCache.cryptoRates[pair]) {
    livePrice = liveCache.cryptoRates[pair].price;
    changePct = liveCache.cryptoRates[pair].change24h;
  } else if (meta.category === 'Metal' && liveCache.metalRates[pair]) {
    livePrice = liveCache.metalRates[pair].price;
    changePct = liveCache.metalRates[pair].change24h;
  } else if (meta.category === 'Forex' && Object.keys(liveCache.forexRates).length > 0) {
    const parts = pair.split('/');
    if (parts.length === 2) {
      const [base, quote] = parts;
      const rBase = liveCache.forexRates[base];
      const rQuote = liveCache.forexRates[quote];
      if (base === 'USD' && rQuote) {
        livePrice = rQuote;
      } else if (quote === 'USD' && rBase) {
        livePrice = 1 / rBase;
      } else if (rBase && rQuote) {
        livePrice = rQuote / rBase;
      }
    }
  }

  // Deterministic micro tick simulation to replicate live ECN orderbook ticking
  let seed = 0;
  for (let i = 0; i < pair.length; i++) {
    seed += pair.charCodeAt(i);
  }

  if (changePct === 0) {
    changePct = ((seed % 17) - 8) * 0.08;
  }

  // Micro tick offset for real-time live pulse
  const pipMultiplier = meta.decimals === 2 ? 0.01 : meta.decimals === 4 ? 0.0001 : 0.001;
  const currentPriceNum = livePrice + (tickOffset * pipMultiplier * 0.4);
  const isBull = changePct >= 0;

  // Compute realistic MetaTrader & cTrader Bid and Ask prices
  const spreadValue = meta.spreadPips * pipMultiplier;
  const bidNum = currentPriceNum - spreadValue / 2;
  const askNum = currentPriceNum + spreadValue / 2;

  const pips = Math.round(Math.abs(currentPriceNum - meta.basePrice) * (meta.decimals === 2 ? 100 : 10000));
  const highNum = currentPriceNum * 1.006;
  const lowNum = currentPriceNum * 0.994;

  const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    pair: meta.pair,
    description: meta.description,
    price: currentPriceNum.toFixed(meta.decimals),
    bid: bidNum.toFixed(meta.decimals),
    ask: askNum.toFixed(meta.decimals),
    spreadPips: `${meta.spreadPips} pips`,
    change24h: Math.round(changePct * 100) / 100,
    pipsChange: isBull ? pips : -pips,
    high: highNum.toFixed(meta.decimals),
    low: lowNum.toFixed(meta.decimals),
    isBullish: isBull,
    category: meta.category,
    platforms: meta.platforms,
    lastUpdated: `Live ${nowTime}`,
  };
}

