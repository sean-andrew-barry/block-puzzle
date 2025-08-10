import { useEffect, useRef, useState } from "react";
import {
  GRID_COLS,
  GRID_ROWS,
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
import { shapes, moreShapes } from "../data/shapes.js";
import { makeRng } from "../utility/rng.js"; // TODO: Switch to the new `@/util/rng.js`
import * as Geometry from "/src/game/geometry.js";
import * as Grid from "/src/game/grid.js";

import QueuePanel from "../components/QueuePanel.jsx";
import RulesPanel from "../components/RulesPanel.jsx";
import StatsPanel from "../components/StatsPanel.jsx";
import GridLines from "../components/GridLines.jsx";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";
import tests from "../utility/tests.js";

const SHAPES = [...shapes, ...moreShapes];

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
  const [grid, setGrid] = useState(Grid.emptyGrid);
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
  const [drag, setDragState] = useState(null); // { qi, blocks, color, rotation, isMirrored, w, h, over:{row,col}|null, valid }
  const dragRef = useRef(drag);
  const setDrag = (value) => {
    dragRef.current = typeof value === "function" ? value(dragRef.current) : value;
    setDragState(dragRef.current);
  };
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
    setGrid(Grid.emptyGrid());
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
  useEffect(() => { tests(); }, []);

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
    return Geometry.applyOrientation(item.blocks, item.rotation, item.isMirrored);
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

    const { w, h } = Geometry.shapeSize(blocks); // in cells

    const shapeWpx = w * cellW + (w - 1) * gapX;
    const shapeHpx = h * cellH + (h - 1) * gapY;

    const col = Math.round((gx - shapeWpx / 2) / strideX);
    const row = Math.round((gy - shapeHpx / 2) / strideY);

    const valid = Grid.canPlaceAt(grid, blocks, col, row);
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
    const next = Geometry.nextOrientation(item.rotation, item.isMirrored); // rotates CW; toggles mirror when wrapping
    const newBlocks = Geometry.applyOrientation(item.blocks, next.rotation, next.isMirrored);
    setOrientation(selectedIndex, next.rotation, next.isMirrored);
    refreshOverlayAfterOrientationChange(newBlocks, clientX, clientY);
  }

  function toggleSelectedMirror(clientX, clientY) {
    if (selectedIndex == null) return;
    const item = queue[selectedIndex];
    if (!item) return;
    const nextMir = !item.isMirrored;
    const newBlocks = Geometry.applyOrientation(item.blocks, item.rotation, nextMir);
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
    const { w, h } = Geometry.shapeSize(blocks);
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
    const current = dragRef.current;
    setDrag(null);
    if (current && current.over && current.valid) {
      handlePlaceFromQueue(current.qi, current.over.col, current.over.row, current.blocks, current.color);
    }
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

    const placedCells = orientedBlocks.length;
    // Place into a working copy of the current grid
    let placedGrid = grid.map(r => r.slice());
    for (const [dx, dy] of orientedBlocks) {
      placedGrid[row + dy][col + dx] = { color };
    }

    // SFX: placement
    if (sfx.place) sfx.place({ cells: placedCells });

    // Evaluate clears & shifts
    const { rowsFull, colsFull, topShift, bottomShift, leftShift, rightShift } = Grid.computeClears(placedGrid);
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
    const stride = cellPx + GAP_PX;
    const boardW = GRID_COLS * stride - GAP_PX;
    const boardH = GRID_ROWS * stride - GAP_PX;
    if (combo > 0) {
      // per-row bursts
      [...rowsFull].forEach(r => addScoreBurst(boardW / 2, r * stride + cellPx / 2, "+100"));
      // per-col bursts
      [...colsFull].forEach(c => addScoreBurst(c * stride + cellPx / 2, boardH / 2, "+100"));
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
      const { grid: resolved, rows: r, cols: c, edge: e, score: extraScore, maxCombo: m } = Grid.resolveAllClears(placedGrid);
      setGrid(resolved);
      if (r || c || e) {
        setStats(s => ({
          ...s,
          score: s.score + extraScore,
          linesClearedRows: s.linesClearedRows + r,
          linesClearedCols: s.linesClearedCols + c,
          edgeShifts: s.edgeShifts + e,
          maxCombo: Math.max(s.maxCombo, m),
        }));
      }
      return;
    }

    // Otherwise, drive animations
    setGrid(placedGrid);
    setIsAnimating(true);

    // 1) Show clear flash/shrink where applicable (per-cell, using each cell's flash color)
    if (combo > 0) setClearAnim({ rowsFull, colsFull, grid: placedGrid });

    // Prepare intermediate states
    const afterClear = Grid.clearOnly(placedGrid, rowsFull, colsFull);
    const finalGrid = Grid.applyClearsAndShifts(placedGrid, rowsFull, colsFull, { topShift, bottomShift, leftShift, rightShift });

    // After clear animation completes...
    setTimeout(() => {
      setClearAnim(null);
      setGrid(afterClear); // keep grid visible beneath shift layer
      if (dx === 0 && dy === 0) {
        const { grid: resolved, rows: r, cols: c, edge: e, score: extraScore, maxCombo: m } = Grid.resolveAllClears(afterClear);
        setGrid(resolved);
        if (r || c || e) {
          setStats(s => ({
            ...s,
            score: s.score + extraScore,
            linesClearedRows: s.linesClearedRows + r,
            linesClearedCols: s.linesClearedCols + c,
            edgeShifts: s.edgeShifts + e,
            maxCombo: Math.max(s.maxCombo, m),
          }));
        }
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
        const { grid: resolved, rows: r, cols: c, edge: e, score: extraScore, maxCombo: m } = Grid.resolveAllClears(finalGrid);
        setGrid(resolved);
        if (r || c || e) {
          setStats(s => ({
            ...s,
            score: s.score + extraScore,
            linesClearedRows: s.linesClearedRows + r,
            linesClearedCols: s.linesClearedCols + c,
            edgeShifts: s.edgeShifts + e,
            maxCombo: Math.max(s.maxCombo, m),
          }));
        }
        setAnimGrid(null);
        setShiftAnim(null);
        setShiftProgress(0);
        setHideBaseFills(false);
        setIsAnimating(false);
      }, SHIFT_MS + 20);
    }, CLEAR_MS + 10);
  }

  function onGridPointerDown(e) {
    if (isAnimating) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (!hoverOverlay || !hoverOverlay.valid || selectedIndex == null) return;
    const item = queue[selectedIndex];
    handlePlaceFromQueue(selectedIndex, hoverOverlay.col, hoverOverlay.row, hoverOverlay.blocks, item.color);
    e.preventDefault();
  }

  function newSeed() {
    const uint = new Uint32Array(1);
    crypto.getRandomValues(uint);
    setSeed(uint[0]);
  }

  function resetBoardKeepSeed() {
    setGrid(Grid.emptyGrid());
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
  const stride = cellPx + GAP_PX;
  const shiftXPx = (shiftAnim?.dx ?? 0) * stride;
  const shiftYPx = (shiftAnim?.dy ?? 0) * stride;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-slate-900/50 to-slate-800/30 backdrop-blur-sm border-b border-slate-700/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
        <div className="relative px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                Edge‑Shift Puzzle
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span>Score: <span className="font-mono text-slate-200">{stats.score.toLocaleString()}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span>Moves: <span className="font-mono text-slate-200">{stats.moves}</span></span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/50">
                <label className="text-xs text-slate-400 font-medium">Seed</label>
                <input
                  className="bg-slate-900/80 rounded-md px-2 py-1 text-xs border border-slate-600 w-24 font-mono text-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
                  value={seed}
                  onChange={(e) => {
                    const v = Number(e.target.value.replace(/[^0-9]/g, ""));
                    if (!Number.isNaN(v)) setSeed(v);
                  }}
                />
              </div>
              <button
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border border-blue-500/50 text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
                onClick={newSeed}
              >
                New Seed
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-slate-700/80 hover:bg-slate-600/80 border border-slate-600/50 text-sm font-medium transition-all duration-200"
                onClick={resetBoardKeepSeed}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 min-h-0">
        <div className="max-w-7xl mx-auto">
          <div className="h-full flex flex-col xl:flex-row xl:items-center gap-4 lg:gap-6">
            {/* Left: Game Board + Queue */}
            <div className="flex-1 flex flex-col min-h-0 gap-4 lg:gap-6">
              {/* Game Board */}
              <div ref={boardWrapRef} className="flex-1 flex items-center justify-center min-h-0">
                <div
                  ref={gridRef}
                  className="relative"
                  onMouseLeave={() => { setHoverOverlay(null); }}
                  onMouseMove={onBoardPointerMove}
                  onPointerDown={onGridPointerDown}
                  onContextMenu={(e) => {
                    if (selectedIndex == null || isAnimating) return;
                    e.preventDefault();
                    rotateSelectedCW(e.clientX, e.clientY);
                  }}
                >
                  <div className={`${TW_GRID} rounded-xl overflow-hidden bg-slate-900/40 backdrop-blur-sm border border-slate-700/30 shadow-2xl h-[min(85vh,85vw)] w-[min(85vh,85vw)] xl:h-[min(80vh,60vw)] xl:w-[min(80vh,60vw)]`} style={{ gap: `${GAP_PX}px` }}>
                    <GridLines columns={false} />
                    <GridLines columns={true} />

                    {Array.from({ length: GRID_ROWS }).map((_, r) => (
                      Array.from({ length: GRID_COLS }).map((_, c) => {
                        const cell = grid[r][c];
                        return (
                          <div ref={r === 0 && c === 0 ? cellRef : undefined} key={`${r}-${c}`} className="relative" style={{ gridRow: `${r + 1}`, gridColumn: `${c + 1}` }}>
                            {cell && (
                              <div className={`absolute inset-0 ${cell.color} rounded-sm shadow-sm`} style={{ opacity: hideBaseFills ? 0 : 1, transition: 'opacity 120ms linear' }} />
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
                              opacity: invalid ? 0.4 : 0.7,
                              boxShadow: invalid ? "0 0 0 2px rgba(248,113,113,0.8) inset" : "0 0 0 2px rgba(56,189,248,0.6) inset, 0 0 8px rgba(56,189,248,0.3)",
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
                              className="pointer-events-none relative z-[25] rounded-sm"
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

                        return (
                          <div
                            key={`move-${r}-${c}`}
                            className="pointer-events-none relative z-[30]"
                            style={{ gridRow: r + 1, gridColumn: c + 1 }}
                          >
                            <div
                              className={`absolute inset-0 rounded-sm ${cell.color}`}
                              style={{
                                transform: `translate3d(${shiftProgress ? shiftXPx : 0}px, ${shiftProgress ? shiftYPx : 0}px, 0)`,
                                transition: `transform ${SHIFT_MS}ms cubic-bezier(.2,.9,.2,1)`,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
                              left: c * stride + 2,
                              top: r * stride + 2,
                              width: cellPx - 4,
                              height: cellPx - 4,
                              opacity: invalid ? 0.4 : 0.8,
                              outline: invalid ? "2px dashed rgba(248,113,113,1)" : "2px solid rgba(56,189,248,0.95)",
                              boxShadow: invalid ? "0 0 0 1px rgba(248,113,113,0.8) inset, 0 0 12px rgba(248,113,113,0.4)" : "0 0 0 1px rgba(56,189,248,0.65) inset, 0 0 12px rgba(56,189,248,0.4)",
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
                      <div className="text-5xl font-black tracking-wide bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(34,211,238,0.8)]" style={{ animation: `comboPop ${COMBO_MS}ms ease-out forwards` }}>{comboPopup.text}</div>
                      {comboPopup.sub && <div className="text-center text-cyan-300/90 font-bold text-lg -mt-2" style={{ animation: `comboPop ${COMBO_MS}ms ease-out forwards` }}>{comboPopup.sub}</div>}
                    </div>
                  )}

                  {/* Score bursts */}
                  {scoreBursts.length > 0 && (
                    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 45 }}>
                      {scoreBursts.map(b => (
                        <div key={b.id} className="absolute text-amber-400 font-black text-xl" style={{ left: b.x, top: b.y, transform: 'translate(-50%, -50%)', animation: `scoreRise ${BURST_MS}ms ease-out forwards`, textShadow: '0 3px 12px rgba(0,0,0,0.6)' }}>{b.text}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Queue Panel - Below board on mobile, beside on desktop */}
              <div className="xl:hidden flex-shrink-0">
                <QueuePanel
                  queue={queue}
                  onStartDrag={startDrag}
                  selectedIndex={selectedIndex}
                  setSelectedIndex={setSelectedIndex}
                  rotateSelectedCW={rotateSelectedCW}
                  toggleSelectedMirror={toggleSelectedMirror}
                />
              </div>
            </div>

            {/* Right: Queue Panel (desktop only) */}
            <div className="hidden xl:block flex-shrink-0 w-80">
              <QueuePanel
                queue={queue}
                onStartDrag={startDrag}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                rotateSelectedCW={rotateSelectedCW}
                toggleSelectedMirror={toggleSelectedMirror}
              />
            </div>
          </div>

          {/* Collapsible Stats & Rules */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <details className="group">
              <summary className="cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-200">Game Statistics</h3>
                  <div className="text-slate-400 group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </summary>
              <div className="mt-2 bg-slate-900/30 rounded-lg p-4 border border-slate-700/30">
                <StatsPanel stats={stats} />
              </div>
            </details>

            <details className="group">
              <summary className="cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-200">How to Play</h3>
                  <div className="text-slate-400 group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </summary>
              <div className="mt-2 bg-slate-900/30 rounded-lg p-4 border border-slate-700/30">
                <RulesPanel />
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}