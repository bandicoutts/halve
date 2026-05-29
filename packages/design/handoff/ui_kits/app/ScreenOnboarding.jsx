function OnbCell({ v, size = 44, mark }) {
  return (
    <div style={{ position: 'relative' }}>
      <div className={`lm-cell ${v === null ? 'is-empty' : 'is-placed'}`} style={{ width: size, height: size }}>
        {v === 0 && <Fire size={size * 0.6} />}
        {v === 1 && <Water size={size * 0.6} />}
      </div>
      {mark && (
        <span style={{
          position: 'absolute', right: -7, top: -7, width: 20, height: 20, borderRadius: '50%',
          background: mark === 'ok' ? 'var(--correct)' : 'var(--wrong)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
          boxShadow: 'var(--shadow-sm)',
        }}>{mark === 'ok' ? '\u2713' : '\u2717'}</span>
      )}
    </div>
  );
}

function MiniRow({ children, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>{children}</div>
      {badge && (
        <span style={{
          marginLeft: 6, width: 26, height: 26, borderRadius: '50%',
          background: badge === 'ok' ? 'var(--correct-tint)' : 'var(--wrong-tint)',
          color: badge === 'ok' ? 'var(--correct)' : 'var(--wrong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700,
        }}>{badge === 'ok' ? '\u2713' : '\u2717'}</span>
      )}
    </div>
  );
}

const ONB_STEPS = [
  {
    n: '01', title: 'Two symbols',
    body: 'Every cell holds either fire or water. Tap a cell to place one, tap again to switch.',
    demo: (
      <MiniRow>
        <OnbCell v={0} /><OnbCell v={1} /><OnbCell v={null} /><OnbCell v={0} />
      </MiniRow>
    ),
  },
  {
    n: '02', title: 'Never three in a row',
    body: 'No more than two of the same symbol may sit side by side — across a row or down a column.',
    demo: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MiniRow badge="bad"><OnbCell v={0} size={38} /><OnbCell v={0} size={38} /><OnbCell v={0} size={38} /></MiniRow>
        <MiniRow badge="ok"><OnbCell v={0} size={38} /><OnbCell v={0} size={38} /><OnbCell v={1} size={38} /></MiniRow>
      </div>
    ),
  },
  {
    n: '03', title: 'Balanced lines',
    body: 'Each row and each column holds an equal count — three fire and three water.',
    demo: (
      <MiniRow badge="ok">
        <OnbCell v={0} size={38} /><OnbCell v={1} size={38} /><OnbCell v={0} size={38} />
        <OnbCell v={1} size={38} /><OnbCell v={1} size={38} /><OnbCell v={0} size={38} />
      </MiniRow>
    ),
  },
  {
    n: '04', title: 'Read the signs',
    body: 'A sign between two cells links them: equal means the same symbol, unequal means opposites.',
    demo: (
      <div style={{ display: 'flex', gap: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <OnbCell v={0} size={40} /><div style={{ margin: '0 -3px', zIndex: 2 }}><EdgeSign sign="eq" size={22} /></div><OnbCell v={0} size={40} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <OnbCell v={0} size={40} /><div style={{ margin: '0 -3px', zIndex: 2 }}><EdgeSign sign="ne" size={22} /></div><OnbCell v={1} size={40} />
        </div>
      </div>
    ),
  },
];

function ScreenOnboarding({ onDone, onBack }) {
  const [step, setStep] = React.useState(0);
  const s = ONB_STEPS[step];
  const last = step === ONB_STEPS.length - 1;
  return (
    <div className="lm-screen">
      <TopBar
        left={<IconButton name="back" label="Back" size={40} onClick={() => (step === 0 ? onBack && onBack() : setStep(step - 1))} />}
        title={<span className="label" style={{ color: 'var(--fg-3)' }}>How to play</span>}
        right={<span className="small" style={{ color: 'var(--fg-3)' }} onClick={onDone}><span className="lm-link">Skip</span></span>}
      />
      <div className="lm-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div key={step} className="lm-screen" style={{ overflow: 'visible', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 38 }}>
          <div style={{ display: 'flex', justifyContent: 'center', minHeight: 130, alignItems: 'center' }}>{s.demo}</div>
          <div>
            <div className="label" style={{ color: 'var(--accent)' }}>{s.n} &nbsp;/&nbsp; 04</div>
            <h2 className="h1" style={{ marginTop: 12 }}>{s.title}</h2>
            <p className="p" style={{ marginTop: 12, maxWidth: 320 }}>{s.body}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 7 }}>
            {ONB_STEPS.map((_, i) => (
              <span key={i} style={{
                width: i === step ? 22 : 7, height: 7, borderRadius: 999,
                background: i === step ? 'var(--accent)' : 'var(--hairline-2)', transition: 'all 0.2s',
              }} />
            ))}
          </div>
          <Button variant="primary" onClick={() => (last ? onDone() : setStep(step + 1))}>
            {last ? 'Start playing' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
window.ScreenOnboarding = ScreenOnboarding;
