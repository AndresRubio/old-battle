import { describe, it, expect } from 'vitest'
import { exportRosterText } from './exportText'
import { getArmy } from '../data/armies'
import type { Roster, RosterEntry } from '../data/types'

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

  it('prints every option with its cost, marking per-model prices', () => {
    // A mount already printed "(+8 pts)" while options printed bare, so a reader
    // could not tell what an option added. Per-model options carry the /model
    // suffix the editor uses, so a regiment's 1/model is not read as 1 total.
    const text = exportRosterText(roster, empire)
    expect(text).toContain('+ Shields (+1 pts/model)')

    const orcs = getArmy('orcs-and-goblins')!
    const ogRoster: Roster = {
      id: 'o', name: 'Waaagh', armyId: 'orcs-and-goblins', pointsLimit: 1000,
      entries: [
        { id: '1', unitId: 'og-warboss-orc', size: 1, optionIds: ['shield', 'two-hand'], magicItemIds: [] },
      ],
    }
    const ogText = exportRosterText(ogRoster, orcs)
    // A character is one model, so no /model suffix on its Equipment List kit.
    expect(ogText).toContain('+ Shield (+1 pts)')
    expect(ogText).toContain('+ Two-handed weapon (+2 pts)')
    expect(ogText).toContain('Options: Two-handed weapon (+2 pts), Shield (+1 pts)')
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

    it('lists a unit magic standard in both the summary and the detail block', () => {
      const withStandard: Roster = {
        ...roster,
        entries: [
          ...roster.entries,
          {
            id: '3',
            unitId: 'emp-white-wolf-knights',
            size: 5,
            optionIds: ['standard'],
            magicItemIds: [],
            magicStandardId: 'mi-banner-of-war',
          },
        ],
      }
      const text = exportRosterText(withStandard, empire)
      const detail = text.slice(text.indexOf('UNIT DETAILS'))
      const summary = text.slice(0, text.indexOf('UNIT DETAILS'))
      expect(summary).toContain('Banner of War')
      expect(detail).toContain('Banner of War')
      expect(detail).toContain('25 pts')
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

// OLD-39 — the plaintext export renders the same stat strips as the editor, so
// a chassis whose book row prints a dice Attacks must show it here too, not "–".
describe('exportRosterText — dice Attacks (OLD-39)', () => {
  const undead = getArmy('undead')!
  const darkElves = getArmy('dark-elves')!

  const rosterOf = (armyId: string, unitId: string): Roster => ({
    id: 'r', name: 'Dice test', armyId, pointsLimit: 2000,
    entries: [{ id: '1', unitId, size: 1, optionIds: [], magicItemIds: [] }],
  })

  /** The value row printed under the chassis label in the detail section. */
  const rowUnder = (text: string, label: string) => {
    const lines = text.split('\n')
    const i = lines.findIndex((l) => l.trim() === `· ${label}`)
    expect(i, `no "${label}" profile row in the export`).toBeGreaterThan(-1)
    return { header: lines[i + 1], values: lines[i + 2] }
  }

  it('prints the Undead Chariot chassis A as 1D6, not a dash', () => {
    const text = exportRosterText(rosterOf('undead', 'ud-undead-chariot'), undead)
    const { values } = rowUnder(text, 'Chariot')
    // "– – – 5 5 3 1 1D6 –" (No Muertos printed p.84).
    expect(values.trim().split(/\s+/)).toEqual(['–', '–', '–', '5', '5', '3', '1', '1D6', '–'])
  })

  it("prints the Witch King's Black Chariot A as 1D6+2 and keeps the columns aligned", () => {
    const text = exportRosterText(rosterOf('dark-elves', 'de-witch-king'), darkElves)
    const { header, values } = rowUnder(text, 'Black Chariot')
    expect(values.trim().split(/\s+/)).toEqual(['–', '–', '–', '7', '7', '3', '–', '1D6+2', '–'])
    // The 5-character token widens its own column instead of shunting the row:
    // the Ld header and the Ld value still start at the same offset.
    expect(header.indexOf('Ld')).toBe(values.lastIndexOf('–'))
  })

  it('prints the dice token unchanged in the Spanish export', () => {
    const text = exportRosterText(rosterOf('dark-elves', 'de-witch-king'), darkElves, 'es')
    const { values } = rowUnder(text, 'Carruaje Negro')
    expect(values).toContain('1D6+2')
  })
})

// OLD-43 — the export renders the same stat strips as the editor, but it never
// passed notes for a UNIT'S OWN row (there was no such thing) nor for a chosen
// MOUNT's row (exportText.ts:103 rendered it bare). Both paths are new.
describe('exportRosterText — unit and mount stat notes (OLD-43)', () => {
  const chaos = getArmy('chaos')!
  const halflings = getArmy('halflings')!

  const rosterOf = (armyId: string, unitId: string, over: Partial<RosterEntry> = {}): Roster => ({
    id: 'r', name: 'Notes test', armyId, pointsLimit: 2000,
    entries: [{ id: '1', unitId, size: 1, optionIds: [], magicItemIds: [], ...over }],
  })

  /** The stat value row of the unit's OWN table — the FIRST stat header in the
   *  detail block belongs to the unit itself (labelled profiles come after it).
   *  Matched on the header row in either language (M WS … / M HA …). */
  const ownValues = (text: string) => {
    const lines = text.split('\n')
    const h = lines.findIndex((l) => /^\s+M\s+(WS|HA)\s/.test(l))
    expect(h, 'no stat header in the detail block').toBeGreaterThan(-1)
    return lines[h + 1].trim().split(/\s+/)
  }

  /** The value row printed under the labelled profile `label`. */
  const labelledValues = (text: string, label: string) => {
    const lines = text.split('\n')
    const i = lines.findIndex((l) => l.trim() === `· ${label}`)
    expect(i, `no "${label}" row in the export`).toBeGreaterThan(-1)
    return lines[i + 2].trim().split(/\s+/)
  }

  it("exports the Chaos Spawn's own M and A as book tokens, not dashes", () => {
    const text = exportRosterText(rosterOf('chaos', 'ch-chaos-spawn'), chaos)
    expect(ownValues(text)).toEqual(['5D6cm', '3', '0', '4', '5', '3', '3', '1D6', '10'])
  })

  it("exports the Crazed Cook's word token, localized per language", () => {
    expect(ownValues(exportRosterText(rosterOf('halflings', 'hf-crazed-cooks'), halflings)))
      .toEqual(['2D6"', 'Sp', '0', '5', '2', '1', '–', 'D6', '–'])
    expect(ownValues(exportRosterText(rosterOf('halflings', 'hf-crazed-cooks'), halflings, 'es')))
      .toEqual(['2D6"', 'Esp', '0', '5', '2', '1', '–', 'D6', '–'])
  })

  it("exports a chosen mount's own note (Beast of Nurgle A 1D6)", () => {
    const roster = rosterOf('chaos', 'ch-lord', {
      mountId: 'mount-beast-of-nurgle',
      optionIds: ['mark-nurgle'],
    })
    const text = exportRosterText(roster, chaos)
    expect(labelledValues(text, 'Beast of Nurgle (+75 pts)'))
      .toEqual(['3', '3', '0', '3', '5', '3', '3', '1D6', '6'])
  })
})
