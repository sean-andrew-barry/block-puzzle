export default function Lines({ grid }) {
  return (
    <>
      {Array.from({ length: grid.length - 1 }).map((_, r) => (
        <div key={`r-${r + 1}`} style={{ gridRow: `${r + 2}`, gridColumnStart: `1`, gridColumnEnd: "-1" }}>
          <div className="-translate-y-1 h-1 w-full bg-slate-700/30 pointer-events-none" />
        </div>
      ))}
      {
        Array.from({ length: grid[0].length - 1 }).map((_, c) => (
          <div key={`c-${c + 1}`} style={{ gridColumn: `${c + 2}`, gridRowStart: `1`, gridRowEnd: "-1" }}>
            <div className="-translate-x-1 w-1 h-full bg-slate-700/30 pointer-events-none" />
          </div>
        ))
      }
    </>
  );
}