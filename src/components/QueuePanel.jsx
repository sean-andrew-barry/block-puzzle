import ShapePreview from "./ShapePreview.jsx";

export default function QueuePanel({ queue, onStartDrag, selectedIndex, setSelectedIndex, rotateSelectedCW, toggleSelectedMirror }) {
  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 lg:p-6 shadow-2xl h-fit">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
          <h2 className="text-xl font-bold text-slate-100">Shape Queue</h2>
        </div>
        <div className="text-xs text-slate-400 hidden sm:block">
          Click to select • Right-click to rotate/flip
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-1 gap-3">
        {queue.length === 0 && (
          <div className="col-span-full text-center py-8 text-slate-400 bg-slate-900/30 rounded-xl border border-slate-700/30">
            <div className="text-lg mb-2">🎯</div>
            <div className="text-sm">Queue empty!</div>
            <div className="text-xs opacity-75">New shapes appear after placement</div>
          </div>
        )}
        {queue.map((item, i) => (
          <div key={item.id}
            onClick={() => setSelectedIndex(i)}
            onContextMenu={(e) => { e.preventDefault(); setSelectedIndex(i); rotateSelectedCW(); }}
            onPointerDown={(e) => onStartDrag(e, i)}
            className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
              selectedIndex === i 
                ? "border-blue-400 bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-lg shadow-blue-500/20" 
                : "border-slate-700/50 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60"
            }`}
            title="Left-click to select/pick up • Right-click to rotate/flip"
          >
            {selectedIndex === i && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse"></div>
            )}
            
            <div className="relative select-none cursor-grab active:cursor-grabbing z-10">
              <ShapePreview item={item} />
            </div>
            
            <div className="flex-1 z-10">
              <div className="text-base font-semibold text-slate-100 mb-1">{item.name}</div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono bg-slate-800/50 px-2 py-0.5 rounded">{item.key}</span>
                {item.isMirrored && <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">mirrored</span>}
                {item.rotation > 0 && <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">r{item.rotation}</span>}
              </div>
            </div>
            
            <div className="flex items-center gap-2 z-10">
              <button 
                className="w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg bg-slate-700/50 border border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500 transition-colors" 
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(i); rotateSelectedCW(); }}
                title="Rotate"
              >
                ↻
              </button>
              <button 
                className="w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg bg-slate-700/50 border border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500 transition-colors" 
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(i); toggleSelectedMirror(); }}
                title="Flip"
              >
                ⇄
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}