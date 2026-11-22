import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { CRISIS_AT } from '../audio/useGameAudio';
import { DecisionCard } from '../components/DecisionCard';
import { MutationTree } from '../components/MutationTree';
import { ActionRow, AdvisorTip, BubbleField, FlashCard } from '../components/PlayExtras';
import { PathogenArt } from '../components/PathogenArt';
import { RegionPanel } from '../components/RegionPanel';
import { useToast } from '../components/Toast';
import { Dot, EvIcon, Ico, PlayIcon, Ring } from '../components/ui';
import { advise } from '../game/advisor';
import { CONFIG } from '../game/config';
import {
  canSwitchRegion,
  canUseMisinformation,
  currentAwarenessGain,
  currentInfectionGain,
  decide,
  decisionDef,
  effectiveAwarenessBonus,
  effectiveInfectionReduction,
  isTerminal,
  purchaseMutation,
  scenarioOf,
  shieldDef,
} from '../game/engine';
import { missionLabel, missionProgress } from '../game/missions';
import { MUTATIONS } from '../game/mutations';
import { REGION_BY_ID } from '../game/regions';
import { MODE_BY_ID } from '../game/modes';
import type { AbilityId, GameState, MutationId, RegionId } from '../game/types';
import { useDialog } from '../ui/hooks';
import { mapCounts } from '../ui/map';
import { IC, PIN_ROUND, PIN_SHIELD, TONE_DOT, shieldShort } from '../ui/meta';
import { fmtRate, formatTime } from './format';

type Coach = 'ip' | 'shield' | 'mut' | 'region';

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
  onDecide: (choice: number) => void;
  onRegion: (id: RegionId) => void;
  onBubble: (id: number) => void;
  onFlash: (choice: number) => void;
  onAbility: (id: AbilityId) => void;
  advisor: boolean;
  onAdvisorOff: () => void;
  /** Posisi atas area peta (px), agar toast muncul di sana dan tidak menimpa kartu di bawah. */
  onToastTop: (top: number | null) => void;
  onPause: (paused: boolean) => void;
  onQuit: () => void;
  onSettings: () => void;
}

interface Float {
  id: number;
  text: string;
}

