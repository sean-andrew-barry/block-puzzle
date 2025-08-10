import {
  QUEUE_SIZE,
} from "../data/constants.js";

export default function RulesPanel() {
  return (
    <div className="text-sm leading-relaxed">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          </div>
          <div>
            <div className="font-medium text-slate-200 mb-1">Basic Gameplay</div>
            <div className="text-slate-300">Place shapes onto the grid. Complete rows or columns (no gaps) are cleared automatically.</div>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
          </div>
          <div>
            <div className="font-medium text-slate-200 mb-1">Edge Shifting</div>
            <div className="text-slate-300">When cleared lines touch the outer edges, the entire board shifts toward those edges. Internal clears don't cause shifts.</div>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          </div>
          <div>
            <div className="font-medium text-slate-200 mb-1">Shape Batches</div>
            <div className="text-slate-300">Shapes come in batches of {QUEUE_SIZE}. Use them all up to get a fresh batch. Same seed = same sequence.</div>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
          </div>
          <div>
            <div className="font-medium text-slate-200 mb-1">Controls</div>
            <div className="text-slate-300">Left-click to select/drag shapes. Right-click to rotate (4 rotations then mirror toggle). Opposite edge shifts cancel each other.</div>
          </div>
        </div>
      </div>
    </div>
  );
}