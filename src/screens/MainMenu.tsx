import { Ico, PlayIcon, Weave } from '../components/ui';

interface Props {
  onStart: () => void;
  onTutorial: () => void;
  onDex: () => void;
  onLeaderboard: () => void;
  onSettings: () => void;
}

export function MainMenu({ onStart, onTutorial, onDex, onLeaderboard, onSettings }: Props) {
  return (
    <section className="screen home" aria-label="Menu utama">
      <div className="home-top">
        <div className="home-bar">
          <span className="pill-dark">
            <span className="pill-dot" />
            Simulasi Edukasi Kesehatan Berbasis Strategi
          </span>
          <button type="button" className="btn btn-paper btn-icon btn-icon-lg" onClick={onSettings} aria-label="Pengaturan">
            <Ico name="gear" size={24} stroke={2.2} />
          </button>
        </div>
        <h1 className="home-title" aria-label="INFECTIOUS WORLD">
          INFECTIOUS
          <br />
          <span>WORLD</span>
        </h1>
        <Weave className="weave-home" />
        <p className="home-desc">
          Pahami bagaimana kebersihan, pengenalan gejala, dan informasi yang benar melindungi komunitas, dari sudut pandang patogen fiktif.
        </p>
      </div>
      <div className="home-bottom">
        <nav aria-label="Menu utama" className="home-nav">
          <button type="button" className="btn btn-red btn-xl" onClick={onStart}>
            <PlayIcon />
            MULAI INFEKSI
          </button>
          <div className="home-grid">
            <button type="button" className="btn btn-paper btn-tile" onClick={onTutorial}>
              <Ico name="help" size={22} stroke={2.3} />
              HOW TO PLAY
            </button>
            <button type="button" className="btn btn-paper btn-tile btn-tile-left" onClick={onDex}>
              <Ico name="book" size={22} stroke={2.3} />
              PATHO-DEX &amp; FACT-CHECKS
            </button>
            <button type="button" className="btn btn-paper btn-tile btn-span" onClick={onLeaderboard}>
              <Ico name="trophy" size={22} stroke={2.3} />
              PAPAN PERINGKAT
            </button>
          </div>
        </nav>
        <p className="home-disclaimer">
          Game ini fiktif. Angka di dalamnya adalah mekanik permainan, bukan prediksi wabah atau data epidemiologi nyata.
        </p>
      </div>
    </section>
  );
}
