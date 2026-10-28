import { describe, it, expect } from 'vitest'
import { validateRoster } from './validate'
import { entryPoints, unitOptionCost, findUnit } from './points'
import { exportRosterText } from './exportText'
import { getArmy } from '../data/armies'
import type { Roster, RosterEntry } from '../data/types'

// OLD-73 (3/3): the Dogs of War Paymaster's bodyguard. Mercenarios printed p.28:
// "Each bodyguard costs 12 points and is equipped with a halberd and light armour.
// They may have shields at an additional cost of +1 point per model. The unit may
// have a regimental standard bearer and/or musician, each costing double the
// points of a normal trooper."

const dow = getArmy('dogs-of-war')!
const entry = (unitId: string, over: Partial<RosterEntry> = {}): RosterEntry => ({
  id: 'e', unitId, size: 1, optionIds: [], magicItemIds: [], ...over,
})
const rosterOf = (entries: RosterEntry[]): Roster => ({
  id: 'r', name: 't', armyId: 'dogs-of-war', pointsLimit: 0, entries,
})
const found = (entries: RosterEntry[], rule: string, lang: 'en' | 'es' = 'en') =>
  validateRoster(rosterOf(entries), dow, lang).filter((v) => v.rule === rule)

describe("OLD-73 — the Paymaster's bodyguard command group is twice a trooper", () => {
  const paymaster = findUnit(dow, 'dow-paymaster')!
  const opt = (id: string) => paymaster.options!.find((o) => o.id === id)!
  const withGuard = (over: Partial<RosterEntry> = {}) => entry('dow-paymaster', { optionIds: ['bodyguard'], ...over })

  it('costs 24 each when the bodyguards have no shields (2 x 12)', () => {
    const e = withGuard()
    expect(unitOptionCost(paymaster, opt('bodyguard-standard'), e.optionIds, e.optionCounts)).toBe(24)
    expect(unitOptionCost(paymaster, opt('bodyguard-musician'), e.optionIds, e.optionCounts)).toBe(24)
    expect(entryPoints(withGuard({ optionIds: ['bodyguard', 'bodyguard-standard'] }), dow)).toBe(125 + 60 + 24)
  })

  it('costs 26 each when shields are bought (2 x 13)', () => {
    const e = withGuard({ optionCounts: { 'bodyguard-shields': 5 } })
    expect(unitOptionCost(paymaster, opt('bodyguard-standard'), e.optionIds, e.optionCounts)).toBe(26)
    expect(unitOptionCost(paymaster, opt('bodyguard-musician'), e.optionIds, e.optionCounts)).toBe(26)
    const both = withGuard({ optionIds: ['bodyguard', 'bodyguard-standard', 'bodyguard-musician'], optionCounts: { 'bodyguard-shields': 5 } })
    expect(entryPoints(both, dow)).toBe(125 + 60 + 5 + 26 + 26)
  })

  // The book gives no rule for a part-shielded unit; any shield bought makes the trooper a
  // shielded one, so the command models carry the shield too.
  it('reads any shield count above zero as shielded, and zero as unshielded', () => {
    const price = (n: number) => {
      const e = withGuard({ optionIds: ['bodyguard', 'bodyguard-musician'], optionCounts: n ? { 'bodyguard-shields': n } : undefined })
      return unitOptionCost(paymaster, opt('bodyguard-musician'), e.optionIds, e.optionCounts)
    }
    expect([price(0), price(1), price(20)]).toEqual([24, 26, 26])
  })

  // Mercenarios printed p.65 (PDF 67): "The bodyguard may include a standard bearer and
  // musician at double the points cost of a normal trooper." Mydas's trooper costs 12
  // and the page offers no shields, so 24 stays right.
  it("leaves Mydas's standard bearer and musician at 24", () => {
    const mydas = findUnit(dow, 'dow-mydas')!
    for (const id of ['bodyguard-standard', 'bodyguard-musician']) {
      const o = mydas.options!.find((x) => x.id === id)!
      expect(unitOptionCost(mydas, o, [id], undefined)).toBe(24)
    }
  })
})

describe('OLD-73 — bodyguard options need the bodyguard retinue (option-requires-option)', () => {
  it('flags a standard bearer, a musician, shields or extra bodyguards without the retinue', () => {
    for (const patch of [
      { optionIds: ['bodyguard-standard'] },
      { optionIds: ['bodyguard-musician'] },
      { optionCounts: { 'bodyguard-shields': 3 } },
      { optionCounts: { 'extra-bodyguards': 2 } },
    ]) {
      const vs = found([entry('dow-paymaster', patch)], 'option-requires-option')
      expect(vs.length, JSON.stringify(patch)).toBe(1)
      expect(vs[0].severity).toBe('warning')
      expect(vs[0].entryId).toBe('e')
    }
  })

  it('is quiet with the retinue, and does not blame the Money Lender', () => {
    const e = entry('dow-paymaster', {
      optionIds: ['bodyguard', 'bodyguard-standard', 'bodyguard-musician'],
      optionCounts: { 'bodyguard-shields': 5, 'extra-bodyguards': 2 },
    })
    expect(found([e], 'option-requires-option')).toEqual([])
    expect(found([entry('dow-paymaster', { optionIds: ['money-lender'] })], 'option-requires-option')).toEqual([])
  })

  it("does not apply to Mydas, whose 210 already includes five bodyguards", () => {
    const e = entry('dow-mydas', { optionIds: ['bodyguard-standard'], optionCounts: { 'extra-bodyguards': 2 } })
    expect(found([e], 'option-requires-option')).toEqual([])
  })

  it('names the option and the one it needs, in both languages', () => {
    const e = entry('dow-paymaster', { optionIds: ['bodyguard-standard'] })
    const en = found([e], 'option-requires-option', 'en')[0].message
    const es = found([e], 'option-requires-option', 'es')[0].message
    expect(en).toContain('Bodyguard standard bearer')
    expect(en).toContain('Bodyguard (5 models)')
    expect(es).not.toBe(en)
    expect(es).toContain('Guardia (5 miniaturas)')
  })
})

describe('OLD-73 — the export prints the shielded command group price', () => {
  it('prints 26 for the standard bearer once shields are bought', () => {
    const r = rosterOf([entry('dow-paymaster', {
      optionIds: ['bodyguard', 'bodyguard-standard'], optionCounts: { 'bodyguard-shields': 5 },
    })])
    expect(exportRosterText(r, dow)).toContain('Bodyguard standard bearer (+26 pts)')
  })
})
