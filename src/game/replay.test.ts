import { describe, expect, it } from 'vitest';
import { activateAbility, activateMisinformation, answerFlash, collectBubble, decide, isTerminal, purchaseMutation, startSession, switchRegion, tick } from './engine';
import { parseReplayLog, replaySession, type ReplayAction } from './replay';
import type { MutationId, PlayMode, RegionId, ScenarioId } from './types';

/** Memainkan sesi seperti pemain: beli mutasi saat mampu, jawab Momen Penentu, catat aksi. */
function play(seed: number, scenario: ScenarioId, region: RegionId, order: MutationId[], misAtAwareness = 999, moveTo?: RegionId, mode: PlayMode = 'normal') {
  let s = startSession(seed, scenario, region, mode);
  const actions: ReplayAction[] = [];
  const queue = [...order];
  let moved = false;
  while (!isTerminal(s)) {
    if (s.pendingDecision) {
      const choice = s.decisionsMade % 2;
      const r = decide(s, choice);
      const ok = r.ok ? r : decide(s, 0);
      actions.push({ t: s.elapsedSeconds, type: 'decide', choice: r.ok ? choice : 0 });
      s = ok.state;
      continue;
    }
    if (queue.length) {
      const r = purchaseMutation(s, queue[0]);
      if (r.ok) {
        actions.push({ t: s.elapsedSeconds, type: 'purchase', id: queue.shift()! });
        s = r.state;
      }
    }
    if (moveTo && !moved && s.infectionPoints >= 10) {
      const r = switchRegion(s, moveTo);
      if (r.ok) {
        actions.push({ t: s.elapsedSeconds, type: 'region', id: moveTo });
        s = r.state;
        moved = true;
      }
    }
    // Ambil gelembung berselang-seling, jawab Fakta Cepat, dan pakai kemampuan bila siap.
    const bubble = s.bubbles.find((b) => b.id % 2 === 1);
    if (bubble) {
      actions.push({ t: s.elapsedSeconds, type: 'bubble', id: bubble.id });
      s = collectBubble(s, bubble.id).state;
    }
    if (s.flash && s.elapsedSeconds - s.flash.startedAt === 2) {
      const choice = s.quizAnswered % 2;
      actions.push({ t: s.elapsedSeconds, type: 'flash', choice });
      s = answerFlash(s, choice).state;
    }
    for (const id of ['surge', 'silent'] as const) {
      const r = activateAbility(s, id);
      if (r.ok && (id === 'surge' ? s.infectionRate > 30 : s.awarenessLevel > 60)) {
        actions.push({ t: s.elapsedSeconds, type: 'ability', id });
        s = r.state;
      }
    }
    if (s.awarenessLevel >= misAtAwareness) {
      const r = activateMisinformation(s);
      if (r.ok) {
        actions.push({ t: s.elapsedSeconds, type: 'misinformation' });
        s = r.state;
      }
    }
    s = tick(s);
  }
  return { final: s, actions };
}

describe('replaySession', () => {
  it('menghasilkan state akhir yang identik dengan sesi asli', () => {
    for (const [seed, sc, reg, order, mis, move, mode] of [
      [7, 'ispa', 'sekolah', ['A1', 'A2', 'C1'], 85, 'pasar', 'normal'],
      [99, 'dbd', 'permukiman', ['A1', 'C1'], 999, undefined, 'santai'],
      [3, 'hiv', 'pasar', ['B1', 'A1'], 80, 'puskesmas', 'tantangan'],
    ] as const) {
      const { final, actions } = play(seed, sc, reg, [...order], mis, move, mode);
      expect(actions.some((a) => a.type === 'bubble')).toBe(true);
      expect(actions.some((a) => a.type === 'flash')).toBe(true);
      const r = replaySession({ seed, scenario: sc, region: reg, mode, actions });
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.state.outcome).toBe(final.outcome);
        expect(r.state.elapsedSeconds).toBe(final.elapsedSeconds);
        expect(r.state.infectionRate).toBe(final.infectionRate);
        expect(r.state.missionsDone).toEqual(final.missionsDone);
        expect(r.state.infectionPoints).toBe(final.infectionPoints);
        expect(r.state.bubblesCollected).toBe(final.bubblesCollected);
      }
    }
  });

  it('menolak sesi yang tidak menjawab Momen Penentu', () => {
    const r = replaySession({ seed: 1, scenario: 'ispa', region: 'pasar', mode: 'normal', actions: [] });
    expect(r).toEqual({ ok: false, reason: 'Momen Penentu tidak dijawab.' });
  });

  it('menolak aksi yang tidak mungkin (PI belum cukup)', () => {
    const r = replaySession({ seed: 1, scenario: 'ispa', region: 'pasar', mode: 'normal', actions: [{ t: 3, type: 'purchase', id: 'A2' }] });
    expect(r.ok).toBe(false);
  });

  it('menolak urutan aksi mundur', () => {
    const r = replaySession({
      seed: 1,
      scenario: 'ispa',
      region: 'pasar',
      mode: 'normal',
      actions: [
        { t: 15, type: 'decide', choice: 0 },
        { t: 5, type: 'purchase', id: 'B1' },
      ],
    });
    expect(r.ok).toBe(false);
  });

  it('parseReplayLog hanya menerima bentuk yang valid', () => {
    const ok = {
      seed: 1,
      scenario: 'tb',
      region: 'sekolah',
      mode: 'santai',
      actions: [
        { t: 3, type: 'decide', choice: 1 },
        { t: 4, type: 'region', id: 'pasar' },
        { t: 5, type: 'bubble', id: 2 },
        { t: 6, type: 'flash', choice: 0 },
        { t: 7, type: 'ability', id: 'silent' },
      ],
    };
    expect(parseReplayLog(ok)).not.toBeNull();
    expect(parseReplayLog({ ...ok, mode: undefined })).toBeNull();
    expect(parseReplayLog({ ...ok, mode: 'mudah' })).toBeNull();
    expect(parseReplayLog({ ...ok, actions: [{ t: 1, type: 'ability', id: 'teleport' }] })).toBeNull();
    expect(parseReplayLog({ ...ok, actions: [{ t: 1, type: 'flash', choice: 2 }] })).toBeNull();
    expect(parseReplayLog({ ...ok, actions: [{ t: 1, type: 'bubble', id: 1.5 }] })).toBeNull();
    expect(parseReplayLog({ seed: 1, scenario: 'flu', region: 'sekolah', mode: 'normal', actions: [] })).toBeNull();
    expect(parseReplayLog({ seed: 1, scenario: 'tb', region: 'kota', mode: 'normal', actions: [] })).toBeNull();
    expect(parseReplayLog({ seed: 1, scenario: 'tb', region: 'pasar', actions: [{ t: 1, type: 'decide', choice: 7 }] })).toBeNull();
    expect(parseReplayLog({ seed: 1, scenario: 'tb', region: 'pasar', actions: [{ t: 1, type: 'purchase', id: 'Z9' }] })).toBeNull();
    expect(parseReplayLog(null)).toBeNull();
  });
});
