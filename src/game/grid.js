import * as geometry from '/src/game/geometry.js';

export function emptyGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
}

export function computeClears(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const rowsFull = new Set();
  const colsFull = new Set();

  for (let r = 0; r < rows; r++) {
    let full = true;
    for (let c = 0; c < cols; c++) {
      // Treat only null/undefined as empty to avoid false negatives
      if (grid[r][c] == null) { full = false; break; }
    }
    if (full) rowsFull.add(r);
  }

  for (let c = 0; c < cols; c++) {
    let full = true;
    for (let r = 0; r < rows; r++) {
      if (grid[r][c] == null) { full = false; break; }
    }
    if (full) colsFull.add(c);
  }

  let topShift = 0;
  while (rowsFull.has(topShift)) topShift++;
  let bottomShift = 0;
  while (rowsFull.has(rows - 1 - bottomShift)) bottomShift++;

  let leftShift = 0;
  while (colsFull.has(leftShift)) leftShift++;
  let rightShift = 0;
  while (colsFull.has(cols - 1 - rightShift)) rightShift++;

  return { rowsFull, colsFull, topShift, bottomShift, leftShift, rightShift };
}

export function clearOnly(g, rowsFull, colsFull) {
  return g.map((row, r) => row.map((cell, c) => (rowsFull.has(r) || colsFull.has(c)) ? null : cell));
}

export function applyClearsAndShifts(grid, rowsFull, colsFull, shifts) {
  const rows = grid.length;
  const cols = grid[0].length;

  const { topShift, bottomShift, leftShift, rightShift } = shifts;
  let afterClear = clearOnly(grid, rowsFull, colsFull);

  const dx = -leftShift + rightShift;
  const dy = -topShift + bottomShift;

  if (dx === 0 && dy === 0) return afterClear;

  const out = emptyGrid(rows, cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = afterClear[r][c];
      if (!cell) continue;
      const nr = r + dy;
      const nc = c + dx;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
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

// Primitive: can a shape fit at this exact col/row?
export function canPlaceAt(grid, blocks, col, row) {
  const rows = grid.length;
  const cols = grid[0].length;

  for (const [dx, dy] of blocks) {
    const r = row + dy;
    const c = col + dx;
    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
    if (grid[r][c]) return false;
  }
  return true;
}

export function placeShape(grid, blocks, col, row, cell) {
  const out = grid.map(r => r.slice());
  for (const [dx, dy] of blocks) {
    out[row + dy][col + dx] = cell; // e.g. { color }
  }
  return out;
}

// Returns true if the shape fits anywhere on the board
export function canPlaceAnywhere(grid, blocks) {
  const rows = grid.length;
  const cols = grid[0].length;
  const { w, h } = geometry.shapeSize(blocks);

  // only scan starts that keep the shape in-bounds
  for (let r = 0; r <= rows - h; r++) {
    for (let c = 0; c <= cols - w; c++) {
      if (canPlaceAt(grid, blocks, c, r)) return true;
    }
  }
  return false;
}

// If you want actual spots (handy for difficulty metrics / previews)
export function findPlacements(grid, blocks, maxResults = Infinity) {
  const rows = grid.length;
  const cols = grid[0].length;
  const { w, h } = geometry.shapeSize(blocks);
  const out = [];

  for (let r = 0; r <= rows - h; r++) {
    for (let c = 0; c <= cols - w; c++) {
      if (canPlaceAt(grid, blocks, c, r)) {
        out.push({ col: c, row: r });
        if (out.length >= maxResults) return out;
      }
    }
  }
  return out;
}
