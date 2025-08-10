import { useMemo } from "react";

import {
  applyOrientation,
  shapeSize,
} from "../puzzle/geometry.js";

export default function ShapePreview({ item }) {
  const blocks = useMemo(() => applyOrientation(item.blocks, item.rotation, item.isMirrored), [item.blocks, item.rotation, item.isMirrored]);
  const { w, h } = shapeSize(blocks);
  const scale = 24; // larger thumbnail size per cell
  return (
    <div className="rounded-lg p-3" style={{ width: w * scale + 12, height: h * scale + 12 }}>
      <div className="relative" style={{ width: w * scale, height: h * scale }}>
        {blocks.map(([x, y], i) => (
          <div key={i} className={`absolute rounded-md ${item.color} shadow-md`} style={{
            left: x * scale, top: y * scale, width: scale - 3, height: scale - 3,
          }} />
        ))}
      </div>
    </div>
  );
}