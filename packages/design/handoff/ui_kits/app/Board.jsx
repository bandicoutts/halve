// The 6×6 puzzle board — the hero of every game screen.
// solution: 6×6 of 0(fire)/1(water). cells: 6×6 of null|0|1. givens: 6×6 bool.
// edges: [{type:'h'|'v', r, c, sign:'eq'|'ne'}]. errors: Set of "r-c".

function Board({ solution, cells, givens, edges = [], errors, onCellTap, cell = 50, gap = 9, readOnly }) {
  const N = 6;
  const span = (i) => i * (cell + gap);
  const total = N * cell + (N - 1) * gap;
  const err = errors || new Set();

  function renderSymbol(v) {
    if (v === 0) return <Fire size={cell * 0.6} />;
    if (v === 1) return <Water size={cell * 0.6} />;
    return null;
  }

  return (
    <div className="lm-board" style={{ width: total, height: total }}>
      {/* cells */}
      <div
        className="lm-board__grid"
        style={{ gridTemplateColumns: `repeat(${N}, ${cell}px)`, gap }}
      >
        {cells.map((row, r) => row.map((v, c) => {
          const given = givens[r][c];
          const isErr = err.has(`${r}-${c}`);
          const filled = v !== null && v !== undefined;
          const cls = ['lm-cell'];
          if (given) cls.push('is-given');
          else if (filled) cls.push('is-placed');
          else cls.push('is-empty');
          if (isErr) cls.push('is-error');
          return (
            <button
              key={`${r}-${c}`}
              className={cls.join(' ')}
              style={{ width: cell, height: cell }}
              disabled={given || readOnly}
              onClick={() => onCellTap && onCellTap(r, c)}
            >
              {renderSymbol(v)}
            </button>
          );
        }))}
      </div>

      {/* edge signs */}
      {edges.map((e, i) => {
        const cx = e.type === 'h'
          ? span(e.c) + cell + gap / 2
          : span(e.c) + cell / 2;
        const cy = e.type === 'h'
          ? span(e.r) + cell / 2
          : span(e.r) + cell + gap / 2;
        return (
          <div key={i} style={{
            position: 'absolute', left: cx, top: cy,
            transform: 'translate(-50%, -50%)', zIndex: 3,
          }}>
            <EdgeSign sign={e.sign} size={Math.max(20, cell * 0.42)} />
          </div>
        );
      })}
    </div>
  );
}

window.Board = Board;
