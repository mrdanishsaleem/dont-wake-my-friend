import { useEffect, useRef, useCallback } from 'react';
import { Game } from '../game/Game';
import { useGameStore } from '../store/gameStore';
import { useKeyboard } from './useKeyboard';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';

export interface GameControls {
  restart: () => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
}

/**
 * useGame — mounts and owns the Game instance for the lifetime of GameCanvas.
 */
export function useGame() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gameRef    = useRef<Game | null>(null);
  const setRunning = useGameStore((s) => s.setRunning);

  // Keyboard state — a ref, not React state, so no re-renders
  const inputRef = useKeyboard();

  const restart = useCallback(() => {
    gameRef.current?.restart();
  }, []);

  const pause = useCallback(() => {
    gameRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    gameRef.current?.resume();
  }, []);

  const togglePause = useCallback(() => {
    gameRef.current?.togglePause();
  }, []);

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

  return { canvasRef, restart, pause, resume, togglePause };
}
