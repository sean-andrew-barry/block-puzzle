export const shapes = [
  {
    key: "single", name: "1x1", color: "bg-emerald-500", flash: "bg-emerald-200",
    blocks: [[0, 0]], base: 1, mult: 0.75
  }, // trivial, super flexible

  {
    key: "line2", name: "1x2", color: "bg-sky-400", flash: "bg-sky-200",
    blocks: [[0, 0], [1, 0]], base: 2, mult: 0.90
  }, // easy filler

  {
    key: "line3", name: "1x3", color: "bg-amber-500", flash: "bg-amber-200",
    blocks: [[0, 0], [1, 0], [2, 0]], base: 3, mult: 1.05
  }, // starts to get lane-y

  {
    key: "line4", name: "1x4", color: "bg-rose-500", flash: "bg-rose-200",
    blocks: [[0, 0], [1, 0], [2, 0], [3, 0]], base: 4, mult: 1.15
  }, // good clears, awkward late

  {
    key: "square2", name: "2x2", color: "bg-violet-500", flash: "bg-violet-200",
    blocks: [[0, 0], [1, 0], [0, 1], [1, 1]], base: 4, mult: 0.85
  }, // very forgiving

  {
    key: "square3", name: "3x3", color: "bg-cyan-500", flash: "bg-cyan-200",
    blocks: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]], base: 9, mult: 0.90
  }, // huge but easy early

  {
    key: "corner2", name: "Corner 2x2", color: "bg-yellow-500", flash: "bg-yellow-200",
    blocks: [[0, 0], [1, 0], [0, 1]], base: 3, mult: 1.05
  }, // flexible mini-L

  {
    key: "t3", name: "T", color: "bg-teal-400", flash: "bg-teal-200",
    blocks: [[0, 0], [1, 0], [2, 0], [1, 1]], base: 4, mult: 1.15
  }, // needs centering

  {
    key: "L3", name: "L", color: "bg-lime-400", flash: "bg-lime-200",
    blocks: [[0, 0], [0, 1], [0, 2], [1, 2]], base: 4, mult: 1.10
  }, // decent, a bit pokey

  {
    key: "Z", name: "Z", color: "bg-rose-400", flash: "bg-rose-200",
    blocks: [[0, 0], [1, 0], [1, 1], [2, 1]], base: 4, mult: 1.30
  }, // pocket-maker, trickiest of these
];

export const moreShapes = [
  // --- Missing tetrominoes ---
  {
    key: "J4", name: "J", color: "bg-indigo-400", flash: "bg-indigo-200",
    blocks: [[1, 0], [1, 1], [1, 2], [0, 2]], base: 4, mult: 1.05
  },

  {
    key: "S4", name: "S", color: "bg-orange-400", flash: "bg-orange-200",
    blocks: [[1, 0], [2, 0], [0, 1], [1, 1]], base: 4, mult: 1.25
  },

  // --- Lines & rectangles ---
  {
    key: "line5", name: "1x5", color: "bg-fuchsia-500", flash: "bg-fuchsia-200",
    blocks: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], base: 5, mult: 1.10
  },

  {
    key: "line6", name: "1x6", color: "bg-pink-500", flash: "bg-pink-200",
    blocks: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]], base: 6, mult: 1.15
  },

  {
    key: "rect2x3", name: "2x3", color: "bg-sky-500", flash: "bg-sky-200",
    blocks: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], base: 6, mult: 0.90
  },

  {
    key: "rect2x4", name: "2x4", color: "bg-blue-600", flash: "bg-blue-200",
    blocks: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1]], base: 8, mult: 0.85
  },

  // --- Pentomino set (hand-picked) ---
  {
    key: "I5", name: "I (5)", color: "bg-stone-500", flash: "bg-stone-200",
    blocks: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], base: 5, mult: 1.10
  },

  {
    key: "L5", name: "L (5)", color: "bg-green-600", flash: "bg-green-200",
    blocks: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]], base: 5, mult: 1.15
  },

  {
    key: "J5", name: "J (5)", color: "bg-green-500", flash: "bg-green-200",
    blocks: [[1, 0], [1, 1], [1, 2], [1, 3], [0, 3]], base: 5, mult: 1.15
  },

  {
    key: "T5", name: "T (5)", color: "bg-indigo-500", flash: "bg-indigo-200",
    blocks: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]], base: 5, mult: 1.20
  },

  {
    key: "U5", name: "U", color: "bg-lime-500", flash: "bg-lime-200",
    blocks: [[0, 0], [0, 1], [2, 0], [2, 1], [1, 1]], base: 5, mult: 1.30
  },

  {
    key: "V5", name: "V", color: "bg-emerald-400", flash: "bg-emerald-200",
    blocks: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], base: 5, mult: 1.15
  },

  {
    key: "W5", name: "W", color: "bg-cyan-600", flash: "bg-cyan-200",
    blocks: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]], base: 5, mult: 1.30
  },

  {
    key: "X5", name: "Plus", color: "bg-purple-500", flash: "bg-purple-200",
    blocks: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], base: 5, mult: 1.15
  },

  {
    key: "Y5", name: "Y", color: "bg-teal-500", flash: "bg-teal-200",
    blocks: [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1]], base: 5, mult: 1.40
  },

  {
    key: "P5", name: "P", color: "bg-yellow-600", flash: "bg-yellow-200",
    blocks: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]], base: 5, mult: 1.10
  },

  {
    key: "N5", name: "N", color: "bg-amber-600", flash: "bg-amber-200",
    blocks: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1]], base: 5, mult: 1.45
  },

  {
    key: "F5", name: "F", color: "bg-rose-600", flash: "bg-rose-200",
    blocks: [[1, 0], [0, 1], [1, 1], [1, 2], [2, 2]], base: 5, mult: 1.50
  },

  // --- “Hole-maker” & tricky shapes ---
  {
    key: "ring3", name: "Ring 3x3 (hollow)", color: "bg-zinc-500", flash: "bg-zinc-200",
    blocks: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]], base: 8, mult: 1.80
  },

  {
    key: "C5", name: "C", color: "bg-orange-500", flash: "bg-orange-200",
    blocks: [[0, 0], [1, 0], [0, 1], [0, 2], [1, 2]], base: 5, mult: 1.35
  },
];
