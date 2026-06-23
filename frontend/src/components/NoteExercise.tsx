import { noteToName, type ExerciseState, type Feedback } from "../hooks/useExercise";
import styles from "./NoteExercise.module.css";

interface NoteExerciseProps extends ExerciseState {
  onReset: () => void;
}

const FEEDBACK_TEXT: Record<NonNullable<Feedback>, string> = {
  correct: "Richtig!",
  wrong: "Falsch",
};

export function NoteExercise({ targetNote, feedback, wrongNote, score, streak, onReset }: NoteExerciseProps) {
  return (
    <div className={`${styles.card} ${feedback ? styles[feedback] : ""}`}>
      <div className={styles.top}>
        <div className={styles.scoreBox}>
          <span className={styles.scoreLabel}>Punkte</span>
          <span className={styles.scoreValue}>{score}</span>
        </div>
        {streak >= 2 && (
          <span className={styles.streak}>{streak}x Streak</span>
        )}
        <button className={styles.resetBtn} onClick={onReset}>Neu starten</button>
      </div>

      <div className={styles.target}>
        <span className={styles.label}>Spiel diese Note:</span>
        <span className={styles.noteName}>{noteToName(targetNote)}</span>
      </div>

      <div className={styles.feedback}>
        {feedback === "correct" && <span className={styles.correct}>{FEEDBACK_TEXT.correct}</span>}
        {feedback === "wrong" && wrongNote !== null && (
          <span className={styles.wrong}>
            {FEEDBACK_TEXT.wrong} — du hast {noteToName(wrongNote)} gespielt
          </span>
        )}
      </div>
    </div>
  );
}
