function computeErrors(cells) {
  const N = 6;
  const errs = new Set();
  const mark = (r, c) => errs.add(`${r}-${c}`);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = cells[r][c];
      if (v === null) continue;
      if (c <= N - 3 && cells[r][c + 1] === v && cells[r][c + 2] === v) { mark(r, c); mark(r, c + 1); mark(r, c + 2); }
      if (r <= N - 3 && cells[r + 1][c] === v && cells[r + 2][c] === v) { mark(r, c); mark(r + 1, c); mark(r + 2, c); }
    }
  }
  for (let r = 0; r < N; r++) [0, 1].forEach((sym) => {
    const idx = []; for (let c = 0; c < N; c++) if (cells[r][c] === sym) idx.push(c);
    if (idx.length > 3) idx.forEach((c) => mark(r, c));
  });
  for (let c = 0; c < N; c++) [0, 1].forEach((sym) => {
    const idx = []; for (let r = 0; r < N; r++) if (cells[r][c] === sym) idx.push(r);
    if (idx.length > 3) idx.forEach((r) => mark(r, c));
  });
  return errs;
}

function fmt(s) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function useParityGame(onSolve) {
  const [cells, setCells] = React.useState(() => freshCells());
  const [history, setHistory] = React.useState([]);
  const [secs, setSecs] = React.useState(0);
  const errors = React.useMemo(() => computeErrors(cells), [cells]);

  React.useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const solved = React.useMemo(
    () => cells.every((row, r) => row.every((v, c) => v === SOLUTION[r][c])), [cells]);

  React.useEffect(() => {
    if (solved) { const t = setTimeout(() => onSolve && onSolve(fmt(secs)), 520); return () => clearTimeout(t); }
  }, [solved]);

  const push = () => setHistory((h) => [...h, cells.map((r) => r.slice())]);

  function tap(r, c) {
    push();
    setCells((prev) => {
      const next = prev.map((row) => row.slice());
      const v = next[r][c];
      next[r][c] = v === null ? 0 : v === 0 ? 1 : null;
      return next;
    });
  }
  function undo() {
    setHistory((h) => { if (!h.length) return h; setCells(h[h.length - 1]); return h.slice(0, -1); });
  }
  function hint() {
    const empties = [];
    cells.forEach((row, r) => row.forEach((v, c) => { if (v === null) empties.push([r, c]); }));
    if (!empties.length) return;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    push();
    setCells((prev) => { const n = prev.map((row) => row.slice()); n[r][c] = SOLUTION[r][c]; return n; });
  }

  return { cells, errors, secs, solved, tap, undo, hint };
}

Object.assign(window, { useParityGame, computeErrors, fmt });
