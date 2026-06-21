# Warhammer 5th Edition Army Builder — SPEC

## Vision
A web app to build **Warhammer Fantasy Battle 5th Edition (1996)** armies, modeled on
[old-world-builder.com](https://old-world-builder.com/) but for the 5th edition ruleset.

The user picks an army, sets a points limit, adds units/characters/magic items, and the app
**validates the roster against 5th edition army-composition rules and raises warnings** (points
over limit, character % caps exceeded, too few Core/regiment points, magic-item allowance
exceeded, 0-1 / 0-X unit limits broken, etc.). It must feel polished and "surprise with a nice app."

## Target ruleset: Warhammer Fantasy Battle 5th Edition
- Released 1996 ("Warhammer: The Game of Fantasy Battles", the box with Bretonnia vs Lizardmen).
- **Army composition is PERCENTAGE-based** (NOT the Lords/Heroes/Core/Special/Rare slot system
  from 6th ed). The research tasks below must pin down the exact 5th edition percentages.
  Known/typical 5th ed rules to VERIFY via research:
  - Characters: up to 50% of total points.
  - At least 25% must be spent on "regiments"/core troops (VERIFY exact figure).
  - Caps on monsters, war machines, etc. (VERIFY).
  - Magic item points allowances scale with character type (general/wizard/hero) — VERIFY.
  - General is compulsory; army size brackets (e.g. up to 2000 pts) gate how many
    Lords/Wizards/heroes allowed — VERIFY exact brackets.
- Armies to support (5th ed army books / Warhammer Armies series):
  Empire, Bretonnia, Dwarfs, High Elves, Wood Elves, Dark Elves, Orcs & Goblins,
  Skaven, Undead, Chaos (Hordes of Chaos), Lizardmen, Chaos Dwarfs.
  Start with 2-3 fully-statted armies (Empire, Orcs & Goblins, High Elves) then expand.

## Tech stack (decided)
- **React + TypeScript + Vite** SPA (mirrors old-world-builder's PWA approach).
- State: lightweight (React context or Zustand). Persistence: `localStorage` (rosters saved locally).
- Styling: clean component CSS or Tailwind — pick one and stay consistent.
- No backend. All army data ships as typed data files in `src/data/`.
- Must `npm run build` cleanly and `npm run dev` run without console errors.

## Data model (target shape — refine as needed)
- `Army`: id, name, composition rules (percentages, brackets), list of `UnitProfile`s,
  list of `MagicItem`s available.
- `UnitProfile`: id, name, category (character/regiment/monster/warmachine/...), points cost
  (base + per-model), stat line (M WS BS S T W I A Ld), unit size min/max, equipment options,
  special rules, 0-1/0-X limits.
- `Roster`: army id, points limit, list of selected entries (unit + chosen options + magic items).
- `RuleViolation`: severity (error/warning), message, which rule.

## Rules engine (the heart of the app)
A pure function `validateRoster(roster, army): RuleViolation[]` that checks every 5th ed
composition rule and returns warnings/errors. This MUST be covered by unit tests (Vitest).

## UI (modeled on old-world-builder)
1. Home: list saved rosters + "New Army List".
2. New list: choose army + name + points limit.
3. Editor: left = roster summary with running points total + live validation warnings;
   main = unit picker by category; clicking a unit adds it and opens its options
   (size, equipment, magic items for characters).
4. Each entry editable/removable; points recompute live.
5. Export/print roster as text. Save to localStorage.

## Definition of done (completion criteria)
- `npm install && npm run build` succeeds with no errors.
- `npm test` (Vitest) passes, with rules-engine tests covering the main 5th ed composition rules.
- At least 3 armies fully playable end-to-end in the UI.
- Live validation warnings work (over points, character cap, min core, magic item allowance, 0-1 limits).
- Save/load rosters via localStorage works.
- README documents how to run, and CITATIONS.md lists the sources used for 5th ed rules/points.
- App looks polished (consistent design, responsive, no broken layout).
