import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { PathogenArt } from '../components/PathogenArt';
import { Ico } from '../components/ui';
import { Specimen } from '../components/World3D';
import { CATEGORY_NOTE, FACT_CHECKS, GAME_TERMS, GLOSSARY, PATHOGENS, PATHOGEN_BY_ID, type FactCheck, type PathogenCategory, type PathogenEntry, type Verdict } from '../content/pathodex';
import type { Source } from '../content/sources';
import { SCENARIOS, SCENARIO_BY_ID } from '../game/scenarios';
import type { PathogenId } from '../game/types';
import type { SpecimenKind } from '../three/kuannoah3d';
import { IC, PATHOGEN_COLOR } from '../ui/meta';

type Tab = 'pathogens' | 'factchecks' | 'glossary';
type Selection = { kind: 'pathogen'; entry: PathogenEntry } | { kind: 'fact'; entry: FactCheck } | null;
type CatFilter = 'Semua' | PathogenCategory;

const VERDICT: Record<Verdict, { color: string; icon: string }> = {
  Fakta: { color: 'var(--good)', icon: IC.check },
  Mitos: { color: 'var(--infect)', icon: IC.x },
  'Perlu Konteks': { color: 'var(--context)', icon: IC.q },
};

const CATS: CatFilter[] = ['Semua', 'Virus', 'Bakteri', 'Parasit'];
const HAS_3D: PathogenId[] = ['rhinovirus', 'ecoli', 'dengue'];

