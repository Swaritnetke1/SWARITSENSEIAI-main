/**
 * SwaritSensei.ai - Daily Logging Interface
 * Frictionless entry system with subject tagging and energy rating
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { db, DailyEntry, SubjectHours } from '../lib/database';
import { getTodayString } from '../lib/analytics';
import { CheckCircle2, Circle, Flame, Zap, Battery, BatteryLow, BatteryMedium } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface DailyLoggerProps {
  onEntrySubmitted?: () => void;
}

export function DailyLogger({ onEntrySubmitted }: DailyLoggerProps) {
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [studyHours, setStudyHours] = useState<number>(0);
  const [timepassHours, setTimepassHours] = useState<number>(0);
  const [goalCompleted, setGoalCompleted] = useState<boolean>(false);
  const [energyRating, setEnergyRating] = useState<number>(3);
  const [subjects, setSubjects] = useState<SubjectHours>({
    physics: 0,
    chemistry: 0,
    maths: 0,
    biology: 0,
    computerScience: 0,
  });
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTodayEntry();
  }, []);

  const loadTodayEntry = async () => {
    const today = getTodayString();
    const entry = await db.getEntryByDate(today);

    if (entry) {
      setTodayEntry(entry);
      setStudyHours(entry.studyHours);
      setTimepassHours(entry.timepassHours);
      setGoalCompleted(entry.goalCompleted);
      setEnergyRating(entry.energyRating);
      setSubjects(entry.subjects);
      setNotes(entry.notes || '');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const today = getTodayString();
      const entry: Omit<DailyEntry, 'id'> = {
        date: today,
        studyHours,
        timepassHours,
        goalCompleted,
        energyRating,
        subjects,
        notes,
        timestamp: Date.now(),
      };

      if (todayEntry) {
        await db.updateEntry({ ...entry, id: todayEntry.id });
        toast.success('Entry updated successfully!', {
          description: `${studyHours}h study logged for today`,
        });
      } else {
        await db.addEntry(entry);
        toast.success('Daily entry logged!', {
          description: `Great work! ${studyHours}h on the books.`,
        });
      }

      await loadTodayEntry();
      onEntrySubmitted?.();
    } catch (error) {
      toast.error('Failed to save entry', {
        description: 'Please try again',
      });
      console.error('Error saving entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEnergyIcon = (rating: number) => {
    if (rating >= 4) return <Zap className="w-5 h-5 text-yellow-400" />;
    if (rating >= 3) return <BatteryMedium className="w-5 h-5 text-blue-400" />;
    return <BatteryLow className="w-5 h-5 text-red-400" />;
  };

  const getEnergyLabel = (rating: number) => {
    const labels = ['Exhausted', 'Low', 'Average', 'Good', 'Excellent'];
    return labels[rating - 1] || 'Average';
  };

  const subjectLabels: { [K in keyof SubjectHours]: string } = {
    physics: 'Physics',
    chemistry: 'Chemistry',
    maths: 'Mathematics',
    biology: 'Biology',
    computerScience: 'Computer Science',
  };

  const totalSubjectHours = Object.values(subjects).reduce((sum, val) => sum + val, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Daily Log
              </h2>
              <p className="text-muted-foreground mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {todayEntry && (
              <Badge variant="secondary" className="text-sm">
                Already Logged Today
              </Badge>
            )}
          </div>

          <Separator />

          {/* Core Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-base">Study Hours</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={studyHours}
                  onChange={(e) => setStudyHours(parseFloat(e.target.value) || 0)}
                  className="text-xl font-bold bg-input-background"
                />
                <span className="text-2xl font-bold text-green-400">{studyHours}h</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Timepass Hours</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={timepassHours}
                  onChange={(e) => setTimepassHours(parseFloat(e.target.value) || 0)}
                  className="text-xl font-bold bg-input-background"
                />
                <span className="text-2xl font-bold text-red-400">{timepassHours}h</span>
              </div>
            </div>
          </div>

          {/* Energy Rating */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Energy Rating</Label>
              <div className="flex items-center gap-2">
                {getEnergyIcon(energyRating)}
                <span className="text-lg font-semibold">{getEnergyLabel(energyRating)}</span>
              </div>
            </div>
            <Slider
              value={[energyRating]}
              onValueChange={(val) => setEnergyRating(val[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>1 - Exhausted</span>
              <span>3 - Average</span>
              <span>5 - Excellent</span>
            </div>
          </div>

          <Separator />

          {/* Subject Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Subject Breakdown (Optional)</Label>
              <span className="text-sm text-muted-foreground">
                Total: {totalSubjectHours.toFixed(1)}h / {studyHours}h
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(subjectLabels).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{label}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={subjects[key as keyof SubjectHours]}
                    onChange={(e) =>
                      setSubjects({
                        ...subjects,
                        [key]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-input-background"
                  />
                </div>
              ))}
            </div>

            {totalSubjectHours > studyHours && (
              <p className="text-sm text-destructive">
                ⚠️ Subject hours exceed total study hours
              </p>
            )}
          </div>

          <Separator />

          {/* Goal Completion */}
          <div className="space-y-3">
            <Label className="text-base">Did you complete today's goal?</Label>
            <div className="flex gap-4">
              <Button
                variant={goalCompleted ? 'default' : 'outline'}
                onClick={() => setGoalCompleted(true)}
                className="flex-1"
              >
                {goalCompleted ? (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                ) : (
                  <Circle className="w-4 h-4 mr-2" />
                )}
                Yes
              </Button>
              <Button
                variant={!goalCompleted ? 'default' : 'outline'}
                onClick={() => setGoalCompleted(false)}
                className="flex-1"
              >
                {!goalCompleted ? (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                ) : (
                  <Circle className="w-4 h-4 mr-2" />
                )}
                No
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label className="text-base">Notes (Optional)</Label>
            <Input
              placeholder="What went well? What could improve?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-input-background"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || studyHours === 0}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isSubmitting ? (
              'Saving...'
            ) : todayEntry ? (
              'Update Entry'
            ) : (
              <>
                <Flame className="w-5 h-5 mr-2" />
                Log Today's Progress
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
