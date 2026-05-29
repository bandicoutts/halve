const { useState } = React;

function StatusBar() {
  return (
    <div className="lm-statusbar">
      <span className="tnum">9:41</span>
      <div className="lm-statusbar__dots">
        <span style={{ fontSize: 12, fontWeight: 600 }}>Parity</span>
        <span className="lm-statusbar__bat" />
      </div>
    </div>
  );
}

function DesktopWin({ time, onAgain, theme, onToggleTheme }) {
  return (
    <div className="lm-desktop" style={{ maxWidth: 560 }}>
      <div className="lm-desktop__bar">
        <Logo size={20} />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div style={{ padding: '48px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ animation: 'lm-settle 0.5s cubic-bezier(0.34,1.4,0.5,1)' }}><Mark size={64} /></div>
        <h1 className="display" style={{ fontSize: 48, marginTop: 14 }}>Solved</h1>
        <p className="p" style={{ marginTop: 8, marginBottom: 28 }}>in <span className="tnum" style={{ color: 'var(--fg-1)', fontWeight: 600 }}>{time}</span> · day 41 of your streak</p>
        <div style={{ width: 320 }}><ShareCard time={time} streak={41} dayNo={142} /></div>
        <div style={{ display: 'flex', gap: 12, marginTop: 26 }}>
          <Button variant="primary" leftIcon="share">Share result</Button>
          <Button variant="secondary" onClick={onAgain}>Play again</Button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState('light');
  const [layout, setLayout] = useState('phone');
  const [screen, setScreen] = useState('auth');
  const [authMode, setAuthMode] = useState('signup');
  const [winTime, setWinTime] = useState('2:47');
  const [boardKey, setBoardKey] = useState(0);
  const [dWin, setDWin] = useState(false);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  const dark = theme === 'dark';

  React.useEffect(() => {
    document.body.classList.toggle('kit-dark', dark);
  }, [dark]);

  const startBoard = () => { setBoardKey((k) => k + 1); setScreen('board'); };

  let phoneScreen = null;
  if (screen === 'auth') phoneScreen = <ScreenAuth mode={authMode} onAuthed={() => setScreen('onboarding')} onToggleMode={() => setAuthMode((m) => (m === 'signup' ? 'signin' : 'signup'))} />;
  else if (screen === 'onboarding') phoneScreen = <ScreenOnboarding onDone={() => setScreen('home')} onBack={() => setScreen('home')} />;
  else if (screen === 'home') phoneScreen = <ScreenHome theme={theme} onToggleTheme={toggleTheme} onPlay={startBoard} onPractice={() => setScreen('practice')} onStats={() => setScreen('stats')} onHowTo={() => setScreen('onboarding')} />;
  else if (screen === 'board') phoneScreen = <ScreenBoard key={boardKey} theme={theme} onToggleTheme={toggleTheme} onExit={() => setScreen('home')} onSolve={(t) => { setWinTime(t); setScreen('win'); }} />;
  else if (screen === 'win') phoneScreen = <ScreenWin time={winTime} onShare={() => {}} onStats={() => setScreen('stats')} onHome={() => setScreen('home')} />;
  else if (screen === 'practice') phoneScreen = <ScreenPractice theme={theme} onToggleTheme={toggleTheme} onBack={() => setScreen('home')} onStart={startBoard} />;
  else if (screen === 'stats') phoneScreen = <ScreenStats theme={theme} onToggleTheme={toggleTheme} onBack={() => setScreen('home')} />;

  return (
    <div className={`lm-stage${dark ? ' dark' : ''}`}>
      <div className="lm-toolbar">
        <span className="lm-toolbar__brand"><Mark size={22} /> Parity kit</span>
        <div className="lm-toolbar__seg">
          <button className={layout === 'phone' ? 'is-active' : ''} onClick={() => setLayout('phone')}>Mobile</button>
          <button className={layout === 'desktop' ? 'is-active' : ''} onClick={() => { setLayout('desktop'); setDWin(false); setBoardKey((k) => k + 1); }}>Desktop board</button>
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      {layout === 'phone' ? (
        <div className={`lm-phone${dark ? ' dark' : ''}`}>
          <StatusBar />
          {phoneScreen}
          <div className="lm-home-ind" />
        </div>
      ) : (
        <div className={dark ? 'dark' : ''} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          {dWin
            ? <DesktopWin time={winTime} theme={theme} onToggleTheme={toggleTheme} onAgain={() => { setDWin(false); setBoardKey((k) => k + 1); }} />
            : <DesktopBoard key={boardKey} theme={theme} onToggleTheme={toggleTheme} onSolve={(t) => { setWinTime(t); setDWin(true); }} />}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
