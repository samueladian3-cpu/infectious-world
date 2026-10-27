import { Icon } from '../components/Icon';

interface Props {
  onStart: () => void;
  onTutorial: () => void;
  onDex: () => void;
  onSettings: () => void;
}

export function MainMenu({ onStart, onTutorial, onDex, onSettings }: Props) {
  return (
    <main className="screen menu">
      <button type="button" className="icon-btn settings-btn" onClick={onSettings} aria-label="Pengaturan">
        <Icon name="gear" size={22} />
      </button>
      <div className="menu-center">
        <div className="logo-orb" aria-hidden="true">
          <Icon name="virus" size={64} />
        </div>
        <p className="eyebrow">Simulasi Edukasi Kesehatan Berbasis Strategi</p>
        <h1 className="title">
          INFECTIOUS <span>WORLD</span>
        </h1>
        <p className="subtitle">
          Pahami bagaimana kebersihan, pengenalan gejala, dan informasi yang benar melindungi komunitas, dari sudut
          pandang patogen fiktif.
        </p>
        <nav className="menu-actions" aria-label="Menu utama">
          <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
            <Icon name="play" /> START INFECTION
          </button>
          <button type="button" className="btn btn-ghost" onClick={onTutorial}>
            <Icon name="help" /> HOW TO PLAY
          </button>
          <button type="button" className="btn btn-ghost" onClick={onDex}>
            <Icon name="book" /> PATHO-DEX &amp; FACT-CHECKS
          </button>
        </nav>
        <p className="disclaimer">
          Game ini fiktif. Angka di dalamnya adalah mekanik permainan, bukan prediksi wabah atau data epidemiologi nyata.
        </p>
      </div>
    </main>
  );
}
