# Ratio Caps — Model-Count Mode — Design Spec

**Date:** 2026-06-22
**Status:** Design — ready to implement
**Predecessor:** `2026-06-21-army-ratio-rules-design.md` (the `ratioCaps` engine,
which counts *entries*). This pass adds an opt-in **model-count** mode so caps can
be expressed in models (sum of entry sizes) on either side of the ratio.

---

## Problem

The `ratioCaps` engine counts **entries** (regiments/units). Three real rules cap
by **models** and so can't be expressed today:

- **O&G Squig Hoppers** — "up to **5 per** Night Goblin unit in the army": the
  *limit* is on Squig Hopper **models**, derived from the **count of NG units**.
- **O&G Night Goblin Fanatics** — "up to **3** per Night Goblin unit": Fanatic
  **models** limited by NG **unit count**.
- **Skaven Censer Bearers** — "up to **half** the Plague Monk unit's size, **max
  10**": Censer **models** limited by Plague Monk **models** × 0.5, capped at 10.

So we need model-counting on the **capped side** (Hoppers, Fanatics, Censers all
count their own models) and on the **basis side** (Censers derive from Plague Monk
models). The existing engine already supports fractional `multiplier` (0.5) and
`absoluteMax` (10).

## Engine change (`src/data/types.ts` + `src/rules/validate.ts`)

Two new optional booleans on the existing `ratioCaps` shape:

```ts
ratioCaps?: {
  unitId: string
  labelEn: string; labelEs: string
  /** When true, the capped quantity is the SUM OF MODEL SIZES of `unitId`
   *  entries, not the number of entries. Default: count entries. */
  countModels?: boolean
  perPoints?: number
  perUnit?: {
    ids: string[]
    multiplier?: number
    minSize?: number
    /** When true, the basis is the SUM OF MODEL SIZES of qualifying entries,
     *  not the number of entries. Default: count entries. */
    countModels?: boolean
  }
  floor?: number
  absoluteMax?: number
}[]
```

Validator (`unit-ratio-max` block) changes — minimal:

1. **Capped quantity:**
   ```ts
   const count = cap.countModels
     ? roster.entries.filter(e => e.unitId === cap.unitId).reduce((s, e) => s + e.size, 0)
     : (countByUnit.get(cap.unitId) ?? 0)
   ```
   (The `if (count === 0) continue` guard still holds — zero models ⇒ skip.)

2. **Basis quantity (perUnit term):** the qualifying entries are already filtered
   by `ids` + `minSize`; replace `.length` with a size-aware reduce when
   `perUnit.countModels`:
   ```ts
   const qualifying = matchingEntries.length            // entries (default)
   const basis = pu.countModels
     ? matchingEntries.reduce((s, e) => s + e.size, 0)   // models
     : qualifying
   computed += (pu.multiplier ?? 1) * basis
   ```

3. **Round the computed limit down to an integer** before the `floor`/`absoluteMax`
   clamps, so "half of 15 = 7.5" yields an allowance of **7** and the message reads
   "only 7 allowed" (not 7.5):
   ```ts
   computed = Math.floor(computed)
   if (cap.floor !== undefined)       computed = Math.max(computed, cap.floor)
   if (cap.absoluteMax !== undefined) computed = Math.min(computed, cap.absoluteMax)
   ```
   `Math.floor` on already-integer entry/points terms is a no-op, so every existing
   ratio test stays green.

No message-string change: the existing bilingual "only N allowed (M in the list)"
wording is unit-agnostic and reads fine for models too.

## Data to wire

**Orcs & Goblins** (`orcsGoblins.ts`, existing `selectionRules` block — add a
`ratioCaps` key alongside the `dependencies` added last pass):
```ts
{ unitId: 'og-squig-hoppers', countModels: true,
  perUnit: { ids: ['og-night-goblins', 'og-night-goblin-nets-clubs'], multiplier: 5 },
  labelEn: 'Night Goblin Squig Hoppers', labelEs: <nameEs> },
{ unitId: 'og-night-goblin-fanatics', countModels: true,
  perUnit: { ids: ['og-night-goblins'], multiplier: 3 },
  labelEn: 'Night Goblin Fanatics', labelEs: <nameEs> },
```

**Skaven** (`skaven.ts`, existing `selectionRules` block — add to `ratioCaps`):
```ts
{ unitId: 'sk-plague-censer-bearers', countModels: true,
  perUnit: { ids: ['sk-plague-monks'], multiplier: 0.5, countModels: true },
  absoluteMax: 10,
  labelEn: 'Plague Censer Bearers', labelEs: <nameEs> },
```

### Judgment calls
1. **Squig Hoppers "per Night Goblin unit"** basis = base NG regiments
   (`og-night-goblins`, `og-night-goblin-nets-clubs`). Excludes Squig Hunters/Hoppers
   themselves and Fanatics.
2. **Fanatics** host = `og-night-goblins` only (the book bars Fanatics from Squig
   Hunter and Nets-&-Clubs units).
3. **Censer "half … max 10"** = `floor(0.5 × plague-monk-models)` then capped at 10.
   This is the army-wide total of Censer models vs. the army-wide total of Plague
   Monk models — a reasonable approximation of the per-unit rule (the engine has no
   unit-to-unit attachment concept). Documented as such.

## Testing
- `validate.test.ts` — extend the `ratio caps` fixture (or add a focused block) to
  cover: `countModels` on the capped side (limit by entry-count basis × multiplier,
  comparing summed models); `perUnit.countModels` basis with fractional multiplier
  rounding down (e.g. 15 monks → 7 censers OK, 8 flags); `absoluteMax` clamp (40
  monks → 20→ capped 10). Confirm a pure entry-count cap is unaffected (regression).
- `armies.test.ts` — named survive-assembly assertions: O&G Squig Hopper cap
  present with `countModels`; Skaven Censer cap present with `absoluteMax 10`.
  Existing integrity tests already validate the referenced ids.
- Gate: `npx tsc --noEmit -p tsconfig.app.json && npm test` green.
