/**
 * SwaritSensei.ai - Initial Setup/Onboarding Screen
 * First-time user configuration
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { dbV2, Subject, AppSettings } from '../lib/database-v2';
import { Brain, Plus, X, Target, Clock, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface OnboardingProps {
  onComplete: () => void;
}

const DEFAULT_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a855f7',
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 'physics', name: 'Physics', color: '#8b5cf6', order: 0, enabled: true },
    { id: 'chemistry', name: 'Chemistry', color: '#3b82f6', order: 1, enabled: true },
    { id: 'maths', name: 'Mathematics', color: '#10b981', order: 2, enabled: true },
  ]);
  const [targetHours, setTargetHours] = useState(8);
  const [minimumHours, setMinimumHours] = useState(4);
  const [newSubjectName, setNewSubjectName] = useState('');

  const addSubject = () => {
    if (!newSubjectName.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    const newSubject: Subject = {
      id: `subject-${Date.now()}`,
      name: newSubjectName.trim(),
      color: DEFAULT_COLORS[subjects.length % DEFAULT_COLORS.length],
      order: subjects.length,
      enabled: true,
    };

    setSubjects([...subjects, newSubject]);
    setNewSubjectName('');
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const handleComplete = async () => {
    if (subjects.length === 0) {
      toast.error('Please add at least one subject');
      return;
    }

    try {
      const settings = await dbV2.getSettings();
      const updatedSettings: AppSettings = {
        ...settings,
        isOnboardingComplete: true,
        subjects,
        targetDailyHours: targetHours,
        minimumDailyHours: minimumHours,
      };

      await dbV2.updateSettings(updatedSettings);
      toast.success('Setup complete! Welcome to SwaritSensei.ai 🎉');
      onComplete();
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto"
              >
                <Brain className="w-full h-full text-purple-400" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Welcome to SwaritSensei.ai
              </h1>
              <p className="text-muted-foreground">
                Let's set up your personalized productivity dashboard
              </p>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-center gap-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-gray-600'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-gray-600'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-purple-500' : 'bg-gray-600'}`} />
            </div>

            {/* Step 1: Subjects */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Your Subjects</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add the subjects you're currently studying
                  </p>
                </div>

                <div className="space-y-3">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 bg-background/50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="font-semibold">{subject.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubject(subject.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add a subject (e.g., Biology, English)"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                  />
                  <Button onClick={addSubject} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Button onClick={() => setStep(2)} className="w-full" disabled={subjects.length === 0}>
                  Next
                </Button>
              </motion.div>
            )}

            {/* Step 2: Daily Goals */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Daily Study Goals</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set your target and minimum study hours
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Target Daily Hours
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="1"
                        max="16"
                        value={targetHours}
                        onChange={(e) => setTargetHours(parseInt(e.target.value) || 8)}
                        className="text-xl font-bold"
                      />
                      <span className="text-2xl font-bold text-green-400">{targetHours}h</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your ideal daily study goal
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Minimum Daily Hours (for streak)
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="1"
                        max={targetHours}
                        value={minimumHours}
                        onChange={(e) => setMinimumHours(Math.min(parseInt(e.target.value) || 4, targetHours))}
                        className="text-xl font-bold"
                      />
                      <span className="text-2xl font-bold text-orange-400">{minimumHours}h</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum hours to maintain your streak
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Next
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Ready */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Zap className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                  <h2 className="text-2xl font-bold">You're All Set!</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ready to break the motivation-restart-demotivation loop
                  </p>
                </div>

                <div className="space-y-3 p-4 bg-background/50 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subjects</span>
                    <span className="font-bold">{subjects.length} configured</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Daily Target</span>
                    <span className="font-bold text-green-400">{targetHours} hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Minimum for Streak</span>
                    <span className="font-bold text-orange-400">{minimumHours} hours</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleComplete}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Start Tracking!
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
