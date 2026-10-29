import { useCallback, useEffect, useRef, useState } from 'react';
import { ToastProvider } from './components/Toast';
import { World3D } from './components/World3D';
import { isTerminal } from './game/engine';
import {
  DEFAULT_RECORDS,
  clearRecords,
  loadPrefs,
  loadRecords,
  savePrefs,
  saveRecords,
  type LocalRecords,
  type Preferences,
} from './game/storage';
import { newSeed, useGameEngine } from './game/useGameEngine';
import { GameScreen } from './screens/GameScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { MainMenu } from './screens/MainMenu';
import { PathoDex } from './screens/PathoDex';
import { ResultScreen } from './screens/ResultScreen';
import { SelectScreen } from './screens/SelectScreen';
import { SettingsModal } from './screens/SettingsModal';
import { TutorialModal } from './screens/TutorialModal';
import type { BuildingTapDetail, Kuannoah3DProps } from './three/kuannoah3d';
import { useReducedMotion, useViewport } from './ui/hooks';
import type { Board } from './ui/leaderboardApi';
import { CELL_LABEL, FACILITIES } from './ui/map';
import { GUIDE } from './ui/meta';

type Screen = 'menu' | 'select' | 'game' | 'result' | 'dex' | 'leaderboard';
type Origin = 'menu' | 'result';

/** Jeda sebelum layar hasil, agar dunia 3D sempat menampilkan akhir sesi. */
const RESULT_DELAY_MS = 900;

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [dexReturn, setDexReturn] = useState<Origin>('menu');
  const [lbReturn, setLbReturn] = useState<Origin>('menu');
  const [lbBoard, setLbBoard] = useState<Board>('victory');
  const [guideStep, setGuideStep] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(loadPrefs);
  const [records, setRecords] = useState<LocalRecords>(loadRecords);
  const [coaching, setCoaching] = useState(false);
  const [lens, setLens] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const game = useGameEngine(prefs.speed);
  const { state } = game;
  const { vw, wide, compact } = useViewport();
  const reduced = useReducedMotion(prefs.motion);

  const updateRecords = useCallback((fn: (r: LocalRecords) => LocalRecords) => {
    setRecords((r) => {
      const next = fn(r);
      saveRecords(next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = prefs.motion;
  }, [prefs.motion]);

  // Catat statistik sekali saat outcome ditentukan, lalu pindah ke layar hasil.
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
    resultTimer.current = window.setTimeout(() => setScreen('result'), RESULT_DELAY_MS);
  }, [state, updateRecords]);
  useEffect(() => () => window.clearTimeout(resultTimer.current), []);

  const deploy = () => {
    window.clearTimeout(resultTimer.current);
    recordedOutcome.current = false;
    setCoaching(records.sessionsStarted === 0);
    setLens(false);
    setTip(null);
    game.start(newSeed());
    updateRecords((r) => ({ ...r, sessionsStarted: r.sessionsStarted + 1 }));
    setGuideStep(null);
    setScreen('game');
  };

  const toMenu = () => {
    window.clearTimeout(resultTimer.current);
    game.reset(); // menghentikan timer karena status kembali 'idle'
    setScreen('menu');
  };

  const openDex = (from: Origin) => {
    setDexReturn(from);
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
    shield: screen === 'game' && state.activeShield ? `${state.activeShield.id}@${state.activeShield.startedAt}` : '',
    misinfo: inGame && state.factCheckDueAt !== null,
    paused: screen === 'game' && state.gameStatus === 'paused',
    lens: screen === 'game' && lens,
    reduced,
    quality: prefs.quality === 'auto' ? (vw < 500 ? 'hemat' : 'tinggi') : prefs.quality,
    outcome: state.outcome ?? '',
  };
  if (guideStep !== null) Object.assign(world, { mode: 'guide', focus: GUIDE[guideStep].focus, infection: GUIDE[guideStep].inf, awareness: GUIDE[guideStep].aw });
  else if (screen === 'select') Object.assign(world, { mode: 'select', infection: 0, awareness: 0 });
  else if (screen === 'dex' || screen === 'leaderboard') Object.assign(world, { mode: 'dex', infection: 20, awareness: 30 });
  else if (inGame) Object.assign(world, { mode: screen === 'game' ? 'game' : 'result', infection: state.infectionRate, awareness: state.awarenessLevel });

  const toastBottom = screen === 'game' ? (wide ? '190px' : '210px') : screen === 'select' || screen === 'result' ? '110px' : '24px';

  return (
    <ToastProvider bottom={toastBottom}>
      <World3D {...world} onBuildingTap={onBuildingTap} />
      <div className="stage">
        {screen === 'menu' && guideStep === null && (
          <MainMenu
            onStart={() => setScreen('select')}
            onTutorial={() => setGuideStep(0)}
            onDex={() => openDex('menu')}
            onLeaderboard={() => openLeaderboard('menu')}
            onSettings={() => setSettingsOpen(true)}
          />
        )}
        {screen === 'select' && <SelectScreen onBack={() => setScreen('menu')} onDeploy={deploy} />}
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
            onPause={game.pause}
            onQuit={toMenu}
            onSettings={() => setSettingsOpen(true)}
          />
        )}
        {screen === 'result' && isTerminal(state) && (
          <ResultScreen
            state={state}
            replay={game.replay}
            onPlayAgain={deploy}
            onMenu={toMenu}
            onDex={() => openDex('result')}
            onLeaderboard={(board) => openLeaderboard('result', board)}
          />
        )}
        {screen === 'dex' && (
          <PathoDex
            onBack={() => setScreen(dexReturn)}
            backLabel={dexReturn === 'result' ? 'Hasil' : 'Menu'}
            wide={wide}
            onOpenEntry={() => updateRecords((r) => ({ ...r, dexEntriesOpened: r.dexEntriesOpened + 1 }))}
          />
        )}
        {screen === 'leaderboard' && (
          <LeaderboardScreen
            initialBoard={lbBoard}
            backLabel={lbReturn === 'result' ? 'Hasil' : 'Menu'}
            wide={wide}
            onBack={() => setScreen(lbReturn)}
          />
        )}

        {guideStep !== null && (
          <TutorialModal
            step={guideStep}
            onStep={setGuideStep}
            onClose={() => setGuideStep(null)}
            onFinish={() => {
              setGuideStep(null);
              updateRecords((r) => ({ ...r, tutorialCompleted: true }));
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
            }}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </div>
    </ToastProvider>
  );
}
