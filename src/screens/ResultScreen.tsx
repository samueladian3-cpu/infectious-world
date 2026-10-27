import { Icon } from '../components/Icon';
import { buildDebrief } from '../content/debrief';
import { SHIELD_BY_ID } from '../game/events';
import type { GameState, ShieldEventId } from '../game/types';
import { formatTime } from './format';

interface Props {
  state: GameState;
  onPlayAgain: () => void;
  onMenu: () => void;
  onDex: () => void;
}

export function ResultScreen({ state, onPlayAgain, onMenu, onDex }: Props) {
  const victory = state.outcome === 'victory';
  const takeaways = buildDebrief(state);
  const shieldCounts = state.eventHistory.reduce<Partial<Record<ShieldEventId, number>>>((acc, e) => {
    if (e.kind === 'shield' && e.shieldId) acc[e.shieldId] = (acc[e.shieldId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className={`screen result ${victory ? 'result-victory' : 'result-defeat'}`}>
      <section className="result-hero glass" aria-labelledby="result-title">
        <div className="result-icon" aria-hidden="true">
          <Icon name={victory ? 'virus' : 'shield'} size={56} />
        </div>
        <p className="eyebrow">{victory ? 'Hasil simulasi: Infection Progress 100%' : 'Hasil simulasi: Community Awareness 100%'}</p>
        <h1 id="result-title">{victory ? 'SIMULASI MENANG' : 'KOMUNITAS TERLINDUNGI'}</h1>
        <p className="subtitle">
          {victory
            ? 'Patogen fiktif mencapai 100% di simulasi. Ingat: ini bukan prediksi wabah nyata. Di dunia nyata, pencegahan dan kesadaran komunitas tetap penting.'
            : 'Kesadaran warga Dusun Kuannoah mencapai 100% sebelum infeksi menyebar penuh. Kamu kalah, dan itulah kabar baik bagi komunitas!'}
        </p>
      </section>

      <div className="result-grid">
        <section className="glass panel" aria-labelledby="stats-title">
          <h2 id="stats-title" className="panel-head">Statistik Akhir</h2>
          <dl className="stat-grid">
            <div><dt>Infection Progress</dt><dd>{state.infectionRate.toFixed(1)}%</dd></div>
            <div><dt>Community Awareness</dt><dd>{state.awarenessLevel.toFixed(1)}%</dd></div>
            <div><dt>Sisa IP</dt><dd>{state.infectionPoints}</dd></div>
            <div><dt>Waktu</dt><dd>{formatTime(state.elapsedSeconds)}</dd></div>
            <div><dt>Mutasi dibeli</dt><dd>{state.unlockedNodes.length}{state.unlockedNodes.length ? ` (${state.unlockedNodes.join(', ')})` : ''}</dd></div>
            <div><dt>Misinformation Surge</dt><dd>{state.misinformationUsed ? 'Digunakan' : 'Tidak digunakan'}</dd></div>
          </dl>
          <h3 className="small-head">Event Behavior Shield</h3>
          {Object.keys(shieldCounts).length ? (
            <ul className="shield-list">
              {(Object.entries(shieldCounts) as [ShieldEventId, number][]).map(([id, n]) => (
                <li key={id}>
                  <Icon name="shield" size={16} /> {SHIELD_BY_ID[id].title} <strong>×{n}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Belum ada event yang terjadi.</p>
          )}
        </section>

        <section className="glass panel" aria-labelledby="debrief-title">
          <h2 id="debrief-title" className="panel-head">Pelajaran Kesehatan</h2>
          <ol className="takeaways">
            {takeaways.map((t) => (
              <li key={t.title}>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
                <a href={t.source.url} target="_blank" rel="noopener noreferrer" className="src-link">
                  <Icon name="link" size={14} /> {t.source.publisher}: {t.source.title}
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section className="glass panel timeline" aria-labelledby="history-title">
          <h2 id="history-title" className="panel-head">Riwayat Peristiwa</h2>
          <ol>
            {state.eventHistory.map((e, i) => (
              <li key={i} className={`hist hist-${e.kind}`}>
                <time>{formatTime(e.at)}</time> {e.message}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <nav className="result-actions" aria-label="Navigasi hasil">
        <button type="button" className="btn btn-primary btn-lg" onClick={onPlayAgain}>
          <Icon name="restart" /> PLAY AGAIN
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDex}>
          <Icon name="book" /> Patho-Dex
        </button>
        <button type="button" className="btn btn-ghost" onClick={onMenu}>
          <Icon name="home" /> Menu Utama
        </button>
      </nav>
    </main>
  );
}
