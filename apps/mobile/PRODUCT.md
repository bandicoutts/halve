# PRODUCT.md

## Platform Targets
Both iOS and Android. Consistent cross-platform design language (Material 3 everywhere, adapted to feel premium rather than generic). No Cupertino-specific widgets — the design language is Halve's own, built on Material 3's token and theming infrastructure.

## Register
Product surface — the actual game app. Design serves the puzzle. The 6×6 grid is the hero of every game screen; everything else steps back.

## Users
Daily puzzle players who open the app once a day, during a pause moment (morning coffee, commute, lunch break). One-handed is common. They're not reading — they're thinking. State of mind: focused, calm, a little competitive with themselves. The solve moment is the emotional peak; everything else is in service of it.

## Brand Voice
Calm. Precise. Confident.

## Visual References
- **Things 3**: restrained palette, generous whitespace, one accent color used sparingly, nothing competes
- **Linear**: crisp hierarchy, monochromatic surface layers, controlled typographic scale
- **NYT Mini Crossword**: daily ritual feel, minimal chrome, the puzzle fills the screen

## Anti-References
- **Wordle clones**: overuse of modals, confetti on every solve, garish feedback colors
- **Generic puzzle apps**: gradient headers, icon tiles over every card, bottom sheet for everything, Inter everywhere
- **Duolingo**: gamification overload, encouragement copy that patronizes, bouncy animations on every tap

## Design Principles
1. **Grid-first**: the 6×6 puzzle board owns the screen. UI chrome exists only to serve it.
2. **One accent**: amber only — never teal as a UI accent, never more than one active accent per screen.
3. **Warmth over cold**: warm paper neutrals (light) and deep ink (dark); never cold grey, never blue-tinted surfaces.
4. **Confirm, don't celebrate**: motion is tactile and confirming — a satisfying solve animation, subtle haptics, restrained transitions. No bounce, no confetti.
5. **Restraint is the signature**: generous whitespace, no gradients, no glassmorphism, no decorative borders.

## Accessibility
- WCAG AA minimum; AA-Large for body text
- Dynamic Type: supported (no hardcoded font sizes outside `AppTypography`)
- Dark mode: full parity (Paper / Ink themes both complete)
- Reduced motion: all animations guarded with `MediaQuery.disableAnimationsOf`
- Color: never communicate correctness by color alone (symbol shape always differentiates A from B)
