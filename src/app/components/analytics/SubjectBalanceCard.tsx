import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { SubjectBalance } from '../../lib/analytics';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

interface SubjectBalanceCardProps {
  balance: SubjectBalance[];
  timeframeLabel?: string;
}

const FALLBACK_COLORS = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#84cc16'];

const TS = {
  backgroundColor: '#0f0f1a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '12px',
};

export function SubjectBalanceCard({ balance, timeframeLabel = 'Last 30 days' }: SubjectBalanceCardProps) {
  if (balance.length === 0) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm flex flex-col items-center justify-center min-h-[260px] gap-3 text-center">
        <BookOpen className="w-10 h-10 text-white/20" />
        <div>
          <h3 className="text-xl font-bold text-white">Subject Balance Analysis</h3>
          <p className="text-sm text-white/30 mt-1">No subjects enabled — go to Settings to add subjects.</p>
        </div>
      </Card>
    );
  }

  const hasData = balance.some((b) => b.totalHours > 0);

  const chartData = balance.map((b, i) => ({
    name: b.subject,
    value: hasData ? b.totalHours : 1, // equal slices when no real data
    color: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white">Subject Balance Analysis</h3>
          <p className="text-sm text-white/40">
            {balance.map((b) => b.subject).join(' · ')} — {timeframeLabel}
          </p>
        </div>

        {/* Pie chart */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  hasData && percent > 0.05
                    ? `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`
                    : ''
                }
                outerRadius={90}
                innerRadius={36}
                dataKey="value"
                animationDuration={600}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TS}
                formatter={(val: number, name: string) =>
                  hasData ? [`${val.toFixed(1)}h`, name] : ['No data yet', name]
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {!hasData && (
          <p className="text-center text-sm text-white/30">Log subject hours in Daily Log to see balance.</p>
        )}

        {/* Progress bars */}
        <div className="space-y-4">
          {balance.map((b, i) => (
            <div key={b.subject} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                  />
                  <span className="font-medium text-sm text-white">{b.subject}</span>
                  {b.isNeglected && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                  {!b.isNeglected && b.totalHours > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-white">{b.totalHours.toFixed(1)}h</span>
                  <span className="text-xs text-white/40 ml-1.5">{b.percentage.toFixed(0)}%</span>
                </div>
              </div>
              <Progress value={b.percentage} className="h-1.5" />
              <p className="text-xs text-white/40">{b.recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
