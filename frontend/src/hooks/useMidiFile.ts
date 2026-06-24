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
  groups: NoteGroup[]; // vorberechnet beim Laden
}

export interface NoteGroup {
  time: number;
  notes: Set<number>;
}

export type PlaybackState = "idle" | "playing" | "paused" | "waiting";

// Noten die innerhalb von 80ms starten kommen in dieselbe Gruppe (= Akkord)
function computeGroups(notes: ParsedNote[], threshold = 0.08): NoteGroup[] {
  const groups: NoteGroup[] = [];
  for (const note of [...notes].sort((a, b) => a.time - b.time)) {
    const last = groups[groups.length - 1];
    if (last && note.time - last.time <= threshold) {
      last.notes.add(note.note);
    } else {
      groups.push({ time: note.time, notes: new Set([note.note]) });
    }
  }
  return groups;
}

export function useMidiFile(activeNotes: Map<number, number>, waitMode: boolean) {
  const [song, setSong] = useState<SongData | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [pendingNotes, setPendingNotes] = useState<Set<number>>(new Set());

  const rafRef           = useRef<number | null>(null);
  const startWallRef     = useRef(0);
  const startTimeRef     = useRef(0);
  const curTimeRef       = useRef(0);
  const pendingRef       = useRef<Set<number>>(new Set());
  const latchedRef       = useRef<Set<number>>(new Set());
  const songRef          = useRef<SongData | null>(null);
  const waitModeRef      = useRef(waitMode);
  const stateRef         = useRef<PlaybackState>("idle");
  const nextGroupIdxRef  = useRef(0); // Index der nächsten Wartegruppe

  useEffect(() => { waitModeRef.current = waitMode; }, [waitMode]);
  useEffect(() => { songRef.current = song; }, [song]);

  const cancelAnim = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  const syncTime  = (t: number) => { curTimeRef.current = t; setCurrentTime(t); };
  const syncState = (s: PlaybackState) => { stateRef.current = s; setPlaybackState(s); };

  const startAnimLoop = useCallback(() => {
    const loop = () => {
      const song = songRef.current;
      if (!song) return;

      const elapsed = (performance.now() - startWallRef.current) / 1000;
      const newTime = startTimeRef.current + elapsed;

      if (waitModeRef.current) {
        const groups = song.groups;
        const idx    = nextGroupIdxRef.current;
        // Prüfen ob die nächste Gruppe fällig ist
        if (idx < groups.length && newTime >= groups[idx].time) {
          pendingRef.current  = new Set(groups[idx].notes);
          latchedRef.current  = new Set();
          setPendingNotes(new Set(groups[idx].notes));
          syncTime(groups[idx].time);
          syncState("waiting");
          return; // Loop hält — wird durch activeNotes-Effect wieder gestartet
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
    nextGroupIdxRef.current = 0;
    pendingRef.current  = new Set();
    latchedRef.current  = new Set();
    setPendingNotes(new Set());
    syncState("idle");
  }, [cancelAnim]);

  const seek = useCallback((time: number) => {
    cancelAnim();
    syncTime(time);
    pendingRef.current  = new Set();
    latchedRef.current  = new Set();
    setPendingNotes(new Set());

    // Nächste Gruppe nach der neuen Zeit finden
    const groups = songRef.current?.groups ?? [];
    const idx    = groups.findIndex(g => g.time > time);
    nextGroupIdxRef.current = idx === -1 ? groups.length : idx;

    if (stateRef.current === "playing") {
      startWallRef.current = performance.now();
      startTimeRef.current = time;
      syncState("playing");
      startAnimLoop();
    } else {
      syncState("paused");
    }
  }, [cancelAnim, startAnimLoop]);

  const skip = useCallback(() => {
    if (stateRef.current !== "waiting") return;
    nextGroupIdxRef.current++;
    pendingRef.current  = new Set();
    latchedRef.current  = new Set();
    setPendingNotes(new Set());
    startWallRef.current = performance.now();
    startTimeRef.current = curTimeRef.current;
    syncState("playing");
    startAnimLoop();
  }, [startAnimLoop]);

  const loadFile = useCallback((file: File) => {
    cancelAnim();
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const midi   = new Midi(buffer);
      const notes: ParsedNote[] = [];
      for (const track of midi.tracks)
        for (const n of track.notes)
          notes.push({ note: n.midi, time: n.time, duration: n.duration, velocity: Math.round(n.velocity * 127) });
      notes.sort((a, b) => a.time - b.time);

      const newSong: SongData = {
        name: file.name.replace(/\.midi?$/i, ""),
        notes,
        duration: midi.duration,
        groups: computeGroups(notes),
      };
      songRef.current = newSong;
      setSong(newSong);
      syncTime(0);
      nextGroupIdxRef.current = 0;
      pendingRef.current  = new Set();
      latchedRef.current  = new Set();
      setPendingNotes(new Set());
      syncState("idle");
    };
    reader.readAsArrayBuffer(file);
  }, [cancelAnim]);

  // Prüft ob alle pending Notes gespielt wurden
  useEffect(() => {
    if (pendingRef.current.size === 0 || stateRef.current !== "waiting") return;

    for (const note of activeNotes.keys())
      if (pendingRef.current.has(note)) latchedRef.current.add(note);

    const allDone = Array.from(pendingRef.current).every(n => latchedRef.current.has(n));
    if (!allDone) return;

    // Gruppe als erledigt markieren und weiterspielen
    nextGroupIdxRef.current++;
    pendingRef.current  = new Set();
    latchedRef.current  = new Set();
    setPendingNotes(new Set());

    setTimeout(() => {
      startWallRef.current = performance.now();
      startTimeRef.current = curTimeRef.current;
      syncState("playing");
      startAnimLoop();
    }, 100);
  }, [activeNotes, startAnimLoop]);

  return { song, playbackState, currentTime, pendingNotes, loadFile, play, pause, stop, seek, skip };
}
