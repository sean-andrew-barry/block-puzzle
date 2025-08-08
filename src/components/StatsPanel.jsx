export default function StatsPanel({ stats }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 shadow-xl">
      <div className="text-lg font-semibold mb-2">Stats</div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <div className="opacity-70">Score</div><div className="text-right font-mono">{stats.score}</div>
        <div className="opacity-70">Moves</div><div className="text-right font-mono">{stats.moves}</div>
        <div className="opacity-70">Blocks placed</div><div className="text-right font-mono">{stats.totalPlacedBlocks}</div>
        <div className="opacity-70">Rows cleared</div><div className="text-right font-mono">{stats.linesClearedRows}</div>
        <div className="opacity-70">Cols cleared</div><div className="text-right font-mono">{stats.linesClearedCols}</div>
        <div className="opacity-70">Edge shifts</div><div className="text-right font-mono">{stats.edgeShifts}</div>
        <div className="opacity-70">Max combo</div><div className="text-right font-mono">{stats.maxCombo}</div>
      </div>
    </div>
  );
}