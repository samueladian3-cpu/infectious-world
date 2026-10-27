import { useState } from 'react';
import { CommunityMap } from '../components/CommunityMap';
import { Icon } from '../components/Icon';
import { Meter } from '../components/Meter';
import { Modal } from '../components/Modal';
import { MutationTree } from '../components/MutationTree';
import { useToast } from '../components/Toast';
import { CONFIG } from '../game/config';
import {
  canUseMisinformation,
  currentAwarenessGain,
  currentInfectionGain,
  effectiveAwarenessBonus,
  effectiveInfectionReduction,
} from '../game/engine';
import { SHIELD_BY_ID } from '../game/events';
import type { GameState, MutationId } from '../game/types';
import { fmtRate, formatTime } from './format';

interface Props {
  state: GameState;
  onPurchase: (id: MutationId) => void;
  onMisinformation: () => void;
  onPause: (paused: boolean) => void;
  onQuit: () => void;
}

export function GameScreen({ state, onPurchase, onMisinformation, onPause, onQuit }: Props) {
  const [treeOpen, setTreeOpen] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [resumeAfterQuit, setResumeAfterQuit] = useState(false);
  const toast = useToast();
  const paused = state.gameStatus === 'paused';
  const misCheck = canUseMisinformation(state);
  const shield = state.activeShield ? SHIELD_BY_ID[state.activeShield.id] : null;
  const nextShieldIn = CONFIG.shield.intervalSeconds - (state.elapsedSeconds % CONFIG.shield.intervalSeconds);
  const ipIn = CONFIG.ipIntervalSeconds - (state.elapsedSeconds % CONFIG.ipIntervalSeconds);

  const useMis = () => {
    if (!misCheck.ok) {
      toast(`Misinformation Surge tidak tersedia: ${misCheck.reason}`, 'warn');
      return;
    }
    onMisinformation();
    toast(`Awareness −${CONFIG.misinformation.awarenessReduction}. Fact-check datang dalam ${CONFIG.misinformation.factCheckDelaySeconds} detik!`, 'bad');
  };

  const openQuit = () => {
    setResumeAfterQuit(!paused);
    if (!paused) onPause(true);
    setConfirmQuit(true);
  };
  const cancelQuit = () => {
    setConfirmQuit(false);
    if (resumeAfterQuit) onPause(false);
  };

  return (
    <main className="screen game">
      <header className="hud glass">
        <div className="hud-meters">
          <Meter
            label="Infection Progress"
            value={state.infectionRate}
            tone="red"
            rateLabel={fmtRate(currentInfectionGain(state))}
            hint="Menang di 100%"
          />
          <Meter
            label="Community Awareness"
            value={state.awarenessLevel}
            tone="cyan"
            rateLabel={fmtRate(currentAwarenessGain(state))}
            hint="Kalah di 100%"
          />
        </div>
        <div className="hud-chips">
          <span className="chip chip-ip" aria-label={`${state.infectionPoints} Infection Points`}>
            <Icon name="coin" size={18} /> <strong>{state.infectionPoints}</strong> IP
            <span className="chip-sub">+1 dlm {ipIn}d</span>
          </span>
          <span className="chip" aria-label={`Waktu berjalan ${formatTime(state.elapsedSeconds)}`}>
            <Icon name="clock" size={18} /> {formatTime(state.elapsedSeconds)}
          </span>
          <span className="chip" title="Transmission Level">TRN <strong>Lv {state.stats.transmissionLevel}</strong></span>
          <span className="chip" title="Symptom Visibility Level">SYM <strong>Lv {state.stats.symptomVisibilityLevel}</strong></span>
          <span className="chip" title="Environmental Persistence Level">ENV <strong>Lv {state.stats.environmentalPersistenceLevel}</strong></span>
        </div>
      </header>

      <div className="game-body">
        <CommunityMap infection={state.infectionRate} awareness={state.awarenessLevel} shieldActive={!!shield} />

        <div className="side">
          <section className={`event-card glass${shield ? ' event-on' : ''}`} aria-live="polite" aria-labelledby="event-title">
            <div className="panel-head">
              <h3 id="event-title"><Icon name="shield" size={18} /> Behavior Shield</h3>
              {shield && state.activeShield ? (
                <span className="tag tag-warn">Aktif · sisa {state.activeShield.expiresAt - state.elapsedSeconds}d</span>
              ) : (
                <span className="tag">Berikutnya dlm {nextShieldIn}d</span>
              )}
            </div>
            {shield ? (
              <>
                <h4>{shield.title}</h4>
                <p>{shield.description}</p>
                <p className="effect-line">
                  Efek: {shield.effectLabel}
                  {effectiveInfectionReduction(state) > 0 && shield.infectionReduction !== effectiveInfectionReduction(state) &&
                    ` (A2 aktif: −${Math.round(effectiveInfectionReduction(state) * 100)}%)`}
                  {effectiveAwarenessBonus(state) > 0 && shield.awarenessBonusPerSecond !== effectiveAwarenessBonus(state) &&
                    ` (C2 aktif: +${effectiveAwarenessBonus(state).toFixed(3).replace('.', ',')}/dtk)`}
                </p>
                <p className="muted small">Durasi {shield.durationSeconds} detik. Nilai efek adalah parameter permainan.</p>
              </>
            ) : (
              <p className="muted">Komunitas sedang bersiap. Setiap {CONFIG.shield.intervalSeconds} detik, warga menjalankan satu perilaku pelindung.</p>
            )}
          </section>

          <section className="ticker glass" aria-labelledby="ticker-title">
            <h3 id="ticker-title" className="panel-head">Kabar Dusun</h3>
            <ol aria-live="polite">
              {state.newsTicker.map((m) => (
                <li key={m.id} className={`tick tone-${m.tone}`}>
                  <time>{formatTime(m.at)}</time> {m.text}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <nav className="controls glass" aria-label="Kontrol permainan">
        <button type="button" className="btn btn-primary" onClick={() => setTreeOpen(true)}>
          <Icon name="dna" /> Mutation Tree
        </button>
        <button
          type="button"
          className="btn btn-warn"
          onClick={useMis}
          aria-disabled={!misCheck.ok}
          data-disabled={!misCheck.ok || undefined}
          title={misCheck.ok ? 'Aksi fiktif sekali pakai' : misCheck.reason}
        >
          <Icon name="megaphone" />
          <span>
            Misinformation Surge <small>{state.misinformationUsed ? '· Sudah dipakai' : `· ${CONFIG.misinformation.cost} IP`}</small>
          </span>
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onPause(!paused)} aria-pressed={paused}>
          <Icon name={paused ? 'play' : 'pause'} /> {paused ? 'Lanjutkan' : 'Jeda'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={openQuit}>
          <Icon name="home" /> Menu
        </button>
      </nav>
      {state.factCheckDueAt !== null && (
        <p className="factcheck-banner" role="status">
          Fact-Check Response datang dalam {state.factCheckDueAt - state.elapsedSeconds} detik.
        </p>
      )}
      {paused && !confirmQuit && !treeOpen && <div className="paused-badge" role="status">DIJEDA</div>}

      {treeOpen && <MutationTree state={state} onPurchase={onPurchase} onClose={() => setTreeOpen(false)} />}
      {confirmQuit && (
        <Modal
          title="Kembali ke menu?"
          onClose={cancelQuit}
          footer={
            <div className="foot-actions">
              <button type="button" className="btn btn-ghost" onClick={cancelQuit}>
                Lanjut bermain
              </button>
              <button type="button" className="btn btn-danger" onClick={onQuit}>
                Keluar ke menu
              </button>
            </div>
          }
        >
          <p>Sesi ini akan dihentikan dan progresnya tidak disimpan.</p>
        </Modal>
      )}
    </main>
  );
}
