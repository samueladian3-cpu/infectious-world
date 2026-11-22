export type GameStatus = 'idle' | 'running' | 'paused' | 'victory' | 'defeat';
export type Outcome = 'victory' | 'defeat' | null;

/** Tingkat kesulitan sesi (berbeda dari tingkat bawaan tiap penyakit). */
export type PlayMode = 'santai' | 'normal' | 'tantangan';
/** Kemampuan aktif patogen. */
export type AbilityId = 'surge' | 'silent';

/** Skenario penyakit yang dapat dimainkan. */
export type ScenarioId = 'ispa' | 'diare' | 'dbd' | 'tb' | 'hiv';
/** Wilayah Dusun Kuannoah; tiap skenario memberi karakter berbeda per wilayah. */
export type RegionId = 'pasar' | 'sekolah' | 'permukiman' | 'puskesmas';
/** Fasilitas di dunia 3D (sumber gelombang aksi warga). */
export type FacilityKey = 'pasar' | 'puskesmas' | 'sekolah' | 'balai' | 'posyandu' | 'warung';

export type MutationBranch = 'transmission' | 'symptom' | 'persistence';
export type StatKey = 'transmissionLevel' | 'symptomVisibilityLevel' | 'environmentalPersistenceLevel';

export type MutationId = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/** Bagian mekanik mutasi yang sama untuk semua skenario. Nama dan deskripsi ada di skenario. */
export interface MutationNode {
  id: MutationId;
  branch: MutationBranch;
  cost: number;
  prerequisite: MutationId | null;
  stat: StatKey;
  /** Jumlah kenaikan level statistik. */
  statDelta: number;
}

export interface MutationText {
  name: string;
  description: string;
  /** Pelajaran dunia nyata yang terkait, ditampilkan di Pohon Mutasi. */
  realWorld: string;
}

/** Slot aksi warga. E1–E2 memperlambat infeksi, E3–E4 menaikkan kesadaran warga. */
export type ShieldEventId = 'E1' | 'E2' | 'E3' | 'E4';

export type EvIconName =
  | 'hands'
  | 'mask'
  | 'symptom'
  | 'edu'
  | 'water'
  | 'ors'
  | 'vaccine'
  | 'larva'
  | 'net'
  | 'search'
  | 'window'
  | 'pill'
  | 'test'
  | 'shield';

