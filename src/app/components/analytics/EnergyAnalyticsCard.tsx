import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { EnergyAdjustedMetrics } from '../../lib/analytics';
import { Zap, Battery, BarChart2 } from 'lucide-react';

interface EnergyAnalyticsCardProps {
  metrics: EnergyAdjustedMetrics;
  timeframeLabel?: string;
}

export function EnergyAnalyticsCard({ metrics, timeframeLabel = 'Last 30 days' }: EnergyAnalyticsCardProps) {
  const getEfficiencyColor = (score: number) => {
    if (score >= 130) return 'text-green-400';
    if (score >= 100) return 'text-blue-400';
    if (score >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEfficiencyLabel = (score: number) => {
    if (score >= 130) return 'Elite';
    if (score >= 100) return 'Good';
    if (score >= 80) return 'Average';
    return 'Poor';
  };

  const isEmpty = metrics.totalRawHours === 0;

  if (isEmpty) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm flex flex-col items-center justify-center min-h-[260px] gap-3 text-center">
        <BarChart2 className="w-10 h-10 text-white/20" />
        <div>
          <h3 className="text-xl font-bold text-white">Energy-Adjusted Analytics</h3>
          <p className="text-sm text-white/30 mt-1">No data for {timeframeLabel.toLowerCase()} — start logging!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Energy-Adjusted Analytics</h3>
            <p className="text-sm text-white/40">Quality over quantity · {timeframeLabel}</p>
          </div>
          <Zap className="w-6 h-6 text-yellow-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Raw Hours</p>
            <p className="text-2xl font-bold">{metrics.totalRawHours.toFixed(1)}h</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Quality Hours</p>
            <p className="text-2xl font-bold text-purple-400">
              {metrics.totalQualityHours.toFixed(1)}h
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Efficiency Score</p>
            <div className="flex items-center gap-2">
              <Badge className={getEfficiencyColor(metrics.efficiencyScore)}>
                {getEfficiencyLabel(metrics.efficiencyScore)}
              </Badge>
              <span className={`text-xl font-bold ${getEfficiencyColor(metrics.efficiencyScore)}`}>
                {metrics.efficiencyScore.toFixed(0)}%
              </span>
            </div>
          </div>
          <Progress value={Math.min(metrics.efficiencyScore, 160)} className="h-3" />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-3 bg-background/50 rounded-md">
            <p className="text-xs text-muted-foreground">Avg Energy</p>
            <p className="text-lg font-bold text-blue-400">
              {metrics.avgEnergyRating.toFixed(1)}/5
            </p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-md">
            <p className="text-xs text-muted-foreground">Low Days</p>
            <p className="text-lg font-bold text-red-400">{metrics.lowEnergyDays}</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-md">
            <p className="text-xs text-muted-foreground">High Days</p>
            <p className="text-lg font-bold text-green-400">{metrics.highEnergyDays}</p>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-md p-4 mt-4">
          <div className="flex items-start gap-2">
            <Battery className="w-4 h-4 text-blue-400 mt-0.5" />
            <p className="text-sm text-blue-200">{metrics.recommendation}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
