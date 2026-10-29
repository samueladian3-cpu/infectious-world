import { useMemo, useState, type ReactNode } from 'react';
import { Ico } from '../components/ui';
import { Specimen } from '../components/World3D';
import { FACT_CHECKS, PATHOGENS, type FactCheck, type PathogenEntry } from '../content/pathodex';
import type { Source } from '../content/sources';
import { IC } from '../ui/meta';

type Tab = 'pathogens' | 'factchecks';
type Selection = { kind: 'pathogen'; entry: PathogenEntry } | { kind: 'fact'; entry: FactCheck } | null;

const VERDICT: Record<FactCheck['verdict'], { color: string; icon: string }> = {
  Benar: { color: 'var(--good)', icon: IC.check },
  Salah: { color: 'var(--infect)', icon: IC.x },
  'Perlu Konteks': { color: 'var(--context)', icon: IC.q },
};

interface Props {
  onBack: () => void;
  backLabel: string;
  wide: boolean;
  onOpenEntry: () => void;
}

function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ul className="source-list">
      {sources.map((s) => (
        <li key={s.url}>
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            <span className="publisher">{s.publisher}</span>
            {s.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Verdict({ verdict, big = false }: { verdict: FactCheck['verdict']; big?: boolean }) {
  const v = VERDICT[verdict];
  return (
    <span className={big ? 'verdict verdict-big' : 'verdict'} style={{ color: v.color, borderColor: v.color }}>
      <svg width={big ? 22 : 15} height={big ? 22 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={v.icon} />
      </svg>
      {verdict}
    </span>
  );
}

const norm = (s: string) => s.toLowerCase();

export function PathoDex({ onBack, backLabel, wide, onOpenEntry }: Props) {
  const [tab, setTab] = useState<Tab>('pathogens');
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<Selection>(null);

  const q = norm(query.trim());
  const pathogens = useMemo(
    () => PATHOGENS.filter((p) => !q || norm(`${p.commonName} ${p.scientificName} ${p.organismType} ${p.shortDescription}`).includes(q)),
    [q],
  );
  const facts = useMemo(() => FACT_CHECKS.filter((f) => !q || norm(`${f.claim} ${f.verdict} ${f.explanation}`).includes(q)), [q]);

  const open = (s: Selection) => {
    setSel(s);
    onOpenEntry();
  };

  return (
    <section className={`screen dex${wide ? ' dex-wide' : ''}`} aria-label="Patho-Dex dan Fact-Checks">
      <div className="dex-panel">
        <div className="dex-head">
          <div className="row">
            <button type="button" className="btn btn-hi btn-back btn-back-sm" onClick={sel ? () => setSel(null) : onBack}>
              <Ico name="back" stroke={2.6} />
              {sel ? 'Daftar' : backLabel}
            </button>
            <h1 className="dex-title">Patho-Dex &amp; Fact-Checks</h1>
          </div>
          {!sel && (
            <div className="row-wrap dex-tools">
              <div className="tabs" role="tablist" aria-label="Kategori">
                <button type="button" role="tab" aria-selected={tab === 'pathogens'} className={tab === 'pathogens' ? 'is-on' : ''} onClick={() => setTab('pathogens')}>
                  Patogen ({pathogens.length})
                </button>
                <button type="button" role="tab" aria-selected={tab === 'factchecks'} className={tab === 'factchecks' ? 'is-on' : ''} onClick={() => setTab('factchecks')}>
                  Fact-Checks ({facts.length})
                </button>
              </div>
              <label className="search">
                <Ico name="search" size={18} stroke={2.6} />
                <span className="sr-only">Cari entri</span>
                <input type="search" placeholder="Cari: antibiotik, nyamuk, cuci tangan…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
            </div>
          )}
        </div>

        <div className="dex-scroll">
          {!sel && tab === 'pathogens' && (
            <ul className="dex-list">
              {pathogens.map((p) => (
                <li key={p.id}>
                  <button type="button" className="dex-item" onClick={() => open({ kind: 'pathogen', entry: p })}>
                    <span className="dex-thumb">
                      <Specimen kind={p.id} locked={!p.playable} />
                    </span>
                    <span className="dex-item-text">
                      <span className="row-wrap">
                        <span className="display-22">{p.commonName}</span>
                        <span className="chip chip-xs">{p.organismType}</span>
                        {!p.playable && <span className="chip chip-xs chip-ip">Pratinjau</span>}
                      </span>
                      <span className="sci">{p.scientificName}</span>
                      <span className="dex-desc">{p.shortDescription}</span>
                    </span>
                  </button>
                </li>
              ))}
              {!pathogens.length && <li className="empty">Tidak ada entri yang cocok.</li>}
            </ul>
          )}

          {!sel && tab === 'factchecks' && (
            <ul className="dex-list">
              {facts.map((f) => (
                <li key={f.id}>
                  <button type="button" className="dex-item dex-fact" onClick={() => open({ kind: 'fact', entry: f })}>
                    <Verdict verdict={f.verdict} />
                    <span className="dex-claim">“{f.claim}”</span>
                  </button>
                </li>
              ))}
              {!facts.length && <li className="empty">Tidak ada entri yang cocok.</li>}
            </ul>
          )}

          {sel?.kind === 'pathogen' && (
            <article className="dex-detail">
              <div className="dex-detail-top">
                <div className="dex-viewer">
                  <Specimen kind={sel.entry.id} locked={!sel.entry.playable} />
                  <span className="pcard-code dex-size">Model ilustratif · {sel.entry.size}</span>
                </div>
                <div className="stack-6">
                  <div className="row-wrap">
                    <span className="chip">{sel.entry.organismType}</span>
                    {!sel.entry.playable && <span className="chip chip-ip">Pratinjau edukasi · belum dapat dimainkan</span>}
                  </div>
                  <h2 className="display-40">{sel.entry.commonName}</h2>
                  <span className="sci sci-lg">{sel.entry.scientificName}</span>
                </div>
              </div>
              <DexSection title="Signifikansi kesehatan"><p>{sel.entry.significance}</p></DexSection>
              <DexSection title="Penularan"><p>{sel.entry.transmission}</p></DexSection>
              <DexSection title="Gejala"><ul>{sel.entry.symptoms.map((s) => <li key={s}>{s}</li>)}</ul></DexSection>
              <DexSection title="Konteks risiko"><p>{sel.entry.riskContext}</p></DexSection>
              <DexSection title="Pencegahan"><ul>{sel.entry.prevention.map((s) => <li key={s}>{s}</li>)}</ul></DexSection>
              <DexSection title="Miskonsepsi">
                {sel.entry.misconceptions.map((m) => (
                  <div key={m.myth} className="myth">
                    <div className="myth-row">
                      <span className="stamp stamp-red">✕ MITOS</span>
                      <s>{m.myth}</s>
                    </div>
                    <div className="myth-row">
                      <span className="stamp stamp-green">✓ FAKTA</span>
                      <span>{m.fact}</span>
                    </div>
                  </div>
                ))}
              </DexSection>
              <DexSection title="Sumber">
                <SourceList sources={sel.entry.sources} />
                <p className="muted small strong">Ukuran model ({sel.entry.size}):</p>
                <SourceList sources={[sel.entry.sizeSource]} />
                <p className="muted small strong">Informasi ini untuk edukasi umum dan bukan pengganti saran tenaga kesehatan.</p>
              </DexSection>
            </article>
          )}

          {sel?.kind === 'fact' && (
            <article className="dex-detail dex-fact-detail">
              <Verdict verdict={sel.entry.verdict} big />
              <h2 className="fact-claim">“{sel.entry.claim}”</h2>
              <p className="fact-expl">{sel.entry.explanation}</p>
              <DexSection title="Sumber">
                {sel.entry.sources.length ? (
                  <SourceList sources={sel.entry.sources} />
                ) : (
                  <p className="muted small strong">Pernyataan tentang mekanik game ini sendiri, tidak memerlukan sumber medis.</p>
                )}
              </DexSection>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

function DexSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dex-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
