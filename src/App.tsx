import { GameCanvas } from './components/GameCanvas';

export default function App() {
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
          <GameCanvas />
        </div>

        {/* ── Info row ─────────────────────────────────────── */}
        <div className="info-row">

          <div className="panel objective-panel">
            <p className="panel-label">Objective</p>
            <p className="panel-value">Get a glass of water.</p>
          </div>

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
              {'  Move'}
            </p>
          </div>

        </div>
      </main>

    </div>
  );
}
