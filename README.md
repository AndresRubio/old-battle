# Warhammer 5th Edition — Army Builder

A web app for building **Warhammer Fantasy Battle 5th Edition (1996)** armies. Pick an
army, set a points limit, add units and characters, and a live **Muster Check** validates your
roster against the 5th-edition army-composition rules in real time.

![Editor with live validation](.) <!-- screenshot placeholder -->

## Features
- **14 armies**, fully playable end-to-end: The Empire, Orcs & Goblins, High Elves, Dwarfs,
  Bretonnia, Wood Elves, Dark Elves, Skaven, Undead, Vampire Counts, Chaos, Chaos Dwarfs,
  Lizardmen, and Dogs of War.
- **Bilingual UI (English / Spanish)** — toggle in the header; unit names, magic items, special
  rules and validation messages are all translated.
- **Live composition validation** (the headline feature): every change re-checks the 5th-edition
  rules and flags errors (red) and warnings (amber):
  - Total points over the limit
  - Characters over 50% of the points limit
  - Regiments below the required 25%
  - War machines + monsters over 25%
  - Missing or duplicate General
  - 0-1 / 0-X unit availability limits
  - Unit size below minimum / above maximum
  - Magic-item count over a character's rank allowance
  - More than one item of a restricted category (weapon/armour/ward/banner/bound spell)
  - Magic items on a non-character
- **Unit editor**: statline display, equipment options, wizard levels, magic-item selection
  (with `N / allowance` tracking), size stepper, set-as-General.
- **Points breakdown** bars for characters / regiments / war machines + monsters.
- **Save/load** rosters locally (browser `localStorage`) — no account, no backend.
- **Export / print** a clean plaintext army list (copy to clipboard or print).
- Polished, responsive parchment-and-gold theme; works on desktop and mobile.
- **Android build** via Capacitor — the offline web app is packaged into a native APK/AAB.

## The 5th edition composition rules (what the app enforces)
5th edition uses a **percentage-based** army composition (not the 6th-edition
Lords/Heroes/Core/Special/Rare slot system):

| Rule | Limit |
|---|---|
| Characters | up to **50%** of total points |
| Regiments (rank-and-file) | at least **25%** of total points |
| War machines + monsters (+ allies) | up to **25%** combined |
| General | exactly one, compulsory |
| Magic items per character | by **rank/count** — Champion / L1 wizard = 1, Hero / L2 = 2, Lord / L3 = 3, Wizard Lord = 4, BSB = 1 |
| Magic item categories | at most one weapon / armour / ward / banner / bound spell per character |

See [`research/composition-5e.md`](research/composition-5e.md) and
[`research/magic-items-5e.md`](research/magic-items-5e.md) for the sourced details, and
[`CITATIONS.md`](CITATIONS.md) for sources and a data-accuracy note.

## Getting started
Requires Node 18+ (developed on Node 24).

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm test         # run the Vitest suite (rules engine + data + state)
npm run build    # type-check and build for production (output in dist/)
npm run preview  # preview the production build
```

## How to use
1. On the home screen, click **New Army List**.
2. Choose an army, name your list, and set a points limit (presets: 500 / 1000 / 1500 / 2000 / 3000).
3. In the editor, add units from the picker on the right. Click a unit in **Your Army** to expand
   it and edit size, options, wizard level, magic items, or make it the General.
4. Watch the **Muster Check** panel — it updates live with points totals and rule violations.
5. Click **Export** to copy or print your list. Lists auto-save to your browser.

## Architecture
- **React + TypeScript + Vite** single-page app; no backend. Packaged for Android via Capacitor.
- `src/data/` — domain types and typed army data (one file per army in `armies/`, registered in
  `armies/index.ts`), shared magic items and unit options.
- `src/i18n/` — bilingual (EN/ES) string tables and name/label resolvers.
- `src/rules/` — the pure validation engine:
  - `validate.ts` — `validateRoster(roster, army): RuleViolation[]` (the heart of the app)
  - `points.ts` — points maths (per-entry, per-role, magic-item allowance)
  - `summary.ts` — derived totals/percentages for display
  - `exportText.ts` — plaintext army-list rendering
- `src/state/` — `rosterOps.ts` (pure roster transforms), `storage.ts` (localStorage),
  `useRosters.ts` (React hook).
- `src/components/` — `Home`, `NewList`, `Editor`, `SummaryPanel`, `UnitPicker`, `EntryRow`,
  `ExportDialog`.
- **Tests** (Vitest) cover the rules engine, army-data integrity, roster operations, summary and
  export. Run with `npm test`.

## Data accuracy & disclaimer
Army rosters, statlines and points are **period-accurate representative values** for the 4th/5th
edition army books; exact army-book points are not freely available, so some figures are flagged
`APPROX` in the `research/` notes. The **rules engine implements the exact 5th-edition composition
system**. See [`CITATIONS.md`](CITATIONS.md).

Warhammer and all associated names are trademarks of Games Workshop. This is an unofficial,
fan-made tool, not affiliated with or endorsed by Games Workshop.
