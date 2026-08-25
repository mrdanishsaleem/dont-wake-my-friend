import { useGameStore } from '../store/gameStore';

export function ObjectivePanel({ onRestart }: { onRestart?: () => void }) {
  const currentMission = useGameStore((s) => s.currentMission);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const nearbyPrompt = useGameStore((s) => s.nearbyPrompt);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const missionStats = useGameStore((s) => s.missionStats);

  const isCompleted = gameStatus === 'GAME_COMPLETE';
  const isGameOver = gameStatus === 'GAME_OVER';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`panel objective-panel ${
        isCompleted
          ? '!border-emerald-500/50 !shadow-[0_0_20px_rgba(16,185,129,0.15)]'
          : isGameOver
            ? '!border-red-500/50'
            : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="panel-label !mb-0">OBJECTIVE</span>
        {isCompleted ? (
          <span className="text-[0.62rem] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-300 uppercase tracking-wider flex items-center gap-1 animate-pulse">
            <span>✓</span> COMPLETED
          </span>
        ) : isGameOver ? (
          <span className="text-[0.62rem] font-mono font-bold px-2 py-0.5 rounded border border-red-500/50 bg-red-950/40 text-red-300 uppercase tracking-wider">
            FAILED
          </span>
        ) : (
          <span className="text-[0.62rem] font-mono font-medium px-2 py-0.5 rounded border border-sky-500/30 bg-sky-950/20 text-sky-300 uppercase tracking-wider">
            IN PROGRESS · {formatTime(elapsedTime)}
          </span>
        )}
      </div>

      {/* Mission title & icon */}
      <div className="flex items-center gap-2 font-medium text-sm">
        <span className="text-base select-none">{currentMission?.icon ?? '🥤'}</span>
        <span
          className={`transition-colors ${
            isCompleted
              ? 'text-emerald-300 font-semibold'
              : 'text-slate-100'
          }`}
        >
          {isCompleted ? '✓ ' : ''}
          {currentMission?.title ?? 'Get a glass of water.'}
        </span>
      </div>

      {/* Mission description or completion stats */}
      {isCompleted && missionStats ? (
        <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[0.72rem] font-mono text-emerald-200/80 flex items-center justify-between">
          <span>Time: {missionStats.timeTaken.toFixed(1)}s</span>
          <span>Max Wake: {missionStats.maxWakeLevel}%</span>
          {onRestart && (
            <button
              onClick={onRestart}
              className="px-2 py-0.5 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded text-[0.68rem] transition-colors"
            >
              PLAY AGAIN
            </button>
          )}
        </div>
      ) : (
        <p className="text-[0.72rem] text-slate-400 mt-1 leading-relaxed">
          {currentMission?.description ?? 'Get a glass of water without waking your friend.'}
        </p>
      )}

      {/* Live interaction prompt if near item */}
      {!isCompleted && !isGameOver && nearbyPrompt && (
        <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center gap-1.5 text-xs text-sky-300 font-mono animate-pulse">
          <span className="key-badge !bg-sky-950 !text-sky-300 !border-sky-500">E</span>
          <span>{nearbyPrompt}</span>
        </div>
      )}
    </div>
  );
}
