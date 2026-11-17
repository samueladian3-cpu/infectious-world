import { PathogenArt } from '../components/PathogenArt';
import { Ico, Stars } from '../components/ui';
import { missionLabel } from '../game/missions';
import { ACHIEVEMENTS, LEVELS, LEVEL_COLORS, levelOf, type Progress } from '../game/progress';
import { SCENARIOS } from '../game/scenarios';

interface Props {
  progress: Progress;
  wide: boolean;
  onBack: () => void;
}

/** Misi, level, hadiah, dan pencapaian pemain (disimpan di perangkat ini). */
export function ProgressScreen({ progress, wide, onBack }: Props) {
  const lv = levelOf(progress.xp);
  return (
    <section className={`screen dex${wide ? ' dex-wide' : ''}`} aria-label="Misi dan Prestasi">
      <div className="dex-panel">
        <div className="dex-head">
          <div className="row">
            <button type="button" className="btn btn-hi btn-back btn-back-sm" onClick={onBack}>
              <Ico name="back" stroke={2.6} />
              Menu
            </button>
            <h1 className="dex-title">Misi &amp; Prestasi</h1>
          </div>
        </div>
        <div className="dex-scroll stack-12">
          <div className="panel panel-hi level-card">
            <span className="lv-badge lv-badge-lg" style={{ background: lv.color }}>
              <small>LV</small>
              {lv.level}
            </span>
            <span className="grow stack-6">
              <span className="display-24">{lv.title}</span>
              <span className="xp-bar xp-bar-lg">
                <span style={{ width: lv.need ? `${(lv.into / lv.need) * 100}%` : '100%' }} />
              </span>
              <span className="muted small strong">
                {progress.xp} XP{lv.need ? ` · ${lv.need - lv.into} XP lagi ke Level ${lv.level + 1}` : ' · level tertinggi!'}
              </span>
            </span>
          </div>
          <p className="muted small strong">XP didapat dari setiap sesi: selesai main, menang atau kalah, misi, dan kuis yang benar. Kalah pun tetap dapat XP.</p>

          <h2 className="outline-h2">Penyakit &amp; Misi</h2>
          <div className="progress-scenarios">
            {SCENARIOS.map((s) => (
              <article key={s.id} className="panel ps-card">
                <div className="row">
                  <PathogenArt id={s.pathogen} size={48} />
                  <span className="grow stack-6">
                    <span className="display-20">{s.name}</span>
                    <span className="muted small strong">
                      Dimainkan {progress.played[s.id] ?? 0}× · menang {progress.wins[s.id] ?? 0}×
                    </span>
                  </span>
                  <Stars n={progress.stars[s.id] ?? 0} size={20} />
                </div>
                <ul className="ps-missions">
                  {s.missions.map((m) => (
                    <li key={m.id}>{missionLabel(m)}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <h2 className="outline-h2">Level &amp; Hadiah</h2>
          <ol className="level-list">
            {LEVELS.map((l, i) => {
              const reached = progress.xp >= l.xp;
              return (
                <li key={l.title} className={reached ? 'reached' : ''}>
                  <span className="lv-badge lv-badge-sm" style={{ background: reached ? LEVEL_COLORS[i] : '#cdbb9c' }}>
                    {i + 1}
                  </span>
                  <span className="grow">
                    <strong>{l.title}</strong>
                    <span className="muted small"> · {l.reward}</span>
                  </span>
                  <span className="num small">{l.xp} XP</span>
                </li>
              );
            })}
          </ol>

          <h2 className="outline-h2">
            Pencapaian {progress.achievements.length}/{ACHIEVEMENTS.length}
          </h2>
          <ul className="ach-grid">
            {ACHIEVEMENTS.map((a) => {
              const got = progress.achievements.includes(a.id);
              return (
                <li key={a.id} className={`ach${got ? ' got' : ''}`}>
                  <span className="ach-ico">
                    <Ico name={got ? a.icon : 'lock'} size={24} stroke={2.4} />
                  </span>
                  <span className="stack-6">
                    <strong>{a.title}</strong>
                    <span className="small">{a.description}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
