import { useCallback, useMemo, useReducer, useRef } from "react";
import * as Grid from "/src/game/grid.js";
import * as Geometry from "/src/game/geometry.js";
import * as RNG from "/src/utils/rng.js"; // immutable API you chose
import { QUEUE_SIZE, CLEAR_MS, SHIFT_MS } from "/src/data/constants.js";
import { shapes as SHAPES } from "/src/data/shapes.js";

// ---------- actions ----------
const ACT = {
  HOVER: "HOVER",
  GRID_SET: "GRID_SET",
  QUEUE_SET: "QUEUE_SET",
  SELECT: "SELECT",
  PLACE: "PLACE",

  CLEAR_START: "CLEAR_START",
  CLEAR_DONE: "CLEAR_DONE",
  SHIFT_START: "SHIFT_START",
  SHIFT_END: "SHIFT_END",

  STATS_SET: "STATS_SET",
  HIDE_BASE: "HIDE_BASE",
  SHIFT_PROGRESS: "SHIFT_PROGRESS",
};

function initState({ rows, cols }) {
  return {
    grid: Grid.emptyGrid(rows, cols),
    queue: [],            // array of shape items
    selectedIndex: 0,     // which queue slot is active
    hover: null,          // {row, col, blocks, valid}

    // animations
    isAnimating: false,
    clearAnim: null,      // { rowsFull, colsFull, grid }
    shiftAnim: null,      // { dx, dy }
    animGrid: null,
    shiftProgress: 0,
    hideBaseFills: false,

    stats: { moves: 0, score: 0, totalPlacedBlocks: 0, linesClearedRows: 0, linesClearedCols: 0, edgeShifts: 0, maxCombo: 0 },
  };
}

function reducer(s, a) {
  switch (a.type) {
    case ACT.HOVER:
      return { ...s, hover: a.hover };
    case ACT.GRID_SET:
      return { ...s, grid: a.grid };
    case ACT.QUEUE_SET:
      return { ...s, queue: a.queue, selectedIndex: a.selectedIndex ?? s.selectedIndex };
    case ACT.SELECT:
      return { ...s, selectedIndex: a.index };
    case ACT.PLACE:
      return { ...s, grid: a.gridAfterPlace };
    case ACT.CLEAR_START:
      return { ...s, clearAnim: a.payload, isAnimating: true };
    case ACT.CLEAR_DONE:
      return { ...s, clearAnim: null, isAnimating: false, hideBaseFills: false };
    case ACT.SHIFT_START:
      return { ...s, shiftAnim: a.payload, animGrid: a.animGrid, isAnimating: true, hideBaseFills: true };
    case ACT.SHIFT_END:
      return { ...s, shiftAnim: null, animGrid: null, isAnimating: false, hideBaseFills: false, shiftProgress: 0 };
    case ACT.STATS_SET:
      return { ...s, stats: a.stats };
    case ACT.HIDE_BASE:
      return { ...s, hideBaseFills: a.value };
    case ACT.SHIFT_PROGRESS:
      return { ...s, shiftProgress: a.value };
    default:
      return s;
  }
}

// ---------- helpers (pure) ----------
function makeItemFromDef(def) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    key: def.key,
    name: def.name,
    color: def.color,
    flash: def.flash,
    rotation: 0,
    isMirrored: false, // horizontal mirror
    isVertMirrored: false, // vertical mirror
    blocks: def.blocks,
  };
}

// compute top-left col/row for the shape center aligning under (gx, gy)
function placementFromPoint(gx, gy, blocks, cellW, cellH, gapPx) {
  const { w, h } = Geometry.shapeSize(blocks); // in cells
  const strideX = cellW + gapPx;
  const strideY = cellH + gapPx;

  const shapeWpx = w * cellW + (w - 1) * gapPx;
  const shapeHpx = h * cellH + (h - 1) * gapPx;

  const col = Math.round((gx - shapeWpx / 2) / strideX);
  const row = Math.round((gy - shapeHpx / 2) / strideY);
  return { row, col };
}

