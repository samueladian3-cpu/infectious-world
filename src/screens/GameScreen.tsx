import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MutationTree } from '../components/MutationTree';
import { useToast } from '../components/Toast';
import { Dot, EvIcon, Ico, PlayIcon, Ring } from '../components/ui';
import { CONFIG } from '../game/config';
import {
  canUseMisinformation,
  currentAwarenessGain,
  currentInfectionGain,
  effectiveAwarenessBonus,
  effectiveInfectionReduction,
  isTerminal,
  purchaseMutation,
} from '../game/engine';
import { SHIELD_BY_ID } from '../game/events';
import { MUTATIONS } from '../game/mutations';
import type { GameState, MutationId } from '../game/types';
import { useDialog } from '../ui/hooks';
import { mapCounts } from '../ui/map';
import { IC, PIN_ROUND, PIN_SHIELD, SHIELD_SHORT, TONE_DOT } from '../ui/meta';
import { fmtRate, formatTime } from './format';

type Coach = 'ip' | 'shield' | 'mut';

interface Props {
  state: GameState;
  wide: boolean;
  compact: boolean;
  /** Coach mark hanya untuk sesi pertama. */
  coaching: boolean;
  lens: boolean;
  onLens: () => void;
  tip: string | null;
  settingsOpen: boolean;
  onPurchase: (id: MutationId) => void;
  onMisinformation: () => void;
  onPause: (paused: boolean) => void;
  onQuit: () => void;
  onSettings: () => void;
}

interface Float {
  id: number;
  text: string;
}