export function GameScreen(props: Props) {
  const { state, wide, compact, coaching, lens, onLens, tip, settingsOpen, onPurchase, onMisinformation, onDecide, onRegion, onPause, onQuit, onSettings } = props;
  const { onBubble, onFlash, onAbility, advisor, onAdvisorOff, onToastTop } = props;
  const toast = useToast();
  const [treeOpen, setTreeOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [selNode, setSelNode] = useState<MutationId>('A1');
  const [confirmExit, setConfirmExit] = useState(false);
  const [resumeAfterExit, setResumeAfterExit] = useState(false);
  const [floats, setFloats] = useState<Float[]>([]);
  const [coach, setCoach] = useState<Coach | null>(null);
  /** Momen Penentu yang sudah dijawab dan sedang menampilkan fakta (simulasi dijeda). */
  const [reveal, setReveal] = useState<{ id: string; choice: number; correct?: boolean } | null>(null);
  const coachDone = useRef(new Set<Coach>());
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  /** Area peta yang terlihat di antara HUD atas dan bawah (px dari tepi layar). */
  const [band, setBand] = useState({ top: 0, bottom: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const top = topRef.current?.getBoundingClientRect().bottom ?? 0;
      const b = bottomRef.current?.getBoundingClientRect().top ?? window.innerHeight;
      setBand((prev) => {
        const next = { top: Math.round(top), bottom: Math.round(window.innerHeight - b) };
        return prev.top === next.top && prev.bottom === next.bottom ? prev : next;
      });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    if (topRef.current) ro.observe(topRef.current);
    if (bottomRef.current) ro.observe(bottomRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  const floatId = useRef(1);
  const prev = useRef(state);

  const sc = scenarioOf(state);
  const t = state.elapsedSeconds;
  const paused = state.gameStatus === 'paused';
  const ended = isTerminal(state);
  const infG = currentInfectionGain(state);
  const awG = currentAwarenessGain(state);
  const ipIn = CONFIG.ipIntervalSeconds - (t % CONFIG.ipIntervalSeconds);
  const shield = state.activeShield ? shieldDef(state, state.activeShield.id) : null;
  const nextShield = CONFIG.shield.intervalSeconds - (t % CONFIG.shield.intervalSeconds);
  const owned = new Set(state.unlockedNodes);
  const avail = MUTATIONS.filter((m) => !owned.has(m.id) && (!m.prerequisite || owned.has(m.prerequisite)));
  const buyable = avail.filter((m) => state.infectionPoints >= m.cost);
  const cheapest = [...avail].sort((a, b) => a.cost - b.cost)[0];
  const misChk = canUseMisinformation(state);
  const misActive = state.factCheckDueAt !== null;
  const effRed = effectiveInfectionReduction(state);
  const effAw = effectiveAwarenessBonus(state);
  const crisis = !ended && state.awarenessLevel >= CRISIS_AT;
  const pendingDef = state.pendingDecision ? decisionDef(state, state.pendingDecision.id) : undefined;
  const revealDef = reveal ? decisionDef(state, reveal.id) : undefined;
  const regionWait = Math.max(0, state.regionReadyAt - t);
  const doneCount = sc.missions.filter((m) => state.missionsDone.includes(m.id)).length;
  const advice = advisor && !ended ? advise(state) : null;

  useEffect(() => () => onToastTop(null), [onToastTop]);
  /** Bagian bawah area peta disisihkan untuk kartu Fakta Cepat agar gelembung tidak tertutup. */
  const bandH = (typeof window === 'undefined' ? 800 : window.innerHeight) - band.top - band.bottom;
  const flashReserve = Math.round(Math.max(0, Math.min(wide ? 170 : 150, bandH * (wide ? 0.55 : 0.6))));
  const flashShown = state.flash !== null || (state.lastFlash !== null && t - state.lastFlash.at <= 4);

  const showCoach = (id: Coach) => {
    if (!coaching || coachDone.current.has(id)) return;
    coachDone.current.add(id);
    setCoach((c) => c ?? id);
  };

  /* Reaksi terhadap perubahan state: float PI, coach mark, toast cek fakta dan misi. */
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
    if (state.elapsedSeconds >= 60 && state.regionsVisited.length === 1) showCoach('region');
    if (p.factCheckDueAt !== null && state.factCheckDueAt === null && !isTerminal(state)) {
      toast(`${sc.hoax.factCheck} Kesadaran +${CONFIG.misinformation.factCheckAwarenessIncrease}.`, 'good');
    }
    if (state.lastFlash && state.lastFlash !== p.lastFlash && state.lastFlash.correct && state.quizStreak >= 3) {
      toast(`Beruntun ${state.quizStreak}! Hadiah kuis berikutnya makin besar.`, 'good');
    }
    for (const id of state.missionsDone.filter((m) => !p.missionsDone.includes(m))) {
      const m = sc.missions.find((x) => x.id === id);
      if (m && !isTerminal(state)) toast(`Misi selesai: ${missionLabel(m)} (+${CONFIG.mission.reward} PI)`, 'good');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Panel lain ditutup saat Momen Penentu muncul.
  useEffect(() => {
    if (!state.pendingDecision) return;
    setTreeOpen(false);
    setRegionOpen(false);
    setCoach(null);
  }, [state.pendingDecision]);

  useEffect(() => {
    if (!coach) return;
    const id = window.setTimeout(() => setCoach(null), 9000);
    return () => window.clearTimeout(id);
  }, [coach]);

  const openTree = () => {
    setCoach(null);
    setRegionOpen(false);
    setSelNode(buyable[0]?.id ?? cheapest?.id ?? selNode);
    setTreeOpen(true);
  };

  const openRegions = () => {
    setCoach(null);
    setTreeOpen(false);
    setRegionOpen(true);
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
    toast(`${sc.mutations[id].name} dibeli · Infeksi ${fmtRate(iB)} → ${fmtRate(iA)}${aA > aB ? ` · Kesadaran ${fmtRate(aB)} → ${fmtRate(aA)}` : ''}`, 'good');
  };

  const move = (id: RegionId) => {
    const c = canSwitchRegion(state, id);
    if (!c.ok) {
      toast(c.reason, 'warn');
      return;
    }
    onRegion(id);
    setRegionOpen(false);
    toast(`Fokus pindah ke ${REGION_BY_ID[id].name}. ${sc.regions[id].note}`, 'info');
  };

  const useMis = () => {
    if (!misChk.ok) {
      toast(`Sebar Hoaks belum bisa: ${misChk.reason}`, 'warn');
      return;
    }
    onMisinformation();
    toast(`Hoaks ${sc.hoax.claim} menyebar. Kesadaran −${CONFIG.misinformation.awarenessReduction}, Cek Fakta datang ${CONFIG.misinformation.factCheckDelaySeconds} dtk lagi!`, 'bad');
  };

  const choose = (choice: number) => {
    if (!state.pendingDecision) return;
    const r = decide(state, choice);
    if (!r.ok) {
      toast(r.reason, 'warn');
      return;
    }
    setReveal({ id: state.pendingDecision.id, choice, correct: r.state.lastDecision?.correct });
    onDecide(choice);
    // Tetap berhenti selama fakta dibaca.
    if (!isTerminal(r.state)) onPause(true);
  };

  const closeReveal = () => {
    setReveal(null);
    if (!isTerminal(state)) onPause(false);
  };

  const ability = (id: AbilityId) => {
    onAbility(id);
    const a = sc.abilities[id];
    toast(`${a.name} aktif ${CONFIG.ability[id].seconds} detik. Di dunia nyata: ${a.lesson}`, id === 'surge' ? 'bad' : 'warn');
  };

  const togglePause = () => {
    if (!ended && !state.pendingDecision && !reveal) onPause(!paused);
  };
  const openExit = () => {
    setResumeAfterExit(state.gameStatus === 'running' && !reveal);
    if (state.gameStatus === 'running') onPause(true);
    setTreeOpen(false);
    setRegionOpen(false);
    setConfirmExit(true);
  };
  const cancelExit = () => {
    setConfirmExit(false);
    if (resumeAfterExit) onPause(false);
  };

  const counts = mapCounts(state.infectionRate, state.awarenessLevel);
  const ticker = state.newsTicker;
  /** Satu fokus dalam satu waktu: gelembung, Fakta Cepat, dan penasihat disembunyikan saat panel atau kartu terbuka. */
  const focusOpen = treeOpen || regionOpen || !!pendingDef || !!reveal || paused || confirmExit || settingsOpen;
  // Toast di atas area peta; saat panel terbuka, di tepi atas layar (tidak menghalangi ketukan).
  useEffect(() => {
    onToastTop(focusOpen ? 8 : band.top ? band.top + 8 : null);
  }, [focusOpen, band.top, onToastTop]);
  let shNote = '';
  if (shield && effRed > 0 && effRed !== shield.infectionReduction) shNote = ` · efektif −${Math.round(effRed * 100)}%`;
  if (shield && effAw > 0 && effAw !== shield.awarenessBonusPerSecond) shNote = ` · efektif +${effAw.toFixed(3).replace('.', ',')}/dtk`;

  return (
    <div className={`hud${compact ? ' hud-compact' : ''}${wide ? ' hud-wide' : ''}${crisis ? ' hud-crisis' : ''}`}>
      {!ended && !focusOpen && (
        <div className="play-band" style={{ top: band.top, bottom: band.bottom }}>
          <BubbleField state={state} onCollect={onBubble} bottomInset={flashReserve} />
          <div className="flash-slot">
            <FlashCard state={state} onAnswer={onFlash} />
            {advice && !flashShown && (
              <AdvisorTip
                key={advice.key}
                advice={advice}
                onHide={() => {
                  onAdvisorOff();
                  toast('Penasihat disembunyikan. Nyalakan lagi di Pengaturan.', 'info');
                }}
              />
            )}
          </div>
        </div>
      )}
      <div className="hud-top" ref={topRef}>
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
          <span className="sim-chip sc-chip">
            <PathogenArt id={sc.pathogen} size={20} />
            {sc.name}
            <span className={`mode-tag mode-tag-${state.mode}`}>{MODE_BY_ID[state.mode].label}</span>
          </span>
          <span className="grow" />
          <span className="ip-badge" aria-label={`${state.infectionPoints} Poin Infeksi, +1 dalam ${ipIn} detik`}>
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
              <text x="18" y="23" textAnchor="middle" fontFamily="Lilita One, sans-serif" fontSize="13" fill="#2A1E16">PI</text>
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
            <CoachMark className="coach-ip" title="Ini Poin Infeksi (PI)" onClose={() => setCoach(null)}>
              Kamu dapat +1 PI setiap {CONFIG.ipIntervalSeconds} detik. Dapatkan lebih banyak dengan mengeklik gelembung di peta dan menjawab kuis.
            </CoachMark>
          )}
        </div>

        <div className="race" aria-label="Balapan Sebaran Infeksi dan Kesadaran Warga">
          <Lane value={state.infectionRate} label="SEBARAN INFEKSI · KAMU" color="var(--infect)" rate={fmtRate(infG)} icon={IC.virus} />
          <Lane value={state.awarenessLevel} label="KESADARAN WARGA" color="var(--aware)" rate={fmtRate(awG)} icon={IC.people} />
          <div className="race-foot">
            {(
              [
                [sc.branchLabels.transmission, state.stats.transmissionLevel],
                [sc.branchLabels.symptom, state.stats.symptomVisibilityLevel],
                [sc.branchLabels.persistence, state.stats.environmentalPersistenceLevel],
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
          <div className="status-row">
            <button type="button" className={`pill-btn region-pill${regionOpen ? ' is-on' : ''}`} onClick={openRegions} aria-expanded={regionOpen}>
              <Ico name="pin" size={17} stroke={2.4} />
              {REGION_BY_ID[state.region].name}
              {regionWait > 0 && <span className="pill-sub">{regionWait} dtk</span>}
            </button>
            <button type="button" className={`pill-btn${missionsOpen ? ' is-on' : ''}`} onClick={() => setMissionsOpen((o) => !o)} aria-expanded={missionsOpen}>
              <Ico name="target" size={17} stroke={2.4} />
              Misi {doneCount}/{sc.missions.length}
            </button>
            {state.boosts.map((b) => (
              <span key={`${b.label}-${b.until}`} className={`boost-chip${b.inf > 0 || b.aw < 0 ? ' up' : ' down'}`}>
                {b.label} · {b.until - t} dtk
              </span>
            ))}
            {coach === 'region' && (
              <CoachMark className="coach-region" title="Coba wilayah lain" onClose={() => setCoach(null)}>
                Tiap wilayah punya kelebihan dan tantangan berbeda untuk {sc.name}. Pindah wilayah memerlukan {CONFIG.region.switchCost} PI.
              </CoachMark>
            )}
          </div>
          {missionsOpen && (
            <ul className="mission-pop" aria-label="Misi sesi ini">
              {sc.missions.map((m) => {
                const done = state.missionsDone.includes(m.id);
                const prog = missionProgress(state, m);
                return (
                  <li key={m.id} className={done ? 'done' : ''}>
                    <Ico name={done ? 'check' : 'target'} size={16} stroke={2.8} />
                    <span className="grow">{missionLabel(m)}</span>
                    {prog && !done && <span className="num">{m.kind === 'survive' ? formatTime(prog[0]) : `${prog[0]}/${prog[1]}`}</span>}
                  </li>
                );
              })}
            </ul>
          )}
          {crisis && (
            <div className="crisis-banner" role="alert">
              <Ico name="warn" size={22} stroke={2.6} />
              <span>
                <strong>KRISIS!</strong> Kesadaran warga {Math.floor(state.awarenessLevel)}%. Komunitas hampir terlindungi penuh.
              </span>
            </div>
          )}
          {shield && state.activeShield && (
            <div className="shield-banner" role="status" aria-live="polite">
              <span className="shield-ico">
                <EvIcon icon={shield.icon} size="70%" />
              </span>
              <span className="shield-text">
                <span className="shield-eyebrow">AKSI WARGA{!compact && ' · PENCEGAHAN NYATA'}</span>
                <span className="shield-title">{shield.title}</span>
                <span className="shield-short">{shieldShort(shield)}{shNote}</span>
              </span>
              <span className="shield-ring">
                <Ring r={21} size={52} width={5} fraction={(state.activeShield.expiresAt - t) / shield.durationSeconds} track="#2A1E16" fill="#FFF3D6" ink="#2A1E16" />
                <span>{state.activeShield.expiresAt - t}</span>
              </span>
            </div>
          )}
          {coach === 'shield' && shield && (
            <CoachMark className="coach-shield" title="Warga mulai melindungi diri" onClose={() => setCoach(null)}>
              {shield.description}{' '}
              {shield.infectionReduction
                ? `Selama ${shield.durationSeconds} detik, infeksimu melambat ${Math.round(effRed * 100)}%.`
                : `Kesadaran warga naik lebih cepat selama ${shield.durationSeconds} detik.`}
            </CoachMark>
          )}
          {!shield && !ended && (
            <span className="shield-next">
              <Ring r={10} size={26} width={3} fraction={1 - nextShield / CONFIG.shield.intervalSeconds} track="#CDBB9C" fill="#FFF8EC" ink="#C68A1E" />
              <span>
                Aksi warga berikutnya <span className="num">{nextShield}</span> dtk
              </span>
            </span>
          )}
          {misActive && state.factCheckDueAt !== null && (
            <div className="misinfo-panel" role="status">
              <Ico name="megaphone" size={30} stroke={2.2} style={{ color: 'var(--ip)' }} />
              <span className="misinfo-text">
                <span>
                  Hoaks {sc.hoax.claim} beredar (fiktif). Cek Fakta datang dalam <span className="num accent">{state.factCheckDueAt - t}</span> dtk.
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

      {wide && (
        <section className="ticker-wide" aria-label="Kabar Dusun">
          <span className="display-18">Kabar Dusun</span>
          <TickerList items={ticker.slice(0, 4)} />
        </section>
      )}

      <div className="hud-bottom" ref={bottomRef}>
        {tip && (
          <span className="tap-tip" role="status">
            {tip}
          </span>
        )}
        {wide && (
          <div className="row hud-legend-row">
            <div
              className="legend"
              aria-label={`Peta ilustratif 48 bangunan: ${counts.infected + counts.both} terinfeksi simulasi, ${counts.protected + counts.both} terlindungi, ${counts.healthy} belum terdampak.`}
            >
              <LegendItem shape={PIN_ROUND} fill="#FFF8EC" count={counts.healthy} short="aman" label="Belum terdampak" />
              <LegendItem shape={PIN_ROUND} fill="#B83A2A" count={counts.infected} short="infeksi" label="Terinfeksi (simulasi)" />
              <LegendItem shape={PIN_SHIELD} fill="#2A5DA8" count={counts.protected} short="lindung" label="Terlindungi" />
              <LegendItem shape={PIN_ROUND} fill="#B83A2A" split count={counts.both} short="keduanya" label="Terinfeksi & mulai terlindungi" />
            </div>
            <span className="grow" />
            <button type="button" className={`pill-btn lens-btn${lens ? ' is-on' : ''}`} onClick={onLens} aria-pressed={lens}>
              <Ico name="eye" size={18} />
              Lensa Data
            </button>
          </div>
        )}

        <ActionRow state={state} onAbility={ability} onHoax={useMis} onBlocked={(r) => toast(r, 'warn')} />

        <nav className="controls" aria-label="Kontrol permainan">
          <button type="button" className="btn btn-red ctrl ctrl-tree" onClick={openTree}>
            <Ico name="dna" size={30} stroke={2.3} />
            <span className="ctrl-text">
              <span className="ctrl-title">POHON MUTASI</span>
              <span className="ctrl-sub">
                {buyable.length
                  ? `Siap dibeli: ${buyable.map((m) => m.id).join(', ')}`
                  : cheapest
                    ? `Berikutnya ${cheapest.id} · ${cheapest.cost} PI (kurang ${cheapest.cost - state.infectionPoints})`
                    : 'Semua mutasi dibeli'}
              </span>
            </span>
            {buyable.length > 0 && <span className="ctrl-badge">{buyable.length}</span>}
          </button>
          {coach === 'mut' && !treeOpen && (
            <CoachMark className="coach-mut" title="PI cukup untuk mutasi pertama" onClose={() => setCoach(null)}>
              Buka Pohon Mutasi. Simulasi tetap berjalan saat pohon terbuka.
            </CoachMark>
          )}
        </nav>
      </div>

      {paused && !confirmExit && !treeOpen && !settingsOpen && !reveal && (
        <PauseCard state={state} lens={lens} onLens={onLens} onResume={togglePause} onSettings={onSettings} onExit={openExit} />
      )}

      {treeOpen && !ended && !pendingDef && (
        <MutationTree state={state} wide={wide} selected={selNode} onSelect={setSelNode} onBuy={buy} onClose={() => setTreeOpen(false)} />
      )}

      {regionOpen && !ended && !pendingDef && <RegionPanel state={state} onSwitch={move} onClose={() => setRegionOpen(false)} />}

      {pendingDef && !confirmExit && <DecisionCard state={state} def={pendingDef} answered={null} onChoose={choose} onContinue={closeReveal} />}
      {!pendingDef && revealDef && reveal && !confirmExit && !ended && (
        <DecisionCard state={state} def={revealDef} answered={reveal} onChoose={() => undefined} onContinue={closeReveal} />
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

function PauseCard({
  state,
  lens,
  onLens,
  onResume,
  onSettings,
  onExit,
}: {
  state: GameState;
  lens: boolean;
  onLens: () => void;
  onResume: () => void;
  onSettings: () => void;
  onExit: () => void;
}) {
  const panel = useDialog<HTMLDivElement>(onResume);
  return (
    <div className="overlay overlay-38" role="dialog" aria-modal="true" aria-label="Permainan dijeda">
      <div className="card-modal pause-card" ref={panel} tabIndex={-1}>
        <span className="outline-word">DIJEDA</span>
        <span className="pause-info">
          Waktu berhenti di {formatTime(state.elapsedSeconds)}. Infeksi {Math.floor(state.infectionRate)}% · Kesadaran {Math.floor(state.awarenessLevel)}%
        </span>
        <button type="button" className="btn btn-red btn-lg" onClick={onResume}>
          <PlayIcon size={22} />
          LANJUTKAN
        </button>
        {state.newsTicker.length > 0 && (
          <section className="pause-news" aria-label="Kabar Dusun">
            <span className="label-13">KABAR DUSUN</span>
            <ol className="ticker-list">
              {state.newsTicker.slice(0, 4).map((m) => (
                <TickerItem key={m.id} m={m} />
              ))}
            </ol>
          </section>
        )}
        <button type="button" className={`btn btn-hi btn-md${lens ? ' is-on' : ''}`} onClick={onLens} aria-pressed={lens}>
          <Ico name="eye" size={18} />
          Lensa Data: {lens ? 'Nyala' : 'Mati'}
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
