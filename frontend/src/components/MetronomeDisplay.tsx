import styles from "./MetronomeDisplay.module.css";

interface MetronomeDisplayProps {
  bpm: number;
  beat: number;
  pulse: boolean;
  running: boolean;
  onBpmChange: (bpm: number) => void;
  onToggle: () => void;
}

export function MetronomeDisplay({ bpm, beat, pulse, running, onBpmChange, onToggle }: MetronomeDisplayProps) {
  return (
    <div className={`${styles.card} ${pulse ? styles.pulse : ""}`}>
      <div className={styles.left}>
        <span className={styles.bpmValue}>{bpm}</span>
        <span className={styles.bpmLabel}>BPM</span>
      </div>

      <div className={styles.center}>
        {/* 4 Beat-Punkte */}
        <div className={styles.beats}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`${styles.dot} ${running && beat === i ? styles.active : ""} ${i === 0 ? styles.accent : ""}`}
            />
          ))}
        </div>

        {/* Pendel-Linie */}
        <div
          className={styles.pendulum}
          style={{ transform: running ? `rotate(${beat % 2 === 0 ? -25 : 25}deg)` : "rotate(0deg)" }}
        >
          <div className={styles.pendulumBall} />
        </div>
      </div>

      <div className={styles.right}>
        <input
          type="range"
          min={40}
          max={200}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className={styles.slider}
          style={{ writingMode: "vertical-lr", direction: "rtl" }}
        />
        <div className={styles.bpmButtons}>
          <button className={styles.bpmBtn} onClick={() => onBpmChange(Math.max(40, bpm - 5))}>−5</button>
          <button className={styles.bpmBtn} onClick={() => onBpmChange(Math.min(200, bpm + 5))}>+5</button>
        </div>
      </div>

      <button
        className={`${styles.toggleBtn} ${running ? styles.running : ""}`}
        onClick={onToggle}
      >
        {running ? "⏹ Stop" : "▶ Start"}
      </button>
    </div>
  );
}
