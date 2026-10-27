/**
 * Parameter penyeimbang (balancing). Semua nilai adalah mekanik permainan,
 * bukan estimasi risiko infeksi atau efektivitas intervensi di dunia nyata.
 */
export const CONFIG = {
  /** 1 IP diberikan setiap N detik simulasi. */
  ipIntervalSeconds: 2,
  infection: {
    base: 0.14,
    perTransmission: 0.12,
    perSymptomAboveOne: 0.05,
    perPersistenceAboveOne: 0.04,
  },
  awareness: {
    base: 0.08,
    perSymptom: 0.14,
  },
  shield: {
    intervalSeconds: 15,
    /** A2: penalti relatif event dikurangi menjadi 80% dari nilai aslinya. */
    a2ReductionScale: 0.8,
    /** C2: bonus laju awareness sementara dari event dikurangi menjadi 75%. */
    c2AwarenessBonusScale: 0.75,
  },
  misinformation: {
    cost: 50,
    awarenessReduction: 8,
    factCheckDelaySeconds: 8,
    factCheckAwarenessIncrease: 10,
  },
  milestones: [25, 50, 75],
  tickerLimit: 6,
  /** Durasi satu detik simulasi dalam milidetik, per kecepatan. */
  tickMs: { normal: 1000, fast: 500 },
} as const;

export const MAX_PERCENT = 100;
export const MIN_PERCENT = 0;
