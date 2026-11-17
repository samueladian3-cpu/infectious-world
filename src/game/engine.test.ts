import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import {
  activateMisinformation,
  baseAwarenessGain,
  baseInfectionGain,
  canPurchase,
  currentInfectionGain,
  decide,
  decisionDef,
  effectiveInfectionReduction,
  pickShieldEvent,
  purchaseMutation,
  shieldDef,
  startSession,
  switchRegion,
  tick,
} from './engine';
import { SCENARIOS, SCENARIO_BY_ID } from './scenarios';
import { gameReducer } from './useGameEngine';
import type { GameState, QuizDef } from './types';

const run = (s: GameState, n: number) => {
  for (let i = 0; i < n; i++) s = tick(s);
  return s;
};
const withIP = (s: GameState, ip: number): GameState => ({ ...s, infectionPoints: ip });
/** Maju sampai Momen Penentu muncul, lalu kembalikan state-nya. */
const toDecision = (s: GameState) => {
  while (!s.pendingDecision) s = tick(s);
  return s;
};
const L1 = { transmissionLevel: 1, symptomVisibilityLevel: 1, environmentalPersistenceLevel: 1 };

describe('inisialisasi', () => {
  it('sesi baru dimulai dari nol di skenario dan wilayah pilihan', () => {
    const s = startSession(123, 'dbd', 'permukiman');
    expect(s).toMatchObject({
      scenario: 'dbd',
      region: 'permukiman',
      regionsVisited: ['permukiman'],
      gameStatus: 'running',
      infectionPoints: 0,
      infectionRate: 0,
      awarenessLevel: 0,
      elapsedSeconds: 0,
      unlockedNodes: [],
      pendingDecision: null,
      outcome: null,
      stats: L1,
    });
    expect(s.newsTicker[0].text).toContain('Permukiman Tepi Kali');
  });
});

describe('ekonomi PI', () => {
  it('bertambah tepat 1 setiap 2 detik simulasi', () => {
    let s = startSession(1);
    s = tick(s);
    expect(s.infectionPoints).toBe(0);
    s = tick(s);
    expect(s.infectionPoints).toBe(1);
    s = run(s, 12); // t = 14
    expect(s.infectionPoints).toBe(7);
  });

  it('tick tidak berjalan saat dijeda', () => {
    const s = gameReducer(startSession(1), { type: 'pause', paused: true });
    expect(tick(s)).toBe(s);
  });
});

describe('formula per penyakit dan wilayah', () => {
  it('laju dasar mengikuti parameter skenario', () => {
    const r = SCENARIO_BY_ID.ispa.rates;
    expect(baseInfectionGain(L1, r)).toBeCloseTo(r.infBase + r.infPerTransmission);
    expect(baseInfectionGain({ transmissionLevel: 3, symptomVisibilityLevel: 2, environmentalPersistenceLevel: 3 }, r)).toBeCloseTo(
      r.infBase + 3 * r.infPerTransmission + r.infPerSymptomAboveOne + 2 * r.infPerPersistenceAboveOne,
    );
    expect(baseAwarenessGain({ ...L1, symptomVisibilityLevel: 3 }, r)).toBeCloseTo(r.awBase + 3 * r.awPerSymptom);
  });

  it('pengali wilayah diterapkan setiap detik sebelum event pertama', () => {
    const sc = SCENARIO_BY_ID.tb;
    const s = run(startSession(1, 'tb', 'permukiman'), 14);
    expect(s.infectionRate).toBeCloseTo(baseInfectionGain(L1, sc.rates) * sc.regions.permukiman.inf * 14, 5);
    expect(s.awarenessLevel).toBeCloseTo(baseAwarenessGain(L1, sc.rates) * sc.regions.permukiman.aw * 14, 5);
  });

  it('wilayah sekitar puskesmas memperkuat aksi warga', () => {
    const base = { ...startSession(1, 'ispa', 'pasar'), activeShield: { id: 'E1' as const, startedAt: 0, expiresAt: 8 } };
    const near = { ...base, region: 'puskesmas' as const };
    expect(effectiveInfectionReduction(near)).toBeCloseTo(effectiveInfectionReduction(base) * SCENARIO_BY_ID.ispa.regions.puskesmas.shield);
  });

  it('nilai selalu di antara 0 dan 100', () => {
    let s: GameState = { ...startSession(1), infectionRate: 99.9, awarenessLevel: 50 };
    s = tick(s);
    expect(s.infectionRate).toBe(100);
    s = activateMisinformation(withIP({ ...startSession(1), awarenessLevel: 3 }, 60)).state;
    expect(s.awarenessLevel).toBe(0);
  });
});

