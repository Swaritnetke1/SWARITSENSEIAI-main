/**
 * SwaritSensei.ai - Advanced Analytics Engine
 * ML-lite algorithms for productivity insights and predictions
 */

import { DailyEntry, PeerCompetitor, AppSettings } from './database-v2';

// ============= UTILITY FUNCTIONS =============

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export function getDayOfWeek(dateString: string): number {
  return new Date(dateString).getDay(); // 0 = Sunday, 6 = Saturday
}

export function getWeekNumber(dateString: string): number {
  const date = new Date(dateString);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// ============= FEATURE 1: PREDICTIVE WEEK PLANNER =============

export interface WeekDayPattern {
  dayOfWeek: number; // 0-6
  dayName: string;
  avgStudyHours: number;
  avgEnergyRating: number;
  productivityScore: number; // energy-adjusted hours
  sampleSize: number;
  recommendation: string;
}

export function analyzePredictiveWeekPattern(entries: DailyEntry[]): WeekDayPattern[] {
  const dayPatterns: { [key: number]: { totalHours: number; totalEnergy: number; count: number } } = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Initialize all days
  for (let i = 0; i < 7; i++) {
    dayPatterns[i] = { totalHours: 0, totalEnergy: 0, count: 0 };
  }

  // Aggregate data by day of week
  entries.forEach((entry) => {
    const dayOfWeek = getDayOfWeek(entry.date);
    dayPatterns[dayOfWeek].totalHours += entry.selfStudyHours;
    dayPatterns[dayOfWeek].totalEnergy += entry.energyRating;
    dayPatterns[dayOfWeek].count += 1;
  });

  // Calculate patterns and generate recommendations
  const patterns: WeekDayPattern[] = [];
  let maxProductivity = 0;
  let maxDay = 0;

  for (let i = 0; i < 7; i++) {
    const data = dayPatterns[i];
    const avgHours = data.count > 0 ? data.totalHours / data.count : 0;
    const avgEnergy = data.count > 0 ? data.totalEnergy / data.count : 3;
    const productivityScore = avgHours * (avgEnergy / 3); // Normalized to 3 as baseline

    if (productivityScore > maxProductivity) {
      maxProductivity = productivityScore;
      maxDay = i;
    }

    patterns.push({
      dayOfWeek: i,
      dayName: dayNames[i],
      avgStudyHours: avgHours,
      avgEnergyRating: avgEnergy,
      productivityScore,
      sampleSize: data.count,
      recommendation: '',
    });
  }

  // Generate recommendations
  patterns.forEach((pattern, idx) => {
    if (pattern.sampleSize === 0) {
      pattern.recommendation = 'No data yet - track this day to build your pattern';
    } else if (idx === maxDay) {
      pattern.recommendation = `Your PEAK day! Schedule your hardest ${
        pattern.avgStudyHours > 6 ? 'problem sets' : 'concepts'
      } here`;
    } else if (pattern.productivityScore < maxProductivity * 0.5) {
      pattern.recommendation = 'Low-energy day detected. Use for revision and easier topics';
    } else if (pattern.avgEnergyRating >= 4) {
      pattern.recommendation = 'High energy available - good for challenging material';
    } else {
      pattern.recommendation = 'Average day - maintain consistent study routine';
    }
  });

  return patterns;
}

// ============= FEATURE 2: REALITY DEBT CALCULATOR =============

export interface RealityDebt {
  totalDebtHours: number;
  dailyDebts: { date: string; debtHours: number; cumulative: number }[];
  recoveryPlan: { date: string; targetHours: number; reason: string }[];
  debtTrend: 'increasing' | 'decreasing' | 'stable';
  projectedClearDate: string | null;
}

export const EMPTY_REALITY_DEBT: RealityDebt = {
  totalDebtHours: 0,
  dailyDebts: [],
  recoveryPlan: [],
  debtTrend: 'stable',
  projectedClearDate: null,
};

export function calculateRealityDebt(
  entries: DailyEntry[],
  targetDailyHours: number,
  daysToAnalyze: number = 30
): RealityDebt {
  const startDate = getDateDaysAgo(daysToAnalyze);
  const relevantEntries = entries.filter((e) => e.date >= startDate).sort((a, b) => a.date.localeCompare(b.date));

  // No entries at all → return a clean zero state so the chart shows flat/empty
  if (relevantEntries.length === 0) return EMPTY_REALITY_DEBT;

  let cumulativeDebt = 0;
  const dailyDebts: { date: string; debtHours: number; cumulative: number }[] = [];

  // Only accumulate debt for days that were actually logged — unlogged days are not penalised
  for (let i = 0; i < daysToAnalyze; i++) {
    const dateStr = getDateDaysAgo(daysToAnalyze - i - 1);
    const entry = relevantEntries.find((e) => e.date === dateStr);

    if (!entry) continue; // skip days with no log

    const debtHours = targetDailyHours - entry.selfStudyHours;
    cumulativeDebt += debtHours;

    dailyDebts.push({
      date: dateStr,
      debtHours: Math.max(0, debtHours),
      cumulative: cumulativeDebt,
    });
  }

  // Determine debt trend (last 7 days vs previous 7 days)
  const recentDebt = dailyDebts.slice(-7).reduce((sum, d) => sum + d.debtHours, 0);
  const previousDebt = dailyDebts.slice(-14, -7).reduce((sum, d) => sum + d.debtHours, 0);

  let debtTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (recentDebt > previousDebt * 1.2) debtTrend = 'increasing';
  else if (recentDebt < previousDebt * 0.8) debtTrend = 'decreasing';

  // Generate recovery plan (distribute debt over next 14 days)
  const recoveryPlan: { date: string; targetHours: number; reason: string }[] = [];
  const recoveryDays = 14;
  const extraHoursPerDay = cumulativeDebt > 0 ? cumulativeDebt / recoveryDays : 0;

  for (let i = 1; i <= recoveryDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const targetHours = targetDailyHours + extraHoursPerDay;

    let reason = '';
    if (i <= 3) reason = 'Critical recovery period - push hard';
    else if (i <= 7) reason = 'Maintain momentum - stay consistent';
    else reason = 'Final stretch - complete debt clearance';

    recoveryPlan.push({ date: dateStr, targetHours: Math.min(14, targetHours), reason });
  }

  // Project debt clear date
  let projectedClearDate: string | null = null;
  if (cumulativeDebt > 0 && extraHoursPerDay > 0) {
    const daysNeeded = Math.ceil(cumulativeDebt / extraHoursPerDay);
    const clearDate = new Date();
    clearDate.setDate(clearDate.getDate() + daysNeeded);
    projectedClearDate = clearDate.toISOString().split('T')[0];
  }

  return {
    totalDebtHours: Math.max(0, cumulativeDebt),
    dailyDebts,
    recoveryPlan,
    debtTrend,
    projectedClearDate,
  };
}

// ============= FEATURE 3: PEER PHANTOM MODE =============

export interface PhantomComparison {
  competitorName: string;
  color: string;
  yourTotalHours: number;
  theirTotalHours: number;
  hoursDifference: number;
  percentageDifference: number;
  winningDays: number;
  losingDays: number;
  message: string;
}

export function calculatePhantomComparison(
  entries: DailyEntry[],
  competitors: PeerCompetitor[],
  days: number = 30
): PhantomComparison[] {
  const startDate = getDateDaysAgo(days);
  const relevantEntries = entries.filter((e) => e.date >= startDate);

  const yourTotalHours = relevantEntries.reduce((sum, e) => sum + e.selfStudyHours, 0);

  const comparisons: PhantomComparison[] = [];

  competitors
    .filter((c) => c.enabled)
    .forEach((competitor) => {
      const theirTotalHours = competitor.dailyStudyHours * days;
      const difference = yourTotalHours - theirTotalHours;
      const percentDiff = theirTotalHours > 0 ? (difference / theirTotalHours) * 100 : 0;

      // Calculate winning/losing days
      let winningDays = 0;
      let losingDays = 0;
      relevantEntries.forEach((entry) => {
        if (entry.selfStudyHours > competitor.dailyStudyHours) winningDays++;
        else if (entry.selfStudyHours < competitor.dailyStudyHours) losingDays++;
      });

      // Generate harsh message
      let message = '';
      if (difference >= 20) {
        message = `You're CRUSHING ${competitor.name}! Keep this dominance! 💪`;
      } else if (difference >= 0) {
        message = `Slight lead over ${competitor.name}. Don't get comfortable.`;
      } else if (difference >= -10) {
        message = `${competitor.name} is catching up. You're ${Math.abs(difference).toFixed(
          1
        )}h behind. WAKE UP.`;
      } else {
        message = `BRUTAL REALITY: ${competitor.name} is ${Math.abs(difference).toFixed(
          1
        )}h ahead. You need ${Math.ceil(Math.abs(difference) / 7)}h/day extra for a week to catch up.`;
      }

      comparisons.push({
        competitorName: competitor.name,
        color: competitor.color,
        yourTotalHours,
        theirTotalHours,
        hoursDifference: difference,
        percentageDifference: percentDiff,
        winningDays,
        losingDays,
        message,
      });
    });

  return comparisons;
}

// ============= FEATURE 4: ENERGY-ADJUSTED ANALYTICS =============

export interface EnergyAdjustedMetrics {
  totalRawHours: number;
  totalQualityHours: number; // Energy-weighted hours
  efficiencyScore: number; // Quality hours / raw hours * 100
  avgEnergyRating: number;
  lowEnergyDays: number; // Days with energy < 3
  highEnergyDays: number; // Days with energy >= 4
  recommendation: string;
}

export function calculateEnergyAdjustedMetrics(entries: DailyEntry[]): EnergyAdjustedMetrics {
  if (entries.length === 0) {
    return {
      totalRawHours: 0,
      totalQualityHours: 0,
      efficiencyScore: 0,
      avgEnergyRating: 0,
      lowEnergyDays: 0,
      highEnergyDays: 0,
      recommendation: 'No data available - start logging!',
    };
  }

  let totalRawHours = 0;
  let totalQualityHours = 0;
  let totalEnergy = 0;
  let lowEnergyDays = 0;
  let highEnergyDays = 0;

  entries.forEach((entry) => {
    totalRawHours += entry.selfStudyHours;
    // Energy weighting: 1 = 0.4x, 2 = 0.7x, 3 = 1.0x, 4 = 1.3x, 5 = 1.6x
    const energyMultiplier = 0.4 + (entry.energyRating - 1) * 0.3;
    totalQualityHours += entry.selfStudyHours * energyMultiplier;
    totalEnergy += entry.energyRating;

    if (entry.energyRating < 3) lowEnergyDays++;
    if (entry.energyRating >= 4) highEnergyDays++;
  });

  const avgEnergy = totalEnergy / entries.length;
  const efficiencyScore = totalRawHours > 0 ? (totalQualityHours / totalRawHours) * 100 : 0;

  // Generate recommendation
  let recommendation = '';
  if (efficiencyScore >= 130) {
    recommendation = 'ELITE performance! Your focus quality is exceptional. Maintain this energy management.';
  } else if (efficiencyScore >= 100) {
    recommendation = 'Good energy management. Consider optimizing study timing for higher energy periods.';
  } else if (efficiencyScore >= 80) {
    recommendation = `Low efficiency detected. You have ${lowEnergyDays} low-energy days - improve sleep/nutrition.`;
  } else {
    recommendation = `CRITICAL: Your study quality is poor (${efficiencyScore.toFixed(
      0
    )}% efficiency). Focus on energy first, hours second.`;
  }

  return {
    totalRawHours,
    totalQualityHours,
    efficiencyScore,
    avgEnergyRating: avgEnergy,
    lowEnergyDays,
    highEnergyDays,
    recommendation,
  };
}

// ============= BURNOUT DETECTOR =============

export interface BurnoutAnalysis {
  isBurnoutRisk: boolean;
  consecutiveHighDays: number;
  daysWithoutBreak: number;
  recommendation: string;
  severity: 'none' | 'low' | 'medium' | 'high';
}

export function detectBurnout(entries: DailyEntry[], burnoutThreshold: number): BurnoutAnalysis {
  const recentEntries = entries
    .filter((e) => e.date >= getDateDaysAgo(14))
    .sort((a, b) => a.date.localeCompare(b.date));

  let consecutiveHighDays = 0;
  let maxConsecutive = 0;
  let daysWithoutBreak = 0;

  recentEntries.forEach((entry) => {
    if (entry.selfStudyHours >= burnoutThreshold) {
      consecutiveHighDays++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveHighDays);
    } else if (entry.selfStudyHours < 4) {
      consecutiveHighDays = 0; // Reset on rest day
    }

    if (entry.selfStudyHours >= 6) {
      daysWithoutBreak++;
    } else {
      daysWithoutBreak = 0;
    }
  });

  let severity: 'none' | 'low' | 'medium' | 'high' = 'none';
  let recommendation = '';
  let isBurnoutRisk = false;

  if (maxConsecutive >= 7 || daysWithoutBreak >= 10) {
    severity = 'high';
    isBurnoutRisk = true;
    recommendation = `🚨 HIGH BURNOUT RISK: ${maxConsecutive} consecutive intense days. MANDATORY rest day recommended TODAY. Your brain needs recovery for long-term retention.`;
  } else if (maxConsecutive >= 5 || daysWithoutBreak >= 7) {
    severity = 'medium';
    isBurnoutRisk = true;
    recommendation = `⚠️ Burnout warning: ${daysWithoutBreak} days without proper break. Schedule a light study day (4-5h) within next 2 days.`;
  } else if (maxConsecutive >= 3) {
    severity = 'low';
    recommendation = `Moderate intensity detected. Monitor your energy levels and take a break if needed.`;
  } else {
    recommendation = `Good balance maintained. Your current pace is sustainable.`;
  }

  return {
    isBurnoutRisk,
    consecutiveHighDays: maxConsecutive,
    daysWithoutBreak,
    recommendation,
    severity,
  };
}

