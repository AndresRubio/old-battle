import { describe, it, expect } from 'vitest'
import { validateRoster } from './validate'
import { entryPoints, carriedMagicItems } from './points'
import { magicItemAllowance, usedMagicItemSlots } from './magicItems'
import { getArmy } from '../data/armies'
import { RULE_PHRASE_ES } from '../i18n/rulePhrases'
import type { Roster, RosterEntry } from '../data/types'

// OLD-73 (2/3): the rule changes found while verifying OLD-67 to OLD-71. Each
// block cites the printed page the rule comes from.

const entry = (id: string, unitId: string, over: Partial<RosterEntry> = {}): RosterEntry => ({
  id, unitId, size: 1, optionIds: [], magicItemIds: [], ...over,
})

const rosterOf = (armyId: string, entries: RosterEntry[], pointsLimit = 0): Roster => ({
  id: 'r', name: 't', armyId, pointsLimit, entries,
})

const found = (armyId: string, entries: RosterEntry[], rule: string, lang: 'en' | 'es' = 'en') =>
  validateRoster(rosterOf(armyId, entries), getArmy(armyId)!, lang).filter((v) => v.rule === rule)

describe('OLD-73 — characters whose page makes them the General (must-be-general)', () => {
  // Paladines del Caos p.44: "Si se incluye a Gorthor siempre será el General."
  it('Gorthor must be the General', () => {
    const vs = found('chaos', [entry('g', 'ch-lord', { isGeneral: true }), entry('x', 'ch-gorthor')], 'must-be-general')
    expect(vs.map((v) => v.entryId)).toEqual(['x'])
    expect(found('chaos', [entry('x', 'ch-gorthor', { isGeneral: true })], 'must-be-general')).toEqual([])
  })

  // Norsca PDF 34: "If you decide to do this, Keorl Thunderhand is the general of your army".
  it('Keorl Thunderhand must be the General', () => {
    const vs = found('norse', [entry('g', 'no-general', { isGeneral: true }), entry('x', 'no-keorl-thunderhand')], 'must-be-general')
    expect(vs.map((v) => v.entryId)).toEqual(['x'])
    expect(found('norse', [entry('x', 'no-keorl-thunderhand', { isGeneral: true })], 'must-be-general')).toEqual([])
  })

  // Skaven p.71: Ikit Claw stays optional (owner decision; the page also says "Si se adquiere
  // como General"). Vampire Counts p.73: Manfred "no es obligatorio".
  it('Ikit Claw and Manfred von Carstein stay optional', () => {
    expect(found('skaven', [entry('g', 'sk-warlord', { isGeneral: true }), entry('x', 'sk-ikit-claw')], 'must-be-general')).toEqual([])
    expect(found('vampire-counts', [entry('g', 'vc-vampire-lord', { isGeneral: true }), entry('x', 'vc-manfred-von-carstein')], 'must-be-general')).toEqual([])
  })
})