export interface ShieldEventDef {
  id: ShieldEventId;
  title: string;
  description: string;
  durationSeconds: number;
  /** Pengurangan relatif laju infeksi selama event aktif (0.25 = 25%). */
  infectionReduction: number;
  /** Kenaikan langsung kesadaran warga (poin persen). */
  immediateAwareness: number;
  /** Tambahan laju kesadaran per detik selama event aktif. */
  awarenessBonusPerSecond: number;
  icon: EvIconName;
  source: FacilityKey;
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

/** Laju dasar per skenario (poin persen per detik simulasi). */
export interface ScenarioRates {
  infBase: number;
  infPerTransmission: number;
  infPerSymptomAboveOne: number;
  infPerPersistenceAboveOne: number;
  awBase: number;
  awPerSymptom: number;
}

export interface RegionMod {
  /** Pengali laju infeksi. */
  inf: number;
  /** Pengali laju kesadaran warga. */
  aw: number;
  /** Pengali kekuatan aksi warga di wilayah ini. */
  shield: number;
  /** Karakter/tantangan wilayah untuk skenario ini. */
  note: string;
}

export interface DecisionEffect {
  ip?: number;
  infection?: number;
  awareness?: number;
  /** Pengubah laju sementara (relatif, 0.3 = +30%). */
  boost?: { inf?: number; aw?: number; seconds: number };
}

export interface DecisionOption {
  label: string;
  /** Ringkasan konsekuensi, ditampilkan sebelum memilih. */
  detail: string;
  effect: DecisionEffect;
}

export interface DilemmaDef {
  id: string;
  kind: 'dilemma';
  title: string;
  body: string;
  options: DecisionOption[];
  /** Fakta kesehatan yang ditampilkan setelah memilih. */
  fact: string;
  dexId: PathogenId;
}

export interface QuizDef {
  id: string;
  kind: 'quiz';
  claim: string;
  isTrue: boolean;
  explanation: string;
  dexId: PathogenId;
}

export type DecisionDef = DilemmaDef | QuizDef;

export type MissionDef =
  | { id: string; kind: 'win' }
  | { id: string; kind: 'winUnder'; seconds: number }
  | { id: string; kind: 'winNoHoax' }
  | { id: string; kind: 'winNoBranch'; branch: MutationBranch }
  | { id: string; kind: 'quiz'; count: number }
  | { id: string; kind: 'regions'; count: number }
  | { id: string; kind: 'survive'; seconds: number };

/** Entri Patho-Dex. */
export type PathogenId =
  | 'rhinovirus'
  | 'influenza'
  | 'pneumococcus'
  | 'tb'
  | 'hiv'
  | 'dengue'
  | 'ecoli'
  | 'rotavirus'
  | 'plasmodium'
  | 'entamoeba';

export type HistoryKind =
  | 'shield'
  | 'purchase'
  | 'misinformation'
  | 'factcheck'
  | 'milestone'
  | 'outcome'
  | 'decision'
  | 'region'
  | 'mission'
  | 'flash'
  | 'ability';

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

export interface Boost {
  label: string;
  inf: number;
  aw: number;
  until: number;
}

export interface PendingDecision {
  id: string;
  at: number;
}

export interface LastDecision {
  id: string;
  choice: number;
  /** Untuk kuis: apakah jawaban benar. */
  correct?: boolean;
  /** PI yang didapat dari jawaban ini (kuis). */
  reward?: number;
  at: number;
}

/** Gelembung PI di peta; diklik pemain sebelum kedaluwarsa. Posisi relatif 0–1. */
export interface Bubble {
  id: number;
  x: number;
  y: number;
  value: number;
  gold: boolean;
  expiresAt: number;
}

/** Kuis Fakta Cepat: tidak menghentikan simulasi, harus dijawab sebelum expiresAt. */
export interface FlashQuiz {
  id: string;
  startedAt: number;
  expiresAt: number;
}

export interface LastFlash {
  id: string;
  choice: number;
  correct: boolean;
  reward: number;
  at: number;
}

export interface GameState {
  scenario: ScenarioId;
  mode: PlayMode;
  gameStatus: GameStatus;
  elapsedSeconds: number;
  infectionPoints: number;
  /** Sebaran Infeksi, 0–100. */
  infectionRate: number;
  /** Kesadaran Warga, 0–100. */
  awarenessLevel: number;
  stats: Stats;
  unlockedNodes: MutationId[];
  activeShield: ActiveShield | null;
  lastShieldId: ShieldEventId | null;
  misinformationUsed: boolean;
  /** Detik simulasi saat Cek Fakta akan terjadi. */
  factCheckDueAt: number | null;
  /** Wilayah fokus sebaran saat ini. */
  region: RegionId;
  regionsVisited: RegionId[];
  /** Detik simulasi saat wilayah boleh diganti lagi. */
  regionReadyAt: number;
  /** Momen Penentu yang menunggu jawaban; simulasi berhenti selama ada. */
  pendingDecision: PendingDecision | null;
  nextDecisionAt: number;
  decisionsMade: number;
  usedDecisions: string[];
  lastDecision: LastDecision | null;
  quizCorrect: number;
  quizAnswered: number;
  /** Jawaban kuis benar berturut-turut (Momen Penentu dan Fakta Cepat). */
  quizStreak: number;
  bestStreak: number;
  bubbles: Bubble[];
  nextBubbleAt: number;
  nextBubbleId: number;
  bubblesCollected: number;
  flash: FlashQuiz | null;
  nextFlashAt: number;
  lastFlash: LastFlash | null;
  /** Kemampuan aktif: detik berakhirnya efek (null = tidak aktif) dan detik siap dipakai lagi. */
  surgeUntil: number | null;
  silentUntil: number | null;
  surgeReadyAt: number;
  silentReadyAt: number;
  abilitiesUsed: number;
  boosts: Boost[];
  missionsDone: string[];
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
