"use server";
import { createClient } from "@/lib/supabase/server";
import { DISPLAY_NAME_MAX } from "@/lib/display-name";

interface SaveDisplayNameResult {
  ok: boolean;
  /** Set when the name failed validation (empty after trim, or too long). */
  invalid?: boolean;
}

/**
 * Persists a user's display name. The name is trimmed and length-validated
 * server-side (1–40 chars) so an over-length or whitespace-only value can't
 * reach the DB via a direct POST that bypasses the client Input's maxLength.
 */
export async function saveDisplayName(name: string): Promise<SaveDisplayNameResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  if (typeof name !== "string") return { ok: false, invalid: true };
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > DISPLAY_NAME_MAX) {
    return { ok: false, invalid: true };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, display_name: trimmed }, { onConflict: "id" });

  if (error) {
    console.error("saveDisplayName: upsert failed:", error.message);
    return { ok: false };
  }

  return { ok: true };
}
