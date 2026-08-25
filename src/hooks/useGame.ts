import { useEffect, useRef } from 'react';
import { Game } from '../game/Game';
import { useGameStore } from '../store/gameStore';
import { useKeyboard } from './useKeyboard';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';

/**
 * useGame — mounts and owns the Game instance for the lifetime of GameCanvas.
 *
 * Wires:
 *  - A canvas ref → 2D context → Game constructor
 *  - The keyboard InputState ref → Game constructor (read each frame)
 *  - Zustand isRunning flag
 *
 * Returns a ref to attach to the <canvas> element.
 */
export function useGame() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gameRef    = useRef<Game | null>(null);
  const setRunning = useGameStore((s) => s.setRunning);

  // Keyboard state — a ref, not React state, so no re-renders
  const inputRef = useKeyboard();

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

    const game = new Game(ctx, inputRef);
    gameRef.current = game;
    game.start();
    setRunning(true);

    return () => {
      game.stop();
      gameRef.current = null;
      setRunning(false);
    };
  // inputRef is stable (useRef), so this effect only runs once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setRunning]);

  return canvasRef;
}
