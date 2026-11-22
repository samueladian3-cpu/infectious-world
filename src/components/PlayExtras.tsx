import { useEffect, useRef, useState } from 'react';
import type { Advice } from '../game/advisor';
import { CONFIG } from '../game/config';
import { abilityState, canUseAbility, flashReward, quizDef, scenarioOf } from '../game/engine';
import type { AbilityId, GameState } from '../game/types';
import { PathogenArt } from './PathogenArt';
import { Ico, Ring } from './ui';

/* ---------- Gelembung PI ---------- */

interface Pop {
  id: number;
  x: number;
  y: number;
  text: string;
}

/** Lapisan gelembung PI di area peta antara HUD atas dan bawah. */
export function BubbleField({ state, onCollect, bottomInset = 0 }: { state: GameState; onCollect: (id: number) => void; bottomInset?: number }) {
  const [pops, setPops] = useState<Pop[]>([]);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const sc = scenarioOf(state);
  const t = state.elapsedSeconds;
  const running = state.gameStatus === 'running';

  const collect = (id: number, x: number, y: number, value: number) => {
    if (!running) return;
    onCollect(id);
    setPops((p) => [...p.slice(-4), { id, x, y, text: `+${value}` }]);
    timers.current.push(window.setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 800));
  };

  return (
    <div className="bubble-field" style={{ bottom: bottomInset }} aria-label="Gelembung Poin Infeksi">
      {state.bubbles.map((b) => {
        const left = b.expiresAt - t;
        return (
          <button
            key={b.id}
            type="button"
            className={`bubble${b.gold ? ' bubble-gold' : ''}${left <= 2 ? ' bubble-fading' : ''}`}
            style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%` }}
            onClick={() => collect(b.id, b.x, b.y, b.value)}
            aria-label={`Ambil gelembung ${b.value} PI`}
            data-sfx="none"
          >
            <span className="bubble-art" aria-hidden="true">
              <PathogenArt id={sc.pathogen} size="100%" />
            </span>
            <span className="bubble-val">+{b.value}</span>
          </button>
        );
      })}
      {pops.map((p) => (
        <span key={p.id} className="bubble-pop" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} aria-hidden="true">
          {p.text} PI
        </span>
      ))}
    </div>
  );
}

/* ---------- Fakta Cepat ---------- */

/** Kartu kuis kecil yang tidak menghentikan simulasi, plus umpan balik singkat setelah dijawab. */
export function FlashCard({ state, onAnswer }: { state: GameState; onAnswer: (choice: number) => void }) {
  const t = state.elapsedSeconds;
  const [shownResult, setShownResult] = useState<number | null>(null);
  const last = state.lastFlash;
  const fresh = last && t - last.at <= 4 && shownResult !== last.at;

  useEffect(() => {
    if (!last) return;
    const id = window.setTimeout(() => setShownResult(last.at), 5000);
    return () => window.clearTimeout(id);
  }, [last]);

  if (state.flash) {
    const def = quizDef(state, state.flash.id);
    if (!def) return null;
    const left = state.flash.expiresAt - t;
    const reward = flashReward(state.quizStreak);
    return (
      <div className="flash-card" role="group" aria-label="Fakta Cepat">
        <div className="flash-head">
          <span className="flash-k">
            <Ico name="bolt" size={16} stroke={2.6} />
            FAKTA CEPAT · +{reward} PI
          </span>
          {state.quizStreak >= 1 && (
            <span className="streak-chip">
              <Ico name="flame" size={14} stroke={2.4} />
              {state.quizStreak}
            </span>
          )}
          <span className="flash-ring">
            <Ring r={11} size={28} width={3.5} fraction={left / CONFIG.flash.answerSeconds} track="#CDBB9C" fill="#FFF8EC" ink="#7A55B0" />
            <span>{left}</span>
          </span>
        </div>
        <p className="flash-claim">{def.claim}</p>
        <div className="flash-actions">
          <button type="button" className="btn btn-flash-true" onClick={() => onAnswer(0)} data-sfx="none">
            FAKTA
          </button>
          <button type="button" className="btn btn-flash-false" onClick={() => onAnswer(1)} data-sfx="none">
            MITOS
          </button>
        </div>
      </div>
    );
  }

  if (fresh && last) {
    const def = quizDef(state, last.id);
    if (!def) return null;
    return (
      <div className={`flash-card flash-result ${last.correct ? 'is-good' : 'is-bad'}`} role="status">
        <div className="flash-head">
          <span className="flash-k">
            <Ico name={last.correct ? 'check' : 'x'} size={16} stroke={3} />
            {last.correct ? `BENAR · +${last.reward} PI` : 'BELUM TEPAT'} · {def.isTrue ? 'FAKTA' : 'MITOS'}
          </span>
          <button type="button" className="flash-close" onClick={() => setShownResult(last.at)} aria-label="Tutup">
            <Ico name="close" size={16} stroke={2.8} />
          </button>
        </div>
        <p className="flash-expl">{def.explanation}</p>
      </div>
    );
  }
  return null;
}

/* ---------- Kemampuan aktif ---------- */

export function AbilityBar({ state, onUse, onBlocked }: { state: GameState; onUse: (id: AbilityId) => void; onBlocked: (reason: string) => void }) {
  const sc = scenarioOf(state);
  return (
    <div className="ability-row" role="group" aria-label="Kemampuan aktif">
      {(['surge', 'silent'] as AbilityId[]).map((id) => {
        const a = abilityState(state, id);
        const chk = canUseAbility(state, id);
        const text = sc.abilities[id];
        const sub = a.active ? `Aktif · ${a.left} dtk` : a.wait > 0 ? `Siap ${a.wait} dtk` : `${a.cfg.cost} PI`;
        const frac = a.active ? a.left / a.cfg.seconds : a.wait > 0 ? 1 - a.wait / a.cfg.cooldown : 1;
        return (
          <button
            key={id}
            type="button"
            className={`btn ability ability-${id}${chk.ok ? ' is-ready' : ''}${a.active ? ' is-active' : ''}`}
            aria-disabled={!chk.ok}
            data-sfx={chk.ok ? 'none' : undefined}
            title={text.lesson}
            onClick={() => (chk.ok ? onUse(id) : onBlocked(`${text.name}: ${chk.reason}`))}
            aria-label={`${text.name}. ${id === 'surge' ? `Infeksi ${Math.round((CONFIG.ability.surge.infMult - 1) * 100)}% lebih cepat` : 'Kesadaran warga berhenti naik'} selama ${a.cfg.seconds} detik. ${sub}`}
          >
            <span className="ability-ring" aria-hidden="true">
              <Ring r={14} size={36} width={3.5} fraction={frac} track="rgba(42,30,22,.25)" fill="transparent" ink="currentColor" />
              <Ico name={id === 'surge' ? 'bolt' : 'hush'} size={17} stroke={2.5} />
            </span>
            <span className="ability-text">
              <span className="ability-name">{text.name}</span>
              <span className="ability-sub">
                {id === 'surge' ? `Infeksi +${Math.round((CONFIG.ability.surge.infMult - 1) * 100)}%` : 'Kesadaran berhenti'} · {sub}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Penasihat strategi ---------- */

export function AdvisorTip({ advice, onHide }: { advice: Advice; onHide: () => void }) {
  return (
    <div className={`advisor advisor-${advice.tone}`} role="status" aria-live="polite">
      <span className="advisor-ico" aria-hidden="true">
        <Ico name="bulb" size={20} stroke={2.4} />
      </span>
      <span className="advisor-text">
        <span className="advisor-k">PENASIHAT</span> {advice.text}
      </span>
      <button type="button" className="advisor-close" onClick={onHide} aria-label="Sembunyikan penasihat">
        <Ico name="close" size={16} stroke={2.8} />
      </button>
    </div>
  );
}
