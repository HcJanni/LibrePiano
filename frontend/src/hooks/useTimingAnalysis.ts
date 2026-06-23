import { useEffect, useRef, useState } from "react";
import type { SongData } from "./useMidiFile";

export type TimingRating = "perfect" | "good" | "early" | "late";

export interface TimingResult {
  note: number;
  offsetMs: number;   // positiv = zu spät, negativ = zu früh
  rating: TimingRating;
}

const RATINGS: { max: number; rating: TimingRating }[] = [
  { max: 50,  rating: "perfect" },
  { max: 150, rating: "good" },
];

function classify(offsetMs: number): TimingRating {
  const abs = Math.abs(offsetMs);
  for (const r of RATINGS) {
    if (abs <= r.max) return r.rating;
  }
  return offsetMs < 0 ? "early" : "late";
}

export function useTimingAnalysis(
  activeNotes: Map<number, number>,
  song: SongData | null,
  currentTimeRef: React.RefObject<number>,
) {
  const [lastResult, setLastResult] = useState<TimingResult | null>(null);
  const [stats, setStats] = useState({ perfect: 0, good: 0, early: 0, late: 0, total: 0 });
  const prevNotes = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!song) return;

    for (const note of activeNotes.keys()) {
      if (prevNotes.current.has(note)) continue;

      // Note wurde neu gedrückt — nächste erwartete Instanz dieser Note finden
      const now = currentTimeRef.current ?? 0;
      const candidates = song.notes
        .filter((n) => n.note === note)
        .map((n) => ({ ...n, delta: n.time - now }))
        .filter((n) => n.delta > -0.5 && n.delta < 0.5) // ±500ms Fenster
        .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));

      if (candidates.length === 0) continue;

      const offsetMs = candidates[0].delta * 1000 * -1; // positiv = zu spät
      const rating = classify(offsetMs);
      const result: TimingResult = { note, offsetMs, rating };

      setLastResult(result);
      setStats((prev) => ({
        ...prev,
        [rating]: prev[rating] + 1,
        total: prev.total + 1,
      }));
    }

    prevNotes.current = new Set(activeNotes.keys());
  }, [activeNotes, song]);

  const resetStats = () => {
    setStats({ perfect: 0, good: 0, early: 0, late: 0, total: 0 });
    setLastResult(null);
  };

  return { lastResult, stats, resetStats };
}
