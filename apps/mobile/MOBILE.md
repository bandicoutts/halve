# MOBILE.md

## 01 Overview
**Creative North Star**: Warm paper meets precision logic — a daily puzzle that feels like a premium notebook, not a game app.

Platform stance: Cross-platform Material 3, rendered with Halve's own token layer. No Cupertino widgets. iOS nav bar is a custom bare-labelled implementation; Android uses `NavigationBar` with an accent-tint indicator pill.

---

## 02 Colors

### Semantic Token System
Colors are **never hardcoded in widget files**. All access goes through `HalveColors`, resolved via `context.halveColors` (the `HalveThemeContext` extension in `app_theme.dart`).

`HalveColors` is a `ThemeExtension<HalveColors>` registered on both `AppTheme.light()` and `AppTheme.dark()`. It exposes every semantic role — including Halve-specific ones (symbols, feedback tints, hairlines) that don't map onto Material's `ColorScheme`.

### Light (Paper)
| Token | Hex | Semantic role |
|---|---|---|
| `bg` | `#F6F1E8` | Page / scaffold background |
| `bgSunken` | `#EFE8DA` | Recessed areas (input fills, sunken sections) |
| `surface` | `#FBF8F1` | Cards, surface containers |
| `surfaceRaised` | `#FFFFFF` | Top-elevation surfaces |
| `fg1` | `#211C15` | Primary text |
| `fg2` | `#6B6253` | Secondary text, body |
| `fg3` | `#746B5A` | Tertiary / labels (AA-compliant) |
| `hairline` | `#E4DDCD` | Dividers, borders |
| `hairline2` | `#D6CCB8` | Stronger borders (button outlines) |
| `accent` | `#B03E12` | Primary CTA, active nav, focus |
| `accentStrong` | `#943210` | Pressed accent |
| `accentTint` | `#F8E4DC` | Accent fills (Android nav pill, tag backgrounds) |
| `onAccent` | `#FFFFFF` | Text/icons on accent fills |
| `symbolA` | `#D45220` | Solid disc game piece |
| `symbolB` | `#2A7A6E` | Ring game piece |
| `correct` | `#4E8A66` | Correct-fill feedback |
| `correctTint` | `#E2EFE5` | Correct-fill background |
| `wrong` | `#C2564B` | Wrong-fill feedback |
| `wrongTint` | `#F6E2DD` | Wrong-fill background |

### Dark (Ink)
| Token | Hex | Semantic role |
|---|---|---|
| `bg` | `#14110B` | Page / scaffold background |
| `bgSunken` | `#1A160F` | Recessed areas |
| `surface` | `#221D15` | Cards, surface containers |
| `surfaceRaised` | `#2A2418` | Top-elevation surfaces |
| `fg1` | `#EFE8D9` | Primary text |
| `fg2` | `#A79D89` | Secondary text, body |
| `fg3` | `#928873` | Tertiary / labels (AA-compliant) |
| `hairline` | `#352E20` | Dividers, borders |
| `hairline2` | `#4A4030` | Stronger borders |
| `accent` | `#E86B38` | Primary CTA, active nav, focus |
| `accentStrong` | `#D45220` | Pressed accent (same as symbolA) |
| `accentTint` | `#38180E` | Accent fills |
| `onAccent` | `#1A160F` | Text/icons on accent fills |
| `symbolA` | `#D45220` | Solid disc (identical in both themes) |
| `symbolB` | `#6EC8BC` | Ring (shifts to bright teal in dark) |
| `correct` | `#6FB389` | Correct-fill feedback |
| `wrong` | `#DC7A6E` | Wrong-fill feedback |

### Material ColorScheme Mapping
`AppTheme` also wires a `ColorScheme` for any Material widgets that need it:
- `primary` → `accent`
- `secondary` → `symbolB`
- `tertiary` → `symbolA`
- `error` → `wrong`
- `surface` → `surface`
- `onSurface` → `fg1`
- `surfaceContainerHighest` → `surfaceRaised`
- `surfaceContainerLow` → `bgSunken`
- `outline` → `hairline2`
- `outlineVariant` → `hairline`

---

## 03 Typography

**Single typeface: Space Grotesk** (variable font, bundled as asset, `wght` axis driven — no synthetic bold).

All styles are defined in `AppTypography` and exposed as named getters. **Never create a `TextStyle(fontSize: N)` directly in a widget file.**

| Token | Size | Weight | Tracking | Line height | Use |
|---|---|---|---|---|---|
| `display` | 56 | w500 | −0.02em | 1.05 | Hero display (win screen, large numbers) |
| `h1` | 36 | w500 | −0.02em | 1.05 | Screen titles |
| `h2` | 26 | w500 | −0.01em | 1.20 | Section headings |
| `h3` | 20 | w500 | −0.01em | 1.20 | Sub-headings, card titles |
| `body` | 16 | w400 | 0 | 1.50 | Primary body text |
| `small` | 14 | w400 | 0 | 1.45 | Secondary body, descriptions |
| `label` | 12 | w600 | +0.08em | 1.0 | Uppercase eyebrow labels (caller must uppercase) |
| `timer` | 44 | w500 | −0.01em | 1.0 | Play timer (tabular numerals) |
| `micro` | 11 | w500 | +0.06em | 1.0 | Bottom-nav labels, play-control labels, legend |

**Tabular numerals**: use `AppTypography.tabular(style)` for any number that changes value over time (timer, streak, stats counts) — prevents digit-shift jank.

