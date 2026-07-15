import { describe, it, expect } from 'vitest'
import { entryPoints, mountPoints, findUnit } from './points'
import { getArmy } from '../data/armies'
import type { RosterEntry } from '../data/types'

const empire = getArmy('empire')!
const bretonnia = getArmy('bretonnia')!

const mk = (over: Partial<RosterEntry> & { unitId: string }): RosterEntry => ({
  id: 'e',
  size: 1,
  optionIds: [],
  magicItemIds: [],
  ...over,
})

describe('entryPoints — flat vs per-model options', () => {
  it('multiplies per-model options by size but charges flat options once', () => {
    // Halberdiers base 7/model. Shield is per-model (+1); the standard and
    // musician are flat and each cost double a rank-and-file model (2×7=14).
    const entry = mk({ unitId: 'emp-halberdiers', size: 10, optionIds: ['shield', 'standard', 'musician'] })
    // 10*(7+1)=80  +standard 14 +musician 14 = 108
    expect(entryPoints(entry, empire)).toBe(108)
  })

  it('prices the standard and musician at double the unit base cost (4th/5th ed)', () => {
    // Halberdiers base 7/model → command models cost 2×7 = 14 each.
    const halberdiers = empire.units.find((u) => u.id === 'emp-halberdiers')!
    const cost = (id: string) => (halberdiers.options ?? []).find((o) => o.id === id)?.pointsPerModel
    expect(cost('standard')).toBe(14)
    expect(cost('musician')).toBe(14)
  })

  it('command group (standard + musician, no champion) is auto-added to regiments', () => {
    const halberdiers = empire.units.find((u) => u.id === 'emp-halberdiers')!
    const optionIds = (halberdiers.options ?? []).map((o) => o.id)
    expect(optionIds).toEqual(expect.arrayContaining(['standard', 'musician']))
    // 4th/5th ed has no unit-champion option — only paladin/hero/commander characters.
    expect(optionIds).not.toContain('champion')
  })

  it('does not add a command group to characters or war machines', () => {
    const general = empire.units.find((u) => u.id === 'emp-general')!
    const cannon = empire.units.find((u) => u.id === 'emp-great-cannon')!
    const ids = (u: typeof general) => (u.options ?? []).map((o) => o.id)
    expect(ids(general)).not.toContain('standard')
    expect(ids(cannon)).not.toContain('musician')
  })
})

describe('entryPoints — character mounts', () => {
  const general = findUnit(bretonnia, 'br-general')!

  it('mountPoints returns the chosen mount cost, 0 when none/unknown', () => {
    expect(mountPoints(general, undefined)).toBe(0)
    expect(mountPoints(general, 'mount-warhorse')).toBe(3)
    expect(mountPoints(general, 'mount-dragon')).toBe(450)
    expect(mountPoints(general, 'nope')).toBe(0)
  })

  it('adds the mount cost to the character total', () => {
    // General base 100; +450 Dragon mount = 550.
    const onDragon = mk({ unitId: 'br-general', mountId: 'mount-dragon' })
    expect(entryPoints(onDragon, bretonnia)).toBe(550)
    // On foot is unchanged.
    expect(entryPoints(mk({ unitId: 'br-general' }), bretonnia)).toBe(100)
  })

  it('ignores a mountId the unit does not offer', () => {
    const damsel = mk({ unitId: 'br-wizard', mountId: 'mount-dragon' }) // Damsel only offers warhorse/pegasus
    expect(entryPoints(damsel, bretonnia)).toBe(56)
  })
})
