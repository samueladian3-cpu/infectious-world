export type GameStatus = 'idle' | 'running' | 'paused' | 'victory' | 'defeat';
export type Outcome = 'victory' | 'defeat' | null;

export type MutationBranch = 'transmission' | 'symptom' | 'persistence';
export type StatKey = 'transmissionLevel' | 'symptomVisibilityLevel' | 'environmentalPersistenceLevel';

export type MutationId = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface MutationNode {
  id: MutationId;
  name: string;
  branch: MutationBranch;
  cost: number;
  prerequisite: MutationId | null;
  description: string;
  effects: string[];
  stat: StatKey;
  /** Jumlah kenaikan level statistik. */
  statDelta: number;
}

export type ShieldEventId = 'E1' | 'E2' | 'E3' | 'E4';

export interface ShieldEventDef {
  id: ShieldEventId;
  title: string;
  description: string;
  effectLabel: string;
  durationSeconds: number;
  /** Pengurangan relatif laju infeksi selama event aktif (0.25 = 25%). */
  infectionReduction: number;
  /** Kenaikan langsung Community Awareness (poin persen). */
  immediateAwareness: number;
  /** Tambahan laju awareness per detik selama event aktif. */
  awarenessBonusPerSecond: number;
}

export interface ActiveShield {
  id: ShieldEventId;
  startedAt: number;
  expiresAt: number;
}

export interface Stats {
  transmissionLevel: number;
  symptomVisibilityLevel: number;
  environmentalPersistenceLevel: number;
}

export type HistoryKind = 'shield' | 'purchase' | 'misinformation' | 'factcheck' | 'milestone' | 'outcome';

export interface HistoryEntry {
  at: number;
  kind: HistoryKind;
  message: string;
  shieldId?: ShieldEventId;
}

export interface TickerMessage {
  id: number;
  at: number;
  text: string;
  tone: 'info' | 'good' | 'warn' | 'bad';
}

export interface GameState {
  currentPathogen: 'rhinovirus';
  gameStatus: GameStatus;
  elapsedSeconds: number;
  infectionPoints: number;
  /** Infection Progress, 0–100. */
  infectionRate: number;
  /** Community Awareness, 0–100. */
  awarenessLevel: number;
  stats: Stats;
  unlockedNodes: MutationId[];
  activeShield: ActiveShield | null;
  lastShieldId: ShieldEventId | null;
  misinformationUsed: boolean;
  /** Detik simulasi saat Fact-Check Response akan terjadi. */
  factCheckDueAt: number | null;
  newsTicker: TickerMessage[];
  eventHistory: HistoryEntry[];
  outcome: Outcome;
  /** Seed PRNG agar pemilihan event acak tetap deterministik. */
  rngSeed: number;
  nextMessageId: number;
  /** Ambang milestone infeksi yang sudah diumumkan. */
  announcedMilestones: number[];
}

export type ActionResult =
  | { ok: true; state: GameState; message: string }
  | { ok: false; state: GameState; reason: string };
