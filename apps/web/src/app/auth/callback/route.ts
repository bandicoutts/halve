import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SAFE_PATHS = ["/", "/play", "/practice", "/stats"];

function safeNext(next: string | null): string {
  if (!next) return "/";
  try {
    const url = new URL(next, "http://localhost");
    if (SAFE_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) {
      return url.pathname + url.search;
    }
  } catch { /* ignore */ }
  return "/";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=callback`);
}
