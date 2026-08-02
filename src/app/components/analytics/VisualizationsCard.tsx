import { useMemo } from 'react';
import { Card } from '../ui/card';
import { DailyEntry, AppSettings } from '../../lib/database-v2';
import { getDateDaysAgo } from '../../lib/analytics';
import { Timeframe } from '../../lib/types';
import { BarChart2 } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  entries: DailyEntry[];
  settings: AppSettings;
  timeframe: Timeframe;
}

const TS = {
  backgroundColor: '#0f0f1a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '12px',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Point = { id: string; date: string; study: number; timepass: number; energy: number; target?: number };

function buildDaily(entries: DailyEntry[], target: number): Point[] {
  return Array.from({ length: 30 }, (_, i) => {
    const dateStr = getDateDaysAgo(29 - i);
    const e = entries.find((en) => en.date === dateStr);
    return {
      id: `d${i}`,
      date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      study: e?.selfStudyHours ?? 0,
      timepass: e?.timepassHours ?? 0,
      energy: e?.energyRating ?? 0,
      target,
    };
  });
}

function buildWeekly(entries: DailyEntry[]): Point[] {
  // last 84 days → up to 12 weeks
  const cutoff = getDateDaysAgo(84);
  const relevant = entries.filter((e) => e.date >= cutoff);
  const b: Record<string, { study: number; timepass: number; eSum: number; cnt: number }> = {};

  relevant.forEach((e) => {
    const d = new Date(e.date);
    const ws = new Date(d);
    ws.setDate(d.getDate() - d.getDay()); // Sunday of that week
    const k = ws.toISOString().slice(0, 10);
    if (!b[k]) b[k] = { study: 0, timepass: 0, eSum: 0, cnt: 0 };
    b[k].study += e.selfStudyHours;
    b[k].timepass += e.timepassHours;
    b[k].eSum += e.energyRating;
    b[k].cnt++;
  });

  return Object.entries(b)
    .sort(([a], [z]) => a.localeCompare(z))
    .slice(-12)
    .map(([k, v], i) => ({
      id: `wk${i}`,
      date: new Date(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      study: +v.study.toFixed(1),
      timepass: +v.timepass.toFixed(1),
      energy: v.cnt ? +(v.eSum / v.cnt).toFixed(2) : 0,
    }));
}

function buildMonthly(entries: DailyEntry[]): Point[] {
  const b: Record<string, { study: number; timepass: number; eSum: number; cnt: number }> = {};

  entries.forEach((e) => {
    const k = e.date.slice(0, 7); // YYYY-MM
    if (!b[k]) b[k] = { study: 0, timepass: 0, eSum: 0, cnt: 0 };
    b[k].study += e.selfStudyHours;
    b[k].timepass += e.timepassHours;
    b[k].eSum += e.energyRating;
    b[k].cnt++;
  });

  return Object.entries(b)
    .sort(([a], [z]) => a.localeCompare(z))
    .slice(-12)
    .map(([k, v], i) => ({
      id: `mo${i}`,
      date: new Date(k + '-02').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      study: +v.study.toFixed(1),
      timepass: +v.timepass.toFixed(1),
      energy: v.cnt ? +(v.eSum / v.cnt).toFixed(2) : 0,
    }));
}

function buildYearly(entries: DailyEntry[]): Point[] {
  const yr = new Date().getFullYear();
  const b = MONTHS.map((label, i) => ({
    id: `y${i}`, date: label, study: 0, timepass: 0, eSum: 0, cnt: 0,
  }));

  entries.forEach((e) => {
    const d = new Date(e.date);
    if (d.getFullYear() !== yr) return;
    const m = d.getMonth();
    b[m].study += e.selfStudyHours;
    b[m].timepass += e.timepassHours;
    b[m].eSum += e.energyRating;
    b[m].cnt++;
  });

  return b.map(({ id, date, study, timepass, eSum, cnt }) => ({
    id, date,
    study: +study.toFixed(1),
    timepass: +timepass.toFixed(1),
    energy: cnt ? +(eSum / cnt).toFixed(2) : 0,
  }));
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
      <BarChart2 className="w-8 h-8 text-white/15" />
      <p className="text-xs text-white/25">{label}</p>
    </div>
  );
}

export function VisualizationsCard({ entries, settings, timeframe }: Props) {
  const data = useMemo<Point[]>(() => {
    if (timeframe === 'yearly') return buildYearly(entries);
    if (timeframe === 'monthly') return buildMonthly(entries);
    if (timeframe === 'weekly') return buildWeekly(entries);
    return buildDaily(entries, settings.targetDailyHours);
  }, [entries, timeframe, settings.targetDailyHours]);

  const isAgg = timeframe !== 'daily';
  const hasStudyData = data.some((d) => d.study > 0 || d.timepass > 0);
  const hasEnergyData = data.some((d) => d.energy > 0);

  // Key forces full remount when chart type changes — prevents Recharts internal state mismatch
  const chartKey = `${timeframe}-study`;
  const energyKey = `${timeframe}-energy`;

  const xProps = {
    dataKey: 'date' as const,
    stroke: '#555',
    tick: { fontSize: 10, fill: '#888' },
    tickLine: false,
    axisLine: { stroke: '#333' },
  };
  const yProps = {
    stroke: '#555',
    tick: { fontSize: 11, fill: '#888' },
    tickLine: false,
    axisLine: { stroke: '#333' },
    width: 36,
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="space-y-8">
        <h3 className="text-xl font-bold text-white">Study Trends</h3>

        {/* ── Study vs Timepass ── */}
        <div>
          <p className="text-sm text-white/50 mb-3">Study vs Timepass Hours</p>
          <div className="h-64 w-full" style={{ touchAction: 'pan-y' }}>
            {!hasStudyData ? (
              <EmptyState label="No study data for this period" />
            ) : (
              <ResponsiveContainer key={chartKey} width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gStudy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gTimepass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis {...xProps} />
                  <YAxis {...yProps} />
                  <Tooltip contentStyle={TS} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', color: '#888', paddingTop: '8px' }}
                  />
                  {isAgg ? (
                    <>
                      <Bar dataKey="study" name="Study hrs" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={600} />
                      <Bar dataKey="timepass" name="Timepass hrs" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={600} />
                    </>
                  ) : (
                    <>
                      <Area dataKey="study" name="Study" type="monotone" stroke="#10b981" strokeWidth={2} fill="url(#gStudy)" animationDuration={600} />
                      <Area dataKey="timepass" name="Timepass" type="monotone" stroke="#ef4444" strokeWidth={2} fill="url(#gTimepass)" animationDuration={600} />
                      <Line dataKey="target" name="Target" type="monotone" stroke="#fbbf24" strokeDasharray="5 5" strokeWidth={1.5} dot={false} animationDuration={0} />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Energy Rating Trend ── */}
        <div>
          <p className="text-sm text-white/50 mb-3">Energy Rating Trend</p>
          <div className="h-44 w-full" style={{ touchAction: 'pan-y' }}>
            {!hasEnergyData ? (
              <EmptyState label="No energy data for this period" />
            ) : (
              <ResponsiveContainer key={energyKey} width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gEnergy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis {...xProps} />
                  <YAxis {...yProps} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                  <Tooltip
                    contentStyle={TS}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    formatter={(v: number) => [v.toFixed(1), 'Energy']}
                  />
                  <Area
                    dataKey="energy"
                    name="Energy"
                    type="monotone"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#gEnergy)"
                    dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#a78bfa' }}
                    animationDuration={600}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
