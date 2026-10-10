export type TradeDirection = 'BUY' | 'SELL';
export type TradeOutcome = 'WIN' | 'LOSS' | 'BREAKEVEN';

export const ADMIN_EMAIL = 'oumaisaac172@gmail.com';
export const DAILY_SCAN_LIMIT = 5;

export interface ChatMessage {
  id: string;
  sender: 'user' | 'advisor';
  text: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  signalId: string;
  pair: string;
  direction: TradeDirection;
  outcome: TradeOutcome;
  entryPrice?: string;
  exitPrice?: string;
  pnlPips?: number;
  notes?: string;
  loggedAt: string;
}

export interface TradingSignal {
  id: string;
  userId: string;
  pair: string;
  direction: TradeDirection;
  timeframe: string;
  analysisType: string;
  entryPrice: string;
  stopLoss: string;
  tp1: string;
  tp2: string;
  tp3: string;
  riskReward: string;
  confidence: number;
  marketStructure: string;
  supportResistance: string;
  marketPsychology: string;
  candlestickConfirmation: string;
  vsaSignalType?: string;
  vsaExplanation?: string;
  backtestProbability?: number;
  backtestDetails?: string;
  imageUrl?: string;
  engine?: string;
  chatHistory: ChatMessage[];
  createdAt: string;
}

export interface SharedSignal {
  id: string;
  userId: string;
  authorName?: string;
  pair: string;
  direction: TradeDirection;
  timeframe: string;
  analysisType: string;
  entryPrice: string;
  stopLoss: string;
  tp1: string;
  tp2?: string;
  tp3?: string;
  riskReward: string;
  confidence: number;
  marketStructure: string;
  supportResistance: string;
  marketPsychology: string;
  candlestickConfirmation: string;
  vsaSignalType?: string;
  vsaExplanation?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface DailyUsage {
  userId: string;
  date: string;
  scanCount: number;
  lastScanAt: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  pair: string;
  category?: string;
  alertsEnabled?: boolean;
  addedAt: string;
}

import type { MarketCategory } from './data/marketData';

export interface MarketQuote {
  pair: string;
  description?: string;
  price: string;
  bid?: string;
  ask?: string;
  spreadPips?: string;
  change24h: number;
  pipsChange: number;
  high: string;
  low: string;
  isBullish: boolean;
  category: MarketCategory;
  platforms?: ('MT4' | 'MT5' | 'cTrader')[];
  lastUpdated?: string;
}

export interface SampleChartPreset {
  id: string;
  title: string;
  pair: string;
  timeframe: string;
  type: string;
  description: string;
  imageUrl: string;
  suggestedSignal: Partial<TradingSignal>;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
