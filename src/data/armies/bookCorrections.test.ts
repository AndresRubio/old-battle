import { describe, it, expect } from 'vitest'
import { getArmy } from './index'
import { validateRoster } from '../../rules/validate'
import { entryPoints } from '../../rules/points'
import { RULE_PHRASE_ES } from '../../i18n/rulePhrases'
import type { MountOption, Roster, RosterEntry, StatLine, UnitProfile } from '../types'

// OLD-73 (1/3): profile and data corrections found while verifying OLD-67 to
// OLD-71. Every row below was read on the scanned book; the page is cited next
// to it. Movement is stored in inches (Spanish centimetres through MOVEMENT_CM).

const unitOf = (armyId: string, unitId: string): UnitProfile => {
  const u = getArmy(armyId)!.units.find((x) => x.id === unitId)
  if (!u) throw new Error(`${armyId}/${unitId} not found`)
  return u
}

/** Every mount option with this id, across the whole army (one constant is shared by many units). */
const mountsWithId = (armyId: string, mountId: string): MountOption[] =>
  getArmy(armyId)!.units.flatMap((u) => (u.mounts ?? []).filter((m) => m.id === mountId))

const line = (m: number, ws: number, bs: number, s: number, t: number, w: number, i: number, a: number, ld: number): StatLine => ({
  M: m, WS: ws, BS: bs, S: s, T: t, W: w, I: i, A: a, Ld: ld,
})

describe('OLD-73 corrected profiles', () => {
  // Reino del Caos p.109: "Tuskgor 18 3 0 4 4 2 2 1 3" (18cm = 7").
  it('Beastman Chariot Tuskgors print the book row', () => {
    const p = unitOf('chaos', 'ch-beast-chariot').profiles!.find((x) => x.name === '2 Tuskgors')!
    expect(p.statLine).toEqual(line(7, 3, 0, 4, 4, 2, 2, 1, 3))
  })

  // Reino del Caos p.76 and p.103: "Corcel del Caos 20 4 0 4 4 1 4 1 5" (20cm = 8").
  describe('Chaos Steed', () => {
    const steed = line(8, 4, 0, 4, 4, 1, 4, 1, 5)
    it('the character mount', () => {
      const found = mountsWithId('chaos', 'mount-chaos-steed')
      expect(found.length).toBeGreaterThan(0)
      for (const m of found) expect(m.statLine).toEqual(steed)
    })
    it.each(['ch-knights', 'ch-swords-of-chaos-knights'])('%s steed', (id) => {
      expect(unitOf('chaos', id).mount!.statLine).toEqual(steed)
    })
    it('the Chaos Chariot team', () => {
      const p = unitOf('chaos', 'ch-chariot').profiles!.find((x) => x.name === '2 Chaos Steeds')!
      expect(p.statLine).toEqual(steed)
    })
  })

  // No Muertos pp.59, 79, 80: "Corcel Esquelético 20 2 0 3 3 1 2 1 5".
  describe('Undead (1995) Skeletal Steed', () => {
    const steed = line(8, 2, 0, 3, 3, 1, 2, 1, 5)
    it('the Skeletal Steed mount', () => {
      const found = mountsWithId('undead', 'mount-skeletal-steed')
      expect(found.length).toBeGreaterThan(0)
      for (const m of found) expect(m.statLine).toEqual(steed)
    })
    it('the mount that keeps the Nightmare id is the same steed, labelled as the book does, without fear', () => {
      const found = mountsWithId('undead', 'mount-nightmare')
      expect(found.length).toBeGreaterThan(0)
      for (const m of found) {
        expect(m.statLine).toEqual(steed)
        expect(m.name).toBe('Skeletal Steed')
        expect(m.nameEs).toBe('Corcel Esquelético')
        expect(m.specialRules ?? []).not.toContain('Causes fear')
      }
    })
    it('generic vampires ride it, and their tags say so', () => {
      for (const id of ['ud-general-vampire-lord', 'ud-vampire']) {
        const u = unitOf('undead', id)
        expect(u.mounts![0].id).toBe('mount-nightmare')
        expect(u.mounts![0].name).toBe('Skeletal Steed')
        expect(u.specialRules, id).toContain('May ride a Skeletal Steed (+2), a monster or a Skeleton Chariot (+60 scythed / +40 plain)')
        expect(u.specialRules!.some((r) => /Nightmare/.test(r)), id).toBe(false)
      }
      expect(RULE_PHRASE_ES['May ride a Nightmare (+2), a monster or a Skeleton Chariot (+60 scythed / +40 plain)']).toBeUndefined()
    })
    it('Skeletal Cavalry and the Undead Chariot team', () => {
      expect(unitOf('undead', 'ud-skeletal-cavalry').mount!.statLine).toEqual(steed)
      const p = unitOf('undead', 'ud-undead-chariot').profiles!.find((x) => x.name === '2 Skeletal Steeds')!
      expect(p.statLine).toEqual(steed)
    })
    it('a saved roster keeps the steed price', () => {
      const e: RosterEntry = { id: 'e', unitId: 'ud-vampire', size: 1, optionIds: [], mountId: 'mount-nightmare', magicItemIds: [] }
      const bare: RosterEntry = { ...e, mountId: undefined }
      expect(entryPoints(e, getArmy('undead')!) - entryPoints(bare, getArmy('undead')!)).toBe(2)
    })
  })

  // Condes Vampiro pp.58 and 62: "Pesadilla 20 2 0 3 3 1 2 1 5". Owner decision: Ld 5 wins over Manfred's p.73 (Ld 4).
  describe('Vampire Counts Nightmare', () => {
    const nightmare = line(8, 2, 0, 3, 3, 1, 2, 1, 5)
    it('the Nightmare mount keeps its name and id', () => {
      const found = mountsWithId('vampire-counts', 'mount-nightmare')
      expect(found.length).toBeGreaterThan(0)
      for (const m of found) {
        expect(m.statLine).toEqual(nightmare)
        expect(m.name).toBe('Nightmare')
        expect(m.nameEs).toBe('Pesadilla')
      }
    })
    // The Hellsteed prints no row of its own in the book, so it follows the Nightmare it is built on.
    it('the Hellsteed follows the Nightmare', () => {
      const found = mountsWithId('vampire-counts', 'mount-hellsteed')
      expect(found.length).toBeGreaterThan(0)
      for (const m of found) expect(m.statLine).toEqual(nightmare)
    })
    it("Manfred's Nightmare uses Ld 5 too", () => {
      const p = unitOf('vampire-counts', 'vc-manfred-von-carstein').profiles!.find((x) => x.name === 'Nightmare')!
      expect(p.statLine).toEqual(nightmare)
    })
  })
})

