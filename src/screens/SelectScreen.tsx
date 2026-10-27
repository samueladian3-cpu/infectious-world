import { useState } from 'react';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { PATHOGENS } from '../content/pathodex';

interface Props {
  onBack: () => void;
  onDeploy: () => void;
}

export function SelectScreen({ onBack, onDeploy }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const toast = useToast();
  const ready = selected === 'rhinovirus';

  return (
    <main className="screen select">
      <header className="screen-head">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          <Icon name="back" /> Menu
        </button>
        <h1>Pilih Patogen &amp; Komunitas</h1>
      </header>

      <section aria-labelledby="pathogen-title">
        <h2 id="pathogen-title" className="section-title">1. Patogen</h2>
        <div className="card-grid">
          {PATHOGENS.map((p) => {
            const isSel = selected === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`pcard glass${p.playable ? '' : ' pcard-locked'}${isSel ? ' pcard-selected' : ''}`}
                aria-pressed={p.playable ? isSel : undefined}
                aria-disabled={!p.playable || undefined}
                aria-label={`${p.commonName}, ${p.organismType}${p.playable ? '' : ', terkunci, belum dapat dimainkan'}`}
                onClick={() => {
                  if (!p.playable) {
                    toast(`${p.commonName} masih pratinjau dan belum dapat dimainkan.`, 'warn');
                    return;
                  }
                  setSelected(p.id);
                }}
              >
                <div className="pcard-top">
                  <span className={`pcard-icon pc-${p.id}`}>
                    <Icon name={p.playable ? 'virus' : 'lock'} size={30} />
                  </span>
                  <span className="badge">{p.organismType}</span>
                  {p.playable ? (
                    isSel ? <span className="badge status-purchased"><Icon name="check" size={14} /> Dipilih</span> : <span className="badge status-available">Tersedia</span>
                  ) : (
                    <span className="badge status-locked"><Icon name="lock" size={14} /> Terkunci</span>
                  )}
                </div>
                <h3>{p.commonName}</h3>
                <p className="sci">{p.scientificName}</p>
                <p>{p.shortDescription}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="community-title" className="community glass">
        <div className="community-text">
          <h2 id="community-title" className="section-title">2. Komunitas</h2>
          <h3>Dusun Kuannoah: Skala Komunitas</h3>
          <p>
            Sebuah dusun fiktif dengan rumah warga, puskesmas, sekolah, pasar, balai dusun, posyandu, dan warung.
            Warga di sini rajin mengikuti kegiatan kader kesehatan.
          </p>
          <dl className="stat-grid">
            <div><dt>Bangunan di peta</dt><dd>48</dd></div>
            <div><dt>Fasilitas umum</dt><dd>6</dd></div>
            <div><dt>Jenis data</dt><dd>Ilustratif</dd></div>
          </dl>
          <p className="muted small">
            Peta, nama, dan angka di skenario ini sepenuhnya ilustratif dan tidak mewakili data epidemiologi atau
            demografi wilayah mana pun.
          </p>
        </div>
        <div className="deploy">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => (ready ? onDeploy() : toast('Pilih Rhinovirus terlebih dahulu.', 'warn'))}
            aria-disabled={!ready}
            data-disabled={!ready || undefined}
          >
            <Icon name="virus" /> DEPLOY PATHOGEN
          </button>
          {!ready && <p className="muted small">Pilih patogen yang tersedia untuk memulai.</p>}
        </div>
      </section>
    </main>
  );
}
