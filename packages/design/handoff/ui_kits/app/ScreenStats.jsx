const DIST = [
  { t: '<2', h: 18 }, { t: '2–3', h: 44 }, { t: '3–4', h: 100, peak: true },
  { t: '4–5', h: 62 }, { t: '5–6', h: 30 }, { t: '6+', h: 14 },
];
// last 14 days: 1 solved, 0 missed
const HISTORY = [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1];

function ScreenStats({ onBack, theme, onToggleTheme }) {
  return (
    <div className="lm-screen">
      <TopBar
        left={<IconButton name="back" label="Back" size={40} onClick={onBack} />}
        title={<span style={{ fontWeight: 600 }}>Statistics</span>}
        right={<ThemeToggle theme={theme} onToggle={onToggleTheme} />}
      />
      <div className="lm-pad" style={{ flex: 1 }}>
        {/* profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6, marginBottom: 26 }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="user" size={24} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--fg-1)' }}>You</div>
            <div className="small" style={{ color: 'var(--fg-3)' }}>Playing since March 2026</div>
          </div>
        </div>

        {/* tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <StatTile value="41" label="Current streak" accent />
          <StatTile value="128" label="Solved" />
          <StatTile value="3:12" label="Average time" />
          <StatTile value="1:48" label="Best time" />
        </div>

        {/* distribution */}
        <div style={{ marginTop: 30 }}>
          <Eyebrow style={{ marginBottom: 16 }}>Solve time distribution</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 110 }}>
            {DIST.map((d) => (
              <div key={d.t} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 84 }}>
                  <div style={{ width: '100%', height: `${d.h}%`, borderRadius: '5px 5px 0 0', background: d.peak ? 'var(--accent)' : 'var(--accent-tint)' }} />
                </div>
                <span className="small tnum" style={{ color: 'var(--fg-3)', fontSize: 11 }}>{d.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* history strip */}
        <div style={{ marginTop: 30 }}>
          <Eyebrow style={{ marginBottom: 14 }}>Last 14 days</Eyebrow>
          <div style={{ display: 'flex', gap: 6 }}>
            {HISTORY.map((v, i) => (
              <div key={i} style={{
                flex: 1, height: 30, borderRadius: 5,
                background: v ? 'var(--accent)' : 'var(--bg-sunken)',
                border: v ? 'none' : '1px solid var(--hairline)', opacity: v ? 0.92 : 1,
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
window.ScreenStats = ScreenStats;
