import { useGameStore } from '../store/gameStore';
import type { GameControls } from '../hooks/useGame';
import type { StealthRating } from '../types';

interface GameOverlayProps {
  controls: GameControls | null;
}

export function GameOverlay({ controls }: GameOverlayProps) {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const maxWakeLevel = useGameStore((s) => s.maxWakeLevel);
  const totalNoiseGenerated = useGameStore((s) => s.totalNoiseGenerated);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const missionStats = useGameStore((s) => s.missionStats);
  const highScores = useGameStore((s) => s.highScores);

  if (gameStatus === 'PLAYING' || gameStatus === 'MENU') {
    return null;
  }

  const getRatingBadge = (rating: StealthRating) => {
    switch (rating) {
      case 'NINJA':
        return {
          icon: '🥷',
          label: 'NINJA',
          color: 'text-emerald-300 border-emerald-500/60 bg-emerald-950/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
        };
      case 'PROFESSIONAL SNEAK':
        return {
          icon: '🕵️',
          label: 'PROFESSIONAL SNEAK',
          color: 'text-sky-300 border-sky-500/60 bg-sky-950/60 shadow-[0_0_20px_rgba(56,189,248,0.3)]',
        };
      case 'DECENT':
        return {
          icon: '🚶',
          label: 'DECENT',
          color: 'text-amber-300 border-amber-500/50 bg-amber-950/40',
        };
      case 'WALKING DISASTER':
      default:
        return {
          icon: '📢',
          label: 'WALKING DISASTER',
          color: 'text-red-300 border-red-500/60 bg-red-950/50',
        };
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 animate-fadeIn">
      {/* ── 1. PAUSED SCREEN ────────────────────────────────────────────── */}
      {gameStatus === 'PAUSED' && (
        <div className="max-w-md w-full p-6 text-center rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl">
          <h2 className="font-mono font-bold text-3xl tracking-widest text-sky-400 mb-2">
            PAUSED
          </h2>
          <p className="text-slate-400 text-sm mb-6 font-sans">
            Take a breath. Your friend is still fast asleep.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => controls?.resume()}
              className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-sm rounded-lg shadow-lg shadow-sky-950/50 transition-all hover:scale-105"
            >
              RESUME
            </button>
            <button
              onClick={() => controls?.restart()}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-medium text-sm rounded-lg border border-slate-700 transition-all hover:scale-105"
            >
              RESTART
            </button>
          </div>

          <p className="mt-5 text-xs text-slate-400 font-mono">
            Tip: Press <span className="key-badge">ESC</span> anytime to pause
          </p>
        </div>
      )}

      {/* ── 2. GAME OVER SCREEN ─────────────────────────────────────────── */}
      {gameStatus === 'GAME_OVER' && (
        <div className="max-w-lg w-full p-7 text-center rounded-xl bg-slate-900/95 border border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.25)]">
          <div className="inline-block p-3 rounded-full bg-red-950/50 border border-red-500/40 mb-3 animate-bounce">
            <span className="text-3xl select-none">💀</span>
          </div>

          <h2 className="font-mono font-bold text-2xl sm:text-3xl tracking-wider text-red-500 mb-1">
            YOU WOKE HIM UP
          </h2>
          <p className="text-slate-400 text-sm italic mb-6">
            "That was definitely your fault."
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-left">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider mb-0.5">
                Wake Level
              </p>
              <p className="text-lg font-bold text-red-400">100%</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider mb-0.5">
                Max Wake Level
              </p>
              <p className="text-lg font-bold text-amber-400">{Math.round(maxWakeLevel)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider mb-0.5">
                Total Noise
              </p>
              <p className="text-lg font-bold text-slate-200">
                {Math.round(totalNoiseGenerated)} pts
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider mb-0.5">
                Time Survived
              </p>
              <p className="text-lg font-bold text-slate-200">{elapsedTime.toFixed(1)}s</p>
            </div>
          </div>

          <button
            onClick={() => controls?.restart()}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-sm rounded-lg shadow-lg shadow-red-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* ── 3. GAME COMPLETE SCREEN ─────────────────────────────────────── */}
      {gameStatus === 'GAME_COMPLETE' && (
        <div className="max-w-lg w-full p-7 text-center rounded-xl bg-slate-900/95 border border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
          <div className="inline-block p-3 rounded-full bg-emerald-950/50 border border-emerald-500/40 mb-3 animate-pulse">
            <span className="text-3xl select-none">🎉</span>
          </div>

          <h2 className="font-mono font-bold text-2xl sm:text-3xl tracking-wider text-emerald-400 mb-1">
            MISSION COMPLETE
          </h2>
          <p className="text-slate-300 text-sm mb-4">
            You completed the mission without waking your friend!
          </p>

          {/* Stealth Rating Badge */}
          {missionStats && (
            <div className="mb-5">
              {(() => {
                const badge = getRatingBadge(missionStats.stealthRating);
                return (
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono text-xs font-bold uppercase tracking-widest ${badge.color}`}
                  >
                    <span>{badge.icon}</span>
                    <span>STEALTH RATING: {badge.label}</span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 mb-6 font-mono text-left">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <p className="text-[0.6rem] text-slate-400 uppercase tracking-wider mb-0.5">
                Time Taken
              </p>
              <p className="text-base font-bold text-slate-200">
                {(missionStats?.timeTaken ?? elapsedTime).toFixed(1)}s
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <p className="text-[0.6rem] text-slate-400 uppercase tracking-wider mb-0.5">
                Max Wake Level
              </p>
              <p className="text-base font-bold text-amber-300">
                {missionStats?.maxWakeLevel ?? Math.round(maxWakeLevel)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <p className="text-[0.6rem] text-slate-400 uppercase tracking-wider mb-0.5">
                Total Noise
              </p>
              <p className="text-base font-bold text-slate-200">
                {missionStats?.totalNoiseGenerated ?? Math.round(totalNoiseGenerated)} pts
              </p>
            </div>
          </div>

          <div className="mb-5 p-3 rounded-lg bg-slate-950/60 border border-sky-500/20 font-mono text-left">
            <p className="text-[0.65rem] text-sky-300 uppercase tracking-widest mb-2">Best Stealth Run</p>
            <div className="grid grid-cols-2 gap-1 text-[0.68rem] text-slate-400"><span>Best score: <b className="text-slate-200">{highScores.bestScore}</b></span><span>Lowest wake: <b className="text-slate-200">{highScores.lowestWakeLevel === 100 ? '—' : `${highScores.lowestWakeLevel}%`}</b></span><span>Fastest: <b className="text-slate-200">{highScores.fastestCompletion ? `${highScores.fastestCompletion.toFixed(1)}s` : '—'}</b></span><span>Missions: <b className="text-slate-200">{highScores.missionsCompleted}</b></span></div>
          </div>

          <button
            onClick={() => controls?.restart()}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-sm rounded-lg shadow-lg shadow-emerald-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
