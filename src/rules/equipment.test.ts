import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { classifyOption, unclassifiedOptions, checkEquipmentCombo, isIgnoredOption } from './equipment'
import { ARMIES as ALL_ARMIES } from '../data/armies'
import { entryPoints } from './points'
import type { RosterEntry, UnitProfile } from '../data/types'

describe('classifyOption', () => {
  it('classifies melee weapons', () => {
    expect(classifyOption('Spear')).toBe('melee')
    expect(classifyOption('Spears')).toBe('melee')          // substring match catches plural
    expect(classifyOption('Halberd')).toBe('melee')
    expect(classifyOption('Great weapon')).toBe('melee')
    expect(classifyOption('Two-handed weapon')).toBe('melee')
    expect(classifyOption('Cavalry lance')).toBe('melee')
    expect(classifyOption('Additional hand weapon')).toBe('melee')
  })
  it('classifies missile weapons', () => {
    expect(classifyOption('Crossbow')).toBe('missile')
    expect(classifyOption('Short bow')).toBe('missile')
  })
  it('classifies armourBody', () => {
    expect(classifyOption('Light armour')).toBe('armourBody')
    expect(classifyOption('Heavy armour')).toBe('armourBody')
  })
  it('classifies shield', () => {
    expect(classifyOption('Shield')).toBe('shield')
  })
  it('classifies barding', () => {
    expect(classifyOption('Barding (steeds)')).toBe('barding')
  })
  it('classifies mount', () => {
    expect(classifyOption('Bretonnian Warhorse')).toBe('mount')
  })
  it('respects barding-before-mount ordering', () => {
    expect(classifyOption('Barding for warhorse')).toBe('barding')  // contains both 'barding' and 'warhorse'
    expect(classifyOption('Elven Steed')).toBe('mount')
  })
  it('returns undefined for unknown names', () => {
    expect(classifyOption('Standard Bearer')).toBeUndefined()
  })
})

const unit = (opts: Array<[string, string]>): UnitProfile => ({
  id: 'u', name: 'U', role: 'character', pointsPerModel: 0,
  options: opts.map(([id, name]) => ({ id, name, pointsPerModel: 0 })),
})
const rules = (ids: string[], u: UnitProfile) =>
  checkEquipmentCombo(ids, u).map((v) => v.rule).sort()

describe('isIgnoredOption', () => {
  it('ignores command group, marks and wizard-level variants', () => {
    expect(isIgnoredOption('Champion')).toBe(true)
    expect(isIgnoredOption('Standard Bearer')).toBe(true)
    expect(isIgnoredOption('Marca de Khorne')).toBe(true)
    expect(isIgnoredOption('Nivel 2')).toBe(true)          // pattern 'nivel'
    expect(isIgnoredOption('Wizard Level 4')).toBe(true)   // pattern 'wizard level'
  })
  it('ignores additive "extra …" quantity upgrades', () => {
    expect(isIgnoredOption('Extra 2 Elven Steeds')).toBe(true)
    expect(isIgnoredOption('extra crew member')).toBe(true)
  })
  it('does NOT ignore real equipment options', () => {
    expect(isIgnoredOption('Spear')).toBe(false)
    expect(isIgnoredOption('Heavy armour')).toBe(false)
    expect(isIgnoredOption('Shield')).toBe(false)
    expect(isIgnoredOption('Bretonnian Warhorse')).toBe(false)
  })
})

