#!/usr/bin/env bash
# Regenerate the vendored engine used by Supabase Edge Functions.
#
# Edge Functions run on Deno and can only import code inside supabase/functions/.
# Deno cannot resolve the pnpm `workspace:*` protocol, so we vendor the engine's
# built ESM output here. Re-run this whenever packages/engine changes.
#
#   ./scripts/sync-engine.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/supabase/functions/_shared/engine"

echo "Building @parity/engine…"
pnpm --filter @parity/engine build >/dev/null

echo "Vendoring built JS into $DEST…"
mkdir -p "$DEST"
# Clear previously vendored JS (keep hand-written README.md / package.json marker).
rm -f "$DEST"/*.js
# Runtime JS only — no test files (they import vitest) and no type/map files.
find "$ROOT/packages/engine/dist" -maxdepth 1 -name '*.js' ! -name '*.test.js' \
  -exec cp {} "$DEST/" \;

# Mark the vendored copy as ESM so Node-based tooling parses it correctly
# (Deno ignores this and treats .js as ESM regardless).
printf '{ "type": "module" }\n' > "$DEST/package.json"

echo "Done. Vendored files:"
ls "$DEST"
