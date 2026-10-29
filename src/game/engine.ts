import { CONFIG, MAX_PERCENT, MIN_PERCENT } from './config.js';
import { SHIELD_BY_ID, SHIELD_EVENTS } from './events.js';
import { MUTATION_BY_ID } from './mutations.js';
import type {
  ActionResult,
  GameState,
  HistoryEntry,
  MutationId,
  ShieldEventId,
  Stats,
  TickerMessage,
} from './types.js';

/* ---------- utilitas murni ---------- */

export const clampPercent = (v: number) => Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, v));
/** Membulatkan agar tidak terjadi galat floating point (mis. 99,99999). */
const round = (v: number) => Math.round(v * 1e6) / 1e6;

/** PRNG mulberry32: mengembalikan [nilai 0..1, seed berikutnya]. */
export function nextRandom(seed: number): [number, number] {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, next];
}

export const isTerminal = (s: GameState) => s.gameStatus === 'victory' || s.gameStatus === 'defeat';
export const isSessionActive = (s: GameState) => s.gameStatus === 'running' || s.gameStatus === 'paused';

/* ---------- inisialisasi ---------- */

export function createInitialState(seed = 1): GameState {
  return {
    currentPathogen: 'rhinovirus',
    gameStatus: 'idle',
    elapsedSeconds: 0,
    infectionPoints: 0,
    infectionRate: 0,
    awarenessLevel: 0,
    stats: { transmissionLevel: 1, symptomVisibilityLevel: 1, environmentalPersistenceLevel: 1 },
    unlockedNodes: [],
    activeShield: null,
    lastShieldId: null,
    misinformationUsed: false,
    factCheckDueAt: null,
    newsTicker: [],
    eventHistory: [],
    outcome: null,
    rngSeed: seed >>> 0,
    nextMessageId: 1,
    announcedMilestones: [],
  };
}

/** Membuat sesi baru yang langsung berjalan. */
export function startSession(seed: number): GameState {
  const s = createInitialState(seed);
  return pushTicker(
    { ...s, gameStatus: 'running' },
    'Rhinovirus fiktif dilepas di Dusun Kuannoah (simulasi).',
    'info',
  );
}

/* ---------- formula ---------- */

export function baseInfectionGain(stats: Stats): number {
  const c = CONFIG.infection;
  return (
    c.base +
    c.perTransmission * stats.transmissionLevel +
    c.perSymptomAboveOne * (stats.symptomVisibilityLevel - 1) +
    c.perPersistenceAboveOne * (stats.environmentalPersistenceLevel - 1)
  );
}

export function baseAwarenessGain(stats: Stats): number {
  return CONFIG.awareness.base + CONFIG.awareness.perSymptom * stats.symptomVisibilityLevel;
}

/** Pengurangan infeksi efektif dari shield aktif, setelah modifier A2. */
export function effectiveInfectionReduction(state: GameState): number {
  if (!state.activeShield) return 0;
  const def = SHIELD_BY_ID[state.activeShield.id];
  const scale = state.unlockedNodes.includes('A2') ? CONFIG.shield.a2ReductionScale : 1;
  return def.infectionReduction * scale;
}

/** Bonus awareness sementara dari shield aktif, setelah modifier C2. */
export function effectiveAwarenessBonus(state: GameState): number {
  if (!state.activeShield) return 0;
  const def = SHIELD_BY_ID[state.activeShield.id];
  const scale = state.unlockedNodes.includes('C2') ? CONFIG.shield.c2AwarenessBonusScale : 1;
  return def.awarenessBonusPerSecond * scale;
}

export function currentInfectionGain(state: GameState): number {
  return baseInfectionGain(state.stats) * (1 - effectiveInfectionReduction(state));
}

export function currentAwarenessGain(state: GameState): number {
  return baseAwarenessGain(state.stats) + effectiveAwarenessBonus(state);
}

/* ---------- pesan & riwayat ---------- */

