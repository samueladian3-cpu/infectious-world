// Ekstensi .js wajib: modul ini juga dijalankan Node ESM di fungsi Vercel (api/scores.ts).
import { activateMisinformation, isTerminal, purchaseMutation, startSession, tick } from './engine.js';
import { MUTATION_BY_ID } from './mutations.js';
import type { GameState, MutationId } from './types.js';

/**
 * Aksi pemain yang memengaruhi simulasi, dicatat dengan detik simulasi saat
 * aksi berhasil. Seed + daftar aksi cukup untuk memutar ulang sesi secara
 * deterministik, sehingga server bisa memverifikasi skor papan peringkat.
 */
export type ReplayAction = { t: number; type: 'purchase'; id: MutationId } | { t: number; type: 'misinformation' };

export interface ReplayLog {
  seed: number;
  actions: ReplayAction[];
}

/** Batas aman: tanpa aksi apa pun, sesi selalu selesai jauh sebelum ini. */
export const MAX_REPLAY_TICKS = 1800;
export const MAX_REPLAY_ACTIONS = 16;

export type ReplayResult = { ok: true; state: GameState } | { ok: false; reason: string };

export function replaySession(seed: number, actions: ReplayAction[]): ReplayResult {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) return { ok: false, reason: 'Seed tidak valid.' };
  if (actions.length > MAX_REPLAY_ACTIONS) return { ok: false, reason: 'Terlalu banyak aksi.' };

  let s = startSession(seed);
  let i = 0;
  while (!isTerminal(s)) {
    while (i < actions.length && actions[i].t === s.elapsedSeconds) {
      const a = actions[i];
      const r = a.type === 'purchase' ? purchaseMutation(s, a.id) : activateMisinformation(s);
      if (!r.ok) return { ok: false, reason: `Aksi ke-${i + 1} tidak valid: ${r.reason}` };
      s = r.state;
      i += 1;
    }
    if (i < actions.length && actions[i].t < s.elapsedSeconds) return { ok: false, reason: 'Urutan aksi tidak valid.' };
    if (isTerminal(s)) break;
    if (s.elapsedSeconds >= MAX_REPLAY_TICKS) return { ok: false, reason: 'Sesi terlalu panjang.' };
    s = tick(s);
  }
  if (i < actions.length) return { ok: false, reason: 'Ada aksi setelah sesi selesai.' };
  return { ok: true, state: s };
}

/** Validasi bentuk data dari luar (body request) menjadi ReplayLog. */
export function parseReplayLog(input: unknown): ReplayLog | null {
  if (typeof input !== 'object' || input === null) return null;
  const { seed, actions } = input as { seed?: unknown; actions?: unknown };
  if (typeof seed !== 'number' || !Array.isArray(actions) || actions.length > MAX_REPLAY_ACTIONS) return null;
  const parsed: ReplayAction[] = [];
  for (const raw of actions) {
    if (typeof raw !== 'object' || raw === null) return null;
    const { t, type, id } = raw as { t?: unknown; type?: unknown; id?: unknown };
    if (typeof t !== 'number' || !Number.isInteger(t) || t < 0 || t > MAX_REPLAY_TICKS) return null;
    if (type === 'misinformation') parsed.push({ t, type });
    else if (type === 'purchase' && typeof id === 'string' && id in MUTATION_BY_ID) parsed.push({ t, type, id: id as MutationId });
    else return null;
  }
  return { seed, actions: parsed };
}
