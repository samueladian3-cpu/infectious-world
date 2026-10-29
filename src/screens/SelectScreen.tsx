import { useState } from 'react';
import { useToast } from '../components/Toast';
import { Ico } from '../components/ui';
import { Specimen } from '../components/World3D';
import { PATHOGENS } from '../content/pathodex';
import { FACILITIES } from '../ui/map';
import { CARD_CODE } from '../ui/meta';

interface Props {
  onBack: () => void;
  onDeploy: () => void;
}

export function SelectScreen({ onBack, onDeploy }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const toast = useToast();
  const ready = selected === 'rhinovirus';

  return (
    <section className="screen select" aria-label="Pilih Patogen dan Komunitas">
      <div className="select-inner">
        <div className="row screen-head">
          <button type="button" className="btn btn-paper btn-back" onClick={onBack}>
            <Ico name="back" stroke={2.6} />
            Menu
          </button>
          <h1 className="outline-title">Pilih Patogen &amp; Komunitas</h1>
        </div>

        <span className="pill-dark pill-section">1 · PATOGEN</span>
        <div className="card-grid">
          {PATHOGENS.map((p) => {
            const locked = !p.playable;
            const isSel = selected === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`pcard${isSel ? ' is-selected' : ''}`}
                aria-pressed={p.playable ? isSel : undefined}
                aria-disabled={locked || undefined}
                aria-label={`${p.commonName}, ${p.organismType}${locked ? ', terkunci, belum dapat dimainkan' : ''}`}
                onClick={() => {
                  if (locked) {
                    toast(`${p.commonName} masih pratinjau dan belum dapat dimainkan.`, 'warn');
                    return;
                  }
                  setSelected(p.id);
                }}
              >
                <span className="pcard-stage">
                  <Specimen kind={p.id} locked={locked} />
                  <span className="pcard-code">{CARD_CODE[p.id]} · {p.size}</span>
                  {locked && (
                    <span className="pcard-seal">
                      <Ico name="lock" size={18} stroke={2.6} />
                      SEGEL · PRATINJAU
                    </span>
                  )}
                  {isSel && <span className="pcard-stamp">DIPILIH</span>}
                </span>
                <span className="pcard-body">
                  <span className="row-wrap">
                    <span className="chip">{p.organismType}</span>
                    <span className={`chip ${locked ? 'chip-locked' : isSel ? 'chip-red' : 'chip-green'}`}>
                      {locked ? 'Terkunci' : isSel ? 'Dipilih' : 'Tersedia'}
                    </span>
                  </span>
                  <span className="pcard-name">{p.commonName}</span>
                  <span className="sci">{p.scientificName}</span>
                  <span className="pcard-desc">{p.shortDescription}</span>
                </span>
              </button>
            );
          })}
        </div>

        <span className="pill-dark pill-section">2 · KOMUNITAS</span>
        <div className="panel community">
          <div className="stack-8">
            <span className="tag-ip">ILUSTRATIF</span>
            <h2 className="display-28">Dusun Kuannoah: Skala Komunitas</h2>
            <p>
              Sebuah dusun fiktif dengan rumah warga, puskesmas, sekolah, pasar, balai dusun, posyandu, dan warung. Warga di sini rajin
              mengikuti kegiatan kader kesehatan.
            </p>
            <p className="muted small">
              Peta, nama, dan angka di skenario ini sepenuhnya ilustratif dan tidak mewakili data epidemiologi atau demografi wilayah mana pun.
            </p>
          </div>
          <div className="stack-10">
            <dl className="community-stats">
              <div><dd>48</dd><dt>Bangunan di peta</dt></div>
              <div><dd>6</dd><dt>Fasilitas umum</dt></div>
              <div><dd className="dd-word">Ilustratif</dd><dt>Jenis data</dt></div>
            </dl>
            <div className="row-wrap">
              {Object.values(FACILITIES).map((f) => (
                <span key={f} className="chip chip-lo">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky-bar">
        <div className="sticky-inner deploy">
          <button
            type="button"
            className="btn btn-red btn-deploy"
            onClick={() => (ready ? onDeploy() : toast('Pilih Rhinovirus terlebih dahulu.', 'warn'))}
            aria-disabled={!ready}
          >
            <svg width="26" height="26" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinejoin="round" aria-hidden="true">
              <path d="M24 8l13.9 8v16L24 40l-13.9-8V16z" />
              <path d="M24 8v16M24 24l13.9 8M24 24l-13.9 8" />
            </svg>
            LEPASKAN PATOGEN
          </button>
          <span className="hint">
            {ready ? 'Rhinovirus siap dilepas di Dusun Kuannoah (simulasi).' : 'Pilih patogen yang tersedia untuk memulai.'}
          </span>
        </div>
      </div>
    </section>
  );
}
