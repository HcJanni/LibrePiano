import { useEffect, useRef, useState } from "react";

export function useMetronome(bpm: number, running: boolean) {
  const [beat, setBeat] = useState(0);   // 0–3 (Viertelnoten in 4/4)
  const [pulse, setPulse] = useState(false); // kurzes Aufleuchten pro Beat

  const beatRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!running) { setBeat(0); setPulse(false); return; }

    const intervalMs = (60 / bpm) * 1000;

    const tick = () => {
      beatRef.current = (beatRef.current + 1) % 4;
      setBeat(beatRef.current);
      setPulse(true);
      setTimeout(() => setPulse(false), Math.min(80, intervalMs * 0.3));
    };

    // Sofort starten
    tick();
    timerRef.current = setInterval(tick, intervalMs) as unknown as ReturnType<typeof setTimeout>;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [bpm, running]);

  return { beat, pulse };
}
