import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { sound } from '../game/AudioSystem';

export function WakeMeter({ onRestart }: { onRestart?: () => void }) {
  const wakeLevel = useGameStore((s) => s.wakeLevel);
  const friendState = useGameStore((s) => s.friendState);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());

  const roundedLevel = Math.round(wakeLevel);

  const toggleAudio = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Generate ASCII / block bar
  const totalBlocks = 16;
  const filledBlocks = Math.min(
    totalBlocks,
    Math.round((wakeLevel / 100) * totalBlocks),
  );
  const emptyBlocks = totalBlocks - filledBlocks;
  const barString = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

  // Status badge styling
  let badgeColor = 'text-sky-400 border-sky-500/40 bg-sky-950/30';
  let badgeText = 'DEEP SLEEP';
  let barColorClass = 'text-sky-400';

  if (friendState === 'AWAKE') {
    badgeColor = 'text-red-400 border-red-500/60 bg-red-950/50 animate-pulse';
    badgeText = 'AWAKE!';
    barColorClass = 'text-red-500';
  } else if (friendState === 'ALMOST_AWAKE') {
    badgeColor = 'text-orange-400 border-orange-500/60 bg-orange-950/40 animate-pulse';
    badgeText = 'ALMOST AWAKE';
    barColorClass = 'text-orange-400';
  } else if (friendState === 'RESTLESS') {
    badgeColor = 'text-amber-400 border-amber-500/50 bg-amber-950/30';
    badgeText = 'RESTLESS';
    barColorClass = 'text-amber-400';
  }

  return (
    <div
      className={`panel wake-panel ${
        wakeLevel >= 95
          ? 'wake-panel-critical'
          : wakeLevel >= 85
            ? 'wake-panel-danger'
            : wakeLevel >= 70
              ? 'wake-panel-warning'
              : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="panel-label !mb-0">WAKE LEVEL</span>
          <button
            onClick={toggleAudio}
            className="text-[0.65rem] text-slate-400 hover:text-slate-200 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
        <span
          className={`text-[0.65rem] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}
        >
          {badgeText}
        </span>
      </div>

      {/* Block Progress Bar + Percentage */}
      <div className="flex items-center justify-between gap-3 font-mono text-sm">
        <span className={`tracking-widest ${barColorClass} select-none`}>
          {barString}
        </span>
        <span
          className={`font-bold font-mono text-sm min-w-[3rem] text-right ${
            wakeLevel >= 85
              ? 'text-red-400'
              : wakeLevel >= 70
                ? 'text-amber-400'
                : 'text-slate-200'
          }`}
        >
          {roundedLevel}%
        </span>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-900/80 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-100 ease-out rounded-full ${
            wakeLevel >= 85
              ? 'bg-gradient-to-r from-amber-500 to-red-500'
              : wakeLevel >= 70
                ? 'bg-gradient-to-r from-sky-500 to-amber-500'
                : 'bg-gradient-to-r from-sky-600 to-sky-400'
          }`}
          style={{ width: `${wakeLevel}%` }}
        />
      </div>

      {/* Game Over Reset action */}
      {isGameOver && onRestart && (
        <div className="mt-3 pt-2 border-t border-red-500/30 flex items-center justify-between">
          <span className="text-xs text-red-400 font-mono">Friend woke up!</span>
          <button
            onClick={onRestart}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold rounded transition-colors shadow-lg shadow-red-950"
          >
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
