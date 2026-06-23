import React from "react";
import styles from "./Piano.module.css";

const START_NOTE = 36;
const END_NOTE = 96;

function isBlack(note: number): boolean {
  return [1, 3, 6, 8, 10].includes(note % 12);
}

function noteToName(note: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[note % 12]}${Math.floor(note / 12) - 1}`;
}

// Velocity 1–127 → Helligkeit: leise = dunkleres Blau, laut = helles Cyan
function velocityToColor(velocity: number, isBlackKey: boolean): string {
  const t = velocity / 127; // 0.0 bis 1.0
  const lightness = isBlackKey
    ? 25 + t * 35  // Schwarze Taste: 25% bis 60%
    : 35 + t * 45; // Weiße Taste:   35% bis 80%
  return `hsl(210, 90%, ${lightness}%)`;
}

// Y-Position auf der Taste (0=oben, 1=unten) → Velocity 20–127
function positionToVelocity(e: React.MouseEvent<HTMLButtonElement>): number {
  const rect = e.currentTarget.getBoundingClientRect();
  const relY = (e.clientY - rect.top) / rect.height; // 0.0 bis 1.0
  return Math.round(20 + relY * 107);
}

function keyStyle(
  note: number,
  activeNotes: Map<number, number>,
  targetNote?: number,
): React.CSSProperties | undefined {
  const velocity = activeNotes.get(note);
  if (velocity !== undefined) {
    return { backgroundColor: velocityToColor(velocity, isBlack(note)) };
  }
  if (note === targetNote) {
    // Zielnote: gelb — leicht transparent damit die Tastenform erkennbar bleibt
    return { backgroundColor: isBlack(note) ? "#a07800" : "#ffcc00" };
  }
  return undefined;
}

interface PianoProps {
  activeNotes: Map<number, number>;
  targetNote?: number;
  onNoteDown: (note: number, velocity: number) => void;
  onNoteUp: (note: number) => void;
}

export function Piano({ activeNotes, targetNote, onNoteDown, onNoteUp }: PianoProps) {
  const whiteKeys: number[] = [];
  for (let n = START_NOTE; n <= END_NOTE; n++) {
    if (!isBlack(n)) whiteKeys.push(n);
  }

  return (
    <div className={styles.piano}>
      {whiteKeys.map((note) => {
        const velocity = activeNotes.get(note);
        const isTarget = note === targetNote && velocity === undefined;
        return (
          <button
            key={note}
            className={`${styles.white} ${velocity !== undefined ? styles.activeWhite : ""} ${isTarget ? styles.targetWhite : ""}`}
            style={keyStyle(note, activeNotes, targetNote)}
            onMouseDown={(e) => onNoteDown(note, positionToVelocity(e))}
            onMouseUp={() => onNoteUp(note)}
            onMouseLeave={() => activeNotes.has(note) && onNoteUp(note)}
            title={noteToName(note)}
          />
        );
      })}

      {Array.from({ length: END_NOTE - START_NOTE + 1 }, (_, i) => START_NOTE + i)
        .filter(isBlack)
        .map((note) => {
          const velocity = activeNotes.get(note);
          const whitesBefore = whiteKeys.filter((n) => n < note).length;
          const isTarget = note === targetNote && velocity === undefined;
          return (
            <button
              key={note}
              className={`${styles.black} ${velocity !== undefined ? styles.activeBlack : ""} ${isTarget ? styles.targetBlack : ""}`}
              style={{
                left: `calc(${whitesBefore} * var(--white-width) - var(--black-width) / 2)`,
                ...keyStyle(note, activeNotes, targetNote),
              }}
              onMouseDown={(e) => onNoteDown(note, positionToVelocity(e))}
              onMouseUp={() => onNoteUp(note)}
              onMouseLeave={() => activeNotes.has(note) && onNoteUp(note)}
              title={noteToName(note)}
            />
          );
        })}
    </div>
  );
}