interface Props {
  onBack: () => void;
  backLabel: string;
  wide: boolean;
  initialEntry?: PathogenId | null;
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

function VerdictTag({ verdict, big = false }: { verdict: Verdict; big?: boolean }) {
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

export function PathoDex({ onBack, backLabel, wide, initialEntry = null, onOpenEntry }: Props) {
  const [tab, setTab] = useState<Tab>('pathogens');
  const [cat, setCat] = useState<CatFilter>('Semua');
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<Selection>(initialEntry ? { kind: 'pathogen', entry: PATHOGEN_BY_ID[initialEntry] } : null);

  useEffect(() => {
    if (initialEntry) onOpenEntry();
    // Hanya saat dibuka langsung ke satu entri.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = norm(query.trim());
  const pathogens = useMemo(
    () =>
      PATHOGENS.filter((p) => (cat === 'Semua' || p.category === cat) && (!q || norm(`${p.commonName} ${p.scientificName} ${p.category} ${p.disease} ${p.shortDescription}`).includes(q))),
    [q, cat],
  );
  const facts = useMemo(() => FACT_CHECKS.filter((f) => !q || norm(`${f.claim} ${f.verdict} ${f.explanation}`).includes(q)), [q]);
  const glossary = useMemo(() => [...GLOSSARY, ...GAME_TERMS].filter((g) => !q || norm(`${g.term} ${g.meaning}`).includes(q)), [q]);

  const open = (s: Selection) => {
    setSel(s);
    onOpenEntry();
  };

  return (
    <section className={`screen dex${wide ? ' dex-wide' : ''}`} aria-label="Patho-Dex">
      <div className="dex-panel">
        <div className="dex-head">
          <div className="row">
            <button type="button" className="btn btn-hi btn-back btn-back-sm" onClick={sel ? () => setSel(null) : onBack}>
              <Ico name="back" stroke={2.6} />
              {sel ? 'Daftar' : backLabel}
            </button>
            <h1 className="dex-title">
              Patho-Dex <small>ensiklopedia kuman</small>
            </h1>
          </div>
          {!sel && (
            <div className="row-wrap dex-tools">
              <div className="tabs" role="tablist" aria-label="Kategori">
                <button type="button" role="tab" aria-selected={tab === 'pathogens'} className={tab === 'pathogens' ? 'is-on' : ''} onClick={() => setTab('pathogens')}>
                  Patogen ({pathogens.length})
                </button>
                <button type="button" role="tab" aria-selected={tab === 'factchecks'} className={tab === 'factchecks' ? 'is-on' : ''} onClick={() => setTab('factchecks')}>
                  Mitos &amp; Fakta ({facts.length})
                </button>
                <button type="button" role="tab" aria-selected={tab === 'glossary'} className={tab === 'glossary' ? 'is-on' : ''} onClick={() => setTab('glossary')}>
                  Istilah ({glossary.length})
                </button>
              </div>
              <label className="search">
                <Ico name="search" size={18} stroke={2.6} />
                <span className="sr-only">Cari entri</span>
                <input type="search" placeholder="Cari: HIV, nyamuk, oralit, antibiotik…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
            </div>
          )}
        </div>

        <div className="dex-scroll">
          {!sel && tab === 'pathogens' && (
            <>
              <div className="seg seg-cats" role="radiogroup" aria-label="Jenis patogen">
                {CATS.map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={cat === c} className={cat === c ? 'is-on' : ''} onClick={() => setCat(c)}>
                    {c}
                  </button>
                ))}
              </div>
              {cat !== 'Semua' && <p className="cat-note">{CATEGORY_NOTE[cat]}</p>}
              <ul className="dex-list">
                {pathogens.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="dex-item" onClick={() => open({ kind: 'pathogen', entry: p })}>
                      <span className="dex-thumb dex-thumb-art" style={{ '--accent': PATHOGEN_COLOR[p.id] } as React.CSSProperties}>
                        <PathogenArt id={p.id} size="88%" />
                      </span>
                      <span className="dex-item-text">
                        <span className="row-wrap">
                          <span className="display-22">{p.commonName}</span>
                          <span className="chip chip-xs">{p.category}</span>
                          {p.scenario && <span className="chip chip-xs chip-red">Skenario {SCENARIO_BY_ID[p.scenario].name}</span>}
                        </span>
                        <span className="sci">{p.scientificName}</span>
                        <span className="dex-desc">{p.shortDescription}</span>
                      </span>
                    </button>
                  </li>
                ))}
                {!pathogens.length && <li className="empty">Tidak ada entri yang cocok.</li>}
              </ul>
            </>
          )}

          {!sel && tab === 'factchecks' && (
            <ul className="dex-list">
              {facts.map((f) => (
                <li key={f.id}>
                  <button type="button" className="dex-item dex-fact" onClick={() => open({ kind: 'fact', entry: f })}>
                    <VerdictTag verdict={f.verdict} />
                    <span className="dex-claim">“{f.claim}”</span>
                    {f.scenario && <span className="chip chip-xs">{SCENARIO_BY_ID[f.scenario].name}</span>}
                  </button>
                </li>
              ))}
              {!facts.length && <li className="empty">Tidak ada entri yang cocok.</li>}
            </ul>
          )}

          {!sel && tab === 'glossary' && (
            <dl className="glossary">
              {glossary.map((g) => (
                <div key={g.term}>
                  <dt>{g.term}</dt>
                  <dd>{g.meaning}</dd>
                </div>
              ))}
              {!glossary.length && <p className="empty">Tidak ada istilah yang cocok.</p>}
            </dl>
          )}

          {sel?.kind === 'pathogen' && <PathogenDetail entry={sel.entry} onFact={(f) => open({ kind: 'fact', entry: f })} />}

          {sel?.kind === 'fact' && (
            <article className="dex-detail dex-fact-detail">
              <VerdictTag verdict={sel.entry.verdict} big />
              <h2 className="fact-claim">“{sel.entry.claim}”</h2>
              <p className="fact-expl">{sel.entry.explanation}</p>
              {sel.entry.scenario && <p className="muted small strong">Muncul sebagai kuis di skenario {SCENARIO_BY_ID[sel.entry.scenario].name}.</p>}
              <DexSection title="Sumber">
                {sel.entry.dexId ? (
                  <>
                    <SourceList sources={PATHOGEN_BY_ID[sel.entry.dexId].sources} />
                    <button type="button" className="btn btn-hi btn-sm btn-start" onClick={() => open({ kind: 'pathogen', entry: PATHOGEN_BY_ID[sel.entry.dexId!] })}>
                      <PathogenArt id={sel.entry.dexId} size={26} />
                      Buka entri {PATHOGEN_BY_ID[sel.entry.dexId].commonName}
                    </button>
                  </>
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

function PathogenDetail({ entry: e, onFact }: { entry: PathogenEntry; onFact: (f: FactCheck) => void }) {
  const [show3d, setShow3d] = useState(false);
  const can3d = HAS_3D.includes(e.id);
  const quizzes = FACT_CHECKS.filter((f) => f.dexId === e.id && f.scenario);
  const dilemmas = SCENARIOS.flatMap((sc) => sc.decisions.filter((d) => d.kind === 'dilemma' && d.dexId === e.id).map((d) => ({ sc, d })));

  return (
    <article className="dex-detail">
      <div className="dex-detail-top">
        <div className="dex-viewer" style={{ '--accent': PATHOGEN_COLOR[e.id] } as React.CSSProperties}>
          {show3d && can3d ? <Specimen kind={e.id as SpecimenKind} locked={false} /> : <PathogenArt id={e.id} size="78%" float title={`Ilustrasi ${e.commonName}`} />}
          <span className="pcard-code dex-size">Ilustrasi{e.size ? ` · ${e.size}` : ''}</span>
          {can3d && (
            <button type="button" className="pill-btn dex-3d" onClick={() => setShow3d((v) => !v)} aria-pressed={show3d}>
              {show3d ? 'Ilustrasi' : 'Model 3D'}
            </button>
          )}
        </div>
        <div className="stack-6">
          <div className="row-wrap">
            <span className="chip">{e.category}</span>
            {e.scenario && <span className="chip chip-red">Bisa dimainkan: skenario {SCENARIO_BY_ID[e.scenario].name}</span>}
          </div>
          <h2 className="display-40">{e.commonName}</h2>
          <span className="sci sci-lg">{e.scientificName}</span>
          <span className="muted small strong">{CATEGORY_NOTE[e.category]}</span>
        </div>
      </div>
      <DexSection title="Penyakit">
        <p>{e.disease}</p>
      </DexSection>
      <DexSection title="Penyebab">
        <p>{e.cause}</p>
      </DexSection>
      <DexSection title="Cara penularan">
        <p>{e.transmission}</p>
        {e.notTransmitted && (
          <div className="not-transmitted">
            <Ico name="shield" size={20} stroke={2.6} />
            <p>
              <strong>Penting:</strong> {e.notTransmitted}
            </p>
          </div>
        )}
      </DexSection>
      <DexSection title="Gejala umum">
        <ul>{e.symptoms.map((s) => <li key={s}>{s}</li>)}</ul>
      </DexSection>
      <DexSection title="Faktor risiko">
        <ul>{e.riskFactors.map((s) => <li key={s}>{s}</li>)}</ul>
      </DexSection>
      <DexSection title="Pencegahan">
        <ul>{e.prevention.map((s) => <li key={s}>{s}</li>)}</ul>
      </DexSection>
      <DexSection title="Penanganan">
        <p>{e.treatment}</p>
      </DexSection>
      <DexSection title="Mitos vs fakta">
        {e.misconceptions.map((m) => (
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
      {(quizzes.length > 0 || dilemmas.length > 0) && (
        <DexSection title="Di dalam game">
          {dilemmas.length > 0 && (
            <p>
              Momen Penentu terkait: {dilemmas.map(({ sc, d }) => `${d.kind === 'dilemma' ? d.title : ''} (${sc.name})`).join(', ')}.
            </p>
          )}
          {quizzes.length > 0 && (
            <ul className="game-quiz-list">
              {quizzes.map((f) => (
                <li key={f.id}>
                  <button type="button" className="btn-plain" onClick={() => onFact(f)}>
                    Kuis {f.scenario ? SCENARIO_BY_ID[f.scenario].name : ''}: “{f.claim}”
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DexSection>
      )}
      <DexSection title="Sumber">
        <SourceList sources={e.sources} />
        {e.size && e.sizeSource && (
          <>
            <p className="muted small strong">Ukuran ({e.size}):</p>
            <SourceList sources={[e.sizeSource]} />
          </>
        )}
        <p className="muted small strong">Informasi ini untuk edukasi umum dan bukan pengganti saran tenaga kesehatan.</p>
      </DexSection>
    </article>
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
