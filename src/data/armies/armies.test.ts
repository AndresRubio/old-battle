import { describe, it, expect } from 'vitest'
import { ARMIES, getArmy } from './index'
import { validateRoster } from '../../rules/validate'
import { entryPoints } from '../../rules/points'
import type { Roster } from '../types'
import { COMMON_MAGIC_ITEMS, ARMY_MAGIC_ITEMS } from '../magicItems'

describe('army data integrity', () => {
  for (const army of ARMIES) {
    describe(army.name, () => {
      it('has unique unit ids', () => {
        const ids = army.units.map((u) => u.id)
        expect(new Set(ids).size).toBe(ids.length)
      })

      it('has at least one possible General', () => {
        expect(army.units.some((u) => u.canBeGeneral)).toBe(true)
      })

      it('has core regiments and characters', () => {
        expect(army.units.some((u) => u.role === 'regiment')).toBe(true)
        expect(army.units.some((u) => u.role === 'character')).toBe(true)
      })

      it('option ids are unique within each unit and points are non-negative', () => {
        for (const u of army.units) {
          expect(u.pointsPerModel).toBeGreaterThanOrEqual(0)
          if (u.options) {
            const oids = u.options.map((o) => o.id)
            expect(new Set(oids).size).toBe(oids.length)
          }
        }
      })

      it('magic items have unique ids', () => {
        const ids = army.magicItems.map((i) => i.id)
        expect(new Set(ids).size).toBe(ids.length)
      })

      it('shows no item restricted to a different army', () => {
        // Every item this army exposes must be either common (no restrictedTo)
        // or explicitly allowed for this army id. An army-unique item must never
        // leak into another army's pool.
        const leaked = army.magicItems.filter(
          (i) => i.restrictedTo && i.restrictedTo.length > 0 && !i.restrictedTo.includes(army.id),
        )
        expect(leaked.map((i) => `${i.id} ${JSON.stringify(i.restrictedTo)}`)).toEqual([])
      })

      it('ratio-cap ids reference real units', () => {
        const ids = new Set(army.units.map((u) => u.id))
        for (const cap of army.selectionRules?.ratioCaps ?? []) {
          expect(ids.has(cap.unitId)).toBe(true)
          for (const id of cap.perUnit?.ids ?? []) expect(ids.has(id)).toBe(true)
        }
      })

      it('dependency ids reference real units', () => {
        const ids = new Set(army.units.map((u) => u.id))
        for (const dep of army.selectionRules?.dependencies ?? []) {
          expect(ids.has(dep.unitId)).toBe(true)
          expect(dep.requiresAnyOf.length).toBeGreaterThan(0)
          for (const id of dep.requiresAnyOf) expect(ids.has(id)).toBe(true)
        }
      })

      it('marks dedicated battle-standard units with isBSB', () => {
        // FAQ v2.20 §23.2: dedicated battle-standard units carry a magic banner
        // without the per-entry toggle, so they must be flagged isBSB === true.
        for (const u of army.units) {
          if (/battle-standard|-bsb/.test(u.id)) {
            expect(u.isBSB, `${u.id} should have isBSB === true`).toBe(true)
          }
        }
      })

      it('exposes no special-character item without an army restriction', () => {
        // A `special` item with no restrictedTo would appear in every army.
        const unrestrictedSpecials = army.magicItems.filter(
          (i) => i.special && (!i.restrictedTo || i.restrictedTo.length === 0),
        )
        expect(unrestrictedSpecials.map((i) => i.id)).toEqual([])
      })
    })
  }
})

