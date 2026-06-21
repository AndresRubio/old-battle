# Army Ratio Caps & Dependencies — Design Spec

**Date:** 2026-06-21
**Status:** Design — pending spec review → writing-plans handoff
**Predecessor:** `2026-06-20-army-selection-rules.md` (Phase 2 extraction). This spec
implements the work that extraction explicitly **deferred to a follow-up plan**:
per-points and per-unit-count **ratio caps**, plus clean **special-character
dependencies**.

---

## Problem

The Phase 2 extraction confirmed the rules engine already enforces per-unit `max`
(`unit-max`), combined caps over variant sets (`unit-group-max`), composition %,
General rules, and all magic-item rules. It deliberately left two recurring,
mechanically-checkable constraint families unmodeled because they need a richer
data shape than a flat `max`:

1. **Ratio caps** — a unit's maximum count is *derived*, not fixed:
   - from the **points limit** (Wood Elf Treeman: 1 per 1,000 pts, hard max 3;
     VC Spectral Maidens: 1 per 1,000 pts), and/or
   - from the **number of other qualifying units** in the roster (Lizardmen Temple
     Guard / Terradons per Slann; High Elf & Dark Elf bolt throwers tied to core
     infantry regiments; VC Vampire Bats tied to other Undead regiments).

2. **Special-character dependencies** — a model may only be taken when another
   specific model is also present (Hellebron needs a Witch Elf regiment; Isabella
   needs Vlad; Gotrek and Felix must be fielded together).

Today these live as English-only `specialRules` *text* on the units — visible to a
reader but invisible to the Muster Check, so an illegal list passes validation.

## Goals

- Add a **declarative** `ratioCaps` and `dependencies` data shape to
  `SelectionRules`, validated by two generic engine blocks. No per-army logic.
- Enforce exactly the constraints whose shape is **non-conditional and
  expressible** with the model (the seven ratio caps across six armies + four dependency entries
  below).
- Keep the engine **pure** and the messages **bilingual**, matching the existing
  `unit-group-max` block.

## Non-goals (stay deferred — documented, not enforced)

- **Conditional caps / waivers** that depend on opponent or on *which* model is
  General: Chaos Harpies (unless Beastman Warlord general), HE Shadow Warriors
  (count waived when fighting Dark Elves), **VC Krell** ("only when Kemmler is the
  General" — the "*as General*" predicate is outside the simple "is present"
  model). The builder has no opponent and no "is-General-of-type" concept.
- **Model-count-based ratios** (as opposed to entry/regiment-count): Skaven Censer
  Bearers ≤ ½ the Plague Monk *models* (max 10), and similar. The model counts
  *entries*, not models. Out of scope; revisit only if the model is extended.
- **Race-matching** (Orcs & Goblins), unit-scaling (Trolls/Snotlings, Stegadons/
  Salamanders, Dwarf Slayers ≤ warrior regiments), and **allies**. The first two
  could later reuse `ratioCaps` (entry-count form); they are excluded here to keep
  the increment focused. Allies need a whole subsystem — permanently out of scope.

---

## Data model

Two optional arrays added to the existing `SelectionRules` interface in
`src/data/types.ts` (alongside `unitGroupCaps`):

```ts
export interface SelectionRules {
  unitGroupCaps?: { ids: string[]; max: number; labelEn: string; labelEs: string }[]

  /**
   * Ratio caps: the maximum count of `unitId` is derived from the points limit
   * and/or the number of other qualifying entries in the roster. Validated as
   * rule `unit-ratio-max` (warning).
   */
  ratioCaps?: {
    /** The capped unit (the entry whose count is limited). */
    unitId: string
    labelEn: string
    labelEs: string
    /** Adds floor(pointsLimit / perPoints) to the limit. Inactive when pointsLimit === 0. */
    perPoints?: number
    /** Adds multiplier × (qualifying entry count) to the limit. */
    perUnit?: {
      /** Unit ids whose entries are counted toward the limit. */
      ids: string[]
      /** Default 1. (e.g. 2 for "up to 2 per regiment".) */
      multiplier?: number
      /** Only count entries with size ≥ minSize (default: count every entry). */
      minSize?: number
    }
    /** Lower bound — the army is always entitled to at least this many. */
    floor?: number
    /** Hard ceiling regardless of the computed limit. */
    absoluteMax?: number
  }[]

  /**
   * Prerequisites: `unitId` may only be included when at least one of
   * `requiresAnyOf` is also present in the roster. Validated as rule
   * `unit-requires` (warning).
   */
  dependencies?: {
    unitId: string
    requiresAnyOf: string[]
    labelEn: string
    labelEs: string
  }[]
}
```

