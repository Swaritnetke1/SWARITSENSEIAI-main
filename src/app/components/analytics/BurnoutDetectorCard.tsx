import { Card } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Shield } from 'lucide-react';
import { BurnoutAnalysis } from '../../lib/analytics';
import { motion } from 'motion/react';

interface BurnoutDetectorCardProps {
  analysis: BurnoutAnalysis;
}

export function BurnoutDetectorCard({ analysis }: BurnoutDetectorCardProps) {
  if (analysis.severity === 'none') {
    return (
      <Card className="p-6 bg-green-900/20 border-green-500/30">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-400" />
          <div>
            <p className="font-semibold text-green-300">No Burnout Risk Detected</p>
            <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
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
        variant={analysis.severity === 'high' ? 'destructive' : 'default'}
        className={
          analysis.severity === 'high'
            ? 'bg-red-900/30 border-red-500'
            : 'bg-yellow-900/30 border-yellow-500'
        }
      >
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-lg">
          {analysis.severity === 'high' && 'HIGH BURNOUT RISK'}
          {analysis.severity === 'medium' && 'Burnout Warning'}
          {analysis.severity === 'low' && 'Moderate Intensity'}
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>{analysis.recommendation}</p>
          <div className="flex gap-4 text-sm mt-3">
            <span>
              Consecutive High Days: <strong>{analysis.consecutiveHighDays}</strong>
            </span>
            <span>
              Days Without Break: <strong>{analysis.daysWithoutBreak}</strong>
            </span>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
