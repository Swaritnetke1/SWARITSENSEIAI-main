/**
 * SwaritSensei.ai - Main App V2 with Responsive Sidebar Layout
 * Professional multi-column grid for desktop, clean stack for mobile
 */

import { useEffect, useRef, useState } from 'react';
import { dbV2, AppSettings } from './lib/database-v2';
import { getSession, logout, AuthUser } from './lib/auth';
import { LoginScreen } from './components/LoginScreen';
import { SupportPanel } from './components/SupportPanel';
import { Onboarding } from './components/Onboarding';
import { Settings } from './components/Settings';
import { DailyLoggerV2 } from './components/DailyLoggerV2';
import { Dashboard } from './components/Dashboard';
import { LogList } from './components/LogList';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Toaster } from './components/ui/sonner';
import {
  Brain,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  Settings as SettingsIcon,
  Sparkles,
  LogOut,
  Headphones,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'dashboard' | 'log' | 'logs' | 'phantom';

export default function AppV2() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getSession());
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const settingsClickCount = useRef(0);
  const settingsClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSupport, setShowSupport] = useState(false);

  // Define all handlers before hooks so closures are stable
  async function initializeApp() {
    try {
      await dbV2.init();
      const appSettings = await dbV2.getSettings();
      setSettings(appSettings);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  async function handleOnboardingComplete() {
    setSettings(await dbV2.getSettings());
  }

  async function handleSettingsUpdate() {
    setSettings(await dbV2.getSettings());
    setRefreshKey((prev) => prev + 1);
  }

  function handleEntrySubmitted() {
    setRefreshKey((prev) => prev + 1);
    setCurrentView('dashboard');
  }

  function handleSettingsClick() {
    settingsClickCount.current += 1;
    if (settingsClickTimer.current) clearTimeout(settingsClickTimer.current);
    if (settingsClickCount.current >= 3) {
      settingsClickCount.current = 0;
      setShowAdminLogin(true);
      return;
    }
    settingsClickTimer.current = setTimeout(() => {
      settingsClickCount.current = 0;
      setShowSettings(true);
    }, 400);
  }

  useEffect(() => {
    if (authUser) initializeApp();
  }, [authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (settingsClickTimer.current) clearTimeout(settingsClickTimer.current); };
  }, []);

  if (!authUser) {
    return <LoginScreen onAuth={setAuthUser} />;
  }

  if (!isInitialized || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 mx-auto"
          >
            <Brain className="w-full h-full text-purple-500" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              SwaritSensei.ai
            </h1>
            <p className="text-muted-foreground mt-2">Initializing your productivity dashboard...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const onboardingDone = settings.isOnboardingComplete;
  if (!onboardingDone) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'log' as View, label: 'Daily Log', icon: Calendar },
    { id: 'logs' as View, label: 'Log List', icon: ClipboardList },
    { id: 'phantom' as View, label: 'Phantom Mode', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 dark">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:flex-col w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                <Brain className="w-8 h-8 text-purple-400" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  SwaritSensei
                </h1>
                <p className="text-xs text-muted-foreground">Data-Driven Productivity</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <Button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`w-full justify-start gap-3 h-11 text-white ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'hover:bg-white/5 text-white/70 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Settings & Info */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <Button
              onClick={() => setShowSupport(true)}
              variant="ghost"
              className="w-full justify-start gap-3 text-white/60 hover:text-white hover:bg-white/5"
            >
              <Headphones className="w-5 h-5 text-purple-400" />
              Support
            </Button>
            <Button
              onClick={handleSettingsClick}
              variant="outline"
              className="w-full justify-start gap-3 hover:bg-white/5 border-white/20 text-white hover:text-white"
            >
              <SettingsIcon className="w-5 h-5" />
              Settings
            </Button>

            <Card className="p-3 bg-gradient-to-br from-purple-900/20 to-purple-900/5 border-purple-500/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{authUser.username}</p>
                  <p className="text-xs text-purple-300">
                    Target: {settings.targetDailyHours}h/day
                    {authUser.role === 'admin' && <span className="ml-1 text-yellow-400">· Admin</span>}
                  </p>
                </div>
              </div>
            </Card>
            <Button
              onClick={() => { logout(); setAuthUser(null); }}
              variant="ghost"
              className="w-full justify-start gap-3 text-white/50 hover:text-red-400 hover:bg-red-500/5"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden flex flex-col bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
          {/* Brand row */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Brain className="w-7 h-7 text-purple-400" />
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                SwaritSensei
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSupport(true)}
                className="text-white/50 hover:text-white hover:bg-white/10"
              >
                <Headphones className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSettingsClick}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <SettingsIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-t border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors relative ${
                    isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-tab-indicator"
                      className="absolute inset-0 bg-gradient-to-b from-purple-600/30 to-transparent"
                    />
                  )}
                  <Icon className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-tab-underline"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <motion.div
              key={`${currentView}-${refreshKey}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'log' && <DailyLoggerV2 onEntrySubmitted={handleEntrySubmitted} />}
              {currentView === 'logs' && <LogList onEntryChanged={() => setRefreshKey((k) => k + 1)} />}
              {currentView === 'phantom' && <Dashboard />}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onUpdate={handleSettingsUpdate}
      />

      {/* Admin Login — triple-click on settings icon */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAdminLogin(false)}
          />
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <LoginScreen
              onAuth={(user) => {
                setShowAdminLogin(false);
                if (user.role === 'admin') setAuthUser(user);
              }}
              adminOnly
            />
          </div>
        </div>
      )}

      {/* Support Panel */}
      <AnimatePresence>
        {showSupport && <SupportPanel onClose={() => setShowSupport(false)} />}
      </AnimatePresence>

      {/* Toast Notifications */}
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}
