import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingScreen } from "@/components/screens/OnboardingScreen";

const SAFE_PATHS = ["/", "/play", "/practice", "/stats", "/archive"];

function safeNext(raw: string | undefined): string {
  if (!raw) return "/";
  try {
    const url = new URL(raw, "http://localhost");
    if (SAFE_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) {
      return url.pathname + url.search;
    }
  } catch { /* ignore */ }
  return "/";
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.display_name) redirect(next);

  return <OnboardingScreen next={next} />;
}
