# Equipment Combination Rule Tests — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Codify Warhammer 5th-edition equipment-combination rules in a pure module and prove, via a three-layer Vitest suite, that no illegal equipment combination is silently accepted — with a versioned baseline of combinations buildable today.

**Architecture:** A pure, stateless module `src/rules/equipment.ts` (name classifier + combo checker + coverage helper, mirroring the `findRule` keyword pattern in `src/data/rules.ts`). A test suite `src/rules/equipment.test.ts` with three layers: classifier coverage, checker correctness, and an exhaustive per-unit subset audit compared against a committed baseline JSON. No data, UI, or `validateRoster` changes.

**Tech Stack:** TypeScript, Vitest 3, the existing `Army`/`UnitProfile`/`RosterEntry`/`RuleViolation` types in `src/data/types.ts`, `entryPoints` from `src/rules/points.ts`, `ARMIES` from `src/data/armies/index.ts` (the all-armies array; imported as `ALL_ARMIES` via alias in the tests).

> **No git in this project.** `git` is unavailable here, so the usual "commit" step is replaced by a **Checkpoint**: run the full suite (`npm test`) and confirm green before moving on. If git is initialized later, each checkpoint maps to one commit.

---

## File Structure

- **Create** `src/rules/equipment.ts` — `EquipSlot`, `classifyOption`, `checkEquipmentCombo`, `unclassifiedOptions`, plus an exported `IGNORED_OPTION_NAMES` allowlist. One responsibility: equipment classification + combo rules.
- **Create** `src/rules/equipment.test.ts` — the three-layer suite.
- **Create** `src/rules/__baselines__/equipment-combos.json` — committed baseline of buildable-illegal combos (generated in Task 4).

Confirmed import surface:
- `src/data/armies/index.ts` exports **`ARMIES: Army[]`** (the all-armies array). The tests import it as `import { ARMIES as ALL_ARMIES } from '../data/armies'`. (There is no `ALL_ARMIES` symbol in the codebase.)
- `entryPoints(entry: RosterEntry, army: Army): number` lives in `src/rules/points.ts`.

---

## Task 1: Classifier (`classifyOption` + `EquipSlot`)

**Files:**
- Create: `src/rules/equipment.ts`
- Test: `src/rules/equipment.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { classifyOption } from './equipment'

describe('classifyOption', () => {
  it('classifies melee weapons', () => {
    expect(classifyOption('Spear')).toBe('melee')
    expect(classifyOption('Spears')).toBe('melee')          // plural via substring
    expect(classifyOption('Halberd')).toBe('melee')
    expect(classifyOption('Great weapon')).toBe('melee')
    expect(classifyOption('Two-handed weapon')).toBe('melee')
    expect(classifyOption('Cavalry lance')).toBe('melee')
    expect(classifyOption('Additional hand weapon')).toBe('melee')
  })
  it('classifies missiles, armour, shield, barding, mount', () => {
    expect(classifyOption('Crossbow')).toBe('missile')
    expect(classifyOption('Short bow')).toBe('missile')
    expect(classifyOption('Light armour')).toBe('armourBody')
    expect(classifyOption('Heavy armour')).toBe('armourBody')
    expect(classifyOption('Shield')).toBe('shield')
    expect(classifyOption('Barding (steeds)')).toBe('barding')
    expect(classifyOption('Bretonnian Warhorse')).toBe('mount')
  })
  it('returns undefined for unknown names', () => {
    expect(classifyOption('Standard Bearer')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rules/equipment.test.ts -t classifyOption`
Expected: FAIL — `classifyOption` is not exported / module missing.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { Army, RosterEntry, RuleViolation, UnitProfile } from '../data/types'

export type EquipSlot = 'melee' | 'missile' | 'armourBody' | 'shield' | 'mount' | 'barding'