describe('aksi warga', () => {
  it('muncul setiap 15 detik dan tidak sama berturut-turut', () => {
    let s = startSession(42, 'diare', 'pasar');
    let last: string | null = null;
    let lastStart = -1;
    for (let t = 1; t <= 300; t++) {
      s = s.pendingDecision ? decide(s, 0).state : tick(s);
      if (s.gameStatus !== 'running') break;
      if (s.activeShield && s.activeShield.startedAt === s.elapsedSeconds && s.elapsedSeconds !== lastStart) {
        lastStart = s.elapsedSeconds;
        expect(s.elapsedSeconds % CONFIG.shield.intervalSeconds).toBe(0);
        expect(s.activeShield.id).not.toBe(last);
        last = s.activeShield.id;
      }
    }
  });

  it('pickShieldEvent deterministik untuk seed yang sama', () => {
    expect(pickShieldEvent('E1', 99)).toEqual(pickShieldEvent('E1', 99));
    expect(pickShieldEvent('E1', 99)[0]).not.toBe('E1');
  });

  it('A2 mengurangi penalti infeksi menjadi 80%, tidak menghilangkannya', () => {
    const s = { ...startSession(1), activeShield: { id: 'E1' as const, startedAt: 0, expiresAt: 8 } };
    const withA2 = { ...s, unlockedNodes: ['A1' as const, 'A2' as const] };
    const red = shieldDef(s, 'E1').infectionReduction;
    expect(effectiveInfectionReduction(s)).toBeCloseTo(red);
    expect(effectiveInfectionReduction(withA2)).toBeCloseTo(red * 0.8);
    expect(effectiveInfectionReduction(withA2)).toBeGreaterThan(0);
  });
});

describe('Pohon Mutasi', () => {
  it('memotong PI, menaikkan level, dan menolak pembelian tidak valid', () => {
    const s = withIP(startSession(1), 30);
    expect(canPurchase(s, 'A2').ok).toBe(false);
    const r = purchaseMutation(s, 'A1');
    expect(r.ok).toBe(true);
    expect(r.state.infectionPoints).toBe(5);
    expect(r.state.stats.transmissionLevel).toBe(2);
    expect(purchaseMutation(r.state, 'A1').ok).toBe(false);
    expect(purchaseMutation(withIP(startSession(1), 10), 'B1').ok).toBe(false);
  });
});

describe('Momen Penentu', () => {
  it('muncul pada detik yang dijadwalkan dan menghentikan simulasi', () => {
    const s = toDecision(startSession(5));
    expect(s.elapsedSeconds).toBe(CONFIG.decision.firstAt);
    expect(tick(s)).toBe(s);
    expect(canPurchase(withIP(s, 99), 'A1').ok).toBe(false);
  });

  it('dilema pertama, lalu kuis, bergantian', () => {
    let s = toDecision(startSession(5));
    expect(decisionDef(s, s.pendingDecision!.id)?.kind).toBe('dilemma');
    s = decide(s, 0).state;
    s = toDecision(s);
    expect(decisionDef(s, s.pendingDecision!.id)?.kind).toBe('quiz');
    expect(s.elapsedSeconds).toBe(CONFIG.decision.firstAt + CONFIG.decision.intervalSeconds);
  });

  it('kuis benar memberi PI, kuis salah tidak', () => {
    let s = toDecision(startSession(5));
    s = decide(s, 0).state;
    s = toDecision(s);
    const q = decisionDef(s, s.pendingDecision!.id) as QuizDef;
    const right = decide(s, q.isTrue ? 0 : 1).state;
    const wrong = decide(s, q.isTrue ? 1 : 0).state;
    expect(right.infectionPoints - s.infectionPoints).toBe(CONFIG.quiz.reward);
    expect(right.quizCorrect).toBe(1);
    expect(right.lastDecision?.correct).toBe(true);
    expect(wrong.infectionPoints).toBe(s.infectionPoints);
    expect(wrong.quizCorrect).toBe(0);
    expect(wrong.quizAnswered).toBe(1);
  });

  it('efek dilema diterapkan dan boost berakhir tepat waktu', () => {
    const s = toDecision(startSession(5));
    const def = decisionDef(s, s.pendingDecision!.id)!;
    if (def.kind !== 'dilemma') throw new Error('harus dilema');
    const i = def.options.findIndex((o) => o.effect.boost);
    if (i < 0) return;
    const e = def.options[i].effect;
    const after = decide(s, i).state;
    expect(after.pendingDecision).toBeNull();
    expect(after.boosts).toHaveLength(1);
    expect(currentInfectionGain(after)).not.toBeCloseTo(currentInfectionGain(s));
    const later = run(after, e.boost!.seconds);
    expect(later.boosts).toHaveLength(0);
  });

  it('pilihan tidak valid ditolak', () => {
    const s = toDecision(startSession(5));
    expect(decide(s, 9).ok).toBe(false);
    expect(decide(startSession(5), 0).ok).toBe(false);
  });
});

