import { GRID_ROWS, GRID_COLS } from '../data/constants.js';

export function emptyGrid() {
  return Array.from({ length: GRID_ROWS }, () => Array.from({ length: GRID_COLS }, () => null));
}

export function computeClears(g) {
  const rowsFull = new Set();
  const colsFull = new Set();

  for (let r = 0; r < GRID_ROWS; r++) {
    let full = true;
    for (let c = 0; c < GRID_COLS; c++) {
      // Treat only null/undefined as empty to avoid false negatives
      if (g[r][c] == null) { full = false; break; }
    }
    if (full) rowsFull.add(r);
  }

  for (let c = 0; c < GRID_COLS; c++) {
    let full = true;
    for (let r = 0; r < GRID_ROWS; r++) {
      if (g[r][c] == null) { full = false; break; }
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

// Repeatedly apply clears and edge shifts until the grid is stable.
// Returns the resulting grid along with aggregate stats of the extra clears.
export function resolveAllClears(g) {
  let grid = g;
  let rows = 0, cols = 0, edge = 0, score = 0, maxCombo = 0;
  while (true) {
    const { rowsFull, colsFull, topShift, bottomShift, leftShift, rightShift } = computeClears(grid);
    const combo = rowsFull.size + colsFull.size;
    const edgeCount = topShift + bottomShift + leftShift + rightShift;
    if (combo === 0 && edgeCount === 0) break;

    // bookkeeping for caller
    rows += rowsFull.size;
    cols += colsFull.size;
    edge += edgeCount;
    const moveScore = combo * 100 + edgeCount * 50 + (combo > 1 ? (combo - 1) * 50 : 0);
    score += moveScore;
    maxCombo = Math.max(maxCombo, combo);

    grid = applyClearsAndShifts(grid, rowsFull, colsFull, {
      topShift,
      bottomShift,
      leftShift,
      rightShift,
    });
  }

  return { grid, rows, cols, edge, score, maxCombo };
}
