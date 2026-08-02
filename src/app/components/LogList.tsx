import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { HrMinInput, fmtTime } from './ui/HrMinInput';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { dbV2, DailyEntry, AppSettings } from '../lib/database-v2';
import {
  getDriveConfig,
  connectDrive,
  backupToDrive,
  exportFromDrive,
  disconnectDrive,
  DriveConfig,
} from '../lib/drive';
import {
  Edit3, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp,
  Cloud, CloudOff, RefreshCw, Download, ListChecks, RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface LogListProps {
  onEntryChanged?: () => void;
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── Drive Panel ────────────────────────────────────────────────────────────
function DrivePanel({ entries, settings }: { entries: DailyEntry[]; settings: AppSettings }) {
  const [cfg, setCfg] = useState<DriveConfig | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshCfg = async () => setCfg(await getDriveConfig());
  useEffect(() => { refreshCfg(); }, []);

  const backup = async (e: DailyEntry[], s: AppSettings) => {
    const dc = await getDriveConfig();
    if (!dc.connected) return;
    try { await backupToDrive({ entries: e, settings: s, at: new Date().toISOString() }); }
    catch { /* silent */ }
  };

  if (!cfg) return null;

  if (cfg.connected) {
    return (
      <Card className="p-4 bg-emerald-950/20 border border-emerald-500/20 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{cfg.email}</p>
              <p className="text-xs text-white/40">
                {cfg.lastBackup
                  ? `Last backup: ${new Date(cfg.lastBackup).toLocaleString('en-IN')}`
                  : 'No backup yet'}
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-600/30 text-emerald-300 border-emerald-500/20 shrink-0 text-xs">Connected</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={async () => {
            setBusy(true);
            try { await backup(entries, settings); await refreshCfg(); toast.success('Backup saved!'); }
            catch { toast.error('Backup failed'); } finally { setBusy(false); }
          }} className="text-xs bg-emerald-700/60 hover:bg-emerald-600 text-white border-0 h-7">
            {busy ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
            Backup Now
          </Button>
          <Button size="sm" disabled={busy} variant="outline" onClick={async () => {
            setBusy(true);
            try {
              const data = await exportFromDrive();
              if (!data) { toast.error('No backup on Drive'); return; }
              const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
              Object.assign(document.createElement('a'), { href: url, download: 'swaritsensei_backup.json' }).click();
              URL.revokeObjectURL(url);
              toast.success('Downloaded!');
            } catch { toast.error('Export failed'); } finally { setBusy(false); }
          }} className="text-xs border-white/10 text-white/60 hover:text-white h-7">
            <Download className="w-3 h-3 mr-1" /> Export
          </Button>
          <Button size="sm" variant="ghost" onClick={async () => { await disconnectDrive(); await refreshCfg(); toast.success('Disconnected'); }}
            className="text-xs text-red-400 hover:bg-red-500/10 h-7 ml-auto">
            Disconnect
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white/5 border border-white/10">
      <div className="flex items-center gap-3">
        <CloudOff className="w-8 h-8 text-white/20 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Google Drive Backup</p>
          <p className="text-xs text-white/40 mt-0.5">
            Auto-save every log change. Needs <code className="text-purple-400">VITE_GOOGLE_CLIENT_ID</code> in .env
          </p>
        </div>
        <Button size="sm" disabled={busy} onClick={async () => {
          setBusy(true);
          try { const c = await connectDrive(); setCfg(c); toast.success(`Connected as ${c.email}`); }
          catch (e: any) { toast.error(e?.message ?? 'Failed — check VITE_GOOGLE_CLIENT_ID'); } finally { setBusy(false); }
        }} className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white border-0 text-xs">
          {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5 mr-1" />}
          Connect
        </Button>
      </div>
    </Card>
  );
}

// ─── Edit Drawer ─────────────────────────────────────────────────────────────
function EditDrawer({
  entry,
  settings,
  onSave,
  onClose,
}: {
  entry: DailyEntry;
  settings: AppSettings;
  onSave: (e: DailyEntry) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<DailyEntry>({ ...entry });
  const enabled = settings.subjects.filter((s) => s.enabled);

  const hrField = (
    label: string,
    key: 'selfStudyHours' | 'tuitionHours' | 'sleepHours' | 'timepassHours',
    color: string,
  ) => (
    <div className="space-y-1">
      <Label className="text-xs text-white/50">{label}</Label>
      <HrMinInput
        value={form[key]}
        onChange={(v) => setForm({ ...form, [key]: v })}
        accentColor={color}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="relative w-full sm:max-w-lg bg-slate-900 border border-white/10 rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-purple-900/30 to-pink-900/20 shrink-0">
          <div>
            <p className="font-bold text-white">Edit Log</p>
            <p className="text-xs text-white/40">{fmtDate(form.date)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10">
            <RotateCcw className="w-4 h-4" onClick={() => setForm({ ...entry })} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Hours */}
          <div className="grid grid-cols-1 gap-3">
            {hrField('Self Study', 'selfStudyHours', 'text-green-400')}
            {hrField('Tuition', 'tuitionHours', 'text-blue-400')}
            {hrField('Sleep', 'sleepHours', 'text-purple-400')}
            {hrField('Timepass', 'timepassHours', 'text-red-400')}
          </div>

          {/* Energy */}
          <div className="space-y-2">
            <Label className="text-xs text-white/50">Energy Rating</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setForm({ ...form, energyRating: v })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                    form.energyRating === v
                      ? 'bg-purple-600 border-purple-400 text-white scale-105'
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30 text-center">
              {['Exhausted', 'Low', 'Average', 'Good', 'Excellent'][form.energyRating - 1]}
            </p>
          </div>

          {/* Goal */}
          <button
            onClick={() => setForm({ ...form, goalCompleted: !form.goalCompleted })}
            className="flex items-center gap-2.5 w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            {form.goalCompleted
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              : <Circle className="w-5 h-5 text-white/30" />}
            <span className="text-sm text-white font-medium">Goal completed today</span>
          </button>

          {/* Subject hours */}
          {enabled.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-white/50">Subject Hours</Label>
              <div className="space-y-2">
                {enabled.map((s) => (
                  <div key={s.id} className="space-y-1">
                    <span className="text-xs text-white/50 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                    <HrMinInput
                      value={form.subjects[s.id] ?? 0}
                      onChange={(v) => setForm({ ...form, subjects: { ...form.subjects, [s.id]: v } })}
                      accentColor="text-white/60"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs text-white/50">Notes</Label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Any notes for today..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-purple-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-white/10 shrink-0">
          <Button onClick={onClose} variant="ghost" className="flex-1 text-white/50 hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={() => onSave(form)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 font-semibold"
          >
            Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main LogList ─────────────────────────────────────────────────────────────
export function LogList({ onEntryChanged }: LogListProps) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [editEntry, setEditEntry] = useState<DailyEntry | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    const [all, cfg] = await Promise.all([dbV2.getAllEntries(), dbV2.getSettings()]);
    setEntries(all.sort((a, b) => b.date.localeCompare(a.date)));
    setSettings(cfg);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const autoBackup = async (all: DailyEntry[], cfg: AppSettings) => {
    const dc = await getDriveConfig();
    if (!dc.connected) return;
    try { await backupToDrive({ entries: all, settings: cfg, at: new Date().toISOString() }); }
    catch { /* silent */ }
  };

  const handleSave = async (updated: DailyEntry) => {
    try {
      await dbV2.updateEntry(updated);
      setEditEntry(null);
      const [all, cfg] = await Promise.all([dbV2.getAllEntries(), dbV2.getSettings()]);
      const sorted = all.sort((a, b) => b.date.localeCompare(a.date));
      setEntries(sorted);
      if (cfg) { setSettings(cfg); autoBackup(sorted, cfg); }
      onEntryChanged?.();
      toast.success('Log updated!');
    } catch { toast.error('Update failed'); }
  };

  const handleDelete = async (id: number) => {
    try {
      await dbV2.deleteEntry(id);
      setConfirmDeleteId(null);
      const [all, cfg] = await Promise.all([dbV2.getAllEntries(), dbV2.getSettings()]);
      const sorted = all.sort((a, b) => b.date.localeCompare(a.date));
      setEntries(sorted);
      if (cfg) { setSettings(cfg); autoBackup(sorted, cfg); }
      onEntryChanged?.();
      toast.success('Log deleted');
    } catch { toast.error('Delete failed'); }
  };

  const isIncomplete = (e: DailyEntry) =>
    !e.goalCompleted || (e.selfStudyHours === 0 && e.tuitionHours === 0);

  const filtered = entries.filter((e) =>
    !search || e.date.includes(search) || (e.notes ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const incompleteCount = entries.filter(isIncomplete).length;

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Log History
          </h2>
          <p className="text-sm text-white/40 mt-0.5">
            {entries.length} entries
            {incompleteCount > 0 && (
              <span className="ml-2 text-amber-400">· {incompleteCount} incomplete</span>
            )}
          </p>
        </div>
        <ListChecks className="w-6 h-6 text-purple-400" />
      </div>

      {/* Drive */}
      <DrivePanel entries={entries} settings={settings} />

      <Separator className="bg-white/10" />

      {/* Search */}
      <Input
        placeholder="Search by date or notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
      />

      {/* Stats bar */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Total Study',
              value: `${entries.reduce((s, e) => s + e.selfStudyHours + e.tuitionHours, 0).toFixed(1)}h`,
              color: 'text-green-400',
            },
            {
              label: 'Avg Energy',
              value: `${(entries.reduce((s, e) => s + e.energyRating, 0) / entries.length).toFixed(1)}/5`,
              color: 'text-purple-400',
            },
            {
              label: 'Goals Hit',
              value: `${entries.filter((e) => e.goalCompleted).length}/${entries.length}`,
              color: 'text-blue-400',
            },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-3 bg-white/5 border-white/10 text-center">
              <p className="text-xs text-white/40">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Entries list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Circle className="w-12 h-12 mx-auto text-white/10" />
          <p className="text-white/30 text-sm">
            {search ? 'No logs match your search.' : 'No logs yet — start in Daily Log!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((entry) => {
              const incomplete = isIncomplete(entry);
              const expanded = expandedId === entry.id;
              const deletePending = confirmDeleteId === entry.id;
              const enabledSubjectsWithHours = settings.subjects.filter(
                (s) => s.enabled && (entry.subjects[s.id] ?? 0) > 0
              );

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`overflow-hidden rounded-xl border ${
                    incomplete
                      ? 'bg-amber-950/10 border-amber-500/20'
                      : 'bg-white/[0.04] border-white/10'
                  }`}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-2.5 px-4 py-3">
                    {entry.goalCompleted
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      : <Circle className="w-5 h-5 text-white/20 shrink-0" />}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">{fmtDate(entry.date)}</span>
                        {incomplete && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-600/20 text-amber-300 border border-amber-500/20">
                            Incomplete
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        <span className="text-green-400">{fmtTime(entry.selfStudyHours)}</span>
                        {' self · '}
                        <span className="text-blue-400">{fmtTime(entry.tuitionHours)}</span>
                        {' tuition · '}
                        <span className="text-purple-400">⚡{entry.energyRating}/5</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {incomplete && (
                        <button
                          onClick={() => setEditEntry(entry)}
                          className="text-xs px-2 py-1 rounded-lg bg-amber-600/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/20 transition-colors"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => setEditEntry(entry)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {deletePending ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(entry.id!)}
                            className="text-xs px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs px-2 py-1 rounded-lg border border-white/10 text-white/50 hover:text-white transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(entry.id!)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedId(expanded ? null : entry.id!)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        key="detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { label: 'Self Study', val: fmtTime(entry.selfStudyHours), c: 'text-green-400' },
                              { label: 'Tuition', val: fmtTime(entry.tuitionHours), c: 'text-blue-400' },
                              { label: 'Sleep', val: fmtTime(entry.sleepHours), c: 'text-purple-400' },
                              { label: 'Timepass', val: fmtTime(entry.timepassHours), c: 'text-red-400' },
                            ].map(({ label, val, c }) => (
                              <div key={label} className="bg-white/5 rounded-lg p-2 text-center">
                                <p className="text-xs text-white/35">{label}</p>
                                <p className={`text-sm font-bold ${c}`}>{val}</p>
                              </div>
                            ))}
                          </div>

                          {enabledSubjectsWithHours.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {enabledSubjectsWithHours.map((s) => (
                                <span
                                  key={s.id}
                                  className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-white/60"
                                  style={{ backgroundColor: s.color + '22' }}
                                >
                                  <span
                                    className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                                    style={{ backgroundColor: s.color }}
                                  />
                                  {s.name}: {entry.subjects[s.id]}h
                                </span>
                              ))}
                            </div>
                          )}

                          {entry.notes && (
                            <p className="text-xs text-white/40 italic border-l-2 border-purple-500/40 pl-2">
                              {entry.notes}
                            </p>
                          )}

                          <button
                            onClick={() => setEditEntry(entry)}
                            className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2"
                          >
                            Edit this log →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit drawer */}
      <AnimatePresence>
        {editEntry && settings && (
          <EditDrawer
            key={editEntry.id}
            entry={editEntry}
            settings={settings}
            onSave={handleSave}
            onClose={() => setEditEntry(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
