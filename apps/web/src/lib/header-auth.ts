import { createClient } from "@/lib/supabase/server";

export interface HeaderAuth {
  isAuthenticated: boolean;
  displayName?: string | undefined;
}

/**
 * Lightweight auth snapshot for the SiteHeader (sign-in link vs account menu).
 * Safe to call from any server page; swallows DB errors to a guest state.
 */
export async function getHeaderAuth(): Promise<HeaderAuth> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { isAuthenticated: false };
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    return { isAuthenticated: true, displayName: profile?.display_name ?? user.email ?? undefined };
  } catch {
    return { isAuthenticated: false };
  }
}
