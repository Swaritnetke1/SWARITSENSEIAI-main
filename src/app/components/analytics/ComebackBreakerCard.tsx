import { Card } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { ComebackSuggestion } from '../../lib/analytics';
import { motion } from 'motion/react';

interface ComebackBreakerCardProps {
  suggestion: ComebackSuggestion;
}

export function ComebackBreakerCard({ suggestion }: ComebackBreakerCardProps) {
  if (!suggestion.isProductivityDropping && suggestion.requiredExtraHoursToday === 0) {
    return (
      <Card className="p-6 bg-green-900/20 border-green-500/30">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <div>
            <p className="font-semibold text-green-300">Strong Momentum!</p>
            <p className="text-sm text-muted-foreground">{suggestion.harshRealityCheck}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Alert
        variant={suggestion.isProductivityDropping ? 'destructive' : 'default'}
        className={
          suggestion.isProductivityDropping
            ? 'bg-red-900/30 border-red-500'
            : 'bg-orange-900/30 border-orange-500'
        }
      >
        {suggestion.isProductivityDropping ? (
          <TrendingDown className="h-5 w-5" />
        ) : (
          <Minus className="h-5 w-5" />
        )}
        <AlertTitle className="text-lg">
          {suggestion.isProductivityDropping ? 'COMEBACK LOOP DETECTED' : 'Catch-Up Required'}
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="font-semibold">{suggestion.harshRealityCheck}</p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Wasted Last Week</p>
              <p className="font-bold text-red-400">{suggestion.wastedHoursLastWeek.toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-muted-foreground">Wasted This Week</p>
              <p className="font-bold text-red-400">{suggestion.wastedHoursThisWeek.toFixed(1)}h</p>
            </div>
          </div>

          {suggestion.requiredExtraHoursToday > 0 && (
            <div className="bg-background/50 p-3 rounded-md">
              <p className="text-sm font-semibold text-orange-300">
                Required Extra Hours Today: +{suggestion.requiredExtraHoursToday.toFixed(1)}h
              </p>
            </div>
          )}

          <div className="space-y-2 mt-3">
            <p className="text-sm font-semibold">Action Plan:</p>
            {suggestion.actionPlan.map((action, idx) => (
              <p key={idx} className="text-sm text-muted-foreground">
                {action}
              </p>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
