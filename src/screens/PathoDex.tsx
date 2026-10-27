import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { FACT_CHECKS, PATHOGENS, type FactCheck, type PathogenEntry } from '../content/pathodex';
import type { Source } from '../content/sources';

type Tab = 'pathogens' | 'factchecks';
type Selection = { kind: 'pathogen'; entry: PathogenEntry } | { kind: 'fact'; entry: FactCheck } | null;

interface Props {
  onBack: () => void;
  backLabel: string;
  onOpenEntry: () => void;
}

function Sources({ sources }: { sources: Source[] }) {
  if (!sources.length) return <p className="muted small">Pernyataan tentang mekanik game ini sendiri, tidak memerlukan sumber medis.</p>;
  return (
    <ul className="sources">
      {sources.map((s) => (
        <li key={s.url}>
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            <Icon name="link" size={14} /> {s.publisher}: {s.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

const norm = (s: string) => s.toLowerCase();

export function PathoDex({ onBack, backLabel, onOpenEntry }: Props) {
  const [tab, setTab] = useState<Tab>('pathogens');
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<Selection>(null);

  const q = norm(query.trim());
  const pathogens = useMemo(
    () => PATHOGENS.filter((p) => !q || norm(`${p.commonName} ${p.scientificName} ${p.organismType} ${p.shortDescription}`).includes(q)),
    [q],
  );
  const facts = useMemo(
    () => FACT_CHECKS.filter((f) => !q || norm(`${f.claim} ${f.verdict} ${f.explanation}`).includes(q)),
    [q],
  );

  const open = (s: Selection) => {
    setSel(s);
    onOpenEntry();
  };

  return (
    <main className="screen dex">
      <header className="screen-head">
        <button type="button" className="btn btn-ghost btn-sm" onClick={sel ? () => setSel(null) : onBack}>
          <Icon name="back" /> {sel ? 'Daftar' : backLabel}
        </button>
        <h1>Patho-Dex &amp; Fact-Checks</h1>
      </header>

      {!sel && (
        <>
          <div className="dex-tools">
            <div className="tabs" role="tablist" aria-label="Kategori">
              <button type="button" role="tab" aria-selected={tab === 'pathogens'} className={`tab${tab === 'pathogens' ? ' tab-on' : ''}`} onClick={() => setTab('pathogens')}>
                Patogen ({pathogens.length})
              </button>
              <button type="button" role="tab" aria-selected={tab === 'factchecks'} className={`tab${tab === 'factchecks' ? ' tab-on' : ''}`} onClick={() => setTab('factchecks')}>
                Fact-Checks ({facts.length})
              </button>
            </div>
            <label className="search">
              <Icon name="search" size={18} />
              <span className="sr-only">Cari entri</span>
              <input type="search" placeholder="Cari: antibiotik, nyamuk, cuci tangan…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
          </div>

          {tab === 'pathogens' ? (
            <ul className="dex-list">
              {pathogens.map((p) => (
                <li key={p.id}>
                  <button type="button" className="dex-item glass" onClick={() => open({ kind: 'pathogen', entry: p })}>
                    <span className={`pcard-icon pc-${p.id}`}><Icon name="virus" size={26} /></span>
                    <span className="dex-item-text">
                      <strong>{p.commonName}</strong>
                      <em>{p.scientificName}</em>
                      <span>{p.shortDescription}</span>
                    </span>
                    <span className="badge">{p.organismType}</span>
                    {!p.playable && <span className="badge status-locked">Pratinjau</span>}
                  </button>
                </li>
              ))}
              {!pathogens.length && <li className="muted">Tidak ada entri yang cocok.</li>}
            </ul>
          ) : (
            <ul className="dex-list">
              {facts.map((f) => (
                <li key={f.id}>
                  <button type="button" className="dex-item glass" onClick={() => open({ kind: 'fact', entry: f })}>
                    <span className={`verdict v-${f.verdict === 'Benar' ? 'true' : f.verdict === 'Salah' ? 'false' : 'ctx'}`}>
                      {f.verdict === 'Benar' ? '✓' : f.verdict === 'Salah' ? '✗' : '?'} {f.verdict}
                    </span>
                    <span className="dex-item-text"><strong>“{f.claim}”</strong></span>
                  </button>
                </li>
              ))}
              {!facts.length && <li className="muted">Tidak ada entri yang cocok.</li>}
            </ul>
          )}
        </>
      )}

      {sel?.kind === 'pathogen' && (
        <article className="dex-detail glass">
          <div className="detail-head">
            <span className="badge">{sel.entry.organismType}</span>
            {!sel.entry.playable && <span className="badge status-locked">Pratinjau edukasi · belum dapat dimainkan</span>}
          </div>
          <h2>{sel.entry.commonName}</h2>
          <p className="sci">{sel.entry.scientificName}</p>
          <h3>Signifikansi kesehatan</h3>
          <p>{sel.entry.significance}</p>
          <h3>Penularan</h3>
          <p>{sel.entry.transmission}</p>
          <h3>Gejala</h3>
          <ul>{sel.entry.symptoms.map((s) => <li key={s}>{s}</li>)}</ul>
          <h3>Konteks risiko</h3>
          <p>{sel.entry.riskContext}</p>
          <h3>Pencegahan</h3>
          <ul>{sel.entry.prevention.map((s) => <li key={s}>{s}</li>)}</ul>
          <h3>Miskonsepsi</h3>
          <ul className="myths">
            {sel.entry.misconceptions.map((m) => (
              <li key={m.myth}>
                <span className="verdict v-false">✗ Mitos</span> {m.myth}
                <br />
                <span className="verdict v-true">✓ Fakta</span> {m.fact}
              </li>
            ))}
          </ul>
          <h3>Sumber</h3>
          <Sources sources={sel.entry.sources} />
          <p className="muted small">Informasi ini untuk edukasi umum dan bukan pengganti saran tenaga kesehatan.</p>
        </article>
      )}

      {sel?.kind === 'fact' && (
        <article className="dex-detail glass">
          <span className={`verdict v-${sel.entry.verdict === 'Benar' ? 'true' : sel.entry.verdict === 'Salah' ? 'false' : 'ctx'}`}>
            {sel.entry.verdict}
          </span>
          <h2>“{sel.entry.claim}”</h2>
          <p>{sel.entry.explanation}</p>
          <h3>Sumber</h3>
          <Sources sources={sel.entry.sources} />
        </article>
      )}
    </main>
  );
}
