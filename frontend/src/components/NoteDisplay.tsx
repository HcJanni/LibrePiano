import styles from "./NoteDisplay.module.css";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteToName(note: number): string {
  return `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}

interface NoteDisplayProps {
  activeNotes: Map<number, number>;
}

export function NoteDisplay({ activeNotes }: NoteDisplayProps) {
  const sorted = Array.from(activeNotes.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className={styles.display}>
      {sorted.length === 0 ? (
        <span className={styles.empty}>Keine Note gedrückt</span>
      ) : (
        sorted.map(([note, velocity]) => {
          const percent = Math.round((velocity / 127) * 100);
          return (
            <div key={note} className={styles.note}>
              <span className={styles.name}>{noteToName(note)}</span>
              <div className={styles.velocityBar}>
                <div className={styles.velocityFill} style={{ width: `${percent}%` }} />
              </div>
              <span className={styles.velocityLabel}>{velocity}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
