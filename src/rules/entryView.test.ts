import { describe, it, expect } from 'vitest'
import {
  isValidMagicStandard,
  eligibleMagicStandards,
  companionMountProfile,
  partitionOptions,
  hasAnyOptions,
  filterMagicItems,
} from './entryView'
import { mountOptionCost } from './points'
import type { Army, MagicItem, MountOption, UnitProfile } from '../data/types'

const banner = (id: string, special = false): MagicItem => ({
  id,
  name: id,
  points: 25,
  category: 'banner',
  special: special || undefined,
})

const sword: MagicItem = { id: 'sword', name: 'Sword', points: 10, category: 'weapon' }

const baseUnit: UnitProfile = {
  id: 'u',
  name: 'Unit',
  role: 'regiment',
  pointsPerModel: 10,
  minSize: 5,
  statLine: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
}

const army = {
  magicItems: [banner('b1'), banner('b-special', true), sword],
} as unknown as Army

describe('magic standard eligibility', () => {
  it('accepts only non-special banners', () => {
    expect(isValidMagicStandard(banner('b'))).toBe(true)
    expect(isValidMagicStandard(banner('b', true))).toBe(false)
    expect(isValidMagicStandard(sword)).toBe(false)
  })

  it('offers the valid banners to a unit allowed a magic standard, none otherwise', () => {
    const allowed = { ...baseUnit, magicStandard: true }
    expect(eligibleMagicStandards(allowed, army).map((i) => i.id)).toEqual(['b1'])
    expect(eligibleMagicStandards(baseUnit, army)).toEqual([])
  })
})

describe('companionMountProfile', () => {
  const steed: MountOption = {
    id: 'steed',
    name: 'Steed',
    points: 3,
    statLine: { M: 8, WS: 3, S: 3, T: 3, I: 3, A: 1 },
  }
  const chariot: MountOption = { id: 'chariot', name: 'Chariot', points: 65 }

  it('prefers the regiment fixed steed', () => {
    const fixed = { name: 'Warhorse', statLine: steed.statLine! }
    expect(companionMountProfile({ ...baseUnit, mount: fixed }, steed)).toBe(fixed)
  })

  it('maps a chosen mount with a statLine to a profile row', () => {
    const p = companionMountProfile(baseUnit, steed)
    expect(p?.name).toBe('Steed')
    expect(p?.statLine).toBe(steed.statLine)
  })

  it('yields nothing for a chariot mount (profiles render separately) or no mount', () => {
    expect(companionMountProfile(baseUnit, chariot)).toBeUndefined()
    expect(companionMountProfile(baseUnit, undefined)).toBeUndefined()
  })
})

describe('mountOptionCost', () => {
  const chariot: MountOption = {
    id: 'chariot',
    name: 'Chariot',
    points: 65,
    baseCrew: 2,
    options: [
      { id: 'crew3', name: 'Extra crewman', pointsPerModel: 9, addsCrewman: true },
      { id: 'crew-shields', name: 'Crew shields', pointsPerModel: 1, perCrewman: true },
      { id: 'scythes', name: 'Scythed wheels', pointsPerModel: 15 },
    ],
  }
  const shields = chariot.options![1]
  const scythes = chariot.options![2]

  it('multiplies perCrewman options by the current crew count', () => {
    expect(mountOptionCost(chariot, shields, ['crew-shields'])).toBe(2)
    expect(mountOptionCost(chariot, shields, ['crew-shields', 'crew3'])).toBe(3)
  })

  it('charges other mount options flat', () => {
    expect(mountOptionCost(chariot, scythes, ['scythes', 'crew3'])).toBe(15)
  })
})

describe('partitionOptions', () => {
  const unit: UnitProfile = {
    id: 'u', name: 'U', role: 'character', pointsPerModel: 50, isCharacter: true,
    options: [
      { id: 'wizard-l2', name: 'Wizard Level 2', pointsPerModel: 35 },
      { id: 'shield', name: 'Shield', pointsPerModel: 2 },
      { id: 'wizard-l3', name: 'Wizard Level 3', pointsPerModel: 70 },
    ],
  }

  it('splits wizard-level upgrades (radio) from toggle options (checkbox)', () => {
    const { levelOptions, toggleOptions } = partitionOptions(unit)
    expect(levelOptions.map((o) => o.id)).toEqual(['wizard-l2', 'wizard-l3'])
    expect(toggleOptions.map((o) => o.id)).toEqual(['shield'])
  })

  it('yields empty partitions for a unit with no options', () => {
    const { levelOptions, toggleOptions } = partitionOptions({ ...unit, options: undefined })
    expect(levelOptions).toEqual([])
    expect(toggleOptions).toEqual([])
  })
})

describe('hasAnyOptions', () => {
  const bare: UnitProfile = { id: 'u', name: 'U', role: 'regiment', pointsPerModel: 5 }

  it('is false for a plain regiment with nothing configurable', () => {
    expect(hasAnyOptions(bare)).toBe(false)
  })

  it('is true for options, mounts, characters, lores or a magic standard', () => {
    expect(hasAnyOptions({ ...bare, options: [{ id: 'o', name: 'O', pointsPerModel: 1 }] })).toBe(true)
    expect(hasAnyOptions({ ...bare, mounts: [{ id: 'm', name: 'M', points: 10 }] })).toBe(true)
    expect(hasAnyOptions({ ...bare, isCharacter: true })).toBe(true)
    expect(hasAnyOptions({ ...bare, lores: ['battle'] })).toBe(true)
    expect(hasAnyOptions({ ...bare, magicStandard: true })).toBe(true)
  })
})

describe('filterMagicItems', () => {
  const items: MagicItem[] = [
    { id: 'a', name: 'Sword of Might', nameEs: 'Espada de Poder', category: 'weapon', points: 25 },
    { id: 'b', name: 'Black Amulet', category: 'talisman', points: 90 },
  ]

  it('matches on either language, case-insensitively', () => {
    expect(filterMagicItems(items, 'espada', '').map((i) => i.id)).toEqual(['a'])
    expect(filterMagicItems(items, 'AMULET', '').map((i) => i.id)).toEqual(['b'])
  })

  it('applies the points ceiling; blank means no cap', () => {
    expect(filterMagicItems(items, '', '50').map((i) => i.id)).toEqual(['a'])
    expect(filterMagicItems(items, '', '').map((i) => i.id)).toEqual(['a', 'b'])
  })
})
