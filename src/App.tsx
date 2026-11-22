import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from './audio/audio';
import { useGameAudio } from './audio/useGameAudio';
import { ToastProvider, useToast } from './components/Toast';
import { World3D } from './components/World3D';
import { isTerminal, shieldDef } from './game/engine';
import { ACHIEVEMENT_BY_ID, EMPTY_PROGRESS, LEVELS, applySession, levelOf, withAchievements, type Progress, type SessionSummary } from './game/progress';
import {
  DEFAULT_RECORDS,
  clearRecords,
  loadPrefs,
  loadProgress,
  loadRecords,
  savePrefs,
  saveProgress,
  saveRecords,
  type LocalRecords,
  type Preferences,
} from './game/storage';
import type { PathogenId, PlayMode, RegionId, ScenarioId } from './game/types';
import { newSeed, useGameEngine } from './game/useGameEngine';
import { GameScreen } from './screens/GameScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { MainMenu } from './screens/MainMenu';
import { PathoDex } from './screens/PathoDex';
import { ProgressScreen } from './screens/ProgressScreen';
import { ResultScreen } from './screens/ResultScreen';
import { SelectScreen } from './screens/SelectScreen';
import { SettingsModal } from './screens/SettingsModal';
import { TutorialModal } from './screens/TutorialModal';
import type { BuildingTapDetail, Kuannoah3DProps } from './three/kuannoah3d';
import { useReducedMotion, useViewport } from './ui/hooks';
import type { Board } from './ui/leaderboardApi';
import { CELL_LABEL, FACILITIES } from './ui/map';
import { GUIDE } from './ui/meta';

type Screen = 'menu' | 'select' | 'game' | 'result' | 'dex' | 'leaderboard' | 'progress';
type Origin = 'menu' | 'result';

/** Jeda sebelum layar hasil, agar dunia 3D sempat menampilkan akhir sesi. */
const RESULT_DELAY_MS = 900;

export default function App() {
  const [toastBottom, setToastBottom] = useState('24px');
  return (
    <ToastProvider bottom={toastBottom}>
      <AppInner onToastBottom={setToastBottom} />
    </ToastProvider>
  );
}

