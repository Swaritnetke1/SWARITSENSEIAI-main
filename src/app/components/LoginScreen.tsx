import { useState, useEffect } from 'react'
import { Brain, Lock, User, Shield, Eye, EyeOff, Headphones, AlertCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { loginUser, loginAdmin, logout, logLoginAttempt, AuthUser } from '../lib/auth'
import { getAdminControls } from '../lib/admin-controls'
import { onDBUpdate } from '../lib/db-client'
import { AdminPanel } from './AdminPanel'
import { SupportPanel } from './SupportPanel'

interface LoginScreenProps {
  onAuth: (user: AuthUser) => void
  adminOnly?: boolean
}

type Mode = 'user' | 'admin' | 'adminPanel'

export function LoginScreen({ onAuth, adminOnly = false }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>(adminOnly ? 'admin' : 'user')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [adminSession, setAdminSession] = useState<AuthUser | null>(null)
  const [showSupport, setShowSupport] = useState(false)
  const [controls, setControls] = useState({ appName: 'SwaritSensei', tagline: 'Data-Driven Productivity', motd: '', motdEnabled: true })

  async function loadControls() {
    try {
      const c = await getAdminControls()
      setControls({ appName: c.appName, tagline: c.tagline, motd: c.motd, motdEnabled: c.motdEnabled })
    } catch { /* keep defaults */ }
  }

  useEffect(() => {
    loadControls()
    return onDBUpdate('admin_controls', loadControls)
  }, [])

  const clearError = () => setError('')

  const handleLogin = async () => {
    if (loading) return
    setError('')
    setLoading(true)
    try {
      if (mode === 'user') {
        const result = await loginUser(username.trim(), password)
        await logLoginAttempt({ username: username.trim(), loginType: 'user', success: !!result })
        if (result) { onAuth(result); return }
        setError('Wrong username or password entered.')
      } else if (mode === 'admin') {
        const result = await loginAdmin(username.trim(), password)
        await logLoginAttempt({ username: username.trim(), loginType: 'admin', success: !!result })
        if (result) { setAdminSession(result); setMode('adminPanel'); return }
        setError('Wrong Admin ID or password entered.')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: 'user' | 'admin') => {
    setMode(m)
    setUsername('')
    setPassword('')
    setError('')
  }

  if (mode === 'adminPanel' && adminSession) {
    return (
      <AdminPanel
        adminUser={adminSession}
        onEnterDashboard={() => onAuth(adminSession)}
        onLogout={() => {
          logout()
          setMode('admin')
          setUsername('')
          setPassword('')
          setError('')
          setAdminSession(null)
        }}
      />
    )
  }

  const hasError = error.length > 0
  const inputBase =
    'w-full bg-white/5 border rounded-lg py-2.5 text-white placeholder:text-white/20 text-sm outline-none transition-all duration-200'
  const inputBorder = hasError
    ? 'border-red-500 focus:border-red-400 shadow-[0_0_0_1px_rgba(239,68,68,0.3)]'
    : 'border-white/10 focus:border-purple-500'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm space-y-5"
      >
        {/* Logo */}
        <div className="text-center space-y-1">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 mx-auto"
          >
            <Brain className="w-full h-full text-purple-400" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            {adminOnly ? 'Admin Access' : controls.appName}
          </h1>
          <p className="text-white/40 text-sm">{adminOnly ? 'Enter admin credentials' : controls.tagline}</p>
        </div>

        {/* MOTD */}
        {!adminOnly && controls.motdEnabled && controls.motd && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-purple-900/30 border border-purple-500/20 rounded-xl px-4 py-3 text-sm text-purple-200 text-center"
          >
            {controls.motd}
          </motion.div>
        )}

        {/* Mode toggle — animated sliding pill */}
        {!adminOnly && (
          <div className="relative flex p-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-purple-600 pointer-events-none"
              animate={{ x: mode === 'user' ? 0 : 'calc(100% + 8px)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
            {(['user', 'admin'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors duration-150 ${
                  mode === m ? 'text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {m === 'user' ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                {m === 'user' ? 'User' : 'Admin'}
              </button>
            ))}
          </div>
        )}

        {/* Form card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 backdrop-blur-xl">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs text-white/40 uppercase tracking-wider">
              {mode === 'admin' ? 'Admin ID' : 'Username'}
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${hasError ? 'text-red-400/60' : 'text-white/25'}`} />
              <input
                value={username}
                onChange={(e) => { setUsername(e.target.value); clearError() }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder={mode === 'admin' ? 'Admin ID' : 'Username'}
                autoComplete="username"
                className={`${inputBase} ${inputBorder} pl-9 pr-3`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs text-white/40 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${hasError ? 'text-red-400/60' : 'text-white/25'}`} />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError() }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Password"
                autoComplete="current-password"
                className={`${inputBase} ${inputBorder} pl-9 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Inline error banner */}
          <AnimatePresence>
            {hasError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2.5 mt-0.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-red-300 text-sm">{error}</span>
                  </div>
                  <button onClick={clearError} className="text-red-400/50 hover:text-red-300 transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign in button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : mode === 'admin' ? 'Access Admin Panel' : 'Sign In'}
          </button>
        </div>

        {/* Support button */}
        {!adminOnly && (
          <button
            onClick={() => setShowSupport(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-sm font-medium transition-all"
          >
            <Headphones className="w-4 h-4 text-purple-400" />
            Support & Contact
          </button>
        )}

        <p className="text-center text-white/15 text-xs">Secure · Local-first · Private</p>
      </motion.div>

      <AnimatePresence>
        {showSupport && <SupportPanel onClose={() => setShowSupport(false)} />}
      </AnimatePresence>
    </div>
  )
}
