import { useEffect, useRef, useState } from "react";
import {
  GRID_COLS,
  GRID_ROWS,
  TW_GRID_COLS,
  TW_GRID_ROWS,
  GAP_PX,
  TW_GRID,
  QUEUE_SIZE,
  CLEAR_MS,
  SHIFT_MS,
  COMBO_MS,
  BURST_MS,
  FLASH_BY_COLOR,
  deriveFlashClass,
} from "../data/constants.js";
import { shapes as SHAPES } from "../data/shapes.js";
import { makeRng } from "../utility/rng.js";
import {
  applyOrientation,
  shapeSize,
  nextOrientation,
  rotate,
  mirror,
  normalize,
} from "./geometry.js";
import {
  emptyGrid,
  computeClears,
  clearOnly,
  applyClearsAndShifts,
} from "./grid.js";

import QueuePanel from "../components/QueuePanel.jsx";
import RulesPanel from "../components/RulesPanel.jsx";
import StatsPanel from "../components/StatsPanel.jsx";

function runSanityTests() {
  try {
    console.assert(typeof computeClears === 'function', 'computeClears missing');
    // Rotation/size sanity
    const line3 = [[0, 0], [1, 0], [2, 0]];
    const rot = rotate(line3, 1);
    const sz = shapeSize(rot);
    console.assert(sz.w === 1 && sz.h === 3, 'rotate/size failed');

    // Square remains square after rotation
    const sq = [[0, 0], [1, 0], [0, 1], [1, 1]];
    const sqr = rotate(sq, 3);
    const sqsz = shapeSize(sqr);
    console.assert(sqsz.w === 2 && sqsz.h === 2, 'square rotate failed');

    // Seeded RNG determinism
    const r1 = makeRng(123456), r2 = makeRng(123456);
    for (let i = 0; i < 10; i++) {
      console.assert(r1.int(1000) === r2.int(1000), 'rng int mismatch');
    }

    // Mirror invariants
    const L = [[0, 0], [0, 1], [0, 2], [1, 2]]; // asymmetric
    const Lm = mirror(L);
    console.assert(JSON.stringify(normalize(mirror(Lm))) === JSON.stringify(normalize(L)), 'double mirror should restore');

    // Orientation cycling sequence (4 rotations then toggle mirror)
    let state = { rotation: 0, isMirrored: false };
    for (let i = 0; i < 3; i++) state = nextOrientation(state.rotation, state.isMirrored); // -> rot=3,false
    state = nextOrientation(state.rotation, state.isMirrored); // wrap -> rot=0, mirror=true
    console.assert(state.rotation === 0 && state.isMirrored === true, 'orientation cycle failed to toggle mirror');

    // Clear detection & edge shift magnitudes (top & left)
    const g = emptyGrid();
    for (let c = 0; c < GRID_COLS; c++) g[0][c] = { color: '#fff' };
    for (let r = 0; r < GRID_ROWS; r++) g[r][0] = { color: '#fff' };
    const res = computeClears(g);
    console.assert(res.rowsFull.has(0) && res.colsFull.has(0), 'computeClears full lines');
    console.assert(res.topShift === 1 && res.leftShift === 1, 'edge shifts calc');

    // Clear + shift translation of an interior cell (5,5) -> (4,4)
    g[5][5] = { color: '#abc' };
    const out = applyClearsAndShifts(g, res.rowsFull, res.colsFull, res);
    console.assert(out[4][4] && !out[5][5], 'applyClearsAndShifts translation');

    // Internal clear should not cause shift
    const g2 = emptyGrid();
    for (let c = 0; c < GRID_COLS; c++) g2[6][c] = { color: '#fff' }; // middle row
    const res2 = computeClears(g2);
    console.assert(res2.topShift === 0 && res2.bottomShift === 0 && res2.leftShift === 0 && res2.rightShift === 0, 'internal clear shifted erroneously');

    // Opposite edges combine/cancel (top & bottom): net 0 dy
    const g3 = emptyGrid();
    for (let c = 0; c < GRID_COLS; c++) { g3[0][c] = { color: '#fff' }; g3[GRID_ROWS - 1][c] = { color: '#fff' }; }
    const res3 = computeClears(g3);
    const dy = -res3.topShift + res3.bottomShift;
    console.assert(dy === 0, 'opposite edges should cancel');

    // No wrap: shift left by 2 cannot produce cells in negative columns
    const g4 = emptyGrid();
    for (let c = 0; c < GRID_COLS; c++) g4[0][c] = { color: '#fff' }; // top clear -> dy = -1
    for (let r = 0; r < GRID_ROWS; r++) g4[r][0] = { color: '#fff' }; // left clear -> dx = -1
    g4[1][0] = null; // ensure a non-cleared cell near left edge to test clipping math
    g4[1][1] = { color: '#0f0' };
    const res4 = computeClears(g4);
    const out4 = applyClearsAndShifts(g4, res4.rowsFull, res4.colsFull, res4);
    console.assert(out4[0][0], 'expected cell at 0,0 and no wrap below 0');

    console.log('[EdgeShiftPuzzle] Sanity tests passed.');
  } catch (e) {
    console.error('[EdgeShiftPuzzle] Sanity tests failed:', e);
  }
}

