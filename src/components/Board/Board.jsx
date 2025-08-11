import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useBoardContext } from "./useBoardContext";
import Lines from "./Lines";
import HoverOverlay from "./HoverOverlay";
import ClearOverlay from "./ClearOverlay";
import ShiftOverlay from "./ShiftOverlay";

export default function Board() {
  const board = useBoardContext();
  const { rows, cols, gapPx } = board;
  const gridRef = useRef(null);
  const cellRef = useRef(null);
  // Store last pointer position for hover updates
  const lastPointerRef = useRef({ gx: null, gy: null });

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
    // Try to focus the grid when it mounts so onKeyDown works immediately
    gridEl.focus?.();
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
    return { gx: e.clientX - rect.left, gy: e.clientY - rect.top };
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

  return (
    <div
      ref={gridRef}
      className="relative grid aspect-square max-w-[90vmin] mx-auto rounded-xl overflow-hidden bg-slate-900/40 backdrop-blur-sm border-2 border-slate-700/30 shadow-2xl h-[min(85vh,85vw)] w-[min(85vh,85vw)] xl:h-[min(80vh,60vw)] xl:w-[min(80vh,60vw)]"
      style={gridStyle}
      onPointerMove={(e) => {
        const { gx, gy } = toLocal(e);
        lastPointerRef.current = { gx, gy };
        board.updateHoverFromPoint(gx, gy);
      }}
      onPointerLeave={board.clearHover}
      onPointerDown={(e) => {
        const { gx, gy } = toLocal(e);
        lastPointerRef.current = { gx, gy };
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
    </div>
  );
}
