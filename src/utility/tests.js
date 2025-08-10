import {
  // applyOrientation,
  shapeSize,
  nextOrientation,
  rotate,
  mirror,
  normalize,
} from "../puzzle/geometry.js";

import {
  emptyGrid,
  computeClears,
  // clearOnly,
  applyClearsAndShifts,
} from "../puzzle/grid.js";

import { makeRng } from "../utility/rng.js";

import { GRID_COLS, GRID_ROWS, } from "../data/constants.js";

export default function runSanityTests() {
  try {
    console.assert(typeof computeClears === 'function', 'computeClears missing');
    // Rotation/size sanity
    const line3 = [[0, 0], [1, 0], [2, 0]];
    const rot = rotate(line3, 1);
    const sz = shapeSize(rot);
    console.assert(sz.w === 1 && sz.h === 3, 'rotate/size failed');

    // Square remains square after rotation
    const sq = [[0, 0], [1, 0], [0, 1], [1, 1]];
    const sqr = rotate(sq, 3);
    const sqsz = shapeSize(sqr);
    console.assert(sqsz.w === 2 && sqsz.h === 2, 'square rotate failed');

    // Seeded RNG determinism
    const r1 = makeRng(123456), r2 = makeRng(123456);
    for (let i = 0; i < 10; i++) {
      console.assert(r1.int(1000) === r2.int(1000), 'rng int mismatch');
    }

    // Mirror invariants
    const L = [[0, 0], [0, 1], [0, 2], [1, 2]]; // asymmetric
    const Lm = mirror(L);
    console.assert(JSON.stringify(normalize(mirror(Lm))) === JSON.stringify(normalize(L)), 'double mirror should restore');

    // Orientation cycling sequence (4 rotations then toggle mirror)
    let state = { rotation: 0, isMirrored: false };
    for (let i = 0; i < 3; i++) state = nextOrientation(state.rotation, state.isMirrored); // -> rot=3,false
    state = nextOrientation(state.rotation, state.isMirrored); // wrap -> rot=0, mirror=true
    console.assert(state.rotation === 0 && state.isMirrored === true, 'orientation cycle failed to toggle mirror');

    // Clear detection & edge shift magnitudes (top & left)
    const g = emptyGrid();
    for (let c = 0; c < GRID_COLS; c++) g[0][c] = { color: '#fff' };
    for (let r = 0; r < GRID_ROWS; r++) g[r][0] = { color: '#fff' };
    const res = computeClears(g);
    console.assert(res.rowsFull.has(0) && res.colsFull.has(0), 'computeClears full lines');
    console.assert(res.topShift === 1 && res.leftShift === 1, 'edge shifts calc');

    // Clear + shift translation of an interior cell (5,5) -> (4,4)
    g[5][5] = { color: '#abc' };
    const out = applyClearsAndShifts(g, res.rowsFull, res.colsFull, res);
    console.assert(out[4][4] && !out[5][5], 'applyClearsAndShifts translation');

    // Internal clear should not cause shift
    const g2 = emptyGrid();
    for (let c = 0; c < GRID_COLS; c++) g2[6][c] = { color: '#fff' }; // middle row
    const res2 = computeClears(g2);
    console.assert(res2.topShift === 0 && res2.bottomShift === 0 && res2.leftShift === 0 && res2.rightShift === 0, 'internal clear shifted erroneously');

    // Opposite edges combine/cancel (top & bottom): net 0 dy
    const g3 = emptyGrid();
    for (let c = 0; c < GRID_COLS; c++) { g3[0][c] = { color: '#fff' }; g3[GRID_ROWS - 1][c] = { color: '#fff' }; }
    const res3 = computeClears(g3);
    const dy = -res3.topShift + res3.bottomShift;
    console.assert(dy === 0, 'opposite edges should cancel');

    // No wrap: shifting left/up by one must not create cells beyond the top-left boundary
    const g4 = emptyGrid();
    for (let c = 0; c < GRID_COLS; c++) g4[0][c] = { color: '#fff' }; // top clear -> dy = -1
    for (let r = 0; r < GRID_ROWS; r++) g4[r][0] = { color: '#fff' }; // left clear -> dx = -1
    g4[1][1] = { color: '#0f0' }; // cell near left edge to verify shift without wrap
    const res4 = computeClears(g4);
    const out4 = applyClearsAndShifts(g4, res4.rowsFull, res4.colsFull, res4);
    console.assert(out4[0][0], 'expected cell at 0,0 and no wrap below 0');
  } catch (e) {
    console.error('Sanity tests failed:', e);
  }
}