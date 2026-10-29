import { useEffect, useState } from 'react';
import { EvIcon, Ico, Weave } from '../components/ui';
import { CONFIG } from '../game/config';
import { SHIELD_EVENTS } from '../game/events';
import { useDialog } from '../ui/hooks';
import { GUIDE } from '../ui/meta';

const TREE_DEMO = [
  { label: 'Transmisi', a: 'A1', b: 'A2', color: 'var(--infect)' },
  { label: 'Gejala · berisiko', a: 'B1', b: 'B2', color: 'var(--aware)' },
  { label: 'Persistensi', a: 'C1', b: 'C2', color: 'var(--persist)' },
];

interface Props {
  step: number;
  onStep: (step: number) => void;
  onClose: () => void;
  onFinish: () => void;
}

/** How to Play: sheet bawah 5 langkah; kamera 3D terbang ke fasilitas per langkah (diatur App). */
export function TutorialModal({ step, onStep, onClose, onFinish }: Props) {
  const panel = useDialog<HTMLDivElement>(onClose);
  const [demoIP, setDemoIP] = useState(3);
  const s = GUIDE[step];
  const last = step === GUIDE.length - 1;

  useEffect(() => {
    if (step !== 1) return;
    const id = window.setInterval(() => setDemoIP((n) => n + 1), CONFIG.ipIntervalSeconds * 1000);
    return () => window.clearInterval(id);
  }, [step]);

  return (
    <div className="guide-scrim" role="dialog" aria-modal="true" aria-label="How to Play">
      <div className="guide-sheet" ref={panel} tabIndex={-1}>
        <Weave className="weave-top" />
        <div className="guide-body">
          <div className="row">
            <span className="eyebrow">HOW TO PLAY · LANGKAH {step + 1} DARI {GUIDE.length}</span>
            <span className="grow" />
            <button type="button" className="btn btn-hi btn-icon btn-close" onClick={onClose} aria-label="Tutup tutorial">
              <Ico name="close" size={20} stroke={2.6} />
            </button>
          </div>
          <h2 className="guide-title">{s.title}</h2>

          {step === 0 && (
            <div className="inset demo-race">
              <span className="demo-k">KAMU</span>
              <span className="demo-bar"><span style={{ width: '70%', background: 'var(--infect)' }} /></span>
              <span className="demo-w">WARGA</span>
              <span className="demo-bar"><span style={{ width: '56%', background: 'var(--aware)' }} /></span>
              <span className="demo-note">Menang: Infection Progress 100%. Kalah: Community Awareness 100%. Jika keduanya tercapai bersamaan, kekalahan diutamakan.</span>
            </div>
          )}
          {step === 1 && (
            <div className="inset demo-ip">
              <span className="demo-coin">IP</span>
              <span className="demo-ip-text">
                <strong>{demoIP} IP</strong>
                <span>+1 setiap {CONFIG.ipIntervalSeconds} detik, otomatis</span>
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
              {SHIELD_EVENTS.map((e) => (
                <div key={e.id} className="demo-ev">
                  <span className="ev-badge"><EvIcon id={e.id} /></span>
                  <span>{e.title}</span>
                </div>
              ))}
            </div>
          )}
          {step === 4 && (
            <div className="inset demo-flow">
              <span className="flow-ip">{CONFIG.misinformation.cost} IP</span>
              <b>→</b>
              <span className="flow-aw">Awareness −{CONFIG.misinformation.awarenessReduction}</span>
              <b>→ {CONFIG.misinformation.factCheckDelaySeconds} dtk →</b>
              <span className="flow-fc">Fact-Check +{CONFIG.misinformation.factCheckAwarenessIncrease}</span>
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
