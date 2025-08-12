import RulesPanel from "./RulesPanel";

export default function CollapsibleRules({ defaultOpen = false }) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="list-none cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-200">How to Play</h3>
          <div className="text-slate-400 group-open:rotate-180 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </summary>
      <div className="mt-2 bg-slate-900/30 rounded-lg p-4 border border-slate-700/30">
        <RulesPanel />
      </div>
    </details>
  );
}