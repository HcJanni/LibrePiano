import { Midi } from "@tonejs/midi";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ParsedNote {
  note: number;
  time: number;
  duration: number;
  velocity: number;
}

export interface SongData {
  name: string;
  notes: ParsedNote[];
  duration: number;
}

export type PlaybackState = "idle" | "playing" | "paused" | "waiting";

export function useMidiFile(activeNotes: Map<number, number>, waitMode: boolean) {
  const [song, setSong] = useState<SongData | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [pendingNotes, setPendingNotes] = useState<Set<number>>(new Set());

  // Refs für den Animationsloop — React-State ist in rAF-Callbacks veraltet
  const rafRef        = useRef<number | null>(null);
  const startWallRef  = useRef(0);
  const startTimeRef  = useRef(0);
  const curTimeRef    = useRef(0);
  const pendingRef    = useRef<Set<number>>(new Set());
  const latchedRef    = useRef<Set<number>>(new Set()); // gespielte pending Notes
  const songRef       = useRef<SongData | null>(null);
  const waitModeRef   = useRef(waitMode);
  const stateRef      = useRef<PlaybackState>("idle");

  useEffect(() => { waitModeRef.current = waitMode; }, [waitMode]);
  useEffect(() => { songRef.current = song; }, [song]);

  const cancelAnim = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  const syncTime = (t: number) => { curTimeRef.current = t; setCurrentTime(t); };
  const syncState = (s: PlaybackState) => { stateRef.current = s; setPlaybackState(s); };

  // Gibt alle Noten zurück die in einem 80ms-Fenster um `time` starten
  const noteGroupAt = (song: SongData, time: number): ParsedNote[] =>
    song.notes.filter((n) => Math.abs(n.time - time) <= 0.08);

  const startAnimLoop = useCallback(() => {
    const loop = () => {
      const song = songRef.current;
      if (!song) return;

      const elapsed = (performance.now() - startWallRef.current) / 1000;
      const prevTime = curTimeRef.current;
      const newTime = startTimeRef.current + elapsed;

      if (waitModeRef.current) {
        // Noten die in diesem Tick fällig werden
        const due = song.notes.find((n) => n.time > prevTime && n.time <= newTime);
        if (due) {
          const group = noteGroupAt(song, due.time);
          const noteSet = new Set(group.map((n) => n.note));
          pendingRef.current = noteSet;
          latchedRef.current = new Set();
          setPendingNotes(noteSet);
          syncTime(due.time);
          syncState("waiting");
          return; // Loop pausiert — wird von activeNotes-Effect wieder gestartet
        }
      }

      if (newTime >= song.duration) {
        syncTime(song.duration);
        syncState("idle");
        return;
      }

      syncTime(newTime);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const play = useCallback(() => {
    cancelAnim();
    startWallRef.current = performance.now();
    startTimeRef.current = curTimeRef.current;
    syncState("playing");
    startAnimLoop();
  }, [cancelAnim, startAnimLoop]);

  const pause = useCallback(() => {
    cancelAnim();
    syncState("paused");
  }, [cancelAnim]);

  const stop = useCallback(() => {
    cancelAnim();
    syncTime(0);
    syncState("idle");
    pendingRef.current = new Set();
    latchedRef.current = new Set();
    setPendingNotes(new Set());
  }, [cancelAnim]);

  const seek = useCallback((time: number) => {
    const wasPlaying = stateRef.current === "playing";
    cancelAnim();
    syncTime(time);
    pendingRef.current = new Set();
    latchedRef.current = new Set();
    setPendingNotes(new Set());
    if (wasPlaying) {
      startWallRef.current = performance.now();
      startTimeRef.current = time;
      syncState("playing");
      startAnimLoop();
    } else {
      syncState("paused");
    }
  }, [cancelAnim, startAnimLoop]);

  const loadFile = useCallback((file: File) => {
    cancelAnim();
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const midi = new Midi(buffer);
      const notes: ParsedNote[] = [];
      for (const track of midi.tracks) {
        for (const n of track.notes) {
          notes.push({
            note: n.midi,
            time: n.time,
            duration: n.duration,
            velocity: Math.round(n.velocity * 127),
          });
        }
      }
      notes.sort((a, b) => a.time - b.time);
      const newSong: SongData = {
        name: file.name.replace(/\.midi?$/i, ""),
        notes,
        duration: midi.duration,
      };
      songRef.current = newSong;
      setSong(newSong);
      syncTime(0);
      syncState("idle");
      pendingRef.current = new Set();
      latchedRef.current = new Set();
      setPendingNotes(new Set());
    };
    reader.readAsArrayBuffer(file);
  }, [cancelAnim]);

  // Prüft ob alle pending Notes gespielt wurden (mit Latch — einzeln okay)
  useEffect(() => {
    if (pendingRef.current.size === 0 || stateRef.current !== "waiting") return;

    for (const note of activeNotes.keys()) {
      if (pendingRef.current.has(note)) latchedRef.current.add(note);
    }

    const allDone = Array.from(pendingRef.current).every((n) => latchedRef.current.has(n));
    if (!allDone) return;

    pendingRef.current = new Set();
    latchedRef.current = new Set();
    setPendingNotes(new Set());

    setTimeout(() => {
      startWallRef.current = performance.now();
      startTimeRef.current = curTimeRef.current;
      syncState("playing");
      startAnimLoop();
    }, 150);
  }, [activeNotes, startAnimLoop]);

  return { song, playbackState, currentTime, pendingNotes, loadFile, play, pause, stop, seek };
}
