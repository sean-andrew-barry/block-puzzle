import { GRID_COLS, GRID_ROWS, } from "../data/constants.js";

export default function GridLines({ columns = false }) {
  if (columns) {
    return (
      <>
        {
          Array.from({ length: GRID_COLS - 1 }).map((_, c) => (
            <div key={`c-${c + 1}`} style={{ gridColumn: `${c + 2}`, gridRowStart: `1`, gridRowEnd: "-1" }}>
              <div className="-translate-x-1 w-1 h-full bg-slate-700/30 pointer-events-none" />
            </div>
          ))
        }
      </>
    );
  } else {
    return (
      <>
        {Array.from({ length: GRID_ROWS - 1 }).map((_, r) => (
          <div key={`r-${r + 1}`} style={{ gridRow: `${r + 2}`, gridColumnStart: `1`, gridColumnEnd: "-1" }}>
            <div className="-translate-y-1 h-1 w-full bg-slate-700/30 pointer-events-none" />
          </div>
        ))}
      </>
    );
  }
}