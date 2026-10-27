import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import {
  activateMisinformation,
  baseAwarenessGain,
  baseInfectionGain,
  createInitialState,
  pickShieldEvent,
  purchaseMutation,
  startSession,
  tick,
} from './engine';
import { gameReducer } from './useGameEngine';
import type { GameState } from './types';

const run = (s: GameState, n: number) => {
  for (let i = 0; i < n; i++) s = tick(s);
  return s;
};
const withIP = (s: GameState, ip: number): GameState => ({ ...s, infectionPoints: ip });

describe('inisialisasi (AC-004)', () => {
  it('sesi baru memakai nilai awal PRD', () => {
    const s = startSession(123);
    expect(s).toMatchObject({
      gameStatus: 'running',
      infectionPoints: 0,
      infectionRate: 0,
      awarenessLevel: 0,
      elapsedSeconds: 0,
      unlockedNodes: [],
      misinformationUsed: false,
      activeShield: null,
      outcome: null,
      stats: { transmissionLevel: 1, symptomVisibilityLevel: 1, environmentalPersistenceLevel: 1 },
    });
  });
});

describe('ekonomi IP (AC-005)', () => {
  it('bertambah tepat 1 setiap 2 detik simulasi', () => {
    let s = startSession(1);
    s = tick(s);
    expect(s.infectionPoints).toBe(0);
    s = tick(s);
    expect(s.infectionPoints).toBe(1);
    s = run(s, 12); // t = 14 (sebelum event pertama)
    expect(s.infectionPoints).toBe(7);
    s = run(s, 86); // t = 100
    expect(s.infectionPoints).toBe(50);
  });

  it('tick tidak berjalan saat dijeda', () => {
    const s = gameReducer(startSession(1), { type: 'pause', paused: true });
    expect(tick(s)).toBe(s);
  });
});

describe('formula (AC-006)', () => {
  it('sesuai formula PRD untuk level awal dan level lain', () => {
    expect(baseInfectionGain({ transmissionLevel: 1, symptomVisibilityLevel: 1, environmentalPersistenceLevel: 1 })).toBeCloseTo(0.26);
    expect(baseInfectionGain({ transmissionLevel: 3, symptomVisibilityLevel: 2, environmentalPersistenceLevel: 3 })).toBeCloseTo(0.14 + 0.36 + 0.05 + 0.08);
    expect(baseAwarenessGain({ transmissionLevel: 1, symptomVisibilityLevel: 1, environmentalPersistenceLevel: 1 })).toBeCloseTo(0.22);
    expect(baseAwarenessGain({ transmissionLevel: 1, symptomVisibilityLevel: 3, environmentalPersistenceLevel: 1 })).toBeCloseTo(0.5);
  });

  it('nilai bertambah per detik sesuai formula sebelum event pertama', () => {
    const s = run(startSession(1), 14);
    expect(s.infectionRate).toBeCloseTo(0.26 * 14, 5);
    expect(s.awarenessLevel).toBeCloseTo(0.22 * 14, 5);
  });

  it('nilai selalu di antara 0 dan 100', () => {
    let s: GameState = { ...startSession(1), infectionRate: 99.9, awarenessLevel: 50 };
    s = tick(s);
    expect(s.infectionRate).toBe(100);
    s = { ...startSession(1), awarenessLevel: 3 };
    s = activateMisinformation(withIP(s, 60)).state;
    expect(s.awarenessLevel).toBe(0);
  });
});

