# Rules-Fidelity Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce 5th-edition magic-item uniqueness across the army (Phase 1), then establish a data model + framework for army-book-specific selection rules (Phase 2).

**Architecture:** All validation lives in `validateRoster` (`src/rules/validate.ts`) as independent blocks that push `RuleViolation`s; the rules live in data (`types.ts`, `magicItems.ts`, per-army files) so the validator stays generic. Phase 1 is small and fully specified. Phase 2 is extraction-driven and only its framework is planned here.

**Tech Stack:** React 18 + TypeScript + Vite 6, Vitest 3, jsdom. Spanish/English i18n via `src/i18n/lang.ts`.

**Spec:** `docs/superpowers/specs/2026-06-20-rules-fidelity-pass-design.md`

> ⚠️ **Repo note:** this project is **not** a git repository. The `git commit` steps below are written for when git is initialized; until then treat each "Commit" step as a **checkpoint** — run `npx tsc --noEmit -p tsconfig.app.json && npm test` and confirm green before moving on.

---

## File Structure

- `src/data/types.ts` — add `duplicable?: boolean` to `MagicItem`; (Phase 2) add `SelectionRules` + `Army.selectionRules?`.
- `src/data/magicItems.ts` — add 2 missing common items; set `duplicable: true` on 6 ids.
- `src/rules/validate.ts` — add the `magic-items-unique` block; (Phase 2) add one block per discovered rule type.
- `src/rules/validate.test.ts` — uniqueness tests; (Phase 2) per-rule tests.
- `docs/superpowers/specs/2026-06-20-army-selection-rules.md` — (Phase 2) the extracted per-army rules table (new deliverable).

---

# PHASE 1 — Magic-item uniqueness

### Task 1: Add the `duplicable` field to the data model

**Files:**
- Modify: `src/data/types.ts` (the `MagicItem` interface)

- [ ] **Step 1: Add the field**

In `src/data/types.ts`, inside `interface MagicItem`, after the existing
`special?: boolean` field, add:

```ts
  /**
   * True for the documented exceptions to army-wide uniqueness (Dispel Scrolls,
   * Chaos Armour, Familiars). Undefined/false = the item is unique and may
   * appear only once per army. See magic-items rules, Warhammer Magia p.33.
   */
  duplicable?: boolean
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: exit 0 (adding an optional field breaks nothing).

- [ ] **Step 3: Commit** (checkpoint if no git)

```bash
git add src/data/types.ts
git commit -m "feat(rules): add duplicable flag to MagicItem"
```

---

### Task 2: Add the two missing common items

**Files:**
- Modify: `src/data/magicItems.ts` (the `COMMON_MAGIC_ITEMS` array, arcane items, near `mi-scroll-of-magic-destruction` at line ~82 / `mi-power-familiar` at ~87)
- Test: `src/data/armies/armies.test.ts` (existing generic data test will cover uniqueness of ids)

- [ ] **Step 1: Write a failing test for the new items' presence**

Add to `src/data/armies/armies.test.ts` (new `describe` block at end of file):

```ts
import { COMMON_MAGIC_ITEMS } from '../magicItems'

describe('magic-item catalog completeness', () => {
  it('includes the Dispel Scroll and Warrior Familiar (duplicable exceptions)', () => {
    const ids = new Set(COMMON_MAGIC_ITEMS.map((i) => i.id))
    expect(ids.has('mi-dispel-scroll')).toBe(true)
    expect(ids.has('mi-warrior-familiar')).toBe(true)
  })

  it('marks exactly the documented exceptions as duplicable', () => {
    const dup = COMMON_MAGIC_ITEMS.filter((i) => i.duplicable).map((i) => i.id).sort()
    expect(dup).toEqual(
      ['mi-chaos-familiar', 'mi-dispel-scroll', 'mi-power-familiar', 'mi-warrior-familiar', 'mi-wizard-familiar'].sort(),
    )
  })
})
```

> Note: `mi-chaos-armour` is restricted (lives in `ARMY_MAGIC_ITEMS`, not `COMMON`), so it is asserted separately in Task 4's tests, not here.

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- armies`
Expected: FAIL — `mi-dispel-scroll` / `mi-warrior-familiar` not found; no duplicable items yet.

- [ ] **Step 3: Add the two items to `COMMON_MAGIC_ITEMS`**

In `src/data/magicItems.ts`, immediately after the `mi-scroll-of-magic-destruction` line, add:

```ts
  {"id": "mi-dispel-scroll", "name": "Dispel Scroll", "nameEs": "Pergamino de Dispersión de Magia", "category": "arcane", "points": 25, "description": "May be used to dispel an enemy spell as it is being cast. It will not dispel a spell cast with Total Power. One use only.", "descEs": "Puede emplearse para dispersar un hechizo enemigo mientras éste es lanzado. No dispersará un hechizo lanzado con Energía Total. Un solo uso.", "duplicable": true},
  {"id": "mi-warrior-familiar", "name": "Warrior Familiar", "nameEs": "Familiar Guerrero", "category": "arcane", "points": 25, "description": "If its master is attacked, the familiar interposes itself between him and the attackers, who must attack the familiar. The familiar always strikes first. Profile: M 10, WS 5, BS 0, S 4, T 4, W 1, I 6, A 2, Ld 10.", "descEs": "Si su amo es atacado, el familiar se interpondrá entre él y los atacantes, que deberán atacar al familiar. El familiar siempre atacará en primer lugar. Perfil: M 10, HA 5, HP 0, F 4, R 4, H 1, I 6, A 2, L 10.", "duplicable": true},
```

