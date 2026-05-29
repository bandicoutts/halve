function ScreenAuth({ mode = 'signup', onAuthed, onToggleMode }) {
  const signup = mode === 'signup';
  return (
    <div className="lm-screen">
      <div className="lm-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 64 }}>
        <Logo size={24} />
        <div style={{ marginTop: 48 }}>
          <h1 className="h1" style={{ whiteSpace: 'pre-line' }}>{signup ? 'A quiet puzzle,\nevery day.' : 'Welcome back.'}</h1>
          <p className="p" style={{ marginTop: 14, maxWidth: 300 }}>
            {signup
              ? 'Create an account to keep your streak and sync across devices.'
              : 'Sign in to pick up your streak where you left off.'}
          </p>
        </div>

        <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="lm-fieldlabel">Email</label>
            <input className="lm-input" type="email" placeholder="you@example.com" />
          </div>
          {!signup && (
            <div>
              <label className="lm-fieldlabel">Password</label>
              <input className="lm-input" type="password" placeholder="••••••••" />
            </div>
          )}
          <Button variant="primary" full onClick={onAuthed} style={{ marginTop: 4 }}>
            {signup ? 'Create account' : 'Sign in'}
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '26px 0' }}>
          <hr className="lm-divider" style={{ flex: 1 }} />
          <span className="label" style={{ color: 'var(--fg-3)' }}>or</span>
          <hr className="lm-divider" style={{ flex: 1 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button variant="secondary" full leftIcon="apple" onClick={onAuthed}>Continue with Apple</Button>
          <Button variant="secondary" full leftIcon="mail" onClick={onAuthed}>Continue with email link</Button>
        </div>

        <div style={{ flex: 1 }} />
        <p className="small" style={{ textAlign: 'center', marginTop: 28 }}>
          {signup ? 'Already play Parity?' : 'New here?'}{' '}
          <span className="lm-link" onClick={onToggleMode}>{signup ? 'Sign in' : 'Create an account'}</span>
        </p>
      </div>
    </div>
  );
}
window.ScreenAuth = ScreenAuth;
