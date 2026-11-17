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
    /** Momen Penentu pertama dan jarak antarmomen (detik simulasi). */
    firstAt: 22,
    intervalSeconds: 38,
  },
  quiz: {
    /** Hadiah jawaban benar (PI). */
    reward: 8,
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