describe('checkEquipmentCombo (layer b)', () => {
  it('single melee weapon is legal', () => {
    expect(rules(['a'], unit([['a', 'Spear']]))).toEqual([])
  })
  it('two melee weapons → equip-melee-multiple', () => {
    expect(rules(['a', 'b'], unit([['a', 'Spear'], ['b', 'Halberd']]))).toEqual(['equip-melee-multiple'])
  })
  it('two missile weapons → equip-missile-multiple', () => {
    expect(rules(['a', 'b'], unit([['a', 'Bow'], ['b', 'Crossbow (instead of Bow)']]))).toEqual(['equip-missile-multiple'])
  })
  it('light + heavy armour → equip-armour-multiple', () => {
    expect(rules(['a', 'b'], unit([['a', 'Light armour'], ['b', 'Heavy armour']]))).toEqual(['equip-armour-multiple'])
  })
  it('great weapon + shield → equip-greatweapon-shield', () => {
    expect(rules(['a', 'b'], unit([['a', 'Great weapon'], ['b', 'Shield']]))).toEqual(['equip-greatweapon-shield'])
  })
  it('barding without mount, unit offers mount option → equip-barding-no-mount', () => {
    // Unit has both a mount option and a barding option; selecting barding but not mount is illegal.
    expect(rules(['a'], unit([['a', 'Barding (steeds)'], ['b', 'Bretonnian Warhorse']]))).toEqual(['equip-barding-no-mount'])
  })
  it('barding on base-mounted unit (no mount option) → legal (unit already has a mount)', () => {
    // Unit has only a barding option and no mount option — it rides a mount by default.
    // Selecting barding alone is valid (adds barding to the existing base mount).
    expect(rules(['a'], unit([['a', 'Barding (steeds)']]))).toEqual([])
  })
  it('barding WITH mount (both selected) → legal', () => {
    expect(rules(['a', 'b'], unit([['a', 'Barding (steeds)'], ['b', 'Bretonnian Warhorse']]))).toEqual([])
  })
  it('two mounts → equip-mount-multiple', () => {
    expect(rules(['a', 'b'], unit([['a', 'Bretonnian Warhorse'], ['b', 'Pegasus']]))).toEqual(['equip-mount-multiple'])
  })
  it('typical legal loadout → no violations', () => {
    expect(rules(['a', 'b', 'c'], unit([['a', 'Shield'], ['b', 'Light armour'], ['c', 'Spear']]))).toEqual([])
  })
  it('ignores option ids not present on the unit', () => {
    expect(rules(['a', 'zzz'], unit([['a', 'Spear']]))).toEqual([])
  })
  it('two-handed (non-"great weapon") + shield → equip-greatweapon-shield', () => {
    expect(rules(['a', 'b'], unit([['a', 'Two-handed weapon'], ['b', 'Shield']]))).toEqual(['equip-greatweapon-shield'])
  })
  it('Spanish "Arma a Dos Manos" + shield → equip-greatweapon-shield', () => {
    expect(rules(['a', 'b'], unit([['a', 'Arma a Dos Manos'], ['b', 'Shield']]))).toEqual(['equip-greatweapon-shield'])
  })
})

describe('classifier coverage (layer a)', () => {
  for (const army of ALL_ARMIES) {
    it(`every option in ${army.id} is classified or explicitly ignored`, () => {
      expect(unclassifiedOptions(army)).toEqual([])
    })
  }
})

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

function buildAudit(): Record<string, string[]> {
  const audit: Record<string, string[]> = {}
  for (const army of ALL_ARMIES) {
    for (const u of army.units) {
      const ids = (u.options ?? []).map((o) => o.id)
      const found = new Set<string>()
      const base: RosterEntry = { id: 't', unitId: u.id, size: u.minSize ?? 1, optionIds: [], magicItemIds: [] }
      const pts = entryPoints({ ...base, optionIds: ids }, army)
      if (!Number.isFinite(pts) || pts < 0) throw new Error(`bad points for ${army.id}/${u.id}: ${pts}`)
      if (ids.length > SUBSET_CAP) {
        console.warn(`[equipment audit] ${army.id}/${u.id} has ${ids.length} options > cap; predicate-only`)
        // Count-based rules are revealed by the full option set; the only rule the full
        // set hides is equip-barding-no-mount (the mount is included), so also test the
        // subset with all mount options removed. Both delegate to checkEquipmentCombo —
        // no rule logic is duplicated here.
        for (const r of checkEquipmentCombo(ids, u)) found.add(r.rule)
        const noMountIds = (u.options ?? []).filter((o) => classifyOption(o.name) !== 'mount').map((o) => o.id)
        for (const r of checkEquipmentCombo(noMountIds, u)) found.add(r.rule)
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
    expect(audit, 'Equipment combo audit drifted from baseline. If this change is intended, regenerate with:\n  UPDATE_BASELINE=1 npx vitest run src/rules/equipment.test.ts').toEqual(baseline)
  })
})
