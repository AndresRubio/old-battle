# Army Ratio Caps & Dependencies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce two WFB-5e list-building constraint families the Muster Check currently ignores — ratio caps (unit count derived from points and/or other units) and special-character dependencies — via declarative data + two generic validator blocks.

**Architecture:** Add `ratioCaps` and `dependencies` to the existing `SelectionRules` type; add two warning-severity blocks to the pure `validateRoster` engine that read them (mirroring the existing `unit-group-max` block); populate per-army data. No per-army logic, no UI changes (the existing SummaryPanel already renders all warnings).

**Tech Stack:** React + TypeScript + Vite SPA, Vitest. Pure rules engine in `src/rules/`. **No git in this repo** — every "Commit" step below means run the verification gate `npx tsc --noEmit -p tsconfig.app.json && npm test` and confirm green before moving on.

**Spec:** `docs/superpowers/specs/2026-06-21-army-ratio-rules-design.md`

**Conventions to honor** (from CLAUDE.md):
- Bilingual messages built inline with `es ? '…' : '…'` (no new `STRINGS` keys).
- Engine stays pure (no React/DOM/localStorage).
- Points may be fractional; counts are integers.
- Reuse the existing `countByUnit` Map and `name(unitId)` helper in `validate.ts`.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/data/types.ts` | Add `ratioCaps` + `dependencies` to `SelectionRules` (~line 143) | A, B |
| `src/rules/validate.ts` | Add `unit-ratio-max` + `unit-requires` blocks after the `unit-group-max` block (~line 166) | A, B |
| `src/rules/validate.test.ts` | New validator tests | A, B |
| `src/data/armies/woodElves.ts` | `we-treeman` ratio cap (new `selectionRules`) | A |
| `src/data/armies/lizardmen.ts` | Temple Guard + Terradons ratio caps (new `selectionRules`); remove `lz-temple-guard.max` | A |
| `src/data/armies/highElves.ts` | `he-bolt-thrower` ratio cap (new `selectionRules`) | A |
| `src/data/armies/darkElves.ts` | `de-bolt-thrower` ratio cap (new `selectionRules`); Hellebron dependency | A, B |
| `src/data/armies/vampireCounts.ts` | Spectral Maidens + Vampire Bats ratio caps (extend existing `selectionRules`) | A |
| `src/data/armies/undead.ts` | Isabella→Vlad dependency (new `selectionRules`) | B |
| `src/data/armies/dwarfs.ts` | Gotrek↔Felix dependencies (extend existing `selectionRules`) | B |
| `src/data/armies/armies.test.ts` | Integrity + survive-assembly tests | A, B |

> **Note on `selectionRules`:** Vampire Counts (`vampireCounts.ts:877`) and Dwarfs (`dwarfs.ts:694`) already have a `selectionRules: { unitGroupCaps: [...] }` block — **add a new key to it**, don't create a second block. The other five armies have none — add a fresh `selectionRules: { … }` as the **last property** of the exported army object (after `units`/`magicItems`), matching the Dwarfs shape:
> ```ts
>   selectionRules: {
>     unitGroupCaps: [ … ],
>   },
> }
> ```

---

## TASK A — Ratio caps (`ratioCaps` / `unit-ratio-max`)

### Task A1: Extend the `SelectionRules` type

**Files:**
- Modify: `src/data/types.ts:143-155`

- [ ] **Step 1: Add the `ratioCaps` field** to the `SelectionRules` interface, after `unitGroupCaps`:

```ts
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
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: PASS (no errors — the field is optional, nothing references it yet).

### Task A2: Add the `unit-ratio-max` validator (TDD)

**Files:**
- Test: `src/rules/validate.test.ts`
- Modify: `src/rules/validate.ts` (insert after the `unit-group-max` loop, ~line 166)

- [ ] **Step 1: Write the failing tests.** Append this `describe` block to `src/rules/validate.test.ts`. It uses a self-contained fixture army so every edge case is controllable:

