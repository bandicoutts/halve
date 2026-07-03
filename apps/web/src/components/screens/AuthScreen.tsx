"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HEADER_BAR, Wordmark } from "@/components/ui/Wordmark";

// ─── Shared bits ──────────────────────────────────────────────────────────────

/** Right-column brand mark. `waiting` = static, dimmed-left (link-sent state). */
function BrandColumn({ caption, waiting }: { caption: string; waiting?: boolean }) {
  return (
    <div className="hv-split-aside" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, padding: "24px 0" }}>
      <svg viewBox="0 0 200 200" style={{ width: "clamp(120px, 22vw, 250px)", overflow: "visible" }} aria-hidden="true">
        {waiting ? (
          <>
            <path d="M96 5 A95 95 0 0 0 96 195 Z" style={{ fill: "var(--accent)", opacity: 0.25 }} />
            <path d="M104 5 A95 95 0 0 1 104 195 Z" style={{ fill: "var(--symbol-b)" }} />
          </>
        ) : (
          <>
            <g style={{ animation: "driftL 3.4s ease-in-out infinite alternate" }}>
              <path d="M96 5 A95 95 0 0 0 96 195 Z" style={{ fill: "var(--accent)" }} />
            </g>
            <g style={{ animation: "driftR 3.4s ease-in-out infinite alternate" }}>
              <path d="M104 5 A95 95 0 0 1 104 195 Z" style={{ fill: "var(--symbol-b)" }} />
            </g>
          </>
        )}
      </svg>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.3em", color: "var(--fg-3)" }}>{caption}</div>
    </div>
  );
}

function AuthLayout({ form, brand }: { form: React.ReactNode; brand: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <header style={HEADER_BAR}>
        <Wordmark />
      </header>
      <div
        className="hv-split"
        style={{
          flex: 1,
          justifyContent: "center",
          width: "100%",
          padding: "0 clamp(24px, 5vw, 64px) 48px",
          animation: "fadeup 0.5s var(--ease-editorial) both",
        }}
      >
        <div className="hv-split-main" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 22, padding: "24px clamp(0px, 4vw, 64px) 24px 0" }}>
          {form}
        </div>
        <div className="hv-split-rule" />
        {brand}
      </div>
    </div>
  );
}

const KICKER: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.22em", color: "var(--fg-3)" };
const HEADLINE: React.CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontStyle: "italic",
  fontWeight: 500,
  fontSize: "clamp(40px, 6vw, 58px)",
  lineHeight: 1,
  margin: 0,
  letterSpacing: "-0.02em",
  textWrap: "balance",
};
const GHOST: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--fg-3)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  letterSpacing: "0.18em",
  padding: 0,
  transition: "color 0.18s ease",
  textAlign: "left",
  textDecoration: "none",
};

function GhostAction({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) {
  const hover = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = "var(--accent)"),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = "var(--fg-3)"),
  };
  return href ? (
    <Link href={href} style={GHOST} {...hover}>
      {children}
    </Link>
  ) : (
    <button type="button" style={GHOST} onClick={onClick} {...hover}>
      {children}
    </button>
  );
}

function EmailField({
  value,
  onChange,
  error,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  autoFocus?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
      <label htmlFor="auth-email" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em", color: "var(--fg-3)" }}>
        EMAIL
      </label>
      <input
        id="auth-email"
        type="email"
        placeholder="you@example.com"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        autoComplete="email"
        required
        aria-invalid={error ? true : undefined}
        style={{
          width: "100%",
          background: "var(--surface)",
          border: `1px solid ${error ? "var(--err)" : "var(--hairline)"}`,
          borderRadius: 12,
          padding: "16px 18px",
          fontSize: 16,
          color: "var(--fg-1)",
          fontFamily: "var(--font-sans)",
          outline: "none",
        }}
      />
      {error && <span style={{ fontSize: 13.5, color: "var(--err)", lineHeight: 1.4 }}>{error}</span>}
    </div>
  );
}

function SubmitButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        background: "var(--accent)",
        color: "var(--on-accent)",
        border: "none",
        borderRadius: 999,
        padding: "16px 40px",
        fontFamily: "var(--font-sans)",
        fontSize: 16,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.7 : 1,
        transition: "transform 0.2s ease",
        width: "fit-content",
        alignSelf: "flex-start",
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
    >
      {children}
    </button>
  );
}

// ─── Error normalisation ─────────────────────────────────────────────────────

const PASSWORD_MIN_LENGTH = 15;

function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("429"))
    return "Too many attempts. Wait a minute and try again.";
  if (lower.includes("user already registered"))
    return "An account with this email already exists. Try a magic link.";
  if (lower.includes("invalid login credentials"))
    return "That email and password do not match.";
  if (lower.includes("weak password") || lower.includes("password"))
    return `Use a password of at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (lower.includes("email not confirmed"))
    return "Please confirm your email first. Check your inbox.";
  return msg;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type AuthMode = "magic" | "password";
type PasswordIntent = "sign-in" | "create";

function PasswordField({
  value,
  onChange,
  error,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label htmlFor="auth-password" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em", color: "var(--fg-3)" }}>
        PASSWORD
      </label>
      <input
        id="auth-password"
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        aria-invalid={error ? true : undefined}
        style={{
          width: "100%",
          background: "var(--surface)",
          border: `1px solid ${error ? "var(--err)" : "var(--hairline)"}`,
          borderRadius: 12,
          padding: "16px 18px",
          fontSize: 16,
          color: "var(--fg-1)",
          fontFamily: "var(--font-sans)",
          outline: "none",
        }}
      />
      {error && <span style={{ fontSize: 13.5, color: "var(--err)", lineHeight: 1.4 }}>{error}</span>}
    </div>
  );
}

function AuthModeSwitch({
  mode,
  onModeChange,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}) {
  return (
    <div style={{ display: "inline-flex", width: "fit-content", border: "1px solid var(--hairline)", borderRadius: 999, padding: 3, gap: 3, background: "var(--surface)" }}>
      {[
        ["magic", "Email link"],
        ["password", "Password"],
      ].map(([key, label]) => {
        const active = mode === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onModeChange(key as AuthMode)}
            aria-pressed={active}
            style={{
              border: "none",
              borderRadius: 999,
              background: active ? "var(--fg-1)" : "transparent",
              color: active ? "var(--bg)" : "var(--fg-3)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              padding: "9px 14px",
              textTransform: "uppercase",
              transition: "background 0.16s, color 0.16s",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function AuthScreen({ initialError }: { initialError?: string | undefined }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("magic");
  const [passwordIntent, setPasswordIntent] = useState<PasswordIntent>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setNotice(null);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Enter your email to continue.");
      return;
    }
    setError(null);
    setNotice(null);
    setLoading(true);
    const supabase = createClient();
    const { error: supaError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (supaError) {
      setError(friendlyError(supaError.message));
      return;
    }
    setSent(true);
  }

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Enter your email to continue.");
      return;
    }
    if (!password) {
      setError("Enter your password to continue.");
      return;
    }
    if (passwordIntent === "create" && password.length < PASSWORD_MIN_LENGTH) {
      setError(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    setError(null);
    setNotice(null);
    setLoading(true);
    const supabase = createClient();
    const result =
      passwordIntent === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          });
    setLoading(false);

    if (result.error) {
      setError(friendlyError(result.error.message));
      return;
    }

    if (passwordIntent === "create" && !result.data.session) {
      setNotice(`Check ${email} to confirm your account.`);
      return;
    }

    router.push(passwordIntent === "create" ? "/onboarding" : "/");
    router.refresh();
  }

  // State B — link sent
  if (sent) {
    return (
      <AuthLayout
        brand={<BrandColumn caption="WAITING ON YOUR TAP" waiting />}
        form={
          <>
            <div style={{ ...KICKER, color: "var(--accent)" }}>LINK SENT</div>
            <h1 style={HEADLINE}>Check your email.</h1>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--fg-3)", maxWidth: "42ch" }}>
              We sent a sign-in link to{" "}
              <span style={{ color: "var(--fg-1)", fontWeight: 600 }}>{email}</span>. It expires in
              15 minutes.
            </p>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14, borderTop: "1px solid var(--hairline)", paddingTop: 18, marginTop: 8 }}>
              <GhostAction onClick={() => setSent(false)}>USE A DIFFERENT EMAIL</GhostAction>
              <GhostAction onClick={() => router.push("/play")}>PLAY NOW, SIGN IN LATER →</GhostAction>
            </div>
          </>
        }
      />
    );
  }

  // State C — expired/invalid link (initialError). State A otherwise.
  return (
    <AuthLayout
      brand={<BrandColumn caption="ONE PUZZLE · EVERY DAY" />}
      form={
        <form onSubmit={mode === "magic" ? handleMagicLink : handlePasswordAuth} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {initialError && (
            <div style={{ background: "var(--wrong-tint)", border: "1px solid var(--err)", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.2em", color: "var(--err)" }}>LINK EXPIRED</span>
              <span style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--fg-1)" }}>{initialError}</span>
            </div>
          )}
          {notice && (
            <div style={{ background: "var(--correct-tint)", border: "1px solid var(--correct)", borderRadius: 14, padding: "16px 18px", fontSize: 14.5, lineHeight: 1.55, color: "var(--fg-1)" }}>
              {notice}
            </div>
          )}
          <AuthModeSwitch mode={mode} onModeChange={switchMode} />
          <div style={KICKER}>{mode === "magic" ? "SIGN IN · EMAIL LINK" : passwordIntent === "sign-in" ? "SIGN IN · PASSWORD" : "CREATE ACCOUNT · PASSWORD"}</div>
          <h1 style={HEADLINE}>
            {initialError
              ? "Let’s try that again."
              : mode === "magic"
                ? "Sign in with an email link."
                : passwordIntent === "sign-in"
                  ? "Sign in with your password."
                  : "Create your account."}
          </h1>
          {!initialError && mode === "magic" && (
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--fg-3)", maxWidth: "40ch" }}>
              Enter your email and we&rsquo;ll send a sign-in link. Sign in to sync your streak and stats.
            </p>
          )}
          {!initialError && mode === "password" && (
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--fg-3)", maxWidth: "40ch" }}>
              {passwordIntent === "sign-in"
                ? "Use a saved password, or switch back to an email link any time."
                : `Use a passphrase of ${PASSWORD_MIN_LENGTH} characters or more.`}
            </p>
          )}
          {error && mode === "password" && (
            <span style={{ fontSize: 13.5, color: "var(--err)", lineHeight: 1.4 }}>{error}</span>
          )}
          <EmailField value={email} onChange={setEmail} error={mode === "magic" ? error : null} autoFocus={!initialError} />
          {mode === "password" && (
            <PasswordField
              value={password}
              onChange={setPassword}
              error={null}
              autoComplete={passwordIntent === "sign-in" ? "current-password" : "new-password"}
            />
          )}
          <SubmitButton disabled={loading}>
            {loading
              ? mode === "magic"
                ? "Sending…"
                : "Checking…"
              : mode === "magic"
                ? initialError
                  ? "Send a new link"
                  : "Send link"
                : passwordIntent === "sign-in"
                  ? "Sign in"
                  : "Create account"}
          </SubmitButton>
          {mode === "password" && (
            <GhostAction
              onClick={() => {
                setPasswordIntent(passwordIntent === "sign-in" ? "create" : "sign-in");
                setError(null);
                setNotice(null);
              }}
            >
              {passwordIntent === "sign-in" ? "CREATE AN ACCOUNT →" : "I ALREADY HAVE AN ACCOUNT →"}
            </GhostAction>
          )}
          <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 18, marginTop: 4 }}>
            <GhostAction onClick={() => router.push("/play")}>PLAY NOW, SIGN IN LATER →</GhostAction>
          </div>
        </form>
      }
    />
  );
}
