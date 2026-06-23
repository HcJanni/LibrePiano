import { useCallback, useEffect, useRef, useState } from "react";

const EXERCISE_NOTES = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72]; // C4–C5

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function noteToName(note: number): string {
  return `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}

function randomNote(exclude?: number): number {
  const pool = EXERCISE_NOTES.filter((n) => n !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

export type Feedback = "correct" | "wrong" | null;

export interface ExerciseState {
  targetNote: number;
  feedback: Feedback;
  wrongNote: number | null; // welche Note falsch gespielt wurde
  score: number;
  streak: number;          // richtige Noten in Folge
}

export function useExercise(activeNotes: Map<number, number>) {
  const [state, setState] = useState<ExerciseState>({
    targetNote: randomNote(),
    feedback: null,
    wrongNote: null,
    score: 0,
    streak: 0,
  });

  // Verhindert dass mehrere Tasten gleichzeitig mehrfach auswerten
  const evaluating = useRef(false);

  useEffect(() => {
    if (activeNotes.size === 0 || evaluating.current) return;

    // Nur Noten im Übungsbereich prüfen
    const playedNote = Array.from(activeNotes.keys()).find((n) =>
      EXERCISE_NOTES.includes(n)
    );
    if (playedNote === undefined) return;

    evaluating.current = true;

    if (playedNote === state.targetNote) {
      setState((prev) => ({
        targetNote: prev.targetNote,
        feedback: "correct",
        wrongNote: null,
        score: prev.score + 10 + prev.streak * 2, // Streak-Bonus
        streak: prev.streak + 1,
      }));

      // Nach kurzem Feedback nächste Note
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          targetNote: randomNote(prev.targetNote),
          feedback: null,
        }));
        evaluating.current = false;
      }, 600);
    } else {
      setState((prev) => ({
        ...prev,
        feedback: "wrong",
        wrongNote: playedNote,
        streak: 0,
      }));

      setTimeout(() => {
        setState((prev) => ({ ...prev, feedback: null, wrongNote: null }));
        evaluating.current = false;
      }, 800);
    }
  }, [activeNotes]);

  const reset = useCallback(() => {
    evaluating.current = false;
    setState({ targetNote: randomNote(), feedback: null, wrongNote: null, score: 0, streak: 0 });
  }, []);

  return { ...state, reset };
}