export function GameScreen(props: Props) {
  const { state, wide, compact, coaching, lens, onLens, tip, settingsOpen, onPurchase, onMisinformation, onPause, onQuit, onSettings } = props;
  const toast = useToast();
  const [treeOpen, setTreeOpen] = useState(false);
  const [selNode, setSelNode] = useState<MutationId>('B1');
  const [confirmExit, setConfirmExit] = useState(false);
  const [resumeAfterExit, setResumeAfterExit] = useState(false);
  const [tickerOpen, setTickerOpen] = useState(false);
  const [floats, setFloats] = useState<Float[]>([]);
  const [coach, setCoach] = useState<Coach | null>(null);
  const coachDone = useRef(new Set<Coach>());
  const floatId = useRef(1);
  const prev = useRef(state);

  const t = state.elapsedSeconds;
  const paused = state.gameStatus === 'paused';
  const ended = isTerminal(state);
  const infG = currentInfectionGain(state);
  const awG = currentAwarenessGain(state);
  const ipIn = CONFIG.ipIntervalSeconds - (t % CONFIG.ipIntervalSeconds);
  const shield = state.activeShield ? SHIELD_BY_ID[state.activeShield.id] : null;
  const nextShield = CONFIG.shield.intervalSeconds - (t % CONFIG.shield.intervalSeconds);
  const owned = new Set(state.unlockedNodes);
  const avail = MUTATIONS.filter((m) => !owned.has(m.id) && (!m.prerequisite || owned.has(m.prerequisite)));
  const buyable = avail.filter((m) => state.infectionPoints >= m.cost);
  const cheapest = [...avail].sort((a, b) => a.cost - b.cost)[0];
  const misChk = canUseMisinformation(state);
  const misActive = state.factCheckDueAt !== null;
  const effRed = effectiveInfectionReduction(state);
  const effAw = effectiveAwarenessBonus(state);

  const showCoach = (id: Coach) => {
    if (!coaching || coachDone.current.has(id)) return;
    coachDone.current.add(id);
    setCoach((c) => c ?? id);
  };

  /* Reaksi terhadap perubahan state: float IP, coach mark, toast fact-check. */
  useEffect(() => {
    const p = prev.current;
    prev.current = state;
    if (p === state) return;
    const diff = state.infectionPoints - p.infectionPoints;
    if (diff !== 0) {
      const id = floatId.current++;
      setFloats((f) => [...f.slice(-3), { id, text: diff > 0 ? `+${diff}` : `−${-diff}` }]);
      window.setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1100);
    }
    if (diff > 0 && state.infectionPoints === 1) showCoach('ip');
    if (state.activeShield && state.activeShield.startedAt !== p.activeShield?.startedAt) showCoach('shield');
    if (state.infectionPoints >= 20 && state.unlockedNodes.length === 0 && !treeOpen) showCoach('mut');
    if (p.factCheckDueAt !== null && state.factCheckDueAt === null && !isTerminal(state)) {
      toast(`Fact-Check: tenaga kesehatan meluruskan info keliru. Awareness +${CONFIG.misinformation.factCheckAwarenessIncrease}.`, 'good');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!coach) return;
    const id = window.setTimeout(() => setCoach(null), 9000);
    return () => window.clearTimeout(id);
  }, [coach]);

  const openTree = () => {
    setCoach(null);
    setSelNode(buyable[0]?.id ?? cheapest?.id ?? selNode);
    setTreeOpen(true);
  };

  const buy = (id: MutationId) => {
    const r = purchaseMutation(state, id);
    if (!r.ok) {
      toast(r.reason, 'warn');
      return;
    }
    const iB = currentInfectionGain(state);
    const iA = currentInfectionGain(r.state);
    const aB = currentAwarenessGain(state);
    const aA = currentAwarenessGain(r.state);
    onPurchase(id);
    setCoach(null);
    toast(`${id} dibeli · Infeksi ${fmtRate(iB)} → ${fmtRate(iA)}${aA > aB ? ` · Awareness ${fmtRate(aB)} → ${fmtRate(aA)}` : ''}`, 'good');
  };

  const useMis = () => {
    if (!misChk.ok) {
      toast(`Misinformation Surge tidak tersedia: ${misChk.reason}`, 'warn');
      return;
    }
    onMisinformation();
    toast(
      `Awareness −${CONFIG.misinformation.awarenessReduction}. Fact-check datang dalam ${CONFIG.misinformation.factCheckDelaySeconds} detik!`,
      'bad',
    );
  };

  const togglePause = () => {
    if (!ended) onPause(!paused);
  };
  const openExit = () => {
    setResumeAfterExit(state.gameStatus === 'running');
    if (state.gameStatus === 'running') onPause(true);
    setTreeOpen(false);
    setConfirmExit(true);
  };
  const cancelExit = () => {
    setConfirmExit(false);
    if (resumeAfterExit) onPause(false);
  };

  const counts = mapCounts(state.infectionRate, state.awarenessLevel);
  const ticker = state.newsTicker;
  const latest = ticker[0];
  const narrowTicker = !wide || compact;
  let shNote = '';
  if (shield && effRed > 0 && effRed !== shield.infectionReduction) shNote = ` · A2: −${Math.round(effRed * 100)}%`;
  if (shield && effAw > 0 && effAw !== shield.awarenessBonusPerSecond) shNote = ` · C2: +${effAw.toFixed(3).replace('.', ',')}/dtk`;

  const misLabel = misActive
    ? `Aktif · fact-check ${(state.factCheckDueAt ?? t) - t} dtk`
    : state.misinformationUsed
      ? 'Sudah dipakai'
      : misChk.ok
        ? `${CONFIG.misinformation.cost} IP · sekali pakai`
        : `IP kurang · ${state.infectionPoints}/${CONFIG.misinformation.cost}`;

  return (
    <div className={`hud${compact ? ' hud-compact' : ''}${wide ? ' hud-wide' : ''}`}>
      <div className="hud-top">
        <div className="hud-bar">
          <button type="button" className="btn btn-paper btn-icon btn-icon-hud" onClick={togglePause} aria-label={paused ? 'Lanjutkan' : 'Jeda'} aria-pressed={paused}>
            {paused ? (
              <PlayIcon size={22} />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                <path d="M8.5 5v14M15.5 5v14" />
              </svg>
            )}
          </button>
          <span className="timer" aria-label={`Waktu berjalan ${formatTime(t)}`}>
            <Ico name="clock" size={18} stroke={2.5} />
            <span>{formatTime(t)}</span>
          </span>
          <span className="sim-chip">SIMULASI</span>
          <span className="grow" />
          <span className="ip-badge" aria-label={`${state.infectionPoints} Infection Points, +1 dalam ${ipIn} detik`}>
            <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r="15" fill="#FFF3D6" stroke="#2A1E16" strokeWidth="2.5" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#2A1E16"
                strokeWidth="4"
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
                className="ring-arc"
                strokeDasharray={`${2 * Math.PI * 15 * (1 - (ipIn - 1) / CONFIG.ipIntervalSeconds)} ${2 * Math.PI * 15}`}
              />
              <text x="18" y="23" textAnchor="middle" fontFamily="Lilita One, sans-serif" fontSize="13" fill="#2A1E16">IP</text>
            </svg>
            <span className="ip-num">{state.infectionPoints}</span>
            {floats.map((f) => (
              <span key={f.id} className="ip-float" aria-hidden="true">{f.text}</span>
            ))}
          </span>
          <button type="button" className="btn btn-paper btn-icon btn-icon-hud" onClick={openExit} aria-label="Menu">
            <Ico name="home" size={22} />
          </button>
          {coach === 'ip' && (
            <CoachMark className="coach-ip" title="Ini Infection Points (IP)" onClose={() => setCoach(null)}>
              Kamu dapat +1 IP setiap {CONFIG.ipIntervalSeconds} detik. Kumpulkan untuk membeli mutasi.
            </CoachMark>
          )}
        </div>

        <div className="race" aria-label="Balapan Infection Progress dan Community Awareness">
          <Lane value={state.infectionRate} label="INFECTION PROGRESS · KAMU" color="var(--infect)" rate={fmtRate(infG)} icon={IC.virus} />
          <Lane value={state.awarenessLevel} label="COMMUNITY AWARENESS · WARGA" color="var(--aware)" rate={fmtRate(awG)} icon={IC.people} />
          <div className="race-foot">
            {(
              [
                ['Transmisi', state.stats.transmissionLevel],
                ['Gejala', state.stats.symptomVisibilityLevel],
                ['Persistensi', state.stats.environmentalPersistenceLevel],
              ] as const
            ).map(([name, lv]) => (
              <span key={name} className="level" aria-label={`${name} level ${lv} dari 3`}>
                {name}
                <span className="pips">
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={n <= lv ? 'on' : ''} />
                  ))}
                </span>
              </span>
            ))}
            <span className="grow" />
            <span className="finish">finis 100%</span>
          </div>
        </div>

        <div className="hud-status">
          {shield && state.activeShield && (
            <div className="shield-banner" role="status" aria-live="polite">
              <span className="shield-ico">
                <EvIcon id={shield.id} size="70%" />
              </span>
              <span className="shield-text">
                <span className="shield-eyebrow">BEHAVIOR SHIELD · {shield.id}{!compact && ' · WARGA BERTINDAK'}</span>
                <span className="shield-title">{shield.title}</span>
                <span className="shield-short">{SHIELD_SHORT[shield.id]}{shNote}</span>
              </span>
              <span className="shield-ring">
                <Ring r={21} size={52} width={5} fraction={(state.activeShield.expiresAt - t) / shield.durationSeconds} track="#2A1E16" fill="#FFF3D6" ink="#2A1E16" />
                <span>{state.activeShield.expiresAt - t}</span>
              </span>
            </div>
          )}
          {coach === 'shield' && shield && (
            <CoachMark className="coach-shield" title="Warga mulai melindungi diri" onClose={() => setCoach(null)}>
              {shield.infectionReduction
                ? `Selama ${shield.durationSeconds} detik, laju infeksimu turun ${Math.round(effRed * 100)}%. Event seperti ini datang setiap ${CONFIG.shield.intervalSeconds} detik.`
                : `Awareness warga naik ${shield.immediateAwareness} poin dan lebih cepat selama ${shield.durationSeconds} detik. Event datang setiap ${CONFIG.shield.intervalSeconds} detik.`}
            </CoachMark>
          )}
          {!shield && !ended && (
            <span className="shield-next">
              <Ring r={10} size={26} width={3} fraction={1 - nextShield / CONFIG.shield.intervalSeconds} track="#CDBB9C" fill="#FFF8EC" ink="#C68A1E" />
              <span>
                Behavior Shield berikutnya <span className="num">{nextShield}</span> dtk
              </span>
            </span>
          )}
          {misActive && state.factCheckDueAt !== null && (
            <div className="misinfo-panel" role="status">
              <Ico name="megaphone" size={30} stroke={2.2} style={{ color: 'var(--ip)' }} />
              <span className="misinfo-text">
                <span>
                  Kebingungan informasi menyebar (fiktif). Fact-Check datang dalam <span className="num accent">{state.factCheckDueAt - t}</span> dtk.
                </span>
                <span className="misinfo-track">
                  <span
                    style={{
                      width: `${((CONFIG.misinformation.factCheckDelaySeconds - (state.factCheckDueAt - t)) / CONFIG.misinformation.factCheckDelaySeconds) * 100}%`,
                    }}
                  />
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {!narrowTicker && (
        <section className="ticker-wide" aria-label="Kabar Dusun">
          <span className="display-18">Kabar Dusun</span>
          <TickerList items={ticker} />
        </section>
      )}

      <div className="hud-bottom">
        {tip && (
          <span className="tap-tip" role="status">
            {tip}
          </span>
        )}
        <div className="row hud-legend-row">
          <div
            className="legend"
            aria-label={`Peta ilustratif 48 bangunan: ${counts.infected + counts.both} terinfeksi simulasi, ${counts.protected + counts.both} terlindungi, ${counts.healthy} belum terdampak.`}
          >
            <LegendItem shape={PIN_ROUND} fill="#FFF8EC" count={counts.healthy} short="belum" label="Belum terdampak" />
            <LegendItem shape={PIN_ROUND} fill="#B83A2A" count={counts.infected} short="infeksi" label="Terinfeksi (simulasi)" />
            <LegendItem shape={PIN_SHIELD} fill="#2A5DA8" count={counts.protected} short="lindung" label="Terlindungi" />
            <LegendItem shape={PIN_ROUND} fill="#B83A2A" split count={counts.both} short="keduanya" label="Terinfeksi & mulai terlindungi" />
          </div>
          <span className="grow" />
          {compact && (
            <button type="button" className="pill-btn" onClick={() => setTickerOpen((o) => !o)} aria-expanded={tickerOpen} aria-label="Kabar Dusun">
              {latest && <Dot path={TONE_DOT[latest.tone][1]} color={TONE_DOT[latest.tone][0]} size={13} />}
              KABAR
            </button>
          )}
          <button type="button" className={`pill-btn lens-btn${lens ? ' is-on' : ''}`} onClick={onLens} aria-pressed={lens}>
            <Ico name="eye" size={18} />
            Lensa Data
          </button>
        </div>

        {narrowTicker && (
          <div className="ticker-narrow">
            {tickerOpen && (
              <ol className="ticker-pop" aria-label="Kabar Dusun">
                {ticker.map((m) => (
                  <TickerItem key={m.id} m={m} />
                ))}
              </ol>
            )}
            {!compact && (
              <button type="button" className="ticker-bar" onClick={() => setTickerOpen((o) => !o)} aria-expanded={tickerOpen}>
                <span className="ticker-k">KABAR</span>
                {latest && (
                  <>
                    <Dot path={TONE_DOT[latest.tone][1]} color={TONE_DOT[latest.tone][0]} size={14} />
                    <span className="ticker-at">{formatTime(latest.at)}</span>
                    <span className="ticker-latest">{latest.text}</span>
                  </>
                )}
                {!latest && <span className="grow" />}
                <Ico name="chevronUp" size={18} stroke={2.6} className={tickerOpen ? 'flip' : ''} />
              </button>
            )}
          </div>
        )}

        <nav className="controls" aria-label="Kontrol permainan">
          <button type="button" className="btn btn-red ctrl ctrl-tree" onClick={openTree}>
            <Ico name="dna" size={30} stroke={2.3} />
            <span className="ctrl-text">
              <span className="ctrl-title">MUTATION TREE</span>
              <span className="ctrl-sub">
                {buyable.length
                  ? `Siap dibeli: ${buyable.map((m) => m.id).join(', ')}`
                  : cheapest
                    ? `Berikutnya ${cheapest.id} · ${cheapest.cost} IP (kurang ${cheapest.cost - state.infectionPoints})`
                    : 'Semua mutasi dibeli'}
              </span>
            </span>
            {buyable.length > 0 && <span className="ctrl-badge">{buyable.length}</span>}
          </button>
          <button
            type="button"
            className={`btn ctrl ctrl-mis${misChk.ok ? ' mis-ready' : misActive ? ' mis-active' : ''}`}
            onClick={useMis}
            aria-disabled={!misChk.ok}
          >
            <Ico name="megaphone" size={24} stroke={2.3} />
            <span className="ctrl-text">
              <span className="ctrl-title ctrl-title-sm">MISINFORMATION SURGE</span>
              <span className="ctrl-sub">{misLabel}</span>
            </span>
          </button>
          {coach === 'mut' && !treeOpen && (
            <CoachMark className="coach-mut" title="IP cukup untuk mutasi pertama" onClose={() => setCoach(null)}>
              Buka Mutation Tree. Simulasi tetap berjalan saat tree terbuka.
            </CoachMark>
          )}
        </nav>
      </div>

      {paused && !confirmExit && !treeOpen && !settingsOpen && (
        <PauseCard state={state} onResume={togglePause} onSettings={onSettings} onExit={openExit} />
      )}

      {treeOpen && !ended && (
        <MutationTree state={state} wide={wide} selected={selNode} onSelect={setSelNode} onBuy={buy} onClose={() => setTreeOpen(false)} />
      )}

      {confirmExit && <ExitDialog onCancel={cancelExit} onExit={onQuit} />}
    </div>
  );
}

