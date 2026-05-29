// A valid 6×6 binary puzzle (0 = sun, 1 = moon). Each row/col balanced, no 3 adjacent.
const SOLUTION = [
  [0, 1, 1, 0, 1, 0],
  [1, 0, 0, 1, 0, 1],
  [0, 1, 0, 1, 1, 0],
  [1, 0, 1, 0, 0, 1],
  [1, 1, 0, 0, 1, 0],
  [0, 0, 1, 1, 0, 1],
];

const GIVEN_LIST = [
  [0, 2], [0, 5], [1, 1], [1, 4], [2, 0], [2, 4],
  [3, 3], [4, 2], [4, 5], [5, 0], [5, 3],
];

const GIVENS = SOLUTION.map((row, r) =>
  row.map((_, c) => GIVEN_LIST.some(([gr, gc]) => gr === r && gc === c)));

function freshCells() {
  return SOLUTION.map((row, r) => row.map((v, c) => (GIVENS[r][c] ? v : null)));
}

// edges consistent with the solution
const EDGES = [
  { type: 'h', r: 0, c: 0, sign: 'ne' },
  { type: 'h', r: 0, c: 1, sign: 'eq' },
  { type: 'v', r: 0, c: 5, sign: 'ne' },
  { type: 'h', r: 2, c: 3, sign: 'eq' },
  { type: 'v', r: 3, c: 0, sign: 'eq' },
  { type: 'v', r: 4, c: 2, sign: 'ne' },
  { type: 'h', r: 5, c: 3, sign: 'ne' },
  { type: 'h', r: 3, c: 3, sign: 'eq' },
];

Object.assign(window, { SOLUTION, GIVENS, EDGES, freshCells });
