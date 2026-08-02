import { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { dbV2 as db, DailyEntry, AppSettings, PeerCompetitor } from '../lib/database-v2';
import {
  calculateRealityDebt,
  calculatePhantomComparison,
  calculateEnergyAdjustedMetrics,
  analyzePredictiveWeekPattern,
  detectBurnout,
  generateComebackSuggestion,
  calculateStreak,
  analyzeSubjectBalance,
  getDateDaysAgo,
} from '../lib/analytics';
import { RealityDebtCard } from './analytics/RealityDebtCard';
import { PhantomModeCard } from './analytics/PhantomModeCard';
import { EnergyAnalyticsCard } from './analytics/EnergyAnalyticsCard';
import { PredictiveWeekCard } from './analytics/PredictiveWeekCard';
import { BurnoutDetectorCard } from './analytics/BurnoutDetectorCard';
import { ComebackBreakerCard } from './analytics/ComebackBreakerCard';
import { StreakCard } from './analytics/StreakCard';
import { SubjectBalanceCard } from './analytics/SubjectBalanceCard';
import { VisualizationsCard } from './analytics/VisualizationsCard';
import { motion } from 'motion/react';
import { Timeframe } from '../lib/types';

export type { Timeframe };
type Tab = 'overview' | 'advanced' | 'subjects';

const TABS: Tab[] = ['overview', 'advanced', 'subjects'];
const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const TF_DAYS: Record<Timeframe, number> = { daily: 30, weekly: 84, monthly: 365, yearly: 3650 };
const TF_LABEL: Record<Timeframe, string> = {
  daily: 'Last 30 days', weekly: 'Last 12 weeks',
  monthly: 'Last 12 months', yearly: 'All time',
};

function entriesForTimeframe(entries: DailyEntry[], tf: Timeframe): DailyEntry[] {
  return entries.filter((e) => e.date >= getDateDaysAgo(TF_DAYS[tf]));
}

export function Dashboard() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [competitors, setCompetitors] = useState<PeerCompetitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allEntries, appSettings, allCompetitors] = await Promise.all([
        db.getAllEntries(),
        db.getSettings(),
        db.getAllCompetitors(),
      ]);
      setEntries(allEntries);
      setSettings(appSettings);
      setCompetitors(allCompetitors);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const windowedEntries = useMemo(() => entriesForTimeframe(entries, timeframe), [entries, timeframe]);

  const analytics = useMemo(() => {
    if (!settings) return null;
    return {
      realityDebt: calculateRealityDebt(entries, settings.targetDailyHours, TF_DAYS[timeframe]),
      phantomComparisons: calculatePhantomComparison(entries, competitors, 30),
      energyMetrics: calculateEnergyAdjustedMetrics(windowedEntries),
      weekPattern: analyzePredictiveWeekPattern(entries),
      burnoutAnalysis: detectBurnout(entries, settings.burnoutThreshold),
      comebackSuggestion: generateComebackSuggestion(entries, settings.targetDailyHours),
      currentStreak: calculateStreak(entries, settings.minimumDailyHours),
      subjectBalance: analyzeSubjectBalance(
        windowedEntries,
        settings.subjects.filter((s) => s.enabled)
      ),
    };
  }, [entries, settings, competitors, windowedEntries]);

  if (isLoading || !settings || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/40 text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  const { realityDebt, phantomComparisons, energyMetrics, weekPattern,
          burnoutAnalysis, comebackSuggestion, currentStreak, subjectBalance } = analytics;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-7xl mx-auto space-y-6 pb-8"
    >
      {/* Timeframe filter — global */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white/80 hidden md:block">Analytics</h2>
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl ml-auto">
          {TIMEFRAMES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeframe(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === value
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StreakCard streak={currentStreak} minimumHours={settings.minimumDailyHours} />

        <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <div className="space-y-2">
            <p className="text-sm text-white/50">Quality Hours <span className="text-white/25">({TF_LABEL[timeframe]})</span></p>
            <p className="text-4xl font-bold text-purple-300">
              {energyMetrics.totalQualityHours.toFixed(1)}h
            </p>
            <p className="text-xs text-white/40">Efficiency: {energyMetrics.efficiencyScore.toFixed(0)}%</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <div className="space-y-2">
            <p className="text-sm text-white/50">Reality Debt <span className="text-white/25">({TF_LABEL[timeframe]})</span></p>
            <p className="text-4xl font-bold text-blue-300">{realityDebt.totalDebtHours.toFixed(1)}h</p>
            <p className="text-xs text-white/40">
              {realityDebt.debtTrend === 'increasing' ? '📈 Increasing'
                : realityDebt.debtTrend === 'decreasing' ? '📉 Decreasing'
                : '➡️ Stable'}
            </p>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        <BurnoutDetectorCard analysis={burnoutAnalysis} />
        <ComebackBreakerCard suggestion={comebackSuggestion} />
      </div>

      {/* Sub-tabs */}
      <div className="w-full space-y-6">
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              <VisualizationsCard entries={entries} settings={settings} timeframe={timeframe} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EnergyAnalyticsCard metrics={energyMetrics} timeframeLabel={TF_LABEL[timeframe]} />
                <RealityDebtCard debt={realityDebt} />
              </div>
            </>
          )}
          {activeTab === 'advanced' && (
            <>
              <PredictiveWeekCard pattern={weekPattern} />
              <RealityDebtCard debt={realityDebt} showRecoveryPlan />
            </>
          )}
          {activeTab === 'subjects' && (
            <SubjectBalanceCard balance={subjectBalance} timeframeLabel={TF_LABEL[timeframe]} />
          )}
        </div>
      </div>

      {/* Peer Phantom Mode — very bottom */}
      <PhantomModeCard comparisons={phantomComparisons} onRefresh={loadData} />
    </motion.div>
  );
}
