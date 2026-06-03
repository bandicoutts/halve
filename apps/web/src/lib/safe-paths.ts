const EXACT_PATHS: readonly string[] = [
  "/",
  "/play",
  "/practice",
  "/stats",
  "/archive",
  "/tutorial",
  "/onboarding",
];

// Explicit date pattern prevents arbitrary /play/<anything> from being
// redirected to; /play exact-match still passes via EXACT_PATHS above.
const PLAY_DATE_RE = /^\/play\/\d{4}-\d{2}-\d{2}$/;

export function isSafePath(pathname: string): boolean {
  if (EXACT_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  return PLAY_DATE_RE.test(pathname);
}

export const SAFE_PATHS = EXACT_PATHS;