// Substring match on the lowercased name (like findRule). Order: specific before
// generic, and barding before mount so "Barding (steeds)" → barding not mount.
const SLOT_KEYWORDS: ReadonlyArray<readonly [EquipSlot, readonly string[]]> = [
  ['armourBody', ['light armour', 'heavy armour']],
  ['shield', ['shield']],
  ['barding', ['barding']],
  ['mount', ['warhorse', 'elven steed', 'cold one', 'giant wolf', 'war boar',
             'giant spider', 'pegasus', 'dragon', 'nightmare mount', 'steed',
             'may ride', 'rides a']],
  ['missile', ['short bow', 'longbow', 'long bow', 'crossbow', 'bow', 'sling',
               'javelin', 'throwing star', 'pistol', 'blowpipe']],
  ['melee', ['additional hand weapon', 'two hand weapons', 'great weapon',
             'two-handed', 'weapons with two hands', 'two hands', 'a dos manos',
             'double-handed', 'halberd', 'spear', 'lance']],
]
// NOTE: 'a dos manos' / 'two hands' / 'weapons with two hands' are the
// real two-handed-weapon option names in the data (Chaos in Spanish, Skaven).
// 'two hand weapons' (dual-wield, +1 Attack) is deliberately NOT a great weapon
// and must stay out of GREAT_WEAPON_KW below.

