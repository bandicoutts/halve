"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/symbols/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GhostLink } from "@/components/ui/GhostLink";

interface OnboardingScreenProps {
  next: string;
}

export function OnboardingScreen({ next }: OnboardingScreenProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a name, or skip.");
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("id", user.id);
    setLoading(false);
    if (updateError) {
      setError("Couldn't save — try again.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <div style={{ flexShrink: 0, padding: "22px 24px 0" }}>
        <Link href="/" style={{ display: "inline-block", textDecoration: "none" }}>
          <Logo size={20} />
        </Link>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 340 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: "var(--fg-1)",
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            What should we call you?
          </h1>
          <p
            style={{
              fontSize: 14.5,
              lineHeight: 1.5,
              color: "var(--fg-2)",
              margin: "10px 0 24px",
            }}
          >
            Shown on your stats page.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <Input
              label="Display name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={error}
              autoFocus
              autoComplete="name"
            />
            <Button variant="primary" full type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save name"}
            </Button>
          </form>
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 24px 26px",
        }}
      >
        <GhostLink onClick={() => router.push(next)}>Skip for now</GhostLink>
      </div>
    </div>
  );
}
