import { useBoardContext } from "./useBoardContext";
import { SHIFT_MS } from "/src/data/constants.js";

// Overlay that animates the remaining cells translating by (dx, dy) cells.
export default function ShiftOverlay() {
  const { animGrid, shiftAnim, shiftProgress, strideX, strideY } = useBoardContext();
  if (!animGrid) return null;

  const shiftXPx = (shiftAnim?.dx ?? 0) * strideX;
  const shiftYPx = (shiftAnim?.dy ?? 0) * strideY;

  return (
    <>
      {animGrid.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) return null;
          return (
            <div key={`move-${r}-${c}`} className="pointer-events-none relative z-[30]" style={{ gridRow: r + 1, gridColumn: c + 1 }}>
              <div
                className={`absolute inset-0 rounded-sm ${cell.color}`}
                style={{
                  transform: `translate3d(${shiftProgress ? shiftXPx : 0}px, ${shiftProgress ? shiftYPx : 0}px, 0)`,
                  transition: `transform ${SHIFT_MS}ms cubic-bezier(.2,.9,.2,1)`,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
            </div>
          );
        })
      )}
    </>
  );
}
