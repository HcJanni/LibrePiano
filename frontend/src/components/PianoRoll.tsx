import { useEffect, useRef } from "react";
import type { SongData } from "../hooks/useMidiFile";
import { isBlack, noteLayout, PIANO_WIDTH } from "../utils/pianoLayout";
import styles from "./PianoRoll.module.css";

const LOOK_AHEAD = 3.5;  // Sekunden die nach vorne angezeigt werden
const PX_PER_SEC = 100;
const CANVAS_H = Math.round(LOOK_AHEAD * PX_PER_SEC); // 350px

interface PianoRollProps {
  song: SongData;
  currentTime: number;
  pendingNotes: Set<number>;
  activeNotes: Map<number, number>;
}

export function PianoRoll({ song, currentTime, pendingNotes, activeNotes }: PianoRollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Hintergrund
    ctx.fillStyle = "#0a0a18";
    ctx.fillRect(0, 0, PIANO_WIDTH, CANVAS_H);

    // Spalten für schwarze Tasten leicht dunkler — hilft bei Orientierung
    for (let note = 36; note <= 96; note++) {
      if (!isBlack(note)) continue;
      const layout = noteLayout(note);
      if (!layout) continue;
      ctx.fillStyle = "#07071a";
      ctx.fillRect(layout.x, 0, layout.w, CANVAS_H);
    }

    // Vertikale Oktav-Trennlinien
    for (let note = 36; note <= 96; note++) {
      if (note % 12 !== 0) continue;
      const layout = noteLayout(note);
      if (!layout) continue;
      ctx.strokeStyle = "#1e1e3a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(layout.x, 0);
      ctx.lineTo(layout.x, CANVAS_H);
      ctx.stroke();
    }

    // Noten zeichnen
    // Y=0 ist oben (Zukunft), Y=CANVAS_H ist unten (jetzt)
    // Eine Note zum Zeitpunkt t:
    //   Unterkante: CANVAS_H - (t - currentTime) * PX_PER_SEC
    //   Oberkante:  Unterkante - duration * PX_PER_SEC
    for (const n of song.notes) {
      const layout = noteLayout(n.note);
      if (!layout) continue;

      const bottom = CANVAS_H - (n.time - currentTime) * PX_PER_SEC;
      const top    = bottom - Math.max(8, n.duration * PX_PER_SEC);

      if (top > CANVAS_H || bottom < 0) continue; // außerhalb sichtbar

      const isPending = pendingNotes.has(n.note);
      const isActive  = activeNotes.has(n.note);
      const isPast    = n.time < currentTime - 0.05;

      let color: string;
      if (isActive)       color = "#ffffff";
      else if (isPending) color = "#ffcc00"; // gelb = jetzt spielen
      else if (isPast)    color = "#1a2a4a";
      else {
        const t = n.velocity / 127;
        color = isBlack(n.note)
          ? `hsl(210, 80%, ${27 + t * 25}%)`
          : `hsl(210, 90%, ${35 + t * 30}%)`;
      }

      const clampTop    = Math.max(0, top);
      const clampBottom = Math.min(CANVAS_H, bottom);
      const h = clampBottom - clampTop;
      if (h <= 0) continue;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(layout.x + 1, clampTop, layout.w - 2, h, 3);
      ctx.fill();
    }

    // NOW-Linie am unteren Rand (wo die Klaviatur beginnt)
    ctx.strokeStyle = "#ff3333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_H - 1);
    ctx.lineTo(PIANO_WIDTH, CANVAS_H - 1);
    ctx.stroke();

  }, [song, currentTime, pendingNotes, activeNotes]);

  return (
    <canvas
      ref={canvasRef}
      width={PIANO_WIDTH}
      height={CANVAS_H}
      className={styles.canvas}
    />
  );
}
