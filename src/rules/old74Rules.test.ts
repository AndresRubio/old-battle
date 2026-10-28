import { describe, it, expect } from 'vitest'
import { validateRoster } from './validate'
import { entryPoints } from './points'
import { exportRosterText } from './exportText'
import { getArmy } from '../data/armies'
import type { Roster, RosterEntry } from '../data/types'

// OLD-74: the owner's answers to the two questions OLD-73 left open.

const entry = (id: string, unitId: string, over: Partial<RosterEntry> = {}): RosterEntry => ({
  id, unitId, size: 1, optionIds: [], magicItemIds: [], ...over,
})

const rosterOf = (armyId: string, entries: RosterEntry[], pointsLimit = 0): Roster => ({
  id: 'r', name: 't', armyId, pointsLimit, entries,
})

const found = (armyId: string, entries: RosterEntry[], rule: string) =>
  validateRoster(rosterOf(armyId, entries), getArmy(armyId)!, 'en').filter((v) => v.rule === rule)

describe('OLD-74 — the Hellsteed is gone (Condes Vampiro: "Pesadilla (+2 puntos) o un Monstruo")', () => {
  const vc = getArmy('vampire-counts')!

  it('no Vampire Counts unit offers a Hellsteed', () => {
    const offering = vc.units.filter((u) => (u.mounts ?? []).some((m) => m.id === 'mount-hellsteed'))
    expect(offering.map((u) => u.id)).toEqual([])
  })

  it('no special rule still names the Hellsteed', () => {
    const naming = vc.units.filter((u) => (u.specialRules ?? []).some((r) => /hellsteed/i.test(r)))
    expect(naming.map((u) => u.id)).toEqual([])
  })

  // A roster saved while the Hellsteed existed keeps its mountId; the entry
  // prices and exports as if on foot.
  it('a saved roster riding a Hellsteed prices and exports as on foot', () => {
    const vampire = vc.units.find((u) => u.mounts?.some((m) => m.id === 'mount-nightmare') && u.role === 'character')!
    const onFoot = entry('v', vampire.id, { isGeneral: true })
    const stale = entry('v', vampire.id, { isGeneral: true, mountId: 'mount-hellsteed' })
    expect(entryPoints(stale, vc)).toBe(entryPoints(onFoot, vc))
    expect(exportRosterText(rosterOf('vampire-counts', [stale]), vc, 'en')).toBe(
      exportRosterText(rosterOf('vampire-counts', [onFoot]), vc, 'en'),
    )
  })
})

describe('OLD-74 — Mazdamundi as General carries the army battle standard (Hombres Lagarto p.87)', () => {
  // "If your army includes Lord Mazdamundi as General, then the Sunburst Standard of
  // Hexoatl which is attached to his palanquin will be the army's battle standard."
  it('a second battle standard beside General Mazdamundi raises multiple-bsbs', () => {
    const vs = found('lizardmen', [
      entry('m', 'lz-lord-mazdamundi', { isGeneral: true }),
      entry('s', 'lz-slann', { isBSB: true }),
    ], 'multiple-bsbs')
    expect(vs).toHaveLength(1)
    expect(vs[0].message).toContain('2')
  })

  it('General Mazdamundi alone is no clash', () => {
    expect(found('lizardmen', [entry('m', 'lz-lord-mazdamundi', { isGeneral: true })], 'multiple-bsbs')).toEqual([])
  })

  // The page makes him the bearer only "as General".
  it('Mazdamundi who is not the General is not a battle standard bearer', () => {
    expect(found('lizardmen', [
      entry('g', 'lz-slann', { isGeneral: true }),
      entry('m', 'lz-lord-mazdamundi'),
      entry('s', 'lz-slann', { isBSB: true }),
    ], 'multiple-bsbs')).toEqual([])
  })

  it('costs nothing extra: the standard is in his 900 points', () => {
    const lz = getArmy('lizardmen')!
    expect(entryPoints(entry('m', 'lz-lord-mazdamundi', { isGeneral: true }), lz))
      .toBe(entryPoints(entry('m', 'lz-lord-mazdamundi'), lz))
  })
})
