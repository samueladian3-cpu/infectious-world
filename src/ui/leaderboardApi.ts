import type { ReplayLog } from '../game/replay';

export type Board = 'victory' | 'defeat';

export interface LeaderboardEntry {
  name: string;
  seconds: number;
  mutations: string[];
  misinformation: boolean;
  infection: number;
  awareness: number;
  date: string;
}

const NAME_KEY = 'iw.playerName.v1';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Periksa koneksi internet.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && typeof data.error === 'string' && data.error) || 'Server sedang bermasalah. Coba lagi nanti.');
  return data as T;
}

export const fetchBoard = (board: Board) =>
  request<{ board: Board; entries: LeaderboardEntry[] }>(`/api/leaderboard?board=${board}`).then((r) => r.entries);

/** Server memutar ulang sesi dari seed + aksi; angka skor tidak dikirim klien. */
export const submitScore = (name: string, log: ReplayLog) =>
  request<{ board: Board; rank: number; entry: LeaderboardEntry }>('/api/scores', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, seed: log.seed, actions: log.actions }),
  });

export function loadPlayerName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function savePlayerName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* penyimpanan tidak tersedia: abaikan */
  }
}

export const BOARD_LABEL: Record<Board, string> = { victory: 'Tercepat Menang', defeat: 'Bertahan Terlama' };
