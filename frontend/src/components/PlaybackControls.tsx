import type { PlaybackState } from "../hooks/useMidiFile";
import styles from "./PlaybackControls.module.css";

interface PlaybackControlsProps {
  state: PlaybackState;
  currentTime: number;
  duration: number;
  songName: string;
  waitMode: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onClear: () => void;
  onWaitModeChange: (v: boolean) => void;
  onSkip: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function PlaybackControls({
  state, currentTime, duration, songName, waitMode,
  onPlay, onPause, onStop, onSeek, onClear, onWaitModeChange, onSkip,
}: PlaybackControlsProps) {
  const isPlaying = state === "playing";
  const isWaiting = state === "waiting";

  return (
    <div className={styles.bar}>
      <span className={styles.name} title={songName}>{songName}</span>

      <div className={styles.controls}>
        <button className={styles.btn} onClick={onStop} title="Zurück zum Anfang">⏮</button>
        {isPlaying || isWaiting
          ? <button className={styles.btn} onClick={onPause}>⏸</button>
          : <button className={styles.btn} onClick={onPlay}>▶</button>
        }
      </div>

      <div className={styles.progress}>
        <span className={styles.time}>{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className={styles.slider}
        />
        <span className={styles.time}>{formatTime(duration)}</span>
      </div>

      <label className={styles.waitLabel}>
        <input
          type="checkbox"
          checked={waitMode}
          onChange={(e) => onWaitModeChange(e.target.checked)}
        />
        Auf Note warten
      </label>

      {isWaiting && (
        <div className={styles.waitingRow}>
          <span className={styles.waitingBadge}>⏳ Warte auf Note…</span>
          <button className={styles.skipBtn} onClick={onSkip} title="Note überspringen">Überspringen</button>
        </div>
      )}

      <button className={styles.clearBtn} onClick={onClear}>✕</button>
    </div>
  );
}