- [ ] **Step 4: Run it to verify the presence test passes** (the duplicable test still fails — Task 3 finishes it)

Run: `npm test -- armies`
Expected: the "includes the Dispel Scroll…" test PASSES; the "duplicable" test still FAILS (familiars not yet flagged).

- [ ] **Step 5: Commit** (checkpoint if no git)

```bash
git add src/data/magicItems.ts src/data/armies/armies.test.ts
git commit -m "feat(data): add Dispel Scroll and Warrior Familiar common items"
```

---

### Task 3: Flag the existing exceptions as duplicable

**Files:**
- Modify: `src/data/magicItems.ts` (`mi-power-familiar`, `mi-wizard-familiar`, `mi-chaos-familiar`, and `mi-chaos-armour`)

- [ ] **Step 1: Add `"duplicable": true` to each existing exception**

For each of these four items, append `, "duplicable": true` before the closing
`}` of its object literal:
- `mi-power-familiar`
- `mi-wizard-familiar`
- `mi-chaos-familiar`
- `mi-chaos-armour`

Use a grep to find each line:
`grep -n '"id": "mi-power-familiar"\|"id": "mi-wizard-familiar"\|"id": "mi-chaos-familiar"\|"id": "mi-chaos-armour"' src/data/magicItems.ts`

- [ ] **Step 2: Run the duplicable test**

Run: `npm test -- armies`
Expected: both completeness tests PASS (the COMMON-only duplicable test now sees exactly the 4 common duplicables: dispel-scroll, warrior/power/wizard/chaos familiars).

- [ ] **Step 3: Typecheck + full suite**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test`
Expected: tsc exit 0; all tests pass (no regressions).

- [ ] **Step 4: Commit** (checkpoint if no git)

```bash
git add src/data/magicItems.ts
git commit -m "feat(data): mark Chaos Armour and Familiars as duplicable"
```

---

### Task 4: Implement the `magic-items-unique` validation check

**Files:**
- Modify: `src/rules/validate.ts` (add a block just before `return violations`)
- Test: `src/rules/validate.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `src/rules/validate.test.ts`:

```ts
import { getArmy } from '../data/armies'

describe('magic-item uniqueness', () => {
  const empire = getArmy('empire')!
  const empChar = empire.units.find((u) => u.isCharacter)!.id
  const chaos = getArmy('chaos')!
  const chaosChar = chaos.units.find((u) => u.isCharacter)!.id

  const uniqueViolations = (roster: Roster, army = empire) =>
    validateRoster(roster, army).filter((v) => v.rule === 'magic-items-unique')

  const ros = (armyId: string, entries: RosterEntry[]): Roster => ({
    id: 'r', name: 't', armyId, pointsLimit: 2000, entries,
  })
  const ch = (id: string, unitId: string, items: string[]): RosterEntry => ({
    id, unitId, size: 1, optionIds: [], magicItemIds: items,
  })

  it('flags the same normal item carried by two characters', () => {
    const r = ros('empire', [
      ch('a', empChar, ['mi-sword-of-strength']),
      ch('b', empChar, ['mi-sword-of-strength']),
    ])
    expect(uniqueViolations(r)).toHaveLength(1)
    expect(uniqueViolations(r)[0].severity).toBe('error')
  })

  it('allows two Dispel Scrolls (duplicable)', () => {
    const r = ros('empire', [
      ch('a', empChar, ['mi-dispel-scroll']),
      ch('b', empChar, ['mi-dispel-scroll']),
    ])
    expect(uniqueViolations(r)).toHaveLength(0)
  })

  it('allows two Familiars (duplicable)', () => {
    const r = ros('empire', [
      ch('a', empChar, ['mi-power-familiar']),
      ch('b', empChar, ['mi-power-familiar']),
    ])
    expect(uniqueViolations(r)).toHaveLength(0)
  })

  it('allows two Chaos Armours (duplicable)', () => {
    const r = ros('chaos', [
      ch('a', chaosChar, ['mi-chaos-armour']),
      ch('b', chaosChar, ['mi-chaos-armour']),
    ])
    expect(uniqueViolations(r, chaos)).toHaveLength(0)
  })

  it('mixed roster: one normal dup + one dispel-scroll dup → exactly one violation', () => {
    const r = ros('empire', [
      ch('a', empChar, ['mi-sword-of-strength', 'mi-dispel-scroll']),
      ch('b', empChar, ['mi-sword-of-strength', 'mi-dispel-scroll']),
    ])
    expect(uniqueViolations(r)).toHaveLength(1)
  })

  it('clean roster: no duplicates → no violation', () => {
    const r = ros('empire', [
      ch('a', empChar, ['mi-sword-of-strength']),
      ch('b', empChar, ['mi-dispel-scroll']),
    ])
    expect(uniqueViolations(r)).toHaveLength(0)
  })
})
```

