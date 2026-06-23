import { useEffect, useState } from "react";
import type { TimingResult } from "../hooks/useTimingAnalysis";
import styles from "./TimingFeedback.module.css";

const LABELS = {
  perfect: "Perfekt!",
  good: "Gut",
  early: "Zu früh",
  late: "Zu spät",
};

const COLORS = {
  perfect: "#4caf50",
  good: "#8bc34a",
  early: "#ff9800",
  late: "#f44336",
};

interface TimingFeedbackProps {
  result: TimingResult | null;
  stats: { perfect: number; good: number; early: number; late: number; total: number };
  onReset: () => void;
}

export function TimingFeedback({ result, stats, onReset }: TimingFeedbackProps) {
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState<TimingResult | null>(null);

  useEffect(() => {
    if (!result) return;
    setDisplayed(result);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 900);
    return () => clearTimeout(t);
  }, [result]);

  const accuracy = stats.total > 0
    ? Math.round(((stats.perfect + stats.good) / stats.total) * 100)
    : null;

  return (
    <div className={styles.wrapper}>
      {/* Fliegendes Feedback */}
      {displayed && (
        <div
          className={`${styles.popup} ${visible ? styles.show : styles.hide}`}
          style={{ color: COLORS[displayed.rating] }}
        >
          <span className={styles.label}>{LABELS[displayed.rating]}</span>
          <span className={styles.offset}>
            {displayed.offsetMs > 0 ? "+" : ""}{Math.round(displayed.offsetMs)} ms
          </span>
        </div>
      )}

      {/* Statistik-Leiste */}
      <div className={styles.stats}>
        {(["perfect", "good", "early", "late"] as const).map((r) => (
          <div key={r} className={styles.statItem}>
            <span className={styles.statLabel} style={{ color: COLORS[r] }}>{LABELS[r]}</span>
            <span className={styles.statValue}>{stats[r]}</span>
          </div>
        ))}
        {accuracy !== null && (
          <div className={styles.statItem}>
            <span className={styles.statLabel} style={{ color: "#4a9eff" }}>Genauigkeit</span>
            <span className={styles.statValue}>{accuracy}%</span>
          </div>
        )}
        {stats.total > 0 && (
          <button className={styles.resetBtn} onClick={onReset}>Zurücksetzen</button>
        )}
      </div>
    </div>
  );
}
