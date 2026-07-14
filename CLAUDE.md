# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Old Battle" — a **Warhammer Fantasy Battle 5th Edition (1996)** army builder. Pick an army, set a
points limit, add units/characters/magic items, and a live **Muster Check** validates the roster
against the 5th-edition percentage-based composition rules. React + TypeScript + Vite SPA, **no
backend** — rosters persist in `localStorage`. The build is wrapped into a native Android app via
Capacitor. The UI and all army data are **bilingual (English / Spanish)**.

Unofficial fan project; not affiliated with Games Workshop.

## Commands

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm test             # vitest run — full suite (rules engine + data integrity + state)
npm run test:watch   # vitest watch mode
npm run build        # tsc -b && vite build (type-check THEN bundle → dist/)
npm run preview      # serve the production build

# Run a single test file / single test:
npx vitest run src/rules/validate.test.ts
npx vitest run src/rules/validate.test.ts -t "characters over 50%"

# Android (Capacitor) — builds web first, then syncs/opens the native project:
npm run android      # build + cap sync android + cap open android
```

There is **no linter** configured and **no git repo** here — don't assume `git`/ESLint commands work.

## Architecture

Data flows one way: **typed army data → pure rules engine → React components**. The rules engine is
the heart of the app and is fully unit-tested; keep it pure (no React, no DOM, no `localStorage`).

- **`src/data/`** — the domain.
  - `types.ts` — all domain types (`Army`, `UnitProfile`, `Roster`, `RosterEntry`, `RuleViolation`,
    `MagicItem`) **plus** the rule constants: `MAGIC_ITEM_ALLOWANCE`, `RESTRICTED_CATEGORIES`,
    `STANDARD_5E_COMPOSITION`. Read this first — everything else builds on it.
  - `armies/*.ts` — one file per army (16 total: Empire, Orcs & Goblins, High Elves, Dwarfs,
    Bretonnia, Wood/Dark Elves, Skaven, Undead, Vampire Counts, Chaos, Chaos Dwarfs, Lizardmen,
    Dogs of War, Halflings, Norse). Each exports a single `Army` constant.
  - `armies/index.ts` — **assembly point**. `ARMIES` runs every army through `withCommandGroups`
    (auto-adds champion/standard/musician to multi-model regiments — do NOT hand-add these per unit)
    and `withMagicItems` (each army's pool = `COMMON_MAGIC_ITEMS` + `ARMY_MAGIC_ITEMS[army.id]`).
    Use `getArmy(id)` / `ARMY_OPTIONS`. **New armies must be imported and added to the `ARMIES`
    array here**, or they won't exist to the app.
  - `magicItems.ts` — `COMMON_MAGIC_ITEMS` (all armies) and `ARMY_MAGIC_ITEMS` (race-restricted,
    Dwarf runes, special-character items keyed by army id).
  - `unitOptions.ts` — shared `EquipmentOption`s (command group, wizard levels, BSB, shield).
- **`src/rules/`** — pure functions only.
  - `validate.ts` — `validateRoster(roster, army, lang): RuleViolation[]`. The core. Checks points
    limit, General, the four percentage caps, 0-X unit limits, `unitGroupCaps`, unit size, and all
    magic-item rules. Messages are built inline with `es ? '…' : '…'` ternaries.
  - `points.ts` — points maths (`entryPoints`, `rosterTotalPoints`, `pointsByRole`,
    `magicItemAllowance`) and the `findUnit`/`findMagicItem` lookups.
  - `equipment.ts` — equipment-combination validation (weapon/armour/shield/mount "slots"); matches
    options by **substring keyword** on the option name (handles both EN and ES names).
  - `summary.ts` — derived totals/percentages for the UI. `exportText.ts` — plaintext list render.
- **`src/state/`** — `rosterOps.ts` (pure roster transforms), `storage.ts` (localStorage CRUD),
  `useRosters.ts` (React hook wrapping storage via `useSyncExternalStore`).
- **`src/i18n/lang.ts`** — bilingual layer. `useLang()` hook + `t(key, lang)` for UI strings,
  `unitName`/`armyName`/`magicItemName`/`optionText`/`ruleText` resolvers (all fall back to the
  English value), and label maps (`ROLE_LABEL`, `STAT_LABEL`, `CATEGORY_LABEL`). `rulePhrases.ts`
  holds Spanish translations of special-rule tags.
- **`src/components/`** — `App.tsx` is a hand-rolled router (a `useState` view union: home / new /
  editor — no router library). `Editor.tsx` is the main screen; `SummaryPanel.tsx` shows the live
  Muster Check.

## Domain rules (5th edition) you must preserve

5th edition uses **percentage composition**, not 6th-edition slots:
- Characters ≤ **50%**, Regiments ≥ **25%**, War machines + chariots ≤ **25%**, Monsters ≤ **25%**
  (war machines and monsters are *separate* caps), exactly **one General** (required).
- Several armies override these in their `composition` (e.g. Bretonnia 75% characters / 0 war
  machines; Dogs of War 35% characters, 65% regiments; Lizardmen 0 war machines). Per-army values in
  the army file win over `STANDARD_5E_COMPOSITION`.
- **Magic items are limited by COUNT, not points**: allowance by character rank (Champion / Wizard
  L1 = 1, Hero / L2 = 2, Lord / L3 = 3, Wizard L4 = 4); wizard-level and BSB options adjust it via
  `magicItemSlotsDelta`. At most one item per *restricted* category (weapon/armour/ward/banner/
  bound spell). Each magic item is **unique per army** unless flagged `duplicable` (Dispel Scrolls,
  Familiars, Chaos Armour).

## Conventions

- **Bilingual everywhere.** Any new user-facing string needs both `en` and `es` (add to `STRINGS`
  in `lang.ts`). Data objects carry `nameEs`/`descEs`/`nameEs` that fall back to English. Validation
  messages take a `lang` arg and branch inline.
- **Movement is in inches.** The source army books give Movement in centimetres; values in the data
  files are already converted (8cm→3", 10→4, 12→5, 15→6, 20→8). Spanish stat columns map
  M/HA/HP/F/R/H/I/A/L → M/WS/BS/S/T/W/I/A/Ld.
- Army data is **transcribed from the Spanish 4th/5th-edition Games Workshop army books** (see the
  header comment in each `armies/*.ts` for the exact book/page citation). The **rules engine is
  exact**; some individual points values are period-accurate approximations (see `CITATIONS.md`).
- Points may be **fractional** (e.g. shield at 0.5/model) — don't assume integers.
- `armies.test.ts` runs integrity checks across **every** army in `ARMIES` (unique ids, a possible
  General, no leaked army-restricted magic items, etc.), so a malformed new army fails the suite.

## Reference docs

`README.md`, `SPEC.md`, `PROGRESS.md` (build log), `CITATIONS.md` (sources + data-accuracy note),
`research/` (sourced rules/army notes), and `docs/superpowers/{plans,specs}/` (design docs for
recent rules-fidelity work). Note: `README.md` still says "three armies" — there are now 14.
