import { useEffect, useState } from 'react';
import { Ico } from '../components/ui';
import { BOARD_LABEL, fetchBoard, type Board, type LeaderboardEntry } from '../ui/leaderboardApi';
import { formatTime } from './format';

interface Props {
  initialBoard: Board;
  backLabel: string;
  wide: boolean;
  onBack: () => void;
}

type Load = { kind: 'loading' } | { kind: 'ok'; entries: LeaderboardEntry[] } | { kind: 'error'; message: string };

const BOARDS: Board[] = ['victory', 'defeat'];
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Papan peringkat global: 20 skor teratas per papan, diverifikasi server. */
export function LeaderboardScreen({ initialBoard, backLabel, wide, onBack }: Props) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<Load>({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    fetchBoard(board)
      .then((entries) => alive && setLoad({ kind: 'ok', entries }))
      .catch((err: unknown) => alive && setLoad({ kind: 'error', message: err instanceof Error ? err.message : 'Gagal memuat.' }));
    return () => {
      alive = false;
    };
  }, [board, attempt]);

  const select = (b: Board) => {
    if (b === board) return;
    setLoad({ kind: 'loading' });
    setBoard(b);
  };
  const retry = () => {
    setLoad({ kind: 'loading' });
    setAttempt((n) => n + 1);
  };

  return (
    <section className={`screen dex${wide ? ' dex-wide' : ''}`} aria-label="Papan Peringkat">
      <div className="dex-panel">
        <div className="dex-head">
          <div className="row">
            <button type="button" className="btn btn-hi btn-back btn-back-sm" onClick={onBack}>
              <Ico name="back" stroke={2.6} />
              {backLabel}
            </button>
            <h1 className="dex-title">Papan Peringkat</h1>
          </div>
          <div className="row-wrap dex-tools">
            <div className="tabs" role="tablist" aria-label="Papan">
              {BOARDS.map((b) => (
                <button key={b} type="button" role="tab" aria-selected={board === b} className={board === b ? 'is-on' : ''} onClick={() => select(b)}>
                  {BOARD_LABEL[b]}
                </button>
              ))}
            </div>
            <span className="muted small strong lb-note">
              {board === 'victory' ? 'Infection Progress 100% paling cepat.' : 'Paling lama bertahan sebelum komunitas terlindungi.'}
            </span>
          </div>
        </div>

        <div className="dex-scroll">
          {load.kind === 'loading' && (
            <div className="lb-state">
              <div className="spinner" />
              <span>Memuat papan peringkat…</span>
            </div>
          )}
          {load.kind === 'error' && (
            <div className="lb-state" role="alert">
              <span>{load.message}</span>
              <button type="button" className="btn btn-paper btn-sm" onClick={retry}>
                Coba lagi
              </button>
            </div>
          )}
          {load.kind === 'ok' && !load.entries.length && (
            <div className="lb-state">
              <span>Belum ada skor di papan ini. Mainkan satu sesi dan jadilah yang pertama!</span>
            </div>
          )}
          {load.kind === 'ok' && load.entries.length > 0 && (
            <ol className="lb-list">
              {load.entries.map((e, i) => (
                <li key={`${e.name}-${e.date}-${i}`} className={`lb-row${i < 3 ? ` lb-top lb-top-${i + 1}` : ''}`}>
                  <span className="lb-rank">{i + 1}</span>
                  <span className="lb-main">
                    <span className="lb-name">{e.name}</span>
                    <span className="lb-meta">
                      {e.mutations.length ? `Mutasi ${e.mutations.join(', ')}` : 'Tanpa mutasi'}
                      {e.misinformation ? ' · Misinformasi' : ''} · {fmtDate(e.date)}
                    </span>
                  </span>
                  <span className="lb-time">{formatTime(e.seconds)}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="muted small strong lb-foot">
            Skor diverifikasi server dengan memutar ulang simulasi dari seed dan aksi pemain. Game ini fiktif; skor bukan ukuran kesehatan nyata.
          </p>
        </div>
      </div>
    </section>
  );
}
