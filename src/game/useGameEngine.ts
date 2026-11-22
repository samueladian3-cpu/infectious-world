import { useCallback, useEffect, useReducer } from 'react';
import { CONFIG } from './config';
import { createInitialState, setPaused, startSession, tick } from './engine';
import { applyAction, type ReplayAction, type ReplayLog } from './replay';
import type { AbilityId, GameState, MutationId, PlayMode, RegionId, ScenarioId } from './types';
import type { SpeedPref } from './storage';

type PlayerAction =
  | { type: 'purchase'; id: MutationId }
  | { type: 'misinformation' }
  | { type: 'decide'; choice: number }
  | { type: 'region'; id: RegionId }
  | { type: 'bubble'; id: number }
  | { type: 'flash'; choice: number }
  | { type: 'ability'; id: AbilityId };

type Action =
  | { type: 'start'; seed: number; scenario: ScenarioId; region: RegionId; mode: PlayMode }
  | { type: 'tick' }
  | { type: 'pause'; paused: boolean }
  | { type: 'reset' }
  | PlayerAction;

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'start':
      return startSession(action.seed, action.scenario, action.region, action.mode);
    case 'tick':
      return tick(state);
    case 'pause':
      return setPaused(state, action.paused);
    case 'reset':
      return createInitialState();
    default:
      return applyAction(state, { ...action, t: state.elapsedSeconds } as ReplayAction).state;
  }
}

interface Session {
  state: GameState;
  log: ReplayLog;
}

function sessionReducer(session: Session, action: Action): Session {
  const state = gameReducer(session.state, action);
  if (action.type === 'start') return { state, log: { seed: action.seed, scenario: action.scenario, region: action.region, mode: action.mode, actions: [] } };
  if (state === session.state) return session;
  if (action.type === 'tick' || action.type === 'pause' || action.type === 'reset') return { ...session, state };
  // Aksi pemain yang berhasil dicatat untuk verifikasi skor papan peringkat.
  const entry = { ...action, t: session.state.elapsedSeconds } as ReplayAction;
  return { state, log: { ...session.log, actions: [...session.log.actions, entry] } };
}

export const newSeed = () => (Math.random() * 2 ** 32) >>> 0;

/**
 * Satu-satunya pemilik timer simulasi. Interval hanya ada selama status
 * 'running' tanpa Momen Penentu yang menunggu, dan selalu dibersihkan saat
 * status berubah atau komponen dilepas, sehingga timer tidak pernah ganda.
 */
export function useGameEngine(speed: SpeedPref) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, (): Session => ({
    state: createInitialState(),
    log: { seed: 1, scenario: 'ispa', region: 'pasar', mode: 'normal', actions: [] },
  }));
  const running = session.state.gameStatus === 'running' && !session.state.pendingDecision;
  const tickMs = CONFIG.tickMs[speed];

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => dispatch({ type: 'tick' }), tickMs);
    return () => window.clearInterval(id);
  }, [running, tickMs]);

  return {
    state: session.state,
    replay: session.log,
    start: useCallback(
      (scenario: ScenarioId, region: RegionId, mode: PlayMode = 'normal', seed: number = newSeed()) => dispatch({ type: 'start', seed, scenario, region, mode }),
      [],
    ),
    purchase: useCallback((id: MutationId) => dispatch({ type: 'purchase', id }), []),
    misinformation: useCallback(() => dispatch({ type: 'misinformation' }), []),
    decide: useCallback((choice: number) => dispatch({ type: 'decide', choice }), []),
    switchRegion: useCallback((id: RegionId) => dispatch({ type: 'region', id }), []),
    collectBubble: useCallback((id: number) => dispatch({ type: 'bubble', id }), []),
    answerFlash: useCallback((choice: number) => dispatch({ type: 'flash', choice }), []),
    ability: useCallback((id: AbilityId) => dispatch({ type: 'ability', id }), []),
    pause: useCallback((paused: boolean) => dispatch({ type: 'pause', paused }), []),
    reset: useCallback(() => dispatch({ type: 'reset' }), []),
  };
}
