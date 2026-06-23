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
import "./App.css";

const WS_URL = "ws://localhost:8000/midi/ws";
type Mode = "free" | "exercise" | "song";

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
      </nav>

      <main className="main">
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
