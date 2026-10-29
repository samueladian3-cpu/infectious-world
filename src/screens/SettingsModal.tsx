import { useState } from 'react';
import { useToast } from '../components/Toast';
import { Ico, Weave } from '../components/ui';
import type { LocalRecords, Preferences } from '../game/storage';
import { useDialog } from '../ui/hooks';
import { formatTime } from './format';

interface Props {
  prefs: Preferences;
  records: LocalRecords;
  onChange: (p: Preferences) => void;
  onResetRecords: () => void;
  onClose: () => void;
}

type Opt<K extends keyof Preferences> = [Preferences[K], string];

const MOTION: Opt<'motion'>[] = [
  ['system', 'Ikuti sistem'],
  ['reduced', 'Kurangi animasi'],
  ['full', 'Animasi penuh'],
];
const SPEED: Opt<'speed'>[] = [
  ['normal', 'Normal (1 detik)'],
  ['fast', 'Cepat (2×)'],
];
const QUALITY: Opt<'quality'>[] = [
  ['auto', 'Otomatis'],
  ['tinggi', 'Tinggi'],
  ['hemat', 'Hemat'],
];

function Segmented<K extends keyof Preferences>({ legend, opts, prefs, k, onChange }: { legend: string; opts: Opt<K>[]; prefs: Preferences; k: K; onChange: (p: Preferences) => void }) {
  return (
    <div className="seg" role="radiogroup" aria-label={legend} style={{ gridTemplateColumns: `repeat(${opts.length}, minmax(0, 1fr))` }}>
      {opts.map(([value, label]) => (
        <button key={String(value)} type="button" role="radio" aria-checked={prefs[k] === value} className={prefs[k] === value ? 'is-on' : ''} onClick={() => onChange({ ...prefs, [k]: value })}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function SettingsModal({ prefs, records, onChange, onResetRecords, onClose }: Props) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const panel = useDialog<HTMLDivElement>(onClose);
  const r = records;
  const list: [string, string | number][] = [
    ['Sesi dimulai', r.sessionsStarted],
    ['Sesi selesai', r.sessionsCompleted],
    ['Menang / Kalah', `${r.victories} / ${r.defeats}`],
    ['Rata-rata durasi', r.sessionsCompleted ? formatTime(Math.round(r.totalDurationSeconds / r.sessionsCompleted)) : '–'],
    ['Kemenangan tercepat', r.fastestVictorySeconds !== null ? formatTime(r.fastestVictorySeconds) : '–'],
    ['Mutasi dibeli', r.mutationsPurchased],
    ['Event Shield dialami', r.shieldEventsSeen],
    ['Entri Patho-Dex dibuka', r.dexEntriesOpened],
    ['Tutorial selesai', r.tutorialCompleted ? 'Ya' : 'Belum'],
  ];

  return (
    <div className="overlay overlay-50 overlay-pad" role="dialog" aria-modal="true" aria-label="Pengaturan" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="settings" ref={panel} tabIndex={-1}>
        <Weave className="weave-top" />
        <div className="settings-body">
          <div className="row">
            <h2 className="display-28 grow">Pengaturan</h2>
            <button type="button" className="btn btn-hi btn-icon btn-close" onClick={onClose} aria-label="Tutup pengaturan">
              <Ico name="close" size={20} stroke={2.6} />
            </button>
          </div>
          <fieldset>
            <legend>ANIMASI</legend>
            <Segmented legend="Animasi" opts={MOTION} prefs={prefs} k="motion" onChange={onChange} />
          </fieldset>
          <fieldset>
            <legend>KECEPATAN SIMULASI</legend>
            <Segmented legend="Kecepatan simulasi" opts={SPEED} prefs={prefs} k="speed" onChange={onChange} />
            <span className="muted small strong">Mengubah kecepatan tidak mengubah aturan: semua dihitung per detik simulasi.</span>
          </fieldset>
          <fieldset>
            <legend>GRAFIS DUNIA 3D</legend>
            <Segmented legend="Grafis dunia 3D" opts={QUALITY} prefs={prefs} k="quality" onChange={onChange} />
            <span className="muted small strong">Otomatis memakai mode hemat di layar kecil. Pilih Hemat bila game terasa berat.</span>
          </fieldset>
          <div className="stack-6">
            <h3 className="label-13">STATISTIK LOKAL · DISIMPAN DI PERANGKAT INI</h3>
            <dl className="records">
              {list.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {confirming ? (
            <div className="confirm-box" role="alert">
              <span className="confirm-q">Hapus semua statistik lokal?</span>
              <button
                type="button"
                className="btn btn-red btn-sm"
                onClick={() => {
                  onResetRecords();
                  setConfirming(false);
                  toast('Statistik lokal dihapus.', 'info');
                }}
              >
                Ya, hapus
              </button>
              <button type="button" className="btn btn-paper btn-sm" onClick={() => setConfirming(false)}>
                Batal
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-outline-red btn-sm btn-start" onClick={() => setConfirming(true)}>
              Hapus statistik lokal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
