import { shapes } from "../data/shapes.js";

export const GRID_COLS = 12;
export const GRID_ROWS = 12;
export const TW_GRID_COLS = "grid-cols-12";
export const TW_GRID_ROWS = "grid-rows-12";
export const GAP_PX = 6; // e.g. 6px lines/gap
export const TW_GRID = `grid ${TW_GRID_COLS} ${TW_GRID_ROWS} aspect-square w-full max-w-[90vmin] mx-auto`;
export const QUEUE_SIZE = 4;
export const CELL_MIN = 20;  // minimum cell px when auto-scaling
export const CELL_MAX = 64;  // maximum cell px when auto-scaling
export const CLEAR_MS = 280; // duration of clear flash/shrink
export const SHIFT_MS = 320; // duration of board shift animation
export const COMBO_MS = 1800; // combo popup lifetime
export const BURST_MS = 2000; // score burst lifetime

export const FLASH_BY_COLOR = shapes.reduce((acc, s) => {
  acc[s.color] = s.flash || deriveFlashClass(s.color);
  return acc;
}, {});

export function deriveFlashClass(base) {
  const m = /^bg-([a-z-]+)-(\d{2,3})$/.exec(base);
  if (!m) return "bg-white";
  const [_, hue] = m;
  return `bg-${hue}-200`;
}
