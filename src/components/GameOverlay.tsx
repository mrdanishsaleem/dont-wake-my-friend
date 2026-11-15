import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { GameControls } from '../hooks/useGame';

export function GameOverlay({ controls }: { controls: GameControls | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const status = useGameStore((s) => s.gameStatus);
  const mission = useGameStore((s) => s.currentMission);
  const elapsed = useGameStore((s) => s.elapsedTime);
  const wake = useGameStore((s) => s.maxWakeLevel);
  const noise = useGameStore((s) => s.totalNoiseGenerated);
  const records = useGameStore((s) => s.highScores);

  const paused = status === 'PAUSED';
  const won = status === 'GAME_COMPLETE';
  const finished = won || status === 'GAME_OVER';
  const visible = paused || finished;
  const stats = mission?.stats;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (visible && !element.open) element.showModal();
    if (!visible && element.open) element.close();
  }, [visible]);

  return (
    <dialog ref={dialog} className="game-dialog" data-result={status}
      aria-labelledby="game-dialog-title" onCancel={(event) => event.preventDefault()}>
      <div className="game-dialog-content">
        <h2 id="game-dialog-title">{paused ? 'Game paused' : won ? 'Mission complete' : 'You woke him up'}</h2>
        {paused && mission && <p className="game-dialog-note">{mission.title}</p>}
        {won && stats && (
          <p className="game-dialog-note">
            <strong>{stats.stealthScore}/100</strong> · {stats.stealthRating.toLowerCase()}
          </p>
        )}
        {finished && (
          <dl className="game-dialog-stats">
            <div><dt>Time</dt><dd>{(stats?.timeTaken ?? elapsed).toFixed(1)}s</dd></div>
            <div><dt>Peak wake</dt><dd>{Math.round(stats?.maxWakeLevel ?? wake)}%</dd></div>
            <div><dt>Noise</dt><dd>{Math.round(stats?.totalNoiseGenerated ?? noise)} pts</dd></div>
          </dl>
        )}
        {won && (
          <details className="game-dialog-records">
            <summary>Personal records</summary>
            <dl className="game-dialog-stats">
              <div><dt>Best score</dt><dd>{records.bestScore}</dd></div>
              <div><dt>Lowest wake</dt><dd>{records.lowestWakeLevel}%</dd></div>
              <div><dt>Fastest</dt><dd>{records.fastestCompletion.toFixed(1)}s</dd></div>
              <div><dt>Missions</dt><dd>{records.missionsCompleted}</dd></div>
            </dl>
          </details>
        )}
        <div className="game-dialog-actions">
          {paused && <button type="button" autoFocus onClick={() => controls?.resume()}>Resume <kbd>Esc</kbd></button>}
          <button type="button" className={paused ? 'game-dialog-secondary' : undefined}
            onClick={() => controls?.restart()}>
            {paused ? 'Restart' : won ? 'Play again' : 'Try again'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
