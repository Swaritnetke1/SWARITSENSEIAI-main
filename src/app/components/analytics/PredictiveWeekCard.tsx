import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { WeekDayPattern } from '../../lib/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Brain, Star } from 'lucide-react';

interface PredictiveWeekCardProps {
  pattern: WeekDayPattern[];
}

export function PredictiveWeekCard({ pattern }: PredictiveWeekCardProps) {
  const maxProductivity = Math.max(...pattern.map((p) => p.productivityScore));

  const chartData = pattern.map((p) => ({
    id: `day-${p.dayOfWeek}`,
    day: p.dayName.slice(0, 3),
    score: p.productivityScore,
    isPeak: p.productivityScore === maxProductivity,
  }));

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Predictive Week Planner</h3>
            <p className="text-sm text-muted-foreground">ML-lite pattern analysis</p>
          </div>
          <Brain className="w-6 h-6 text-purple-400" />
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#888" tick={{ fontSize: 12 }} />
              <YAxis stroke="#888" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value.toFixed(1)} score`, 'Productivity']}
              />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isPeak ? '#a855f7' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {pattern.map((p) => {
            const isPeak = p.productivityScore === maxProductivity;
            return (
              <div
                key={p.dayOfWeek}
                className={`p-3 rounded-md border ${
                  isPeak
                    ? 'bg-purple-900/30 border-purple-500/50'
                    : 'bg-background/30 border-border/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{p.dayName}</p>
                      {isPeak && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                      {p.sampleSize === 0 && (
                        <Badge variant="outline" className="text-xs">
                          No Data
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{p.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-purple-400">
                      {p.avgStudyHours.toFixed(1)}h
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Energy: {p.avgEnergyRating.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
