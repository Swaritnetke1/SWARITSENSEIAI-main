/**
 * SwaritSensei.ai - Enhanced Daily Logger V2
 * Now with tuition hours, sleep hours, quick-log buttons, and dynamic subjects
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { HrMinInput, fmtTime } from './ui/HrMinInput';
import { dbV2, DailyEntry, AppSettings } from '../lib/database-v2';
import { getTodayString } from '../lib/analytics';
import { CheckCircle2, Circle, Flame, Zap, BatteryLow, BatteryMedium, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface DailyLoggerV2Props {
  onEntrySubmitted?: () => void;
}

export function DailyLoggerV2({ onEntrySubmitted }: DailyLoggerV2Props) {
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selfStudyHours, setSelfStudyHours] = useState<number>(0);
  const [tuitionHours, setTuitionHours] = useState<number>(0);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [timepassHours, setTimepassHours] = useState<number>(0);
  const [goalCompleted, setGoalCompleted] = useState<boolean>(false);
  const [energyRating, setEnergyRating] = useState<number>(3);
  const [subjects, setSubjects] = useState<{ [subjectId: string]: number }>({});
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    const appSettings = await dbV2.getSettings();
    setSettings(appSettings);

    const today = getTodayString();
    const entry = await dbV2.getEntryByDate(today);

    if (entry) {
      setTodayEntry(entry);
      setSelfStudyHours(entry.selfStudyHours);
      setTuitionHours(entry.tuitionHours);
      setSleepHours(entry.sleepHours);
      setTimepassHours(entry.timepassHours);
      setGoalCompleted(entry.goalCompleted);
      setEnergyRating(entry.energyRating);
      setSubjects(entry.subjects);
      setNotes(entry.notes || '');
    } else {
      // Initialize empty subjects
      const initialSubjects: { [key: string]: number } = {};
      appSettings.subjects.forEach((s) => {
        initialSubjects[s.id] = 0;
      });
      setSubjects(initialSubjects);
    }
  };

  const handleSubmit = async () => {
    if (!settings) return;
    setIsSubmitting(true);

    try {
      const today = getTodayString();
      const entry: Omit<DailyEntry, 'id'> = {
        date: today,
        selfStudyHours,
        tuitionHours,
        sleepHours,
        timepassHours,
        goalCompleted,
        energyRating,
        subjects,
        notes,
        timestamp: Date.now(),
      };

      if (todayEntry) {
        await dbV2.updateEntry({ ...entry, id: todayEntry.id });
        toast.success('Entry updated!', {
          description: `${fmtTime(selfStudyHours)} self-study + ${fmtTime(tuitionHours)} tuition`,
        });
      } else {
        await dbV2.addEntry(entry);
        toast.success('Logged!', {
          description: `Total study: ${fmtTime(selfStudyHours + tuitionHours)}`,
        });
      }

      await loadData();
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

  const quickLogSubject = (subjectId: string, hours: number) => {
    setSubjects({
      ...subjects,
      [subjectId]: (subjects[subjectId] || 0) + hours,
    });
    setSelfStudyHours(selfStudyHours + hours);
    toast.success(`+${fmtTime(hours)} added!`);
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

  const totalStudyHours = selfStudyHours + tuitionHours;
  const totalSubjectHours = Object.values(subjects).reduce((sum, val) => sum + val, 0);
  const enabledSubjects = settings?.subjects.filter((s) => s.enabled) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="p-6 md:p-8 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="space-y-6 md:space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Daily Log
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {todayEntry && (
              <Badge variant="secondary" className="text-sm w-fit">
                Already Logged Today
              </Badge>
            )}
          </div>

          <Separator />

          {/* Study Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-white/70">Self-Study</Label>
              <HrMinInput value={selfStudyHours} onChange={setSelfStudyHours} accentColor="text-green-400" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-white/70">Tuition / Coaching</Label>
              <HrMinInput value={tuitionHours} onChange={setTuitionHours} accentColor="text-blue-400" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-white/70">Sleep</Label>
              <HrMinInput value={sleepHours} onChange={setSleepHours} accentColor="text-purple-400" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-white/70">Timepass</Label>
              <HrMinInput value={timepassHours} onChange={setTimepassHours} accentColor="text-red-400" />
            </div>
          </div>

          {/* Total auto-summary */}
          <div className="flex items-center justify-between px-1 py-2 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
            <span className="text-sm text-white/50 pl-2">Total Study (auto)</span>
            <span className="text-xl font-bold text-cyan-400 pr-3">{fmtTime(totalStudyHours)}</span>
          </div>

          <Separator />

          {/* Energy Rating */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Energy Rating</Label>
              <div className="flex items-center gap-2">
                {getEnergyIcon(energyRating)}
                <span className="text-base md:text-lg font-semibold">{getEnergyLabel(energyRating)}</span>
              </div>
            </div>
            <div style={{ touchAction: 'pan-y' }}>
              <Slider
                value={[energyRating]}
                onValueChange={(val) => setEnergyRating(val[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>1 - Exhausted</span>
              <span>3 - Average</span>
              <span>5 - Excellent</span>
            </div>
          </div>

          <Separator />

          {/* Subject Breakdown with Quick-Log */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Subject Breakdown (Optional)</Label>
              <span className="text-sm text-white/40">
                {fmtTime(totalSubjectHours)} / {fmtTime(selfStudyHours)}
              </span>
            </div>

            {/* Quick-Log Buttons */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-white/40 mb-2 font-medium">Quick add:</p>
              <div className="flex flex-wrap gap-2">
                {enabledSubjects.map((subject) => (
                  <div key={subject.id} className="flex gap-1">
                    <button
                      onClick={() => quickLogSubject(subject.id, 0.5)}
                      className="text-xs px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                      style={{ borderColor: subject.color + '44' }}
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ backgroundColor: subject.color }} />
                      +30m
                    </button>
                    <button
                      onClick={() => quickLogSubject(subject.id, 1)}
                      className="text-xs px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                      style={{ borderColor: subject.color + '44' }}
                    >
                      {subject.name.slice(0, 3)} +1h
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Input with Hr/Min pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enabledSubjects.map((subject) => (
                <div key={subject.id} className="space-y-1.5">
                  <Label className="text-sm text-white/60 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                    {subject.name}
                  </Label>
                  <HrMinInput
                    value={subjects[subject.id] || 0}
                    onChange={(v) => setSubjects({ ...subjects, [subject.id]: v })}
                    accentColor="text-white/70"
                  />
                </div>
              ))}
            </div>

            {totalSubjectHours > selfStudyHours + 0.01 && (
              <p className="text-sm text-amber-400">
                ⚠️ Subject hours ({fmtTime(totalSubjectHours)}) exceed self-study ({fmtTime(selfStudyHours)})
              </p>
            )}
          </div>

          <Separator />

          {/* Goal Completion */}
          <div className="space-y-3">
            <Label className="text-base">Did you complete today's goal?</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={goalCompleted ? 'default' : 'outline'}
                onClick={() => setGoalCompleted(true)}
                className="h-12 hover:bg-white/5"
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
                className="h-12 hover:bg-white/5"
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
              className="bg-slate-900/60 border-white/10 text-white"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (selfStudyHours === 0 && tuitionHours === 0)}
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
