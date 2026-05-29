// Shared UI primitives for the Parity app kit.

function Button({ variant = 'primary', children, onClick, full, leftIcon, style }) {
  return (
    <button
      className={`lm-btn lm-btn--${variant}`}
      onClick={onClick}
      style={{ width: full ? '100%' : undefined, ...style }}
    >
      {leftIcon && <Icon name={leftIcon} size={19} />}
      {children}
    </button>
  );
}

function IconButton({ name, label, onClick, active, size = 48 }) {
  return (
    <button
      className={`lm-iconbtn${active ? ' is-active' : ''}`}
      onClick={onClick}
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <Icon name={name} size={size * 0.44} />
    </button>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="lm-seg" role="tablist">
      {options.map((o) => (
        <button
          key={o}
          role="tab"
          aria-selected={value === o}
          className={`lm-seg__opt${value === o ? ' is-active' : ''}`}
          onClick={() => onChange(o)}
        >{o}</button>
      ))}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button
      className="lm-themetoggle"
      onClick={onToggle}
      aria-label={dark ? 'Switch to light' : 'Switch to dark'}
      style={{ justifyContent: dark ? 'flex-end' : 'flex-start' }}
    >
      <span className="lm-themetoggle__knob">
        {dark ? <Water size={16} fill="var(--symbol-water)" /> : <Fire size={16} fill="var(--symbol-fire)" />}
      </span>
    </button>
  );
}

function TopBar({ left, title, right }) {
  return (
    <header className="lm-topbar">
      <div className="lm-topbar__side">{left}</div>
      <div className="lm-topbar__title">{title}</div>
      <div className="lm-topbar__side lm-topbar__side--right">{right}</div>
    </header>
  );
}

function StatTile({ value, label, accent }) {
  return (
    <div className="lm-stattile">
      <div className="lm-stattile__v tnum" style={accent ? { color: 'var(--accent)' } : undefined}>{value}</div>
      <div className="label lm-stattile__l">{label}</div>
    </div>
  );
}

function Eyebrow({ children, style }) {
  return <div className="label" style={{ color: 'var(--fg-3)', ...style }}>{children}</div>;
}

Object.assign(window, { Button, IconButton, Segmented, ThemeToggle, TopBar, StatTile, Eyebrow });