describe('wilayah', () => {
  it('pindah wilayah memotong PI, memberi jeda, dan mencatat wilayah baru', () => {
    const s = withIP(startSession(1, 'ispa', 'pasar'), 20);
    expect(switchRegion(s, 'pasar').ok).toBe(false);
    const r = switchRegion(s, 'sekolah');
    expect(r.ok).toBe(true);
    expect(r.state.infectionPoints).toBe(20 - CONFIG.region.switchCost);
    expect(r.state.regionsVisited).toEqual(['pasar', 'sekolah']);
    expect(switchRegion(r.state, 'permukiman').ok).toBe(false);
    const ready = { ...r.state, elapsedSeconds: r.state.regionReadyAt };
    expect(switchRegion(ready, 'permukiman').ok).toBe(true);
  });

  it('misi "jelajahi wilayah" selesai di tengah sesi dan memberi bonus PI', () => {
    let s = withIP(startSession(1, 'diare', 'pasar'), 50);
    s = switchRegion(s, 'sekolah').state;
    s = switchRegion({ ...s, elapsedSeconds: s.regionReadyAt }, 'permukiman').state;
    expect(s.missionsDone).toContain('diare-regions');
    expect(s.infectionPoints).toBe(50 - 2 * CONFIG.region.switchCost + CONFIG.mission.reward);
  });
});

describe('Sebar Hoaks & Cek Fakta', () => {
  it('kesadaran turun, lalu Cek Fakta menaikkannya 8 detik kemudian', () => {
    const s0 = withIP({ ...startSession(1, 'hiv', 'pasar'), awarenessLevel: 30 }, 60);
    const s = activateMisinformation(s0).state;
    expect(s.awarenessLevel).toBe(30 - CONFIG.misinformation.awarenessReduction);
    expect(s.newsTicker[0].text).toContain('nyamuk');
    const later = run(s, CONFIG.misinformation.factCheckDelaySeconds);
    expect(later.factCheckDueAt).toBeNull();
    expect(later.eventHistory.some((h) => h.kind === 'factcheck')).toBe(true);
    expect(activateMisinformation(withIP(later, 99)).ok).toBe(false);
  });
});

describe('akhir permainan', () => {
  it('kekalahan diutamakan bila kedua bar mencapai 100% bersamaan', () => {
    const s = tick({ ...startSession(1), infectionRate: 99.99, awarenessLevel: 99.99 });
    expect(s.outcome).toBe('defeat');
  });

  it('misi kemenangan dinilai saat menang', () => {
    const s = tick({ ...startSession(1), infectionRate: 99.99 });
    expect(s.outcome).toBe('victory');
    expect(s.missionsDone).toContain('ispa-win');
    expect(s.missionsDone).toContain('ispa-fast');
  });

  it('tanpa aksi apa pun, warga selalu menang', () => {
    for (const sc of SCENARIOS) {
      let s = startSession(3, sc.id, 'pasar');
      while (s.gameStatus === 'running') s = s.pendingDecision ? decide(s, 0).state : tick(s);
      expect(s.outcome, sc.id).toBe('defeat');
    }
  });
});

describe('konten skenario', () => {
  it('setiap penyakit punya 4 aksi warga, ≥4 dilema, ≥4 kuis, dan 3 misi', () => {
    for (const sc of SCENARIOS) {
      expect(Object.keys(sc.shields)).toEqual(['E1', 'E2', 'E3', 'E4']);
      expect(sc.decisions.filter((d) => d.kind === 'dilemma').length).toBeGreaterThanOrEqual(4);
      expect(sc.decisions.filter((d) => d.kind === 'quiz').length).toBeGreaterThanOrEqual(4);
      expect(sc.missions).toHaveLength(3);
      for (const d of sc.decisions) if (d.kind === 'dilemma') expect(d.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('HIV tidak pernah digambarkan menular lewat udara, sentuhan, makan bersama, atau nyamuk', () => {
    const hiv = SCENARIO_BY_ID.hiv;
    const casual = /udara|batuk|bersin|pelukan|berpelukan|jabat|makan bersama|nyamuk|sentuh/i;
    for (const d of hiv.decisions) {
      if (d.kind === 'quiz' && casual.test(d.claim)) expect(d.isTrue, d.claim).toBe(false);
    }
    const all = JSON.stringify(hiv.shields) + JSON.stringify(hiv.mutations);
    expect(all).not.toMatch(/lewat udara|lewat batuk|lewat bersin/i);
  });
});
