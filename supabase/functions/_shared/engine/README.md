# Vendored engine — DO NOT EDIT

These files are a **generated copy** of `packages/engine/dist/*.js`, vendored here
because Supabase Edge Functions run on Deno and can only import code inside
`supabase/functions/`. Deno cannot resolve the pnpm `workspace:*` protocol, so the
engine is imported from this local copy instead of `@parity/engine`.

Regenerate after any change to `packages/engine`:

```sh
./scripts/sync-engine.sh
```
