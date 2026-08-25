import { useEffect, useRef } from 'react';
import type { InputState } from '../types';

/**
 * useKeyboard — tracks which movement keys are currently held.
 *
 * Returns a ref to an InputState object that is mutated in-place on every
 * keydown / keyup event. Because it is a ref (not state), it does NOT trigger
 * React re-renders — the game loop reads it directly each frame via
 * `inputRef.current`.
 *
 * Supported bindings:
 *   W / ArrowUp    → up
 *   S / ArrowDown  → down
 *   A / ArrowLeft  → left
 *   D / ArrowRight → right
 */
export function useKeyboard(): React.RefObject<InputState> {
  const inputRef = useRef<InputState>({
    up: false, down: false, left: false, right: false,
  });

  useEffect(() => {
    function toAction(code: string): keyof InputState | null {
      switch (code) {
        case 'KeyW':      case 'ArrowUp':    return 'up';
        case 'KeyS':      case 'ArrowDown':  return 'down';
        case 'KeyA':      case 'ArrowLeft':  return 'left';
        case 'KeyD':      case 'ArrowRight': return 'right';
        default: return null;
      }
    }

    function onKeyDown(e: KeyboardEvent): void {
      const action = toAction(e.code);
      if (action) {
        // Prevent arrow keys from scrolling the page
        e.preventDefault();
        inputRef.current[action] = true;
      }
    }

    function onKeyUp(e: KeyboardEvent): void {
      const action = toAction(e.code);
      if (action) {
        inputRef.current[action] = false;
      }
    }

    // Reset all keys when the window loses focus so we don't get stuck keys
    function onBlur(): void {
      inputRef.current.up    = false;
      inputRef.current.down  = false;
      inputRef.current.left  = false;
      inputRef.current.right = false;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    window.addEventListener('blur',    onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      window.removeEventListener('blur',    onBlur);
    };
  }, []);

  return inputRef;
}
