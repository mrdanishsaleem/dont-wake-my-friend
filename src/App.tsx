import { useState, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ObjectivePanel } from './components/ObjectivePanel';
import { WakeMeter } from './components/WakeMeter';
import type { GameControls } from './hooks/useGame';
import { useGameStore } from './store/gameStore';

export default function App() {
  const [gameControls, setGameControls] = useState<GameControls | null>(null);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);

  const handleGameReady = useCallback((controls: GameControls) => {
    setGameControls(controls);
  }, []);

  return (
    <div className="app-wrapper">

      <header className="game-header">
        <h1 className="game-title">Don't Wake My Friend</h1>
        <div className="game-toolbar">
          <div className="difficulty-control" role="group" aria-label="Difficulty">
            <span className="difficulty-label">Difficulty</span>
            {(['EASY', 'NORMAL', 'HARD'] as const).map((level) => (
              <button key={level} type="button" aria-pressed={difficulty === level} onClick={() => setDifficulty(level)}>
                {level.toLowerCase()}
              </button>
            ))}
          </div>
          {gameStatus === 'PLAYING' && (
            <button type="button" className="pause-button" onClick={() => gameControls?.pause()}>
              Pause <kbd className="key-badge">Esc</kbd>
            </button>
          )}
        </div>
      </header>

      {/* ── Canvas area ──────────────────────────────────── */}
      <main className="game-main">
        <GameCanvas onGameReady={handleGameReady} />

        <aside className="info-row" aria-label="Mission and controls">
          <ObjectivePanel onRestart={gameControls?.restart} />
          <WakeMeter />
          <section className="panel controls-panel" aria-label="Keyboard controls">
            <h2 className="panel-label">Controls</h2>
            <dl className="controls-list">
              {[
                ['W A S D', 'Move'],
                ['Shift', 'Sneak'],
                ['E', 'Interact'],
                ['F', 'Toss coin'],
                ['Esc', 'Pause'],
              ].map(([keys, action]) => (
                <div key={action}><dt>{action}</dt><dd><kbd className="key-badge">{keys}</kbd></dd></div>
              ))}
            </dl>
          </section>
        </aside>
      </main>

    </div>
  );
}
