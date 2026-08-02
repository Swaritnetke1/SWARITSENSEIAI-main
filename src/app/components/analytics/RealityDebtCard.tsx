import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RealityDebt, EMPTY_REALITY_DEBT } from '../../lib/analytics';
import { TrendingUp, TrendingDown, Minus, Calendar, RotateCcw, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface RealityDebtCardProps {
  debt: RealityDebt;
  showRecoveryPlan?: boolean;
}

export function RealityDebtCard({ debt: initialDebt, showRecoveryPlan = false }: RealityDebtCardProps) {
  const [wasReset, setWasReset] = useState(false);

  // When parent data changes (timeframe switch), exit reset view automatically
  useEffect(() => { setWasReset(false); }, [initialDebt.totalDebtHours]);

  const debt = wasReset ? EMPTY_REALITY_DEBT : initialDebt;

  const handleReset = () => setWasReset(true);
  const handleUndo  = () => setWasReset(false);

  const hasData = debt.dailyDebts.length > 0;

  const trendIcon = {
    increasing: <TrendingUp className="w-4 h-4 text-red-400" />,
    decreasing: <TrendingDown className="w-4 h-4 text-green-400" />,
    stable: <Minus className="w-4 h-4 text-yellow-400" />,
  };

  const trendColor = {
    increasing: 'text-red-400',
    decreasing: 'text-green-400',
    stable: 'text-yellow-400',
  };

  // Chart data: use real points when available, otherwise render a flat zero baseline
  const chartData = hasData
    ? debt.dailyDebts.slice(-14).map((d, idx) => ({
        id: `debt-${idx}`,
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        debt: d.cumulative,
      }))
    : [
        { id: 'zero-0', date: 'Start', debt: 0 },
        { id: 'zero-1', date: 'Now', debt: 0 },
      ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Reality Debt Calculator</h3>
            <p className="text-sm text-muted-foreground">Your cumulative productivity gap</p>
          </div>
          <div className="flex items-center gap-2">
            {hasData && trendIcon[debt.debtTrend]}
            {hasData && (
              <Badge variant={debt.debtTrend === 'increasing' ? 'destructive' : 'secondary'}>
                {debt.debtTrend}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Debt</p>
            <p className={`text-3xl font-bold transition-colors duration-500 ${hasData && debt.totalDebtHours > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {debt.totalDebtHours.toFixed(1)}h
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Clear By</p>
            <p className="text-lg font-semibold text-blue-400">
              {debt.projectedClearDate
                ? new Date(debt.projectedClearDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 relative">
          {!hasData && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 pointer-events-none">
              <BarChart2 className="w-8 h-8 text-white/20" />
              <p className="text-sm text-white/30">
                {wasReset ? 'Data cleared — log a session to rebuild' : 'No data yet — start logging!'}
              </p>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={hasData ? '#333' : '#222'} />
              <XAxis
                dataKey="date"
                stroke="#888"
                tick={{ fontSize: 12 }}
                hide={!hasData}
              />
              <YAxis stroke="#888" tick={{ fontSize: 12 }} hide={!hasData} />
              {hasData && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(val: number) => [`${val.toFixed(1)}h`, 'Debt']}
                />
              )}
              <ReferenceLine y={0} stroke="#444" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="debt"
                stroke={hasData ? '#ef4444' : '#3f3f46'}
                strokeWidth={hasData ? 2 : 1.5}
                dot={hasData ? { fill: '#ef4444', r: 4 } : false}
                strokeDasharray={hasData ? undefined : '6 4'}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reset / Undo row */}
        <div className="flex items-center justify-between pt-1">
          {wasReset ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleUndo}
              className="text-white/40 hover:text-white/70 text-xs h-7 px-2"
            >
              Undo reset
            </Button>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={!hasData && wasReset}
            className="ml-auto border-white/10 text-white/50 hover:text-white hover:border-white/30 hover:bg-white/5 text-xs h-7 gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        </div>

        {/* Recovery plan */}
        {showRecoveryPlan && debt.recoveryPlan.length > 0 && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <h4 className="font-semibold text-white">14-Day Recovery Plan</h4>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {debt.recoveryPlan.slice(0, 7).map((plan, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-background/50 rounded-md">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {new Date(plan.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground">{plan.reason}</p>
                  </div>
                  <Badge variant="outline" className="text-orange-400 border-orange-400">
                    {plan.targetHours.toFixed(1)}h
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
