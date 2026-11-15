import { sound } from '../game/AudioSystem';
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
 *   F              → throw a distraction
 *   Shift          → slow, quiet movement
 *   Escape         → pause
 */
export function useKeyboard(): React.RefObject<InputState> {
  const inputRef = useRef<InputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    interact: false,
    distract: false,
    pause: false,
    sneak: false,
  });

  useEffect(() => {
    const heldKeys = new Map<string, keyof InputState>();

    function toAction(code: string): keyof InputState | null {
      switch (code) {
        case 'KeyW':      case 'ArrowUp':    return 'up';
        case 'KeyS':      case 'ArrowDown':  return 'down';
        case 'KeyA':      case 'ArrowLeft':  return 'left';
        case 'KeyD':      case 'ArrowRight': return 'right';
        case 'KeyE':                         return 'interact';
        case 'KeyF':                         return 'distract';
        case 'ShiftLeft': case 'ShiftRight': return 'sneak';
        case 'Escape':                       return 'pause';
        default: return null;
      }
    }

    function onKeyDown(e: KeyboardEvent): void {
      const action = toAction(e.code);
      if (action) {
        if (action !== 'interact' && action !== 'distract' && action !== 'pause' && action !== 'sneak') {
          e.preventDefault();
          if (!e.repeat) sound.unlock();
        }
        heldKeys.set(e.code, action);
        inputRef.current[action] = true;
      }
    }

    function onKeyUp(e: KeyboardEvent): void {
      const action = toAction(e.code);
      if (action) {
        heldKeys.delete(e.code);
        inputRef.current[action] = Array.from(heldKeys.values()).includes(action);
      }
    }

    // Reset all keys on blur
    function onBlur(): void {
      heldKeys.clear();
      inputRef.current.up       = false;
      inputRef.current.down     = false;
      inputRef.current.left     = false;
      inputRef.current.right    = false;
      inputRef.current.interact = false;
      inputRef.current.distract = false;
      inputRef.current.pause    = false;
      inputRef.current.sneak    = false;
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
