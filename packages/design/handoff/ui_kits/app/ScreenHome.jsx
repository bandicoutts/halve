function ScreenHome({ onPlay, onPractice, onStats, onHowTo, theme, onToggleTheme, streak = 41, dayNo = 142 }) {
  return (
    <div className="lm-screen">
      <TopBar
        left={<Logo size={20} />}
        right={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconButton name="stats" label="Stats" size={40} onClick={onStats} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>}
      />
      <div className="lm-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 6 }}>
          <Icon name="flame" size={18} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--fg-1)' }}>
            <span className="tnum" style={{ fontWeight: 600 }}>{streak}</span> day streak
          </span>
        </div>

        {/* title block */}
        <div style={{ marginTop: 30 }}>
          <Eyebrow>Wednesday · May 28</Eyebrow>
          <h1 className="display" style={{ marginTop: 10, fontSize: 44 }}>Today&rsquo;s puzzle</h1>
        </div>

        {/* hero card */}
        <div className="lm-card" style={{ marginTop: 26, padding: 26, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="label" style={{ color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>No. {dayNo}</span>
            <span className="label" style={{ color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>Medium</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '22px 0 24px' }}>
            <Board solution={SOLUTION} cells={freshCells()} givens={GIVENS} edges={EDGES} readOnly cell={38} gap={7} />
          </div>
          <Button variant="primary" full onClick={onPlay}>Play today</Button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <Button variant="secondary" full onClick={onPractice}>Practice</Button>
          <Button variant="secondary" full onClick={onHowTo}>How to play</Button>
        </div>
      </div>
    </div>
  );
}
window.ScreenHome = ScreenHome;
