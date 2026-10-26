import { describe, it, expect } from 'vitest'
import { exportRosterText } from './exportText'
import { ARMIES, getArmy } from '../data/armies'
import type { Roster, RosterEntry } from '../data/types'
import { profileName } from '../i18n/lang'

const empire = getArmy('empire')!

describe('exportRosterText — Battle Standard Bearer surcharge (OLD-64)', () => {
  const ros = (isBSB: boolean): Roster => ({
    id: 'r', name: 'n', armyId: 'empire', pointsLimit: 1000,
    entries: [{ id: '1', unitId: 'emp-ludwig', size: 1, optionIds: [], magicItemIds: [], isBSB }],
  })

  it('itemises the +50 under Ludwig when he is toggled BSB', () => {
    expect(exportRosterText(ros(true), empire)).toContain('    + Battle Standard Bearer (+50 pts)')
    expect(exportRosterText(ros(true), empire, 'es')).toContain('    + Portaestandarte de Batalla (+50 ptos)')
  })

  it('prints no BSB line when he is not', () => {
    expect(exportRosterText(ros(false), empire)).not.toContain('+ Battle Standard Bearer')
  })
})

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

  // OLD-46 — the export shares statCell with the editor, so its Spanish M
  // column is in the books' centimetres too; English stays in inches.
  it('exports Movement in centimetres in Spanish and in inches in English', () => {
    const roster = rosterOf('chaos', 'ch-lord', { mountId: 'mount-chaos-steed' })
    const en = exportRosterText(roster, chaos)
    const es = exportRosterText(roster, chaos, 'es')
    // A Chaos Lord moves 4" = 10 cm; a Chaos Steed 8" = 20 cm.
    expect(ownValues(en)[0]).toBe('4')
    expect(ownValues(es)[0]).toBe('10')
    expect(labelledValues(en, 'Chaos Steed (+4 pts)')[0]).toBe('8')
    expect(labelledValues(es, 'Corcel del Caos (+4 ptos)')[0]).toBe('20')
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

// OLD-48 — the editor pairs a cavalry regiment's rider with the steed every
// model rides (`unit.mount`, via `companionMountProfile`), but the export only
// printed the rider: White Wolf Knights had one stat table instead of two.
describe('exportRosterText — cavalry steed profile (OLD-48)', () => {
  const rosterOf = (armyId: string, unitId: string, over: Partial<RosterEntry> = {}): Roster => ({
    id: 'r', name: 'Steed test', armyId, pointsLimit: 2000,
    entries: [{ id: '1', unitId, size: 5, optionIds: [], magicItemIds: [], ...over }],
  })

  /** The lines of the detail block, from its first stat header on. */
  const detailLines = (text: string) => {
    const lines = text.split('\n')
    const h = lines.findIndex((l) => /^\s+M\s+(WS|HA)\s/.test(l))
    expect(h, 'no stat header in the detail block').toBeGreaterThan(-1)
    return lines.slice(h)
  }

  it('prints the White Wolf Knights steed row beneath the rider, in English', () => {
    const lines = detailLines(exportRosterText(rosterOf('empire', 'emp-white-wolf-knights'), empire))
    // Rider header + values, then the steed's label, header and values.
    expect(lines[1].trim().split(/\s+/)).toEqual(['4', '4', '3', '4', '3', '1', '4', '1', '7'])
    expect(lines[2].trim()).toBe('· Barded Warhorse')
    expect(lines[3]).toMatch(/^\s+M\s+WS\s+BS\s+S\s+T\s+W\s+I\s+A\s+Ld$/)
    expect(lines[4].trim().split(/\s+/)).toEqual(['8', '3', '0', '3', '3', '1', '3', '1', '5'])
  })

  it('prints the steed row in Spanish, with Movement in centimetres', () => {
    const lines = detailLines(exportRosterText(rosterOf('empire', 'emp-white-wolf-knights'), empire, 'es'))
    expect(lines[2].trim()).toBe('· Caballo de Guerra con Barda')
    expect(lines[3]).toMatch(/^\s+M\s+HA\s+HP\s+F\s+R\s+H\s+I\s+A\s+L$/)
    // A warhorse moves 8" = 20 cm (MOVEMENT_CM).
    expect(lines[4].trim().split(/\s+/)).toEqual(['20', '3', '0', '3', '3', '1', '3', '1', '5'])
  })

  it('prints the fixed steed of every cavalry regiment in both languages', () => {
    for (const army of ARMIES) {
      for (const unit of army.units.filter((u) => u.mount)) {
        for (const lang of ['en', 'es'] as const) {
          const text = exportRosterText(rosterOf(army.id, unit.id), army, lang)
          expect(text, `${unit.id} (${lang})`).toContain(`  · ${profileName(unit.mount!, lang)}\n`)
        }
      }
    }
  })

  it("still prints a chariot mount's label and its crew / beast / chassis rows", () => {
    const orcs = getArmy('orcs-and-goblins')!
    const text = exportRosterText(
      rosterOf('orcs-and-goblins', 'og-warboss-orc', { size: 1, mountId: 'mount-boar-chariot' }),
      orcs,
    )
    const lines = detailLines(text)
    const labels = lines.filter((l) => l.startsWith('  · ')).map((l) => l.trim())
    expect(labels).toEqual(['· Orc Boar Chariot (+81 pts)', '· 2 Orc crew', '· 2 War Boars', '· Chariot'])
  })
})

describe('exportRosterText fixed magic items and fixed extras (OLD-63)', () => {
  const kfRoster: Roster = {
    id: 'r',
    name: 'Reikland',
    armyId: 'empire',
    pointsLimit: 2000,
    entries: [{ id: 'k', unitId: 'emp-karl-franz', size: 1, optionIds: [], magicItemIds: [], isGeneral: true }],
  }
  const lines = (text: string) => text.split('\n').map((l) => l.trim())

  it('exports Karl Franz at 285 with both fixed items tagged, in the list and the detail block', () => {
    const text = exportRosterText(kfRoster, empire)
    expect(text).toContain('Emperor Karl Franz ............ 285 pts')
    expect(text).toContain('Emperor Karl Franz — 285 pts')
    const l = lines(text)
    expect(l).toContain('* Hammer of Sigmar (100 pts) [fixed]')
    expect(l).toContain('* The Silver Seal (75 pts) [fixed]')
    expect(l.some((x) => x.startsWith('* Hammer of Sigmar (100 pts) [fixed] — '))).toBe(true)
  })

  it('tags them in Spanish', () => {
    const text = exportRosterText(kfRoster, empire, 'es')
    expect(text).toContain('El Emperador Karl Franz ............ 285 ptos')
    const l = lines(text)
    expect(l).toContain('* Martillo de Sigmar (100 ptos) [fijo]')
    expect(l).toContain('* El Sello de Plata (75 ptos) [fijo]')
  })

  it('prints an included item as "(included)" and each fixed extra as + <name> (+N pts)', () => {
    const synth = {
      ...empire,
      units: [
        ...empire.units,
        {
          id: 'synth-hero',
          name: 'Synth Hero',
          role: 'character' as const,
          pointsPerModel: 100,
          isCharacter: true,
          characterRank: 'lord' as const,
          fixedMagicItems: [{ id: 'mi-silver-seal', included: true }],
          fixedExtras: [{ id: 'x', name: 'War Wagon', nameEs: 'Carromato', points: 40 }],
        },
      ],
    }
    const r: Roster = {
      ...kfRoster,
      entries: [{ id: 's', unitId: 'synth-hero', size: 1, optionIds: [], magicItemIds: [], isGeneral: true }],
    }
    const en = lines(exportRosterText(r, synth))
    expect(en).toContain('* The Silver Seal (included) [fixed]')
    expect(en.filter((x) => x === '+ War Wagon (+40 pts)')).toHaveLength(2)
    expect(en).toContain('[General] Synth Hero ............ 140 pts')
    const es = lines(exportRosterText(r, synth, 'es'))
    expect(es).toContain('* El Sello de Plata (incluido) [fijo]')
    expect(es.filter((x) => x === '+ Carromato (+40 ptos)')).toHaveLength(2)
  })
})

describe('exportRosterText counted options (OLD-63)', () => {
  const hunter = {
    id: 'synth-hunter',
    name: 'Synth Hunter',
    role: 'character' as const,
    pointsPerModel: 100,
    isCharacter: true,
    characterRank: 'lord' as const,
    options: [
      { id: 'hounds', name: 'Hunting Hounds', pointsPerModel: 5, counted: true },
      { id: 'guards', name: 'Guards', pointsPerModel: 10, counted: true, maxCount: 2 },
    ],
  }
  const synth = { ...empire, units: [...empire.units, hunter] }
  const r = (optionCounts?: Record<string, number>): Roster => ({
    id: 'r',
    name: 'Hunt',
    armyId: 'empire',
    pointsLimit: 2000,
    entries: [{ id: 'h', unitId: 'synth-hunter', size: 1, optionIds: [], magicItemIds: [], isGeneral: true, optionCounts }],
  })
  const lines = (text: string) => text.split('\n').map((l) => l.trim())

  it('prints <name> ×N (+total pts) in the list and the detail block when N > 0', () => {
    const text = exportRosterText(r({ hounds: 4, guards: 0 }), synth)
    expect(text).toContain('[General] Synth Hunter ............ 120 pts')
    expect(lines(text)).toContain('+ Hunting Hounds ×4 (+20 pts)')
    expect(text).toContain('  Options: Hunting Hounds ×4 (+20 pts)')
    expect(text).not.toContain('Guards')
  })

  it('prints it in Spanish, with the option name from OPTION_ES', () => {
    expect(lines(exportRosterText(r({ hounds: 4 }), synth, 'es'))).toContain('+ Mastines de Caza ×4 (+20 ptos)')
  })

  it('prints nothing for an entry without counts', () => {
    expect(exportRosterText(r(), synth)).not.toContain('Hunting Hounds')
  })
})

// OLD-63, Norsca PDF 32 and 35: Sturmjarl's page prices the Gift of Loki and
// his Runes at 100 and 30, the item cards at 50 and 75. With the card-price
// option ticked (OLD-70) the locked rows print the card prices and the option
// itself is free.
describe('exportRosterText Sturmjarl card prices (OLD-63, OLD-70)', () => {
  const norse = getArmy('norse')!
  const r: Roster = {
    id: 'r',
    name: 'Ejsgard',
    armyId: 'norse',
    pointsLimit: 2000,
    entries: [{ id: 's', unitId: 'no-sturmjarl', size: 1, optionIds: ['card-prices'], magicItemIds: [] }],
  }
  const lines = (text: string) => text.split('\n').map((l) => l.trim())

  it('prints the rows at the card prices and the option at +0, ticked', () => {
    const text = exportRosterText(r, norse)
    expect(lines(text)).toContain('+ Item-card prices (Gift of Loki 50, Runes 75) (+0 pts)')
    expect(text).toContain('Gift of Loki (50 pts) [fixed]')
    expect(text).toContain('Runes (Rune-Bones) (75 pts) [fixed]')
    expect(text).toContain('Stürmjarl, Shaman Lord of Ejsgard — 441 pts')
  })

  it('prints the rows at the page prices when the option is not ticked', () => {
    const text = exportRosterText({ ...r, entries: [{ ...r.entries[0], optionIds: [] }] }, norse)
    expect(text).toContain('Gift of Loki (100 pts) [fixed]')
    expect(text).toContain('Runes (Rune-Bones) (30 pts) [fixed]')
    expect(text).toContain('Stürmjarl, Shaman Lord of Ejsgard — 446 pts')
  })

  it('prints it in Spanish', () => {
    expect(lines(exportRosterText(r, norse, 'es'))).toContain(
      '+ Precios de las cartas (Don de Loki 50, Runas 75) (+0 ptos)',
    )
  })
})
