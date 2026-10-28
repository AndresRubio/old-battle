import { describe, it, expect } from 'vitest'
import { getArmy } from '../data/armies'
import type { Roster, RosterEntry } from '../data/types'
import { validateRoster } from './validate'
import { entryPoints } from './points'
import { magicItemAllowance, usedMagicItemSlots } from './magicItems'
import { findUnit } from './points'

// OLD-72 (Orcos y Goblins p.91): "Niblit puede llevar un único objeto mágico".
const og = getArmy('orcs-and-goblins')!
const grom = findUnit(og, 'og-grom')!

const SWORD = 'mi-sword-of-strength' // weapon, 20
const SWORD_2 = 'mi-sword-of-heroes' // weapon, 60
const SHIELD = 'mi-enchanted-shield' // shield, 5
const WARD = 'mi-jade-amulet' // ward, 5
const BANNER = 'mi-war-banner-of-gork' // banner, 25
const CROWN = 'mi-golden-crown-of-atrazar' // ward, helm group
const HELM = 'mi-dragon-helm' // armour, helm group

function gromEntry(over: Partial<RosterEntry> = {}): RosterEntry {
  return { id: 'g', unitId: 'og-grom', size: 1, optionIds: [], magicItemIds: [], ...over }
}

function roster(...entries: RosterEntry[]): Roster {
  return { id: 'r', name: 'r', armyId: og.id, pointsLimit: 3000, entries }
}

const rules = (r: Roster, lang: 'en' | 'es' = 'en') => validateRoster(r, og, lang).map((v) => v.rule)
const magicRules = (r: Roster) => rules(r).filter((x) => x.startsWith('magic-items'))

describe('Grom data', () => {
  it('declares Niblit as a one-item battle standard bearer', () => {
    expect(grom.companionMagicItems).toEqual({ name: 'Niblit', slots: 1, isBSB: true })
  })
})

describe("Niblit's item: points and Grom's own allowance", () => {
  it('adds the item cost to the entry and leaves the base 257 alone', () => {
    const base = entryPoints(gromEntry(), og)
    expect(base).toBe(257)
    expect(entryPoints(gromEntry({ companionMagicItemIds: [SWORD] }), og)).toBe(base + 20)
  })

  it("does not change Grom's own used slots or allowance", () => {
    const e = gromEntry({ companionMagicItemIds: [SWORD] })
    expect(usedMagicItemSlots(e, grom, og)).toBe(usedMagicItemSlots(gromEntry(), grom, og))
    expect(magicItemAllowance(e, grom)).toBe(3)
  })

  it('ignores a companion item id that is not in the army pool', () => {
    expect(entryPoints(gromEntry({ companionMagicItemIds: ['mi-nope'] }), og)).toBe(257)
  })

  it('ignores companion items on a unit with no companion', () => {
    const gorbad = findUnit(og, 'og-gorbad')!
    const e: RosterEntry = { id: 'x', unitId: gorbad.id, size: 1, optionIds: [], magicItemIds: [], companionMagicItemIds: [SWORD] }
    const clean: RosterEntry = { ...e, companionMagicItemIds: undefined }
    expect(entryPoints(e, og)).toBe(entryPoints(clean, og))
    expect(magicRules(roster(e))).toEqual(magicRules(roster(clean)))
  })
})

