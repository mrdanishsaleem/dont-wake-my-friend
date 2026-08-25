import { useGame } from '../hooks/useGame';

/**
 * GameCanvas — the single canvas element that hosts the game.
 *
 * CSS sizes it to fill its container while preserving 16:9 via the
 * parent's `aspect-ratio` rule. The logical resolution (960×540) is
 * set by useGame.
 */
export function GameCanvas() {
  const canvasRef = useGame();

  return (
    <canvas
      ref={canvasRef}
      id="game-canvas"
      aria-label="Don't Wake My Friend — game canvas"
    />
  );
}
