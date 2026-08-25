import { useState, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ObjectivePanel } from './components/ObjectivePanel';
import { WakeMeter } from './components/WakeMeter';
import { GameOverlay } from './components/GameOverlay';
import type { GameControls } from './hooks/useGame';
import { useGameStore } from './store/gameStore';

export default function App() {
  const [gameControls, setGameControls] = useState<GameControls | null>(null);
  const gameStatus = useGameStore((s) => s.gameStatus);

  const handleGameReady = useCallback((controls: GameControls) => {
    setGameControls(controls);
  }, []);

  return (
    <div className="app-wrapper">

      {/* ── Header ───────────────────────────────────────── */}
      <header className="flex flex-col items-center relative w-full max-w-[960px]">
        <h1 className="game-title">Don't Wake My Friend</h1>
        <p className="game-subtitle">stealth · night · bedroom</p>

        {/* Top-right Pause button */}
        {gameStatus === 'PLAYING' && (
          <button
            onClick={() => gameControls?.pause()}
            className="absolute right-0 top-1 px-2.5 py-1 text-xs font-mono rounded border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1.5"
            title="Pause Game (ESC)"
          >
            <span className="key-badge !py-0 !px-1">ESC</span>
            <span>PAUSE</span>
          </button>
        )}
      </header>

      {/* ── Canvas area ──────────────────────────────────── */}
      <main>
        <div className="canvas-wrapper relative" role="region" aria-label="Game area">
          <GameCanvas onGameReady={handleGameReady} />
          {/* Game States & End Screens Overlay */}
          <GameOverlay controls={gameControls} />
        </div>

        {/* ── Info row ─────────────────────────────────────── */}
        <div className="info-row">

          {/* 1. Objective & Mission */}
          <ObjectivePanel onRestart={gameControls?.restart} />

          {/* 2. Wake Meter */}
          <WakeMeter onRestart={gameControls?.restart} />

          {/* 3. Controls */}
          <div className="panel controls-panel">
            <p className="panel-label">Controls</p>
            <p className="panel-value">
              <span className="key-badge">W</span>
              <span className="key-badge">A</span>
              <span className="key-badge">S</span>
              <span className="key-badge">D</span>
              <span className="text-[0.65rem] text-slate-400 ml-1">Move</span>
              <br />
              <span className="key-badge">E</span>
              <span className="text-[0.65rem] text-sky-300 ml-1 mr-2">Interact</span>
              <span className="key-badge">ESC</span>
              <span className="text-[0.65rem] text-slate-400 ml-1">Pause</span>
            </p>
          </div>

        </div>
      </main>

    </div>
  );
}
