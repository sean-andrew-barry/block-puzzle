import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useBoardContext } from "./useBoardContext";
import Lines from "./Lines";
import HoverOverlay from "./HoverOverlay";
// import HoverOverlay from "/src/components/HoverOverlay";
import ClearOverlay from "./ClearOverlay";
import ShiftOverlay from "./ShiftOverlay";
import { COMBO_MS, BURST_MS } from "/src/data/constants.js";

export default function Board() {
  const board = useBoardContext();
  const { rows, cols, gapPx } = board;
  const gridRef = useRef(null);
  const cellRef = useRef(null);
  // Store last pointer position and overGrid status for hover updates
  const lastPointerRef = useRef({ gx: null, gy: null, overGrid: false });

  useLayoutEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;
    const update = () => {
      const cell = cellRef.current;
      if (!cell) return;
      const w = cell.clientWidth;
      const h = cell.clientHeight;
      if (w && h) {
        board.setCellSize(w, h); // report to controller
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(gridEl);
    window.addEventListener("resize", update);
    // // Try to focus the grid when it mounts so onKeyDown works immediately
    // gridEl.focus?.();
    return () => { ro.disconnect(); window.removeEventListener("resize", update); };
  }, [board]);

  const gridStyle = useMemo(() => ({
    "--gap": `${gapPx}px`,
    gap: "var(--gap)",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
  }), [rows, cols, gapPx]);

  const toLocal = (e) => {
    const rect = gridRef.current.getBoundingClientRect();
    const gx = e.clientX - rect.left;
    const gy = e.clientY - rect.top;
    const overGrid = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    return { gx, gy, overGrid, rect };
  };

  // Global key listener as a fallback so rotation works even if focus is elsewhere
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === " ") e.preventDefault();
      const { gx, gy } = lastPointerRef.current;
      if (e.key === "r") board.rotateSelectedCW(gx, gy);
      if (e.key === "f") board.toggleSelectedMirror(gx, gy);
      if (e.key === "v") board.toggleSelectedVerticalMirror(gx, gy);
      if (e.key === " ") board.placeHover();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board]);

  // Global mouse move listener
  useEffect(() => {
    const onMouseMove = (e) => {
      const { gx, gy, overGrid, rect } = toLocal(e);
      lastPointerRef.current = { gx, gy, overGrid };
      board.updatePointer(gx, gy, overGrid, rect);
      board.updateHoverFromPoint(gx, gy);
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [board]);

  return (
    <div
      ref={gridRef}
      className="relative grid aspect-square max-w-[90vmin] mx-auto rounded-xl bg-slate-900/40 backdrop-blur-sm border-2 border-slate-700/30 shadow-2xl h-[min(85vh,85vw)] w-[min(85vh,85vw)] xl:h-[min(80vh,60vw)] xl:w-[min(80vh,60vw)]"
      style={gridStyle}
      // onPointerMove={(e) => {
      //   const { gx, gy, overGrid } = toLocal(e);
      //   lastPointerRef.current = { gx, gy, overGrid };
      //   board.updatePointer(gx, gy, overGrid);
      //   if (overGrid) board.updateHoverFromPoint(gx, gy);
      //   else board.clearHover();
      // }}
      onPointerEnter={(e) => {
        const { rect } = toLocal(e);
        board.updatePointer(board.gx, board.gy, true, rect);
      }}
      onPointerLeave={(e) => {
        const { rect } = toLocal(e);
        board.updatePointer(board.gx, board.gy, false, rect);
      }}
      onPointerDown={(e) => {
        const { gx, gy, overGrid, rect } = toLocal(e);
        lastPointerRef.current = { gx, gy, overGrid };
        board.updatePointer(gx, gy, overGrid, rect);
        // Ensure grid keeps focus for keyboard controls
        gridRef.current?.focus?.();
        if (e.button === 0) {
          board.placeHover();
        } else if (e.button === 2) {
          board.rotateSelectedCW(gx, gy);
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Lines grid={board.grid} />

      {board.grid.map((row, r) => (
        row.map((cell, c) => (
          <div ref={r === 0 && c === 0 ? cellRef : undefined} key={`${r}-${c}`} className="relative" style={{ gridRow: `${r + 1}`, gridColumn: `${c + 1}` }}>
            {cell && (
              <div className={`absolute inset-0 ${cell.color} rounded-sm shadow-sm`} style={{ opacity: board.hideBaseFills ? 0 : 1, transition: 'opacity 120ms linear' }} />
            )}
          </div>
        ))
      ))}

      <HoverOverlay />
      <ClearOverlay />
      <ShiftOverlay />

      {/* Score bursts */}
      {board.scoreBursts?.length > 0 && (
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 45 }}>
          {board.scoreBursts.map(b => (
            <div
              key={b.id}
              className="absolute text-amber-400 font-black text-xl"
              style={{ left: b.x, top: b.y, transform: 'translate(-50%, -50%)', animation: `scoreRise ${BURST_MS}ms ease-out forwards`, textShadow: '0 3px 12px rgba(0,0,0,0.6)' }}
            >
              {b.text}
            </div>
          ))}
        </div>
      )}

      {/* Combo popup */}
      {board.comboPopup && (
        <div className="pointer-events-none absolute left-1/2 top-1/2" style={{ zIndex: 50, transform: 'translate(-50%, -50%)' }}>
          <div
            className="text-5xl font-black tracking-wide bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(34,211,238,0.8)]"
            style={{ animation: `comboPop ${COMBO_MS}ms ease-out forwards` }}
          >
            {board.comboPopup.text}
          </div>
          {board.comboPopup.sub && (
            <div
              className="text-center text-cyan-300/90 font-bold text-lg -mt-2"
              style={{ animation: `comboPop ${COMBO_MS}ms ease-out forwards` }}
            >
              {board.comboPopup.sub}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
