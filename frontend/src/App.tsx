import { useMidi } from "./hooks/useMidi";
import { useExercise } from "./hooks/useExercise";
import { Piano } from "./components/Piano";
import { NoteDisplay } from "./components/NoteDisplay";
import { NoteExercise } from "./components/NoteExercise";
import "./App.css";

const WS_URL = "ws://localhost:8000/midi/ws";

export default function App() {
  const { activeNotes, connected, simulateNote } = useMidi(WS_URL);
  const exercise = useExercise(activeNotes);

  return (
    <div className="app">
      <header className="header">
        <h1>LibrePiano</h1>
        <span className={`status ${connected ? "online" : "offline"}`}>
          {connected ? "Verbunden" : "Nicht verbunden"}
        </span>
      </header>

      <main className="main">
        <NoteExercise {...exercise} onReset={exercise.reset} />
        <NoteDisplay activeNotes={activeNotes} />

        <div className="piano-wrapper">
          <Piano
            activeNotes={activeNotes}
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
