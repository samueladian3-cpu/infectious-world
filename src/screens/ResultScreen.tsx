import { useState, type FormEvent } from 'react';
import { Dot, EvIcon, Ico } from '../components/ui';
import { buildDebrief } from '../content/debrief';
import { SHIELD_EVENTS } from '../game/events';
import type { ReplayLog } from '../game/replay';
import type { GameState, ShieldEventId } from '../game/types';
import { BOARD_LABEL, loadPlayerName, savePlayerName, submitScore, type Board } from '../ui/leaderboardApi';
import { IC, KIND_DOT } from '../ui/meta';
import { formatTime } from './format';

interface Props {
  state: GameState;
  replay: ReplayLog;
  onPlayAgain: () => void;
  onMenu: () => void;
  onDex: () => void;
  onLeaderboard: (board: Board) => void;
}

const TK_COLORS = ['var(--good)', 'var(--aware)', 'var(--persist)'];
const pct = (v: number) => `${v.toFixed(1).replace('.', ',')}%`;

export function ResultScreen({ state, replay, onPlayAgain, onMenu, onDex, onLeaderboard }: Props) {
  const [showAll, setShowAll] = useState(false);
  const win = state.outcome === 'victory';
  const takeaways = buildDebrief(state);
  const tkIcons = [IC.hands, state.misinformationUsed ? IC.megaphone : IC.symptom, IC.info];
  const counts: Record<ShieldEventId, number> = { E1: 0, E2: 0, E3: 0, E4: 0 };
  state.eventHistory.forEach((e) => {
    if (e.kind === 'shield' && e.shieldId) counts[e.shieldId] += 1;
  });
  const history = showAll ? state.eventHistory : state.eventHistory.slice(-8);

  return (
    <section className={`screen result ${win ? 'result-win' : 'result-lose'}`} aria-labelledby="result-title">
      <div className="result-inner">
        <div className="result-hero">
          <span className="pill-dark">{win ? 'HASIL SIMULASI: INFECTION PROGRESS 100%' : 'HASIL SIMULASI: COMMUNITY AWARENESS 100%'}</span>
          <h1 id="result-title" className="result-title" aria-label={win ? 'SIMULASI MENANG' : 'KOMUNITAS TERLINDUNGI'}>
            {win ? 'SIMULASI' : 'KOMUNITAS'}
            <br />
            <span>{win ? 'MENANG' : 'TERLINDUNGI'}</span>
          </h1>
          <p className="result-sub">
            {win
              ? 'Patogen fiktif mencapai 100% di simulasi. Ingat: ini bukan prediksi wabah nyata. Di dunia nyata, pencegahan dan kesadaran komunitas tetap penting.'
              : 'Kesadaran warga Dusun Kuannoah mencapai 100% sebelum infeksi menyebar penuh. Kamu kalah, dan itulah kabar baik bagi komunitas!'}
          </p>
        </div>

        <div className="result-grid">
          <div className="stack-12">
            <h2 className="outline-h2">Pelajaran Kesehatan</h2>
            {takeaways.map((tk, i) => (
              <article key={tk.title} className="panel takeaway">
                <div className="row">
                  <span className="tk-icon" style={{ background: TK_COLORS[i] }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF8EC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={tkIcons[i] ?? IC.info} />
                    </svg>
                  </span>
                  <h3 className="display-22">{tk.title}</h3>
                </div>
                <p>{tk.body}</p>
                <a href={tk.source.url} target="_blank" rel="noopener noreferrer" className="src-link">
                  <span className="publisher">{tk.source.publisher}</span>
                  {tk.source.title}
                  <Ico name="external" size={14} stroke={2.6} />
                </a>
              </article>
            ))}
          </div>

          <div className="stack-12">
            <div className="panel panel-hi report">
              <span className="report-stamp">SIMULASI · FIKTIF</span>
              <h2 className="display-24">Laporan Simulasi</h2>
              <dl className="report-stats">
                <div><dt>Infection Progress</dt><dd style={{ color: 'var(--infect)' }}>{pct(state.infectionRate)}</dd></div>
                <div><dt>Community Awareness</dt><dd style={{ color: 'var(--aware)' }}>{pct(state.awarenessLevel)}</dd></div>
                <div><dt>Sisa IP</dt><dd>{state.infectionPoints}</dd></div>
                <div><dt>Waktu</dt><dd>{formatTime(state.elapsedSeconds)}</dd></div>
                <div>
                  <dt>Mutasi dibeli</dt>
                  <dd>{state.unlockedNodes.length ? `${state.unlockedNodes.length} (${state.unlockedNodes.join(', ')})` : '0'}</dd>
                </div>
                <div><dt>Misinformation Surge</dt><dd>{state.misinformationUsed ? 'Digunakan' : 'Tidak digunakan'}</dd></div>
              </dl>
              <h3 className="label-13">EVENT BEHAVIOR SHIELD</h3>
              <ul className="shield-counts">
                {SHIELD_EVENTS.map((e) => (
                  <li key={e.id}>
                    <span className="ev-badge ev-badge-sm"><EvIcon id={e.id} size={24} stroke={3.4} /></span>
                    <span className="sc-title">{e.title}</span>
                    <span className="sc-n">×{counts[e.id]}</span>
                  </li>
                ))}
              </ul>
            </div>

            <ScoreSubmit win={win} seconds={state.elapsedSeconds} replay={replay} onLeaderboard={onLeaderboard} />

            <div className="panel history">
              <h2 className="display-20">Riwayat Peristiwa</h2>
              <ol>
                {history.map((h, i) => (
                  <li key={`${h.at}-${i}`}>
                    <span className="tick-at">{formatTime(h.at)}</span>
                    <Dot path={KIND_DOT[h.kind][1]} color={KIND_DOT[h.kind][0]} size={14} />
                    <span className="tick-text">{h.message}</span>
                  </li>
                ))}
              </ol>
              {state.eventHistory.length > 8 && (
                <button type="button" className="btn-plain" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? 'Ringkas' : `Lihat semua (${state.eventHistory.length})`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="sticky-bar" aria-label="Navigasi hasil">
        <div className="sticky-inner result-actions">
          <button type="button" className="btn btn-red btn-result" onClick={onPlayAgain}>
            <Ico name="restart" size={22} stroke={2.8} />
            MAIN LAGI
          </button>
          <button type="button" className="btn btn-hi btn-result-2" onClick={onDex}>
            Patho-Dex
          </button>
          <button type="button" className="btn btn-hi btn-result-2" onClick={onMenu}>
            Menu Utama
          </button>
        </div>
      </nav>
    </section>
  );
}

type SubmitState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done'; rank: number; board: Board } | { kind: 'error'; message: string };

/** Kirim hasil ke papan peringkat global (diverifikasi server lewat replay). */
function ScoreSubmit({ win, seconds, replay, onLeaderboard }: { win: boolean; seconds: number; replay: ReplayLog; onLeaderboard: (b: Board) => void }) {
  const [name, setName] = useState(loadPlayerName);
  const [st, setSt] = useState<SubmitState>({ kind: 'idle' });
  const board: Board = win ? 'victory' : 'defeat';

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (st.kind === 'sending' || st.kind === 'done') return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setSt({ kind: 'error', message: 'Nama minimal 2 karakter.' });
      return;
    }
    setSt({ kind: 'sending' });
    try {
      const r = await submitScore(trimmed, replay);
      savePlayerName(trimmed);
      setSt({ kind: 'done', rank: r.rank, board: r.board });
    } catch (err) {
      setSt({ kind: 'error', message: err instanceof Error ? err.message : 'Gagal mengirim skor.' });
    }
  };

  return (
    <div className="panel score-panel">
      <div className="row">
        <span className="tk-icon" style={{ background: 'var(--ip)' }}>
          <Ico name="trophy" size={22} stroke={2.4} style={{ color: 'var(--ink)' }} />
        </span>
        <h2 className="display-22">Papan Peringkat</h2>
      </div>
      {st.kind === 'done' ? (
        <>
          <p className="score-done">
            Peringkat <strong>#{st.rank}</strong> di papan <strong>{BOARD_LABEL[st.board]}</strong> dengan waktu {formatTime(seconds)}.
          </p>
          <button type="button" className="btn btn-paper btn-md" onClick={() => onLeaderboard(st.board)}>
            Lihat Papan Peringkat
          </button>
        </>
      ) : (
        <form className="score-form" onSubmit={send}>
          <p className="muted small">
            Masuk papan <strong>{BOARD_LABEL[board]}</strong> ({formatTime(seconds)}). Server memutar ulang simulasimu untuk memastikan skornya sah.
          </p>
          <label className="field-label" htmlFor="player-name">Nama pemain</label>
          <div className="score-row">
            <input
              id="player-name"
              className="text-input"
              value={name}
              maxLength={16}
              autoComplete="nickname"
              placeholder="2–16 huruf/angka"
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className="btn btn-red btn-md btn-send" aria-disabled={st.kind === 'sending'}>
              <Ico name="send" size={18} stroke={2.4} />
              {st.kind === 'sending' ? 'MENGIRIM…' : 'KIRIM SKOR'}
            </button>
          </div>
          {st.kind === 'error' && (
            <p className="form-error" role="alert">
              {st.message}
            </p>
          )}
          <button type="button" className="btn-plain" onClick={() => onLeaderboard(board)}>
            Lihat papan tanpa mengirim
          </button>
        </form>
      )}
    </div>
  );
}
