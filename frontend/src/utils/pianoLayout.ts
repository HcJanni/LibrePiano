export const START_NOTE = 36;
export const END_NOTE = 96;
export const WHITE_W = 36;
export const BLACK_W = 22;

export function isBlack(note: number): boolean {
  return [1, 3, 6, 8, 10].includes(note % 12);
}

function whitesBeforeNote(note: number): number {
  let count = 0;
  for (let n = START_NOTE; n < note; n++) {
    if (!isBlack(n)) count++;
  }
  return count;
}

// Gibt x-Position und Breite einer Taste in Pixeln zurück
export function noteLayout(note: number): { x: number; w: number } | null {
  if (note < START_NOTE || note > END_NOTE) return null;
  const whites = whitesBeforeNote(note);
  if (isBlack(note)) {
    return { x: whites * WHITE_W - BLACK_W / 2, w: BLACK_W };
  }
  return { x: whites * WHITE_W, w: WHITE_W };
}

function countWhiteKeys(): number {
  let count = 0;
  for (let n = START_NOTE; n <= END_NOTE; n++) {
    if (!isBlack(n)) count++;
  }
  return count;
}

export const TOTAL_WHITES = countWhiteKeys();
export const PIANO_WIDTH = TOTAL_WHITES * WHITE_W; // 36 × 36 = 1296px