function Lane({ value, label, color, rate, icon }: { value: number; label: string; color: string; rate: string; icon: string }) {
  const near = value >= 80;
  return (
    <div className="lane">
      <span className={`lane-pct${near ? ' pulse' : ''}`} style={{ color }}>
        {Math.floor(value)}
        <small>%</small>
      </span>
      <div className="lane-main">
        <div className="lane-head">
          <span className="lane-label" style={{ color }}>{label}</span>
          {near && <span className="near">HAMPIR!</span>}
          <span className="grow" />
          <span className="lane-rate" style={{ color }}>{rate}</span>
        </div>
        <div className="lane-track-wrap">
          <div className="lane-track">
            <div className="lane-hatch" />
            <div className="lane-fill" style={{ width: `${value}%`, background: color }} />
          </div>
          <svg className="lane-flag" width="20" height="26" viewBox="0 0 20 26" aria-hidden="true">
            <path d="M3 25V2" stroke="#2A1E16" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M3.5 2.5h14v10h-14z" fill="#FFF8EC" stroke="#2A1E16" strokeWidth="2" />
            <path d="M3.5 2.5h3.5v3.3H3.5zM10.5 2.5H14v3.3h-3.5zM7 5.8h3.5v3.3H7zM14 5.8h3.5v3.3H14zM3.5 9.1H7v3.4H3.5zM10.5 9.1H14v3.4h-3.5z" fill="#2A1E16" />
          </svg>
          <div className="runner" style={{ left: `max(-4px, calc(${value}% - 30px))`, background: color }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF8EC" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={icon} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ shape, fill, count, short, label, split = false }: { shape: string; fill: string; count: number; short: string; label: string; split?: boolean }) {
  return (
    <span className="legend-item" title={label}>
      <svg width="18" height="20" viewBox="0 0 160 200" aria-hidden="true">
        <path d={shape} fill={fill} stroke="#2A1E16" strokeWidth="14" />
        {split && <path d="M160 0V200H0V150Z" fill="#2A5DA8" opacity=".95" />}
      </svg>
      {count}
      <span className="legend-short">{short}</span>
    </span>
  );
}

function TickerItem({ m }: { m: GameState['newsTicker'][number] }) {
  return (
    <li className="tick">
      <Dot path={TONE_DOT[m.tone][1]} color={TONE_DOT[m.tone][0]} />
      <span className="tick-at">{formatTime(m.at)}</span>
      <span className="tick-text">{m.text}</span>
    </li>
  );
}

function TickerList({ items }: { items: GameState['newsTicker'] }) {
  return (
    <ol aria-live="polite" className="ticker-list">
      {items.map((m) => (
        <TickerItem key={m.id} m={m} />
      ))}
    </ol>
  );
}

function CoachMark({ title, children, onClose, className }: { title: string; children: ReactNode; onClose: () => void; className: string }) {
  return (
    <div role="note" className={`coach ${className}`}>
      <span className="coach-arrow" />
      <span className="coach-title">{title}</span>
      <span className="coach-body">{children}</span>
      <button type="button" className="coach-ok" onClick={onClose}>
        Oke
      </button>
    </div>
  );
}

function PauseCard({ state, onResume, onSettings, onExit }: { state: GameState; onResume: () => void; onSettings: () => void; onExit: () => void }) {
  const panel = useDialog<HTMLDivElement>(onResume);
  return (
    <div className="overlay overlay-38" role="dialog" aria-modal="true" aria-label="Permainan dijeda">
      <div className="card-modal pause-card" ref={panel} tabIndex={-1}>
        <span className="outline-word">DIJEDA</span>
        <span className="pause-info">
          Waktu berhenti di {formatTime(state.elapsedSeconds)}. Infeksi {Math.floor(state.infectionRate)}% · Awareness {Math.floor(state.awarenessLevel)}%
        </span>
        <button type="button" className="btn btn-red btn-lg" onClick={onResume}>
          <PlayIcon size={22} />
          LANJUTKAN
        </button>
        <button type="button" className="btn btn-hi btn-md" onClick={onSettings}>
          Pengaturan
        </button>
        <button type="button" className="btn btn-outline-red btn-md" onClick={onExit}>
          Keluar ke menu
        </button>
      </div>
    </div>
  );
}

function ExitDialog({ onCancel, onExit }: { onCancel: () => void; onExit: () => void }) {
  const panel = useDialog<HTMLDivElement>(onCancel);
  return (
    <div className="overlay overlay-50" role="alertdialog" aria-modal="true" aria-label="Kembali ke menu?">
      <div className="card-modal exit-card" ref={panel} tabIndex={-1}>
        <span className="display-28">Kembali ke menu?</span>
        <span className="exit-text">Sesi ini akan dihentikan dan progresnya tidak disimpan.</span>
        <div className="grid-2">
          <button type="button" className="btn btn-hi btn-md" onClick={onCancel}>
            Lanjut bermain
          </button>
          <button type="button" className="btn btn-red btn-md" onClick={onExit}>
            Keluar ke menu
          </button>
        </div>
      </div>
    </div>
  );
}
