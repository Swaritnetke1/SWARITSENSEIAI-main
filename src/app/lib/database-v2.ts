import { readDB, writeDB } from './db-client'

export interface DailyEntry {
  id?: number
  date: string
  selfStudyHours: number
  tuitionHours: number
  sleepHours: number
  timepassHours: number
  goalCompleted: boolean
  energyRating: number
  subjects: { [subjectId: string]: number }
  notes?: string
  timestamp: number
}

export interface Subject {
  id: string
  name: string
  color: string
  order: number
  enabled: boolean
}

export interface PeerCompetitor {
  id?: number
  name: string
  dailyStudyHours: number
  color: string
  enabled: boolean
}

export interface AppSettings {
  id: number
  isOnboardingComplete: boolean
  minimumDailyHours: number
  targetDailyHours: number
  burnoutThreshold: number
  maxStudyHoursPerDay: number
  streakStartDate?: string
  currentStreak: number
  subjects: Subject[]
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'physics',   name: 'Physics',          color: '#8b5cf6', order: 0, enabled: true },
  { id: 'chemistry', name: 'Chemistry',         color: '#3b82f6', order: 1, enabled: true },
  { id: 'maths',     name: 'Mathematics',       color: '#10b981', order: 2, enabled: true },
  { id: 'biology',   name: 'Biology',           color: '#f59e0b', order: 3, enabled: true },
  { id: 'cs',        name: 'Computer Science',  color: '#ef4444', order: 4, enabled: true },
]

const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  isOnboardingComplete: false,
  minimumDailyHours: 4,
  targetDailyHours: 8,
  burnoutThreshold: 10,
  maxStudyHoursPerDay: 14,
  currentStreak: 0,
  subjects: DEFAULT_SUBJECTS,
}

function nextId(items: { id?: number }[]): number {
  if (items.length === 0) return 1
  return Math.max(...items.map((i) => i.id ?? 0)) + 1
}

class DatabaseV2 {
  async init(): Promise<void> { /* file-based — no init needed */ }

  // ── ENTRIES ──────────────────────────────────────────────────────────────

  async addEntry(entry: Omit<DailyEntry, 'id'>): Promise<number> {
    const entries = await this._entries()
    const id = nextId(entries)
    await writeDB('entries', [...entries, { ...entry, id }])
    return id
  }

  async updateEntry(entry: DailyEntry): Promise<void> {
    const entries = await this._entries()
    const idx = entries.findIndex((e) => e.id === entry.id)
    if (idx === -1) throw new Error('Entry not found')
    entries[idx] = entry
    await writeDB('entries', entries)
  }

  async deleteEntry(id: number): Promise<void> {
    const entries = await this._entries()
    await writeDB('entries', entries.filter((e) => e.id !== id))
  }

  async getEntryByDate(date: string): Promise<DailyEntry | null> {
    const entries = await this._entries()
    return entries.find((e) => e.date === date) ?? null
  }

  async getAllEntries(): Promise<DailyEntry[]> {
    return this._entries()
  }

  async getEntriesInRange(startDate: string, endDate: string): Promise<DailyEntry[]> {
    const entries = await this._entries()
    return entries
      .filter((e) => e.date >= startDate && e.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  // ── COMPETITORS ──────────────────────────────────────────────────────────

  async addCompetitor(competitor: Omit<PeerCompetitor, 'id'>): Promise<number> {
    const list = await this._competitors()
    const id = nextId(list)
    await writeDB('competitors', [...list, { ...competitor, id }])
    return id
  }

  async updateCompetitor(competitor: PeerCompetitor): Promise<void> {
    const list = await this._competitors()
    const idx = list.findIndex((c) => c.id === competitor.id)
    if (idx !== -1) list[idx] = competitor
    await writeDB('competitors', list)
  }

  async deleteCompetitor(id: number): Promise<void> {
    const list = await this._competitors()
    await writeDB('competitors', list.filter((c) => c.id !== id))
  }

  async getAllCompetitors(): Promise<PeerCompetitor[]> {
    return this._competitors()
  }

  // ── SETTINGS ─────────────────────────────────────────────────────────────

  async getSettings(): Promise<AppSettings> {
    try {
      const s = await readDB<AppSettings>('settings')
      return { ...DEFAULT_SETTINGS, ...s, subjects: s.subjects ?? DEFAULT_SUBJECTS }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    await writeDB('settings', settings)
  }

  // ── SUBJECTS ─────────────────────────────────────────────────────────────

  async addSubject(subject: Subject): Promise<void> {
    const s = await this.getSettings()
    s.subjects.push(subject)
    await this.updateSettings(s)
  }

  async updateSubject(subjectId: string, updates: Partial<Subject>): Promise<void> {
    const s = await this.getSettings()
    const idx = s.subjects.findIndex((sub) => sub.id === subjectId)
    if (idx !== -1) {
      s.subjects[idx] = { ...s.subjects[idx], ...updates }
      await this.updateSettings(s)
    }
  }

  async deleteSubject(subjectId: string): Promise<void> {
    const s = await this.getSettings()
    s.subjects = s.subjects.filter((sub) => sub.id !== subjectId)
    await this.updateSettings(s)
  }

  async reorderSubjects(subjects: Subject[]): Promise<void> {
    const s = await this.getSettings()
    s.subjects = subjects
    await this.updateSettings(s)
  }

  async resetAllData(): Promise<void> {
    await writeDB('entries', [])
    await writeDB('competitors', [])
    const s = await this.getSettings()
    await this.updateSettings({ ...s, currentStreak: 0, streakStartDate: undefined })
  }

  // ── PRIVATE ───────────────────────────────────────────────────────────────

  private async _entries(): Promise<DailyEntry[]> {
    try { return await readDB<DailyEntry[]>('entries') } catch { return [] }
  }

  private async _competitors(): Promise<PeerCompetitor[]> {
    try { return await readDB<PeerCompetitor[]>('competitors') } catch { return [] }
  }
}

export const dbV2 = new DatabaseV2()