**TextTheme role mapping** (for Material widgets):
- `displayLarge` → `display` + `fg1`
- `headlineLarge` → `h1` + `fg1`
- `headlineMedium` → `h2` + `fg1`
- `titleLarge` → `h3` + `fg1`
- `bodyLarge` → `body` + `fg2`
- `bodyMedium` → `small` + `fg2`
- `labelLarge` → `label` + `fg3`

---

## 04 Elevation

**Philosophy**: surface layering via `surfaceContainer` token stepping (`bg` → `surface` → `surfaceRaised`). Shadows used sparingly for interactive elevation.

Shadow tokens are in `HalveShadows` (ThemeExtension), resolved via `context.halveShadows`:
- `sm` — 1dp lift, hairline-weight. Use for cards sitting on `bg`.
- `md` — 4dp lift, soft spread. Use for elevated cards, sheets peeking up.
- `lg` — 18dp lift, wide spread. Use for full bottom sheets, modals.
- `cell` — compound (crisp 1dp + soft 6dp blur). Use for puzzle cells.

**Dark mode**: no shadow — use hairline borders + surface token stepping instead. `HalveShadows.dark` exists but should be used conservatively.

---

## 05 Components

### HalveButton
`lib/widgets/halve_button.dart`
- Pill shape (`AppRadii.fullR`), height 54dp, horizontal pad 28dp
- Primary variant: `accent` fill → `accentStrong` on press
- Secondary variant: transparent + `hairline2` border (1.5px) → `fg3` border on press
- Press feedback: `AnimatedScale` to 0.97 in 120ms (`easeOut`) — no ripple, no highlight
- Disabled: `Opacity(0.4)`
- Full-width via `full: true`

### HalveBottomNav
`lib/widgets/halve_bottom_nav.dart`
- 4 tabs: Today · Archive · Stats · Settings
- iOS: custom bare-labelled row, 52dp height, hairline top border, active state in `fg1`/`fg3`, micro typography
- Android: Material 3 `NavigationBar`, 64dp height, accent-tint indicator pill, hairline top border
- Navigation never overlays the play screen (full-screen route lives outside the shell)

### HalveTopBar
`lib/widgets/halve_top_bar.dart`
- 52dp height, flat on `bg`, hairline bottom border

### HalveButton (icon variant)
`lib/widgets/halve_icon_button.dart`
- Icon-only circular tap target

### ContentBox
`lib/widgets/content_box.dart`
- Surface-coloured container with standard padding

### Skeleton
`lib/widgets/skeleton.dart`
- Loading placeholder shimmer

### TapFade
`lib/widgets/tap_fade.dart`
- Low-level press feedback wrapper (fade opacity on tap, no scale)

### SafeScaffold
`lib/widgets/safe_scaffold.dart`
- Standard scaffold wrapper with SafeArea handling

### HalveBottomSheet
`lib/widgets/halve_bottom_sheet.dart`
- Modal bottom sheet in Halve styling

### Symbols
`lib/widgets/symbols.dart`
- `SymbolA` / `SymbolB` — geometric game piece widgets (solid disc amber, outlined ring teal)

### EqNeBadge
`lib/widgets/eq_ne_badge.dart`
- `=` / `≠` constraint badges rendered on cell edges

---

## 06 Spacing & Radii

**Spacing** (`AppSpacing`): 8-point scale — `s1`=4 · `s2`=8 · `s3`=12 · `s4`=16 · `s5`=24 · `s6`=32 · `s7`=40 · `s8`=48 · `s9`=64 · `s10`=80 · `s11`=96.
Standard screen horizontal padding: `s5` (24dp).

**Radii** (`AppRadii`): `sm`=6 · `md`=10 · `cell`=12 (puzzle cells) · `lg`=16 · `xl`=22 (sheets/large cards) · `full`=999 (pills/buttons).

---

## 07 Motion

**Core rule**: motion confirms, never decorates. Every animation guards `MediaQuery.disableAnimationsOf(context)`.

- Press response: `AnimatedScale` 0.97 in 120ms `easeOut` (no ripple)
- State transitions: `AnimatedContainer` / `AnimatedOpacity` for color/opacity shifts, ~160ms `easeInOut`
- Navigation: standard `MaterialPageRoute` transitions; play screen pushes full-screen
- Solve celebration: tactile, satisfying — not bouncy confetti
- `HapticFeedback.mediumImpact()` on solve; `HapticFeedback.lightImpact()` on cell cycle

---

## 08 Do's and Don'ts

**Do:**
- Always resolve color via `context.halveColors`
- Use `AppTypography.*` named getters for all text styles
- Use `AppSpacing.*` for all padding and gap values
- Use `AppRadii.*` for all corner radii
- Use `AppTypography.tabular(style)` for any numeric value that changes
- Supply `MediaQuery.disableAnimationsOf` guard on every animated widget
- Use `SafeArea` on all screens (except where `SafeScaffold` handles it)

**Don't:**
- Hardcode `Color(0xFF...)` anywhere outside `lib/theme/`
- Hardcode `TextStyle(fontSize: N)` in widget files
- Use teal (`symbolB`) as a UI accent — it is a game symbol only
- Add gradients, glassmorphism, or image backgrounds
- Use ripple/splash effects — set `splashFactory: NoSplash.splashFactory`
- Add bouncy `elasticOut` / `bounceOut` easing to functional UI
- Use M2 deprecated widget names (`BottomNavigationBar`, `TextTheme.bodyText2`, etc.)
- Hardcode safe area insets (`SizedBox(height: 44)`) — use `MediaQuery.paddingOf(context)`
