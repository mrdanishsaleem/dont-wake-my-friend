import { useGame, type GameControls } from '../hooks/useGame';
import { useEffect } from 'react';

interface GameCanvasProps {
  onGameReady?: (controls: GameControls) => void;
}

/**
 * GameCanvas — hosts the HTML5 canvas element and lifecycle connection.
 */
export function GameCanvas({ onGameReady }: GameCanvasProps) {
  const { canvasRef, restart, pause, resume, togglePause } = useGame();

  useEffect(() => {
    if (onGameReady) {
      onGameReady({ restart, pause, resume, togglePause });
    }
  }, [onGameReady, restart, pause, resume, togglePause]);

  return (
    <canvas
      ref={canvasRef}
      id="game-canvas"
      aria-label="Don't Wake My Friend — game canvas"
    />
  );
}
