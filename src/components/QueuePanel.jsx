import ShapePreview from "./ShapePreview.jsx";

export default function QueuePanel({ queue, onStartDrag, selectedIndex, setSelectedIndex, rotateSelectedCW, toggleSelectedMirror }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-4 xl:grid-cols-1 gap-4">
        {queue.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-700/30 shadow-xl">
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
            className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:scale-[1.02] bg-slate-900/40 backdrop-blur-sm shadow-xl ${
              selectedIndex === i 
                ? "border-blue-400 shadow-lg shadow-blue-500/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10" 
                : "border-slate-700/50 hover:border-slate-600 hover:bg-slate-900/60"
            }`}
            title="Left-click to select/pick up • Right-click to rotate/flip"
          >
            {selectedIndex === i && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse"></div>
            )}
            
            <div className="relative select-none cursor-grab active:cursor-grabbing z-10 flex-1 flex items-center justify-center">
              <ShapePreview item={item} />
            </div>
            
            <div className="flex items-center gap-1 text-xs text-slate-400 z-10">
              {item.isMirrored && <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-xs">flip</span>}
              {item.rotation > 0 && <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-xs">r{item.rotation}</span>}
            </div>
            
            <div className="flex items-center gap-1 z-10">
              <button
                className="w-7 h-7 flex items-center justify-center text-xs font-medium rounded-lg bg-slate-700/50 border border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500 transition-colors" 
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(i); rotateSelectedCW(); }}
                title="Rotate"
              >
                ↻
              </button>
              <button
                className="w-7 h-7 flex items-center justify-center text-xs font-medium rounded-lg bg-slate-700/50 border border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500 transition-colors" 
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(i); toggleSelectedMirror(); }}
                title="Flip"
              >
                ⇄
              </button>
            </div>
          </div>
        ))}
      </div>
  );
}