// ============= COMEBACK LOOP BREAKER =============

export interface ComebackSuggestion {
  isProductivityDropping: boolean;
  wastedHoursLastWeek: number;
  wastedHoursThisWeek: number;
  requiredExtraHoursToday: number;
  harshRealityCheck: string;
  actionPlan: string[];
}

export function generateComebackSuggestion(
  entries: DailyEntry[],
  targetDailyHours: number
): ComebackSuggestion {
  const lastWeekEntries = entries.filter(
    (e) => e.date >= getDateDaysAgo(14) && e.date < getDateDaysAgo(7)
  );
  const thisWeekEntries = entries.filter((e) => e.date >= getDateDaysAgo(7));

  const lastWeekWasted = lastWeekEntries.reduce((sum, e) => sum + e.timepassHours, 0);
  const thisWeekWasted = thisWeekEntries.reduce((sum, e) => sum + e.timepassHours, 0);

  const thisWeekStudy = thisWeekEntries.reduce((sum, e) => sum + e.selfStudyHours, 0);
  const thisWeekTarget = thisWeekEntries.length * targetDailyHours;
  const deficit = thisWeekTarget - thisWeekStudy;

  const isDropping = thisWeekWasted > lastWeekWasted * 1.2 || deficit > targetDailyHours * 2;

  let harshRealityCheck = '';
  let requiredExtraHoursToday = 0;

  if (isDropping) {
    harshRealityCheck = `REALITY CHECK: You wasted ${thisWeekWasted.toFixed(
      1
    )}h this week (vs ${lastWeekWasted.toFixed(
      1
    )}h last week). You're ${deficit.toFixed(
      1
    )}h behind target. The "restart cycle" is happening RIGHT NOW. Break it TODAY.`;
    requiredExtraHoursToday = Math.min(deficit / 3, 4); // Distribute over 3 days, max 4h extra
  } else if (deficit > 0) {
    harshRealityCheck = `You're ${deficit.toFixed(
      1
    )}h behind this week's target. Not critical yet, but don't let it compound.`;
    requiredExtraHoursToday = Math.min(deficit / 5, 2);
  } else {
    harshRealityCheck = `Solid week so far! Keep the momentum. You're ${Math.abs(deficit).toFixed(
      1
    )}h ahead of target.`;
  }

  const actionPlan: string[] = [];
  if (isDropping) {
    actionPlan.push(`1. IMMEDIATE: Put phone in another room for next ${Math.ceil(requiredExtraHoursToday)} hours`);
    actionPlan.push('2. Study the HARDEST subject first (usually Maths/Physics) to build momentum');
    actionPlan.push('3. Use Pomodoro: 45min deep work, 10min break, repeat');
    actionPlan.push('4. Track today\'s energy rating honestly - if it\'s low, fix sleep TONIGHT');
  } else if (deficit > 0) {
    actionPlan.push('1. Add 1-2 focused hours today to catch up');
    actionPlan.push('2. Review which subject is lagging and prioritize it');
  } else {
    actionPlan.push('1. Maintain current pace - consistency beats intensity');
    actionPlan.push('2. Consider tackling a challenging topic while momentum is high');
  }

  return {
    isProductivityDropping: isDropping,
    wastedHoursLastWeek: lastWeekWasted,
    wastedHoursThisWeek: thisWeekWasted,
    requiredExtraHoursToday,
    harshRealityCheck,
    actionPlan,
  };
}

