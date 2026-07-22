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

describe('entryPoints — unit magic standard', () => {
  it('adds the chosen magic standard points to a regiment total', () => {
    // Halberdiers base 7/model × 10 = 70; + Banner of War (25) = 95.
    const withBanner = mk({ unitId: 'emp-halberdiers', size: 10, magicStandardId: 'mi-banner-of-war' })
    const plain = mk({ unitId: 'emp-halberdiers', size: 10 })
    expect(entryPoints(withBanner, empire) - entryPoints(plain, empire)).toBe(25)
  })

  it('ignores an unknown magic standard id', () => {
    const bad = mk({ unitId: 'emp-halberdiers', size: 10, magicStandardId: 'nope' })
    expect(entryPoints(bad, empire)).toBe(entryPoints(mk({ unitId: 'emp-halberdiers', size: 10 }), empire))
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

// OLD-8 — chariot mounts with their own selectable options (O&G book p.88).
describe('entryPoints — chariot mounts with nested options (Orcs & Goblins)', () => {
  const orcs = getArmy('orcs-and-goblins')!

  it('adds the base chariot cost like any other mount', () => {
    // Orc Warboss 110 + Orc Boar Chariot 81 = 191.
    const entry = mk({ unitId: 'og-warboss-orc', mountId: 'mount-boar-chariot' })
    expect(entryPoints(entry, orcs)).toBe(191)
  })

  it('adds flat mount options once (extra crewmen)', () => {
    // 110 + 81 + 7.5 (3rd crewman) = 198.5
    const entry = mk({
      unitId: 'og-warboss-orc',
      mountId: 'mount-boar-chariot',
      optionIds: ['mount-boar-chariot-crew3'],
    })
    expect(entryPoints(entry, orcs)).toBe(198.5)
  })

  it('prices perCrewman options by the current crew count (2 base crew)', () => {
    // Shields at 1/crewman × 2 crew = +2.
    const entry = mk({
      unitId: 'og-warboss-orc',
      mountId: 'mount-boar-chariot',
      optionIds: ['mount-boar-chariot-shields'],
    })
    expect(entryPoints(entry, orcs)).toBe(193)
  })

  it('perCrewman options scale with 3 crew', () => {
    // 110 + 81 + 7.5 (3rd crewman) + 3×1 (shields) = 201.5
    const entry = mk({
      unitId: 'og-warboss-orc',
      mountId: 'mount-boar-chariot',
      optionIds: ['mount-boar-chariot-crew3', 'mount-boar-chariot-shields'],
    })
    expect(entryPoints(entry, orcs)).toBe(201.5)
  })

  it('perCrewman options scale with 4 crew (chariot = 81 + 15 + 4 = 100)', () => {
    // Both extra crew (2×7.5=15) + shields (4×1=4): 110 + 100 = 210.
    const entry = mk({
      unitId: 'og-warboss-orc',
      mountId: 'mount-boar-chariot',
      optionIds: ['mount-boar-chariot-crew3', 'mount-boar-chariot-crew4', 'mount-boar-chariot-shields'],
    })
    expect(entryPoints(entry, orcs)).toBe(210)
  })

  it('adds scythed wheels as a flat +20', () => {
    const entry = mk({
      unitId: 'og-warboss-orc',
      mountId: 'mount-boar-chariot',
      optionIds: ['mount-boar-chariot-scythes'],
    })
    expect(entryPoints(entry, orcs)).toBe(211)
  })

  it('wolf chariot: 3rd Giant Wolf and half-point perCrewman costs', () => {
    // Goblin Warboss 50 + 65 + 4 (3rd wolf) = 119.
    const withWolf = mk({
      unitId: 'og-warboss-goblin',
      mountId: 'mount-wolf-chariot',
      optionIds: ['mount-wolf-chariot-wolf3'],
    })
    expect(entryPoints(withWolf, orcs)).toBe(119)
    // 50 + 65 + 2×3.5 (crew) + 4×0.5 (shields) + 4×0.5 (bows) = 126.
    const loaded = mk({
      unitId: 'og-warboss-goblin',
      mountId: 'mount-wolf-chariot',
      optionIds: [
        'mount-wolf-chariot-crew3',
        'mount-wolf-chariot-crew4',
        'mount-wolf-chariot-shields',
        'mount-wolf-chariot-bows',
      ],
    })
    expect(entryPoints(loaded, orcs)).toBe(126)
  })

  it('stale mount-option ids contribute 0 when the mount is deselected or changed', () => {
    // On foot: chariot options no longer apply — base cost only.
    const onFoot = mk({
      unitId: 'og-warboss-orc',
      optionIds: ['mount-boar-chariot-crew3', 'mount-boar-chariot-shields', 'mount-boar-chariot-scythes'],
    })
    expect(entryPoints(onFoot, orcs)).toBe(110)
    // On a different mount: same — only the War Boar's 8 pts are added.
    const onBoar = mk({
      unitId: 'og-warboss-orc',
      mountId: 'mount-war-boar',
      optionIds: ['mount-boar-chariot-crew3', 'mount-boar-chariot-shields'],
    })
    expect(entryPoints(onBoar, orcs)).toBe(118)
  })

  it('never multiplies mount options by unit size', () => {
    // Defensive: even with an (artificial) size > 1, mount options charge once.
    // 3×110 (models) + 81 (chariot) + 20 (scythes) + 2×1 (shields, 2 crew) = 433.
    const entry = mk({
      unitId: 'og-warboss-orc',
      size: 3,
      mountId: 'mount-boar-chariot',
      optionIds: ['mount-boar-chariot-scythes', 'mount-boar-chariot-shields'],
    })
    expect(entryPoints(entry, orcs)).toBe(433)
  })
})
