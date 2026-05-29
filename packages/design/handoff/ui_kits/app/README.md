# Parity — App UI Kit

A high-fidelity, interactive recreation of the **Parity** daily logic-puzzle app. Open
`index.html` and use the toolbar to switch **Mobile / Desktop board** and **light / dark**.
Every screen is a real click-through, not a storyboard.

The board is fully playable: tap a cell to cycle **empty → fire → water → empty**, with a live
timer, Undo, Hint, and real rule-violation highlighting (three-in-a-row and over-balanced lines
glow with the `wrong` ring). Fill the grid to the unique solution and the win state fires.

## Flow
`Auth → Onboarding (4 rules) → Home → Board → Win → Stats`, plus `Practice` from Home.

## File index

| File | What it does |
|---|---|
| `index.html` | Loads React + Babel, the tokens, and every component below |
| `kit.css` | Kit-only layout: phone frame, screens, cells, buttons, interaction states |
| `symbols.jsx` | `Fire`, `Water`, `Mark`, `Logo`, `EdgeSign` — theme-aware brand vectors |
| `icons.jsx` | `Icon` — Lucide line icons inlined as React components |
| `primitives.jsx` | `Button`, `IconButton`, `Segmented`, `ThemeToggle`, `TopBar`, `StatTile`, `Eyebrow` |
| `Board.jsx` | The 6×6 grid: given/placed/empty/error cells + `=`/`≠` edge signs |
| `data.jsx` | A valid 6×6 puzzle: `SOLUTION`, `GIVENS`, `EDGES`, `freshCells()` |
| `game.jsx` | `useParityGame()` hook — cells, timer, undo, hint, error + win detection |
| `Screen*.jsx` | One file per screen (Auth, Onboarding, Home, Board, Win, Practice, Stats) |
| `DesktopBoard.jsx` | The desktop window layout for the board |