describe('Behavior Shield (AC-007)', () => {
  it('terpicu setiap 15 detik dan kedaluwarsa setelah 8 detik', () => {
    let s = run(startSession(5), 14);
    expect(s.activeShield).toBeNull();
    s = tick(s); // t=15
    expect(s.activeShield).not.toBeNull();
    expect(s.activeShield!.expiresAt).toBe(23);
    s = run(s, 7); // t=22
    expect(s.activeShield).not.toBeNull();
    s = tick(s); // t=23
    expect(s.activeShield).toBeNull();
    s = run(s, 7); // t=30
    expect(s.activeShield?.startedAt).toBe(30);
    expect(s.eventHistory.filter((e) => e.kind === 'shield')).toHaveLength(2);
  });

  it('E1 mengurangi laju infeksi 25% selama aktif, lalu efek hilang', () => {
    let s: GameState = { ...startSession(1), elapsedSeconds: 30, activeShield: { id: 'E1', startedAt: 30, expiresAt: 38 } };
    const before = s.infectionRate;
    s = tick(s);
    expect(s.infectionRate - before).toBeCloseTo(0.26 * 0.75, 5);
    s = { ...s, elapsedSeconds: 38, activeShield: null };
    const b2 = s.infectionRate;
    s = tick(s);
    expect(s.infectionRate - b2).toBeCloseTo(0.26, 5);
  });

  it('E3 memberi awareness langsung +5 dan bonus laju', () => {
    let s: GameState = { ...startSession(1), elapsedSeconds: 30, activeShield: { id: 'E3', startedAt: 30, expiresAt: 38 } };
    const before = s.awarenessLevel;
    s = tick(s);
    expect(s.awarenessLevel - before).toBeCloseTo(0.22 + 0.1, 5);
  });

  it('tidak memilih event yang sama berturut-turut', () => {
    let seed = 99;
    let last = null as ReturnType<typeof pickShieldEvent>[0] | null;
    for (let i = 0; i < 500; i++) {
      const [id, next] = pickShieldEvent(last, seed);
      expect(id).not.toBe(last);
      last = id;
      seed = next;
    }
  });

  it('A2 mengurangi penalti shield tanpa menghilangkannya', () => {
    const s: GameState = {
      ...startSession(1),
      unlockedNodes: ['A1', 'A2'],
      stats: { transmissionLevel: 3, symptomVisibilityLevel: 1, environmentalPersistenceLevel: 1 },
      elapsedSeconds: 30,
      activeShield: { id: 'E1', startedAt: 30, expiresAt: 38 },
    };
    const gain = tick(s).infectionRate - s.infectionRate;
    const base = 0.14 + 0.36;
    expect(gain).toBeCloseTo(base * (1 - 0.25 * CONFIG.shield.a2ReductionScale), 5);
    expect(gain).toBeLessThan(base);
  });
});

describe('Mutation Tree (AC-008, AC-009)', () => {
  it('pembelian valid memotong biaya dan menerapkan efek sekali', () => {
    const s = withIP(startSession(1), 30);
    const r = purchaseMutation(s, 'A1');
    expect(r.ok).toBe(true);
    expect(r.state.infectionPoints).toBe(5);
    expect(r.state.stats.transmissionLevel).toBe(2);
    expect(r.state.unlockedNodes).toEqual(['A1']);
    const again = purchaseMutation(withIP(r.state, 100), 'A1');
    expect(again.ok).toBe(false);
    expect(again.state.stats.transmissionLevel).toBe(2);
    expect(again.state.infectionPoints).toBe(100);
  });

  it('IP kurang tidak mengubah state', () => {
    const s = withIP(startSession(1), 19);
    const r = purchaseMutation(s, 'B1');
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
  });

  it('prasyarat belum terpenuhi tidak mengubah state', () => {
    const s = withIP(startSession(1), 500);
    const r = purchaseMutation(s, 'C2');
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
  });

  it('tidak bisa membeli setelah permainan berakhir', () => {
    const s: GameState = { ...withIP(startSession(1), 500), gameStatus: 'defeat', outcome: 'defeat' };
    expect(purchaseMutation(s, 'A1').ok).toBe(false);
  });

  it('B1 menaikkan awareness lebih kuat daripada infeksi (trade-off)', () => {
    const s = purchaseMutation(withIP(startSession(1), 20), 'B1').state;
    expect(baseInfectionGain(s.stats) - 0.26).toBeCloseTo(0.05);
    expect(baseAwarenessGain(s.stats) - 0.22).toBeCloseTo(0.14);
  });
});

