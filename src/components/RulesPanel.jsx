
import { QUEUE_SIZE } from "../data/constants.js";

const RULES = [
  {
    color: "blue",
    iconBg: "bg-blue-500/20",
    iconDot: "bg-blue-400",
    title: "Basic Gameplay",
    description: "Place shapes onto the grid. Complete rows or columns (no gaps) are cleared automatically.",
  },
  {
    color: "purple",
    iconBg: "bg-purple-500/20",
    iconDot: "bg-purple-400",
    title: "Edge Shifting",
    description: "When cleared lines touch the outer edges, the entire board shifts toward those edges. Internal clears don't cause shifts.",
  },
  {
    color: "emerald",
    iconBg: "bg-emerald-500/20",
    iconDot: "bg-emerald-400",
    title: "Shape Batches",
    description: `Shapes come in batches of ${QUEUE_SIZE}. Use them all up to get a fresh batch. Same seed = same sequence.`,
  },
  {
    color: "amber",
    iconBg: "bg-amber-500/20",
    iconDot: "bg-amber-400",
    title: "Controls",
    description: "Left-click to select/drag shapes. Right-click to rotate (4 rotations then mirror toggle). Opposite edge shifts cancel each other.",
  },
];

export default function RulesPanel() {
  return (
    <div className="text-sm leading-relaxed">
      <div className="space-y-4">
        {RULES.map((rule) => (
          <div key={rule.title} className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full ${rule.iconBg} flex items-center justify-center mt-0.5 flex-shrink-0`}>
              <div className={`w-2 h-2 rounded-full ${rule.iconDot}`}></div>
            </div>

            <div className="w-0 flex-1 overflow-hidden">
              <p className="text-slate-300 break-words whitespace-normal">
                {rule.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
