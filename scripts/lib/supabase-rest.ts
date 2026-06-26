/**
 * Base Supabase REST headers for service-role requests (no realtime/WebSocket).
 * Pass `prefer` for write semantics, e.g. "resolution=merge-duplicates".
 */
export function createRestHeaders(serviceKey: string, prefer?: string): Record<string, string> {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}
