export function normalize(blocks) {
  let minX = Infinity, minY = Infinity;
  for (const [x, y] of blocks) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
  }
  return blocks.map(([x, y]) => [x - minX, y - minY]);
}

export function rotateCW(blocks) {
  const { h } = shapeSize(blocks);
  const rotated = blocks.map(([x, y]) => [h - 1 - y, x]);
  return normalize(rotated);
}

export function rotate(blocks, steps) {
  let out = blocks;
  for (let i = 0; i < ((steps % 4) + 4) % 4; i++) out = rotateCW(out);
  return out;
}

export function mirror(blocks) {
  const { w } = shapeSize(blocks);
  const mirrored = blocks.map(([x, y]) => [w - 1 - x, y]);
  return normalize(mirrored);
}

export function applyOrientation(blocks, rotation, isMirrored) {
  let oriented = rotate(blocks, rotation);
  if (isMirrored) oriented = mirror(oriented);
  return oriented;
}

export function shapeSize(blocks) {
  const xs = blocks.map(b => b[0]);
  const ys = blocks.map(b => b[1]);
  return { w: Math.max(...xs) + 1, h: Math.max(...ys) + 1 };
}

export function nextOrientation(rotation, isMirrored) {
  const nextRot = (rotation + 1) % 4;
  const nextMir = nextRot === 0 ? !isMirrored : isMirrored;
  return { rotation: nextRot, isMirrored: nextMir };
}