describe("Niblit's item: findings", () => {
  it('raises no magic-item finding for one item', () => {
    expect(magicRules(roster(gromEntry({ companionMagicItemIds: [SWORD] })))).toEqual([])
  })

  it('names Niblit when he carries two items', () => {
    const r = roster(gromEntry({ companionMagicItemIds: [SWORD, WARD] }))
    const v = validateRoster(r, og, 'en').filter((x) => x.rule === 'magic-items-count')
    expect(v).toHaveLength(1)
    expect(v[0].message).toContain('Niblit')
    expect(v[0].message).not.toContain('Grom')
    expect(v[0].message).toContain('may carry only 1')
    expect(v[0].entryId).toBe('g')
    const es = validateRoster(r, og, 'es').find((x) => x.rule === 'magic-items-count')!
    expect(es.message).toContain('Niblit')
    expect(es.message).not.toContain('Grom')
  })

  it('names Niblit when his items share a restricted category', () => {
    const r = roster(gromEntry({ companionMagicItemIds: [SWORD, SWORD_2] }))
    const v = validateRoster(r, og, 'en').filter((x) => x.rule === 'magic-items-category')
    expect(v).toHaveLength(1)
    expect(v[0].message).toContain('Niblit')
    expect(v[0].message).not.toContain('Grom')
  })

  it('names Niblit for a second crown or helm', () => {
    const r = roster(gromEntry({ companionMagicItemIds: [CROWN, HELM] }))
    const v = validateRoster(r, og, 'en').filter((x) => x.rule === 'magic-items-exclusive-group')
    expect(v).toHaveLength(1)
    expect(v[0].message).toContain('Niblit')
  })

  it("counts Niblit's categories apart from Grom's: his fixed Axe and a magic sword on Niblit", () => {
    const r = roster(gromEntry({ companionMagicItemIds: [SWORD] }))
    expect(rules(r)).not.toContain('magic-items-category')
  })

  it("does not let Niblit's items push Grom over his own allowance", () => {
    // Grom: fixed Axe + two picks = 3 (full). Niblit: one more. No count finding.
    const r = roster(gromEntry({ magicItemIds: [SHIELD, WARD], companionMagicItemIds: [SWORD] }))
    expect(rules(r)).not.toContain('magic-items-count')
  })

  it("does not let Grom's picks raise Niblit's finding", () => {
    const r = roster(gromEntry({ magicItemIds: [SHIELD, WARD, SWORD] }))
    const v = validateRoster(r, og, 'en').filter((x) => x.rule === 'magic-items-count')
    expect(v).toHaveLength(1)
    expect(v[0].message).toContain('Grom')
  })

  it('lets Niblit carry a magic banner, since he is the battle standard bearer', () => {
    const r = roster(gromEntry({ companionMagicItemIds: [BANNER] }))
    expect(rules(r)).not.toContain('magic-items-banner-bsb')
  })

  it('still stops Grom carrying a banner when he is not the BSB', () => {
    const r = roster(gromEntry({ magicItemIds: [BANNER] }))
    expect(rules(r)).toContain('magic-items-banner-bsb')
  })

  it('reports the same item on Grom and Niblit as a duplicate', () => {
    const r = roster(gromEntry({ magicItemIds: [SWORD], companionMagicItemIds: [SWORD] }))
    const v = validateRoster(r, og, 'en').filter((x) => x.rule === 'magic-items-unique')
    expect(v).toHaveLength(1)
    expect(v[0].message).toContain('2')
  })

  it('reports an item shared between another character and Niblit', () => {
    const other: RosterEntry = { id: 'b', unitId: 'og-warboss-orc', size: 1, optionIds: [], magicItemIds: [SWORD] }
    const r = roster(gromEntry({ companionMagicItemIds: [SWORD] }), other)
    expect(rules(r)).toContain('magic-items-unique')
  })

  it('does not report a duplicable item shared with Niblit', () => {
    const SCROLL = 'mi-scroll-of-magic-destruction'
    const r = roster(gromEntry({ magicItemIds: [SCROLL], companionMagicItemIds: [SCROLL] }))
    expect(rules(r)).not.toContain('magic-items-unique')
  })

  it('does not count a repeated id inside the companion list twice', () => {
    const r = roster(gromEntry({ companionMagicItemIds: [SWORD, SWORD] }))
    expect(magicRules(r)).toEqual([])
  })
})

describe("Niblit's item: fractional points", () => {
  it('adds a half-point item exactly', () => {
    const half = { ...og, magicItems: [...og.magicItems, { id: 'mi-half', name: 'Half', category: 'enchanted' as const, points: 0.5 }] }
    expect(entryPoints(gromEntry({ companionMagicItemIds: ['mi-half'] }), half)).toBe(257.5)
  })
})

describe('a companion who is not the battle standard bearer', () => {
  const plain = {
    ...og,
    units: og.units.map((u) => (u.id === 'og-grom' ? { ...u, companionMagicItems: { name: 'Niblit', slots: 1 } } : u)),
  }
  const msgs = (ids: string[]) =>
    validateRoster(roster(gromEntry({ companionMagicItemIds: ids })), plain, 'en').filter((v) => v.rule === 'magic-items-banner-bsb')

  it('may not carry a magic banner, and the finding names him', () => {
    const v = msgs([BANNER])
    expect(v).toHaveLength(1)
    expect(v[0].message).toContain('Niblit')
    expect(v[0].message).not.toContain('Grom')
  })

  it('may carry any other item', () => {
    expect(msgs([SWORD])).toEqual([])
  })
})