Army assembly in `src/data/armies/index.ts` spreads `{...army}` through
`withMagicItems`/`withCommandGroups`, so these new fields survive to `getArmy(id)`
with no assembly change (same as `unitGroupCaps` did in Phase 2).

---

## Validator algorithm

Two new blocks in `validateRoster` (`src/rules/validate.ts`), placed immediately
after the existing `unit-group-max` block (~line 166). Both push **warnings**,
matching the whole selection-rule family (`unit-max`, `unit-group-max`). The
existing `countByUnit` Map is reused; the `perUnit.minSize` filter requires
counting entries directly (size-aware), so that term iterates `roster.entries`.

### `unit-ratio-max`

```
for each cap in army.selectionRules?.ratioCaps ?? []:
  count = countByUnit.get(cap.unitId) ?? 0
  if count === 0: continue            // nothing of this unit → nothing to flag

  pointsTermActive = cap.perPoints !== undefined && limit > 0
  unitTermActive   = cap.perUnit !== undefined

  // A cap with only a points term and no points limit cannot be computed —
  // skip it, consistent with the composition-% checks gated on `limit > 0`.
  if !pointsTermActive && !unitTermActive && cap.floor === undefined: continue

  computed = 0
  if pointsTermActive: computed += Math.floor(limit / cap.perPoints)
  if unitTermActive:
    qualifying = number of roster.entries e where
        cap.perUnit.ids.includes(e.unitId)
        && (cap.perUnit.minSize === undefined || e.size >= cap.perUnit.minSize)
    computed += (cap.perUnit.multiplier ?? 1) * qualifying

  // floor raises, then absoluteMax caps. No cap below sets BOTH; if a future one
  // does, absoluteMax wins (it is applied last), which is the intended priority.
  if cap.floor !== undefined:       computed = Math.max(computed, cap.floor)
  if cap.absoluteMax !== undefined: computed = Math.min(computed, cap.absoluteMax)

  if count > computed:
    push warning 'unit-ratio-max':
      EN: `${labelEn}: only ${computed} allowed (${count} in the list).`
      ES: `${labelEs}: sólo se permiten ${computed} (hay ${count} en la lista).`
```

`floor` only *raises the ceiling* — it never creates a positive obligation. The
`count === 0` short-circuit means an unused unit is never flagged, so `floor`'s
sole effect is "taking up to `floor` of this unit is always legal."

Worked cases:
- **Treeman** (`perPoints:1000, absoluteMax:3`) at 3,000 pts → `min(3, 3) = 3`; at
  5,000 pts → `min(5, 3) = 3`. At pointsLimit 0 → skipped.
- **Spectral Maidens** (`perPoints:1000`, "full" pts) at 2,500 pts →
  `floor(2.5) = 2`; at 1,500 pts → `floor(1.5) = 1` (the half-bracket boundary —
  a test case).
- **Temple Guard** (`perUnit:[lz-slann]`) with 2 Slann → 2; with 1 Slann and 2
  Temple Guard units → flagged (2 > 1).
- **Terradons** (`perUnit:[lz-slann], floor:1`) with **1 Terradon unit and 0
  Slann** → computed `max(0,1)=1`, so 1 is allowed (not flagged); a 2nd would flag.
- **HE bolt throwers** (`perUnit:[archers,spearmen,sea-guard], floor:2`) with **2
  bolt throwers and 1 core regiment** → computed `max(1,2)=2`, allowed; a 3rd flags.
- **DE bolt throwers** (`perUnit:{ids, multiplier:2, minSize:10}`) with two 10+
  regiments → 4. A 9-model regiment does **not** count toward the limit.
- **Vampire Bats** (`perUnit:[zombies,skeletons,grave-guard,ghouls,wight-cavalry]`)
  with 3 such units → 3.

(No cap in the tables is `floor`-only; a hypothetical floor-only cap would still
run via the line-137 guard and flag `count > floor`, which is the desired
behaviour.)

### `unit-requires`

```
for each dep in army.selectionRules?.dependencies ?? []:
  if (countByUnit.get(dep.unitId) ?? 0) === 0: continue   // unit not taken
  satisfied = dep.requiresAnyOf.some(id => (countByUnit.get(id) ?? 0) > 0)
  if !satisfied:
    push warning 'unit-requires':
      EN: `${labelEn}: requires ${prereqNames} in the army.`
      ES: `${labelEs}: requiere ${prereqNames} en el ejército.`
```

`prereqNames` = the `requiresAnyOf` ids resolved through `name(id)` (the existing
localised unit-name helper at `validate.ts:29`), joined with " / ".

---

## Per-army data (confirmed unit ids)

