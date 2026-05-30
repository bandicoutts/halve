import { cloneGrid, isComplete } from './board.js';
import { edgeCells, isValid } from './validators.js';
import { otherSym } from './types.js';
// A value is forbidden at (r,c) if placing it completes a triple.
function adjacencyForbids(grid, r, c, val, size) {
    if (c >= 2 && grid[r][c - 1] === val && grid[r][c - 2] === val)
        return true;
    if (c >= 1 && c + 1 < size && grid[r][c - 1] === val && grid[r][c + 1] === val)
        return true;
    if (c + 2 < size && grid[r][c + 1] === val && grid[r][c + 2] === val)
        return true;
    if (r >= 2 && grid[r - 1][c] === val && grid[r - 2][c] === val)
        return true;
    if (r >= 1 && r + 1 < size && grid[r - 1][c] === val && grid[r + 1][c] === val)
        return true;
    if (r + 2 < size && grid[r + 1][c] === val && grid[r + 2][c] === val)
        return true;
    return false;
}
// Forbidden if the line already holds half of `val`.
function balanceForbids(grid, r, c, val, size) {
    const half = size / 2;
    let row = 0;
    for (let cc = 0; cc < size; cc++)
        if (grid[r][cc] === val)
            row++;
    if (row + 1 > half)
        return true;
    let col = 0;
    for (let rr = 0; rr < size; rr++)
        if (grid[rr][c] === val)
            col++;
    return col + 1 > half;
}
// Forbidden if an edge with a known neighbour rules `val` out.
function edgeForbids(grid, r, c, val, edges) {
    for (const edge of edges) {
        const [r1, c1, r2, c2] = edgeCells(edge);
        let nv;
        if (r1 === r && c1 === c)
            nv = grid[r2]?.[c2];
        else if (r2 === r && c2 === c)
            nv = grid[r1]?.[c1];
        else
            continue;
        if (nv === null || nv === undefined)
            continue;
        if (edge.kind === 'eq' ? val !== nv : val === nv)
            return true;
    }
    return false;
}
// First technique that forbids `val` at (r,c), or null if it is allowed.
function forbiddenBy(grid, r, c, val, edges, size) {
    if (edgeForbids(grid, r, c, val, edges))
        return 'edge';
    if (adjacencyForbids(grid, r, c, val, size))
        return 'adjacency';
    if (balanceForbids(grid, r, c, val, size))
        return 'balance';
    return null;
}
/**
 * Human-style, deduction-only solver. Repeatedly forces every cell that has
 * exactly one legal value (no guessing) until the grid stabilises.
 * `solved` is true only if propagation alone fully and consistently fills the grid.
 */
export function solve(givens, edges = []) {
    const size = givens.length;
    const grid = cloneGrid(givens);
    const stats = { adjacency: 0, balance: 0, edge: 0, passes: 0 };
    let contradiction = false;
    for (;;) {
        let changed = false;
        stats.passes++;
        for (let r = 0; r < size && !contradiction; r++) {
            for (let c = 0; c < size && !contradiction; c++) {
                if (grid[r][c] !== null)
                    continue;
                const forbids0 = forbiddenBy(grid, r, c, 0, edges, size);
                const forbids1 = forbiddenBy(grid, r, c, 1, edges, size);
                if (forbids0 && forbids1) {
                    contradiction = true;
                    break;
                }
                if (forbids0 || forbids1) {
                    const val = forbids0 ? 1 : 0;
                    const reason = (forbids0 ?? forbids1); // the technique that ruled out the other value
                    grid[r][c] = val;
                    stats[reason]++;
                    changed = true;
                }
            }
        }
        if (contradiction || !changed)
            break;
    }
    const solved = !contradiction && isComplete(grid) && isValid(grid, edges);
    return { grid, solved, contradiction, stats };
}
/** Convenience: does deduction alone solve this puzzle (no guessing)? */
export function isDeductionSolvable(givens, edges = []) {
    return solve(givens, edges).solved;
}
export { otherSym };
//# sourceMappingURL=solver.js.map