// Elfos Silvanos p.66 and p.68: Treemen are a Regiment-section entry, "hasta un
// Hombre Árbol por cada 1.000 puntos", with no ceiling, and "no es necesario
// organizar a los Hombres Árbol en unidades".
describe('Wood Elves Treemen (OLD-73)', () => {
  const army = getArmy('wood-elves')!
  const treeman = unitOf('wood-elves', 'we-treeman')
  const entry = (id: string, unitId: string, size = 1): RosterEntry => ({ id, unitId, size, optionIds: [], magicItemIds: [] })
  const roster = (pointsLimit: number, entries: RosterEntry[]): Roster => ({ id: 'r', name: 't', armyId: 'wood-elves', pointsLimit, entries })
  const trees = (n: number) => Array.from({ length: n }, (_, i) => entry(`t${i}`, 'we-treeman'))
  const general = entry('g', army.units.find((u) => u.canBeGeneral)!.id)
  const ratio = (r: Roster) => validateRoster(r, army, 'en').filter((v) => v.rule === 'unit-ratio-max')

  it('is a regiment, with the tag and cap the book prints', () => {
    expect(treeman.role).toBe('regiment')
    expect(treeman.specialRules).toContain('0-1 per 1,000 pts')
    expect(treeman.specialRules).not.toContain('0-1 per 1,000 pts (max 3)')
    expect(RULE_PHRASE_ES['0-1 per 1,000 pts']).toBe('0-1 por cada 1.000 pts')
    const cap = army.selectionRules!.ratioCaps!.find((c) => c.unitId === 'we-treeman')!
    expect(cap.perPoints).toBe(1000)
    expect(cap.absoluteMax).toBeUndefined()
  })

  it('allows two Treemen at 2,000 points and warns on a third', () => {
    expect(ratio(roster(2000, [general, ...trees(2)]))).toHaveLength(0)
    expect(ratio(roster(2000, [general, ...trees(3)]))).toHaveLength(1)
  })

  it('allows five Treemen at 5,000 points, and no more', () => {
    expect(ratio(roster(5000, [general, ...trees(5)]))).toHaveLength(0)
    expect(ratio(roster(5000, [general, ...trees(6)]))).toHaveLength(1)
  })

  it('counts the models when the Treemen are taken as one entry', () => {
    expect(ratio(roster(2000, [general, entry('t', 'we-treeman', 2)]))).toHaveLength(0)
    expect(ratio(roster(2000, [general, entry('t', 'we-treeman', 3)]))).toHaveLength(1)
  })

  it('a single Treeman raises no unit-size finding and gets no command group', () => {
    const v = validateRoster(roster(2000, [general, entry('t', 'we-treeman')]), army, 'en')
    expect(v.filter((x) => x.rule === 'min-size' || x.rule === 'max-size')).toEqual([])
    expect(treeman.noCommand).toBe(true)
    expect((treeman.options ?? []).map((o) => o.id)).not.toContain('standard')
    expect((treeman.options ?? []).map((o) => o.id)).not.toContain('musician')
  })
})

// Orcos y Goblins p.92: Gorfang may be taken "como un Gran Jefe o Señor de la
// Guerra Orco"; the page still prints "hasta dos objetos mágicos".
describe('Gorfang Rotgut (OLD-73)', () => {
  it('can be the General and keeps two magic items', () => {
    const g = unitOf('orcs-and-goblins', 'og-gorfang')
    expect(g.canBeGeneral).toBe(true)
    const r: Roster = {
      id: 'r', name: 't', armyId: 'orcs-and-goblins', pointsLimit: 2000,
      entries: [{ id: 'g', unitId: 'og-gorfang', size: 1, optionIds: [], magicItemIds: [], isGeneral: true }],
    }
    expect(validateRoster(r, getArmy('orcs-and-goblins')!, 'en').filter((v) => v.rule === 'invalid-general')).toEqual([])
    expect(g.characterRank).toBe('hero')
  })
})