function pushTicker(state: GameState, text: string, tone: TickerMessage['tone']): GameState {
  const msg: TickerMessage = { id: state.nextMessageId, at: state.elapsedSeconds, text, tone };
  return {
    ...state,
    nextMessageId: state.nextMessageId + 1,
    newsTicker: [msg, ...state.newsTicker].slice(0, CONFIG.tickerLimit),
  };
}

function pushHistory(state: GameState, entry: Omit<HistoryEntry, 'at'>): GameState {
  return { ...state, eventHistory: [...state.eventHistory, { ...entry, at: state.elapsedSeconds }] };
}

function record(
  state: GameState,
  entry: Omit<HistoryEntry, 'at'>,
  tone: TickerMessage['tone'],
): GameState {
  return pushTicker(pushHistory(state, entry), entry.message, tone);
}

/* ---------- pemilihan event ---------- */

/** Memilih event secara acak, menghindari event yang sama berturut-turut. */
export function pickShieldEvent(
  lastId: ShieldEventId | null,
  seed: number,
): [ShieldEventId, number] {
  const pool = SHIELD_EVENTS.filter((e) => e.id !== lastId);
  const candidates = pool.length > 0 ? pool : SHIELD_EVENTS;
  const [r, nextSeed] = nextRandom(seed);
  const idx = Math.min(candidates.length - 1, Math.floor(r * candidates.length));
  return [candidates[idx].id, nextSeed];
}

/* ---------- tick ---------- */

/**
 * Memajukan simulasi tepat 1 detik. Fungsi murni: hasil hanya bergantung
 * pada state masukan (termasuk seed PRNG).
 */
