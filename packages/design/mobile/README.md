# Halve — mobile design loop

Living workspace for the **mobile app** design (iOS + Android, future `apps/mobile`).
Unlike `../handoff/` — which is a **frozen, read-only** snapshot of the web design
bundle — this folder is **active**: it changes every round.

## How the loop works

Two collaborators, one contract:

- **Claude Design** (the `parity-design` skill / claude.ai project) produces visual
  artifacts — prototypes, screens, motion.
- **Claude Code** (this repo) critiques them, turns gaps into decisions, and keeps the
  contract honest against the real tokens and engine.

Each round:

1. Claude Design exports a zip of the latest prototype.
2. Claude Code unpacks it into `prototype/`, commits it (so every round is in git
   history), and reviews the vendored copy.
3. Claude Code updates `BRIEF.md` (locked decisions, native rules, surface status) and
   `OPEN.md` (questions going back out).
4. You carry `OPEN.md` (or a slice of it) to Claude Design as the next instruction.

**Both Claudes read `BRIEF.md` first.** That's what keeps you from pasting context every
time — you only ever hand over *the one new thing*.

## Files

| File | Owner | What it is |
|---|---|---|
| `BRIEF.md` | Claude Code | The durable contract: locked decisions, native (app-vs-web) rules, surface inventory + status. Source of truth for "what we've agreed." |
| `OPEN.md` | Claude Code | Open questions / decisions needed, as concrete choices. This is the message bus going **out** to Claude Design + you. |
| `prototype/` | Claude Design | The current vendored prototype. Replaced wholesale each round; git holds the history. |

## Boundaries

- **Tokens are canonical elsewhere.** `packages/design/styles/tokens.css` wins over
  anything in `prototype/halve.css`. The prototype is a pixel/interaction spec, not the
  theme source.
- **Don't ship the prototype.** It's React-in-HTML over CDN Babel — a design artifact.
  Real code lands in `apps/mobile` and recreates the output, it doesn't copy the harness.
- **Voice/content rules** live in `../handoff/README.md` (sentence case, `m:ss` times,
  no emoji, tone words). Reuse them; don't restate them here.
