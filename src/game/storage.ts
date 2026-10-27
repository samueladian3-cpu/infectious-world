/** Data persisten lokal: preferensi dan statistik/rekor. Semua akses dibungkus try/catch. */

export type MotionPref = 'system' | 'reduced' | 'full';
export type SpeedPref = 'normal' | 'fast';

export interface Preferences {
  motion: MotionPref;
  speed: SpeedPref;
}

export interface LocalRecords {
  sessionsStarted: number;
  sessionsCompleted: number;
  victories: number;
  defeats: number;
  totalDurationSeconds: number;
  fastestVictorySeconds: number | null;
  longestDefenseSeconds: number | null;
  mutationsPurchased: number;
  shieldEventsSeen: number;
  dexEntriesOpened: number;
  tutorialCompleted: boolean;
}

const PREF_KEY = 'iw.preferences.v1';
const REC_KEY = 'iw.records.v1';

export const DEFAULT_PREFS: Preferences = { motion: 'system', speed: 'normal' };
export const DEFAULT_RECORDS: LocalRecords = {
  sessionsStarted: 0,
  sessionsCompleted: 0,
  victories: 0,
  defeats: 0,
  totalDurationSeconds: 0,
  fastestVictorySeconds: null,
  longestDefenseSeconds: null,
  mutationsPurchased: 0,
  shieldEventsSeen: 0,
  dexEntriesOpened: 0,
  tutorialCompleted: false,
};

function read<T extends object>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...fallback };
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? { ...fallback, ...parsed } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* penyimpanan tidak tersedia: abaikan */
  }
}

export const loadPrefs = () => read(PREF_KEY, DEFAULT_PREFS);
export const savePrefs = (p: Preferences) => write(PREF_KEY, p);
export const loadRecords = () => read(REC_KEY, DEFAULT_RECORDS);
export const saveRecords = (r: LocalRecords) => write(REC_KEY, r);
export function clearRecords() {
  try {
    localStorage.removeItem(REC_KEY);
  } catch {
    /* abaikan */
  }
}
