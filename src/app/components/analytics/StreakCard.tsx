import { Card } from '../ui/card';
import { Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface StreakCardProps {
  streak: number;
  minimumHours: number;
}

export function StreakCard({ streak, minimumHours }: StreakCardProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/30 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div className="relative z-10 space-y-2">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <p className="text-sm text-muted-foreground">Current Streak</p>
        </div>
        <p className="text-4xl font-bold text-orange-300">{streak} days</p>
        <p className="text-xs text-muted-foreground">Minimum: {minimumHours}h/day</p>
      </div>
    </Card>
  );
}
