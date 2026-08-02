import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { HrMinInput } from './ui/HrMinInput';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { dbV2, Subject, AppSettings } from '../lib/database-v2';
import {
  Settings as SettingsIcon,
  Plus,
  X,
  Save,
  Trash2,
  Edit,
  AlertTriangle,
  RotateCcw,
  Target,
  Zap,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const AVAILABLE_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a855f7',
  '#6366f1', '#14b8a6', '#f43f5e', '#0ea5e9', '#e11d48',
];

type ResetStep = 'idle' | 'confirm1' | 'confirm2';

export function Settings({ isOpen, onClose, onUpdate }: SettingsProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [resetStep, setResetStep] = useState<ResetStep>('idle');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      setResetStep('idle');
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const appSettings = await dbV2.getSettings();
    setSettings(appSettings);
    setSubjects([...appSettings.subjects]);
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      await dbV2.updateSettings({ ...settings, subjects });
      toast.success('Settings saved!');
      onUpdate();
      onClose();
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const addSubject = () => {
    if (!newSubjectName.trim()) {
      toast.error('Enter a subject name');
      return;
    }
    setSubjects([
      ...subjects,
      {
        id: `subject-${Date.now()}`,
        name: newSubjectName.trim(),
        color: AVAILABLE_COLORS[subjects.length % AVAILABLE_COLORS.length],
        order: subjects.length,
        enabled: true,
      },
    ]);
    setNewSubjectName('');
  };

  const removeSubject = (id: string) => setSubjects(subjects.filter((s) => s.id !== id));

  const saveEditSubject = () => {
    if (!editingSubject || !editName.trim()) return;
    setSubjects(subjects.map((s) => (s.id === editingSubject ? { ...s, name: editName.trim() } : s)));
    setEditingSubject(null);
    setEditName('');
  };

  const toggleSubject = (id: string) =>
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));

  const changeSubjectColor = (id: string, color: string) =>
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, color } : s)));

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await dbV2.resetAllData();
      toast.success('All data has been reset.');
      setResetStep('idle');
      onUpdate();
      onClose();
    } catch {
      toast.error('Reset failed. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  if (!settings) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-2xl max-h-[88vh] flex flex-col p-0 gap-0 bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10 bg-gradient-to-r from-purple-900/40 to-pink-900/20 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">Settings</DialogTitle>
              <p className="text-xs text-white/50 mt-0.5">Customize your study environment</p>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 min-h-0">

            {/* Daily Goals */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Daily Goals</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Target Daily Hours</Label>
                  <HrMinInput
                    value={settings.targetDailyHours}
                    onChange={(v) => setSettings({ ...settings, targetDailyHours: v })}
                    maxHours={30}
                    accentColor="text-purple-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Minimum Hours (Streak)</Label>
                  <HrMinInput
                    value={settings.minimumDailyHours}
                    onChange={(v) => setSettings({
                      ...settings,
                      minimumDailyHours: Math.min(v, settings.targetDailyHours),
                    })}
                    maxHours={30}
                    accentColor="text-blue-400"
                  />
                </div>
              </div>
            </section>

            <Separator className="bg-white/10" />

            {/* Advanced */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Advanced</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Burnout Threshold</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="5"
                      max="14"
                      value={settings.burnoutThreshold}
                      onChange={(e) => setSettings({ ...settings, burnoutThreshold: parseInt(e.target.value) || 10 })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-yellow-500 focus:ring-yellow-500/20 pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">days</span>
                  </div>
                  <p className="text-xs text-white/30">Consecutive high-study days before warning</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Max Study Hours / Day</Label>
                  <HrMinInput
                    value={settings.maxStudyHoursPerDay}
                    onChange={(v) => setSettings({ ...settings, maxStudyHoursPerDay: v })}
                    maxHours={30}
                    accentColor="text-yellow-400"
                  />
                </div>
              </div>
            </section>

            <Separator className="bg-white/10" />

            {/* Subjects */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Subjects</h3>
              </div>

              <div className="space-y-2">
                {subjects.map((subject, i) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-xl border transition-all ${
                      subject.enabled
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white/[0.02] border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-slate-900"
                        style={{ backgroundColor: subject.color, ringColor: subject.color }}
                      />

                      {editingSubject === subject.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditSubject()}
                            autoFocus
                            className="h-8 bg-white/10 border-white/20 text-white text-sm"
                          />
                          <Button size="sm" onClick={saveEditSubject} className="h-8 px-3 bg-purple-600 hover:bg-purple-700">
                            <Save className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingSubject(null)} className="h-8 px-2 text-white/50 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 font-medium text-sm text-white">{subject.name}</span>

                          {/* Color swatches */}
                          <div className="hidden sm:flex gap-1">
                            {AVAILABLE_COLORS.slice(0, 6).map((color) => (
                              <button
                                key={color}
                                onClick={() => changeSubjectColor(subject.id, color)}
                                className="w-4 h-4 rounded-full transition-transform hover:scale-125"
                                style={{
                                  backgroundColor: color,
                                  outline: subject.color === color ? `2px solid ${color}` : 'none',
                                  outlineOffset: '2px',
                                }}
                              />
                            ))}
                          </div>

                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => toggleSubject(subject.id)}
                              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                subject.enabled
                                  ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                                  : 'border-white/20 text-white/40 hover:bg-white/5'
                              }`}
                            >
                              {subject.enabled ? 'On' : 'Off'}
                            </button>
                            <button
                              onClick={() => { setEditingSubject(subject.id); setEditName(subject.name); }}
                              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeSubject(subject.id)}
                              className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add subject */}
              <div className="flex gap-2">
                <Input
                  placeholder="New subject name..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSubject()}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500"
                />
                <Button onClick={addSubject} className="shrink-0 bg-emerald-600/80 hover:bg-emerald-600 text-white border-0">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add
                </Button>
              </div>
            </section>

            <Separator className="bg-white/10" />

            {/* Danger Zone */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-red-400/80 uppercase tracking-widest">Danger Zone</h3>
              </div>
              <Card className="bg-red-950/20 border border-red-500/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Reset All Data</p>
                    <p className="text-xs text-white/40 mt-1">Permanently erase all logs and analytics. Cannot be undone.</p>
                  </div>
                  <Button
                    onClick={() => setResetStep('confirm1')}
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 hover:text-red-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Reset
                  </Button>
                </div>
              </Card>
            </section>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-white/10 bg-slate-900/60 shrink-0">
            <Button onClick={onClose} variant="ghost" className="flex-1 text-white/60 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 font-semibold"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation — Step 1 */}
      <Dialog open={resetStep === 'confirm1'} onOpenChange={() => setResetStep('idle')}>
        <DialogContent className="max-w-md bg-slate-900/98 backdrop-blur-xl border border-red-500/20 text-white p-0 gap-0">
          <div className="px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">Delete All Data?</DialogTitle>
                <p className="text-xs text-white/40 mt-0.5">This action is permanent and irreversible</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-white/70">The following will be <span className="text-red-400 font-semibold">permanently deleted</span>:</p>
            <ul className="space-y-2.5">
              {[
                'All daily study logs and entries',
                'All analytics data and graphs (reset to 0)',
                'Study streaks and milestone history',
                'Peer competitor records',
                'Energy ratings and notes',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/60">
                  <ChevronRight className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Card className="bg-amber-950/30 border border-amber-500/20 p-3">
              <p className="text-xs text-amber-300/80">
                <span className="font-semibold">Note:</span> Your settings, subjects, and goals will be preserved. Only your logged data will be erased.
              </p>
            </Card>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-white/10">
            <Button onClick={() => setResetStep('idle')} variant="ghost" className="flex-1 text-white/60 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button
              onClick={() => setResetStep('confirm2')}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white border-0 font-semibold"
            >
              Reset All Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation — Step 2 (Final) */}
      <Dialog open={resetStep === 'confirm2'} onOpenChange={() => setResetStep('idle')}>
        <DialogContent className="max-w-sm bg-slate-900/98 backdrop-blur-xl border border-red-500/30 text-white p-0 gap-0">
          <div className="px-6 py-6 text-center space-y-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center"
            >
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </motion.div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">Are you sure?</DialogTitle>
              <p className="text-sm text-white/50 mt-2 leading-relaxed">
                This will permanently erase <span className="text-red-400 font-semibold">all your data</span>. There is no way to recover it.
              </p>
            </div>
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <Button onClick={() => setResetStep('idle')} variant="ghost" className="flex-1 text-white/60 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button
              onClick={handleReset}
              disabled={isResetting}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white border-0 font-semibold"
            >
              {isResetting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                  <RotateCcw className="w-4 h-4" />
                </motion.div>
              ) : (
                'Yes, Reset'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
