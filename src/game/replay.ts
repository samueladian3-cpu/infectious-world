// Ekstensi .js wajib: modul ini juga dijalankan Node ESM di fungsi Vercel (api/scores.ts).
import { activateAbility, activateMisinformation, answerFlash, collectBubble, decide, isPlayMode, isTerminal, purchaseMutation, startSession, switchRegion, tick } from './engine.js';
import { MUTATION_BY_ID } from './mutations.js';
import { REGION_BY_ID } from './regions.js';
import { isScenarioId } from './scenarios/index.js';
import type { AbilityId, ActionResult, GameState, MutationId, PlayMode, RegionId, ScenarioId } from './types.js';

/**
 * Aksi pemain yang memengaruhi simulasi, dicatat dengan detik simulasi saat
 * aksi berhasil. Seed + skenario + wilayah awal + daftar aksi cukup untuk
 * memutar ulang sesi secara deterministik, sehingga server bisa memverifikasi
 * skor papan peringkat.
 */
export type ReplayAction =
  | { t: number; type: 'purchase'; id: MutationId }
  | { t: number; type: 'misinformation' }
  | { t: number; type: 'decide'; choice: number }
  | { t: number; type: 'region'; id: RegionId }
  | { t: number; type: 'bubble'; id: number }
  | { t: number; type: 'flash'; choice: number }
  | { t: number; type: 'ability'; id: AbilityId };

export interface ReplayLog {
  seed: number;
  scenario: ScenarioId;
  region: RegionId;
  mode: PlayMode;
  actions: ReplayAction[];
}

/** Batas aman: tanpa aksi apa pun, sesi selalu selesai jauh sebelum ini. */
export const MAX_REPLAY_TICKS = 1800;
export const MAX_REPLAY_ACTIONS = 600;

export type ReplayResult = { ok: true; state: GameState } | { ok: false; reason: string };

export function applyAction(s: GameState, a: ReplayAction): ActionResult {
  switch (a.type) {
    case 'purchase':
      return purchaseMutation(s, a.id);
    case 'misinformation':
      return activateMisinformation(s);
    case 'decide':
      return decide(s, a.choice);
    case 'region':
      return switchRegion(s, a.id);
    case 'bubble':
      return collectBubble(s, a.id);
    case 'flash':
      return answerFlash(s, a.choice);
    case 'ability':
      return activateAbility(s, a.id);
  }
}

export function replaySession(log: ReplayLog): ReplayResult {
  const { seed, scenario, region, mode, actions } = log;
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) return { ok: false, reason: 'Seed tidak valid.' };
  if (actions.length > MAX_REPLAY_ACTIONS) return { ok: false, reason: 'Terlalu banyak aksi.' };

  let s = startSession(seed, scenario, region, mode);
  let i = 0;
  while (!isTerminal(s)) {
    while (i < actions.length && actions[i].t === s.elapsedSeconds) {
      const r = applyAction(s, actions[i]);
      if (!r.ok) return { ok: false, reason: `Aksi ke-${i + 1} tidak valid: ${r.reason}` };
      s = r.state;
      i += 1;
    }
    if (i < actions.length && actions[i].t < s.elapsedSeconds) return { ok: false, reason: 'Urutan aksi tidak valid.' };
    if (isTerminal(s)) break;
    if (s.pendingDecision) return { ok: false, reason: 'Momen Penentu tidak dijawab.' };
    if (s.elapsedSeconds >= MAX_REPLAY_TICKS) return { ok: false, reason: 'Sesi terlalu panjang.' };
    s = tick(s);
  }
  if (i < actions.length) return { ok: false, reason: 'Ada aksi setelah sesi selesai.' };
  return { ok: true, state: s };
}

/** Validasi bentuk data dari luar (body request) menjadi ReplayLog. */
export function parseReplayLog(input: unknown): ReplayLog | null {
  if (typeof input !== 'object' || input === null) return null;
  const { seed, scenario, region, mode, actions } = input as { seed?: unknown; scenario?: unknown; region?: unknown; mode?: unknown; actions?: unknown };
  if (typeof seed !== 'number' || !Array.isArray(actions) || actions.length > MAX_REPLAY_ACTIONS) return null;
  if (!isScenarioId(scenario) || typeof region !== 'string' || !(region in REGION_BY_ID) || !isPlayMode(mode)) return null;
  const parsed: ReplayAction[] = [];
  for (const raw of actions) {
    if (typeof raw !== 'object' || raw === null) return null;
    const { t, type, id, choice } = raw as { t?: unknown; type?: unknown; id?: unknown; choice?: unknown };
    if (typeof t !== 'number' || !Number.isInteger(t) || t < 0 || t > MAX_REPLAY_TICKS) return null;
    if (type === 'misinformation') parsed.push({ t, type });
    else if (type === 'purchase' && typeof id === 'string' && id in MUTATION_BY_ID) parsed.push({ t, type, id: id as MutationId });
    else if (type === 'region' && typeof id === 'string' && id in REGION_BY_ID) parsed.push({ t, type, id: id as RegionId });
    else if (type === 'decide' && typeof choice === 'number' && Number.isInteger(choice) && choice >= 0 && choice < 4) parsed.push({ t, type, choice });
    else if (type === 'flash' && (choice === 0 || choice === 1)) parsed.push({ t, type, choice });
    else if (type === 'bubble' && typeof id === 'number' && Number.isInteger(id) && id > 0 && id < 100_000) parsed.push({ t, type, id });
    else if (type === 'ability' && (id === 'surge' || id === 'silent')) parsed.push({ t, type, id });
    else return null;
  }
  return { seed, scenario, region: region as RegionId, mode, actions: parsed };
}