export function classifyOption(name: string): EquipSlot | undefined {
  const n = name.toLowerCase()
  for (const [slot, kws] of SLOT_KEYWORDS) {
    if (kws.some((k) => n.includes(k))) return slot
  }
  return undefined
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rules/equipment.test.ts -t classifyOption`
Expected: PASS.

- [ ] **Step 5: Checkpoint** — `npm test` is green.

---

## Task 2: Coverage helper + Layer (a) coverage test

**Files:**
- Modify: `src/rules/equipment.ts`
- Test: `src/rules/equipment.test.ts`

- [ ] **Step 1: Write the failing test** (layer a)

```ts
import { ARMIES as ALL_ARMIES } from '../data/armies'
import { unclassifiedOptions } from './equipment'

describe('classifier coverage (layer a)', () => {
  for (const army of ALL_ARMIES) {
    it(`every option in ${army.id} is classified or explicitly ignored`, () => {
      expect(unclassifiedOptions(army)).toEqual([])
    })
  }
})
```

- [ ] **Step 2: Add `unclassifiedOptions` + empty allowlist to `equipment.ts`**

```ts
// Option names intentionally NOT subject to the 4 equipment families
// (command group, gunpowder/war-machine weapons, etc.). Filled in Step 4
// from the first run, after confirming each is genuinely irrelevant.
export const IGNORED_OPTION_NAMES: readonly string[] = [
]

export function unclassifiedOptions(army: Army): string[] {
  const out = new Set<string>()
  for (const u of army.units)
    for (const o of u.options ?? [])
      if (classifyOption(o.name) === undefined && !IGNORED_OPTION_NAMES.includes(o.name))
        out.add(o.name)
  return [...out]
}
```

- [ ] **Step 3: Run the coverage test, capture the unclassified names**

Run: `npx vitest run src/rules/equipment.test.ts -t coverage`
Expected: FAIL — lists the currently-unrecognised option names per army.

- [ ] **Step 4: Triage each unrecognised name**

**Expect a sizable first-run list**: several army files store option `name` in **Spanish** (e.g. `Armadura Ligera`, `Armadura Pesada`, `Corceles de Slaanesh`, `Armas a Dos Manos`). For each name printed:
- If it IS one of the 4 families but in Spanish or a missed variant → add the keyword to the right `SLOT_KEYWORDS` entry (e.g. `armadura ligera`/`armadura pesada` → `armourBody`; `corcel`/`montura`/`caballo de guerra` → `mount`; `escudo` → `shield`; `barda` → `barding`; `arco`/`ballesta`/`jabalina`/`honda`/`pistola` → `missile`; `lanza`/`alabarda`/`arma de mano adicional` → `melee`). Verify each added keyword does not collide with another slot's names before committing it (the layer-b and layer-c tests will surface collisions).
- **When you add a Spanish/variant keyword for a *two-handed* weapon to `melee`, you MUST also add it to `GREAT_WEAPON_KW` in Task 3** — otherwise the `equip-greatweapon-shield` rule silently won't fire for that name. (The known ones — `a dos manos`, `weapons with two hands`, `two hands` — are already in both.)
- If it is genuinely irrelevant (command, gunpowder/war-machine guns like "Handgunners"/"Organ Gun", crew upgrades, etc.) → add the exact name to `IGNORED_OPTION_NAMES`.
Re-run until the coverage test is green. Keep a short comment block above `IGNORED_OPTION_NAMES` explaining the categories included.

- [ ] **Step 5: Checkpoint** — `npm test` is green.

---

## Task 3: `checkEquipmentCombo` + Layer (b) correctness tests

**Files:**
- Modify: `src/rules/equipment.ts`
- Test: `src/rules/equipment.test.ts`

- [ ] **Step 1: Write the failing tests** (layer b)

```ts
import { checkEquipmentCombo } from './equipment'
import type { UnitProfile } from '../data/types'

const unit = (opts: Array<[string, string]>): UnitProfile => ({
  id: 'u', name: 'U', role: 'character', pointsPerModel: 0,
  options: opts.map(([id, name]) => ({ id, name, pointsPerModel: 0 })),
})
const rules = (ids: string[], u: UnitProfile) =>
  checkEquipmentCombo(ids, u).map((v) => v.rule).sort()

describe('checkEquipmentCombo (layer b)', () => {
  it('single melee weapon is legal', () => {
    const u = unit([['a', 'Spear']])
    expect(rules(['a'], u)).toEqual([])
  })
  it('two melee weapons → equip-melee-multiple', () => {
    const u = unit([['a', 'Spear'], ['b', 'Halberd']])
    expect(rules(['a', 'b'], u)).toEqual(['equip-melee-multiple'])
  })
  it('two missile weapons → equip-missile-multiple', () => {
    const u = unit([['a', 'Bow'], ['b', 'Crossbow (instead of Bow)']])
    expect(rules(['a', 'b'], u)).toEqual(['equip-missile-multiple'])
  })
  it('light + heavy armour → equip-armour-multiple', () => {
    const u = unit([['a', 'Light armour'], ['b', 'Heavy armour']])
    expect(rules(['a', 'b'], u)).toEqual(['equip-armour-multiple'])
  })
  it('great weapon + shield → equip-greatweapon-shield', () => {
    const u = unit([['a', 'Great weapon'], ['b', 'Shield']])
    expect(rules(['a', 'b'], u)).toEqual(['equip-greatweapon-shield'])
  })
  it('barding without mount → equip-barding-no-mount', () => {
    const u = unit([['a', 'Barding (steeds)']])
    expect(rules(['a'], u)).toEqual(['equip-barding-no-mount'])
  })
  it('barding WITH mount → legal', () => {
    const u = unit([['a', 'Barding (steeds)'], ['b', 'Bretonnian Warhorse']])
    expect(rules(['a', 'b'], u)).toEqual([])
  })
  it('two mounts → equip-mount-multiple', () => {
    const u = unit([['a', 'Bretonnian Warhorse'], ['b', 'Pegasus']])
    expect(rules(['a', 'b'], u)).toEqual(['equip-mount-multiple'])
  })
  it('typical legal loadout → no violations', () => {
    const u = unit([['a', 'Shield'], ['b', 'Light armour'], ['c', 'Spear']])
    expect(rules(['a', 'b', 'c'], u)).toEqual([])
  })
  it('ignores option ids not present on the unit', () => {
    const u = unit([['a', 'Spear']])
    expect(rules(['a', 'zzz'], u)).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/rules/equipment.test.ts -t checkEquipmentCombo`
Expected: FAIL — `checkEquipmentCombo` not exported.

- [ ] **Step 3: Implement `checkEquipmentCombo`**

```ts
// Keep in sync with the two-handed entries in SLOT_KEYWORDS['melee'] (Task 1),
// EXCLUDING 'two hand weapons'/'additional hand weapon' (dual-wield, not great weapons).
const GREAT_WEAPON_KW = ['great weapon', 'two-handed', 'weapons with two hands', 'two hands', 'a dos manos', 'double-handed']

export function checkEquipmentCombo(optionIds: string[], unit: UnitProfile): RuleViolation[] {
  const v: RuleViolation[] = []
  const chosen = (unit.options ?? []).filter((o) => optionIds.includes(o.id))
  const inSlot = (s: EquipSlot) => chosen.filter((o) => classifyOption(o.name) === s)
  const melee = inSlot('melee'), missile = inSlot('missile')
  const armour = inSlot('armourBody'), shields = inSlot('shield')
  const mounts = inSlot('mount'), bardings = inSlot('barding')
  const add = (rule: string, message: string) => v.push({ severity: 'warning', rule, message })

  if (melee.length > 1) add('equip-melee-multiple', `Multiple melee weapons: ${melee.map((o) => o.name).join(', ')}`)
  if (missile.length > 1) add('equip-missile-multiple', `Multiple missile weapons: ${missile.map((o) => o.name).join(', ')}`)
  if (armour.length > 1) add('equip-armour-multiple', `Multiple body armours: ${armour.map((o) => o.name).join(', ')}`)
  const hasGreatWeapon = melee.some((o) => GREAT_WEAPON_KW.some((k) => o.name.toLowerCase().includes(k)))
  if (hasGreatWeapon && shields.length > 0) add('equip-greatweapon-shield', 'Great weapon cannot be combined with a shield')
  if (mounts.length > 1) add('equip-mount-multiple', `Multiple mounts: ${mounts.map((o) => o.name).join(', ')}`)
  // Heuristic: a unit is treated as non-mounted unless a mount option is selected.
  // Base-mounted profiles that produce noise are recorded in the Task 4 baseline.
  if (bardings.length > 0 && mounts.length === 0) add('equip-barding-no-mount', 'Barding requires a mount')
  return v
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/rules/equipment.test.ts -t checkEquipmentCombo`
Expected: PASS (all layer-b cases).

- [ ] **Step 5: Checkpoint** — `npm test` is green.

---

## Task 4: Layer (c) exhaustive audit + baseline

**Files:**
- Create: `src/rules/__baselines__/equipment-combos.json`
- Test: `src/rules/equipment.test.ts`

- [ ] **Step 1: Write the audit test (no baseline yet → expected to fail)**

```ts
// New imports for Task 4 (the file already imports ALL_ARMIES, classifyOption,
// checkEquipmentCombo from earlier tasks). The project is ESM ("type":"module")
// running under jsdom, so __dirname / require() are NOT available — use
// import.meta.url + node:fs/node:path ESM imports.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { entryPoints } from './points'
import type { RosterEntry } from '../data/types'

const HERE = dirname(fileURLToPath(import.meta.url))
const SUBSET_CAP = 14 // 2^14 = 16384 subsets per unit; log units above this

function* subsets(ids: string[]): Generator<string[]> {
  const n = ids.length
  for (let mask = 0; mask < (1 << n); mask++) {
    const s: string[] = []
    for (let i = 0; i < n; i++) if (mask & (1 << i)) s.push(ids[i])
    yield s
  }
}

// Build the audit: { "<armyId>/<unitId>": ["equip-...","..."] } sorted.
function buildAudit(): Record<string, string[]> {
  const audit: Record<string, string[]> = {}
  for (const army of ALL_ARMIES) {
    for (const u of army.units) {
      const ids = (u.options ?? []).map((o) => o.id)
      const found = new Set<string>()
      const synthetic: RosterEntry = { id: 't', unitId: u.id, size: u.minSize ?? 1, optionIds: [], magicItemIds: [] }
      // points invariant must hold for the full-option entry
      const pts = entryPoints({ ...synthetic, optionIds: ids }, army)
      if (!Number.isFinite(pts) || pts < 0) throw new Error(`bad points for ${army.id}/${u.id}: ${pts}`)
      if (ids.length > SUBSET_CAP) {
        // eslint-disable-next-line no-console
        console.warn(`[equipment audit] ${army.id}/${u.id} has ${ids.length} options > cap; predicate-only`)
        for (const r of checkEquipmentCombo(ids, u)) found.add(r.rule)        // count rules
        if ((u.options ?? []).some((o) => classifyOption(o.name) === 'barding')
            && !(u.options ?? []).some((o) => classifyOption(o.name) === 'mount'))
          found.add('equip-barding-no-mount')
      } else {
        for (const subset of subsets(ids))
          for (const r of checkEquipmentCombo(subset, u)) found.add(r.rule)
      }
      if (found.size > 0) audit[`${army.id}/${u.id}`] = [...found].sort()
    }
  }
  return audit
}

describe('exhaustive combination audit (layer c)', () => {
  it('matches the reviewed baseline of buildable-illegal combos', () => {
    const audit = buildAudit()
    const baselinePath = resolve(HERE, '__baselines__/equipment-combos.json')
    if (process.env.UPDATE_BASELINE) {
      writeFileSync(baselinePath, JSON.stringify(audit, null, 2) + '\n')
    }
    const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
    expect(audit).toEqual(baseline)
  })
})
```

- [ ] **Step 2: Run to confirm it fails (no baseline file)**

Run: `npx vitest run src/rules/equipment.test.ts -t audit`
Expected: FAIL — baseline file missing / ENOENT.

- [ ] **Step 3: Generate the baseline**

Run: `UPDATE_BASELINE=1 npx vitest run src/rules/equipment.test.ts -t audit`
Then open `src/rules/__baselines__/equipment-combos.json` and **review every entry**:
- Confirm each `<army>/<unit>` genuinely offers mutually-exclusive options as independent toggles (a real gap), not a classifier false positive.
- If an entry is a false positive (e.g. a base-mounted unit flagged `equip-barding-no-mount`, or a mis-classified name), FIX the classifier/checker — do **not** leave the false positive in the baseline — then regenerate.

- [ ] **Step 4: Run without the env var to verify green against the reviewed baseline**

Run: `npx vitest run src/rules/equipment.test.ts -t audit`
Expected: PASS — audit equals baseline.

- [ ] **Step 5: Checkpoint** — `npm test` is green.

---

## Task 5: Full-suite verification

- [ ] **Step 1: Typecheck + full suite**

Run: `npm run build` (must be clean) and `npm test` (all green, including the pre-existing 110 tests + new equipment tests).

- [ ] **Step 2: Sanity-read the baseline**

Confirm `src/rules/__baselines__/equipment-combos.json` is non-empty (the audit found real gaps — that's the point) and each entry is plausible. Record the total count in the final report.

- [ ] **Step 3: Checkpoint** — final green run; report the baseline gap count and the rule-id breakdown.

---

## Notes for the implementer
- DRY: the subset audit and layer-b both call the one `checkEquipmentCombo`; don't duplicate rule logic.
- YAGNI: do not wire into `validateRoster` or the UI; do not add metadata to `EquipmentOption`.
- TDD: every task is red → green. The baseline (Task 4) is the one place where you generate-then-review rather than hand-author the expected value.
- ESM is confirmed (`package.json` `"type": "module"`, Vitest under jsdom): Task 4 uses `import.meta.url` + `node:fs`/`node:path` ESM imports — do **not** reintroduce `__dirname`/`require()`.
- Classifier quirk to check during the Task 4 baseline review: `'Barded Elven Steed'` (High Elves) classifies as `mount` (contains "elven steed"), not `barding`, even though its option id is `barding`. If a unit offers both `Barded Elven Steed` and another mount, that surfaces as `equip-mount-multiple`; decide during baseline review whether to special-case "barded …" → `barding` or accept it.