### `ratioCaps`
| Army | `unitId` | Shape | Book |
|---|---|---|---|
| Wood Elves | `we-treeman` | `perPoints:1000, absoluteMax:3` | p.68 |
| Vampire Counts | `vc-spectral-maidens` | `perPoints:1000` | (1/1,000 full pts) |
| Vampire Counts | `vc-vampire-bats` | `perUnit:{ids:['vc-zombies','vc-skeletons','vc-grave-guard','vc-ghouls','vc-wight-cavalry']}` | unit text |
| Lizardmen | `lz-temple-guard` | `perUnit:{ids:['lz-slann']}` **and remove static `max:1`** | p.72 |
| Lizardmen | `lz-terradons` | `perUnit:{ids:['lz-slann']}, floor:1` | p.72 |
| High Elves | `he-bolt-thrower` | `perUnit:{ids:['he-archers','he-spearmen','he-sea-guard']}, floor:2` | p.79 |
| Dark Elves | `de-bolt-thrower` | `perUnit:{ids:['de-warriors','de-spearmen','de-crossbowmen','de-city-guard','de-corsairs'], multiplier:2, minSize:10}` | p.54 |

Notes:
- **HE "Lancers" = `he-spearmen`** (data unit name: "High Elf Spearmen (Lancers)").
- **Lizardmen Temple Guard**: the current static `max:1` is correct only for
  1-Slann armies; replace it with the per-Slann ratio cap (delete the `max` field
  on `lz-temple-guard` so it isn't double-counted by `unit-max`). Removal is safe:
  Lizardmen has no `unitGroupCaps`, so nothing else references the field. The plan
  must check for and update any existing test that asserts Temple Guard `unit-max`
  behaviour.
- `labelEn`/`labelEs` for each cap should reuse the unit's own `name`/`nameEs`
  (the plan pulls the exact `nameEs` from each data file).

### `dependencies`
| Army | `unitId` | `requiresAnyOf` | Book |
|---|---|---|---|
| Dark Elves | `de-hellebron` | `['de-witch-elves']` | "Requires a Witch Elf regiment" |
| Undead | `ud-isabella-von-carstein` | `['ud-vlad-von-carstein']` | "only if the army also includes Vlad" |
| Dwarfs | `dw-gotrek` | `['dw-felix']` | "must be fielded with Felix" |
| Dwarfs | `dw-felix` | `['dw-gotrek']` | "must be fielded with Gotrek" |

**Excluded on purpose:** `vc-krell` ("only when Kemmler is the *General*") — the
"as General" predicate is conditional, deferred with the other conditional caps.
`ud-krell` states no such dependency in the book/data, so it gets none.

---

## i18n

No new `STRINGS` keys: messages are built inline with `es ? … : …` ternaries
exactly like every other validation message. `labelEs` lives in the data; prereq
unit names are localised through the existing `name()` helper.

## Testing

- **`src/rules/validate.test.ts`** — new cases:
  - `unit-ratio-max`: perPoints cap (Treeman at/over `absoluteMax`; skipped at
    pointsLimit 0), per-unit cap (Temple Guard per Slann), `floor` (Terradons with
    0 Slann → 1; HE bolt throwers min 2), `multiplier`+`minSize` (DE bolt throwers
    — a 9-model regiment does **not** count), and a passing (no-violation) case.
  - `unit-requires`: Hellebron without Witch Elves → warning; with → none;
    Gotrek without Felix → warning; mutual case.
- **`src/data/armies/armies.test.ts`** — integrity: every `ratioCaps.unitId`,
  `ratioCaps.perUnit.ids`, and `dependencies.{unitId,requiresAnyOf}` must
  reference a real unit id in that army (mirrors the existing `unitGroupCaps`
  invariant). For mutual dependencies (Gotrek↔Felix), assert both directions are
  encoded — a one-sided "must be fielded together" is a likely data-entry error.
- **Existing Lizardmen test fallout** (see Temple Guard note above): grep for any
  test asserting `lz-temple-guard` `unit-max` and update it to the ratio cap.
- Empire fixtures are untouched (no Empire ratio/dependency data), so the
  hard-coded `summary`/`points`/`exportText`/`rosterOps` fixtures don't move.

## Verification gate

`npx tsc --noEmit -p tsconfig.app.json && npm test` (this repo has no git; "commit"
steps in the plan are these verification checkpoints).

---

## Execution shape (for writing-plans)

Two independent tasks, each shippable on its own:

- **Task A — Ratio caps:** `ratioCaps` type + `unit-ratio-max` validator + tests,
  wired into Wood Elves, Vampire Counts (×2), Lizardmen (×2, incl. removing
  `lz-temple-guard.max`), High Elves, Dark Elves.
- **Task B — Dependencies:** `dependencies` type + `unit-requires` validator +
  tests, wired into Dark Elves, Undead, Dwarfs (×2).

If only the minimum is wanted, ship Task A and re-defer Task B.