const awardStats = (prev, { placedCells, rowsFull, colsFull, edgeCount, combo }) => {
  const moveScore = placedCells * 1 + combo * 100 + edgeCount * 50 + (combo > 1 ? (combo - 1) * 50 : 0);
  return {
    moves: prev.moves + 1,
    score: prev.score + moveScore,
    totalPlacedBlocks: prev.totalPlacedBlocks + placedCells,
    linesClearedRows: prev.linesClearedRows + rowsFull.size,
    linesClearedCols: prev.linesClearedCols + colsFull.size,
    edgeShifts: prev.edgeShifts + edgeCount,
    maxCombo: Math.max(prev.maxCombo, combo),
  };
};

// ---------- hook (controller) ----------
export default function useBoard({ rows, cols, gapPx, seed = 1234 }) {
  const seedRef = useRef(seed);
  const [state, dispatch] = useReducer(reducer, { rows, cols }, initState);

  const cellSizeRef = useRef({ w: 0, h: 0 });
  const setCellSize = useCallback((w, h) => {
    if (w && h) cellSizeRef.current = { w, h };
  }, []);
  // use cellSizeRef.current.w / .h anywhere you need cell size
  // expose stride too:
  const strideX = cellSizeRef.current.w + gapPx;
  const strideY = cellSizeRef.current.h + gapPx;

  // immutable RNG state
  const rngStateRef = useRef(seed >>> 0);

  const rngFloat = useCallback(() => {
    const { state: s, value } = RNG.nextFloat(rngStateRef.current);
    rngStateRef.current = s;
    return value;
  }, []);
  const rngInt = useCallback((max) => {
    const { state: s, value } = RNG.nextInt(rngStateRef.current, max);
    rngStateRef.current = s;
    return value;
  }, []);
  const rngChoice = useCallback((arr) => {
    const { state: s, value } = RNG.choice(rngStateRef.current, arr);
    rngStateRef.current = s;
    return value;
  }, []);

  // queue management
  const makeNextShape = useCallback(() => {
    const def = rngChoice(SHAPES);
    return makeItemFromDef(def);
  }, [rngChoice]);

  const ensureQueue = useCallback(() => {
    // Only (re)fill when the queue is empty; do nothing if it has any items
    if (state.queue.length !== 0) return;
    const q = Array.from({ length: QUEUE_SIZE }, () => makeNextShape());
    dispatch({ type: ACT.QUEUE_SET, queue: q, selectedIndex: 0 });
  }, [state.queue, makeNextShape]);

  // reset helpers
  const hardReset = useCallback(() => {
    dispatch({ type: ACT.GRID_SET, grid: Grid.emptyGrid(rows, cols) });
    rngStateRef.current = seedRef.current;
    // re-init queue, stats, clear hover/anim state, etc.
    const q = Array.from({ length: QUEUE_SIZE }, () => makeNextShape());
    dispatch({ type: ACT.QUEUE_SET, queue: q, selectedIndex: 0 });
    // …reset any stats you track…
  }, [rows, cols, makeNextShape]);

  const newSeed = useCallback(() => {
    const u32 = new Uint32Array(1);
    crypto.getRandomValues(u32);
    seedRef.current = u32[0] || 1;
    hardReset();
  }, [hardReset]);

  const resetBoardKeepSeed = useCallback(() => {
    hardReset();
  }, [hardReset]);

  // public: call when the board mounts (or whenever you want to reseed)
  const initQueue = useCallback(() => {
    const q = Array.from({ length: QUEUE_SIZE }, () => makeNextShape());
    dispatch({ type: ACT.QUEUE_SET, queue: q, selectedIndex: 0 });
  }, [makeNextShape]);

  // selection
  const select = useCallback((index) => {
    dispatch({ type: ACT.SELECT, index });
  }, []);

  // hover updates from Board: Board computes (gx, gy) using its gridRef
  const updateHoverFromPoint = useCallback((gx, gy) => {
    const item = state.queue[state.selectedIndex];
    if (!item) {
      dispatch({ type: ACT.HOVER, hover: null });
      return;
    }
    if (!cellSizeRef.current?.w || !cellSizeRef.current?.h) return;

    // Guard against invalid gx/gy
    if (typeof gx !== "number" || typeof gy !== "number" || isNaN(gx) || isNaN(gy)) {
      dispatch({ type: ACT.HOVER, hover: null });
      return;
    }

    const oriented = Geometry.applyOrientation(item.blocks, item.rotation, item.isMirrored, item.isVertMirrored);
    const { row, col } = placementFromPoint(gx, gy, oriented, cellSizeRef.current.w, cellSizeRef.current.h, gapPx);

    // Guard against NaN col/row
    if (typeof col !== "number" || typeof row !== "number" || isNaN(col) || isNaN(row)) {
      dispatch({ type: ACT.HOVER, hover: null });
      return;
    }

    const valid = Grid.canPlaceAt(state.grid, oriented, col, row);
    dispatch({ type: ACT.HOVER, hover: { row, col, blocks: oriented, color: item.color, valid } });
  }, [state.queue, state.selectedIndex, state.grid, gapPx]);

  const clearHover = useCallback(() => {
    dispatch({ type: ACT.HOVER, hover: null });
  }, []);

  // Recompute hover using a provided queue item (avoids stale state during rotate/mirror updates)
  const recomputeHoverFromPoint = useCallback((gx, gy, item) => {
    if (!item) { dispatch({ type: ACT.HOVER, hover: null }); return; }
    if (!cellSizeRef.current?.w || !cellSizeRef.current?.h) return;
    if (typeof gx !== "number" || typeof gy !== "number" || isNaN(gx) || isNaN(gy)) return;
    const oriented = Geometry.applyOrientation(item.blocks, item.rotation, item.isMirrored, item.isVertMirrored);
    const { row, col } = placementFromPoint(gx, gy, oriented, cellSizeRef.current.w, cellSizeRef.current.h, gapPx);
    if (typeof col !== "number" || typeof row !== "number" || isNaN(col) || isNaN(row)) return;
    const valid = Grid.canPlaceAt(state.grid, oriented, col, row);
    dispatch({ type: ACT.HOVER, hover: { row, col, blocks: oriented, color: item.color, valid } });
  }, [state.grid, gapPx]);

  // Recompute hover at the existing hover cell with a provided item
  const recomputeHoverAtCell = useCallback((row, col, item) => {
    if (!item) return;
    const oriented = Geometry.applyOrientation(item.blocks, item.rotation, item.isMirrored, item.isVertMirrored);
    const valid = Grid.canPlaceAt(state.grid, oriented, col, row);
    dispatch({ type: ACT.HOVER, hover: { row, col, blocks: oriented, color: item.color, valid } });
  }, [state.grid]);

  // rotate / mirror selected (recompute hover using last known gx/gy if you store it in Board and pass back in)
  const rotateSelectedCW = useCallback((gx, gy) => {
    const idx = state.selectedIndex;
    const q = state.queue.slice();
    if (!q[idx]) return;
    q[idx] = { ...q[idx], rotation: (q[idx].rotation + 1) & 3 };
    dispatch({ type: ACT.QUEUE_SET, queue: q });
    const itemNow = q[idx];
    if (gx != null && gy != null) {
      recomputeHoverFromPoint(gx, gy, itemNow);
    } else if (state.hover) {
      recomputeHoverAtCell(state.hover.row, state.hover.col, itemNow);
    }
  }, [state.selectedIndex, state.queue, state.hover, recomputeHoverFromPoint, recomputeHoverAtCell]);

  const toggleSelectedMirror = useCallback((gx, gy) => {
    const idx = state.selectedIndex;
    const q = state.queue.slice();
    if (!q[idx]) return;
    q[idx] = { ...q[idx], isMirrored: !q[idx].isMirrored };
    dispatch({ type: ACT.QUEUE_SET, queue: q });
    const itemNow = q[idx];
    if (gx != null && gy != null) {
      recomputeHoverFromPoint(gx, gy, itemNow);
    } else if (state.hover) {
      recomputeHoverAtCell(state.hover.row, state.hover.col, itemNow);
    }
  }, [state.selectedIndex, state.queue, state.hover, recomputeHoverFromPoint, recomputeHoverAtCell]);

  // vertical mirror toggle
  const toggleSelectedVerticalMirror = useCallback((gx, gy) => {
    const idx = state.selectedIndex;
    const q = state.queue.slice();
    if (!q[idx]) return;
    q[idx] = { ...q[idx], isVertMirrored: !q[idx].isVertMirrored };
    dispatch({ type: ACT.QUEUE_SET, queue: q });
    const itemNow = q[idx];
    if (gx != null && gy != null) {
      recomputeHoverFromPoint(gx, gy, itemNow);
    } else if (state.hover) {
      recomputeHoverAtCell(state.hover.row, state.hover.col, itemNow);
    }
  }, [state.selectedIndex, state.queue, state.hover, recomputeHoverFromPoint, recomputeHoverAtCell]);

  // placement + animation pipeline
  const placeHover = useCallback(() => {
    const h = state.hover;
    const item = state.queue[state.selectedIndex];
    if (!h || !item || !h.valid || state.isAnimating) return false;

    const oriented = Geometry.applyOrientation(item.blocks, item.rotation, item.isMirrored, item.isVertMirrored);
    // Revalidate placement using the current item orientation to avoid desync/overwrite
    const stillValid = Grid.canPlaceAt(state.grid, oriented, h.col, h.row);
    if (!stillValid) {
      // Update hover to reflect invalid state and abort
      dispatch({ type: ACT.HOVER, hover: { ...h, blocks: oriented, valid: false } });
      return false;
    }

    // 1) Place into a working grid
    const placedGrid = Grid.placeShape(state.grid, oriented, h.col, h.row, { color: item.color });

    // 2) Compute clears & shifts
    const { rowsFull, colsFull, topShift, bottomShift, leftShift, rightShift } = Grid.computeClears(placedGrid);
    const combo = rowsFull.size + colsFull.size;
    const dx = -leftShift + rightShift;
    const dy = -topShift + bottomShift;
    const edgeCount = topShift + bottomShift + leftShift + rightShift;

    // 3) Award base stats immediately
    const placedCells = oriented.length;
    const newStats = awardStats(state.stats, { placedCells, rowsFull, colsFull, edgeCount, combo });
    dispatch({ type: ACT.STATS_SET, stats: newStats });

    // (optional) SFX & UI bursts/hooks here:
    // sfx?.place({ cells: placedCells }); etc.
    // You can expose and call board.addScoreBurst? showComboPopup? from the controller if you want.

    // 4) Consume from queue (fill back up)
    const q = state.queue.slice();
    q.splice(state.selectedIndex, 1);
    // Only refill when the queue becomes empty
    let nextSelected = Math.min(state.selectedIndex, q.length - 1);
    if (q.length === 0) {
      for (let i = 0; i < QUEUE_SIZE; i++) q.push(makeNextShape());
      nextSelected = 0; // reset selection when a fresh batch appears
    }
    dispatch({ type: ACT.QUEUE_SET, queue: q, selectedIndex: nextSelected });

    // Clear selection/hover right away (Board will recompute hover on next move)
    dispatch({ type: ACT.HOVER, hover: null });

    // 5) If nothing to animate, resolve and bail
    if (combo === 0 && dx === 0 && dy === 0) {
      const { grid: resolved, rows: r, cols: c, edge: e, score: extraScore, maxCombo: m } = Grid.resolveAllClears(placedGrid);
      dispatch({ type: ACT.GRID_SET, grid: resolved });
      if (r || c || e) {
        dispatch({
          type: ACT.STATS_SET,
          stats: {
            ...newStats,
            score: newStats.score + extraScore,
            linesClearedRows: newStats.linesClearedRows + r,
            linesClearedCols: newStats.linesClearedCols + c,
            edgeShifts: newStats.edgeShifts + e,
            maxCombo: Math.max(newStats.maxCombo, m),
          },
        });
      }
      return true;
    }

    // 6) Kick off animations
    // Show placed grid
    dispatch({ type: ACT.GRID_SET, grid: placedGrid });
    // Clear flash
    if (combo > 0) {
      dispatch({ type: ACT.CLEAR_START, payload: { rowsFull, colsFull, grid: placedGrid } });
    }

    // Prepare intermediate grids
    const afterClear = Grid.clearOnly(placedGrid, rowsFull, colsFull);
    const finalGrid = Grid.applyClearsAndShifts(placedGrid, rowsFull, colsFull, {
      topShift, bottomShift, leftShift, rightShift
    });

    // After clear anim
    setTimeout(() => {
      dispatch({ type: ACT.CLEAR_DONE });
      dispatch({ type: ACT.GRID_SET, grid: afterClear });

      if (dx === 0 && dy === 0) {
        // nothing to shift; resolve immediately
        const { grid: resolved, rows: r, cols: c, edge: e, score: extraScore, maxCombo: m } = Grid.resolveAllClears(afterClear);
        dispatch({ type: ACT.GRID_SET, grid: resolved });
        if (r || c || e) {
          dispatch({
            type: ACT.STATS_SET,
            stats: {
              ...newStats,
              score: newStats.score + extraScore,
              linesClearedRows: newStats.linesClearedRows + r,
              linesClearedCols: newStats.linesClearedCols + c,
              edgeShifts: newStats.edgeShifts + e,
              maxCombo: Math.max(newStats.maxCombo, m),
            },
          });
        }
        return;
      }

      // Shift phase
      dispatch({ type: ACT.SHIFT_START, payload: { dx, dy }, animGrid: afterClear });
      // Kick transition on next frame
      requestAnimationFrame(() => {
        dispatch({ type: ACT.HIDE_BASE, value: true });
        dispatch({ type: ACT.SHIFT_PROGRESS, value: 1 });
      });

      setTimeout(() => {
        const { grid: resolved, rows: r, cols: c, edge: e, score: extraScore, maxCombo: m } = Grid.resolveAllClears(finalGrid);
        dispatch({ type: ACT.GRID_SET, grid: resolved });
        dispatch({ type: ACT.SHIFT_END });

        if (r || c || e) {
          dispatch({
            type: ACT.STATS_SET,
            stats: {
              ...newStats,
              score: newStats.score + extraScore,
              linesClearedRows: newStats.linesClearedRows + r,
              linesClearedCols: newStats.linesClearedCols + c,
              edgeShifts: newStats.edgeShifts + e,
              maxCombo: Math.max(newStats.maxCombo, m),
            },
          });
        }
        dispatch({ type: ACT.HIDE_BASE, value: false });
        dispatch({ type: ACT.SHIFT_PROGRESS, value: 0 });
      }, SHIFT_MS + 20);
    }, CLEAR_MS + 10);

    return true;
  }, [state.hover, state.queue, state.selectedIndex, state.grid, state.stats, state.isAnimating, makeNextShape]);

  return useMemo(() => ({
    // state
    grid: state.grid,
    queue: state.queue,
    selectedIndex: state.selectedIndex,
    hover: state.hover,
    isAnimating: state.isAnimating,
    clearAnim: state.clearAnim,
    shiftAnim: state.shiftAnim,
    animGrid: state.animGrid,
    shiftProgress: state.shiftProgress,
    hideBaseFills: state.hideBaseFills,
    stats: state.stats,

    // config/derived
    rows, cols, gapPx, strideX, strideY,

    // methods
    rngFloat,
    rngInt,
    setCellSize,
    newSeed,
    resetBoardKeepSeed,
    initQueue,
    ensureQueue,
    select,
    updateHoverFromPoint,
    clearHover,
    rotateSelectedCW,
    toggleSelectedMirror,
    placeHover,
    toggleSelectedVerticalMirror,

    // (later) animation pipeline entry points:
    // startClear(...), startShift(...), etc., wired to CLEAR_MS/SHIFT_MS timers
  }), [
    state, rows, cols, gapPx,
    initQueue, ensureQueue, select, updateHoverFromPoint, clearHover,
    rotateSelectedCW, toggleSelectedMirror, toggleSelectedVerticalMirror, placeHover,
    strideX, strideY, newSeed, resetBoardKeepSeed, setCellSize, rngFloat, rngInt
  ]);
}
