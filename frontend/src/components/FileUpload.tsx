import { useRef, useState } from "react";
import styles from "./FileUpload.module.css";

interface FileUploadProps {
  onFile: (file: File) => void;
}

export function FileUpload({ onFile }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".mid") || file.name.endsWith(".midi"))) {
      onFile(file);
    }
  };

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <span className={styles.icon}>♪</span>
      <p className={styles.text}>MIDI-Datei hier ablegen oder klicken</p>
      <p className={styles.hint}>.mid / .midi</p>
      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
