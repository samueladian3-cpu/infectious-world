import { useState } from 'react';
import { audio } from '../audio/audio';
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

/** Penggeser volume 0–100% dengan tombol bisu terpisah. */
function VolumeRow({ label, value, muted, onValue, onMute, preview }: { label: string; value: number; muted: boolean; onValue: (v: number) => void; onMute: () => void; preview: () => void }) {
  const id = `vol-${label.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <div className="vol-row">
      <button type="button" className={`btn btn-paper btn-icon vol-mute${muted ? ' is-muted' : ''}`} onClick={onMute} aria-pressed={muted} aria-label={muted ? `Nyalakan ${label}` : `Bisukan ${label}`} data-sfx="none">
        <Ico name={muted ? 'mute' : 'volume'} size={20} stroke={2.4} />
      </button>
      <label className="vol-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        disabled={muted}
        onChange={(e) => onValue(Number(e.target.value) / 100)}
        onPointerUp={preview}
        onKeyUp={preview}
      />
      <span className="vol-num num">{muted ? 'bisu' : `${Math.round(value * 100)}%`}</span>
    </div>
  );
}

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
    ['Aksi warga dialami', r.shieldEventsSeen],
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
            <legend>SUARA</legend>
            <VolumeRow
              label="Musik"
              value={prefs.musicVolume}
              muted={prefs.muteMusic}
              onValue={(v) => onChange({ ...prefs, musicVolume: v })}
              onMute={() => onChange({ ...prefs, muteMusic: !prefs.muteMusic })}
              preview={() => undefined}
            />
            <VolumeRow
              label="Efek suara"
              value={prefs.sfxVolume}
              muted={prefs.muteSfx}
              onValue={(v) => onChange({ ...prefs, sfxVolume: v })}
              onMute={() => onChange({ ...prefs, muteSfx: !prefs.muteSfx })}
              preview={() => audio.play('notify')}
            />
            <span className="muted small strong">Musik berubah mengikuti suasana: makin tegang saat bar mendekati 100%.</span>
          </fieldset>
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
          <fieldset>
            <legend>PENASIHAT STRATEGI</legend>
            <label className="check-row">
              <input type="checkbox" checked={prefs.advisor} onChange={(e) => onChange({ ...prefs, advisor: e.target.checked })} />
              <span>Tampilkan saran langkah berikutnya saat bermain.</span>
            </label>
          </fieldset>
          <fieldset>
            <legend>MODE KELAS</legend>
            <label className="check-row">
              <input type="checkbox" checked={prefs.unlockAll} onChange={(e) => onChange({ ...prefs, unlockAll: e.target.checked })} />
              <span>Buka semua penyakit tanpa harus bermain berurutan (untuk guru atau dosen).</span>
            </label>
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
              <span className="confirm-q">Hapus statistik, XP, bintang, dan pencapaian?</span>
              <button
                type="button"
                className="btn btn-red btn-sm"
                onClick={() => {
                  onResetRecords();
                  setConfirming(false);
                  toast('Statistik dan progres lokal dihapus.', 'info');
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
              Hapus statistik &amp; progres
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
