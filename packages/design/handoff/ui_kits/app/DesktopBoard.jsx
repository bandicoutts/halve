function DesktopBoard({ onSolve, theme, onToggleTheme }) {
  const { cells, errors, secs, solved, tap, undo, hint } = useParityGame(onSolve);
  return (
    <div className="lm-desktop">
      <div className="lm-desktop__bar">
        <Logo size={20} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="label" style={{ color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>No. 142 · Medium</span>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div className="lm-desktop__body">
        <div className="lm-desktop__main">
          <div style={{ textAlign: 'center' }}>
            <Eyebrow style={{ marginBottom: 8 }}>Elapsed</Eyebrow>
            <div className="timer" style={{ fontSize: 52, color: solved ? 'var(--correct)' : 'var(--fg-1)' }}>{fmt(secs)}</div>
          </div>
          <Board solution={SOLUTION} cells={cells} givens={GIVENS} edges={EDGES} errors={errors} onCellTap={tap} cell={62} gap={11} />
        </div>
        <aside className="lm-desktop__rail">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="flame" size={18} color="var(--accent)" />
              <span className="tnum" style={{ fontSize: 28, fontWeight: 500, color: 'var(--fg-1)' }}>41</span>
            </div>
            <div className="label" style={{ color: 'var(--fg-3)', marginTop: 8 }}>Day streak</div>
          </div>
          <hr className="lm-divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Button variant="secondary" full leftIcon="undo" onClick={undo}>Undo</Button>
            <Button variant="secondary" full leftIcon="hint" onClick={hint}>Hint</Button>
          </div>
          <hr className="lm-divider" />
          <p className="small" style={{ color: 'var(--fg-2)' }}>
            Fill the grid with fire and water. No more than two alike may touch, and every line is balanced three and three.
          </p>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span className="label" style={{ color: 'var(--fg-3)' }}>Equal</span>
            <EdgeSign sign="eq" size={24} />
            <span className="label" style={{ color: 'var(--fg-3)' }}>Unequal</span>
            <EdgeSign sign="ne" size={24} />
          </div>
        </aside>
      </div>
    </div>
  );
}
window.DesktopBoard = DesktopBoard;
