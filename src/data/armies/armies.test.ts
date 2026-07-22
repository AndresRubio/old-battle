import { describe, it, expect } from 'vitest'
import { ARMIES, getArmy } from './index'
import { validateRoster } from '../../rules/validate'
import { entryPoints } from '../../rules/points'
import type { Roster } from '../types'
import { COMMON_MAGIC_ITEMS, ARMY_MAGIC_ITEMS } from '../magicItems'
import { MAGIC_LORES } from '../lores'

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

      it('mount-option ids never collide with the unit option namespace', () => {
        // Mount options share RosterEntry.optionIds with the unit's own options,
        // so every option id must be unique across the unit's whole namespace
        // (unit options + every offered mount's options).
        for (const u of army.units) {
          const ids = [
            ...(u.options ?? []).map((o) => o.id),
            ...(u.mounts ?? []).flatMap((m) => (m.options ?? []).map((o) => o.id)),
          ]
          expect(new Set(ids).size, `${u.id} has colliding option ids`).toBe(ids.length)
        }
      })

      it('mount ids are unique within a unit and points are non-negative', () => {
        for (const u of army.units) {
          if (!u.mounts) continue
          const mids = u.mounts.map((m) => m.id)
          expect(new Set(mids).size, `${u.id} has duplicate mount ids`).toBe(mids.length)
          for (const m of u.mounts) expect(m.points).toBeGreaterThanOrEqual(0)
          // Only characters ride mounts.
          expect(u.isCharacter, `${u.id} has mounts but is not a character`).toBe(true)
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

describe('unit magic standards', () => {
  const mentionsStandard = (u: { specialRules?: string[] }) =>
    u.specialRules?.some((r) => /magic standard/i.test(r)) ?? false

  for (const army of ARMIES) {
    it(`${army.id}: every regiment whose army list allows a magic standard is flagged`, () => {
      for (const u of army.units) {
        if (u.role === 'regiment' && !u.noCommand && mentionsStandard(u)) {
          expect(u.magicStandard, `${u.id} should be allowed a magic standard`).toBeDefined()
        }
      }
    })

    // Characters never carry a unit magic standard: a BSB spends a normal magic-item
    // slot on it instead (that path is magicItemIds). Every other role can be a
    // legitimate carrier — regiments via a standard bearer, and chariots, the
    // Stegadon howdah and Halfling farm machines on the model itself.
    it(`${army.id}: a magic standard is never flagged on a character`, () => {
      for (const u of army.units) {
        if (u.magicStandard) {
          expect(u.role, `${u.id} has magicStandard but is a character`).not.toBe('character')
        }
      }
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

  it('Halflings: Archers are a selectable regiment, distinct from Poachers', () => {
    const halflings = getArmy('halflings')!
    const archers = halflings.units.find((u) => u.id === 'hf-archers')
    expect(archers, 'Archers unit should exist in the Halfling army').toBeDefined()
    expect(archers!.role).toBe('regiment')
    expect(archers!.pointsPerModel).toBe(4.5)
    // The book lists Archers separately from the skirmishing Poachers.
    expect(halflings.units.some((u) => u.id === 'hf-poachers')).toBe(true)
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

describe('mounts & profiles', () => {
  it('Bretonnia: General offers a warhorse-or-monster mount list', () => {
    const general = getArmy('bretonnia')!.units.find((u) => u.id === 'br-general')!
    const ids = (general.mounts ?? []).map((m) => m.id)
    expect(ids).toEqual(expect.arrayContaining(['mount-warhorse', 'mount-pegasus', 'mount-dragon']))
    expect((general.mounts ?? []).find((m) => m.id === 'mount-warhorse')?.statLine?.M).toBe(8)
  })

  it('Bretonnia: mount-only monsters are no longer standalone monster entries', () => {
    const ids = new Set(getArmy('bretonnia')!.units.map((u) => u.id))
    expect(ids.has('br-pegasus')).toBe(false)
    expect(ids.has('br-unicorn')).toBe(false)
  })

  it('Bretonnia: a fixed-mount special character carries a display profile', () => {
    const louen = getArmy('bretonnia')!.units.find((u) => u.id === 'br-louen-leoncoeur')!
    expect(louen.profiles?.some((p) => /Hippogriff/i.test(p.name))).toBe(true)
  })

  it('High Elves: the Tiranoc Chariot shows chariot + steed profiles', () => {
    const chariot = getArmy('high-elves')!.units.find((u) => u.id === 'he-tiranoc-chariot')!
    const names = (chariot.profiles ?? []).map((p) => p.name)
    expect(names.some((n) => /Chariot/i.test(n))).toBe(true)
    expect(names.some((n) => /Steed/i.test(n))).toBe(true)
  })

  // Every model in these regiments is a rider on a mount, so each must expose a
  // `mount` profile (rendered as the rider's second stat row: rider on top,
  // mount beneath). Keep this list in step with the army data.
  const CAVALRY_REGIMENTS = [
    'br-grail-knights', 'br-questing-knights', 'br-knights-of-the-realm', 'br-knights-errant', 'br-mounted-squires',
    'ch-knights', 'ch-marauder-horsemen', 'ch-bloodletters-juggernaut',
    'cd-wolf-riders',
    'de-cold-one-knights', 'de-dark-riders',
    'dow-voland',
    'emp-white-wolf-knights', 'emp-panther-knights', 'emp-blazing-sun-knights', 'emp-reiksgard-knights',
    'emp-pistoliers', 'emp-engineer-scouts', 'emp-kislev-winged-lancers', 'emp-kislev-horse-archers',
    'hf-war-sheep-riders', 'hf-battle-ram-riders', 'hf-goat-riders', 'hf-swan-riders', 'hf-eagle-riders',
    'he-dragon-princes', 'he-silver-helms', 'he-ellyrian-reavers',
    'lz-cold-one-riders', 'lz-terradons',
    'og-savage-boar-boyz', 'og-orc-boar-boyz', 'og-goblin-wolf-riders', 'og-forest-goblin-spider-riders',
    'ud-skeletal-cavalry',
    'vc-wight-cavalry',
    'we-wild-rider-knights', 'we-warhawk-riders',
  ]

  // OLD-8 — O&G characters may ride a chariot as a mount (book p.88).
  it('Orcs & Goblins: orc characters offer the Boar Chariot, goblins the Wolf Chariot', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const mountIds = (unitId: string) =>
      (orcs.units.find((u) => u.id === unitId)!.mounts ?? []).map((m) => m.id)
    expect(mountIds('og-warboss-orc')).toContain('mount-boar-chariot')
    expect(mountIds('og-warboss-goblin')).toContain('mount-wolf-chariot')
    expect(mountIds('og-warboss-forest-goblin')).toContain('mount-wolf-chariot')
    // Night Goblins: "a monster or chariot only" — the chariot but never a beast.
    expect(mountIds('og-warboss-night-goblin')).toContain('mount-wolf-chariot')
    expect(mountIds('og-warboss-night-goblin')).not.toContain('mount-giant-wolf')
    // OLD-17 owns shaman mounts — the Orc Shaman list stays chariot-free.
    expect(mountIds('og-shaman-orc')).not.toContain('mount-boar-chariot')
  })

  // p.79 "Monturas: mismas que el Señor de la Guerra" — every BSB shares its
  // Warlord's mount list (beast + chariot + monsters).
  it('Orcs & Goblins: BSBs get the same mounts as their Warlord', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const mountIds = (unitId: string) =>
      (orcs.units.find((u) => u.id === unitId)!.mounts ?? []).map((m) => m.id)
    for (const id of ['og-bsb-black-orc', 'og-bsb-orc', 'og-bsb-savage-orc']) {
      expect(mountIds(id), id).toEqual(mountIds('og-warboss-orc'))
      expect(mountIds(id), id).toContain('mount-boar-chariot')
    }
    expect(mountIds('og-bsb-goblin')).toEqual(mountIds('og-warboss-goblin'))
    expect(mountIds('og-bsb-forest-goblin')).toEqual(mountIds('og-warboss-forest-goblin'))
    expect(mountIds('og-bsb-night-goblin')).toEqual(mountIds('og-warboss-night-goblin'))
    for (const id of ['og-bsb-goblin', 'og-bsb-forest-goblin', 'og-bsb-night-goblin']) {
      expect(mountIds(id), id).toContain('mount-wolf-chariot')
    }
    expect(mountIds('og-bsb-night-goblin')).not.toContain('mount-giant-wolf')
  })

  it('Orcs & Goblins: chariot mounts expose crew/beast/chassis profiles and nested options', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const warboss = orcs.units.find((u) => u.id === 'og-warboss-orc')!
    const chariot = (warboss.mounts ?? []).find((m) => m.id === 'mount-boar-chariot')!
    expect(chariot.points).toBe(81)
    expect((chariot.profiles ?? []).map((p) => p.name)).toEqual(['2 Orc crew', '2 War Boars', 'Chariot'])
    expect((chariot.profiles ?? []).find((p) => p.name === 'Chariot')?.statLine).toEqual({ S: 7, T: 7, W: 3, I: 1 })
    expect((chariot.options ?? []).map((o) => o.id)).toEqual([
      'mount-boar-chariot-crew3',
      'mount-boar-chariot-crew4',
      'mount-boar-chariot-shields',
      'mount-boar-chariot-bows',
      'mount-boar-chariot-scythes',
    ])
  })

  it('Orcs & Goblins: the standalone chariots carry the full chassis row (S7 T7 W3 I1)', () => {
    const orcs = getArmy('orcs-and-goblins')!
    for (const id of ['og-orc-boar-chariot', 'og-goblin-wolf-chariot']) {
      const unit = orcs.units.find((u) => u.id === id)!
      const chassis = (unit.profiles ?? []).find((p) => p.name === 'Chariot')
      expect(chassis?.statLine, `${id} chassis`).toEqual({ S: 7, T: 7, W: 3, I: 1 })
    }
  })

  it('every cavalry regiment carries a rider + mount two-row profile', () => {
    const byId = new Map(ARMIES.flatMap((a) => a.units.map((u) => [u.id, u] as const)))
    for (const id of CAVALRY_REGIMENTS) {
      const unit = byId.get(id)
      expect(unit, `cavalry regiment '${id}' no longer exists`).toBeDefined()
      // Rider row: the unit's own statLine.
      expect(unit!.statLine, `${id} is missing the rider statLine`).toBeDefined()
      // Mount row: a named profile with at least a Movement value.
      expect(unit!.mount, `${id} is missing its mount profile`).toBeDefined()
      expect(unit!.mount!.name.length, `${id} mount has no name`).toBeGreaterThan(0)
      expect(unit!.mount!.statLine.M, `${id} mount has no Movement`).toBeGreaterThan(0)
    }
  })
})

describe('lores of magic wiring', () => {
  for (const army of ARMIES) {
    for (const unit of army.units) {
      if (unit.lores) {
        it(`${army.id}/${unit.id}: every lore id resolves and the list is non-empty`, () => {
          expect(unit.lores!.length).toBeGreaterThan(0)
          for (const id of unit.lores!) {
            expect(MAGIC_LORES[id], `${unit.id} references unknown lore '${id}'`).toBeDefined()
          }
        })
      }
      // Every wizard-rank character must declare at least one lore to choose from.
      if (unit.characterRank?.startsWith('wizard')) {
        it(`${army.id}/${unit.id}: wizard declares at least one lore`, () => {
          expect(unit.lores && unit.lores.length > 0, `${unit.id} is a wizard but has no lores`).toBe(true)
        })
      }
    }
  }
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
