/**
 * SwaritSensei.ai - IndexedDB Database Layer
 * Handles all local data persistence with zero setup required
 */

export interface DailyEntry {
  id?: number;
  date: string; // ISO date string (YYYY-MM-DD)
  studyHours: number;
  timepassHours: number;
  goalCompleted: boolean;
  energyRating: number; // 1-5 scale
  subjects: SubjectHours;
  notes?: string;
  timestamp: number;
}

export interface SubjectHours {
  physics: number;
  chemistry: number;
  maths: number;
  biology: number;
  computerScience: number;
}

export interface PeerCompetitor {
  id?: number;
  name: string;
  dailyStudyHours: number;
  color: string;
  enabled: boolean;
}

export interface AppSettings {
  id: number;
  minimumDailyHours: number;
  targetDailyHours: number;
  burnoutThreshold: number; // consecutive days above this triggers warning
  maxStudyHoursPerDay: number;
  streakStartDate?: string;
  currentStreak: number;
}

const DB_NAME = 'SwaritSenseiDB';
const DB_VERSION = 1;

class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Daily entries store
        if (!db.objectStoreNames.contains('dailyEntries')) {
          const entryStore = db.createObjectStore('dailyEntries', {
            keyPath: 'id',
            autoIncrement: true,
          });
          entryStore.createIndex('date', 'date', { unique: true });
          entryStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Peer competitors store
        if (!db.objectStoreNames.contains('competitors')) {
          db.createObjectStore('competitors', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', {
            keyPath: 'id',
          });

          // Initialize default settings
          settingsStore.add({
            id: 1,
            minimumDailyHours: 4,
            targetDailyHours: 8,
            burnoutThreshold: 10,
            maxStudyHoursPerDay: 14,
            currentStreak: 0,
          });
        }
      };
    });
  }

  // ============= DAILY ENTRIES =============

  async addEntry(entry: Omit<DailyEntry, 'id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['dailyEntries'], 'readwrite');
      const store = transaction.objectStore('dailyEntries');
      const request = store.add(entry);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updateEntry(entry: DailyEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['dailyEntries'], 'readwrite');
      const store = transaction.objectStore('dailyEntries');
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getEntryByDate(date: string): Promise<DailyEntry | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['dailyEntries'], 'readonly');
      const store = transaction.objectStore('dailyEntries');
      const index = store.index('date');
      const request = index.get(date);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllEntries(): Promise<DailyEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['dailyEntries'], 'readonly');
      const store = transaction.objectStore('dailyEntries');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getEntriesInRange(startDate: string, endDate: string): Promise<DailyEntry[]> {
    const allEntries = await this.getAllEntries();
    return allEntries
      .filter((e) => e.date >= startDate && e.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ============= COMPETITORS =============

  async addCompetitor(competitor: Omit<PeerCompetitor, 'id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['competitors'], 'readwrite');
      const store = transaction.objectStore('competitors');
      const request = store.add(competitor);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updateCompetitor(competitor: PeerCompetitor): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['competitors'], 'readwrite');
      const store = transaction.objectStore('competitors');
      const request = store.put(competitor);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCompetitor(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['competitors'], 'readwrite');
      const store = transaction.objectStore('competitors');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCompetitors(): Promise<PeerCompetitor[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['competitors'], 'readonly');
      const store = transaction.objectStore('competitors');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============= SETTINGS =============

  async getSettings(): Promise<AppSettings> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(1);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put(settings);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const db = new Database();
