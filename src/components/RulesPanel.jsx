import {
  QUEUE_SIZE,
} from "../data/constants.js";

export default function RulesPanel() {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 shadow-xl text-sm leading-6">
      <div className="text-lg font-semibold mb-2">Rules</div>
      <ul className="list-disc pl-5 space-y-1 text-slate-300">
        <li>Place shapes onto the grid. Rows/columns with no gaps are cleared.</li>
        <li><span className="font-medium">Edge shift:</span> If cleared lines touch the <em>outer edges</em> (top/bottom/left/right), the entire board shifts toward those edges by the number of such lines.</li>
        <li>Multiple simultaneous clears are allowed. Internal clears still vanish but only <em>edge</em> clears cause shifting.</li>
        <li>Left‑click a shape to pick it up (drag) or select. Right‑click to rotate; after four rotations it toggles a horizontal mirror and cycles the mirrored rotations.</li>
        <li>Shapes are dealt in batches of {QUEUE_SIZE}. Use them up; only then a new batch is drawn.</li>
        <li>Seeded runs: the same seed yields the same shape sequence. Use <span className="font-mono">New Seed</span> to start a fresh run.</li>
      </ul>
      <div className="mt-3 text-xs text-slate-400">Opposite edges cancel (left vs. right, top vs. bottom). Cells never wrap; anything shifted beyond an edge is clipped. Keybinds: R rotate, F flip, Space place, Esc cancel.</div>
    </div>
  );
}