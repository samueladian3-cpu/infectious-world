import { useState } from 'react';
import { PathogenArt } from '../components/PathogenArt';
import { useToast } from '../components/Toast';
import { Ico, Stars } from '../components/ui';
import { missionLabel } from '../game/missions';
import { isScenarioUnlocked, type Progress } from '../game/progress';
import { REGIONS } from '../game/regions';
import { SCENARIOS, SCENARIO_BY_ID } from '../game/scenarios';
import type { RegionId, ScenarioId } from '../game/types';
import { PATHOGEN_COLOR, regionChips } from '../ui/meta';

interface Props {
  progress: Progress;
  unlockAll: boolean;
  initial: { scenario: ScenarioId; region: RegionId };
  onBack: () => void;
  onDeploy: (scenario: ScenarioId, region: RegionId) => void;
}

const DIFF_CLASS = { Mudah: 'chip-green', Sedang: 'chip-ip', Sulit: 'chip-red' } as const;

export function SelectScreen({ progress, unlockAll, initial, onBack, onDeploy }: Props) {
  const firstOpen = isScenarioUnlocked(progress, initial.scenario, unlockAll) ? initial.scenario : 'ispa';
  const [scenario, setScenario] = useState<ScenarioId>(firstOpen);
  const [region, setRegion] = useState<RegionId>(initial.region);
  const toast = useToast();
  const sc = SCENARIO_BY_ID[scenario];

  return (
    <section className="screen select" aria-label="Pilih Penyakit dan Wilayah">
      <div className="select-inner">
        <div className="row screen-head">
          <button type="button" className="btn btn-paper btn-back" onClick={onBack}>
            <Ico name="back" stroke={2.6} />
            Menu
          </button>
          <h1 className="outline-title">Pilih Penyakit &amp; Wilayah</h1>
        </div>

        <span className="pill-dark pill-section">1 · PENYAKIT</span>
        <div className="card-grid scenario-grid">
          {SCENARIOS.map((s, i) => {
            const locked = !isScenarioUnlocked(progress, s.id, unlockAll);
            const isSel = scenario === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`pcard scard${isSel ? ' is-selected' : ''}`}
                aria-pressed={locked ? undefined : isSel}
                aria-disabled={locked || undefined}
                aria-label={`${s.name}, ${s.disease}, tingkat ${s.difficulty}${locked ? ', terkunci' : ''}`}
                data-sfx={locked ? 'none' : 'select'}
                onClick={() => {
                  if (locked) {
                    toast(`Selesaikan satu sesi ${SCENARIOS[i - 1].name} untuk membuka ${s.name}.`, 'warn');
                    return;
                  }
                  setScenario(s.id);
                }}
                style={{ '--accent': PATHOGEN_COLOR[s.pathogen] } as React.CSSProperties}
              >
                <span className="scard-art">
                  <PathogenArt id={s.pathogen} size="100%" locked={locked} />
                  {locked && (
                    <span className="pcard-seal">
                      <Ico name="lock" size={18} stroke={2.6} />
                      TERKUNCI
                    </span>
                  )}
                  {isSel && <span className="pcard-stamp">DIPILIH</span>}
                </span>
                <span className="pcard-body">
                  <span className="row-wrap">
                    <span className={`chip chip-xs ${DIFF_CLASS[s.difficulty]}`}>{s.difficulty}</span>
                    <Stars n={progress.stars[s.id] ?? 0} size={15} />
                  </span>
                  <span className="pcard-name">{s.name}</span>
                  <span className="sci">{s.pathogenName}</span>
                  <span className="pcard-desc">{s.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>

        <span className="pill-dark pill-section">2 · TITIK AWAL DI DUSUN KUANNOAH</span>
        <p className="select-hint">Setiap penyakit menyebar berbeda di tiap wilayah. Kamu bisa pindah wilayah saat bermain (biaya PI).</p>
        <div className="region-grid" role="radiogroup" aria-label="Wilayah awal">
          {REGIONS.map((r) => {
            const mod = sc.regions[r.id];
            const isSel = region === r.id;
            return (
              <button key={r.id} type="button" role="radio" aria-checked={isSel} className={`region-card${isSel ? ' is-selected' : ''}`} data-sfx="select" onClick={() => setRegion(r.id)}>
                <span className="region-name">
                  <Ico name="pin" size={18} stroke={2.4} />
                  {r.name}
                </span>
                <span className="region-note">{mod.note}</span>
                <span className="row-wrap region-chips">
                  {regionChips(mod).map((c) => (
                    <span key={c.label} className={`chip chip-xs ${c.good ? 'chip-good' : 'chip-bad'}`}>
                      {c.label}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <span className="pill-dark pill-section">3 · MISI {sc.name.toUpperCase()}</span>
        <ul className="panel mission-list">
          {sc.missions.map((m) => (
            <li key={m.id}>
              <Ico name="target" size={18} stroke={2.4} />
              {missionLabel(m)}
            </li>
          ))}
          <li className="muted small">Bintang terbaikmu: <Stars n={progress.stars[scenario] ?? 0} size={16} /></li>
        </ul>
      </div>

      <div className="sticky-bar">
        <div className="sticky-inner deploy">
          <button type="button" className="btn btn-red btn-deploy" onClick={() => onDeploy(scenario, region)}>
            <PathogenArt id={sc.pathogen} size={34} />
            LEPASKAN {sc.name.toUpperCase()}
          </button>
          <span className="hint">
            {sc.disease} · mulai di {REGIONS.find((r) => r.id === region)?.name} (simulasi).
          </span>
        </div>
      </div>
    </section>
  );
}