describe('magic-item catalog completeness', () => {
  it('includes the Dispel Scroll and Warrior Familiar', () => {
    const ids = new Set(COMMON_MAGIC_ITEMS.map((i) => i.id))
    expect(ids.has('mi-dispel-scroll')).toBe(true)
    expect(ids.has('mi-warrior-familiar')).toBe(true)
  })
  it('marks exactly the documented exceptions as duplicable', () => {
    // FAQ v2.20 §19.3: Dispel/Power/Destroy scrolls and Healing/Strength potions are
    // "unlimited" (plus Familiars). All OTHER scrolls/potions stay unique.
    const dup = COMMON_MAGIC_ITEMS.filter((i) => i.duplicable).map((i) => i.id).sort()
    expect(dup).toEqual(
      [
        'mi-dispel-scroll',
        'mi-power-familiar',
        'mi-warrior-familiar',
        'mi-wizard-familiar',
        'mi-scroll-of-magic-destruction',
        'mi-power-scroll',
        'mi-healing-potion',
        'mi-potion-of-strength',
      ].sort(),
    )
  })
  it('marks the army-pool duplicable exceptions (Runefang, Rune of Stone)', () => {
    // FAQ §19.3 (Runefangs) and §27.5 (armour Rune of Stone) are uniqueness exceptions.
    expect(ARMY_MAGIC_ITEMS['empire'].find((i) => i.id === 'mi-runefang')?.duplicable).toBe(true)
    expect(ARMY_MAGIC_ITEMS['dwarfs'].find((i) => i.id === 'mi-rune-of-stone')?.duplicable).toBe(true)
  })
  it('flags chaos-restricted duplicable items (Chaos Familiar, Chaos Armour) in the chaos pool', () => {
    const chaos = ARMY_MAGIC_ITEMS['chaos']
    const dup = new Set(chaos.filter((i) => i.duplicable).map((i) => i.id))
    expect(dup.has('mi-chaos-familiar')).toBe(true)
    expect(dup.has('mi-chaos-armour')).toBe(true)
  })
})

describe('Phase 2 selection-rule data fixes', () => {
  it('Bretonnia: characters 0-75%, no war machines', () => {
    const c = getArmy('bretonnia')!.composition
    expect(c.maxCharactersPct).toBe(75)
    expect(c.maxWarMachinesPct).toBe(0)
  })

  it('Dogs of War: characters 0-35%, Regiments of Renown 65%+', () => {
    const c = getArmy('dogs-of-war')!.composition
    expect(c.maxCharactersPct).toBe(35)
    expect(c.minRegimentsPct).toBe(65)
  })

  it('Lizardmen: no war machines', () => {
    expect(getArmy('lizardmen')!.composition.maxWarMachinesPct).toBe(0)
  })

  it('Chaos Dwarfs: Battle Standard is 0-1', () => {
    const bsb = getArmy('chaos-dwarfs')!.units.find((u) => u.id === 'cd-battle-standard')!
    expect(bsb.max).toBe(1)
  })

  it('Chaos Dwarfs: Bull Centaurs may carry a magic standard', () => {
    const bc = getArmy('chaos-dwarfs')!.units.find((u) => u.id === 'cd-bull-centaurs')!
    expect(bc.specialRules).toContain('May carry a magic standard')
  })

  it('Undead: base Necromancer cannot upgrade to Level 4', () => {
    const necro = getArmy('undead')!.units.find((u) => u.id === 'ud-necromancer')!
    expect(necro.options!.map((o) => o.id)).not.toContain('wizard-l4')
  })
})

