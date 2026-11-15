import { useEffect, useRef, type PointerEvent } from 'react';
import { sound } from '../game/AudioSystem';
import type { Direction, TouchInput } from '../types';

const directions = [
  ['up', '↑'], ['left', '←'], ['down', '↓'], ['right', '→'],
] as const;

export function TouchControls({ updateInput, enabled }: { updateInput: (update: (input: TouchInput) => void) => void; enabled: boolean }) {
  const pointers = useRef(new Map<number, Direction | 'sneak'>());

  useEffect(() => {
    function reset() {
      pointers.current.clear();
      updateInput((input) => {
        input.directions.clear();
        input.sneak = input.interact = input.distract = false;
      });
    }
    if (!enabled) reset();
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('blur', reset);
      reset();
    };
  }, [enabled, updateInput]);

  function updateHeld() {
    updateInput((input) => {
      input.directions.clear();
      input.sneak = false;
      for (const action of pointers.current.values()) {
        if (action === 'sneak') input.sneak = true;
        else input.directions.add(action);
      }
    });
  }

  function hold(action: Direction | 'sneak', event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    sound.unlock();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, action);
    updateHeld();
  }

  function release(event: PointerEvent<HTMLButtonElement>) {
    pointers.current.delete(event.pointerId);
    updateHeld();
  }

  function heldButton(action: Direction | 'sneak') {
    return {
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => hold(action, event),
      onPointerUp: release,
      onPointerCancel: release,
      onLostPointerCapture: release,
    };
  }

  return (
    <fieldset className="touch-controls" aria-label="Touch controls" disabled={!enabled}>
      <div className="touch-directions">
        {directions.map(([direction, glyph]) => (
          <button key={direction} type="button" data-direction={direction}
            aria-label={`Move ${direction}`} {...heldButton(direction)}>{glyph}</button>
        ))}
      </div>
      <div className="touch-actions">
        <button type="button" {...heldButton('sneak')}>Hold to sneak</button>
        <button type="button" onClick={() => { sound.unlock(); updateInput((input) => { input.distract = true; }); }}>Toss coin</button>
        <button type="button" className="touch-interact"
          onClick={() => { sound.unlock(); updateInput((input) => { input.interact = true; }); }}>Interact</button>
      </div>
    </fieldset>
  );
}
