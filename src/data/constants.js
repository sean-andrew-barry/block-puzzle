export const GRID_COLS = 12;
export const GRID_ROWS = 12;
export const QUEUE_SIZE = 4;
export const CELL_MIN = 20;  // minimum cell px when auto-scaling
export const CELL_MAX = 64;  // maximum cell px when auto-scaling
export const CLEAR_MS = 280; // duration of clear flash/shrink
export const SHIFT_MS = 320; // duration of board shift animation
export const COMBO_MS = 900; // combo popup lifetime
export const BURST_MS = 1000; // score burst lifetime

export const SHAPES = [
  { key: "single", name: "1×1", color: "bg-emerald-500", flash: "bg-emerald-200", blocks: [[0, 0]] },
  { key: "line2", name: "1×2", color: "bg-sky-400", flash: "bg-sky-200", blocks: [[0, 0], [1, 0]] },
  { key: "line3", name: "1×3", color: "bg-amber-500", flash: "bg-amber-200", blocks: [[0, 0], [1, 0], [2, 0]] },
  { key: "line4", name: "1×4", color: "bg-rose-500", flash: "bg-rose-200", blocks: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { key: "square2", name: "2×2", color: "bg-violet-500", flash: "bg-violet-200", blocks: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  { key: "square3", name: "3×3", color: "bg-cyan-500", flash: "bg-cyan-200", blocks: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]] },
  { key: "corner2", name: "Corner 2×2", color: "bg-yellow-500", flash: "bg-yellow-200", blocks: [[0, 0], [1, 0], [0, 1]] },
  { key: "t3", name: "T", color: "bg-teal-400", flash: "bg-teal-200", blocks: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  { key: "L3", name: "L", color: "bg-lime-400", flash: "bg-lime-200", blocks: [[0, 0], [0, 1], [0, 2], [1, 2]] },
  { key: "Z", name: "Z", color: "bg-rose-400", flash: "bg-rose-200", blocks: [[0, 0], [1, 0], [1, 1], [2, 1]] },
];

export const FLASH_BY_COLOR = SHAPES.reduce((acc, s) => {
  acc[s.color] = s.flash || deriveFlashClass(s.color);
  return acc;
}, {});

export function deriveFlashClass(base) {
  const m = /^bg-([a-z-]+)-(\d{2,3})$/.exec(base);
  if (!m) return "bg-white";
  const [_, hue] = m;
  return `bg-${hue}-200`;
}
