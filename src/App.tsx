import { useState, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ObjectivePanel } from './components/ObjectivePanel';
import { WakeMeter } from './components/WakeMeter';

export default function App() {
  const [gameControls, setGameControls] = useState<{ restart: () => void } | null>(null);

  const handleGameReady = useCallback((controls: { restart: () => void }) => {
    setGameControls(controls);
  }, []);

  return (
    <div className="app-wrapper">

      {/* ── Header ───────────────────────────────────────── */}
      <header>
        <h1 className="game-title">Don't Wake My Friend</h1>
        <p className="game-subtitle">stealth · night · bedroom</p>
      </header>

      {/* ── Canvas area ──────────────────────────────────── */}
      <main>
        <div className="canvas-wrapper" role="region" aria-label="Game area">
          <GameCanvas onGameReady={handleGameReady} />
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
              {' / '}
              <span className="key-badge">↑</span>
              <span className="key-badge">←</span>
              <span className="key-badge">↓</span>
              <span className="key-badge">→</span>
              <span className="text-[0.65rem] text-slate-400 ml-1">Move</span>
              <br />
              <span className="key-badge">E</span>
              <span className="text-[0.65rem] text-sky-300 ml-1">Interact</span>
            </p>
          </div>

        </div>
      </main>

    </div>
  );
}
