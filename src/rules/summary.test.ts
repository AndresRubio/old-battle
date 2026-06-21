import { describe, it, expect } from 'vitest'
import { summarize } from './summary'
import { getArmy } from '../data/armies'
import type { Roster } from '../data/types'

const empire = getArmy('empire')!

describe('summarize', () => {
  it('computes totals, role breakdown and percentages', () => {
    const roster: Roster = {
      id: 'r',
      name: 'S',
      armyId: 'empire',
      pointsLimit: 1000,
      entries: [
        { id: '1', unitId: 'emp-general', size: 1, optionIds: [], magicItemIds: [], isGeneral: true }, // 100
        { id: '2', unitId: 'emp-halberdiers', size: 20, optionIds: [], magicItemIds: [] }, // 20*7 = 140
        { id: '3', unitId: 'emp-great-cannon', size: 1, optionIds: [], magicItemIds: [] }, // 100
      ],
    }
    const s = summarize(roster, empire)
    expect(s.total).toBe(340)
    expect(s.characters).toBe(100)
    expect(s.regiments).toBe(140)
    expect(s.warMachines).toBe(100)
    expect(s.monsters).toBe(0)
    expect(s.remaining).toBe(660)
    expect(s.charactersPct).toBe(10)
    expect(s.regimentsPct).toBe(14)
  })
})
