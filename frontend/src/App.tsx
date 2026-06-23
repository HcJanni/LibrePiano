import { useMidi } from "./hooks/useMidi";
import { Piano } from "./components/Piano";
import { NoteDisplay } from "./components/NoteDisplay";
import "./App.css";

const WS_URL = "ws://localhost:8000/midi/ws";

export default function App() {
  const { activeNotes, connected, simulateNote } = useMidi(WS_URL);

  return (
    <div className="app">
      <header className="header">
        <h1>LibrePiano</h1>
        <span className={`status ${connected ? "online" : "offline"}`}>
          {connected ? "Verbunden" : "Nicht verbunden"}
        </span>
      </header>

      <main className="main">
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
