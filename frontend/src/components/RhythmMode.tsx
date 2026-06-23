import { useRef, useState } from "react";
import { useMidiFile } from "../hooks/useMidiFile";
import { useMetronome } from "../hooks/useMetronome";
import { useTimingAnalysis } from "../hooks/useTimingAnalysis";
import { FileUpload } from "./FileUpload";
import { MetronomeDisplay } from "./MetronomeDisplay";
import { PianoRoll } from "./PianoRoll";
import { PlaybackControls } from "./PlaybackControls";
import { TimingFeedback } from "./TimingFeedback";
import styles from "./RhythmMode.module.css";

interface RhythmModeProps {
  activeNotes: Map<number, number>;
}

export function RhythmMode({ activeNotes }: RhythmModeProps) {
  const [bpm, setBpm] = useState(80);
  const [metronomeRunning, setMetronomeRunning] = useState(false);

  const { beat, pulse } = useMetronome(bpm, metronomeRunning);
  const midiFile = useMidiFile(activeNotes, false); // kein Warte-Modus

  // Ref damit useTimingAnalysis immer die aktuelle Zeit hat (kein staler State)
  const currentTimeRef = useRef(0);
  currentTimeRef.current = midiFile.currentTime;

  const timing = useTimingAnalysis(activeNotes, midiFile.song ?? null, currentTimeRef);

  return (
    <div className={styles.wrapper}>
      <MetronomeDisplay
        bpm={bpm}
        beat={beat}
        pulse={pulse}
        running={metronomeRunning}
        onBpmChange={setBpm}
        onToggle={() => setMetronomeRunning((v) => !v)}
      />

      {midiFile.song ? (
        <>
          <PlaybackControls
            state={midiFile.playbackState}
            currentTime={midiFile.currentTime}
            duration={midiFile.song.duration}
            songName={midiFile.song.name}
            waitMode={false}
            onPlay={midiFile.play}
            onPause={midiFile.pause}
            onStop={midiFile.stop}
            onSeek={midiFile.seek}
            onWaitModeChange={() => {}}
            onClear={() => { midiFile.stop(); window.location.reload(); }}
          />
          <TimingFeedback
            result={timing.lastResult}
            stats={timing.stats}
            onReset={timing.resetStats}
          />
          <PianoRoll
            song={midiFile.song}
            currentTime={midiFile.currentTime}
            pendingNotes={new Set()}
            activeNotes={activeNotes}
          />
        </>
      ) : (
        <div className={styles.optionalUpload}>
          <p className={styles.hint}>Optional: MIDI-Datei laden für Timing-Analyse</p>
          <FileUpload onFile={midiFile.loadFile} />
        </div>
      )}
    </div>
  );
}
