import { GRID_ROWS, GRID_COLS } from './constants.js';

export function emptyGrid() {
  return Array.from({ length: GRID_ROWS }, () => Array.from({ length: GRID_COLS }, () => null));
}

export function computeClears(g) {
  const rowsFull = new Set();
  const colsFull = new Set();

  for (let r = 0; r < GRID_ROWS; r++) {
    let full = true;
    for (let c = 0; c < GRID_COLS; c++) {
      if (!g[r][c]) { full = false; break; }
    }
    if (full) rowsFull.add(r);
  }

  for (let c = 0; c < GRID_COLS; c++) {
    let full = true;
    for (let r = 0; r < GRID_ROWS; r++) {
      if (!g[r][c]) { full = false; break; }
    }
    if (full) colsFull.add(c);
  }

  let topShift = 0;
  while (rowsFull.has(topShift)) topShift++;
  let bottomShift = 0;
  while (rowsFull.has(GRID_ROWS - 1 - bottomShift)) bottomShift++;

  let leftShift = 0;
  while (colsFull.has(leftShift)) leftShift++;
  let rightShift = 0;
  while (colsFull.has(GRID_COLS - 1 - rightShift)) rightShift++;

  return { rowsFull, colsFull, topShift, bottomShift, leftShift, rightShift };
}

export function clearOnly(g, rowsFull, colsFull) {
  return g.map((row, r) => row.map((cell, c) => (rowsFull.has(r) || colsFull.has(c)) ? null : cell));
}

export function applyClearsAndShifts(g, rowsFull, colsFull, shifts) {
  const { topShift, bottomShift, leftShift, rightShift } = shifts;
  let afterClear = clearOnly(g, rowsFull, colsFull);

  const dx = -leftShift + rightShift;
  const dy = -topShift + bottomShift;

  if (dx === 0 && dy === 0) return afterClear;

  const out = emptyGrid();
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = afterClear[r][c];
      if (!cell) continue;
      const nr = r + dy;
      const nc = c + dx;
      if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
        out[nr][nc] = cell;
      }
    }
  }
  return out;
}
