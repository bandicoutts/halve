/** A fresh size×size grid filled with `null`. */
export function emptyGrid(size) {
    return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}
/** Deep-copy a grid. */
export function cloneGrid(grid) {
    return grid.map((row) => row.slice());
}
/** True when the grid has no empty cells. */
export function isComplete(grid) {
    return grid.every((row) => row.every((cell) => cell !== null));
}
/** Number of filled cells. */
export function filledCount(grid) {
    let n = 0;
    for (const row of grid)
        for (const cell of row)
            if (cell !== null)
                n++;
    return n;
}
/** Build a givens grid from a solution + a boolean mask of which cells are revealed. */
export function gridFromMask(solution, mask) {
    return solution.map((row, r) => row.map((v, c) => (mask[r][c] ? v : null)));
}
/** Coordinates of every empty cell, row-major. */
export function emptyCells(grid) {
    const out = [];
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c] === null)
                out.push([r, c]);
        }
    }
    return out;
}
/** True when two complete grids are identical. */
export function gridsEqual(a, b) {
    if (a.length !== b.length)
        return false;
    for (let r = 0; r < a.length; r++) {
        const ra = a[r];
        const rb = b[r];
        if (ra.length !== rb.length)
            return false;
        for (let c = 0; c < ra.length; c++)
            if (ra[c] !== rb[c])
                return false;
    }
    return true;
}
/** True when the grid matches the solution on every filled cell (empties ignored). */
export function matchesSolution(grid, solution) {
    for (let r = 0; r < solution.length; r++) {
        for (let c = 0; c < solution[r].length; c++) {
            const v = grid[r][c];
            if (v !== null && v !== solution[r][c])
                return false;
        }
    }
    return true;
}
/** Narrowing helper: assert a grid is a complete Solution. */
export function asSolution(grid) {
    return grid.map((row) => row.map((cell) => {
        if (cell === null)
            throw new Error('asSolution: grid is incomplete');
        return cell;
    }));
}
//# sourceMappingURL=board.js.map