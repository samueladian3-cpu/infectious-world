import { CONFIG, MAX_PERCENT, MIN_PERCENT } from './config.js';
import { isLiveMission, missionLabel, missionMet } from './missions.js';
import { MUTATION_BY_ID } from './mutations.js';
import { REGION_BY_ID } from './regions.js';
import { SCENARIO_BY_ID, type ScenarioDef } from './scenarios/index.js';
import type {
  ActionResult,
  DecisionDef,
  GameState,
  HistoryEntry,
  MutationId,
  RegionId,
  RegionMod,
  ScenarioId,
  ScenarioRates,
  ShieldEventDef,
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

export const scenarioOf = (s: GameState): ScenarioDef => SCENARIO_BY_ID[s.scenario];
export const regionModOf = (s: GameState): RegionMod => scenarioOf(s).regions[s.region];
export const shieldDef = (s: GameState, id: ShieldEventId): ShieldEventDef => scenarioOf(s).shields[id];
export const SHIELD_IDS: ShieldEventId[] = ['E1', 'E2', 'E3', 'E4'];

export function decisionDef(s: GameState, id: string): DecisionDef | undefined {
  return scenarioOf(s).decisions.find((d) => d.id === id);
}

/* ---------- inisialisasi ---------- */

export function createInitialState(seed = 1, scenario: ScenarioId = 'ispa', region: RegionId = 'pasar'): GameState {
  return {
    scenario,
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
    region,
    regionsVisited: [region],
    regionReadyAt: 0,
    pendingDecision: null,
    nextDecisionAt: CONFIG.decision.firstAt,
    decisionsMade: 0,
    usedDecisions: [],
    lastDecision: null,
    quizCorrect: 0,
    quizAnswered: 0,
    boosts: [],
    missionsDone: [],
    newsTicker: [],
    eventHistory: [],
    outcome: null,
    rngSeed: seed >>> 0,
    nextMessageId: 1,
    announcedMilestones: [],
  };
}

/** Membuat sesi baru yang langsung berjalan. */
export function startSession(seed: number, scenario: ScenarioId = 'ispa', region: RegionId = 'pasar'): GameState {
  const s = createInitialState(seed, scenario, region);
  return pushTicker({ ...s, gameStatus: 'running' }, `${SCENARIO_BY_ID[scenario].intro} Titik awal: ${REGION_BY_ID[region].name}.`, 'info');
}

/* ---------- formula ---------- */

export function baseInfectionGain(stats: Stats, r: ScenarioRates): number {
  return (
    r.infBase +
    r.infPerTransmission * stats.transmissionLevel +
    r.infPerSymptomAboveOne * (stats.symptomVisibilityLevel - 1) +
    r.infPerPersistenceAboveOne * (stats.environmentalPersistenceLevel - 1)
  );
}

export function baseAwarenessGain(stats: Stats, r: ScenarioRates): number {
  return r.awBase + r.awPerSymptom * stats.symptomVisibilityLevel;
}

/** Pengurangan infeksi efektif dari aksi warga aktif, setelah modifier A2 dan wilayah. */
export function effectiveInfectionReduction(state: GameState): number {
  if (!state.activeShield) return 0;
  const def = shieldDef(state, state.activeShield.id);
  const scale = state.unlockedNodes.includes('A2') ? CONFIG.shield.a2ReductionScale : 1;
  return Math.min(0.6, def.infectionReduction * scale * regionModOf(state).shield);
}

/** Bonus kesadaran sementara dari aksi warga aktif, setelah modifier C2 dan wilayah. */
export function effectiveAwarenessBonus(state: GameState): number {
  if (!state.activeShield) return 0;
  const def = shieldDef(state, state.activeShield.id);
  const scale = state.unlockedNodes.includes('C2') ? CONFIG.shield.c2AwarenessBonusScale : 1;
  return def.awarenessBonusPerSecond * scale * regionModOf(state).shield;
}

/** Pengali dari efek Momen Penentu yang masih aktif. */
export function boostMultiplier(state: GameState, key: 'inf' | 'aw'): number {
  return Math.max(0.3, 1 + state.boosts.reduce((sum, b) => sum + b[key], 0));
}

export function currentInfectionGain(state: GameState): number {
  const r = scenarioOf(state).rates;
  return baseInfectionGain(state.stats, r) * regionModOf(state).inf * (1 - effectiveInfectionReduction(state)) * boostMultiplier(state, 'inf');
}

export function currentAwarenessGain(state: GameState): number {
  const r = scenarioOf(state).rates;
  return (baseAwarenessGain(state.stats, r) * regionModOf(state).aw + effectiveAwarenessBonus(state)) * boostMultiplier(state, 'aw');
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

function record(state: GameState, entry: Omit<HistoryEntry, 'at'>, tone: TickerMessage['tone']): GameState {
  return pushTicker(pushHistory(state, entry), entry.message, tone);
}

/* ---------- pemilihan acak ---------- */

/** Memilih aksi warga secara acak, menghindari event yang sama berturut-turut. */
export function pickShieldEvent(lastId: ShieldEventId | null, seed: number): [ShieldEventId, number] {
  const pool = SHIELD_IDS.filter((e) => e !== lastId);
  const [r, nextSeed] = nextRandom(seed);
  const idx = Math.min(pool.length - 1, Math.floor(r * pool.length));
  return [pool[idx], nextSeed];
}

/** Momen Penentu bergantian dilema dan kuis; yang sudah muncul tidak diulang sampai habis. */
export function pickDecision(state: GameState): [string, number] {
  const kind = state.usedDecisions.length % 2 === 0 ? 'dilemma' : 'quiz';
  const all = scenarioOf(state).decisions.filter((d) => d.kind === kind);
  const fresh = all.filter((d) => !state.usedDecisions.includes(d.id));
  const pool = fresh.length ? fresh : all;
  const [r, nextSeed] = nextRandom(state.rngSeed);
  return [pool[Math.min(pool.length - 1, Math.floor(r * pool.length))].id, nextSeed];
}

/* ---------- misi ---------- */

function checkMissions(s: GameState): GameState {
  for (const m of scenarioOf(s).missions) {
    if (s.missionsDone.includes(m.id) || !missionMet(s, m)) continue;
    const live = isLiveMission(m) && !isTerminal(s);
    s = { ...s, missionsDone: [...s.missionsDone, m.id], infectionPoints: s.infectionPoints + (live ? CONFIG.mission.reward : 0) };
    s = record(s, { kind: 'mission', message: `Misi selesai: ${missionLabel(m)}${live ? ` (+${CONFIG.mission.reward} PI)` : ''}.` }, 'good');
  }
  return s;
}

/* ---------- tick ---------- */

/**
 * Memajukan simulasi tepat 1 detik. Fungsi murni: hasil hanya bergantung
 * pada state masukan (termasuk seed PRNG). Simulasi berhenti selama ada
 * Momen Penentu yang belum dijawab.
 */
export function tick(prev: GameState): GameState {
  if (prev.gameStatus !== 'running' || prev.pendingDecision) return prev;

  let s: GameState = { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
  const t = s.elapsedSeconds;

  // 1. Laju dasar + wilayah + aksi warga + efek Momen Penentu pada detik ini.
  s.infectionRate = round(clampPercent(s.infectionRate + currentInfectionGain(s)));
  s.awarenessLevel = round(clampPercent(s.awarenessLevel + currentAwarenessGain(s)));

  // 2. Ekonomi PI: 1 PI setiap 2 detik simulasi.
  if (t % CONFIG.ipIntervalSeconds === 0) s.infectionPoints += 1;

  // 3. Cek Fakta setelah Sebar Hoaks.
  if (s.factCheckDueAt !== null && t >= s.factCheckDueAt) {
    s.awarenessLevel = round(clampPercent(s.awarenessLevel + CONFIG.misinformation.factCheckAwarenessIncrease));
    s.factCheckDueAt = null;
    s = record(s, { kind: 'factcheck', message: `${scenarioOf(s).hoax.factCheck} Kesadaran +${CONFIG.misinformation.factCheckAwarenessIncrease}.` }, 'good');
  }

  // 4. Aksi warga dan efek Momen Penentu yang kedaluwarsa.
  if (s.activeShield && t >= s.activeShield.expiresAt) {
    s = pushTicker({ ...s, activeShield: null }, `Aksi warga selesai: ${shieldDef(s, s.activeShield.id).title}.`, 'info');
  }
  if (s.boosts.some((b) => t >= b.until)) s = { ...s, boosts: s.boosts.filter((b) => t < b.until) };

  // 5. Aksi warga setiap 15 detik simulasi.
  if (t % CONFIG.shield.intervalSeconds === 0) {
    const [id, seed] = pickShieldEvent(s.lastShieldId, s.rngSeed);
    const def = shieldDef(s, id);
    s = {
      ...s,
      rngSeed: seed,
      lastShieldId: id,
      activeShield: { id, startedAt: t, expiresAt: t + def.durationSeconds },
      awarenessLevel: round(clampPercent(s.awarenessLevel + def.immediateAwareness * regionModOf(s).shield)),
    };
    s = record(s, { kind: 'shield', shieldId: id, message: `Aksi warga: ${def.title}.` }, 'warn');
  }

  // 6. Milestone infeksi.
  for (const m of CONFIG.milestones) {
    if (s.infectionRate >= m && !s.announcedMilestones.includes(m)) {
      s = record({ ...s, announcedMilestones: [...s.announcedMilestones, m] }, { kind: 'milestone', message: `Sebaran infeksi simulasi ${m}%.` }, 'bad');
    }
  }

  // 7. Misi, lalu kondisi akhir dari nilai terbaru.
  s = resolveOutcome(checkMissions(s));

  // 8. Momen Penentu berikutnya (simulasi berhenti sampai pemain memilih).
  if (!isTerminal(s) && t >= s.nextDecisionAt) {
    const [id, seed] = pickDecision(s);
    s = { ...s, rngSeed: seed, pendingDecision: { id, at: t }, usedDecisions: [...s.usedDecisions, id] };
  }
  return s;
}

function resolveOutcome(s: GameState): GameState {
  let end: GameState | null = null;
  if (s.awarenessLevel >= MAX_PERCENT) {
    end = record(
      { ...s, gameStatus: 'defeat', outcome: 'defeat' },
      { kind: 'outcome', message: 'Kesadaran warga 100%. Komunitas terlindungi.' },
      'good',
    );
  } else if (s.infectionRate >= MAX_PERCENT) {
    end = record(
      { ...s, gameStatus: 'victory', outcome: 'victory' },
      { kind: 'outcome', message: 'Sebaran infeksi simulasi 100%.' },
      'bad',
    );
  }
  if (!end) return s;
  // Kekalahan diprioritaskan; misi akhir dinilai dari hasil.
  return checkMissions({ ...end, activeShield: null, factCheckDueAt: null, pendingDecision: null, boosts: [] });
}

/* ---------- aksi pemain ---------- */

export type PurchaseCheck = { ok: true } | { ok: false; reason: string };

function actionGate(state: GameState): PurchaseCheck {
  if (!isSessionActive(state)) return { ok: false, reason: 'Simulasi tidak aktif.' };
  if (state.pendingDecision) return { ok: false, reason: 'Jawab Momen Penentu dulu.' };
  return { ok: true };
}

export function canPurchase(state: GameState, id: MutationId): PurchaseCheck {
  const node = MUTATION_BY_ID[id];
  if (!node) return { ok: false, reason: 'Mutasi tidak dikenal.' };
  const gate = actionGate(state);
  if (!gate.ok) return gate;
  if (state.unlockedNodes.includes(id)) return { ok: false, reason: 'Mutasi sudah dibeli.' };
  if (node.prerequisite && !state.unlockedNodes.includes(node.prerequisite)) {
    return { ok: false, reason: `Butuh ${node.prerequisite} terlebih dahulu.` };
  }
  if (state.infectionPoints < node.cost) {
    return { ok: false, reason: `PI kurang (butuh ${node.cost}, punya ${state.infectionPoints}).` };
  }
  return { ok: true };
}

export function purchaseMutation(state: GameState, id: MutationId): ActionResult {
  const check = canPurchase(state, id);
  if (!check.ok) return { ok: false, state, reason: check.reason };
  const node = MUTATION_BY_ID[id];
  const message = `Mutasi ${node.id} "${scenarioOf(state).mutations[id].name}" dibeli (−${node.cost} PI).`;
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
  if (state.pendingDecision) return { ok: false, reason: 'Jawab Momen Penentu dulu.' };
  if (state.misinformationUsed) return { ok: false, reason: 'Sudah digunakan di sesi ini.' };
  if (state.infectionPoints < CONFIG.misinformation.cost) {
    return { ok: false, reason: `PI kurang (butuh ${CONFIG.misinformation.cost}).` };
  }
  return { ok: true };
}

export function activateMisinformation(state: GameState): ActionResult {
  const check = canUseMisinformation(state);
  if (!check.ok) return { ok: false, state, reason: check.reason };
  const m = CONFIG.misinformation;
  const message = `Hoaks menyebar (fiktif): ${scenarioOf(state).hoax.claim} Kesadaran −${m.awarenessReduction}.`;
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

export function canSwitchRegion(state: GameState, id: RegionId): PurchaseCheck {
  const gate = actionGate(state);
  if (!gate.ok) return gate;
  if (!REGION_BY_ID[id]) return { ok: false, reason: 'Wilayah tidak dikenal.' };
  if (state.region === id) return { ok: false, reason: 'Sudah di wilayah ini.' };
  if (state.elapsedSeconds < state.regionReadyAt) return { ok: false, reason: `Tunggu ${state.regionReadyAt - state.elapsedSeconds} dtk lagi.` };
  if (state.infectionPoints < CONFIG.region.switchCost) return { ok: false, reason: `PI kurang (butuh ${CONFIG.region.switchCost}).` };
  return { ok: true };
}

export function switchRegion(state: GameState, id: RegionId): ActionResult {
  const check = canSwitchRegion(state, id);
  if (!check.ok) return { ok: false, state, reason: check.reason };
  const message = `Fokus sebaran pindah ke ${REGION_BY_ID[id].name} (−${CONFIG.region.switchCost} PI).`;
  let next: GameState = {
    ...state,
    region: id,
    regionsVisited: state.regionsVisited.includes(id) ? state.regionsVisited : [...state.regionsVisited, id],
    regionReadyAt: state.elapsedSeconds + CONFIG.region.cooldownSeconds,
    infectionPoints: state.infectionPoints - CONFIG.region.switchCost,
  };
  next = checkMissions(record(next, { kind: 'region', message }, 'info'));
  return { ok: true, state: next, message };
}

export function canDecide(state: GameState, choice: number): PurchaseCheck {
  if (!isSessionActive(state) || !state.pendingDecision) return { ok: false, reason: 'Tidak ada Momen Penentu.' };
  const def = decisionDef(state, state.pendingDecision.id);
  if (!def) return { ok: false, reason: 'Momen Penentu tidak dikenal.' };
  if (def.kind === 'quiz') return choice === 0 || choice === 1 ? { ok: true } : { ok: false, reason: 'Pilihan tidak valid.' };
  const opt = def.options[choice];
  if (!opt) return { ok: false, reason: 'Pilihan tidak valid.' };
  const cost = -(opt.effect.ip ?? 0);
  if (cost > 0 && state.infectionPoints < cost) return { ok: false, reason: `PI kurang (butuh ${cost}).` };
  return { ok: true };
}

/**
 * Menjawab Momen Penentu. Untuk kuis: pilihan 0 = "Fakta", 1 = "Mitos".
 * Untuk dilema: indeks opsi.
 */
export function decide(state: GameState, choice: number): ActionResult {
  const check = canDecide(state, choice);
  if (!check.ok) return { ok: false, state, reason: check.reason };
  const pending = state.pendingDecision!;
  const def = decisionDef(state, pending.id)!;
  const t = state.elapsedSeconds;
  let next: GameState = {
    ...state,
    pendingDecision: null,
    nextDecisionAt: t + CONFIG.decision.intervalSeconds,
    decisionsMade: state.decisionsMade + 1,
  };
  let message: string;

  if (def.kind === 'quiz') {
    const correct = (choice === 0) === def.isTrue;
    next = {
      ...next,
      quizAnswered: next.quizAnswered + 1,
      quizCorrect: next.quizCorrect + (correct ? 1 : 0),
      infectionPoints: next.infectionPoints + (correct ? CONFIG.quiz.reward : 0),
      lastDecision: { id: def.id, choice, correct, at: t },
    };
    message = correct ? `Kuis benar: "${def.claim}" adalah ${def.isTrue ? 'FAKTA' : 'MITOS'} (+${CONFIG.quiz.reward} PI).` : `Kuis salah: "${def.claim}" adalah ${def.isTrue ? 'FAKTA' : 'MITOS'}.`;
    next = record(next, { kind: 'decision', message }, correct ? 'good' : 'info');
  } else {
    const opt = def.options[choice];
    const e = opt.effect;
    next = {
      ...next,
      infectionPoints: next.infectionPoints + (e.ip ?? 0),
      infectionRate: round(clampPercent(next.infectionRate + (e.infection ?? 0))),
      awarenessLevel: round(clampPercent(next.awarenessLevel + (e.awareness ?? 0))),
      boosts: e.boost ? [...next.boosts, { label: def.title, inf: e.boost.inf ?? 0, aw: e.boost.aw ?? 0, until: t + e.boost.seconds }] : next.boosts,
      lastDecision: { id: def.id, choice, at: t },
    };
    message = `${def.title}: ${opt.label}.`;
    next = record(next, { kind: 'decision', message }, 'warn');
  }
  next = resolveOutcome(checkMissions(next));
  return { ok: true, state: next, message };
}

export function setPaused(state: GameState, paused: boolean): GameState {
  if (!isSessionActive(state)) return state;
  return { ...state, gameStatus: paused ? 'paused' : 'running' };
}
