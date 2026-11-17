import { useEffect, useRef } from 'react';
import type { Preferences } from '../game/storage';
import type { GameState, HistoryKind } from '../game/types';
import { audio, type Mood, type Sfx } from './audio';

/** Ambang kesadaran warga yang dianggap krisis bagi patogen. */
export const CRISIS_AT = 80;

const KIND_SFX: Partial<Record<HistoryKind, Sfx>> = {
  shield: 'event',
  purchase: 'buy',
  misinformation: 'hoax',
  factcheck: 'notify',
  mission: 'achievement',
  region: 'region',
};

/**
 * Menghubungkan audio ke aplikasi: membuka AudioContext pada gestur pertama,
 * bunyi klik untuk semua tombol, suasana musik per layar, dan efek suara dari
 * perubahan state game (dibaca dari riwayat peristiwa).
 */
export function useGameAudio(screen: string, state: GameState, prefs: Preferences) {
  useEffect(() => {
    audio.configure(prefs);
  }, [prefs]);

  useEffect(() => {
    const unlock = () => audio.unlock();
    const click = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('button, [role="tab"], a');
      if (!el || (el as HTMLElement).dataset.sfx === 'none') return;
      const disabled = el.getAttribute('aria-disabled') === 'true' || (el as HTMLButtonElement).disabled;
      audio.play(disabled ? 'error' : ((el as HTMLElement).dataset.sfx as Sfx | undefined) ?? 'click');
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    document.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      document.removeEventListener('click', click, true);
    };
  }, []);

  const inGame = screen === 'game';
  const mood: Mood = inGame ? 'game' : screen === 'result' ? (state.outcome === 'victory' ? 'win' : 'lose') : 'menu';
  useEffect(() => {
    audio.setMood(mood);
  }, [mood]);

  useEffect(() => {
    audio.setIntensity(Math.max(state.infectionRate, state.awarenessLevel) / 100, inGame && state.awarenessLevel >= CRISIS_AT);
    audio.setDucked(inGame && (state.gameStatus === 'paused' || state.pendingDecision !== null));
  }, [inGame, state.infectionRate, state.awarenessLevel, state.gameStatus, state.pendingDecision]);

  const prev = useRef(state);
  useEffect(() => {
    const p = prev.current;
    prev.current = state;
    if (p === state || !inGame) return;
    if (state.eventHistory.length < p.eventHistory.length) return; // sesi baru
    for (const h of state.eventHistory.slice(p.eventHistory.length)) {
      if (h.kind === 'outcome') audio.play(state.outcome === 'victory' ? 'victory' : 'defeat');
      else if (h.kind === 'decision') audio.play(state.lastDecision?.correct === true ? 'correct' : state.lastDecision?.correct === false ? 'wrong' : 'select');
      else if (KIND_SFX[h.kind]) audio.play(KIND_SFX[h.kind]!);
    }
    if (state.pendingDecision && !p.pendingDecision) audio.play('decision');
    if (state.awarenessLevel >= CRISIS_AT && p.awarenessLevel < CRISIS_AT && !state.outcome) audio.play('crisis');
  }, [state, inGame]);
}
