# Taste redesign pass · 1 October 2026

Applied `redesign-existing-projects` to the web home, practice choices, shared buttons and result sharing. Flutter was outside this pass.

## Findings and changes

| Finding | Change |
|---|---|
| On phones the large animated home mark preceded the title and action, while showing nothing of the game. | Put the title and play action first. Replace the looping mark with a static, labelled example board. Desktop keeps a two-column composition. The illustration is independent of the daily puzzle and has one deduction-only solution. |
| Home accepted a saved solve duration but never displayed it. | Show the recorded completion time beside the review action when supplied. |
| The home loading skeleton used a different wrapping layout and could leave a vertical divider floating on small screens. | Use the same responsive layout classes for loading and loaded content. |
| Practice descriptions and play labels wrapped into inconsistent positions. Exact clue counts were hardcoded, although generation varies them. | Use a responsive grid for each choice, retain the editorial list, and remove the unsupported counts. |
| Shared button press effects relied on mouse/touch handlers mutating inline styles. A release outside the button could leave it scaled. | Use CSS interaction states for both links and buttons, with minimum heights that allow wrapping. Give secondary text controls a 44-pixel minimum height. |
| Share failures were swallowed and clipboard success had no visible confirmation. | Add a pending state and live feedback. Fall back to copy after a native-share failure; cancellation leaves the clipboard alone. |

## Design constraints

The existing Newsreader / Instrument Sans / Spline Sans Mono typography, warm paper and ink themes, amber accent and circle/ring symbols remain the basis of the design. These already give Halve a specific identity. No font replacement, decorative imagery, gradients or textures were warranted. New layout and control styles use the existing design tokens.

## Verification

- Home checked at 320, 390, 768 and 1280 pixels: no horizontal overflow; play action visible without scrolling. Paper and ink themes checked. Rules dialog opens, dismisses with Escape and returns focus to its trigger.
- Practice choices checked at phone and desktop widths. Selecting Easy reaches the correct difficulty route; the configured backend currently returns the unavailable state.
- Daily fallback solved through the existing hint control; completion overlay and buttons checked at 320 pixels without horizontal overflow. No solve was saved by this fallback.
- Type checking and production build pass. All 115 web unit tests pass, including five sharing tests. The illustration was checked with the engine for a unique solution reachable by deduction.
- Lint passes for changed files. Full-project lint still reports four errors in untouched files: `HomeUserContent.tsx`, `api/dev-login/route.ts`, `ThemeProvider.tsx` and `useFocusTrap.ts`, plus two existing hook warnings. Authenticated flows were not exercised. The in-app browser opened native sharing, but clipboard success and failure were verified with unit tests rather than a live share destination.
