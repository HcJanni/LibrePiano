import { useEffect, useRef, useState } from "react";

export interface MidiEvent {
  type: "note_on" | "note_off";
  note: number;
  velocity: number;
}

export function useMidi(url: string) {
  // Map: note → velocity (nur aktive Noten sind eingetragen)
  const [activeNotes, setActiveNotes] = useState<Map<number, number>>(new Map());
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      const data: MidiEvent = JSON.parse(event.data);
      setActiveNotes((prev) => {
        const next = new Map(prev);
        if (data.type === "note_on" && data.velocity > 0) {
          next.set(data.note, data.velocity);
        } else {
          next.delete(data.note);
        }
        return next;
      });
    };

    return () => ws.close();
  }, [url]);

  const simulateNote = (note: number, on: boolean, velocity = 100) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ note, velocity: on ? velocity : 0, on }));
    }
  };

  return { activeNotes, connected, simulateNote };
}
