import { useBoardContext } from "./useBoardContext";
import { CLEAR_MS, FLASH_BY_COLOR, deriveFlashClass } from "/src/data/constants.js";

// Overlay that shows per-cell clear flash/shrink on cleared rows/cols.
export default function ClearOverlay() {
  const { clearAnim } = useBoardContext();
  if (!clearAnim) return null;
  const { rowsFull, colsFull, grid } = clearAnim;

  return (
    <>
      {grid.map((row, r) =>
        row.map((_, c) => {
          if (!rowsFull.has(r) && !colsFull.has(c)) return null;
          const cell = grid[r][c];
          const flashClass = cell
            ? (FLASH_BY_COLOR[cell.color] || deriveFlashClass(cell.color))
            : "bg-amber-200";
          return (
            <div key={`clr-${r}-${c}`} className="pointer-events-none relative z-[25] rounded-sm" style={{ gridRow: r + 1, gridColumn: c + 1 }}>
              <div className={`absolute inset-0 ${flashClass} rounded-sm`} style={{ animation: `cellClear ${CLEAR_MS}ms ease-out forwards` }} />
            </div>
          );
        })
      )}
    </>
  );
}
