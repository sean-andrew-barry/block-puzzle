import { TW_GRID } from "../data/constants.js";

export default function HoverOverlay({ isAnimating, hoverOverlay }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${TW_GRID}`}>
      {/* Hover/Selection overlay (above cells) */}
      {!isAnimating && hoverOverlay && (
        hoverOverlay.blocks.map(([dx, dy], i) => {
          const invalid = !hoverOverlay.valid;

          return (
            <div key={`hover-${i}`}
              className={`rounded-md p-0.5 ${hoverOverlay.color} ${invalid ? 'animate-pulse' : ''}`}
              style={{
                gridRow: `${1 + dy}`,
                gridColumn: `${1 + dx}`,
                transition: "transform 50ms ease",
                transform: `translate3d(${hoverOverlay.col * 100}%, ${hoverOverlay.row * 100}%, 0)`,
                // willChange: "transform",
                // opacity: invalid ? 0.28 : 0.55,
                // outline: invalid ? "1px dashed rgba(248,113,113,1)" : "1px solid rgba(56,189,248,0.9)",
                // boxShadow: invalid ? "0 0 0 2px rgba(248,113,113,0.8) inset, 0 0 12px rgba(248,113,113,0.5)" : "0 0 0 2px rgba(56,189,248,0.6) inset, 0 0 14px rgba(56,189,248,0.45)",
                backgroundImage: invalid ? "repeating-linear-gradient(45deg, rgba(248,113,113,0.28), rgba(248,113,113,0.28) 6px, rgba(248,113,113,0.08) 6px, rgba(248,113,113,0.08) 12px)" : undefined,
              }}
            />
          );
        })
      )}
    </div>
  );
}