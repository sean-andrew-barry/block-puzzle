import { useBoardContext } from "/src/components/Board/useBoardContext";
import { useMemo } from "react";

export default function HoverOverlay() {
  const board = useBoardContext();

  const { hover, isAnimating, gapPx, cellW, cellH, rows, cols } = board;

  const gridStyle = useMemo(() => ({
    "--gap": `${gapPx}px`,
    gap: "var(--gap)",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
  }), [rows, cols, gapPx]);

  if (isAnimating || !hover) return null;

  return (
    <div
      className="fixed inset-0 w-screen h-screen pointer-events-none z-[9999]"
      tabIndex={-1}
      aria-hidden="true"
    >
      <div className="relative grid aspect-square max-w-[90vmin] mx-auto h-[min(85vh,85vw)] w-[min(85vh,85vw)] xl:h-[min(80vh,60vw)] xl:w-[min(80vh,60vw)]" style={gridStyle}>
        {hover.blocks.map(([dx, dy], i) => {
          const invalid = !hover.valid;
          return (
            <div
              key={`hover-${i}`}
              className={`pointer-events-none overflow-hidden rounded-md ${hover.color} ${invalid ? "animate-pulse" : ""}`}
              style={{
                // Inside grid: use native grid positioning for per-block offset
                gridRow: hover.valid ? `${1 + dy}` : `1`,
                gridColumn: hover.valid ? `${1 + dx}` : `1`,
                // width: `${cellW}px`,
                // height: `${cellH}px`,
                transition: hover.valid ? "transform 50ms ease" : undefined,
                transform: hover.valid
                  ? `translate3d(calc(${hover.col} * (100% + ${gapPx}px)), calc(${hover.row} * (100% + ${gapPx}px)), 0)`
                  : `translate3d(calc(${hover.rawCol} * (100% + ${gapPx}px)), calc(${hover.rawRow} * (100% + ${gapPx}px)), 0)`,
                // transform: `translate3d(calc(${hover.rawCol} * (100% + ${gapPx}px)), calc(${hover.rawRow} * (100% + ${gapPx}px)), 0)`,
                // transition: hover.valid ? "transform 50ms ease" : undefined,
                // transform: hover.valid
                //   ? `translate3d(calc(${hover.col} * (100% + ${gapPx}px)), calc(${hover.row} * (100% + ${gapPx}px)), 0)`
                //   : `translate3d(${freeTx}px, ${freeTy}px, 0)`,
                // opacity: invalid ? 0.4 : 0.7,
                boxShadow: invalid
                  ? "0 0 0 2px rgba(248,113,113,0.8) inset"
                  : "0 0 0 2px rgba(56,189,248,0.6) inset, 0 0 8px rgba(56,189,248,0.3)",
                backgroundImage: invalid
                  ? "repeating-linear-gradient(45deg, rgba(248,113,113,0.28), rgba(248,113,113,0.28) 6px, rgba(248,113,113,0.08) 6px, rgba(248,113,113,0.08) 12px)"
                  : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}