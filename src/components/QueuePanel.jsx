import ShapePreview from "./ShapePreview.jsx";

export default function QueuePanel({ queue, onStartDrag, selectedIndex, setSelectedIndex, rotateSelectedCW, toggleSelectedMirror }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center mb-2">
        <div className="text-lg font-semibold">Current Batch</div>
        <div className="ml-auto text-xs text-slate-400">(left‑click to pick up; right‑click to rotate/flip)</div>
      </div>
      <div className="flex flex-col gap-3">
        {queue.length === 0 && (
          <div className="text-sm text-slate-400">Batch used up — a fresh set appears after you place this move.</div>
        )}
        {queue.map((item, i) => (
          <div key={item.id}
            onClick={() => setSelectedIndex(i)}
            onContextMenu={(e) => { e.preventDefault(); setSelectedIndex(i); rotateSelectedCW(); }}
            onPointerDown={(e) => onStartDrag(e, i)}
            className={`flex items-center gap-3 p-2 rounded-xl border ${selectedIndex === i ? "border-slate-400" : "border-slate-800"} bg-slate-950/60 cursor-pointer`}
            title="Left‑click to select/pick up • Right‑click to rotate/flip"
          >
            <div className="relative select-none cursor-grab active:cursor-grabbing">
              <ShapePreview item={item} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{item.name}</div>
              <div className="text-xs text-slate-400">{item.key} {item.isMirrored ? '• mirr' : ''} r{item.rotation}</div>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 text-xs rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-700" onClick={() => { setSelectedIndex(i); rotateSelectedCW(); }}>R</button>
              <button className="px-2 py-1 text-xs rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-700" onClick={() => { setSelectedIndex(i); toggleSelectedMirror(); }}>F</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}