describe('Misinformation Surge (AC-010)', () => {
  it('memotong 50 IP, awareness −8, lalu fact-check +10 setelah 8 detik', () => {
    let s: GameState = { ...withIP(startSession(1), 60), awarenessLevel: 20, elapsedSeconds: 16 };
    const r = activateMisinformation(s);
    expect(r.ok).toBe(true);
    s = r.state;
    expect(s.infectionPoints).toBe(10);
    expect(s.awarenessLevel).toBe(12);
    expect(s.factCheckDueAt).toBe(24);
    s = run(s, 7); // t=23
    expect(s.eventHistory.some((e) => e.kind === 'factcheck')).toBe(false);
    const before = s.awarenessLevel;
    const s2 = tick(s); // t=24
    expect(s2.eventHistory.some((e) => e.kind === 'factcheck')).toBe(true);
    expect(s2.awarenessLevel).toBeCloseTo(before + 0.22 + 10, 5);
  });

  it('hanya bisa dipakai sekali dan butuh IP cukup', () => {
    const used = activateMisinformation(withIP(startSession(1), 200)).state;
    const again = activateMisinformation(used);
    expect(again.ok).toBe(false);
    expect(again.state).toBe(used);
    expect(activateMisinformation(withIP(startSession(1), 49)).ok).toBe(false);
  });
});

describe('kondisi akhir (AC-011, AC-012)', () => {
  it('menang tepat saat Infection Progress mencapai 100%', () => {
    const s = tick({ ...startSession(1), infectionRate: 99.8, awarenessLevel: 10 });
    expect(s.gameStatus).toBe('victory');
    expect(s.outcome).toBe('victory');
  });

  it('kalah tepat saat Community Awareness mencapai 100%', () => {
    const s = tick({ ...startSession(1), infectionRate: 10, awarenessLevel: 99.9 });
    expect(s.gameStatus).toBe('defeat');
  });

  it('kekalahan diutamakan jika keduanya tercapai di tick yang sama', () => {
    const s = tick({ ...startSession(1), infectionRate: 99.9, awarenessLevel: 99.9 });
    expect(s.outcome).toBe('defeat');
  });

  it('tidak menang sebelum 100%', () => {
    const s = tick({ ...startSession(1), infectionRate: 99, awarenessLevel: 0 });
    expect(s.gameStatus).toBe('running');
  });

  it('engine berhenti setelah outcome dan menyimpan statistik akhir', () => {
    const end = tick({ ...startSession(1), infectionRate: 99.9 });
    const after = run(end, 20);
    expect(after).toBe(end);
    expect(end.eventHistory.at(-1)?.kind).toBe('outcome');
    expect(activateMisinformation(withIP(end, 100)).ok).toBe(false);
  });

  it('kedua outcome dapat terjadi dalam permainan normal', () => {
    // Diam saja: komunitas menang.
    let idle = startSession(1);
    while (idle.gameStatus === 'running') idle = tick(idle);
    expect(idle.outcome).toBe('defeat');
    // Strategi transmisi: setidaknya satu seed menghasilkan kemenangan.
    let wins = 0;
    for (let seed = 1; seed <= 20; seed++) {
      let s = startSession(seed);
      const plan: ('A1' | 'A2')[] = ['A1', 'A2'];
      while (s.gameStatus === 'running') {
        s = tick(s);
        if (plan.length) {
          const r = purchaseMutation(s, plan[0]);
          if (r.ok) {
            s = r.state;
            plan.shift();
          }
        }
      }
      if (s.outcome === 'victory') wins++;
    }
    expect(wins).toBeGreaterThan(0);
    expect(wins).toBeLessThan(20);
  });
});

describe('reset (AC-013)', () => {
  it('sesi baru tidak mewarisi state lama', () => {
    let s = withIP(startSession(1), 200);
    s = purchaseMutation(s, 'A1').state;
    s = activateMisinformation(s).state;
    s = run(s, 30);
    const fresh = gameReducer(s, { type: 'start', seed: 2 });
    expect(fresh).toEqual(startSession(2));
    expect(gameReducer(s, { type: 'reset' })).toEqual(createInitialState());
  });
});
