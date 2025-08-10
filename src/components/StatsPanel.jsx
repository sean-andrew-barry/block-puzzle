export default function StatsPanel({ stats }) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-1">Score</div>
          <div className="text-lg font-bold font-mono text-emerald-400">{stats.score.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-1">Moves</div>
          <div className="text-lg font-bold font-mono text-blue-400">{stats.moves}</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-1">Blocks</div>
          <div className="text-lg font-bold font-mono text-purple-400">{stats.totalPlacedBlocks}</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-1">Max Combo</div>
          <div className="text-lg font-bold font-mono text-amber-400">{stats.maxCombo}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30 text-center">
          <div className="text-xs text-slate-400 mb-1">Rows Cleared</div>
          <div className="text-base font-bold font-mono text-cyan-400">{stats.linesClearedRows}</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30 text-center">
          <div className="text-xs text-slate-400 mb-1">Cols Cleared</div>
          <div className="text-base font-bold font-mono text-cyan-400">{stats.linesClearedCols}</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30 text-center">
          <div className="text-xs text-slate-400 mb-1">Edge Shifts</div>
          <div className="text-base font-bold font-mono text-rose-400">{stats.edgeShifts}</div>
        </div>
      </div>
    </div>
  );
}