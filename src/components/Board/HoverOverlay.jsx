import { useBoardContext } from "./useBoardContext";

// Renders the hover preview for the currently selected shape.
export default function HoverOverlay() {
  const board = useBoardContext();
  const { hover, isAnimating, gapPx, cellW, cellH, gridRect } = board;

  if (isAnimating || !hover) return null;

  // console.log(cellW, cellH, hover);

  const vpW = document.documentElement.clientWidth;
  const vpH = document.documentElement.clientHeight;
  const gridTop = gridRect?.top ?? 0;
  const gridLeft = gridRect?.left ?? 0;
  const strideY = cellH + gapPx;
  const strideX = cellW + gapPx;

  // Determine shape dimensions in grid cells
  const xs = hover.blocks.map(([x]) => x);
  const ys = hover.blocks.map(([, y]) => y);
  const shapeW = Math.max(...xs) + 1;
  const shapeH = Math.max(...ys) + 1;

  // Clamp so the shape never goes out of viewport on right/bottom
  const maxRows = Math.floor((vpH - gridTop) / strideY) - shapeH;
  const maxCols = Math.floor((vpW - gridLeft) / strideX) - shapeW;
  const minRow = 0 - (shapeH - 1);
  const minCol = Math.ceil((0 - gridLeft) / strideX);
  const clampedRow = Math.max(minRow, Math.min(hover.rawRow, maxRows));
  const clampedCol = Math.max(minCol, Math.min(hover.rawCol, maxCols));

  return (
    <>
      {hover.blocks.map(([dx, dy], i) => {
        const invalid = !hover.valid;
        return (
          <div
            key={`hover-${i}`}
            className={`pointer-events-none rounded-md ${hover.color} ${invalid ? "animate-pulse" : ""}`}
            style={{
              gridRow: `${1 + dy}`,
              gridColumn: `${1 + dx}`,
              transition: hover.valid ? "transform 50ms ease" : undefined,
              transform: hover.valid
                ? `translate3d(calc(${hover.col} * (100% + ${gapPx}px)), calc(${hover.row} * (100% + ${gapPx}px)), 0)`
                : `translate3d(calc(${clampedCol} * (100% + ${gapPx}px)), calc(${clampedRow} * (100% + ${gapPx}px)), 0)`,
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
    </>
  );
}
