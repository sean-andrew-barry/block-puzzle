import { useState } from "react";
import { useBoardContext } from "./Board/BoardContext";

export default function Header() {
  const board = useBoardContext();
  const [seedInput, setSeedInput] = useState(""); // optional local control

  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-slate-900/50 to-slate-800/30 backdrop-blur-sm border-b border-slate-700/50">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
      <div className="relative px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              Edge-Shift Puzzle
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span>Score: <span className="font-mono text-slate-200">{board.stats?.score ?? 0}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span>Moves: <span className="font-mono text-slate-200">{board.stats?.moves ?? 0}</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/50">
              <label className="text-xs text-slate-400 font-medium">Seed</label>
              <input
                className="bg-slate-900/80 rounded-md px-2 py-1 text-xs border border-slate-600 w-24 font-mono text-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value.replace(/[^0-9]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && seedInput) {
                    // set fixed seed: update controller seedRef + reset
                    const v = Number(seedInput);
                    if (!Number.isNaN(v)) {
                      board.setSeed?.(v);      // optional method if you expose it
                      board.resetBoardKeepSeed();
                    }
                  }
                }}
              />
            </div>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border border-blue-500/50 text-sm font-medium transition-all duration-200"
              onClick={board.newSeed}>
              New Seed
            </button>
            <button className="px-4 py-2 rounded-lg bg-slate-700/80 hover:bg-slate-600/80 border border-slate-600/50 text-sm font-medium transition-all duration-200"
              onClick={board.resetBoardKeepSeed}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