```ts
describe('ratio caps (unit-ratio-max)', () => {
  const ratioArmy: Army = {
    id: 'ratio',
    name: 'Ratio Army',
    composition: STANDARD_5E_COMPOSITION,
    magicItems: [],
    units: [
      { id: 'slann', name: 'Slann', role: 'character', pointsPerModel: 300, isCharacter: true, canBeGeneral: true },
      { id: 'core', name: 'Core Regiment', role: 'regiment', pointsPerModel: 5, minSize: 1 },
      // perPoints + absoluteMax (Treeman shape)
      { id: 'tree', name: 'Treeman', role: 'monster', pointsPerModel: 285 },
      // perUnit (Temple Guard shape)
      { id: 'tg', name: 'Temple Guard', role: 'regiment', pointsPerModel: 18 },
      // perUnit + floor (Terradons / HE bolt thrower shape)
      { id: 'terra', name: 'Terradons', role: 'regiment', pointsPerModel: 30 },
      // perUnit + multiplier + minSize (DE bolt thrower shape)
      { id: 'rbt', name: 'Bolt Thrower', role: 'warmachine', pointsPerModel: 100 },
    ],
    selectionRules: {
      ratioCaps: [
        { unitId: 'tree', perPoints: 1000, absoluteMax: 3, labelEn: 'Treeman', labelEs: 'Hombre Árbol' },
        { unitId: 'tg', perUnit: { ids: ['slann'] }, labelEn: 'Temple Guard', labelEs: 'Guardia' },
        { unitId: 'terra', perUnit: { ids: ['slann'] }, floor: 1, labelEn: 'Terradons', labelEs: 'Terradones' },
        { unitId: 'rbt', perUnit: { ids: ['core'], multiplier: 2, minSize: 10 }, labelEn: 'Bolt Throwers', labelEs: 'Lanzavirotes' },
      ],
    },
  }
  const ros = (pointsLimit: number, entries: RosterEntry[]): Roster => ({ id: 'r', name: 't', armyId: 'ratio', pointsLimit, entries })
  const e = (id: string, unitId: string, size = 1): RosterEntry => ({ id, unitId, size, optionIds: [], magicItemIds: [] })
  const ratioViolations = (r: Roster) => validateRoster(r, ratioArmy).filter((v) => v.rule === 'unit-ratio-max')

  it('perPoints: Treeman capped by points and absoluteMax', () => {
    // 3000 pts → floor(3) capped at 3; 3 is OK, 4 flags
    expect(ratioViolations(ros(3000, [e('1', 'tree'), e('2', 'tree'), e('3', 'tree')]))).toHaveLength(0)
    expect(ratioViolations(ros(3000, [e('1', 'tree'), e('2', 'tree'), e('3', 'tree'), e('4', 'tree')]))).toHaveLength(1)
    // 5000 pts → floor(5) but absoluteMax 3 wins → 4 flags
    expect(ratioViolations(ros(5000, [e('1', 'tree'), e('2', 'tree'), e('3', 'tree'), e('4', 'tree')]))).toHaveLength(1)
  })

  it('perPoints: skipped when pointsLimit is 0', () => {
    expect(ratioViolations(ros(0, [e('1', 'tree'), e('2', 'tree'), e('3', 'tree'), e('4', 'tree')]))).toHaveLength(0)
  })

  it('perUnit: Temple Guard capped by Slann count', () => {
    expect(ratioViolations(ros(2000, [e('s', 'slann'), e('1', 'tg')]))).toHaveLength(0)
    expect(ratioViolations(ros(2000, [e('s', 'slann'), e('1', 'tg'), e('2', 'tg')]))).toHaveLength(1)
  })

  it('floor: Terradons allowed up to 1 even with 0 Slann; 2nd flags', () => {
    expect(ratioViolations(ros(2000, [e('1', 'terra')]))).toHaveLength(0)
    expect(ratioViolations(ros(2000, [e('1', 'terra'), e('2', 'terra')]))).toHaveLength(1)
  })

  it('multiplier + minSize: only regiments of 10+ count, ×2', () => {
    // one 10-model core → 2 bolt throwers OK, 3 flags
    expect(ratioViolations(ros(2000, [e('c', 'core', 10), e('1', 'rbt'), e('2', 'rbt')]))).toHaveLength(0)
    expect(ratioViolations(ros(2000, [e('c', 'core', 10), e('1', 'rbt'), e('2', 'rbt'), e('3', 'rbt')]))).toHaveLength(1)
    // a 9-model core does NOT count → limit 0 → any bolt thrower flags
    expect(ratioViolations(ros(2000, [e('c', 'core', 9), e('1', 'rbt')]))).toHaveLength(1)
  })

  it('count 0: a capped unit not taken is never flagged', () => {
    expect(ratioViolations(ros(2000, [e('s', 'slann')]))).toHaveLength(0)
  })

  it('message is bilingual', () => {
    const en = validateRoster(ros(2000, [e('s', 'slann'), e('1', 'tg'), e('2', 'tg')]), ratioArmy)
    const es = validateRoster(ros(2000, [e('s', 'slann'), e('1', 'tg'), e('2', 'tg')]), ratioArmy, 'es')
    expect(en.find((v) => v.rule === 'unit-ratio-max')?.message).toContain('only 1 allowed')
    expect(es.find((v) => v.rule === 'unit-ratio-max')?.message).toContain('sólo se permiten 1')
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run src/rules/validate.test.ts -t "ratio caps"`
Expected: FAIL (no `unit-ratio-max` violations produced yet — the rule doesn't exist).

- [ ] **Step 3: Implement the validator.** Insert this block in `src/rules/validate.ts` immediately **after** the `unit-group-max` `for` loop (it closes at line 166, before the `for (const e of roster.entries)` loop at line 168):

```ts
  // Ratio caps: a unit's max count derived from the points limit and/or the
  // number of other qualifying entries. See army.selectionRules.ratioCaps.
  for (const cap of army.selectionRules?.ratioCaps ?? []) {
    const count = countByUnit.get(cap.unitId) ?? 0
    if (count === 0) continue

    const pointsTermActive = cap.perPoints !== undefined && limit > 0
    const unitTermActive = cap.perUnit !== undefined
    // A points-only cap with no points limit cannot be computed — skip it,
    // consistent with the composition-% checks gated on `limit > 0`.
    if (!pointsTermActive && !unitTermActive && cap.floor === undefined) continue

    let computed = 0
    if (pointsTermActive) computed += Math.floor(limit / cap.perPoints!)
    if (unitTermActive) {
      const pu = cap.perUnit!
      const qualifying = roster.entries.filter(
        (e) => pu.ids.includes(e.unitId) && (pu.minSize === undefined || e.size >= pu.minSize),
      ).length
      computed += (pu.multiplier ?? 1) * qualifying
    }
    // floor raises, then absoluteMax caps (absoluteMax applied last → wins).
    if (cap.floor !== undefined) computed = Math.max(computed, cap.floor)
    if (cap.absoluteMax !== undefined) computed = Math.min(computed, cap.absoluteMax)

    if (count > computed) {
      violations.push({
        severity: 'warning',
        rule: 'unit-ratio-max',
        message: es
          ? `${cap.labelEs}: sólo se permiten ${computed} (hay ${count} en la lista).`
          : `${cap.labelEn}: only ${computed} allowed (${count} in the list).`,
      })
    }
  }
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run src/rules/validate.test.ts -t "ratio caps"`
Expected: PASS (all 7 cases).

- [ ] **Step 5: Commit (verification gate)**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test`
Expected: PASS — full suite green.

### Task A3: Wire ratio-cap data into the six armies

**Files:**
- Modify: `src/data/armies/woodElves.ts`, `lizardmen.ts`, `highElves.ts`, `darkElves.ts`, `vampireCounts.ts`

- [ ] **Step 1: Wood Elves** — add a new `selectionRules` block as the last property of the army object:

```ts
  selectionRules: {
    ratioCaps: [
      { unitId: 'we-treeman', perPoints: 1000, absoluteMax: 3, labelEn: 'Treeman', labelEs: 'Hombre Árbol' },
    ],
  },
```

- [ ] **Step 2: Lizardmen** — (a) **delete** the `max: 1,` line on `lz-temple-guard` (lizardmen.ts:199); (b) add a new `selectionRules` block:

```ts
  selectionRules: {
    ratioCaps: [
      { unitId: 'lz-temple-guard', perUnit: { ids: ['lz-slann'] }, labelEn: 'Temple Guard', labelEs: 'Guardianes del Templo Saurus' },
      { unitId: 'lz-terradons', perUnit: { ids: ['lz-slann'] }, floor: 1, labelEn: 'Terradons', labelEs: 'Terradones' },
    ],
  },
```

- [ ] **Step 3: High Elves** — add a new `selectionRules` block:

```ts
  selectionRules: {
    ratioCaps: [
      { unitId: 'he-bolt-thrower', perUnit: { ids: ['he-archers', 'he-spearmen', 'he-sea-guard'] }, floor: 2, labelEn: 'Repeater Bolt Throwers', labelEs: 'Lanzavirotes de Repetición' },
    ],
  },
```

- [ ] **Step 4: Dark Elves** — add a new `selectionRules` block (Task B will later add a `dependencies` key here):

```ts
  selectionRules: {
    ratioCaps: [
      { unitId: 'de-bolt-thrower', perUnit: { ids: ['de-warriors', 'de-spearmen', 'de-crossbowmen', 'de-city-guard', 'de-corsairs'], multiplier: 2, minSize: 10 }, labelEn: 'Repeater Bolt Throwers', labelEs: 'Lanzavirotes de Repetición' },
    ],
  },
```

- [ ] **Step 5: Vampire Counts** — the army already has `selectionRules: { unitGroupCaps: [...] }` (vampireCounts.ts:877). Add a `ratioCaps` key inside that block:

```ts
    ratioCaps: [
      { unitId: 'vc-spectral-maidens', perPoints: 1000, labelEn: 'Spectral Maidens', labelEs: 'Doncellas Espectrales' },
      { unitId: 'vc-vampire-bats', perUnit: { ids: ['vc-zombies', 'vc-skeletons', 'vc-grave-guard', 'vc-ghouls', 'vc-wight-cavalry'] }, labelEn: 'Vampire Bats', labelEs: 'Murciélagos Vampiro' },
    ],
```

- [ ] **Step 6: Verify type-check passes**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: PASS.

### Task A4: Integration + integrity tests for ratio caps

**Files:**
- Modify: `src/data/armies/armies.test.ts`

- [ ] **Step 1: Add a survive-assembly test** inside the existing `describe('selectionRules survive army assembly', …)` block (armies.test.ts:112):

```ts
  it('Wood Elves: Treeman ratio cap is present', () => {
    const caps = getArmy('wood-elves')!.selectionRules?.ratioCaps
    expect(caps?.find((c) => c.unitId === 'we-treeman')?.absoluteMax).toBe(3)
  })

  it('Lizardmen: Temple Guard per-Slann cap present and static max removed', () => {
    const liz = getArmy('lizardmen')!
    expect(liz.units.find((u) => u.id === 'lz-temple-guard')?.max).toBeUndefined()
    expect(liz.selectionRules?.ratioCaps?.some((c) => c.unitId === 'lz-temple-guard')).toBe(true)
  })
```

> Confirm the army ids with `ARMY_OPTIONS`/`getArmy` if unsure — they are `'wood-elves'`, `'lizardmen'`, `'high-elves'`, `'dark-elves'`, `'vampire-counts'`.

- [ ] **Step 2: Add a generic integrity test** inside the per-army loop `describe(army.name, …)` (armies.test.ts:10), so every army's ratio-cap ids are validated:

```ts
      it('ratio-cap ids reference real units', () => {
        const ids = new Set(army.units.map((u) => u.id))
        for (const cap of army.selectionRules?.ratioCaps ?? []) {
          expect(ids.has(cap.unitId)).toBe(true)
          for (const id of cap.perUnit?.ids ?? []) expect(ids.has(id)).toBe(true)
        }
      })
```

- [ ] **Step 3: Commit (verification gate)**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test`
Expected: PASS — full suite green, including the new integrity test across all 14 armies.

---

## TASK B — Dependencies (`dependencies` / `unit-requires`)

### Task B1: Extend the `SelectionRules` type

**Files:**
- Modify: `src/data/types.ts` (in the `SelectionRules` interface, after `ratioCaps`)

- [ ] **Step 1: Add the `dependencies` field:**

```ts
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
```

- [ ] **Step 2: Verify type-check passes**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: PASS.

### Task B2: Add the `unit-requires` validator (TDD)

**Files:**
- Test: `src/rules/validate.test.ts`
- Modify: `src/rules/validate.ts` (insert after the `unit-ratio-max` block from Task A2)

- [ ] **Step 1: Write the failing tests.** Append to `src/rules/validate.test.ts`:

```ts
describe('dependencies (unit-requires)', () => {
  const depArmy: Army = {
    id: 'dep',
    name: 'Dep Army',
    composition: STANDARD_5E_COMPOSITION,
    magicItems: [],
    units: [
      { id: 'hero-a', name: 'Hero A', role: 'character', pointsPerModel: 100, isCharacter: true, canBeGeneral: true },
      { id: 'hero-b', name: 'Hero B', role: 'character', pointsPerModel: 100, isCharacter: true, canBeGeneral: true },
      { id: 'special', name: 'Special Character', role: 'character', pointsPerModel: 150, isCharacter: true },
      { id: 'witch', name: 'Witch Regiment', role: 'regiment', pointsPerModel: 10, minSize: 1 },
    ],
    selectionRules: {
      dependencies: [
        { unitId: 'special', requiresAnyOf: ['witch'], labelEn: 'Special Character', labelEs: 'Personaje Especial' },
        // mutual pair
        { unitId: 'hero-a', requiresAnyOf: ['hero-b'], labelEn: 'Hero A', labelEs: 'Héroe A' },
        { unitId: 'hero-b', requiresAnyOf: ['hero-a'], labelEn: 'Hero B', labelEs: 'Héroe B' },
      ],
    },
  }
  const ros = (entries: RosterEntry[]): Roster => ({ id: 'r', name: 't', armyId: 'dep', pointsLimit: 2000, entries })
  const e = (id: string, unitId: string): RosterEntry => ({ id, unitId, size: 1, optionIds: [], magicItemIds: [] })
  const depViolations = (r: Roster) => validateRoster(r, depArmy).filter((v) => v.rule === 'unit-requires')

  it('flags a special character without its prerequisite', () => {
    expect(depViolations(ros([e('1', 'special')]))).toHaveLength(1)
  })

  it('passes when the prerequisite is present', () => {
    expect(depViolations(ros([e('1', 'special'), e('2', 'witch')]))).toHaveLength(0)
  })

  it('does not flag a prerequisite-less list (unit not taken)', () => {
    expect(depViolations(ros([e('2', 'witch')]))).toHaveLength(0)
  })

  it('mutual dependency: one without the other flags; both together pass', () => {
    expect(depViolations(ros([e('1', 'hero-a')]))).toHaveLength(1)
    expect(depViolations(ros([e('1', 'hero-a'), e('2', 'hero-b')]))).toHaveLength(0)
  })

  it('message is bilingual and names the prerequisite', () => {
    const en = validateRoster(ros([e('1', 'special')]), depArmy)
    const es = validateRoster(ros([e('1', 'special')]), depArmy, 'es')
    expect(en.find((v) => v.rule === 'unit-requires')?.message).toContain('requires Witch Regiment')
    expect(es.find((v) => v.rule === 'unit-requires')?.message).toContain('requiere')
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run src/rules/validate.test.ts -t "dependencies"`
Expected: FAIL (no `unit-requires` violations yet).

- [ ] **Step 3: Implement the validator.** Insert in `src/rules/validate.ts` immediately **after** the `unit-ratio-max` block:

```ts
  // Dependencies: a unit may only be included when a prerequisite is present.
  // See army.selectionRules.dependencies.
  for (const dep of army.selectionRules?.dependencies ?? []) {
    if ((countByUnit.get(dep.unitId) ?? 0) === 0) continue
    const satisfied = dep.requiresAnyOf.some((id) => (countByUnit.get(id) ?? 0) > 0)
    if (!satisfied) {
      const prereqNames = dep.requiresAnyOf.map((id) => name(id)).join(' / ')
      violations.push({
        severity: 'warning',
        rule: 'unit-requires',
        message: es
          ? `${dep.labelEs}: requiere ${prereqNames} en el ejército.`
          : `${dep.labelEn}: requires ${prereqNames} in the army.`,
      })
    }
  }
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run src/rules/validate.test.ts -t "dependencies"`
Expected: PASS (all 5 cases).

- [ ] **Step 5: Commit (verification gate)**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test`
Expected: PASS.

### Task B3: Wire dependency data into the three armies

**Files:**
- Modify: `src/data/armies/darkElves.ts`, `undead.ts`, `dwarfs.ts`

- [ ] **Step 1: Dark Elves** — add a `dependencies` key to the `selectionRules` block created in Task A3 (if Task A was skipped, create the block):

```ts
    dependencies: [
      { unitId: 'de-hellebron', requiresAnyOf: ['de-witch-elves'], labelEn: 'Crone Hellebron', labelEs: 'Hellebron' },
    ],
```

- [ ] **Step 2: Undead** — add a new `selectionRules` block:

```ts
  selectionRules: {
    dependencies: [
      { unitId: 'ud-isabella-von-carstein', requiresAnyOf: ['ud-vlad-von-carstein'], labelEn: 'Isabella von Carstein', labelEs: 'Isabella von Carstein' },
    ],
  },
```

- [ ] **Step 3: Dwarfs** — the army already has `selectionRules: { unitGroupCaps: [...] }` (dwarfs.ts:694). Add a `dependencies` key inside that block (both directions of the mutual pair):

```ts
    dependencies: [
      { unitId: 'dw-gotrek', requiresAnyOf: ['dw-felix'], labelEn: 'Gotrek Gurnisson', labelEs: 'Gotrek Gurnisson' },
      { unitId: 'dw-felix', requiresAnyOf: ['dw-gotrek'], labelEn: 'Felix Jaeger', labelEs: 'Felix Jaeger' },
    ],
```

- [ ] **Step 4: Verify type-check passes**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: PASS.

### Task B4: Integration + integrity tests for dependencies

**Files:**
- Modify: `src/data/armies/armies.test.ts`

- [ ] **Step 1: Add survive-assembly tests** inside `describe('selectionRules survive army assembly', …)`:

```ts
  it('Undead: Isabella requires Vlad', () => {
    const dep = getArmy('undead')!.selectionRules?.dependencies?.find((d) => d.unitId === 'ud-isabella-von-carstein')
    expect(dep?.requiresAnyOf).toContain('ud-vlad-von-carstein')
  })

  it('Dwarfs: Gotrek and Felix require each other (both directions)', () => {
    const deps = getArmy('dwarfs')!.selectionRules?.dependencies ?? []
    expect(deps.find((d) => d.unitId === 'dw-gotrek')?.requiresAnyOf).toContain('dw-felix')
    expect(deps.find((d) => d.unitId === 'dw-felix')?.requiresAnyOf).toContain('dw-gotrek')
  })
```

- [ ] **Step 2: Extend the generic integrity test** (the `it('ratio-cap ids reference real units', …)` added in Task A4, or add a sibling) so dependency ids are validated for every army:

```ts
      it('dependency ids reference real units', () => {
        const ids = new Set(army.units.map((u) => u.id))
        for (const dep of army.selectionRules?.dependencies ?? []) {
          expect(ids.has(dep.unitId)).toBe(true)
          for (const id of dep.requiresAnyOf) expect(ids.has(id)).toBe(true)
        }
      })
```

- [ ] **Step 3: Commit (verification gate)**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test`
Expected: PASS — full suite green.

---

## Final verification

- [ ] **Run the full gate once more:** `npx tsc --noEmit -p tsconfig.app.json && npm test` → all green.
- [ ] **Manual smoke (optional):** `npm run dev`, build a Lizardmen list with 1 Slann + 2 Temple Guard units → the Muster Check shows a "Temple Guard: only 1 allowed" warning; a Dark Elf list with Hellebron and no Witch Elves → "Crone Hellebron: requires Witch Elves in the army" (the resolved `de-witch-elves` name is "Witch Elves").
- [ ] **Update `PROGRESS.md`** with a one-line entry for this pass (ratio caps + dependencies enforced).
