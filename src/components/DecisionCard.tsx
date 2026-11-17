import { PATHOGEN_BY_ID } from '../content/pathodex';
import { CONFIG } from '../game/config';
import { canDecide } from '../game/engine';
import type { DecisionDef, GameState } from '../game/types';
import { useDialog } from '../ui/hooks';
import { PathogenArt } from './PathogenArt';
import { Ico } from './ui';

interface Props {
  state: GameState;
  def: DecisionDef;
  /** Pilihan yang sudah diambil (tahap pengungkapan fakta); null saat masih memilih. */
  answered: { choice: number; correct?: boolean } | null;
  onChoose: (choice: number) => void;
  onContinue: () => void;
}

/** Momen Penentu: dilema strategi atau kuis Mitos/Fakta. Simulasi berhenti selama kartu terbuka. */
export function DecisionCard({ state, def, answered, onChoose, onContinue }: Props) {
  const panel = useDialog<HTMLDivElement>(answered ? onContinue : () => undefined);
  const dex = PATHOGEN_BY_ID[def.dexId];
  const isQuiz = def.kind === 'quiz';

  return (
    <div className="overlay overlay-50 overlay-pad" role="dialog" aria-modal="true" aria-labelledby="decision-title">
      <div className={`card-modal decision-card${isQuiz ? ' is-quiz' : ''}`} ref={panel} tabIndex={-1}>
        <div className="decision-head">
          <span className="decision-art">
            <PathogenArt id={def.dexId} size="100%" />
          </span>
          <span className="stack-6">
            <span className="eyebrow">{isQuiz ? `KUIS MITOS ATAU FAKTA · +${CONFIG.quiz.reward} PI JIKA BENAR` : 'MOMEN PENENTU · SIMULASI BERHENTI'}</span>
            <h2 id="decision-title" className="display-24">
              {isQuiz ? 'Mitos atau Fakta?' : def.title}
            </h2>
          </span>
        </div>

        {isQuiz ? <p className="decision-claim">“{def.claim}”</p> : <p className="decision-body">{def.body}</p>}

        {!answered && (
          <div className={isQuiz ? 'grid-2' : 'decision-options'}>
            {isQuiz ? (
              <>
                <button type="button" className="btn btn-md quiz-btn quiz-fact" onClick={() => onChoose(0)} data-sfx="none">
                  <Ico name="check" size={20} stroke={3} />
                  FAKTA
                </button>
                <button type="button" className="btn btn-md quiz-btn quiz-myth" onClick={() => onChoose(1)} data-sfx="none">
                  <Ico name="x" size={20} stroke={3} />
                  MITOS
                </button>
              </>
            ) : (
              def.options.map((o, i) => {
                const ok = canDecide(state, i);
                return (
                  <button key={o.label} type="button" className="btn btn-hi decision-opt" onClick={() => onChoose(i)} aria-disabled={!ok.ok} data-sfx="none">
                    <span className="opt-label">{o.label}</span>
                    <span className="opt-detail">{ok.ok ? o.detail : ok.reason}</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {answered && (
          <div className="decision-reveal" role="status">
            {isQuiz ? (
              <>
                <span className={`stamp ${answered.correct ? 'stamp-green' : 'stamp-red'}`}>
                  {answered.correct ? `✓ BENAR · +${CONFIG.quiz.reward} PI` : '✕ KURANG TEPAT'}
                </span>
                <p>
                  <strong>{def.isTrue ? 'FAKTA.' : 'MITOS.'}</strong> {def.explanation}
                </p>
              </>
            ) : (
              <>
                <span className="stamp stamp-ink">PILIHANMU: {def.options[answered.choice].label.toUpperCase()}</span>
                <p>
                  <strong>Fakta kesehatan:</strong> {def.fact}
                </p>
              </>
            )}
            <span className="muted small strong">
              <Ico name="book" size={14} stroke={2.6} /> Selengkapnya: {dex.commonName} di Patho-Dex.
            </span>
            <button type="button" className="btn btn-red btn-md" onClick={onContinue} autoFocus>
              LANJUTKAN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
