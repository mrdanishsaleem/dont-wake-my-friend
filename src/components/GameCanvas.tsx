import { useGame, type GameControls } from '../hooks/useGame';
import { TouchControls } from './TouchControls';
import { GameOverlay } from './GameOverlay';
import { useGameStore } from '../store/gameStore';
import { useEffect } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';

interface GameCanvasProps {
  onGameReady?: (controls: GameControls) => void;
}

/**
 * GameCanvas — hosts the HTML5 canvas element and lifecycle connection.
 */
export function GameCanvas({ onGameReady }: GameCanvasProps) {
  const { canvasRef, updateTouch, restart, pause, resume, togglePause } = useGame();

  const playing = useGameStore((state) => state.gameStatus === 'PLAYING');

  useEffect(() => {
    if (onGameReady) {
      onGameReady({ restart, pause, resume, togglePause });
    }
  }, [onGameReady, restart, pause, resume, togglePause]);

  return (
    <div className="game-stage">
      <div className="canvas-wrapper" role="region" aria-label="Game area">
        <canvas
          ref={canvasRef}
          id="game-canvas"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          aria-label="Don't Wake My Friend — game canvas"
        />
        <GameOverlay controls={{ restart, pause, resume, togglePause }} />
      </div>
      <TouchControls updateInput={updateTouch} enabled={playing} />
    </div>
  );
}
