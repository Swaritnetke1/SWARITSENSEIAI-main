import { useState, useEffect } from 'react'
import {
  Shield, Plus, Trash2, Edit3, Save, X, Users,
  Headphones, ToggleLeft, ToggleRight, ArrowUp, ArrowDown,
  RefreshCw, Lock, Eye, EyeOff, Settings, FileText,
  CheckCircle, XCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { addUser, removeUser, getStoredUsers, AuthUser, LoginAttempt } from '../lib/auth'
import {
  getSupportItems, saveSupportItems, resetSupportItems,
  SupportItem, SupportIcon,
} from '../lib/support'
import { getAdminControls, patchAdminControls } from '../lib/admin-controls'
import { readDB, onDBUpdate } from '../lib/db-client'
import { IconFor, ICON_COLORS } from './SupportPanel'
import { toast } from 'sonner'

type AdminTab = 'users' | 'support' | 'controls' | 'logs'

const ICON_OPTIONS: SupportIcon[] = [
  'telegram', 'whatsapp', 'instagram', 'phone', 'email',
  'message', 'gift', 'group', 'youtube', 'twitter', 'link',
]

const ICON_LABEL: Record<SupportIcon, string> = {
  telegram: 'Telegram', whatsapp: 'WhatsApp', instagram: 'Instagram',
  phone: 'Phone/Call', email: 'Email', message: 'Message',
  gift: 'Gift', group: 'Group', youtube: 'YouTube',
  twitter: 'X/Twitter', link: 'Link',
}

interface AdminPanelProps {
  adminUser: AuthUser
  onEnterDashboard: () => void
  onLogout: () => void
}

// ── Users Tab ─────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<{ username: string; password: string; role: string }[]>([])
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)

  async function refresh() {
    setUsers(await getStoredUsers())
  }

  useEffect(() => {
    refresh()
    return onDBUpdate('users', refresh)
  }, [])

  const handleAdd = async () => {
    if (!form.username.trim() || !form.password.trim()) { toast.error('Fill both fields'); return }
    const ok = await addUser(form.username.trim(), form.password)
    if (!ok) { toast.error('Username taken'); return }
    toast.success(`User "${form.username}" created`)
    setForm({ username: '', password: '' })
    refresh()
  }

  const handleRemove = async (u: string) => {
    await removeUser(u)
    refresh()
    toast.success(`"${u}" removed`)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Create User</p>
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 outline-none focus:border-purple-500"
        />
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-white text-sm placeholder:text-white/25 outline-none focus:border-purple-500"
          />
          <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button onClick={handleAdd} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Users ({users.length})</p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {users.map((u) => (
            <div key={u.username} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <div>
                <span className="text-white text-sm font-medium">{u.username}</span>
                <span className="ml-2 text-xs text-white/30">{u.role}</span>
              </div>
              <button onClick={() => handleRemove(u.username)} className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {users.length === 0 && <p className="text-white/25 text-xs text-center py-3">No users yet</p>}
        </div>
      </div>
    </div>
  )
}

// ── Support Tab ───────────────────────────────────────────────────────────
function SupportTab() {
  const [items, setItems] = useState<SupportItem[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [addMode, setAddMode] = useState(false)
  const [form, setForm] = useState<Partial<SupportItem>>({ icon: 'telegram', label: '', value: '', hint: '', enabled: true })

  async function load() {
    const all = await getSupportItems()
    setItems(all.sort((a, b) => a.order - b.order))
  }

  useEffect(() => {
    load()
    return onDBUpdate('support_items', load)
  }, [])

  const save = async (updated: SupportItem[]) => {
    const reordered = updated.map((it, i) => ({ ...it, order: i }))
    await saveSupportItems(reordered)
    setItems(reordered)
  }

  const toggleEnabled = (id: string) =>
    save(items.map((it) => it.id === id ? { ...it, enabled: !it.enabled } : it))

  const moveUp = (idx: number) => {
    if (idx === 0) return
    const next = [...items]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; save(next)
  }

  const moveDown = (idx: number) => {
    if (idx === items.length - 1) return
    const next = [...items]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; save(next)
  }

  const deleteItem = (id: string) => { save(items.filter((it) => it.id !== id)); toast.success('Item removed') }

  const startEdit = (it: SupportItem) => { setEditId(it.id); setForm({ ...it }); setAddMode(false) }
  const startAdd = () => { setForm({ icon: 'telegram', label: '', value: '', hint: '', enabled: true }); setAddMode(true); setEditId(null) }

  const commitEdit = async () => {
    if (!form.label?.trim() || !form.value?.trim()) { toast.error('Label and URL required'); return }
    if (addMode) {
      const newItem: SupportItem = {
        id: `item_${Date.now()}`, icon: form.icon ?? 'link', label: form.label!.trim(),
        value: form.value!.trim(), hint: form.hint?.trim(), enabled: form.enabled ?? true, order: items.length,
      }
      await save([...items, newItem])
      toast.success('Item added')
    } else {
      await save(items.map((it) => it.id === editId ? { ...it, ...form } as SupportItem : it))
      toast.success('Item updated')
    }
    setEditId(null); setAddMode(false)
  }

  const editing = addMode || editId !== null

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">{addMode ? 'New Item' : 'Edit Item'}</p>
              <div>
                <p className="text-xs text-white/40 mb-1.5">Icon</p>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_OPTIONS.map((ic) => (
                    <button key={ic} onClick={() => setForm({ ...form, icon: ic })} title={ICON_LABEL[ic]}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${form.icon === ic ? ICON_COLORS[ic] + ' scale-110' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}>
                      <IconFor icon={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
              <input placeholder="Label" value={form.label ?? ''} onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 outline-none focus:border-purple-500" />
              <input placeholder="URL / phone / email" value={form.value ?? ''} onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 outline-none focus:border-purple-500" />
              <input placeholder="Hint text (optional)" value={form.hint ?? ''} onChange={(e) => setForm({ ...form, hint: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 outline-none focus:border-purple-500" />
              <div className="flex gap-2">
                <button onClick={commitEdit} className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm font-semibold">
                  <Save className="w-3.5 h-3.5" /> {addMode ? 'Add' : 'Save'}
                </button>
                <button onClick={() => { setEditId(null); setAddMode(false) }} className="px-4 border border-white/10 text-white/50 hover:text-white rounded-lg text-sm transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!editing && (
        <div className="flex gap-2">
          <button onClick={startAdd} className="flex-1 flex items-center justify-center gap-2 border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 rounded-xl py-2.5 text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Item
          </button>
          <button onClick={async () => { await resetSupportItems(); await load(); toast.success('Reset to defaults') }}
            className="px-3 border border-white/10 text-white/30 hover:text-white hover:bg-white/5 rounded-xl text-sm transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        {items.map((it, idx) => (
          <div key={it.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${it.enabled ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'}`}>
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${ICON_COLORS[it.icon]}`}>
              <IconFor icon={it.icon} className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{it.label}</p>
              <p className="text-xs text-white/30 truncate">{it.hint || it.value}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => moveUp(idx)} className="p-1 text-white/20 hover:text-white rounded transition-colors"><ArrowUp className="w-3 h-3" /></button>
              <button onClick={() => moveDown(idx)} className="p-1 text-white/20 hover:text-white rounded transition-colors"><ArrowDown className="w-3 h-3" /></button>
              <button onClick={() => startEdit(it)} className="p-1 text-white/30 hover:text-white rounded transition-colors"><Edit3 className="w-3 h-3" /></button>
              <button onClick={() => toggleEnabled(it.id)} className={`p-1 rounded transition-colors ${it.enabled ? 'text-green-400' : 'text-white/20 hover:text-white'}`}>
                {it.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              </button>
              <button onClick={() => deleteItem(it.id)} className="p-1 text-white/20 hover:text-red-400 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-white/25 text-xs py-4">No items. Add one above.</p>}
      </div>
    </div>
  )
}

// ── Controls Tab ──────────────────────────────────────────────────────────
function ControlsTab() {
  const [appName, setAppName] = useState('SwaritSensei')
  const [tagline, setTagline] = useState('Data-Driven Productivity')
  const [motdEnabled, setMotdEnabled] = useState(true)
  const [motd, setMotd] = useState('')
  const [allowSignup, setAllowSignup] = useState(true)

  async function load() {
    const c = await getAdminControls()
    setAppName(c.appName); setTagline(c.tagline)
    setMotdEnabled(c.motdEnabled); setMotd(c.motd); setAllowSignup(c.allowSignup)
  }

  useEffect(() => {
    load()
    return onDBUpdate('admin_controls', load)
  }, [])

  const patch = async (p: Parameters<typeof patchAdminControls>[0]) => {
    await patchAdminControls(p)
    toast.success('Saved')
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Branding</p>
        <div className="space-y-1">
          <label className="text-xs text-white/40">App Name</label>
          <div className="flex gap-2">
            <input value={appName} onChange={(e) => setAppName(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500" />
            <button onClick={() => patch({ appName })} className="px-3 bg-purple-600/60 hover:bg-purple-600 text-white rounded-lg text-xs">Save</button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/40">Tagline</label>
          <div className="flex gap-2">
            <input value={tagline} onChange={(e) => setTagline(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500" />
            <button onClick={() => patch({ tagline })} className="px-3 bg-purple-600/60 hover:bg-purple-600 text-white rounded-lg text-xs">Save</button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Login Message (MOTD)</p>
          <button onClick={async () => { const next = !motdEnabled; setMotdEnabled(next); await patch({ motdEnabled: next }) }}>
            {motdEnabled ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-white/30" />}
          </button>
        </div>
        <textarea value={motd} onChange={(e) => setMotd(e.target.value)} rows={2}
          placeholder="Message shown on login screen..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 outline-none focus:border-purple-500 resize-none" />
        <button onClick={() => patch({ motd })} className="w-full bg-purple-600/60 hover:bg-purple-600 text-white py-1.5 rounded-lg text-sm font-semibold">
          Save Message
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Access Control</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Allow new sign-ups</p>
            <p className="text-xs text-white/30">Users can create accounts on login screen</p>
          </div>
          <button onClick={async () => { const next = !allowSignup; setAllowSignup(next); await patch({ allowSignup: next }) }}>
            {allowSignup ? <ToggleRight className="w-6 h-6 text-green-400" /> : <ToggleLeft className="w-6 h-6 text-white/30" />}
          </button>
        </div>
      </div>

      <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-red-400/70 uppercase tracking-wider">Danger</p>
        <button
          onClick={() => {
            if (confirm('Clear session data? This logs you out.')) {
              localStorage.clear()
              window.location.reload()
            }
          }}
          className="w-full py-2 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          Clear Session & Reload
        </button>
      </div>
    </div>
  )
}

// ── Logs Tab ──────────────────────────────────────────────────────────────
function LogsTab() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const data = await readDB<LoginAttempt[]>('login_attempts')
      setAttempts(data)
    } catch {
      setAttempts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    return onDBUpdate('login_attempts', load)
  }, [])

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Login Attempts ({attempts.length})</p>
        <button onClick={load} className="p-1 text-white/30 hover:text-white transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
      </div>
      {attempts.length === 0 ? (
        <p className="text-center text-white/25 text-xs py-8">No login attempts recorded yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
          {attempts.map((a) => (
            <div key={a.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm ${a.success ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
              {a.success
                ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{a.username}</p>
                <p className="text-xs text-white/40">
                  {new Date(a.timestamp).toLocaleString('en-IN')} · {a.loginType}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${a.success ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/20' : 'bg-red-600/20 text-red-300 border-red-500/20'}`}>
                {a.success ? 'OK' : 'Fail'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main AdminPanel ────────────────────────────────────────────────────────
const TAB_CONFIG: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: 'users',    label: 'Users',    icon: Users },
  { id: 'support',  label: 'Support',  icon: Headphones },
  { id: 'controls', label: 'Controls', icon: Settings },
  { id: 'logs',     label: 'Logs',     icon: FileText },
]

export function AdminPanel({ adminUser, onEnterDashboard, onLogout }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('users')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-start justify-center p-4 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-white/40">{adminUser.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onEnterDashboard} className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs font-semibold">
              Dashboard →
            </button>
            <button onClick={onLogout} className="px-3 py-1.5 border border-white/10 text-white/50 hover:text-white rounded-lg text-xs transition-colors">
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
          {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : 'text-white/40 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'users'    && <UsersTab />}
            {tab === 'support'  && <SupportTab />}
            {tab === 'controls' && <ControlsTab />}
            {tab === 'logs'     && <LogsTab />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
