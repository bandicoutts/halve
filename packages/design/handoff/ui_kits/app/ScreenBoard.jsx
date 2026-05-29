function ScreenBoard({ onExit, onSolve, theme, onToggleTheme, difficulty = 'Medium' }) {
  const { cells, errors, secs, solved, tap, undo, hint } = useParityGame(onSolve);
  return (
    <div className="lm-screen">
      <TopBar
        left={<IconButton name="back" label="Back" size={40} onClick={onExit} />}
        title={<span style={{ fontWeight: 600 }}>No. 142</span>}
        right={<ThemeToggle theme={theme} onToggle={onToggleTheme} />}
      />
      <div className="lm-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', marginTop: 6 }}>
          <Eyebrow style={{ marginBottom: 8 }}>{difficulty}</Eyebrow>
          <div className="timer" style={{ color: solved ? 'var(--correct)' : 'var(--fg-1)' }}>{fmt(secs)}</div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Board solution={SOLUTION} cells={cells} givens={GIVENS} edges={EDGES} errors={errors} onCellTap={tap} cell={48} gap={8} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36, paddingTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <IconButton name="undo" label="Undo" onClick={undo} />
            <span className="label" style={{ color: 'var(--fg-3)' }}>Undo</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <IconButton name="hint" label="Hint" onClick={hint} />
            <span className="label" style={{ color: 'var(--fg-3)' }}>Hint</span>
          </div>
        </div>
      </div>
    </div>
  );
}
window.ScreenBoard = ScreenBoard;
