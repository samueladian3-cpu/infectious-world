import { useEffect, useState } from 'react';
import { PathogenArt } from '../components/PathogenArt';
import { EvIcon, Ico, Stars, Weave } from '../components/ui';
import { CONFIG } from '../game/config';
import { SHIELD_IDS } from '../game/engine';
import { REGIONS } from '../game/regions';
import { SCENARIOS, SCENARIO_BY_ID } from '../game/scenarios';
import { useDialog } from '../ui/hooks';
import { GUIDE } from '../ui/meta';

const TREE_DEMO = [
  { label: 'Penularan', a: 'A1', b: 'A2', color: 'var(--infect)' },
  { label: 'Gejala · berisiko', a: 'B1', b: 'B2', color: 'var(--aware)' },
  { label: 'Daya Tahan', a: 'C1', b: 'C2', color: 'var(--persist)' },
];

interface Props {
  step: number;
  onStep: (step: number) => void;
  onClose: () => void;
  onFinish: () => void;
}

/** Cara Bermain: sheet bawah 6 langkah; kamera 3D terbang ke fasilitas per langkah (diatur App). */
export function TutorialModal({ step, onStep, onClose, onFinish }: Props) {
  const panel = useDialog<HTMLDivElement>(onClose);
  const [demoIP, setDemoIP] = useState(3);
  const [demoQuiz, setDemoQuiz] = useState<null | boolean>(null);
  const s = GUIDE[step];
  const last = step === GUIDE.length - 1;
  const ispa = SCENARIO_BY_ID.ispa;

  useEffect(() => {
    if (step !== 1) return;
    const id = window.setInterval(() => setDemoIP((n) => n + 1), CONFIG.ipIntervalSeconds * 1000);
    return () => window.clearInterval(id);
  }, [step]);

  return (
    <div className="guide-scrim" role="dialog" aria-modal="true" aria-label="Cara Bermain">
      <div className="guide-sheet" ref={panel} tabIndex={-1}>
        <Weave className="weave-top" />
        <div className="guide-body">
          <div className="row">
            <span className="eyebrow">CARA BERMAIN · LANGKAH {step + 1} DARI {GUIDE.length}</span>
            <span className="grow" />
            <button type="button" className="btn btn-hi btn-icon btn-close" onClick={onClose} aria-label="Tutup tutorial">
              <Ico name="close" size={20} stroke={2.6} />
            </button>
          </div>
          <h2 className="guide-title">{s.title}</h2>

          {step === 0 && (
            <div className="inset demo-germs">
              {SCENARIOS.map((sc) => (
                <span key={sc.id} className="demo-germ">
                  <PathogenArt id={sc.pathogen} size={46} />
                  <span>{sc.name}</span>
                </span>
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="inset demo-race">
              <span className="demo-k">INFEKSI</span>
              <span className="demo-bar"><span style={{ width: '70%', background: 'var(--infect)' }} /></span>
              <span className="demo-w">WARGA</span>
              <span className="demo-bar"><span style={{ width: '56%', background: 'var(--aware)' }} /></span>
              <span className="demo-note">
                <strong>{demoIP} PI</strong> · +1 setiap {CONFIG.ipIntervalSeconds} detik. Jika kedua bar mencapai 100% bersamaan, warga yang menang.
              </span>
            </div>
          )}
          {step === 2 && (
            <div className="inset demo-tree">
              {TREE_DEMO.map((col) => (
                <div key={col.a} className="demo-col">
                  <span className="demo-col-label" style={{ color: col.color }}>{col.label}</span>
                  <span className="demo-node">{col.a}</span>
                  <span className="demo-link" />
                  <span className="demo-node demo-node-2">{col.b}</span>
                </div>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="inset demo-events">
              {SHIELD_IDS.map((id) => (
                <div key={id} className="demo-ev">
                  <span className="ev-badge"><EvIcon icon={ispa.shields[id].icon} /></span>
                  <span>{ispa.shields[id].title}</span>
                </div>
              ))}
              <div className="demo-regions">
                {REGIONS.map((r) => (
                  <span key={r.id} className="chip chip-xs">
                    <Ico name="pin" size={12} stroke={2.6} /> {r.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="inset demo-quiz">
              <span className="demo-claim">“Antibiotik dapat menyembuhkan pilek.”</span>
              {demoQuiz === null ? (
                <span className="grid-2">
                  <button type="button" className="btn btn-sm quiz-btn quiz-fact" onClick={() => setDemoQuiz(false)}>FAKTA</button>
                  <button type="button" className="btn btn-sm quiz-btn quiz-myth" onClick={() => setDemoQuiz(true)}>MITOS</button>
                </span>
              ) : (
                <span className={`stamp ${demoQuiz ? 'stamp-green' : 'stamp-red'}`}>
                  {demoQuiz ? `✓ BENAR, ini MITOS · +${CONFIG.quiz.reward} PI` : '✕ Ini MITOS: antibiotik tidak bekerja melawan virus'}
                </span>
              )}
            </div>
          )}
          {step === 5 && (
            <div className="inset demo-missions">
              <Stars n={2} size={30} />
              <span>Misi selesai = bintang + XP. Naik level untuk gelar baru seperti <strong>Kader Muda</strong> dan <strong>Detektif Wabah</strong>.</span>
            </div>
          )}

          <div className="guide-text">
            {s.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="row guide-nav">
            <div className="guide-dots" aria-label={`Langkah ${step + 1} dari ${GUIDE.length}`}>
              {GUIDE.map((g, i) => (
                <button key={g.title} type="button" onClick={() => onStep(i)} aria-label={`Ke langkah ${i + 1}`} aria-current={i === step ? 'step' : undefined}>
                  <span className={i === step ? 'on' : ''} />
                </button>
              ))}
            </div>
            <span className="grow" />
            <button type="button" className="btn btn-hi btn-sm guide-prev" onClick={() => onStep(step - 1)} disabled={step === 0}>
              Sebelumnya
            </button>
            <button type="button" className="btn btn-red btn-sm btn-display" onClick={last ? onFinish : () => onStep(step + 1)}>
              {last ? 'Mengerti, Ayo Main!' : 'Berikutnya'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
