import { useMemo } from "react";

import {
  applyOrientation,
  shapeSize,
} from "../puzzle/geometry.js";

export default function ShapePreview({ item }) {
  const blocks = useMemo(() => applyOrientation(item.blocks, item.rotation, item.isMirrored), [item.blocks, item.rotation, item.isMirrored]);
  const { w, h } = shapeSize(blocks);
  const scale = 24; // responsive: smaller on mobile, larger on desktop
  return (
    <div className="rounded-lg p-1 xl:p-3" style={{ width: w * scale + (window.innerWidth >= 1280 ? 12 : 4), height: h * scale + (window.innerWidth >= 1280 ? 12 : 4) }}>
      <div className="relative" style={{ width: w * scale, height: h * scale }}>
        {blocks.map(([x, y], i) => (
          <div key={i} className={`absolute rounded-sm xl:rounded-md ${item.color} shadow-md`} style={{
            left: x * scale, top: y * scale, width: scale - 2, height: scale - 2,
          }} />
        ))}
      </div>
    </div>
  );
}