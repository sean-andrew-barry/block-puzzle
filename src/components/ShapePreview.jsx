import { useMemo } from "react";

import {
  applyOrientation,
  shapeSize,
} from "../puzzle/geometry.js";

export default function ShapePreview({ item }) {
  const blocks = useMemo(() => applyOrientation(item.blocks, item.rotation, item.isMirrored), [item.blocks, item.rotation, item.isMirrored]);
  const { w, h } = shapeSize(blocks);
  const scale = 18; // mini thumbnail size per cell
  return (
    <div className="rounded-lg p-2 bg-slate-900 border border-slate-800" style={{ width: w * scale + 8, height: h * scale + 8 }}>
      <div className="relative" style={{ width: w * scale, height: h * scale }}>
        {blocks.map(([x, y], i) => (
          <div key={i} className={`absolute rounded-sm ${item.color}`} style={{
            left: x * scale, top: y * scale, width: scale - 2, height: scale - 2,
          }} />
        ))}
      </div>
    </div>
  );
}