function AppInner({ onToastBottom }: { onToastBottom: (bottom: string) => void }) {
  const toast = useToast();
  const [screen, setScreen] = useState<Screen>('menu');
  const [dexReturn, setDexReturn] = useState<Origin>('menu');
  const [dexEntry, setDexEntry] = useState<PathogenId | null>(null);
  const [lbReturn, setLbReturn] = useState<Origin>('menu');
  const [lbBoard, setLbBoard] = useState<Board>('victory');
  const [guideStep, setGuideStep] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(loadPrefs);
  const [records, setRecords] = useState<LocalRecords>(loadRecords);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [choice, setChoice] = useState<{ scenario: ScenarioId; region: RegionId }>({ scenario: 'ispa', region: 'sekolah' });
  const [coaching, setCoaching] = useState(false);
  const [lens, setLens] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const game = useGameEngine(prefs.speed);
  const { state } = game;
  const { vw, wide, compact } = useViewport();
  const reduced = useReducedMotion(prefs.motion);
  useGameAudio(screen, state, prefs);

  const updateRecords = useCallback((fn: (r: LocalRecords) => LocalRecords) => {
    setRecords((r) => {
      const next = fn(r);
      saveRecords(next);
      return next;
    });
  }, []);

  const announceAchievements = useCallback(
    (ids: string[]) => {
      ids.forEach((id, i) =>
        window.setTimeout(() => {
          audio.play('achievement');
          toast(`Pencapaian terbuka: ${ACHIEVEMENT_BY_ID[id].title}!`, 'good');
        }, 400 + i * 1600),
      );
    },
    [toast],
  );

  // Progres dibaca lewat ref agar efek samping (simpan, toast) tidak berada di dalam updater state.
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  const updateProgress = useCallback(
    (fn: (p: Progress) => Progress) => {
      const { progress: next, added } = withAchievements(fn(progressRef.current));
      progressRef.current = next;
      setProgress(next);
      saveProgress(next);
      if (added.length) announceAchievements(added);
    },
    [announceAchievements],
  );

  useEffect(() => {
    document.documentElement.dataset.motion = prefs.motion;
  }, [prefs.motion]);

  // Catat statistik dan progres sekali saat outcome ditentukan, lalu pindah ke layar hasil.
  const recordedOutcome = useRef(false);
  const resultTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!isTerminal(state) || recordedOutcome.current) return;
    recordedOutcome.current = true;
    const win = state.outcome === 'victory';
    const shields = state.eventHistory.filter((e) => e.kind === 'shield').length;
    updateRecords((r) => ({
      ...r,
      sessionsCompleted: r.sessionsCompleted + 1,
      victories: r.victories + (win ? 1 : 0),
      defeats: r.defeats + (win ? 0 : 1),
      totalDurationSeconds: r.totalDurationSeconds + state.elapsedSeconds,
      fastestVictorySeconds: win ? Math.min(r.fastestVictorySeconds ?? Infinity, state.elapsedSeconds) : r.fastestVictorySeconds,
      longestDefenseSeconds: !win ? Math.max(r.longestDefenseSeconds ?? 0, state.elapsedSeconds) : r.longestDefenseSeconds,
      mutationsPurchased: r.mutationsPurchased + state.unlockedNodes.length,
      shieldEventsSeen: r.shieldEventsSeen + shields,
    }));
    const sum = applySession(progress, state, prefs.unlockAll);
    setSummary(sum);
    setProgress(sum.progress);
    saveProgress(sum.progress);
    resultTimer.current = window.setTimeout(() => {
      setScreen('result');
      if (sum.levelAfter > sum.levelBefore) {
        audio.play('levelup');
        toast(`Naik ke Level ${sum.levelAfter}: ${LEVELS[sum.levelAfter - 1].title}!`, 'good');
      }
      announceAchievements(sum.newAchievements);
    }, RESULT_DELAY_MS);
  }, [state, updateRecords, progress, prefs.unlockAll, toast, announceAchievements]);
  useEffect(() => () => window.clearTimeout(resultTimer.current), []);

  const deploy = (scenario: ScenarioId = choice.scenario, region: RegionId = choice.region) => {
    window.clearTimeout(resultTimer.current);
    recordedOutcome.current = false;
    setChoice({ scenario, region });
    setSummary(null);
    setCoaching(records.sessionsStarted === 0);
    setLens(false);
    setTip(null);
    game.start(scenario, region, prefs.mode, newSeed());
    updateRecords((r) => ({ ...r, sessionsStarted: r.sessionsStarted + 1 }));
    setGuideStep(null);
    setScreen('game');
  };

  const toMenu = () => {
    window.clearTimeout(resultTimer.current);
    game.reset(); // menghentikan timer karena status kembali 'idle'
    setScreen('menu');
  };

  const openDex = (from: Origin, entry: PathogenId | null = null) => {
    setDexReturn(from);
    setDexEntry(entry);
    setScreen('dex');
  };

  const openLeaderboard = (from: Origin, board: Board = 'victory') => {
    setLbReturn(from);
    setLbBoard(board);
    setScreen('leaderboard');
  };

  const tipTimer = useRef<number | undefined>(undefined);
  const onBuildingTap = useCallback(
    (d: BuildingTapDetail) => {
      if (screen !== 'game') return;
      const name = d.name ? FACILITIES[d.index] : `Rumah ${d.index + 1}`;
      setTip(`${name}: ${CELL_LABEL[d.state]}`);
      window.clearTimeout(tipTimer.current);
      tipTimer.current = window.setTimeout(() => setTip(null), 2600);
    },
    [screen],
  );
  useEffect(() => () => window.clearTimeout(tipTimer.current), []);

  /* Properti dunia 3D per layar. Dunia hanya membaca state, tidak mengubahnya. */
  const inGame = screen === 'game' || screen === 'result';
  const world: Kuannoah3DProps = {
    mode: 'title',
    infection: 30,
    awareness: 34,
    focus: '',
    shield: screen === 'game' && state.activeShield ? `${shieldDef(state, state.activeShield.id).source}@${state.activeShield.startedAt}` : '',
    misinfo: inGame && state.factCheckDueAt !== null,
    paused: screen === 'game' && (state.gameStatus === 'paused' || state.pendingDecision !== null),
    lens: screen === 'game' && lens,
    reduced,
    quality: prefs.quality === 'auto' ? (vw < 500 ? 'hemat' : 'tinggi') : prefs.quality,
    outcome: state.outcome ?? '',
  };
  if (guideStep !== null) Object.assign(world, { mode: 'guide', focus: GUIDE[guideStep].focus, infection: GUIDE[guideStep].inf, awareness: GUIDE[guideStep].aw });
  else if (screen === 'select') Object.assign(world, { mode: 'select', infection: 0, awareness: 0 });
  else if (screen === 'dex' || screen === 'leaderboard' || screen === 'progress') Object.assign(world, { mode: 'dex', infection: 20, awareness: 30 });
  else if (inGame) Object.assign(world, { mode: screen === 'game' ? 'game' : 'result', infection: state.infectionRate, awareness: state.awarenessLevel });

  const toastBottom = screen === 'game' ? (wide ? '190px' : '210px') : screen === 'select' || screen === 'result' ? '110px' : '24px';
  useEffect(() => onToastBottom(toastBottom), [toastBottom, onToastBottom]);

  const lv = levelOf(progress.xp);

  return (
    <>
      <World3D {...world} onBuildingTap={onBuildingTap} />
      <div className="stage">
        {screen === 'menu' && guideStep === null && (
          <MainMenu
            level={lv}
            stars={Object.values(progress.stars).reduce<number>((a, b) => a + (b ?? 0), 0)}
            achievements={progress.achievements.length}
            muted={prefs.muteMusic && prefs.muteSfx}
            onToggleMute={() => {
              const mute = !(prefs.muteMusic && prefs.muteSfx);
              const p = { ...prefs, muteMusic: mute, muteSfx: mute };
              setPrefs(p);
              savePrefs(p);
            }}
            onStart={() => setScreen('select')}
            onTutorial={() => setGuideStep(0)}
            onDex={() => openDex('menu')}
            onLeaderboard={() => openLeaderboard('menu')}
            onProgress={() => setScreen('progress')}
            onSettings={() => setSettingsOpen(true)}
          />
        )}
        {screen === 'select' && (
          <SelectScreen
            progress={progress}
            unlockAll={prefs.unlockAll}
            initial={choice}
            mode={prefs.mode}
            onMode={(m: PlayMode) => {
              const p = { ...prefs, mode: m };
              setPrefs(p);
              savePrefs(p);
            }}
            onBack={() => setScreen('menu')}
            onDeploy={(s, r) => deploy(s, r)}
          />
        )}
        {screen === 'game' && (
          <GameScreen
            state={state}
            wide={wide}
            compact={compact}
            coaching={coaching}
            lens={lens}
            onLens={() => setLens((l) => !l)}
            tip={tip}
            settingsOpen={settingsOpen}
            onPurchase={game.purchase}
            onMisinformation={game.misinformation}
            onDecide={game.decide}
            onRegion={game.switchRegion}
            onBubble={game.collectBubble}
            onFlash={game.answerFlash}
            onAbility={game.ability}
            advisor={prefs.advisor}
            onAdvisorOff={() => {
              const p = { ...prefs, advisor: false };
              setPrefs(p);
              savePrefs(p);
            }}
            onPause={game.pause}
            onQuit={toMenu}
            onSettings={() => setSettingsOpen(true)}
          />
        )}
        {screen === 'result' && isTerminal(state) && (
          <ResultScreen
            state={state}
            summary={summary}
            replay={game.replay}
            onPlayAgain={() => deploy()}
            onMenu={toMenu}
            onDex={(entry) => openDex('result', entry)}
            onLeaderboard={(board) => openLeaderboard('result', board)}
          />
        )}
        {screen === 'dex' && (
          <PathoDex
            onBack={() => setScreen(dexReturn)}
            backLabel={dexReturn === 'result' ? 'Hasil' : 'Menu'}
            wide={wide}
            initialEntry={dexEntry}
            onOpenEntry={() => {
              updateRecords((r) => ({ ...r, dexEntriesOpened: r.dexEntriesOpened + 1 }));
              updateProgress((p) => ({ ...p, dexOpened: p.dexOpened + 1 }));
            }}
          />
        )}
        {screen === 'leaderboard' && (
          <LeaderboardScreen
            initialBoard={lbBoard}
            initialScenario={lbReturn === 'result' ? state.scenario : choice.scenario}
            initialMode={lbReturn === 'result' ? state.mode : prefs.mode}
            backLabel={lbReturn === 'result' ? 'Hasil' : 'Menu'}
            wide={wide}
            onBack={() => setScreen(lbReturn)}
          />
        )}
        {screen === 'progress' && <ProgressScreen progress={progress} wide={wide} onBack={() => setScreen('menu')} />}

        {guideStep !== null && (
          <TutorialModal
            step={guideStep}
            onStep={setGuideStep}
            onClose={() => setGuideStep(null)}
            onFinish={() => {
              setGuideStep(null);
              updateRecords((r) => ({ ...r, tutorialCompleted: true }));
              updateProgress((p) => ({ ...p, tutorialDone: true }));
              setScreen('select');
            }}
          />
        )}
        {settingsOpen && (
          <SettingsModal
            prefs={prefs}
            records={records}
            onChange={(p) => {
              setPrefs(p);
              savePrefs(p);
            }}
            onResetRecords={() => {
              clearRecords();
              setRecords({ ...DEFAULT_RECORDS });
              setProgress({ ...EMPTY_PROGRESS });
            }}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </div>
    </>
  );
}