// ============= STREAK CALCULATOR =============

export function calculateStreak(entries: DailyEntry[], minimumHours: number): number {
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date)); // Newest first

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    // Max 1 year streak
    const dateStr = currentDate.toISOString().split('T')[0];
    const entry = sortedEntries.find((e) => e.date === dateStr);

    if (entry && entry.selfStudyHours >= minimumHours) {
      streak++;
    } else if (dateStr !== getTodayString()) {
      // Don't break streak if today hasn't been logged yet
      break;
    }

    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

// ============= SUBJECT BALANCE ANALYSIS =============

export interface SubjectBalance {
  subject: string;
  totalHours: number;
  percentage: number;
  isNeglected: boolean;
  recommendation: string;
}

// enabledSubjects: array of { id, name, color } — pass settings.subjects.filter(s => s.enabled)
export function analyzeSubjectBalance(
  entries: DailyEntry[],
  enabledSubjects: { id: string; name: string; color: string }[] = []
): SubjectBalance[] {
  if (enabledSubjects.length === 0) return [];

  // Accumulate hours per subject id
  const totals: Record<string, number> = {};
  enabledSubjects.forEach((s) => { totals[s.id] = 0; });

  entries.forEach((entry) => {
    enabledSubjects.forEach((s) => {
      totals[s.id] = (totals[s.id] ?? 0) + (entry.subjects[s.id] ?? 0);
    });
  });

  const grandTotal = Object.values(totals).reduce((sum, v) => sum + v, 0);
  const neglectThreshold = 100 / enabledSubjects.length / 2; // half of equal share

  return enabledSubjects
    .map((s) => {
      const hours = totals[s.id] ?? 0;
      const percentage = grandTotal > 0 ? (hours / grandTotal) * 100 : 0;
      const isNeglected = percentage < neglectThreshold && grandTotal > 10;

      let recommendation = '';
      if (isNeglected) {
        recommendation = `⚠️ Neglected — only ${percentage.toFixed(1)}% of total. Needs immediate attention!`;
      } else if (percentage > (100 / enabledSubjects.length) * 1.5) {
        recommendation = `✓ Strong focus (${percentage.toFixed(1)}%). Don't let other subjects fall behind.`;
      } else {
        recommendation = `Balanced allocation (${percentage.toFixed(1)}%). Keep it up!`;
      }

      return { subject: s.name, totalHours: hours, percentage, isNeglected, recommendation };
    })
    .sort((a, b) => b.totalHours - a.totalHours);
}
