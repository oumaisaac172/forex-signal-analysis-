import React from 'react';
import type { TradingSignal, JournalEntry } from '../types';
import { StrategyEffectivenessCard } from './StrategyEffectivenessCard';

interface StrategyEffectivenessDashboardProps {
  analyses?: TradingSignal[];
  journalEntries?: JournalEntry[];
}

export const StrategyEffectivenessDashboard: React.FC<StrategyEffectivenessDashboardProps> = ({
  analyses = [],
  journalEntries = [],
}) => {
  return (
    <div className="mt-8">
      <StrategyEffectivenessCard analyses={analyses} journalEntries={journalEntries} />
    </div>
  );
};

