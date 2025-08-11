import { useBoardContext } from "./useBoardContext";

// Renders the hover preview for the currently selected shape.
// Uses board.hover { row, col, blocks, color, valid } and board.gapPx.
export default function HoverOverlay() {
  const board = useBoardContext();
  const { hover, isAnimating, gapPx } = board;

  if (isAnimating || !hover) return null;

  return (
    <>
      {hover.blocks.map(([dx, dy], i) => {
        const invalid = !hover.valid;
        return (
          <div
            key={`hover-${i}`}
            className={`pointer-events-none relative z-[20] rounded-md ${hover.color} ${invalid ? "animate-pulse" : ""}`}
            style={{
              gridRow: `${1 + dy}`,
              gridColumn: `${1 + dx}`,
              transition: "transform 50ms ease",
              transform: `translate3d(calc(${hover.col} * (100% + ${gapPx}px)), calc(${hover.row} * (100% + ${gapPx}px)), 0)`,
              opacity: invalid ? 0.4 : 0.7,
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
