import { useEffect, useRef } from 'react';
import type { InputState } from '../types';

/**
 * useKeyboard — tracks which movement and action keys are currently active.
 *
 * Supported bindings:
 *   W / ArrowUp    → up
 *   S / ArrowDown  → down
 *   A / ArrowLeft  → left
 *   D / ArrowRight → right
 *   E              → interact
 *   Escape         → pause
 */
export function useKeyboard(): React.RefObject<InputState> {
  const inputRef = useRef<InputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    interact: false,
    pause: false,
  });

  useEffect(() => {
    function toAction(code: string): keyof InputState | null {
      switch (code) {
        case 'KeyW':      case 'ArrowUp':    return 'up';
        case 'KeyS':      case 'ArrowDown':  return 'down';
        case 'KeyA':      case 'ArrowLeft':  return 'left';
        case 'KeyD':      case 'ArrowRight': return 'right';
        case 'KeyE':                         return 'interact';
        case 'Escape':                       return 'pause';
        default: return null;
      }
    }

    function onKeyDown(e: KeyboardEvent): void {
      const action = toAction(e.code);
      if (action) {
        if (action !== 'interact' && action !== 'pause') {
          e.preventDefault();
        }
        inputRef.current[action] = true;
      }
    }

    function onKeyUp(e: KeyboardEvent): void {
      const action = toAction(e.code);
      if (action) {
        inputRef.current[action] = false;
      }
    }

    // Reset all keys on blur
    function onBlur(): void {
      inputRef.current.up       = false;
      inputRef.current.down     = false;
      inputRef.current.left     = false;
      inputRef.current.right    = false;
      inputRef.current.interact = false;
      inputRef.current.pause    = false;
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