export function tick(prev: GameState): GameState {
  if (prev.gameStatus !== 'running') return prev;

  let s: GameState = { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
  const t = s.elapsedSeconds;

  // 1. Laju dasar + modifier shield yang aktif pada detik ini.
  const infGain = currentInfectionGain(s);
  const awGain = currentAwarenessGain(s);
  s.infectionRate = round(clampPercent(s.infectionRate + infGain));
  s.awarenessLevel = round(clampPercent(s.awarenessLevel + awGain));

  // 2. Ekonomi IP: 1 IP setiap 2 detik simulasi.
  if (t % CONFIG.ipIntervalSeconds === 0) s.infectionPoints += 1;

  // 3. Fact-Check Response setelah Misinformation Surge.
  if (s.factCheckDueAt !== null && t >= s.factCheckDueAt) {
    s.awarenessLevel = round(clampPercent(s.awarenessLevel + CONFIG.misinformation.factCheckAwarenessIncrease));
    s.factCheckDueAt = null;
    s = record(
      s,
      {
        kind: 'factcheck',
        message: `Fact-Check: tenaga kesehatan meluruskan info keliru. Awareness +${CONFIG.misinformation.factCheckAwarenessIncrease}.`,
      },
      'good',
    );
  }

  // 4. Kedaluwarsa shield.
  if (s.activeShield && t >= s.activeShield.expiresAt) {
    const def = SHIELD_BY_ID[s.activeShield.id];
    s = pushTicker({ ...s, activeShield: null }, `Shield selesai: ${def.title}.`, 'info');
  }

  // 5. Penjadwalan Behavior Shield setiap 15 detik simulasi.
  if (t % CONFIG.shield.intervalSeconds === 0) {
    const [id, seed] = pickShieldEvent(s.lastShieldId, s.rngSeed);
    const def = SHIELD_BY_ID[id];
    s = {
      ...s,
      rngSeed: seed,
      lastShieldId: id,
      activeShield: { id, startedAt: t, expiresAt: t + def.durationSeconds },
      awarenessLevel: round(clampPercent(s.awarenessLevel + def.immediateAwareness)),
    };
    s = record(s, { kind: 'shield', shieldId: id, message: `Behavior Shield: ${def.title}. ${def.effectLabel}.` }, 'warn');
  }

  // 6. Milestone infeksi.
  for (const m of CONFIG.milestones) {
    if (s.infectionRate >= m && !s.announcedMilestones.includes(m)) {
      s = record(
        { ...s, announcedMilestones: [...s.announcedMilestones, m] },
        { kind: 'milestone', message: `Infection Progress simulasi ${m}%.` },
        'bad',
      );
    }
  }

  // 7. Kondisi akhir dari nilai terbaru. Kekalahan diprioritaskan.
  return resolveOutcome(s);
}

function resolveOutcome(s: GameState): GameState {
  if (s.awarenessLevel >= MAX_PERCENT) {
    return record(
      { ...s, gameStatus: 'defeat', outcome: 'defeat', activeShield: null, factCheckDueAt: null },
      { kind: 'outcome', message: 'Community Awareness 100%. Komunitas terlindungi.' },
      'good',
    );
  }
  if (s.infectionRate >= MAX_PERCENT) {
    return record(
      { ...s, gameStatus: 'victory', outcome: 'victory', activeShield: null, factCheckDueAt: null },
      { kind: 'outcome', message: 'Infection Progress simulasi 100%.' },
      'bad',
    );
  }
  return s;
}

/* ---------- aksi pemain ---------- */

export type PurchaseCheck = { ok: true } | { ok: false; reason: string };

export function canPurchase(state: GameState, id: MutationId): PurchaseCheck {
  const node = MUTATION_BY_ID[id];
  if (!node) return { ok: false, reason: 'Mutasi tidak dikenal.' };
  if (!isSessionActive(state)) return { ok: false, reason: 'Simulasi tidak aktif.' };
  if (state.unlockedNodes.includes(id)) return { ok: false, reason: 'Mutasi sudah dibeli.' };
  if (node.prerequisite && !state.unlockedNodes.includes(node.prerequisite)) {
    return { ok: false, reason: `Butuh ${node.prerequisite} terlebih dahulu.` };
  }
  if (state.infectionPoints < node.cost) {
    return { ok: false, reason: `IP kurang (butuh ${node.cost}, punya ${state.infectionPoints}).` };
  }
  return { ok: true };
}

export function purchaseMutation(state: GameState, id: MutationId): ActionResult {
  const check = canPurchase(state, id);
  if (!check.ok) return { ok: false, state, reason: check.reason };
  const node = MUTATION_BY_ID[id];
  const message = `Mutasi ${node.id} dibeli (−${node.cost} IP).`;
  let next: GameState = {
    ...state,
    infectionPoints: state.infectionPoints - node.cost,
    unlockedNodes: [...state.unlockedNodes, id],
    stats: { ...state.stats, [node.stat]: state.stats[node.stat] + node.statDelta },
  };
  next = record(next, { kind: 'purchase', message }, 'info');
  return { ok: true, state: next, message };
}

export function canUseMisinformation(state: GameState): PurchaseCheck {
  if (!isSessionActive(state)) return { ok: false, reason: 'Permainan sudah berakhir.' };
  if (state.misinformationUsed) return { ok: false, reason: 'Sudah digunakan di sesi ini.' };
  if (state.infectionPoints < CONFIG.misinformation.cost) {
    return { ok: false, reason: `IP kurang (butuh ${CONFIG.misinformation.cost}).` };
  }
  return { ok: true };
}

export function activateMisinformation(state: GameState): ActionResult {
  const check = canUseMisinformation(state);
  if (!check.ok) return { ok: false, state, reason: check.reason };
  const m = CONFIG.misinformation;
  const message = `Misinformation Surge (fiktif): awareness −${m.awarenessReduction}. Fact-check dalam ${m.factCheckDelaySeconds} dtk.`;
  let next: GameState = {
    ...state,
    infectionPoints: state.infectionPoints - m.cost,
    awarenessLevel: round(clampPercent(state.awarenessLevel - m.awarenessReduction)),
    misinformationUsed: true,
    factCheckDueAt: state.elapsedSeconds + m.factCheckDelaySeconds,
  };
  next = record(next, { kind: 'misinformation', message }, 'bad');
  return { ok: true, state: next, message };
}

export function setPaused(state: GameState, paused: boolean): GameState {
  if (!isSessionActive(state)) return state;
  return { ...state, gameStatus: paused ? 'paused' : 'running' };
}
