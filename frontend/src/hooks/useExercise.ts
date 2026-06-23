import { useCallback, useEffect, useRef, useState } from "react";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function noteToName(note: number): string {
  return `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}

export interface OctaveRange {
  label: string;
  notes: number[];
}

// Vordefinierte Übungsbereiche — nur weiße Tasten, nur schwarze, oder alle
export const OCTAVE_RANGES: OctaveRange[] = [
  {
    label: "C4 – C5 (weiße Tasten)",
    notes: [60, 62, 64, 65, 67, 69, 71, 72],
  },
  {
    label: "C4 – C5 (alle Tasten)",
    notes: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72],
  },
  {
    label: "C3 – C5 (weiße Tasten)",
    notes: [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72],
  },
  {
    label: "C3 – C5 (alle Tasten)",
    notes: Array.from({ length: 25 }, (_, i) => 48 + i),
  },
];

function randomNote(pool: number[], exclude?: number): number {
  const filtered = pool.filter((n) => n !== exclude);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export type Feedback = "correct" | "wrong" | null;

export interface ExerciseState {
  targetNote: number;
  feedback: Feedback;
  wrongNote: number | null;
  score: number;
  streak: number;
  rangeIndex: number;
}

export function useExercise(activeNotes: Map<number, number>) {
  const [rangeIndex, setRangeIndex] = useState(0);
  const range = OCTAVE_RANGES[rangeIndex];

  const [state, setState] = useState<ExerciseState>({
    targetNote: randomNote(OCTAVE_RANGES[0].notes),
    feedback: null,
    wrongNote: null,
    score: 0,
    streak: 0,
    rangeIndex: 0,
  });

  const evaluating = useRef(false);

  // Wenn sich der Bereich ändert, neue Zielnote aus dem neuen Bereich wählen
  useEffect(() => {
    evaluating.current = false;
    setState((prev) => ({
      ...prev,
      targetNote: randomNote(range.notes),
      feedback: null,
      wrongNote: null,
      rangeIndex,
    }));
  }, [rangeIndex]);

  useEffect(() => {
    if (activeNotes.size === 0 || evaluating.current) return;

    const playedNote = Array.from(activeNotes.keys()).find((n) =>
      range.notes.includes(n)
    );
    if (playedNote === undefined) return;

    evaluating.current = true;

    if (playedNote === state.targetNote) {
      setState((prev) => ({
        ...prev,
        feedback: "correct",
        wrongNote: null,
        score: prev.score + 10 + prev.streak * 2,
        streak: prev.streak + 1,
      }));
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          targetNote: randomNote(range.notes, prev.targetNote),
          feedback: null,
        }));
        evaluating.current = false;
      }, 600);
    } else {
      setState((prev) => ({ ...prev, feedback: "wrong", wrongNote: playedNote, streak: 0 }));
      setTimeout(() => {
        setState((prev) => ({ ...prev, feedback: null, wrongNote: null }));
        evaluating.current = false;
      }, 800);
    }
  }, [activeNotes]);

  const reset = useCallback(() => {
    evaluating.current = false;
    setState({
      targetNote: randomNote(range.notes),
      feedback: null,
      wrongNote: null,
      score: 0,
      streak: 0,
      rangeIndex,
    });
  }, [range, rangeIndex]);

  return { ...state, rangeIndex, setRangeIndex, reset };
}
