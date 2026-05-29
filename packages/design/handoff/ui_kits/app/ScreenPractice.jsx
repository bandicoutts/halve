const DIFFS = {
  Easy: { blurb: 'More given cells and signs to lean on. A gentle, unhurried solve.', givens: '14 given', time: '~2 min' },
  Medium: { blurb: 'A balanced board — enough to start, room to think.', givens: '11 given', time: '~4 min' },
  Hard: { blurb: 'Few givens. Pure deduction, no shortcuts. For the patient.', givens: '8 given', time: '~6 min' },
};

function ScreenPractice({ onStart, onBack, theme, onToggleTheme }) {
  const [diff, setDiff] = React.useState('Medium');
  const d = DIFFS[diff];
  return (
    <div className="lm-screen">
      <TopBar
        left={<IconButton name="back" label="Back" size={40} onClick={onBack} />}
        title={<span style={{ fontWeight: 600 }}>Practice</span>}
        right={<ThemeToggle theme={theme} onToggle={onToggleTheme} />}
      />
      <div className="lm-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginTop: 14 }}>
          <h1 className="h1">A fresh puzzle,<br />any time.</h1>
          <p className="p" style={{ marginTop: 12, maxWidth: 300 }}>No streak, no pressure. Pick a difficulty and play as many as you like.</p>
        </div>

        <div style={{ marginTop: 32 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Difficulty</Eyebrow>
          <Segmented options={['Easy', 'Medium', 'Hard']} value={diff} onChange={setDiff} />
        </div>

        <div className="lm-card" key={diff} style={{ marginTop: 22, padding: 24, animation: 'lm-fade 0.22s ease' }}>
          <div style={{ display: 'flex', gap: 22 }}>
            <div>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: 'var(--fg-1)' }}>6×6</div>
              <div className="label" style={{ color: 'var(--fg-3)', marginTop: 6 }}>Grid</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--fg-1)' }}>{d.givens.split(' ')[0]}</div>
              <div className="label" style={{ color: 'var(--fg-3)', marginTop: 6 }}>Given</div>
            </div>
            <div>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: 'var(--fg-1)' }}>{d.time}</div>
              <div className="label" style={{ color: 'var(--fg-3)', marginTop: 6 }}>Typical</div>
            </div>
          </div>
          <p className="p" style={{ marginTop: 18, fontSize: 15 }}>{d.blurb}</p>
        </div>

        <div style={{ flex: 1 }} />
        <Button variant="primary" full onClick={() => onStart(diff)} style={{ marginTop: 24 }}>Start {diff.toLowerCase()} puzzle</Button>
      </div>
    </div>
  );
}
window.ScreenPractice = ScreenPractice;
