import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { sound } from '../game/AudioSystem';

export function WakeMeter() {
  const wakeLevel = useGameStore((s) => s.wakeLevel);
  const friendState = useGameStore((s) => s.friendState);
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const percent = Math.round(wakeLevel);

  return (
    <section className="panel wake-panel" data-state={friendState}>
      <div className="wake-heading">
        <h2 className="panel-label">Wake level</h2>
        <strong>{percent}%</strong>
      </div>
      <div className="wake-track" role="meter" aria-label="Wake level"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div style={{ width: `${wakeLevel}%` }} />
      </div>
      <div className="wake-heading wake-footer">
        <span>{friendState.toLowerCase().replaceAll('_', ' ')}</span>
        <button type="button" onClick={() => setIsMuted(sound.toggleMute())}>
          Sound {isMuted ? 'off' : 'on'}
        </button>
      </div>
    </section>
  );
}
