import { describe, expect, it } from 'vitest';
import { activateMisinformation, isTerminal, purchaseMutation, startSession, tick } from './engine';
import { parseReplayLog, replaySession, type ReplayAction } from './replay';
import type { MutationId } from './types';

/** Memainkan sesi seperti pemain: beli mutasi saat mampu, catat aksi. */
function play(seed: number, order: MutationId[], misAtAwareness = 999) {
  let s = startSession(seed);
  const actions: ReplayAction[] = [];
  const queue = [...order];
  while (!isTerminal(s)) {
    if (queue.length) {
      const r = purchaseMutation(s, queue[0]);
      if (r.ok) {
        actions.push({ t: s.elapsedSeconds, type: 'purchase', id: queue.shift()! });
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
    for (const seed of [1, 7, 42, 2024]) {
      const { final, actions } = play(seed, ['A1', 'A2', 'C1'], 85);
      const r = replaySession(seed, actions);
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(r.state.outcome).toBe(final.outcome);
      expect(r.state.elapsedSeconds).toBe(final.elapsedSeconds);
      expect(r.state.infectionRate).toBe(final.infectionRate);
      expect(r.state.unlockedNodes).toEqual(final.unlockedNodes);
    }
  });

  it('tanpa aksi, sesi berakhir kalah', () => {
    const r = replaySession(5, []);
    expect(r.ok && r.state.outcome).toBe('defeat');
  });

  it('menolak aksi yang tidak mungkin (IP belum cukup)', () => {
    const r = replaySession(5, [{ t: 0, type: 'purchase', id: 'A1' }]);
    expect(r).toEqual({ ok: false, reason: expect.stringMatching(/IP kurang/) });
  });

  it('menolak urutan aksi mundur dan aksi setelah sesi selesai', () => {
    expect(replaySession(5, [{ t: 60, type: 'purchase', id: 'A1' }, { t: 50, type: 'purchase', id: 'C1' }]).ok).toBe(false);
    expect(replaySession(5, [{ t: 1500, type: 'misinformation' }]).ok).toBe(false);
  });

  it('parseReplayLog hanya menerima bentuk yang valid', () => {
    expect(parseReplayLog({ seed: 3, actions: [{ t: 40, type: 'purchase', id: 'B1' }] })).toEqual({ seed: 3, actions: [{ t: 40, type: 'purchase', id: 'B1' }] });
    expect(parseReplayLog({ seed: 3, actions: [{ t: 40, type: 'purchase', id: 'Z9' }] })).toBeNull();
    expect(parseReplayLog({ seed: 3, actions: [{ t: -1, type: 'misinformation' }] })).toBeNull();
    expect(parseReplayLog({ seed: '3', actions: [] })).toBeNull();
    expect(parseReplayLog(null)).toBeNull();
  });
});