describe('selectionRules survive army assembly', () => {
  it('Dwarfs: runesmith group cap is present with all three ranks', () => {
    const caps = getArmy('dwarfs')!.selectionRules?.unitGroupCaps
    expect(caps?.[0].ids).toEqual(
      expect.arrayContaining(['dw-runesmith', 'dw-master-runesmith', 'dw-rune-lord']),
    )
  })

  it('Vampire Counts: battle standard group cap is present', () => {
    const caps = getArmy('vampire-counts')!.selectionRules?.unitGroupCaps
    expect(caps?.[0].ids).toEqual(expect.arrayContaining(['vc-vampire-bsb', 'vc-wight-bsb']))
  })

  it('Wood Elves: Treeman ratio cap is present', () => {
    const caps = getArmy('wood-elves')!.selectionRules?.ratioCaps
    expect(caps?.find((c) => c.unitId === 'we-treeman')?.absoluteMax).toBe(3)
  })

  it('Lizardmen: Temple Guard per-Slann cap present and static max removed', () => {
    const liz = getArmy('lizardmen')!
    expect(liz.units.find((u) => u.id === 'lz-temple-guard')?.max).toBeUndefined()
    expect(liz.selectionRules?.ratioCaps?.some((c) => c.unitId === 'lz-temple-guard')).toBe(true)
  })

  it('Undead: Isabella requires Vlad', () => {
    const dep = getArmy('undead')!.selectionRules?.dependencies?.find((d) => d.unitId === 'ud-isabella-von-carstein')
    expect(dep?.requiresAnyOf).toContain('ud-vlad-von-carstein')
  })

  it('Dwarfs: Gotrek and Felix require each other (both directions)', () => {
    const deps = getArmy('dwarfs')!.selectionRules?.dependencies ?? []
    expect(deps.find((d) => d.unitId === 'dw-gotrek')?.requiresAnyOf).toContain('dw-felix')
    expect(deps.find((d) => d.unitId === 'dw-felix')?.requiresAnyOf).toContain('dw-gotrek')
  })

  it('Empire: Tzarina Katarin requires a Kislev regiment', () => {
    const dep = getArmy('empire')!.selectionRules?.dependencies?.find((d) => d.unitId === 'emp-zarina-katarin')
    expect(dep?.requiresAnyOf).toEqual(
      expect.arrayContaining(['emp-kislev-winged-lancers', 'emp-kislev-horse-archers']),
    )
  })

  it('High Elves: Korhil requires White Lions', () => {
    const dep = getArmy('high-elves')!.selectionRules?.dependencies?.find((d) => d.unitId === 'he-korhil')
    expect(dep?.requiresAnyOf).toContain('he-white-lions')
  })

  it('Orcs & Goblins: Doom Diver requires a common goblin unit', () => {
    const dep = getArmy('orcs-and-goblins')!.selectionRules?.dependencies?.find((d) => d.unitId === 'og-doom-diver')
    expect(dep?.requiresAnyOf).toEqual(expect.arrayContaining(['og-goblins', 'og-goblin-wolf-riders']))
  })

  it('Skaven: Plague Priest ratio cap is present (per Plague Monk regiment)', () => {
    const cap = getArmy('skaven')!.selectionRules?.ratioCaps?.find((c) => c.unitId === 'sk-plague-priest')
    expect(cap?.perUnit?.ids).toContain('sk-plague-monks')
  })

  it('Orcs & Goblins: Squig Hopper ratio cap counts models (per Night Goblin unit)', () => {
    const cap = getArmy('orcs-and-goblins')!.selectionRules?.ratioCaps?.find((c) => c.unitId === 'og-squig-hoppers')
    expect(cap?.countModels).toBe(true)
    expect(cap?.perUnit?.ids).toContain('og-night-goblins')
  })

  it('Skaven: Plague Censer Bearer ratio cap counts models, half per monk, capped at 10', () => {
    const cap = getArmy('skaven')!.selectionRules?.ratioCaps?.find((c) => c.unitId === 'sk-plague-censer-bearers')
    expect(cap?.absoluteMax).toBe(10)
    expect(cap?.perUnit?.countModels).toBe(true)
  })
})

describe('Empire — sample legal list validates cleanly', () => {
  it('a balanced 1000pt list produces no violations', () => {
    const empire = getArmy('empire')!
    const roster: Roster = {
      id: 'r',
      name: 'Sample',
      armyId: 'empire',
      pointsLimit: 1000,
      entries: [
        { id: '1', unitId: 'emp-general', size: 1, optionIds: [], magicItemIds: ['mi-sword-of-strength'], isGeneral: true },
        { id: '2', unitId: 'emp-halberdiers', size: 20, optionIds: ['shield'], magicItemIds: [] },
        { id: '3', unitId: 'emp-handgunners', size: 10, optionIds: [], magicItemIds: [] },
        { id: '4', unitId: 'emp-white-wolf-knights', size: 5, optionIds: [], magicItemIds: [] },
      ],
    }
    const total = roster.entries.reduce((s, e) => s + entryPoints(e, empire), 0)
    expect(total).toBeLessThanOrEqual(1000)
    expect(validateRoster(roster, empire)).toEqual([])
  })
})
