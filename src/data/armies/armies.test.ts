import { describe, it, expect } from 'vitest'
import { ARMIES, getArmy } from './index'
import { validateRoster } from '../../rules/validate'
import { entryPoints } from '../../rules/points'
import { summarize } from '../../rules/summary'
import type { Roster } from '../types'
import { COMMON_MAGIC_ITEMS, ARMY_MAGIC_ITEMS } from '../magicItems'
import { MAGIC_LORES } from '../lores'
import { RULE_PHRASE_ES } from '../../i18n/rulePhrases'

// The mechanical data-format invariants (unique ids, mount-option namespace,
// selection-rule references, restrictedTo leaks…) are enforced at CONSTRUCTION
// time by assertArmyIntegrity in the armies/index.ts assembly pipeline — a
// malformed army throws at module load, so importing ARMIES above is itself
// the check. See integrity.ts / integrity.test.ts. Only the domain-semantic
// expectations remain here.
describe('army data integrity', () => {
  for (const army of ARMIES) {
    describe(army.name, () => {
      it('has at least one possible General', () => {
        expect(army.units.some((u) => u.canBeGeneral)).toBe(true)
      })

      it('has core regiments and characters', () => {
        expect(army.units.some((u) => u.role === 'regiment')).toBe(true)
        expect(army.units.some((u) => u.role === 'character')).toBe(true)
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

describe('command groups', () => {
  // A standard bearer and a musician are extra miniatures in the rank and file,
  // each costing double an equipped one. An entry that never forms a rank and
  // file of its own therefore has none to buy: models that hide inside another
  // regiment (Fanatics, Berserkers, Assassins), models that merely accompany
  // one (Plague Censer Bearers), and a pack led by a single keeper rather than
  // by its own command models (the Norse and Clan Moulder Beastmasters).
  const NO_RANK_AND_FILE = [
    'ch-nurglings', 'ch-swarms',
    'hf-crazed-cooks',
    'no-berserkers', 'no-ulfjarls',
    'no-beastmaster-snow-trolls', 'no-beastmaster-giant-wolves', 'no-beastmaster-bears',
    'og-night-goblin-fanatics', 'og-squig-hoppers',
    'sk-assassins', 'sk-beastmasters', 'sk-plague-censer-bearers',
    'vc-spectral-host', 'vc-spectral-maidens',
  ]

  for (const id of NO_RANK_AND_FILE) {
    it(`${id}: forms no rank and file, so has no command group to buy`, () => {
      const unit = ARMIES.flatMap((a) => a.units).find((u) => u.id === id)
      expect(unit, `${id} not found`).toBeDefined()
      expect(unit!.noCommand, `${id} should be noCommand`).toBe(true)
      expect((unit!.options ?? []).map((o) => o.id)).not.toContain('standard')
    })
  }

  // Skirmishing does not take a unit's standard away: in skirmish formation a
  // unit still counts "Unit standard gets combat resolution bonus" (FAQ 1996
  // §3.6.1, citing Rule Book pp.90-91). So skirmishing alone is never a reason
  // to withhold the command group — only an entry's own army-list text is, and
  // the entries that have such text state it in their special rules.
  it('skirmishing alone never costs a regiment its command group', () => {
    const skirmishers = ARMIES.flatMap((a) => a.units).filter(
      (u) => u.role === 'regiment' && u.specialRules?.some((r) => /skirmish/i.test(r)),
    )
    const denied = /no (command|standard|champion)|may not take command|Regiment of Renown/i
    for (const u of skirmishers) {
      if (u.noCommand) {
        expect(
          u.specialRules?.some((r) => denied.test(r)),
          `${u.id} is noCommand but nothing in its rules denies it a command group`,
        ).toBe(true)
      }
    }
  })

  // The Regiments of Renown are sold at a fixed price that already includes
  // their named standard bearer and musician, so offering the upgrade again
  // would charge for them twice.
  it('Regiments of Renown price their command models in, and never offer them again', () => {
    const ror = ARMIES.flatMap((a) => a.units).filter(
      (u) => u.role === 'regiment' && u.specialRules?.some((r) => /Regiment of Renown/i.test(r)),
    )
    expect(ror.length).toBeGreaterThan(10)
    for (const u of ror) {
      expect(u.noCommand, `${u.id} is a Regiment of Renown and must be noCommand`).toBe(true)
    }
  })
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

  it('Orcs & Goblins: Night Goblin Shaman has the book p.18 mushroom rules, not the old power-dice tag', () => {
    const unit = getArmy('orcs-and-goblins')!.units.find((u) => u.id === 'og-shaman-night-goblin')!
    const rules = unit.specialRules ?? []
    expect(rules).toContain('Carries Shaman Mushrooms (1 per wizard level, each usable once per battle)')
    expect(rules).toContain('Eats a mushroom before the Magic phase: 1D6 extra magic cards, usable only by him')
    expect(rules).toContain('After eating a mushroom, -1 to the Mental Burst roll if he must test that phase')
    expect(rules).toContain('After eating a mushroom, may cast without Orcs & Goblins nearby (no energy source in 30cm = mushroom cards only)')
    expect(rules.some((r) => /power dice/i.test(r))).toBe(false)

    for (const r of rules.filter((r) => /mushroom/i.test(r))) {
      expect(RULE_PHRASE_ES[r], `missing ES translation for "${r}"`).toBeTruthy()
    }
  })

  it('Orcs & Goblins: Forest Goblin Shaman has the book p.19 spider-venom rules', () => {
    const unit = getArmy('orcs-and-goblins')!.units.find((u) => u.id === 'og-shaman-forest-goblin')!
    const rules = unit.specialRules ?? []
    expect(rules).toContain('Spider venom: +1 to the Mental Burst roll; a natural 6 counts as passing the Waaagh! check with no ill effect')
    expect(rules).toContain('Any failed Waaagh! check makes him stagger 2D6cm in a random direction')

    for (const r of [
      'Spider venom: +1 to the Mental Burst roll; a natural 6 counts as passing the Waaagh! check with no ill effect',
      'Any failed Waaagh! check makes him stagger 2D6cm in a random direction',
    ]) {
      expect(RULE_PHRASE_ES[r], `missing ES translation for "${r}"`).toBeTruthy()
    }
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
    // OLD-11 — book p.81 "Monturas": the Orc Shaman rides the same list as
    // orc characters (War Boar or a monster/chariot), same as OLD-17's other
    // goblin shaman variants for their own mounts.
    expect(mountIds('og-shaman-orc')).toContain('mount-boar-chariot')
  })

  // OLD-11 — book p.81 "Monturas": Orco/Orco Salvaje shamans ride War Boar (+8)
  // or a monster/chariot; they never ride a Giant Wolf (that's the Goblin line).
  it('Orcs & Goblins: Orc and Savage Orc Shamans get War Boar/chariot mounts, never a Giant Wolf (p.81)', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const mountIds = (unitId: string) =>
      (orcs.units.find((u) => u.id === unitId)!.mounts ?? []).map((m) => m.id)
    for (const id of ['og-shaman-orc', 'og-shaman-savage-orc']) {
      expect(mountIds(id), id).toContain('mount-boar-chariot')
      expect(mountIds(id), id).toContain('mount-war-boar')
      expect(mountIds(id), id).not.toContain('mount-giant-wolf')
    }
  })

  // OLD-17 — book p.81 "Monturas" (Shamanes): Goblin → Giant Wolf +4, Forest
  // Goblin → Giant Spider +4, Night Goblin → none (monster or chariot only);
  // "Cualquier Shaman puede montar monstruo o ir en carruaje" — all three ride
  // the Goblin Wolf Chariot (never the Orc Boar Chariot), and only their own
  // beast (no cross-contamination between wolf/spider/boar).
  it('Orcs & Goblins: Goblin, Forest Goblin and Night Goblin Shamans get the Wolf Chariot and their own beast only (p.81)', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const mountIds = (unitId: string) =>
      (orcs.units.find((u) => u.id === unitId)!.mounts ?? []).map((m) => m.id)

    expect(mountIds('og-shaman-goblin')).toContain('mount-giant-wolf')
    expect(mountIds('og-shaman-goblin')).toContain('mount-wolf-chariot')
    expect(mountIds('og-shaman-goblin')).not.toContain('mount-giant-spider')
    expect(mountIds('og-shaman-goblin')).not.toContain('mount-war-boar')

    expect(mountIds('og-shaman-forest-goblin')).toContain('mount-giant-spider')
    expect(mountIds('og-shaman-forest-goblin')).toContain('mount-wolf-chariot')
    expect(mountIds('og-shaman-forest-goblin')).not.toContain('mount-giant-wolf')
    expect(mountIds('og-shaman-forest-goblin')).not.toContain('mount-war-boar')

    expect(mountIds('og-shaman-night-goblin')).toContain('mount-wolf-chariot')
    expect(mountIds('og-shaman-night-goblin')).not.toContain('mount-giant-wolf')
    expect(mountIds('og-shaman-night-goblin')).not.toContain('mount-giant-spider')
    expect(mountIds('og-shaman-night-goblin')).not.toContain('mount-war-boar')

    for (const id of ['og-shaman-goblin', 'og-shaman-forest-goblin', 'og-shaman-night-goblin']) {
      expect(mountIds(id), id).not.toContain('mount-boar-chariot')
    }
  })

  // OLD-9 — book p.80 "Jefes" table: HP4/F5/I3/A2 (Black Orc), HP4/F4/I3/A2 (Orc,
  // Savage Orc), HP4/F4/I3/A2 (Goblin, Forest Goblin, Night Goblin). Regression
  // guard for the mistranscribed HP/F/I values fixed by this issue.
  it('Orcs & Goblins: Boss (Jefe) statlines match the book p.80 table', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const statLine = (unitId: string) => orcs.units.find((u) => u.id === unitId)!.statLine
    expect(statLine('og-boss-black-orc')).toEqual({ M: 4, WS: 5, BS: 4, S: 5, T: 4, W: 1, I: 3, A: 2, Ld: 8 })
    for (const id of ['og-boss-orc', 'og-boss-savage-orc']) {
      expect(statLine(id), id).toEqual({ M: 4, WS: 4, BS: 4, S: 4, T: 4, W: 1, I: 3, A: 2, Ld: 7 })
    }
    for (const id of ['og-boss-goblin', 'og-boss-forest-goblin', 'og-boss-night-goblin']) {
      expect(statLine(id), id).toEqual({ M: 4, WS: 3, BS: 4, S: 4, T: 3, W: 1, I: 3, A: 2, Ld: 5 })
    }
  })

  // OLD-18 — book p.79 "Señor de la Guerra" table, corroborated by the p.98
  // reference table. The nine book columns are M / HA / HP / F / R / H / I / A / L;
  // the original transcription dropped H, so I and A landed one column out (I 3 /
  // A 5 instead of I 5 / A 4). Regression guard for those two columns.
  it('Orcs & Goblins: Warboss (Señor de la Guerra) statlines match the book p.79 table', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const statLine = (unitId: string) => orcs.units.find((u) => u.id === unitId)!.statLine
    expect(statLine('og-warboss-black-orc')).toEqual({ M: 4, WS: 7, BS: 6, S: 5, T: 5, W: 3, I: 5, A: 4, Ld: 10 })
    for (const id of ['og-warboss-orc', 'og-warboss-savage-orc']) {
      expect(statLine(id), id).toEqual({ M: 4, WS: 6, BS: 6, S: 4, T: 5, W: 3, I: 5, A: 4, Ld: 9 })
    }
    for (const id of ['og-warboss-goblin', 'og-warboss-forest-goblin', 'og-warboss-night-goblin']) {
      expect(statLine(id), id).toEqual({ M: 4, WS: 5, BS: 6, S: 4, T: 4, W: 3, I: 5, A: 4, Ld: 7 })
    }
  })

  // OLD-18 — book pp.90-93 "Personajes especiales". Same dropped-H column shift as
  // the Warbosses above. Skarsnik's row carries an extra caveat: both transcription
  // passes misread it and it was resolved by re-reading the scan at 400 DPI, so his
  // I 6 / A 4 is deliberate and not a typo for I 3 / A 6.
  it('Orcs & Goblins: special character statlines match the book pp.90-93 tables', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const statLine = (unitId: string) => orcs.units.find((u) => u.id === unitId)!.statLine
    expect(statLine('og-azhag'), 'Azhag el Carnicero (p.90)').toEqual({ M: 4, WS: 6, BS: 6, S: 4, T: 5, W: 3, I: 5, A: 4, Ld: 10 })
    expect(statLine('og-oglok'), 'Oglok el Horrible (p.90)').toEqual({ M: 4, WS: 6, BS: 5, S: 4, T: 5, W: 2, I: 4, A: 4, Ld: 9 })
    expect(statLine('og-grom'), 'Grom el Panzudo (p.91)').toEqual({ M: 4, WS: 5, BS: 6, S: 4, T: 4, W: 3, I: 5, A: 4, Ld: 7 })
    expect(statLine('og-gorbad'), 'Gorbad Garra de Hierro (p.91)').toEqual({ M: 4, WS: 6, BS: 6, S: 4, T: 5, W: 3, I: 5, A: 4, Ld: 10 })
    expect(statLine('og-gorfang'), 'Gorfang Rotgut (p.92)').toEqual({ M: 4, WS: 5, BS: 5, S: 5, T: 5, W: 3, I: 4, A: 3, Ld: 8 })
    expect(statLine('og-morglum'), 'Morglum Quiebracuellos (p.92)').toEqual({ M: 4, WS: 7, BS: 6, S: 5, T: 5, W: 3, I: 5, A: 4, Ld: 10 })
    expect(statLine('og-skarsnik'), 'Skarsnik (p.93)').toEqual({ M: 4, WS: 5, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 9 })
  })

  // OLD-20 — book p.79 "Señor de la Guerra" mount table, read straight off the PDF
  // scan and corroborated by the p.73/p.74 bestiary rows, both p.82 rider entries,
  // the two p.88 chariots and the p.98 reference table. Same dropped-H column shift
  // as OLD-18, except on mounts it moved HA as well as I: the War Boar read
  // HA 3 / I 2 for HA 4 / I 3, the Giant Wolf HA 3 for HA 4. Every boar and wolf
  // profile in the army shares one constant, so this walks all of them at once —
  // character mounts, cavalry steeds and chariot draught teams alike.
  it('Orcs & Goblins: every War Boar and Giant Wolf profile matches the book p.79 mount table', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const WAR_BOAR = { M: 7, WS: 4, BS: 0, S: 3, T: 4, W: 1, I: 3, A: 1, Ld: 3 }
    const GIANT_WOLF = { M: 9, WS: 4, BS: 0, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 3 }

    // Collect every beast profile the army exposes, wherever it hangs.
    const beasts: { where: string; name: string; statLine: unknown }[] = []
    for (const unit of orcs.units) {
      if (unit.mount) beasts.push({ where: `${unit.id}.mount`, name: unit.mount.name, statLine: unit.mount.statLine })
      for (const p of unit.profiles ?? []) beasts.push({ where: `${unit.id}.profiles`, name: p.name, statLine: p.statLine })
      for (const m of unit.mounts ?? []) {
        if (m.statLine) beasts.push({ where: `${unit.id}.mounts.${m.id}`, name: m.name, statLine: m.statLine })
        for (const p of m.profiles ?? []) beasts.push({ where: `${unit.id}.mounts.${m.id}.profiles`, name: p.name, statLine: p.statLine })
      }
    }

    const boars = beasts.filter((b) => /Boar/.test(b.name) && !/Chariot/.test(b.name))
    const wolves = beasts.filter((b) => /Wolf|Wolves/.test(b.name) && !/Chariot/.test(b.name))
    // Guard the guard: if the data stops exposing these, the loops below pass vacuously.
    expect(boars.length, 'War Boar profiles found').toBeGreaterThan(0)
    expect(wolves.length, 'Giant Wolf profiles found').toBeGreaterThan(0)

    for (const b of boars) expect(b.statLine, `${b.name} @ ${b.where}`).toEqual(WAR_BOAR)
    for (const w of wolves) expect(w.statLine, `${w.name} @ ${w.where}`).toEqual(GIANT_WOLF)
  })

  // OLD-19 — book printed p.78 "LISTA DE EQUIPO" (PDF page 80), the table of
  // "todas las armas y armaduras normales con que puede equiparse un personaje
  // Orco o Goblin". The first hand weapon is free and is already each character's
  // base equipment, so only the nine paid rows are offered. The Warboss (p.79),
  // Battle Standard (p.79) and Big Boss (p.80) may take "cualquier arma o
  // armadura" from it, and the Boss (p.80) is equipped as his regiment but
  // priced from this same table.
  const OG_EQUIPMENT_LIST: [string, number][] = [
    ['add-hand-weapon', 1],
    ['two-hand', 2],
    ['spear', 1],
    ['halberd', 2],
    ['bow', 2],
    ['short-bow', 1],
    ['crossbow', 3],
    ['shield', 1],
    ['light-armour', 2],
  ]

  // OLD-29 — the Shaman (p.81) is limited to "cualquiera de las armas o
  // armaduras permitidas al tipo de tropas indicadas en esta lista", and a
  // Shaman's troop type never permits shield or light armour: shamans of any
  // kind offer the same seven weapon rows but not those two.
  const OG_SHAMAN_EQUIPMENT_LIST = OG_EQUIPMENT_LIST.filter(([id]) => id !== 'shield' && id !== 'light-armour')

  it('Orcs & Goblins: Warboss, Battle Standard, Big Boss and Boss offer the full p.78 Equipment List at book prices', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const characters = orcs.units.filter(
      (u) =>
        u.isCharacter &&
        !(u.specialRules ?? []).some((r) => r.startsWith('Special character')) &&
        !u.id.startsWith('og-shaman-'),
    )
    // 6 Warbosses + 6 Battle Standards + 6 Big Bosses + 6 Bosses.
    expect(characters.length, 'non-special, non-Shaman O&G characters').toBe(24)

    for (const unit of characters) {
      const opts = unit.options ?? []
      for (const [id, points] of OG_EQUIPMENT_LIST) {
        const opt = opts.find((o) => o.id === id)
        expect(opt, `${unit.id} offers ${id}`).toBeDefined()
        expect(opt!.pointsPerModel, `${unit.id} ${id} cost`).toBe(points)
        // Characters are single models; the list price must not be a flat
        // per-unit charge or a model-cost multiple.
        expect(opt!.flat ?? false, `${unit.id} ${id} flat`).toBe(false)
        expect(opt!.timesModelCost, `${unit.id} ${id} timesModelCost`).toBeUndefined()
      }
    }
  })

  it('Orcs & Goblins: Shamans offer the p.78 Equipment List minus shield and light armour (OLD-29)', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const shamans = orcs.units.filter((u) => u.isCharacter && u.id.startsWith('og-shaman-'))
    expect(shamans.length, 'O&G Shamans').toBe(5)

    for (const unit of shamans) {
      const opts = unit.options ?? []
      for (const [id, points] of OG_SHAMAN_EQUIPMENT_LIST) {
        const opt = opts.find((o) => o.id === id)
        expect(opt, `${unit.id} offers ${id}`).toBeDefined()
        expect(opt!.pointsPerModel, `${unit.id} ${id} cost`).toBe(points)
        expect(opt!.flat ?? false, `${unit.id} ${id} flat`).toBe(false)
        expect(opt!.timesModelCost, `${unit.id} ${id} timesModelCost`).toBeUndefined()
      }
      expect(opts.find((o) => o.id === 'shield'), `${unit.id} must not offer shield`).toBeUndefined()
      expect(opts.find((o) => o.id === 'light-armour'), `${unit.id} must not offer light armour`).toBeUndefined()
    }
  })

  // The book gives special characters a fixed kit in their own "ARMAS Y ARMADURA"
  // paragraph (Azhag light armour + shield, Grom light armour + Elf-Biter, …), so
  // they must NOT inherit the free-choice Equipment List.
  it('Orcs & Goblins: special characters keep their fixed book kit, no Equipment List', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const specials = orcs.units.filter((u) =>
      (u.specialRules ?? []).some((r) => r.startsWith('Special character')),
    )
    expect(specials.length, 'O&G special characters').toBe(7)
    for (const unit of specials) {
      const ids = (unit.options ?? []).map((o) => o.id)
      for (const [id] of OG_EQUIPMENT_LIST) {
        expect(ids, `${unit.id} must not offer ${id}`).not.toContain(id)
      }
    }
  })

  // OLD-12 — book p.81 "Shamanes Orcos" table: each wizard level has its own
  // full profile (Shaman / Paladín / Maestro / Gran Shaman), and "Los Orcos
  // Salvajes usan los atributos de los Shamanes Orcos" — the Savage Orc Shaman
  // shares the same four rows. Level 1 is the unit's base statLine; levels 2-4
  // are replacement statLines on the wizard-level options.
  it('Orcs & Goblins: Orc and Savage Orc Shaman statlines scale per the book p.81 table', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const rows = {
      l1: { M: 4, WS: 3, BS: 3, S: 3, T: 5, W: 1, I: 3, A: 1, Ld: 7 },
      l2: { M: 4, WS: 3, BS: 3, S: 4, T: 5, W: 2, I: 3, A: 1, Ld: 7 },
      l3: { M: 4, WS: 3, BS: 3, S: 4, T: 5, W: 3, I: 4, A: 2, Ld: 7 },
      l4: { M: 4, WS: 3, BS: 3, S: 4, T: 5, W: 4, I: 5, A: 3, Ld: 8 },
    }
    for (const id of ['og-shaman-orc', 'og-shaman-savage-orc']) {
      const shaman = orcs.units.find((u) => u.id === id)!
      const level = (opt: string) => (shaman.options ?? []).find((o) => o.id === opt)
      expect(shaman.statLine, `${id} base (level 1)`).toEqual(rows.l1)
      expect(level('wizard-l2')?.statLine, `${id} wizard-l2`).toEqual(rows.l2)
      expect(level('wizard-l3')?.statLine, `${id} wizard-l3`).toEqual(rows.l3)
      expect(level('wizard-l4')?.statLine, `${id} wizard-l4`).toEqual(rows.l4)
    }
  })

  // OLD-13 — book p.81 "Shamanes Goblins" table: each wizard level has its
  // own full profile (Shaman / Paladín / Maestro / Gran Shaman), shared by
  // the Goblin, Forest Goblin and Night Goblin Shamans alike. Level 1 is the
  // unit's base statLine; levels 2-4 are replacement statLines on the
  // wizard-level options.
  it('Orcs & Goblins: Goblin, Forest Goblin and Night Goblin Shaman statlines scale per the book p.81 table', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const rows = {
      l1: { M: 4, WS: 2, BS: 3, S: 3, T: 4, W: 1, I: 3, A: 1, Ld: 5 },
      l2: { M: 4, WS: 2, BS: 3, S: 4, T: 4, W: 2, I: 3, A: 1, Ld: 5 },
      l3: { M: 4, WS: 2, BS: 3, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 5 },
      l4: { M: 4, WS: 2, BS: 3, S: 4, T: 4, W: 4, I: 5, A: 3, Ld: 6 },
    }
    for (const id of ['og-shaman-goblin', 'og-shaman-forest-goblin', 'og-shaman-night-goblin']) {
      const shaman = orcs.units.find((u) => u.id === id)!
      const level = (opt: string) => (shaman.options ?? []).find((o) => o.id === opt)
      expect(shaman.statLine, `${id} base (level 1)`).toEqual(rows.l1)
      expect(level('wizard-l2')?.statLine, `${id} wizard-l2`).toEqual(rows.l2)
      expect(level('wizard-l3')?.statLine, `${id} wizard-l3`).toEqual(rows.l3)
      expect(level('wizard-l4')?.statLine, `${id} wizard-l4`).toEqual(rows.l4)
    }
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

  // OLD-23 — the standalone chariot war machines (bought as their own roster
  // entry, distinct from ORC_BOAR_CHARIOT_MOUNT / GOBLIN_WOLF_CHARIOT_MOUNT
  // above, which are for a character riding one as a mount) must expose the
  // same upgrades — extra crew, crew shields/short bows, an extra draft beast
  // (Goblin only) and scythed wheels — as real priced `options`, not just
  // cost figures mentioned in `specialRules` free text.
  it('Orcs & Goblins: the standalone chariots have real priced options, not just flavor text', () => {
    const orcs = getArmy('orcs-and-goblins')!
    const boarChariot = orcs.units.find((u) => u.id === 'og-orc-boar-chariot')!
    expect((boarChariot.options ?? []).map((o) => o.id)).toEqual([
      'og-orc-chariot-crew3',
      'og-orc-chariot-crew4',
      'og-orc-chariot-shields',
      'og-orc-chariot-bows',
      'og-orc-chariot-scythes',
    ])
    const boarPoints = Object.fromEntries((boarChariot.options ?? []).map((o) => [o.id, o.pointsPerModel]))
    expect(boarPoints).toEqual({
      'og-orc-chariot-crew3': 7.5,
      'og-orc-chariot-crew4': 7.5,
      'og-orc-chariot-shields': 1,
      'og-orc-chariot-bows': 1,
      'og-orc-chariot-scythes': 20,
    })
    // specialRules no longer states these as free-text-only costs.
    expect((boarChariot.specialRules ?? []).join(' ')).not.toMatch(/pts|points/)

    const wolfChariot = orcs.units.find((u) => u.id === 'og-goblin-wolf-chariot')!
    expect((wolfChariot.options ?? []).map((o) => o.id)).toEqual([
      'og-goblin-chariot-crew3',
      'og-goblin-chariot-crew4',
      'og-goblin-chariot-wolf3',
      'og-goblin-chariot-shields',
      'og-goblin-chariot-bows',
      'og-goblin-chariot-scythes',
    ])
    const wolfPoints = Object.fromEntries((wolfChariot.options ?? []).map((o) => [o.id, o.pointsPerModel]))
    expect(wolfPoints).toEqual({
      'og-goblin-chariot-crew3': 3.5,
      'og-goblin-chariot-crew4': 3.5,
      'og-goblin-chariot-wolf3': 4,
      'og-goblin-chariot-shields': 0.5,
      'og-goblin-chariot-bows': 0.5,
      'og-goblin-chariot-scythes': 20,
    })
    expect((wolfChariot.specialRules ?? []).join(' ')).not.toMatch(/pts|points/)

    // Same book values as the character-mount versions of these chariots.
    const mountBoar = orcs.units.find((u) => u.id === 'og-warboss-orc')!.mounts!.find((m) => m.id === 'mount-boar-chariot')!
    const mountWolf = orcs.units.find((u) => u.id === 'og-warboss-goblin')!.mounts!.find((m) => m.id === 'mount-wolf-chariot')!
    expect(boarPoints['og-orc-chariot-scythes']).toBe(mountBoar.options!.find((o) => o.id === 'mount-boar-chariot-scythes')!.pointsPerModel)
    expect(wolfPoints['og-goblin-chariot-scythes']).toBe(mountWolf.options!.find((o) => o.id === 'mount-wolf-chariot-scythes')!.pointsPerModel)
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

describe('OLD-22: Ogres are a Regiment, not a Monster', () => {
  const og = getArmy('orcs-and-goblins')!
  const ogres = og.units.find((u) => u.id === 'og-ogres')

  it('og-ogres has role "regiment" and keeps its book-accurate points/stats/options', () => {
    expect(ogres, 'og-ogres not found').toBeDefined()
    expect(ogres!.role).toBe('regiment')
    expect(ogres!.pointsPerModel).toBe(40)
    // PDF p.86: M15 HA3 HP2 F4 R5 H3 I3 A2 L7 — unchanged by the category move.
    expect(ogres!.statLine).toEqual({ M: 6, WS: 3, BS: 2, S: 4, T: 5, W: 3, I: 3, A: 2, Ld: 7 })
    // Book options preserved, PLUS the standard bearer + musician that
    // withCommandGroups auto-adds to every multi-model regiment (see below).
    expect((ogres!.options ?? []).map((o) => o.id).sort()).toEqual(
      ['add-hand-weapon', 'halberd', 'light-armour', 'two-hand', 'musician', 'standard'].sort(),
    )
  })

  it('forms a normal rank and file, so the auto command group applies (noCommand unset)', () => {
    // Unlike Fanatics/Squig Hoppers (individual models hidden in another unit),
    // Ogres are an ordinary mercenary regiment in the 5th-edition army book —
    // withCommandGroups in armies/index.ts treats them like any other
    // multi-model regiment and adds a standard bearer + musician option.
    expect(ogres!.noCommand).toBeUndefined()
    expect((ogres!.options ?? []).map((o) => o.id)).toEqual(
      expect.arrayContaining(['standard', 'musician']),
    )
  })

  it('counts toward the Regiments cap and NOT the Monsters cap in the Muster Check', () => {
    const roster: Roster = {
      id: 'r',
      name: 'Ogres test',
      armyId: 'orcs-and-goblins',
      pointsLimit: 1000,
      entries: [{ id: '1', unitId: 'og-ogres', size: 3, optionIds: [], magicItemIds: [] }],
    }
    const points = entryPoints(roster.entries[0], og)
    expect(points).toBe(120) // 3 * 40, no options bought

    const s = summarize(roster, og)
    expect(s.caps.regiments.points).toBe(points)
    expect(s.caps.monsters.points).toBe(0)
  })
})

describe('OLD-30: Ogres take the normal 5-model regiment minimum', () => {
  const og = getArmy('orcs-and-goblins')!
  const ogres = og.units.find((u) => u.id === 'og-ogres')

  it('minSize: 5 — the PEÑAS floor, which the Ogres entry never exempts', () => {
    // PDF p.82 (PEÑAS header): a regiment has no maximum size, but every unit
    // must be at least 5 models "unless stated otherwise". On p.86 three of the
    // four mercenary entries state otherwise — Giants ("units of fewer than
    // five"), Trolls ("below the normal minimum of five") and Snotlings (their
    // own per-base organisation) — and Ogres do not. So the default applies.
    //
    // OLD-22 moved this entry from Monster to Regiment but left minSize: 1
    // behind, which let a "regiment" of a single Ogre still buy the full
    // command group withCommandGroups gives it (2x a fully equipped model each).
    expect(ogres!.minSize).toBe(5)
  })

  it('a lone Ogre is now flagged, a unit of 5 is clean', () => {
    const roster = (size: number): Roster => ({
      id: 'r',
      name: 'Ogre minimum',
      armyId: 'orcs-and-goblins',
      pointsLimit: 3000,
      entries: [
        { id: 'gen', unitId: 'og-warboss-orc', size: 1, optionIds: [], magicItemIds: [], isGeneral: true },
        { id: 'boyz', unitId: 'og-orc-boyz', size: 30, optionIds: [], magicItemIds: [] },
        { id: 'ogres', unitId: 'og-ogres', size, optionIds: [], magicItemIds: [] },
      ],
    })

    const lone = validateRoster(roster(1), og, 'en').filter((v) => v.rule === 'min-size')
    expect(lone).toHaveLength(1)
    expect(lone[0].entryId).toBe('ogres')
    expect(lone[0].message).toContain('below the minimum of 5')

    expect(validateRoster(roster(5), og, 'en').filter((v) => v.rule === 'min-size')).toEqual([])
  })
})

describe('OLD-27: Giants are a Regiment, not a Monster', () => {
  const og = getArmy('orcs-and-goblins')!
  const giant = og.units.find((u) => u.id === 'og-giant')

  it('og-giant has role "regiment" and keeps its book-accurate points/stats/specialRules', () => {
    expect(giant, 'og-giant not found').toBeDefined()
    expect(giant!.role).toBe('regiment')
    expect(giant!.pointsPerModel).toBe(200)
    // PDF p.86: M15 HA3 HP3 F7 R6 H6 I3 A– L6 (special attacks) — unchanged by the category move.
    expect(giant!.statLine).toEqual({ M: 6, WS: 3, BS: 3, S: 7, T: 6, W: 6, I: 3, A: 1, Ld: 6 })
    expect(giant!.specialRules).toEqual([
      'Large target', 'Causes terror', 'Special attacks (club, jump, etc.)', 'May form units of fewer than 5',
    ])
  })

  it('minSize: 1 — "may form units of fewer than 5" is an exemption from the normal 5-model floor', () => {
    // The entry's own specialRules text ("May form units of fewer than 5") only
    // makes sense as an explicit exemption from a normal regiment's minSize: 5
    // (see e.g. og-orc-boyz, og-goblins above) — a lone Giant must be legal.
    expect(giant!.minSize).toBe(1)
  })

  it('noCommand: true — a lone monstrous model, not rank-and-file, so no auto command group', () => {
    // Unlike og-ogres (an ordinary mercenary troop regiment, correctly left
    // WITHOUT noCommand in OLD-22), a Giant has no shield/hand-weapon kit at
    // all — Large target/terror/special attacks stand in for normal equipment,
    // the same shape as og-night-goblin-fanatics/og-squig-hoppers (individual
    // models, both noCommand: true).
    expect(giant!.noCommand).toBe(true)
    expect((giant!.options ?? []).map((o) => o.id)).not.toEqual(
      expect.arrayContaining(['standard', 'musician']),
    )
  })

  it('counts toward the Regiments cap and NOT the Monsters cap in the Muster Check', () => {
    const roster: Roster = {
      id: 'r',
      name: 'Giants test',
      armyId: 'orcs-and-goblins',
      pointsLimit: 1000,
      entries: [{ id: '1', unitId: 'og-giant', size: 2, optionIds: [], magicItemIds: [] }],
    }
    const points = entryPoints(roster.entries[0], og)
    expect(points).toBe(400) // 2 * 200, no options

    const s = summarize(roster, og)
    expect(s.caps.regiments.points).toBe(points)
    expect(s.caps.monsters.points).toBe(0)
  })
})

describe('OLD-28: Trolls and Snotlings are Regiments, not Monsters', () => {
  const og = getArmy('orcs-and-goblins')!
  const trolls = og.units.find((u) => u.id === 'og-trolls')
  const snotlings = og.units.find((u) => u.id === 'og-snotlings')

  // The book's own CONTENIDO page (printed p.2) files both under PEÑAS —
  // "TROLLS ... 86", "SNOTLINGS ... 86" — while LISTA DE MONSTRUOS is a
  // separate section on p.89. Same mistake OLD-27 fixed for the Giant.
  it('og-trolls is a regiment and keeps its book-accurate points and stats', () => {
    expect(trolls, 'og-trolls not found').toBeDefined()
    expect(trolls!.role).toBe('regiment')
    expect(trolls!.pointsPerModel).toBe(65)
    // PDF p.86 and Bestiary p.75 agree: M15 HA3 HP1 F5 R4 H3 I1 A3 L4.
    expect(trolls!.statLine).toEqual({ M: 6, WS: 3, BS: 1, S: 5, T: 4, W: 3, I: 1, A: 3, Ld: 4 })
  })

  it('og-snotlings is a regiment and keeps its book-accurate points and stats', () => {
    expect(snotlings, 'og-snotlings not found').toBeDefined()
    expect(snotlings!.role).toBe('regiment')
    expect(snotlings!.pointsPerModel).toBe(15)
    // PDF p.86 and Bestiary p.72: M10 HA2 HP2 F1 R1 H3 I3 A3 L4, per base.
    expect(snotlings!.statLine).toEqual({ M: 4, WS: 2, BS: 2, S: 1, T: 1, W: 3, I: 3, A: 3, Ld: 4 })
  })

  it('minSize: 1 — the book exempts both from the normal five-model floor', () => {
    // Trolls, p.86: "el número de Trolls en una unidad puede ser inferior al
    // mínimo normal de cinco miniaturas [...] Podrías, por ejemplo, tener sólo
    // un Troll en tu ejército y contaría como una unidad él solo."
    // Snotlings, p.86: organised by bases, "si tienes tan sólo una peana de
    // Snotlings, ésta contará como una unidad por sí misma."
    expect(trolls!.minSize).toBe(1)
    expect(snotlings!.minSize).toBe(1)
  })

  it('noCommand: true on both — no auto standard bearer or musician', () => {
    // Trolls follow the criterion OLD-27 set for the Giant: the entry has no
    // equipment at all ("Los Trolls no necesitan armas para luchar"), so it is
    // not the rank-and-file troop regiment og-ogres is (hand weapon + four
    // equipment options, command group correctly kept in OLD-22/OLD-30).
    // Snotlings, Bestiary p.72 (OFICIALES): "Los héroes no pueden ni unirse ni
    // actuar como oficiales de las unidades de Snotlings [...] están demasiado
    // excitados como para entender incluso las órdenes más simples."
    expect(trolls!.noCommand).toBe(true)
    expect(snotlings!.noCommand).toBe(true)
    for (const u of [trolls!, snotlings!]) {
      expect((u.options ?? []).map((o) => o.id)).not.toEqual(
        expect.arrayContaining(['standard', 'musician']),
      )
    }
  })

  it('the three troll types are free, mutually exclusive options', () => {
    // p.86: "cualquiera de los tres tipos: Trolls, Trolls de Río, y Trolls de
    // Piedra", all at the same 65 pts/model — the type is a choice, not an
    // upgrade — and "los Trolls deben estar organizados en unidades del mismo
    // tipo", hence one shared exclusiveGroup.
    const types = (trolls!.options ?? []).filter((o) => o.exclusiveGroup === 'troll-type')
    expect(types.map((o) => o.id)).toEqual(['troll-type-common', 'troll-type-river', 'troll-type-stone'])
    for (const o of types) {
      expect(o.pointsPerModel).toBe(0)
      expect(o.description, `${o.id} needs an English rule summary`).toBeTruthy()
      expect(o.descEs, `${o.id} needs a Spanish rule summary`).toBeTruthy()
    }
    // The book gives Trolls no equipment options at all, so the type choice is
    // the entry's whole option list.
    expect(trolls!.options).toHaveLength(3)
    // Snotlings get none whatsoever.
    expect(snotlings!.options ?? []).toHaveLength(0)
  })

  it('picking a troll type costs nothing; picking two is flagged', () => {
    const roster = (optionIds: string[]): Roster => ({
      id: 'r',
      name: 'Troll types',
      armyId: 'orcs-and-goblins',
      pointsLimit: 3000,
      entries: [
        { id: 'gen', unitId: 'og-warboss-orc', size: 1, optionIds: [], magicItemIds: [], isGeneral: true },
        { id: 'trolls', unitId: 'og-trolls', size: 3, optionIds, magicItemIds: [] },
      ],
    })

    expect(entryPoints(roster(['troll-type-stone']).entries[1], og)).toBe(195) // 3 * 65, type is free

    const groupViolations = (optionIds: string[]) =>
      validateRoster(roster(optionIds), og, 'en').filter((v) => v.rule === 'options-exclusive-group')
    expect(groupViolations(['troll-type-stone'])).toEqual([])
    const both = groupViolations(['troll-type-river', 'troll-type-stone'])
    expect(both).toHaveLength(1)
    expect(both[0].entryId).toBe('trolls')
    // The group is a property of the whole unit, not of one model, so the
    // message may not reuse the per-model Mark-of-Chaos wording — and it must
    // never leak the raw group id ('troll-type') to the user.
    expect(both[0].message).toBe('Trolls: the whole unit must be one troll type (2 selected).')
    const es = validateRoster(roster(['troll-type-river', 'troll-type-stone']), og, 'es')
      .filter((v) => v.rule === 'options-exclusive-group')
    expect(es[0].message).toBe('Trolls: toda la unidad debe ser de un solo tipo de troll (hay 2 seleccionados).')
  })

  it('both count toward the Regiments cap and NOT the Monsters cap', () => {
    const roster: Roster = {
      id: 'r',
      name: 'Mercenaries',
      armyId: 'orcs-and-goblins',
      pointsLimit: 1000,
      entries: [
        { id: 't', unitId: 'og-trolls', size: 3, optionIds: [], magicItemIds: [] },
        { id: 's', unitId: 'og-snotlings', size: 4, optionIds: [], magicItemIds: [] },
      ],
    }
    const s = summarize(roster, og)
    expect(s.caps.regiments.points).toBe(3 * 65 + 4 * 15) // 255
    expect(s.caps.monsters.points).toBe(0)
  })
})

describe('OLD-25: war-machine crew equipment is a real priced option', () => {
  // A war machine is a SINGLE-MODEL entry to entryPoints (only role 'regiment'
  // multiplies by size), so an upgrade the book prices "per crew model" has to
  // be stored flat, already multiplied by the fixed crew the book gives the
  // machine. Encoded per-model it would charge one model's worth.
  const crewOption = (armyId: string, unitId: string) => {
    const army = getArmy(armyId)!
    const unit = army.units.find((u) => u.id === unitId)
    expect(unit, `${unitId} not found`).toBeDefined()
    const opt = (unit!.options ?? []).find((o) => o.id === 'light-armour')
    expect(opt, `${unitId} should offer crew light armour`).toBeDefined()
    return { army, unit: unit!, opt: opt! }
  }

  const withOption = (armyId: string, unitId: string): number => {
    const army = getArmy(armyId)!
    return entryPoints(
      { id: 'e', unitId, size: 1, optionIds: ['light-armour'], magicItemIds: [] },
      army,
    )
  }

  it('Orcs & Goblins: 3 Orc crew at +2/model = +6 flat (book p.87)', () => {
    // "La dotación del Lanzador de Rocas puede equiparse con Armaduras Ligeras
    // por un coste adicional de +2 puntos por miniatura", and the same line for
    // the Lanzavirotes; each machine has "una dotación compuesta por tres Orcos".
    for (const [id, base] of [
      ['og-rock-lobber-small', 66.5],
      ['og-rock-lobber-large', 96.5],
      ['og-spear-chukka', 46.5],
    ] as const) {
      const { unit, opt } = crewOption('orcs-and-goblins', id)
      expect(unit.pointsPerModel, `${id} base points`).toBe(base)
      expect(opt.flat, `${id} crew armour must be flat`).toBe(true)
      expect(opt.pointsPerModel, `${id} crew armour`).toBe(6)
      expect(opt.description).toBeTruthy()
      expect(opt.descEs).toBeTruthy()
      expect(withOption('orcs-and-goblins', id)).toBe(base + 6)
    }
  })

  it('Dwarfs: 3 Dwarf crew at +2/model = +6 flat on all six machines (book pp.88-89)', () => {
    // Every Dwarf war machine "cuenta con una dotación de tres artilleros Enanos"
    // and offers "armaduras ligeras invirtiendo un coste adicional de +2 puntos
    // por miniatura". The base points are the book's and are unchanged.
    for (const [id, base] of [
      ['dw-cannon', 110],
      ['dw-organ-gun', 65],
      ['dw-flame-cannon', 119],
      ['dw-bolt-thrower', 54],
      ['dw-stone-thrower-small', 74],
      ['dw-stone-thrower-great', 104],
    ] as const) {
      const { unit, opt } = crewOption('dwarfs', id)
      expect(unit.pointsPerModel, `${id} base points`).toBe(base)
      expect(opt.flat, `${id} crew armour must be flat`).toBe(true)
      expect(opt.pointsPerModel, `${id} crew armour`).toBe(6)
      expect(withOption('dwarfs', id)).toBe(base + 6)
    }
  })

  it('Skaven: the Jezzail has 2 crew at +4/model = +8 flat (book p.67)', () => {
    // "Cada Mosquete Jezzail tiene una dotación de dos Skaven [...] La dotación
    // de un Mosquete Jezzail puede equiparse con armaduras ligeras a un coste de
    // +4 puntos por miniatura." Not the generic 2-pt infantry light armour.
    const { unit, opt } = crewOption('skaven', 'sk-jezzail')
    expect(unit.pointsPerModel).toBe(30)
    expect(opt.flat).toBe(true)
    expect(opt.pointsPerModel).toBe(8)
    expect(withOption('skaven', 'sk-jezzail')).toBe(38)
  })

  it('machines the book gives no options keep none', () => {
    // O&G p.87-88: the Snotling Pump Wagon and the Doom Diver Catapult have no
    // OPCIONES line at all; Dwarfs p.88: the Gyrocopter is a single pilot.
    for (const [armyId, unitId] of [
      ['orcs-and-goblins', 'og-snotling-pump-wagon'],
      ['orcs-and-goblins', 'og-doom-diver'],
      ['dwarfs', 'dw-gyrocopter'],
    ] as const) {
      const unit = getArmy(armyId)!.units.find((u) => u.id === unitId)!
      expect(unit.options ?? [], `${unitId} should have no options`).toHaveLength(0)
    }
  })

  it('no war machine in these three armies offers extra crew', () => {
    // The books give every machine a FIXED crew — three Orcs / three Dwarfs /
    // two Skaven. The only "tripulantes adicionales" in the O&G book belong to
    // the chariots (OLD-23), which are role 'chariot', not 'warmachine'.
    for (const armyId of ['orcs-and-goblins', 'dwarfs', 'skaven'] as const) {
      for (const u of getArmy(armyId)!.units.filter((x) => x.role === 'warmachine')) {
        for (const o of u.options ?? []) {
          expect(o.addsCrewman, `${u.id}/${o.id}`).toBeUndefined()
          expect(o.id, `${u.id}/${o.id}`).not.toMatch(/crew(man)?$|extra-crew/)
        }
      }
    }
  })
})

describe('OLD-31: the Tiranoc Chariot prices its per-crewman options per crewman', () => {
  // High Elves p.79 (PDF 81), AURIGAS DE TIRANOC. The chariot is "tirado por dos
  // Corceles Élficos y tripulado por dos Elfos" — TWO Aurigas, TWO steeds. Its
  // OPCIONES line prices four upgrades per Auriga ("+1 punto por Auriga" /
  // "+1 punto por miniatura", the subject being "Cualquier Auriga") and the
  // barding per steed ("+4 puntos cada uno"), but the entry is role 'chariot',
  // a SINGLE-MODEL entry to entryPoints (only 'regiment' multiplies by size).
  // Stored per-model these charged ONE crewman / ONE steed's worth: half, or a
  // quarter, of the book's price. They must be flat, already multiplied.
  const chariot = () => getArmy('high-elves')!.units.find((u) => u.id === 'he-tiranoc-chariot')!
  const opt = (id: string) => {
    const o = (chariot().options ?? []).find((x) => x.id === id)
    expect(o, `${id} not found on the Tiranoc Chariot`).toBeDefined()
    return o!
  }
  const withOptions = (...optionIds: string[]): number =>
    entryPoints(
      { id: 'e', unitId: 'he-tiranoc-chariot', size: 1, optionIds, magicItemIds: [] },
      getArmy('high-elves')!,
    )

  it('the base chariot is the book\'s 84 points', () => {
    // "AURIGAS DE TIRANOC .... 84 puntos por miniatura"
    expect(chariot().pointsPerModel).toBe(84)
    expect(withOptions()).toBe(84)
  })

  it('shield / heavy armour / lance / longbow are +1 per Auriga x 2 Aurigas = +2 flat', () => {
    // "Cualquier Auriga puede equiparse con un Escudo por un coste adicional de
    // +1, y/o sustituir su Armadura Ligera por una Armadura Pesada por un coste
    // adicional de +1 punto por Auriga. Cualquier Auriga puede equiparse con una
    // Lanza por un coste adicional de +1 punto por miniatura, y sustituir su Arco
    // por un Arco Largo por un coste adicional de +1 punto por miniatura."
    for (const id of ['chariot-shield', 'chariot-heavy-armour', 'chariot-lance', 'chariot-longbow']) {
      const o = opt(id)
      expect(o.flat, `${id} must be flat (per-entry), not per-model`).toBe(true)
      expect(o.pointsPerModel, `${id} = +1 x 2 crew`).toBe(2)
      expect(o.description, `${id} needs the arithmetic + citation`).toBeTruthy()
      expect(o.descEs, `${id} needs a Spanish description`).toBeTruthy()
      expect(withOptions(id), `${id} on a bare chariot`).toBe(86)
    }
    // All four together: 84 + 4 x 2.
    expect(withOptions('chariot-shield', 'chariot-heavy-armour', 'chariot-lance', 'chariot-longbow')).toBe(92)
  })

  it('barding is +4 per steed x 2 steeds = +8 flat, all-or-none', () => {
    // "Los Corceles de los Carruajes pueden equiparse con Barda con un coste
    // adicional de +4 puntos cada uno. Debe equiparse con barda a todos los
    // Corceles, o a ninguno." — so it is never a single steed's +4.
    const o = opt('chariot-barding')
    expect(o.flat).toBe(true)
    expect(o.pointsPerModel).toBe(8)
    expect(withOptions('chariot-barding')).toBe(92)
  })

  it('the per-chariot options keep the book\'s per-chariot price', () => {
    // "cuchillas en las ruedas por un coste adicional de +20 puntos" and
    // "dos Corceles Élficos más [...] +6 puntos los dos corceles" — both are
    // already whole-chariot prices, so they stay exactly as they were.
    expect(opt('scythed-wheels').flat).toBe(true)
    expect(opt('scythed-wheels').pointsPerModel).toBe(20)
    expect(opt('extra-steeds').flat).toBe(true)
    expect(opt('extra-steeds').pointsPerModel).toBe(6)
    expect(withOptions('scythed-wheels')).toBe(104)
    expect(withOptions('extra-steeds')).toBe(90)
  })

  it('no Tiranoc option is left per-model — every one is a whole-chariot charge', () => {
    // A 'chariot' entry never multiplies by size, so a non-flat option here is
    // silently a one-model charge whatever its name claims.
    for (const o of chariot().options ?? []) {
      expect(o.flat, `${o.id} must be flat on a single-model entry`).toBe(true)
    }
    // …and none of them still advertises itself as a per-crew unit price.
    for (const o of chariot().options ?? []) {
      expect(o.name, `${o.id} name`).not.toMatch(/per crew|per steed/i)
    }
  })

  it('the Repeater Bolt Thrower has no crew options to misprice', () => {
    // p.79: "Equipo: La dotación está equipada con arma de mano y Armadura
    // Ligera." — no OPCIONES line at all, so nothing to buy.
    const bt = getArmy('high-elves')!.units.find((u) => u.id === 'he-bolt-thrower')!
    expect(bt.pointsPerModel).toBe(100)
    expect(bt.options ?? []).toHaveLength(0)
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

// OLD-35 — the standalone O&G chariots price crew shields and short bows "por
// tripulante" (book p.88), so they carry the same `baseCrew`/`perCrewman`/
// `addsCrewman` flags as their character-mount twins. Raw rates are unchanged
// (asserted in the OLD-23 block above); this pins the flags that make those
// rates scale with the crew bought.
describe('Orcs & Goblins standalone chariots — per-crewman flags (OLD-35)', () => {
  const orcs = getArmy('orcs-and-goblins')!
  const byId = (id: string) => orcs.units.find((u) => u.id === id)!
  const opt = (unitId: string, optionId: string) =>
    (byId(unitId).options ?? []).find((o) => o.id === optionId)!

  const cases = [
    { unitId: 'og-orc-boar-chariot', prefix: 'og-orc-chariot' },
    { unitId: 'og-goblin-wolf-chariot', prefix: 'og-goblin-chariot' },
  ]

  for (const c of cases) {
    it(`${c.unitId}: baseCrew 2, crew kit perCrewman, extra crewmen addsCrewman`, () => {
      expect(byId(c.unitId).baseCrew).toBe(2)
      expect(opt(c.unitId, `${c.prefix}-shields`).perCrewman).toBe(true)
      expect(opt(c.unitId, `${c.prefix}-bows`).perCrewman).toBe(true)
      expect(opt(c.unitId, `${c.prefix}-crew3`).addsCrewman).toBe(true)
      expect(opt(c.unitId, `${c.prefix}-crew4`).addsCrewman).toBe(true)
      // Scythed wheels are priced "por carruaje" — flat, not per crewman.
      expect(opt(c.unitId, `${c.prefix}-scythes`).perCrewman).toBeUndefined()
      expect(opt(c.unitId, `${c.prefix}-scythes`).flat).toBe(true)
    })
  }

  it('the 3rd Giant Wolf stays a flat +4 (the book gives no per-anything qualifier)', () => {
    const wolf3 = opt('og-goblin-wolf-chariot', 'og-goblin-chariot-wolf3')
    expect(wolf3.flat).toBe(true)
    expect(wolf3.perCrewman).toBeUndefined()
    expect(wolf3.addsCrewman).toBeUndefined()
  })
})