function useStableId() {
  const idRef = useRef(1);
  return () => idRef.current++;
}

// ========================= Main Component =========================
export default function Puzzle({ sfx = {} }) {
  const allocId = useStableId();
  const gridRef = useRef(null);
  const cellRef = useRef(null);
  const boardWrapRef = useRef(null);

  // Responsive cell size based on available width
  const [cellPx, setCellPx] = useState(32);
  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;
    const update = () => {
      const rect = cellRef.current?.getBoundingClientRect();
      if (!rect) return null;

      // const cellSize = rect.width;

      // const w = el.clientWidth || 0;
      // const px = Math.max(CELL_MIN, Math.min(CELL_MAX, Math.floor(w / GRID_COLS)));
      // setCellPx(px);
      setCellPx(rect.width);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  // Seed + RNG
  const [seed, setSeed] = useState(() => Math.floor(crypto.getRandomValues(new Uint32Array(1))[0]));
  const rngRef = useRef(makeRng(seed));

  // Game state
  const [grid, setGrid] = useState(emptyGrid);
  const [queue, setQueue] = useState(() => makeInitialQueue(rngRef.current));
  const [selectedIndex, setSelectedIndex] = useState(null);

  const [stats, setStats] = useState({
    moves: 0,
    score: 0,
    totalPlacedBlocks: 0,
    linesClearedRows: 0,
    linesClearedCols: 0,
    edgeShifts: 0,
    maxCombo: 0,
  });

  // Drag/hover selection
  const [drag, setDrag] = useState(null); // { qi, blocks, color, rotation, isMirrored, w, h, over:{row,col}|null, valid }
  const [hoverOverlay, setHoverOverlay] = useState(null); // { row, col, blocks, color, valid }
  const lastCursorRef = useRef({ x: null, y: null });

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [clearAnim, setClearAnim] = useState(null); // { rowsFull:Set, colsFull:Set, grid: placedGrid }
  const [shiftAnim, setShiftAnim] = useState(null); // { dx, dy }
  const [animGrid, setAnimGrid] = useState(null);   // grid AFTER clears (before shift)
  const [shiftProgress, setShiftProgress] = useState(0); // 0 -> 1 triggers CSS transition
  // Keep base fills visible for one frame while shift overlay mounts, then fade them out
  const [hideBaseFills, setHideBaseFills] = useState(false);

  // Juice: UI popups
  const [comboPopup, setComboPopup] = useState(null); // { text, sub }
  const [scoreBursts, setScoreBursts] = useState([]); // [{id,x,y,text}]
  const burstIdRef = useRef(1);

  // Reset RNG when seed changes
  useEffect(() => {
    rngRef.current = makeRng(seed);
    setGrid(emptyGrid());
    setQueue(makeInitialQueue(rngRef.current));
    setSelectedIndex(null);
    setStats({ moves: 0, score: 0, totalPlacedBlocks: 0, linesClearedRows: 0, linesClearedCols: 0, edgeShifts: 0, maxCombo: 0 });
    setHoverOverlay(null);
    setDrag(null);
    setIsAnimating(false);
    setClearAnim(null);
    setShiftAnim(null);
    setAnimGrid(null);
    setShiftProgress(0);
    setComboPopup(null);
    setScoreBursts([]);
  }, [seed]);

  // Run dev sanity tests once on mount (logs to console)
  useEffect(() => { runSanityTests(); }, []);

  // Global keybinds: R rotate (CW), F flip, Space place (if valid), Esc cancel
  useEffect(() => {
    function onKey(e) {
      if (['r', 'R', 'f', 'F', ' ', 'Escape'].includes(e.key)) e.preventDefault();
      if (e.key === 'Escape') {
        setSelectedIndex(null); setHoverOverlay(null); setDrag(null);
        return;
      }
      if (isAnimating) return;
      if (selectedIndex == null) return;
      if (e.key === 'r' || e.key === 'R') {
        rotateSelectedCW();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleSelectedMirror();
      } else if (e.key === ' ') {
        if (hoverOverlay && hoverOverlay.valid) {
          const item = queue[selectedIndex];
          handlePlaceFromQueue(selectedIndex, hoverOverlay.col, hoverOverlay.row, hoverOverlay.blocks, item.color);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, hoverOverlay, queue, isAnimating]);

  function makeInitialQueue(rng) {
    return Array.from({ length: QUEUE_SIZE }, () => makeNextShape(rng));
  }

  function makeNextShape(rng) {
    const def = rng.choice(SHAPES);
    return {
      id: allocId(),
      key: def.key,
      name: def.name,
      color: def.color, // Tailwind class
      flash: def.flash,
      rotation: 0,
      isMirrored: false,
      blocks: def.blocks,
    };
  }

  function setOrientation(i, rotation, isMirrored) {
    setQueue(q => q.map((it, idx) => idx === i ? { ...it, rotation, isMirrored } : it));
  }

  function orientedBlocksOf(item) {
    return applyOrientation(item.blocks, item.rotation, item.isMirrored);
  }

  function placementFromCursor(clientX, clientY, blocks) {
    const cell = cellRef.current; // top-left cell (0,0)
    if (!cell) return null;

    const rect = cell.getBoundingClientRect();
    const gx = clientX - rect.left; // x from left edge of col 0
    const gy = clientY - rect.top;  // y from top edge of row 0

    const cellW = rect.width;
    const cellH = rect.height;
    const gapX = GAP_PX;
    const gapY = GAP_PX;

    const strideX = cellW + gapX;
    const strideY = cellH + gapY;

    const { w, h } = shapeSize(blocks); // in cells

    const shapeWpx = w * cellW + (w - 1) * gapX;
    const shapeHpx = h * cellH + (h - 1) * gapY;

    const col = Math.round((gx - shapeWpx / 2) / strideX);
    const row = Math.round((gy - shapeHpx / 2) / strideY);

    const valid = canPlace(grid, blocks, col, row);
    return { row, col, valid };
  }

  function refreshOverlayAfterOrientationChange(newBlocks, clientX, clientY) {
    const x = clientX ?? lastCursorRef.current.x;
    const y = clientY ?? lastCursorRef.current.y;
    if (x == null || y == null) return;
    const pos = placementFromCursor(x, y, newBlocks);
    if (!pos) return;
    if (drag && drag.qi === selectedIndex) {
      setDrag(d => d ? { ...d, blocks: newBlocks, over: { row: pos.row, col: pos.col }, valid: pos.valid } : d);
    } else if (selectedIndex != null) {
      const item = queue[selectedIndex];
      if (!item) return;
      setHoverOverlay({ row: pos.row, col: pos.col, blocks: newBlocks, color: item.color, valid: pos.valid });
    }
  }

  function rotateSelectedCW(clientX, clientY) {
    if (selectedIndex == null) return;
    const item = queue[selectedIndex];
    if (!item) return;
    const next = nextOrientation(item.rotation, item.isMirrored); // rotates CW; toggles mirror when wrapping
    const newBlocks = applyOrientation(item.blocks, next.rotation, next.isMirrored);
    setOrientation(selectedIndex, next.rotation, next.isMirrored);
    refreshOverlayAfterOrientationChange(newBlocks, clientX, clientY);
  }

  function toggleSelectedMirror(clientX, clientY) {
    if (selectedIndex == null) return;
    const item = queue[selectedIndex];
    if (!item) return;
    const nextMir = !item.isMirrored;
    const newBlocks = applyOrientation(item.blocks, item.rotation, nextMir);
    setOrientation(selectedIndex, item.rotation, nextMir);
    refreshOverlayAfterOrientationChange(newBlocks, clientX, clientY);
  }

  // Board mouse move: update drag or hover overlay with centered placement
  function onBoardPointerMove(e) {
    if (isAnimating) return; // freeze input during animations
    lastCursorRef.current = { x: e.clientX, y: e.clientY };
    if (drag) {
      const pos = placementFromCursor(e.clientX, e.clientY, drag.blocks);
      if (!pos) return;
      setDrag(d => d ? { ...d, over: { row: pos.row, col: pos.col }, valid: pos.valid } : d);
    } else if (selectedIndex != null) {
      const item = queue[selectedIndex];
      if (!item) return;
      const blocks = orientedBlocksOf(item);
      const pos = placementFromCursor(e.clientX, e.clientY, blocks);
      if (!pos) return;
      setHoverOverlay({ row: pos.row, col: pos.col, blocks, color: item.color, valid: pos.valid });
    }
  }

  function startDrag(e, qi) {
    if (isAnimating) return;
    if (e.button !== undefined && e.button !== 0) return; // left click only to start drag
    e.preventDefault();
    const item = queue[qi];
    const blocks = orientedBlocksOf(item);
    const { w, h } = shapeSize(blocks);
    setSelectedIndex(qi);
    const pos = placementFromCursor(e.clientX, e.clientY, blocks);
    setDrag({ qi, blocks, color: item.color, rotation: item.rotation, isMirrored: item.isMirrored, w, h, over: pos ? { row: pos.row, col: pos.col } : null, valid: pos ? pos.valid : false });
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragEnd);
  }

  function onDragMove(e) {
    onBoardPointerMove(e);
  }

  function onDragEnd() {
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);
    setDrag(current => {
      if (!current) return null;
      const { over, valid, qi } = current;
      if (over && valid) {
        handlePlaceFromQueue(qi, over.col, over.row, current.blocks, current.color);
      }
      return null;
    });
  }

  function addScoreBurst(x, y, text) {
    const id = burstIdRef.current++;
    const b = { id, x, y, text };
    setScoreBursts(list => [...list, b]);
    setTimeout(() => setScoreBursts(list => list.filter(it => it.id !== id)), BURST_MS + 50);
  }

  function showComboPopup(combo, edgeCount) {
    const label = combo >= 4 ? `MEGA CLEAR x${combo}!` : combo === 3 ? "TRIPLE CLEAR!" : combo === 2 ? "DOUBLE CLEAR!" : "LINE CLEAR!";
    const sub = edgeCount > 0 ? `EDGE SHIFT x${edgeCount}` : null;
    setComboPopup({ text: label, sub });
    setTimeout(() => setComboPopup(null), COMBO_MS);
  }

  function handlePlaceFromQueue(qi, col, row, orientedBlocks, color) {
    if (isAnimating) return;
    setGrid(prev => {
      const placedCells = orientedBlocks.length;
      // Place into a working copy
      let placedGrid = prev.map(r => r.slice());
      for (const [dx, dy] of orientedBlocks) {
        placedGrid[row + dy][col + dx] = { color };
      }

      // SFX: placement
      if (sfx.place) sfx.place({ cells: placedCells });

      // Evaluate clears & shifts
      const { rowsFull, colsFull, topShift, bottomShift, leftShift, rightShift } = computeClears(placedGrid);
      const combo = rowsFull.size + colsFull.size;
      const dx = -leftShift + rightShift;
      const dy = -topShift + bottomShift;
      const edgeCount = topShift + bottomShift + leftShift + rightShift;

      // Score bookkeeping (award immediately)
      const moveScore = placedCells * 1 + combo * 100 + edgeCount * 50 + (combo > 1 ? (combo - 1) * 50 : 0);
      setStats(s => ({
        moves: s.moves + 1,
        score: s.score + moveScore,
        totalPlacedBlocks: s.totalPlacedBlocks + placedCells,
        linesClearedRows: s.linesClearedRows + rowsFull.size,
        linesClearedCols: s.linesClearedCols + colsFull.size,
        edgeShifts: s.edgeShifts + edgeCount,
        maxCombo: Math.max(s.maxCombo, combo),
      }));

      // UI juice: score bursts and combo popup
      const boardW = GRID_COLS * cellPx;
      const boardH = GRID_ROWS * cellPx;
      if (combo > 0) {
        // per-row bursts
        [...rowsFull].forEach(r => addScoreBurst(boardW / 2, r * cellPx + cellPx / 2, "+100"));
        // per-col bursts
        [...colsFull].forEach(c => addScoreBurst(c * cellPx + cellPx / 2, boardH / 2, "+100"));
        // edge bonus burst (center)
        if (edgeCount > 0) addScoreBurst(boardW / 2, boardH / 2, `+${edgeCount * 50}`);
        // combo popup
        showComboPopup(combo, edgeCount);
        // SFX hook
        if (sfx.clear) sfx.clear({ rows: [...rowsFull], cols: [...colsFull] });
      }

      // Consume from queue
      setQueue(q => {
        const out = q.slice();
        out.splice(qi, 1);
        if (out.length === 0) {
          return Array.from({ length: QUEUE_SIZE }, () => makeNextShape(rngRef.current));
        }
        return out;
      });

      // Clear selection/hover immediately
      if (selectedIndex === qi) setSelectedIndex(null);
      setHoverOverlay(null);
      setDrag(null);

      // If nothing to animate, commit and bail
      if (combo === 0 && dx === 0 && dy === 0) {
        return placedGrid;
      }

      // Otherwise, drive animations
      setIsAnimating(true);

      // 1) Show clear flash/shrink where applicable (per-cell, using each cell's flash color)
      if (combo > 0) setClearAnim({ rowsFull, colsFull, grid: placedGrid });

      // Prepare intermediate states
      const afterClear = clearOnly(placedGrid, rowsFull, colsFull);
      const finalGrid = applyClearsAndShifts(placedGrid, rowsFull, colsFull, { topShift, bottomShift, leftShift, rightShift });

      // After clear animation completes...
      setTimeout(() => {
        setClearAnim(null);
        setGrid(afterClear); // keep grid visible beneath shift layer
        if (dx === 0 && dy === 0) {
          setIsAnimating(false);
          return;
        }
        // 2) Show shift by animating a translate of remaining cells
        setAnimGrid(afterClear);
        setShiftAnim({ dx, dy });
        setShiftProgress(0);
        if (sfx.shift) sfx.shift({ dx, dy });
        // kick off transition on next frame
        requestAnimationFrame(() => { setHideBaseFills(true); setShiftProgress(1); });

        // After shift animation, commit final grid and clean up
        setTimeout(() => {
          setGrid(finalGrid);
          setAnimGrid(null);
          setShiftAnim(null);
          setShiftProgress(0);
          setHideBaseFills(false);
          setIsAnimating(false);
        }, SHIFT_MS + 20);
      }, CLEAR_MS + 10);

      // Keep existing grid visible until animations decide otherwise
      return placedGrid;
    });
  }

  function canPlace(grid, blocks, col, row) {
    for (const [dx, dy] of blocks) {
      const r = row + dy, c = col + dx;
      if (r < 0 || c < 0 || r >= GRID_ROWS || c >= GRID_COLS) return false;
      if (grid[r][c]) return false;
    }
    return true;
  }

  function onGridClickFromHover() {
    if (isAnimating) return;
    if (!hoverOverlay || !hoverOverlay.valid || selectedIndex == null) return;
    const item = queue[selectedIndex];
    handlePlaceFromQueue(selectedIndex, hoverOverlay.col, hoverOverlay.row, hoverOverlay.blocks, item.color);
  }

  function newSeed() {
    const uint = new Uint32Array(1);
    crypto.getRandomValues(uint);
    setSeed(uint[0]);
  }

  function resetBoardKeepSeed() {
    setGrid(emptyGrid());
    rngRef.current = makeRng(seed);
    setQueue(makeInitialQueue(rngRef.current));
    setSelectedIndex(null);
    setStats({ moves: 0, score: 0, totalPlacedBlocks: 0, linesClearedRows: 0, linesClearedCols: 0, edgeShifts: 0, maxCombo: 0 });
    setHoverOverlay(null);
    setDrag(null);
    setIsAnimating(false);
    setClearAnim(null);
    setShiftAnim(null);
    setAnimGrid(null);
    setShiftProgress(0);
    setComboPopup(null);
    setScoreBursts([]);
  }

  // ========================= Render =========================
  const dxPx = (shiftAnim?.dx ?? 0) * cellPx;
  const dyPx = (shiftAnim?.dy ?? 0) * cellPx;
  // const stride = cellPx + GAP_PX;
  // const dxPx = dxSteps * stride;
  // const dyPx = dySteps * stride;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-4 flex flex-col gap-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Edge‑Shift Puzzle</h1>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm opacity-80">Seed</label>
          <input
            className="bg-slate-900 rounded-md px-3 py-1 text-sm border border-slate-700 w-40"
            value={seed}
            onChange={(e) => {
              const v = Number(e.target.value.replace(/[^0-9]/g, ""));
              if (!Number.isNaN(v)) setSeed(v);
            }}
          />
          <button className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm" onClick={newSeed}>New Seed</button>
          <button className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm" onClick={resetBoardKeepSeed}>Reset</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Grid / Board */}
        <div ref={boardWrapRef}>
          <div
            ref={gridRef}
            className="relative"
            onMouseLeave={() => { setHoverOverlay(null); }}
            onMouseMove={onBoardPointerMove}
            onClick={onGridClickFromHover}
            onContextMenu={(e) => {
              if (selectedIndex == null || isAnimating) return;
              e.preventDefault();
              rotateSelectedCW(e.clientX, e.clientY);
            }}
          >
            {/* Always-rendered background grid */}
            <div className={`${TW_GRID} border-4 border-slate-800`} style={{ gap: `${GAP_PX}px` }}>
              {Array.from({ length: GRID_ROWS - 1 }).map((_, r) => (
                <div key={`r-${r + 1}`} style={{ gridRow: `${r + 2}`, gridColumnStart: `1`, gridColumnEnd: "-1" }}>
                  <div className="-translate-y-1 h-1 w-full bg-slate-800 pointer-events-none" />
                </div>
              ))}

              {Array.from({ length: GRID_COLS - 1 }).map((_, c) => (
                <div key={`c-${c + 1}`} style={{ gridColumn: `${c + 2}`, gridRowStart: `1`, gridRowEnd: "-1" }}>
                  <div className="-translate-x-1 w-1 h-full bg-slate-800 pointer-events-none" />
                </div>
              ))}

              {Array.from({ length: GRID_ROWS }).map((_, r) => (
                Array.from({ length: GRID_COLS }).map((_, c) => {
                  const cell = grid[r][c];
                  return (
                    <div ref={r === 0 && c === 0 ? cellRef : undefined} key={`${r}-${c}`} className="relative" style={{ gridRow: `${r + 1}`, gridColumn: `${c + 1}` }}>
                      {cell && (
                        <div className={`absolute inset-0 ${cell.color} `} style={{ opacity: hideBaseFills ? 0 : 1, transition: 'opacity 120ms linear' }} />
                      )}
                    </div>
                  );
                })
              ))}

              {!isAnimating && hoverOverlay && (
                hoverOverlay.blocks.map(([dx, dy], i) => {
                  const invalid = !hoverOverlay.valid;

                  return (
                    <div key={`hover-${i}`}
                      className={`rounded-md ${hoverOverlay.color} ${invalid ? 'animate-pulse' : ''}`}
                      style={{
                        gridRow: `${1 + dy}`,
                        gridColumn: `${1 + dx}`,
                        transition: "transform 50ms ease",
                        transform: `translate3d(calc(${hoverOverlay.col} * (100% + ${GAP_PX}px)), calc(${hoverOverlay.row} * (100% + ${GAP_PX}px)), 0)`,
                        backgroundImage: invalid ? "repeating-linear-gradient(45deg, rgba(248,113,113,0.28), rgba(248,113,113,0.28) 6px, rgba(248,113,113,0.08) 6px, rgba(248,113,113,0.08) 12px)" : undefined,
                      }}
                    />
                  );
                })
              )}

              {clearAnim && (
                Array.from({ length: GRID_ROWS }).flatMap((_, r) =>
                  Array.from({ length: GRID_COLS }).map((_, c) => {
                    if (!clearAnim.rowsFull.has(r) && !clearAnim.colsFull.has(c)) return null;

                    const cell = clearAnim.grid[r][c];
                    const flashClass = cell
                      ? (FLASH_BY_COLOR[cell.color] || deriveFlashClass(cell.color))
                      : "bg-amber-200";

                    return (
                      <div
                        key={`clr-${r}-${c}`}
                        className="pointer-events-none relative z-[25]"
                        style={{ gridRow: r + 1, gridColumn: c + 1 }}
                      >
                        <div
                          className={`absolute inset-0 ${flashClass} rounded-sm`}
                          style={{ animation: `cellClear ${CLEAR_MS}ms ease-out forwards` }}
                        />
                      </div>
                    );
                  })
                )
              )}

              {/* Shift animation overlay: render remaining cells and translate them */}
              {animGrid && animGrid.map((row, r) =>
                row.map((cell, c) => {
                  if (!cell) return null;

                  // dxPx/dyPx should already be stride-based pixels:
                  //   strideX = cellPx + GAP_PX
                  //   strideY = cellPx + GAP_PX
                  //   dxPx = dxSteps * strideX
                  //   dyPx = dySteps * strideY

                  return (
                    <div
                      key={`move-${r}-${c}`}
                      className="pointer-events-none relative z-[30]"
                      style={{ gridRow: r + 1, gridColumn: c + 1 }}
                    >
                      <div
                        className={`absolute inset-0 rounded-sm ${cell.color}`}
                        style={{
                          // transform: `translate3d(calc(${c} * (100% + ${GAP_PX}px)), calc(${hoverOverlay.row} * (100% + ${GAP_PX}px)), 0)`,
                          transform: `translate3d(${shiftProgress ? dxPx : 0}px, ${shiftProgress ? dyPx : 0}px, 0)`,
                          transition: `transform ${SHIFT_MS}ms cubic-bezier(.2,.9,.2,1)`,
                        }}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Drag preview overlay (also centered) */}
            {!isAnimating && drag && drag.over && (
              <div className="pointer-events-none absolute inset-0" style={{ zIndex: 40 }}>
                {drag.blocks.map(([dx, dy], i) => {
                  const r = drag.over.row + dy;
                  const c = drag.over.col + dx;
                  if (r < 0 || c < 0 || r >= GRID_ROWS || c >= GRID_COLS) return null;
                  const invalid = !drag.valid;
                  return (
                    <div key={`drag-${i}`}
                      className={`absolute rounded-md ${drag.color} ${invalid ? 'animate-pulse' : ''}`}
                      style={{
                        left: c * cellPx + 2,
                        top: r * cellPx + 2,
                        width: cellPx - 4,
                        height: cellPx - 4,
                        opacity: invalid ? 0.3 : 0.6,
                        outline: invalid ? "3px dashed rgba(248,113,113,1)" : "3px solid rgba(56,189,248,0.95)",
                        boxShadow: invalid ? "0 0 0 2px rgba(248,113,113,0.8) inset, 0 0 14px rgba(248,113,113,0.5)" : "0 0 0 2px rgba(56,189,248,0.65) inset, 0 0 16px rgba(56,189,248,0.5)",
                        backgroundImage: invalid ? "repeating-linear-gradient(45deg, rgba(248,113,113,0.28), rgba(248,113,113,0.28) 6px, rgba(248,113,113,0.08) 6px, rgba(248,113,113,0.08) 12px)" : undefined,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Combo popup (center) */}
            {comboPopup && (
              <div className="pointer-events-none absolute left-1/2 top-1/2" style={{ zIndex: 50, transform: 'translate(-50%, -50%)' }}>
                <div className="text-4xl font-black tracking-wide text-white drop-shadow-[0_2px_12px_rgba(34,211,238,0.7)]" style={{ animation: `comboPop ${COMBO_MS}ms ease-out forwards` }}>{comboPopup.text}</div>
                {comboPopup.sub && <div className="text-center text-cyan-300/90 font-semibold -mt-1" style={{ animation: `comboPop ${COMBO_MS}ms ease-out forwards` }}>{comboPopup.sub}</div>}
              </div>
            )}

            {/* Score bursts */}
            {scoreBursts.length > 0 && (
              <div className="pointer-events-none absolute inset-0" style={{ zIndex: 45 }}>
                {scoreBursts.map(b => (
                  <div key={b.id} className="absolute text-amber-300 font-extrabold text-lg" style={{ left: b.x, top: b.y, transform: 'translate(-50%, -50%)', animation: `scoreRise ${BURST_MS}ms ease-out forwards`, textShadow: '0 2px 8px rgba(0,0,0,0.45)' }}>{b.text}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <StatsPanel stats={stats} />
          <QueuePanel
            queue={queue}
            onStartDrag={startDrag}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            rotateSelectedCW={rotateSelectedCW}
            toggleSelectedMirror={toggleSelectedMirror}
          />
          <RulesPanel />
        </aside>
      </div>

      <footer className="text-xs text-slate-400 opacity-80">
        Tip: Left‑click a shape to pick it up (drag), or left‑click the board to place a selected shape. Right‑click anywhere to rotate; after 4 rotations it toggles mirror and cycles the mirrored rotations. Keybinds: <span className="font-mono">R</span> rotate, <span className="font-mono">F</span> flip, <span className="font-mono">Space</span> place, <span className="font-mono">Esc</span> cancel.
      </footer>
    </div>
  );
}