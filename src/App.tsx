import { useCallback, useEffect, useRef, useState } from 'react';
import { Background } from './components/Background';
import { ToastProvider } from './components/Toast';
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
import { useGameEngine } from './game/useGameEngine';
import { GameScreen } from './screens/GameScreen';
import { MainMenu } from './screens/MainMenu';
import { PathoDex } from './screens/PathoDex';
import { ResultScreen } from './screens/ResultScreen';
import { SelectScreen } from './screens/SelectScreen';
import { SettingsModal } from './screens/SettingsModal';
import { TutorialModal } from './screens/TutorialModal';

type Screen = 'menu' | 'select' | 'game' | 'result' | 'dex';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [dexReturn, setDexReturn] = useState<'menu' | 'result'>('menu');
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(loadPrefs);
  const [records, setRecords] = useState<LocalRecords>(loadRecords);
  const game = useGameEngine(prefs.speed);
  const { state } = game;

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

  // Pindah ke layar hasil tepat saat outcome ditentukan dan catat statistik sekali.
  const recordedOutcome = useRef(false);
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
      fastestVictorySeconds: win
        ? Math.min(r.fastestVictorySeconds ?? Infinity, state.elapsedSeconds)
        : r.fastestVictorySeconds,
      longestDefenseSeconds: !win
        ? Math.max(r.longestDefenseSeconds ?? 0, state.elapsedSeconds)
        : r.longestDefenseSeconds,
      mutationsPurchased: r.mutationsPurchased + state.unlockedNodes.length,
      shieldEventsSeen: r.shieldEventsSeen + shields,
    }));
    setScreen('result');
  }, [state, updateRecords]);

  const deploy = () => {
    recordedOutcome.current = false;
    game.start();
    updateRecords((r) => ({ ...r, sessionsStarted: r.sessionsStarted + 1 }));
    setScreen('game');
  };

  const toMenu = () => {
    game.reset(); // menghentikan timer karena status kembali 'idle'
    setScreen('menu');
  };

  const openDex = (from: 'menu' | 'result') => {
    setDexReturn(from);
    setScreen('dex');
  };

  return (
    <ToastProvider>
      <Background />
      <div className="app">
        {screen === 'menu' && (
          <MainMenu
            onStart={() => setScreen('select')}
            onTutorial={() => setTutorialOpen(true)}
            onDex={() => openDex('menu')}
            onSettings={() => setSettingsOpen(true)}
          />
        )}
        {screen === 'select' && <SelectScreen onBack={() => setScreen('menu')} onDeploy={deploy} />}
        {screen === 'game' && (
          <GameScreen
            state={state}
            onPurchase={game.purchase}
            onMisinformation={game.misinformation}
            onPause={game.pause}
            onQuit={toMenu}
          />
        )}
        {screen === 'result' && isTerminal(state) && (
          <ResultScreen state={state} onPlayAgain={deploy} onMenu={toMenu} onDex={() => openDex('result')} />
        )}
        {screen === 'dex' && (
          <PathoDex
            onBack={() => setScreen(dexReturn)}
            backLabel={dexReturn === 'result' ? 'Hasil' : 'Menu'}
            onOpenEntry={() => updateRecords((r) => ({ ...r, dexEntriesOpened: r.dexEntriesOpened + 1 }))}
          />
        )}
      </div>

      {tutorialOpen && (
        <TutorialModal
          onClose={() => setTutorialOpen(false)}
          onFinish={() => {
            setTutorialOpen(false);
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
    </ToastProvider>
  );
}