describe('OLD-73 — the Slann General as the Battle Standard Bearer (Hombres Lagarto p.73)', () => {
  const lz = getArmy('lizardmen')!
  const slann = lz.units.find((u) => u.id === 'lz-slann')!
  const talismans = lz.magicItems.filter((i) => i.category === 'enchanted').slice(0, 3).map((i) => i.id)
  const banner = lz.magicItems.find((i) => i.id === 'mi-banner-of-power')!

  it('offers the +50 BSB choice, priced on top of his 115', () => {
    expect(slann.canBeBSB).toBe(true)
    expect(slann.bsbPoints).toBe(50)
    expect(entryPoints(entry('s', 'lz-slann', { isGeneral: true }), lz)).toBe(115)
    expect(entryPoints(entry('s', 'lz-slann', { isGeneral: true, isBSB: true }), lz)).toBe(165)
  })

  it('a magic banner he takes as the BSB does not use one of his item slots', () => {
    const e = entry('s', 'lz-slann', { isGeneral: true, isBSB: true, magicItemIds: [banner.id, talismans[0], talismans[1]] })
    expect(magicItemAllowance(e, slann)).toBe(2)
    expect(usedMagicItemSlots(e, slann, lz)).toBe(2)
    const rs = validateRoster(rosterOf('lizardmen', [e]), lz).map((v) => v.rule)
    expect(rs).not.toContain('magic-items-count')
    expect(rs).not.toContain('magic-items-banner-bsb')
  })

  it('the banner still pays its points, and a third ordinary item is over the allowance', () => {
    const e = entry('s', 'lz-slann', { isGeneral: true, isBSB: true, magicItemIds: [banner.id, ...talismans] })
    expect(usedMagicItemSlots(e, slann, lz)).toBe(3)
    expect(validateRoster(rosterOf('lizardmen', [e]), lz).map((v) => v.rule)).toContain('magic-items-count')
    const plain = entry('s', 'lz-slann', { isGeneral: true, isBSB: true })
    expect(entryPoints({ ...plain, magicItemIds: [banner.id] }, lz) - entryPoints(plain, lz)).toBe(banner.points)
  })

  it('without the BSB role the banner is not free and is flagged', () => {
    const e = entry('s', 'lz-slann', { isGeneral: true, magicItemIds: [banner.id, talismans[0], talismans[1]] })
    expect(usedMagicItemSlots(e, slann, lz)).toBe(3)
    const rs = validateRoster(rosterOf('lizardmen', [e]), lz).map((v) => v.rule)
    expect(rs).toContain('magic-items-count')
    expect(rs).toContain('magic-items-banner-bsb')
  })

  // Hombres Lagarto p.73 frees only "the General's" banner: a Slann who is not the General pays a slot.
  it('a Slann toggled BSB but not the General still counts the banner as an item', () => {
    const e = entry('s', 'lz-slann', { isBSB: true, magicItemIds: [banner.id, talismans[0], talismans[1]] })
    expect(usedMagicItemSlots(e, slann, lz)).toBe(3)
    expect(validateRoster(rosterOf('lizardmen', [e]), lz).map((v) => v.rule)).toContain('magic-items-count')
  })

  it('only one banner is set aside: a second banner uses a slot and clashes by category', () => {
    const other = lz.magicItems.find((i) => i.category === 'banner' && i.id !== banner.id)!
    const e = entry('s', 'lz-slann', { isGeneral: true, isBSB: true, magicItemIds: [banner.id, other.id, talismans[0]] })
    expect(usedMagicItemSlots(e, slann, lz)).toBe(2)
    const rs = validateRoster(rosterOf('lizardmen', [e]), lz).map((v) => v.rule)
    expect(rs).toContain('magic-items-category')
    expect(rs).not.toContain('magic-items-count')
    const more = { ...e, magicItemIds: [...e.magicItemIds, talismans[1]] }
    expect(usedMagicItemSlots(more, slann, lz)).toBe(3)
    expect(validateRoster(rosterOf('lizardmen', [more]), lz).map((v) => v.rule)).toContain('magic-items-count')
  })

  it('other BSB characters (Ludwig) keep counting a banner as an item', () => {
    const emp = getArmy('empire')!
    const ludwig = emp.units.find((u) => u.id === 'emp-ludwig')!
    const e = entry('l', 'emp-ludwig', { isBSB: true, magicItemIds: ['mi-banner-of-power'] })
    expect(usedMagicItemSlots(e, ludwig, emp)).toBe(1)
  })

  it('his tag reads in both languages', () => {
    const tag = slann.specialRules!.find((r) => r.includes('Battle Standard'))!
    expect(tag).toBe('May be the army Battle Standard Bearer (+50 pts); a magic standard he carries is not one of his magic items')
    expect(RULE_PHRASE_ES[tag]).toBeTruthy()
    expect(RULE_PHRASE_ES['May carry Battle Standard (+50 pts; not a magic item)']).toBeUndefined()
  })
})

describe('OLD-73 — Throt must take the Warpstone Amulet first (Skaven p.72)', () => {
  const sk = getArmy('skaven')!
  const throt = sk.units.find((u) => u.id === 'sk-throt')!

  it('carries the amulet as a fixed item, charged on top of his 70', () => {
    expect(throt.fixedMagicItems).toEqual([{ id: 'mi-amulet-of-warpstone-fragment' }])
    expect(entryPoints(entry('t', 'sk-throt'), sk)).toBe(80)
  })

  it('keeps his allowance of 2, so one free pick remains', () => {
    const e = entry('t', 'sk-throt')
    expect(magicItemAllowance(e, throt)).toBe(2)
    expect(usedMagicItemSlots(e, throt, sk)).toBe(1)
    expect(carriedMagicItems(e, throt, sk).map((c) => [c.item.id, c.fixed])).toEqual([['mi-amulet-of-warpstone-fragment', true]])
    const withPick = entry('t', 'sk-throt', { magicItemIds: ['mi-cruel-sword'] })
    expect(validateRoster(rosterOf('skaven', [withPick]), sk).map((v) => v.rule)).not.toContain('magic-items-count')
  })

  it('has the new tag with its Spanish key', () => {
    const tag = 'Must take the Warpstone Amulet as his first magic item (+10 pts)'
    expect(throt.specialRules).toContain(tag)
    expect(RULE_PHRASE_ES[tag]).toBeTruthy()
    expect(throt.specialRules!.some((r) => r.startsWith('May take the Warpstone Amulet'))).toBe(false)
  })
})

describe('OLD-73 — Ikit Claw draws on every deck but Waaagh! (Skaven p.71)', () => {
  it('lists the Skaven deck and the four battle-magic decks', () => {
    const ikit = getArmy('skaven')!.units.find((u) => u.id === 'sk-ikit-claw')!
    expect(ikit.lores).toEqual(['skaven', 'battle', 'high', 'dark', 'necromantic'])
  })
})

