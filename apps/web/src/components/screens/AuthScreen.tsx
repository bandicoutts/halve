"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/symbols/Logo";
import { Button } from "@/components/ui/Button";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  height: 50,
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--hairline)",
  background: "var(--surface)",
  color: "var(--fg-1)",
  fontSize: 16,
  padding: "0 14px",
  fontFamily: "var(--font-sans)",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--fg-2)",
  marginBottom: 6,
};

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const signup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    /* Supabase auth will be wired here in next step */
    setSent(true);
  }

  async function handleMagicLink() {
    /* Supabase OTP will be wired here in next step */
    setSent(true);
  }

  if (sent) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", padding: "64px 24px 40px", animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
        <Logo size={24} />
        <div style={{ marginTop: 48 }}>
          <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--fg-1)", lineHeight: 1.2 }}>
            Check your email.
          </h1>
          <p style={{ marginTop: 14, fontSize: 16, color: "var(--fg-2)", lineHeight: 1.5, maxWidth: 300 }}>
            We sent a magic link to <strong style={{ color: "var(--fg-1)" }}>{email}</strong>. Click it to sign in.
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "var(--fg-3)", fontSize: 15, cursor: "pointer", fontFamily: "var(--font-sans)", padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}>
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "64px 24px 40px" }}>
        <Logo size={24} />
        <div style={{ marginTop: 48 }}>
          <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--fg-1)", lineHeight: 1.3, whiteSpace: "pre-line" }}>
            {signup ? "A quiet puzzle,\nevery day." : "Welcome back."}
          </h1>
          <p style={{ marginTop: 14, fontSize: 16, color: "var(--fg-2)", lineHeight: 1.5, maxWidth: 300 }}>
            {signup
              ? "Create an account to keep your streak and sync across devices."
              : "Sign in to pick up your streak where you left off."}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={LABEL_STYLE}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={INPUT_STYLE}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline)"; }}
            />
          </div>
          {!signup && (
            <div>
              <label style={LABEL_STYLE}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={INPUT_STYLE}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline)"; }}
              />
            </div>
          )}
          <Button variant="primary" full type="submit" style={{ marginTop: 4 }}>
            {signup ? "Create account" : "Sign in"}
          </Button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Button variant="secondary" full onClick={handleMagicLink}>
            Continue with magic link
          </Button>
        </div>

        <div style={{ flex: 1 }} />
        <p style={{ textAlign: "center", fontSize: 14, color: "var(--fg-3)", marginTop: 28 }}>
          {signup ? "Already play Parity?" : "New here?"}{" "}
          <button
            onClick={() => setMode(signup ? "signin" : "signup")}
            style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-sans)", padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            {signup ? "Sign in" : "Create an account"}
          </button>
        </p>
      </div>
    </div>
  );
}
