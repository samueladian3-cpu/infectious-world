/**
 * Parameter penyeimbang (balancing). Semua nilai adalah mekanik permainan,
 * bukan estimasi risiko infeksi atau efektivitas intervensi di dunia nyata.
 * Laju dasar per penyakit ada di src/game/scenarios.
 */
export const CONFIG = {
  /** 1 PI diberikan setiap N detik simulasi. */
  ipIntervalSeconds: 2,
  shield: {
    intervalSeconds: 15,
    /** A2: penalti relatif event dikurangi menjadi 80% dari nilai aslinya. */
    a2ReductionScale: 0.8,
    /** C2: bonus laju kesadaran sementara dari event dikurangi menjadi 75%. */
    c2AwarenessBonusScale: 0.75,
  },
  misinformation: {
    cost: 40,
    awarenessReduction: 8,
    factCheckDelaySeconds: 8,
    factCheckAwarenessIncrease: 10,
  },
  region: {
    /** Biaya pindah wilayah fokus (PI). */
    switchCost: 6,
    /** Jeda sebelum boleh pindah lagi (detik simulasi). */
    cooldownSeconds: 20,
  },
  decision: {
    /** Momen Penentu pertama dan jarak antarmomen (detik simulasi). Pola: kuis, dilema, kuis, kuis, dilema, ... */
    firstAt: 15,
    intervalSeconds: 22,
  },
  quiz: {
    /** Hadiah jawaban benar (PI) + bonus beruntun: reward + min(beruntun, streakMax) × streakStep. */
    reward: 8,
    streakStep: 2,
    streakMax: 4,
  },
  flash: {
    /** Fakta Cepat: kuis kecil yang tidak menghentikan simulasi. */
    firstAt: 30,
    intervalSeconds: 26,
    answerSeconds: 10,
    /** Hadiah + min(beruntun, streakMax) PI. */
    reward: 5,
  },
  bubble: {
    /** Gelembung PI di peta: muncul tiap minGap–maxGap detik, hilang setelah lifeSeconds. */
    firstAt: 3,
    minGap: 4,
    maxGap: 7,
    lifeSeconds: 7,
    max: 3,
    values: [2, 2, 3, 3, 4],
    goldChance: 0.1,
    goldValue: 8,
  },
  ability: {
    /** Lonjakan: laju infeksi × infMult selama seconds. */
    surge: { cost: 10, seconds: 10, cooldown: 40, infMult: 1.5 },
    /** Fase Senyap: kesadaran warga tidak naik dengan sendirinya selama seconds. */
    silent: { cost: 12, seconds: 8, cooldown: 45 },
  },
  /** Pengali per tingkat kesulitan. */
  modes: {
    santai: { inf: 1, aw: 0.85, startIp: 10 },
    normal: { inf: 1, aw: 1.08, startIp: 0 },
    tantangan: { inf: 0.95, aw: 1.42, startIp: 0 },
  },
  mission: {
    /** Hadiah misi yang selesai di tengah sesi (PI). */
    reward: 5,
  },
  milestones: [25, 50, 75],
  tickerLimit: 6,
  /** Durasi satu detik simulasi dalam milidetik, per kecepatan. */
  tickMs: { normal: 1000, fast: 500 },
} as const;

export const MAX_PERCENT = 100;
export const MIN_PERCENT = 0;