describe('OLD-73 — one Throne of Power in a Dwarf army (Enanos pp.83 and 94)', () => {
  const dw = getArmy('dwarfs')!
  const throne = ['throne-of-power']
  const find = (entries: RosterEntry[], rule: string, lang: 'en' | 'es' = 'en') => found('dwarfs', entries, rule, lang)

  it('warns once when two entries carry the Throne', () => {
    const vs = find(
      [
        entry('g', 'dw-general', { isGeneral: true, optionIds: throne }),
        entry('t', 'dw-thorgrim', { optionIds: throne }),
      ],
      'option-one-per-army',
    )
    expect(vs).toHaveLength(1)
    expect(vs[0].severity).toBe('warning')
    expect(vs[0].message).toBe('Throne of Power: the army has only one, but 2 entries take it.')
    expect(find(
      [entry('g', 'dw-general', { isGeneral: true, optionIds: throne }), entry('t', 'dw-thorgrim', { optionIds: throne })],
      'option-one-per-army',
      'es',
    )[0].message).toBe('Trono del Poder: el ejército sólo tiene uno, pero 2 entradas lo llevan.')
  })

  it('is silent for a single Throne, whoever carries it', () => {
    expect(find([entry('g', 'dw-general', { isGeneral: true, optionIds: throne }), entry('t', 'dw-thorgrim')], 'option-one-per-army')).toEqual([])
    expect(find([entry('g', 'dw-general', { isGeneral: true }), entry('t', 'dw-thorgrim', { optionIds: throne })], 'option-one-per-army')).toEqual([])
  })

  it('warns when the generic General takes the Throne without being the army General', () => {
    const vs = find(
      [entry('t', 'dw-thorgrim', { isGeneral: true }), entry('g', 'dw-general', { optionIds: throne })],
      'option-general-only',
    )
    expect(vs).toHaveLength(1)
    expect(vs[0].severity).toBe('warning')
    expect(vs[0].entryId).toBe('g')
    expect(vs[0].message).toBe('Dwarf General: Throne of Power is only for the army General, and this character is not the General.')
    expect(find(
      [entry('t', 'dw-thorgrim', { isGeneral: true }), entry('g', 'dw-general', { optionIds: throne })],
      'option-general-only',
      'es',
    )[0].message).toBe('General Enano: Trono del Poder es sólo para el General del ejército, y este personaje no es el General.')
  })

  it('is silent when the generic General is the army General, or takes no Throne', () => {
    expect(find([entry('g', 'dw-general', { isGeneral: true, optionIds: throne })], 'option-general-only')).toEqual([])
    expect(find([entry('t', 'dw-thorgrim', { isGeneral: true }), entry('g', 'dw-general')], 'option-general-only')).toEqual([])
  })

  it('does not apply to Thorgrim, who may bring the Throne for another king', () => {
    expect(find([entry('g', 'dw-general', { isGeneral: true }), entry('t', 'dw-thorgrim', { optionIds: throne })], 'option-general-only')).toEqual([])
  })

  it('leaves the flat 140 price alone', () => {
    expect(entryPoints(entry('g', 'dw-general', { isGeneral: true, optionIds: throne }), dw) - entryPoints(entry('g', 'dw-general', { isGeneral: true }), dw)).toBe(140)
  })
})

describe('OLD-73 — a Battle Standard Bearer companion counts as the army BSB (multiple-bsbs)', () => {
  const clash = (entries: RosterEntry[]) => found('orcs-and-goblins', entries, 'multiple-bsbs')

  // Orcos y Goblins p.91: "Niblit ... con el Estandarte de Batalla" (OLD-72).
  it('Grom plus a dedicated Orc Battle Standard Bearer raises the finding', () => {
    const vs = clash([entry('g', 'og-grom', { isGeneral: true }), entry('b', 'og-bsb-orc')])
    expect(vs).toHaveLength(1)
    expect(vs[0].severity).toBe('warning')
  })

  // The editor cannot toggle isBSB on og-warboss-orc (no canBeBSB); this is a saved-roster state,
  // the same one the existing multiple-bsbs rule already handles for any entry with isBSB set.
  it('Grom plus a toggled Battle Standard Bearer raises it too', () => {
    expect(clash([entry('g', 'og-grom', { isGeneral: true }), entry('w', 'og-warboss-orc', { isBSB: true })])).toHaveLength(1)
  })

  it('Grom plus a character who is not a Battle Standard Bearer raises nothing', () => {
    expect(clash([entry('g', 'og-grom', { isGeneral: true }), entry('w', 'og-warboss-orc')])).toEqual([])
  })

  it('Grom alone, or a lone Orc BSB, raises nothing', () => {
    expect(clash([entry('g', 'og-grom', { isGeneral: true })])).toEqual([])
    expect(clash([entry('w', 'og-warboss-orc', { isGeneral: true }), entry('b', 'og-bsb-orc')])).toEqual([])
  })
})
