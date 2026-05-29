function ShareCard({ time, streak, dayNo }) {
  return (
    <div className="lm-card" style={{ padding: '20px 22px', width: '100%', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Logo size={17} />
        <span className="small tnum" style={{ color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>No. {dayNo}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6, marginBottom: 16 }}>
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} style={{ aspectRatio: '1', borderRadius: 3, background: 'var(--accent)', opacity: 0.9 }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 26 }}>
        <div>
          <div className="tnum" style={{ fontSize: 22, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1 }}>{time}</div>
          <div className="label" style={{ color: 'var(--fg-3)', marginTop: 6 }}>Time</div>
        </div>
        <div>
          <div className="tnum" style={{ fontSize: 22, fontWeight: 500, color: 'var(--accent)', lineHeight: 1 }}>{streak}</div>
          <div className="label" style={{ color: 'var(--fg-3)', marginTop: 6 }}>Streak</div>
        </div>
      </div>
    </div>
  );
}

function ScreenWin({ time = '2:47', streak = 41, dayNo = 142, onShare, onStats, onHome }) {
  return (
    <div className="lm-screen">
      <TopBar
        left={<IconButton name="close" label="Close" size={40} onClick={onHome} />}
        title={<span className="label" style={{ color: 'var(--fg-3)' }}>Complete</span>}
        right={<span style={{ width: 40 }} />}
      />
      <div className="lm-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, animation: 'lm-settle 0.5s cubic-bezier(0.34,1.4,0.5,1)' }}>
          <Mark size={64} />
        </div>
        <h1 className="display" style={{ textAlign: 'center', fontSize: 46 }}>Solved</h1>
        <p className="p" style={{ textAlign: 'center', marginTop: 8, marginBottom: 26 }}>
          in <span className="tnum" style={{ color: 'var(--fg-1)', fontWeight: 600 }}>{time}</span> · day {streak} of your streak
        </p>

        <ShareCard time={time} streak={streak} dayNo={dayNo} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 26 }}>
          <Button variant="primary" full leftIcon="share" onClick={onShare}>Share result</Button>
          <Button variant="secondary" full onClick={onStats}>See your stats</Button>
        </div>
      </div>
    </div>
  );
}
window.ScreenWin = ScreenWin;
window.ShareCard = ShareCard;
