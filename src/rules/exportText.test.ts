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

  describe('unit detail section', () => {
    it('adds a detailed section after the summary', () => {
      const text = exportRosterText(roster, empire)
      const detailIdx = text.indexOf('UNIT DETAILS')
      const summaryIdx = text.indexOf('20x Halberdiers')
      expect(detailIdx).toBeGreaterThan(-1)
      // the detail block comes after the compact summary lines
      expect(detailIdx).toBeGreaterThan(summaryIdx)
    })

    it('renders a quick-reference stat table with headers and values', () => {
      const text = exportRosterText(roster, empire)
      // stat-column headers (only appear in the detail section)
      expect(text).toMatch(/M\s+WS\s+BS\s+S\s+T\s+W\s+I\s+A\s+Ld/)
      // the General's line: M4 WS6 BS6 S4 T4 W3 I6 A4 Ld9
      expect(text).toMatch(/4\s+6\s+6\s+4\s+4\s+3\s+6\s+4\s+9/)
    })

    it('lists each unit total cost, abilities and options in the detail block', () => {
      const text = exportRosterText(roster, empire)
      const detail = text.slice(text.indexOf('UNIT DETAILS'))
      expect(detail).toContain('General of the Empire')
      expect(detail).toContain('120 pts')
      expect(detail).toContain('Special Abilities')
      expect(detail).toContain('Shields')
    })

    it('lists a character magic items with points and description', () => {
      const text = exportRosterText(roster, empire)
      const detail = text.slice(text.indexOf('UNIT DETAILS'))
      expect(detail).toContain('Sword of Strength')
      expect(detail).toContain('20 pts')
      // the item description is unique to the detail section (not in the summary)
      expect(detail).toContain("Increases the character's Strength characteristic by +1.")
    })

    it('localizes the detail section in Spanish', () => {
      const text = exportRosterText(roster, empire, 'es')
      expect(text).toContain('DETALLE DE UNIDADES')
      // Spanish stat headers M/HA/HP/F/R/H/I/A/L
      expect(text).toMatch(/M\s+HA\s+HP\s+F\s+R\s+H\s+I\s+A\s+L/)
      expect(text).toContain('Espada de la Fuerza')
    })
  })
})
