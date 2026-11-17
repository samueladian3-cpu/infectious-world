import { useState } from 'react';
import { PathogenArt } from '../components/PathogenArt';
import { Ico, PlayIcon, Stars, Weave } from '../components/ui';
import type { levelOf } from '../game/progress';
import type { PathogenId } from '../game/types';

interface Props {
  level: ReturnType<typeof levelOf>;
  stars: number;
  achievements: number;
  muted: boolean;
  onToggleMute: () => void;
  onStart: () => void;
  onTutorial: () => void;
  onDex: () => void;
  onLeaderboard: () => void;
  onProgress: () => void;
  onSettings: () => void;
}

/** File logo resmi diletakkan di public/ agar mudah diganti tanpa build ulang kode. */
export const LOGO_SRC = './logo-poltekkes-kupang.png';
export const INSTITUTION = 'Poltekkes Kemenkes Kupang';

const DECOR: PathogenId[] = ['rhinovirus', 'ecoli', 'hiv', 'tb', 'dengue'];

/** Logo institusi; bila berkas belum tersedia, tampil lencana teks agar identitas tetap terlihat. */
export function InstitutionBadge({ compact = false }: { compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`inst-badge${compact ? ' inst-compact' : ''}`}>
      {!failed ? (
        <img src={LOGO_SRC} alt={`Logo ${INSTITUTION}`} className="inst-logo" onError={() => setFailed(true)} />
      ) : (
        <span className="inst-logo inst-logo-fallback" aria-hidden="true">
          <Ico name="shield" size={22} stroke={2.4} />
        </span>
      )}
      <span className="inst-text">
        <span className="inst-k">Dikembangkan oleh</span>
        <span className="inst-name">{INSTITUTION}</span>
      </span>
    </span>
  );
}

export function MainMenu({ level, stars, achievements, muted, onToggleMute, onStart, onTutorial, onDex, onLeaderboard, onProgress, onSettings }: Props) {
  return (
    <section className="screen home" aria-label="Menu utama">
      <div className="home-top">
        <div className="home-bar">
          <InstitutionBadge />
          <span className="row home-icons">
            <button type="button" className="btn btn-paper btn-icon btn-icon-lg" onClick={onToggleMute} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'} aria-pressed={muted}>
              <Ico name={muted ? 'mute' : 'volume'} size={24} stroke={2.2} />
            </button>
            <button type="button" className="btn btn-paper btn-icon btn-icon-lg" onClick={onSettings} aria-label="Pengaturan">
              <Ico name="gear" size={24} stroke={2.2} />
            </button>
          </span>
        </div>
        <div className="home-hero">
          <h1 className="home-title" aria-label="INFECTIOUS WORLD">
            INFECTIOUS
            <br />
            <span>WORLD</span>
          </h1>
          <div className="home-germs" aria-hidden="true">
            {DECOR.map((id, i) => (
              <span key={id} className={`germ germ-${i}`}>
                <PathogenArt id={id} size="100%" float />
              </span>
            ))}
          </div>
        </div>
        <Weave className="weave-home" />
        <p className="home-desc">Jadilah kuman fiktif, hadapi warga Dusun Kuannoah, dan temukan kenapa pencegahan selalu menang di dunia nyata.</p>
      </div>
      <div className="home-bottom">
        <button type="button" className="profile-card" onClick={onProgress} aria-label={`Level ${level.level}, ${level.title}. Buka progres dan pencapaian`}>
          <span className="lv-badge" style={{ background: level.color }}>
            <small>LV</small>
            {level.level}
          </span>
          <span className="profile-text">
            <span className="profile-title">{level.title}</span>
            <span className="xp-bar">
              <span style={{ width: level.need ? `${(level.into / level.need) * 100}%` : '100%' }} />
            </span>
          </span>
          <span className="profile-meta">
            <Stars n={1} total={1} size={16} /> {stars}
            <Ico name="medal" size={16} stroke={2.2} /> {achievements}
          </span>
        </button>
        <nav aria-label="Menu utama" className="home-nav">
          <button type="button" className="btn btn-red btn-xl" onClick={onStart}>
            <PlayIcon />
            MULAI MAIN
          </button>
          <div className="home-grid">
            <button type="button" className="btn btn-paper btn-tile" onClick={onTutorial}>
              <Ico name="help" size={22} stroke={2.3} />
              CARA BERMAIN
            </button>
            <button type="button" className="btn btn-paper btn-tile btn-tile-left" onClick={onDex}>
              <Ico name="book" size={22} stroke={2.3} />
              PATHO-DEX
            </button>
            <button type="button" className="btn btn-paper btn-tile" onClick={onProgress}>
              <Ico name="medal" size={22} stroke={2.3} />
              MISI &amp; PRESTASI
            </button>
            <button type="button" className="btn btn-paper btn-tile btn-tile-left" onClick={onLeaderboard}>
              <Ico name="trophy" size={22} stroke={2.3} />
              PERINGKAT
            </button>
          </div>
        </nav>
        <p className="home-disclaimer">Game ini fiktif. Angka di dalamnya adalah mekanik permainan, bukan prediksi wabah atau data epidemiologi nyata.</p>
      </div>
    </section>
  );
}
