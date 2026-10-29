import { useCallback, useEffect, useReducer } from 'react';
import { CONFIG } from './config';
import { activateMisinformation, createInitialState, purchaseMutation, setPaused, startSession, tick } from './engine';
import type { ReplayAction } from './replay';
import type { GameState, MutationId } from './types';
import type { SpeedPref } from './storage';

type Action =
  | { type: 'start'; seed: number }
  | { type: 'tick' }
  | { type: 'purchase'; id: MutationId }
  | { type: 'misinformation' }
  | { type: 'pause'; paused: boolean }
  | { type: 'reset' };

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'start':
      return startSession(action.seed);
    case 'tick':
      return tick(state);
    case 'purchase':
      return purchaseMutation(state, action.id).state;
    case 'misinformation':
      return activateMisinformation(state).state;
    case 'pause':
      return setPaused(state, action.paused);
    case 'reset':
      return createInitialState();
  }
}

interface Session {
  state: GameState;
  seed: number;
  /** Aksi yang berhasil, untuk verifikasi skor papan peringkat. */
  actions: ReplayAction[];
}

function sessionReducer(session: Session, action: Action): Session {
  const state = gameReducer(session.state, action);
  if (action.type === 'start') return { state, seed: action.seed, actions: [] };
  if (state === session.state) return session;
  const t = session.state.elapsedSeconds;
  if (action.type === 'purchase') return { ...session, state, actions: [...session.actions, { t, type: 'purchase', id: action.id }] };
  if (action.type === 'misinformation') return { ...session, state, actions: [...session.actions, { t, type: 'misinformation' }] };
  return { ...session, state };
}

export const newSeed = () => (Math.random() * 2 ** 32) >>> 0;

/**
 * Satu-satunya pemilik timer simulasi. Interval hanya ada selama status
 * 'running' dan selalu dibersihkan saat status berubah atau komponen dilepas,
 * sehingga render ulang tidak pernah menggandakan timer.
 */
export function useGameEngine(speed: SpeedPref) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => ({
    state: createInitialState(),
    seed: 1,
    actions: [],
  }));
  const running = session.state.gameStatus === 'running';
  const tickMs = CONFIG.tickMs[speed];

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => dispatch({ type: 'tick' }), tickMs);
    return () => window.clearInterval(id);
  }, [running, tickMs]);

  return {
    state: session.state,
    replay: { seed: session.seed, actions: session.actions },
    start: useCallback((seed: number = newSeed()) => dispatch({ type: 'start', seed }), []),
    purchase: useCallback((id: MutationId) => dispatch({ type: 'purchase', id }), []),
    misinformation: useCallback(() => dispatch({ type: 'misinformation' }), []),
    pause: useCallback((paused: boolean) => dispatch({ type: 'pause', paused }), []),
    reset: useCallback(() => dispatch({ type: 'reset' }), []),
  };
}
