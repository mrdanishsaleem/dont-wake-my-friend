import { useGame } from '../hooks/useGame';
import { useEffect } from 'react';

interface GameCanvasProps {
  onGameReady?: (controls: { restart: () => void }) => void;
}

/**
 * GameCanvas — the single canvas element that hosts the game.
 */
export function GameCanvas({ onGameReady }: GameCanvasProps) {
  const { canvasRef, restart } = useGame();

  useEffect(() => {
    if (onGameReady) {
      onGameReady({ restart });
    }
  }, [onGameReady, restart]);

  return (
    <canvas
      ref={canvasRef}
      id="game-canvas"
      aria-label="Don't Wake My Friend — game canvas"
    />
  );
}
