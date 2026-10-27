import { useState } from 'react';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import type { LocalRecords, MotionPref, Preferences, SpeedPref } from '../game/storage';
import { formatTime } from './format';

interface Props {
  prefs: Preferences;
  records: LocalRecords;
  onChange: (p: Preferences) => void;
  onResetRecords: () => void;
  onClose: () => void;
}

const MOTION: { v: MotionPref; label: string }[] = [
  { v: 'system', label: 'Ikuti sistem' },
  { v: 'reduced', label: 'Kurangi animasi' },
  { v: 'full', label: 'Animasi penuh' },
];
const SPEED: { v: SpeedPref; label: string }[] = [
  { v: 'normal', label: 'Normal (1 detik)' },
  { v: 'fast', label: 'Cepat (2×)' },
];

export function SettingsModal({ prefs, records, onChange, onResetRecords, onClose }: Props) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  return (
    <Modal title="Pengaturan" onClose={onClose} closeLabel="Tutup pengaturan">
      <fieldset className="field">
        <legend>Animasi</legend>
        <div className="seg">
          {MOTION.map((m) => (
            <label key={m.v} className={`seg-opt${prefs.motion === m.v ? ' seg-on' : ''}`}>
              <input
                type="radio"
                name="motion"
                checked={prefs.motion === m.v}
                onChange={() => onChange({ ...prefs, motion: m.v })}
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="field">
        <legend>Kecepatan simulasi</legend>
        <div className="seg">
          {SPEED.map((s) => (
            <label key={s.v} className={`seg-opt${prefs.speed === s.v ? ' seg-on' : ''}`}>
              <input
                type="radio"
                name="speed"
                checked={prefs.speed === s.v}
                onChange={() => onChange({ ...prefs, speed: s.v })}
              />
              {s.label}
            </label>
          ))}
        </div>
        <p className="muted small">Mengubah kecepatan tidak mengubah aturan: semua dihitung per detik simulasi.</p>
      </fieldset>

      <h3 className="small-head">Statistik lokal (disimpan di perangkat ini)</h3>
      <dl className="stat-grid">
        <div><dt>Sesi dimulai</dt><dd>{records.sessionsStarted}</dd></div>
        <div><dt>Sesi selesai</dt><dd>{records.sessionsCompleted}</dd></div>
        <div><dt>Menang / Kalah</dt><dd>{records.victories} / {records.defeats}</dd></div>
        <div><dt>Rata-rata durasi</dt><dd>{records.sessionsCompleted ? formatTime(Math.round(records.totalDurationSeconds / records.sessionsCompleted)) : '–'}</dd></div>
        <div><dt>Kemenangan tercepat</dt><dd>{records.fastestVictorySeconds !== null ? formatTime(records.fastestVictorySeconds) : '–'}</dd></div>
        <div><dt>Mutasi dibeli</dt><dd>{records.mutationsPurchased}</dd></div>
        <div><dt>Event Shield dialami</dt><dd>{records.shieldEventsSeen}</dd></div>
        <div><dt>Entri Patho-Dex dibuka</dt><dd>{records.dexEntriesOpened}</dd></div>
        <div><dt>Tutorial selesai</dt><dd>{records.tutorialCompleted ? 'Ya' : 'Belum'}</dd></div>
      </dl>
      {confirming ? (
        <div className="confirm-row">
          <span>Hapus semua statistik lokal?</span>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              onResetRecords();
              setConfirming(false);
              toast('Statistik lokal dihapus.', 'info');
            }}
          >
            Ya, hapus
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
            Batal
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={() => setConfirming(true)}>
          Hapus statistik lokal
        </button>
      )}
    </Modal>
  );
}
