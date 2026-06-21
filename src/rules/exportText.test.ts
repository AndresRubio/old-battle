import { describe, it, expect } from 'vitest'
import { exportRosterText } from './exportText'
import { getArmy } from '../data/armies'
import type { Roster } from '../data/types'

const empire = getArmy('empire')!

describe('exportRosterText', () => {
  const roster: Roster = {
    id: 'r',
    name: 'The Reikland Vanguard',
    armyId: 'empire',
    pointsLimit: 1000,
    entries: [
      { id: '1', unitId: 'emp-general', size: 1, optionIds: [], magicItemIds: ['mi-sword-of-strength'], isGeneral: true },
      { id: '2', unitId: 'emp-halberdiers', size: 20, optionIds: ['shield'], magicItemIds: [] },
    ],
  }

  it('includes the list name, army, points and unit lines', () => {
    const text = exportRosterText(roster, empire)
    expect(text).toContain('The Reikland Vanguard')
    expect(text).toContain('The Empire — Old Battle · 5th Edition')
    expect(text).toContain('[General]')
    expect(text).toContain('General of the Empire')
    expect(text).toContain('Sword of Strength')
    expect(text).toContain('20x Halberdiers')
    expect(text).toContain('+ Shields')
  })

  it('reports total points', () => {
    const text = exportRosterText(roster, empire)
    // general 100 + sword 20 = 120; halberdiers 20*(7+1)=160 -> 280
    expect(text).toContain('280 / 1000 pts')
  })
})
