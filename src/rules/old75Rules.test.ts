import { describe, it, expect } from 'vitest'
import { validateRoster } from './validate'
import { entryPoints } from './points'
import { getArmy } from '../data/armies'
import { RULE_PHRASE_ES } from '../i18n/rulePhrases'
import type { Roster, RosterEntry } from '../data/types'

// OLD-75: the owner's answers to the three questions OLD-74 left open.

const entry = (id: string, unitId: string, over: Partial<RosterEntry> = {}): RosterEntry => ({
  id, unitId, size: 1, optionIds: [], magicItemIds: [], ...over,
})

const rosterOf = (armyId: string, entries: RosterEntry[]): Roster => ({
  id: 'r', name: 't', armyId, pointsLimit: 0, entries,
})

describe('OLD-75 — Mazdamundi buys no pool items (Hombres Lagarto p.79)', () => {
  // p.79: special characters are taken "exactly as described" and may not
  // "add any equipment, special abilities or magic items".
  it('a pool banner on General Mazdamundi is not allowed', () => {
    const lz = getArmy('lizardmen')!
    const banner = lz.magicItems.find((i) => i.category === 'banner')!
    const rules = validateRoster(
      rosterOf('lizardmen', [entry('m', 'lz-lord-mazdamundi', { isGeneral: true, magicItemIds: [banner.id] })]),
      lz, 'en',
    ).map((v) => v.rule)
    expect(rules).toContain('magic-items-not-allowed')
  })

  it('his own 225 points of items are still on offer', () => {
    const lz = getArmy('lizardmen')!
    expect(entryPoints(entry('m', 'lz-lord-mazdamundi', { optionIds: ['items-on-top'] }), lz)).toBe(1125)
  })
})

describe('OLD-75 — Condes Vampiro p.62-63: "Pesadilla (+2 puntos) o un Monstruo" from the p.67 list', () => {
  const vc = getArmy('vampire-counts')!
  const mountsOf = (id: string) => (vc.units.find((u) => u.id === id)!.mounts ?? []).map((m) => m.id)
  const P67 = ['mount-nightmare', 'mount-winged-nightmare', 'mount-zombie-dragon', 'mount-manticore']

  it.each([
    'vc-vampire-lord', 'vc-vampire-count', 'vc-vampire-neonate', 'vc-vampire-bsb',
    'vc-great-necromancer', 'vc-master-necromancer', 'vc-necromancer-paladin', 'vc-necromancer',
    'vc-wight-bsb',
  ])('%s may ride a Nightmare or any rideable p.67 monster', (id) => {
    expect(mountsOf(id)).toEqual(P67)
    expect(vc.units.find((u) => u.id === id)!.specialRules)
      .toContain('May ride a Nightmare, Winged Nightmare, Zombie Dragon or Manticore')
  })

  // p.63, Paladines No Muertos: a Nightmare only, when leading Wight Cavalry.
  it.each(['vc-wraith', 'vc-wight-lord'])('%s still rides only a Nightmare', (id) => {
    expect(mountsOf(id)).toEqual(['mount-nightmare'])
  })

  // p.67: "MANTÍCORA 200 puntos", 15 6 0 7 7 5 4 4 8 (M15cm → 6").
  it('the Manticore mount is the p.67 monster at 200 points', () => {
    const necro = vc.units.find((u) => u.id === 'vc-necromancer')!
    const manticore = necro.mounts!.find((m) => m.id === 'mount-manticore')!
    expect(manticore.points).toBe(200)
    expect(manticore.statLine).toEqual({ M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 })
    expect(manticore.statLine).toEqual(vc.units.find((u) => u.id === 'vc-manticore')!.statLine)
    expect(entryPoints(entry('n', 'vc-necromancer', { mountId: 'mount-manticore' }), vc))
      .toBe(entryPoints(entry('n', 'vc-necromancer'), vc) + 200)
  })
})

describe('OLD-75 — the Spanish Nightmare is "Pesadilla", as in the 1999 book', () => {
  it('no Spanish phrase says Corcel Pesadillesco', () => {
    const left = Object.entries(RULE_PHRASE_ES).filter(([, es]) => /pesadillesc/i.test(es))
    expect(left).toEqual([])
  })

  it('the mount phrase names the four mounts as the book does', () => {
    expect(RULE_PHRASE_ES['May ride a Nightmare, Winged Nightmare, Zombie Dragon or Manticore'])
      .toBe('Puede montar una Pesadilla, una Pesadilla Alada, un Dragón Zombi o una Mantícora')
  })
})
