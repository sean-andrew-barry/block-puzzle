export function mulberry32Step(state) {
  let t = (state >>> 0) + 0x6D2B79F5;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
  r = ((r ^ (r >>> 14)) >>> 0);
  return { state: t >>> 0, float: r / 4294967296 };
}

export function nextFloat(state) {
  const { state: s, float } = mulberry32Step(state);
  return { state: s, value: float };
}

export function nextInt(state, max) {
  const { state: s, value } = nextFloat(state);
  return { state: s, value: Math.floor(value * max) };
}

export function choice(state, arr) {
  const { state: s, value } = nextInt(state, arr.length);
  return { state: s, value: arr[value] };
}
