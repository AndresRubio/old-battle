import { describe, it, expect } from 'vitest'
import { entryPoints } from './points'
import { getArmy } from '../data/armies'
import type { RosterEntry } from '../data/types'

const empire = getArmy('empire')!

const mk = (over: Partial<RosterEntry> & { unitId: string }): RosterEntry => ({
  id: 'e',
  size: 1,
  optionIds: [],
  magicItemIds: [],
  ...over,
})

describe('entryPoints — flat vs per-model options', () => {
  it('multiplies per-model options by size but charges flat options once', () => {
    // Halberdiers base 7/model. Shield is per-model (+1), command is flat.
    const entry = mk({ unitId: 'emp-halberdiers', size: 10, optionIds: ['shield', 'champion', 'standard'] })
    // 10*(7+1)=80  +champion 10 +standard 10 = 100
    expect(entryPoints(entry, empire)).toBe(100)
  })

  it('command group is auto-added to regiments by the normalizer', () => {
    const halberdiers = empire.units.find((u) => u.id === 'emp-halberdiers')!
    const optionIds = (halberdiers.options ?? []).map((o) => o.id)
    expect(optionIds).toEqual(expect.arrayContaining(['champion', 'standard', 'musician']))
  })

  it('does not add a command group to characters or war machines', () => {
    const general = empire.units.find((u) => u.id === 'emp-general')!
    const cannon = empire.units.find((u) => u.id === 'emp-great-cannon')!
    const ids = (u: typeof general) => (u.options ?? []).map((o) => o.id)
    expect(ids(general)).not.toContain('champion')
    expect(ids(cannon)).not.toContain('champion')
  })
})
