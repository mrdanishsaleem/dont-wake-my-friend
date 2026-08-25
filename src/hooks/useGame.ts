import { useEffect, useRef } from 'react';
import { Game } from '../game/Game';
import { useGameStore } from '../store/gameStore';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';

/**
 * useGame — mounts and owns the Game instance for the lifetime of GameCanvas.
 *
 * Returns a ref to attach to the <canvas> element.
 */
export function useGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef   = useRef<Game | null>(null);
  const setRunning = useGameStore((s) => s.setRunning);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set the logical (internal) resolution
    canvas.width  = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[useGame] Could not obtain 2D context.');
      return;
    }

    const game = new Game(ctx);
    gameRef.current = game;
    game.start();
    setRunning(true);

    return () => {
      game.stop();
      gameRef.current = null;
      setRunning(false);
    };
  }, [setRunning]);

  return canvasRef;
}
