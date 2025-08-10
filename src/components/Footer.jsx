export default function Footer() {
  return (
    <footer className="border-t border-slate-700/50 bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="max-w-7xl mx-auto text-center text-xs text-slate-400">
        <div className="flex flex-wrap justify-center gap-4">
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Left-click</kbd> to select/drag shapes</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Right-click</kbd> to rotate/flip</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">R</kbd> rotate</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">F</kbd> flip</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Space</kbd> place</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Esc</kbd> cancel</span>
        </div>
      </div>
    </footer>
  );
}