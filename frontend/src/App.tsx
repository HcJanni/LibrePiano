import { useState } from "react";
import { useMidi } from "./hooks/useMidi";
import { useExercise } from "./hooks/useExercise";
import { useMidiFile } from "./hooks/useMidiFile";
import { Piano } from "./components/Piano";
import { NoteDisplay } from "./components/NoteDisplay";
import { NoteExercise } from "./components/NoteExercise";
import { FileUpload } from "./components/FileUpload";
import { PianoRoll } from "./components/PianoRoll";
import { PlaybackControls } from "./components/PlaybackControls";
import { RhythmMode } from "./components/RhythmMode";
import "./App.css";

// Im Dev-Modus direkt zum Backend, in Produktion durch nginx auf demselben Host
const WS_URL = import.meta.env.DEV
  ? "ws://localhost:8000/midi/ws"
  : `ws://${window.location.host}/midi/ws`;
type Mode = "free" | "exercise" | "song" | "rhythm";

export default function App() {
  const [mode, setMode] = useState<Mode>("free");
  const [waitMode, setWaitMode] = useState(false);

  const { activeNotes, connected, simulateNote } = useMidi(WS_URL);
  const exercise = useExercise(activeNotes);
  const midiFile = useMidiFile(activeNotes, waitMode);

  return (
    <div className="app">
      <header className="header">
        <h1>LibrePiano</h1>
        <span className={`status ${connected ? "online" : "offline"}`}>
          {connected ? "Verbunden" : "Nicht verbunden"}
        </span>
      </header>

      <nav className="tabs">
        <button className={`tab ${mode === "free" ? "active" : ""}`} onClick={() => setMode("free")}>
          Freies Spielen
        </button>
        <button className={`tab ${mode === "exercise" ? "active" : ""}`} onClick={() => setMode("exercise")}>
          Noten üben
        </button>
        <button className={`tab ${mode === "song" ? "active" : ""}`} onClick={() => setMode("song")}>
          Stück lernen
        </button>
        <button className={`tab ${mode === "rhythm" ? "active" : ""}`} onClick={() => setMode("rhythm")}>
          Rhythmus
        </button>
      </nav>

      <main className="main">
        {mode === "rhythm" && <RhythmMode activeNotes={activeNotes} />}

        {mode === "exercise" && (
          <NoteExercise
            {...exercise}
            onReset={exercise.reset}
            onRangeChange={exercise.setRangeIndex}
          />
        )}

        {mode === "song" && !midiFile.song && (
          <FileUpload onFile={midiFile.loadFile} />
        )}

        {mode === "song" && midiFile.song && (
          <PlaybackControls
            state={midiFile.playbackState}
            currentTime={midiFile.currentTime}
            duration={midiFile.song.duration}
            songName={midiFile.song.name}
            waitMode={waitMode}
            onPlay={midiFile.play}
            onPause={midiFile.pause}
            onStop={midiFile.stop}
            onSeek={midiFile.seek}
            onSkip={midiFile.skip}
            onWaitModeChange={setWaitMode}
            onClear={() => { midiFile.stop(); window.location.reload(); }}
          />
        )}

        {/* PianoRoll und Klaviatur im selben scrollbaren Container — bleiben ausgerichtet */}
        <div className="piano-section">
          {mode === "song" && midiFile.song && (
            <PianoRoll
              song={midiFile.song}
              currentTime={midiFile.currentTime}
              pendingNotes={midiFile.pendingNotes}
              activeNotes={activeNotes}
            />
          )}

          {mode !== "song" && <NoteDisplay activeNotes={activeNotes} />}

          <Piano
            activeNotes={activeNotes}
            targetNote={mode === "exercise" ? exercise.targetNote : undefined}
            targetNotes={mode === "song" && midiFile.pendingNotes.size > 0 ? midiFile.pendingNotes : undefined}
            onNoteDown={(note, velocity) => simulateNote(note, true, velocity)}
            onNoteUp={(note) => simulateNote(note, false)}
          />
        </div>

        {!connected && (
          <p className="hint">
            Backend nicht erreichbar — starte <code>docker compose up</code>
          </p>
        )}
      </main>
    </div>
  );
}