> If `mi-sword-of-strength` is not a common item in this build, substitute any
> common, non-duplicable item id (check with
> `grep '"id": "mi-sword-of-strength"' src/data/magicItems.ts`).

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- validate`
Expected: FAIL — the dup tests return 0 violations (check not implemented yet).

- [ ] **Step 3: Implement the check**

In `src/rules/validate.ts`, immediately **before** the final `return violations`,
add:

```ts
  // --- Magic-item uniqueness across the whole army ------------------------
  // 5th ed (Warhammer Magia p.33): the same magic item may not be included in
  // an army more than once. Exceptions are flagged `duplicable` on the item
  // (Dispel Scrolls, Chaos Armour, Familiars).
  const itemUsers = new Map<string, number>()
  for (const e of roster.entries) {
    for (const id of e.magicItemIds) {
      itemUsers.set(id, (itemUsers.get(id) ?? 0) + 1)
    }
  }
  for (const [id, count] of itemUsers) {
    if (count < 2) continue
    const item = findMagicItem(army, id)
    if (!item || item.duplicable) continue
    const itemName = es ? (item.nameEs ?? item.name) : item.name
    violations.push({
      severity: 'error',
      rule: 'magic-items-unique',
      message: es
        ? `${itemName}: objeto mágico duplicado — cada objeto mágico es único y sólo puede incluirse una vez en el ejército (lo llevan ${count} personajes).`
        : `${itemName}: duplicate magic item — each magic item is unique and may appear only once per army (carried by ${count} characters).`,
    })
  }
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- validate`
Expected: PASS (all uniqueness tests green).

- [ ] **Step 5: Full verification**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test && npm run build`
Expected: tsc exit 0; all tests pass; build exit 0.

- [ ] **Step 6: Commit** (checkpoint if no git)

```bash
git add src/rules/validate.ts src/rules/validate.test.ts
git commit -m "feat(rules): enforce army-wide magic-item uniqueness"
```

---

### Task 5: Manual UI verification (Phase 1 done)

- [ ] **Step 1: Run the app and confirm the warning surfaces**

Start the dev server (`preview_start`), open any list, give two characters the
same magic item (a non-duplicable one), and confirm the Troop Review panel shows
the `magic-items-unique` error. Then give two characters a Dispel Scroll and
confirm no error appears. Screenshot as proof.

Phase 1 is independently shippable here.

---

# PHASE 2 — Army-book selection rules (extraction-driven)

> **Scope note:** Phase 2's concrete enforcement tasks cannot be written until
> the rules are discovered, because the rule *values* come from reading 14 army
> PDFs. This plan covers the **extraction** and the **framework**; the per-army
> encoding/enforcement tasks should be appended (or planned separately) once the
> extraction deliverable exists. Recommend running Phase 2 as its own
> plan after Task 6.

### Task 6: Extract per-army selection rules (discovery)

**Files:**
- Create: `docs/superpowers/specs/2026-06-20-army-selection-rules.md` (a table)

- [ ] **Step 1:** For each of the 14 army PDFs in `~/Downloads/` (re-OCR or read
  visually — `/tmp` OCR was cleared), read the army-selection section and record
  in a per-army table: army max wizard level; any 0-1/0-3 unit caps (cross-check
  against each `UnitProfile.max`); magic-standard limits; max character count;
  any mechanically-checkable "must/may-not include" clause. Note "none" where
  the book imposes nothing beyond the standard composition.
- [ ] **Step 2:** Have the table reviewed (spec-document-reviewer) for accuracy
  against the books before any code.
- [ ] **Step 3:** Decide the final `SelectionRules` field set — include only
  rule types that actually appear (YAGNI). Drop the rest.

### Task 7: Add the `SelectionRules` data model (only fields found)

**Files:**
- Modify: `src/data/types.ts`

- [ ] Add `interface SelectionRules { … }` with only the discovered fields, and
  `selectionRules?: SelectionRules` on `interface Army`. Typecheck.

### Task 8+: One validator block + tests per discovered rule type

For each rule type found (e.g. `maxWizardLevel`):
- [ ] Write a failing test (a roster violating the rule → expect a violation
  with a new rule id, e.g. `wizard-level-over`).
- [ ] Run to confirm failure.
- [ ] Add an independent block in `validateRoster` reading `army.selectionRules`,
  pushing a bilingual `RuleViolation` (error for hard caps, warning for soft).
- [ ] Run to confirm pass; then full `tsc && npm test && npm run build`.
- [ ] Correct any wrong `UnitProfile.max` values found in Task 6 (data fix, not
  validator logic) and confirm `armies.test.ts` stays green.
- [ ] Commit per rule type (checkpoint if no git).

---

## Done criteria
- Phase 1: `tsc` clean, full Vitest suite green (incl. new uniqueness tests),
  `npm run build` exit 0, UI shows the uniqueness error and respects exceptions.
- Phase 2: extraction table reviewed; each discovered rule enforced with a test;
  no regressions.
