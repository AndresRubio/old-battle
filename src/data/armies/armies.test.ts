import { describe, it, expect } from 'vitest'
import { ARMIES, getArmy } from './index'
import { validateRoster } from '../../rules/validate'
import { entryPoints, pointsByRole, effectiveStatLine } from '../../rules/points'
import { findRule } from '../rules'
import { summarize } from '../../rules/summary'
import type { Roster, StatLine } from '../types'
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

describe('OLD-32 — High Elves profiles match the book', () => {
  // Source: 1997 Altos Elfos (Spanish army book). Page numbers below are the
  // PRINTED page. Book stat columns M / HA / HP / F / R / H / I / A / L map to
  // M / WS / BS / S / T / W / I / A / Ld, and Movement is converted to inches
  // (12cm → 5"). Every row here is pinned in FULL, not just the column that was
  // wrong, so a future edit to one stat can't quietly drag the others with it.
  const he = () => getArmy('high-elves')!
  const unit = (id: string) => {
    const u = he().units.find((x) => x.id === id)
    expect(u, `${id} not found in the High Elf list`).toBeDefined()
    return u!
  }

  it('the Tiranoc Chariot crew are S3 Aurigas — the whole row (p.79)', () => {
    // "Auriga  12  5  4  3  3  1  7  1  8" (p.79; concordant on p.68 and the
    // p.101 reference table). An Auriga is an ordinary Elf warrior with a
    // chariot: Strength 3, not 4.
    expect(unit('he-tiranoc-chariot').statLine).toEqual({
      M: 5, WS: 5, BS: 4, S: 3, T: 3, W: 1, I: 7, A: 1, Ld: 8,
    })
  })

  it('the Battle Standard Bearer is BS5 — the whole row (p.73)', () => {
    // "Portaestandarte de Batalla  12  5  5  4  3  1  7  2  8" (p.73;
    // confirmed p.101). High Elf characters shoot as well as they fight:
    // BS equals WS.
    expect(unit('he-battle-standard').statLine).toEqual({
      M: 5, WS: 5, BS: 5, S: 4, T: 3, W: 1, I: 7, A: 2, Ld: 8,
    })
  })

  it('the High Elf Hero is BS6 — the whole row (p.73)', () => {
    // "Héroe  12  6  6  4  4  2  8  3  9" (p.73; confirmed p.101).
    expect(unit('he-hero').statLine).toEqual({
      M: 5, WS: 6, BS: 6, S: 4, T: 4, W: 2, I: 8, A: 3, Ld: 9,
    })
  })

  it('the Paladin is BS5 — the whole row (p.74)', () => {
    // "Paladín  12  5  5  4  3  1  7  2  8" (p.74; confirmed p.101).
    expect(unit('he-paladin').statLine).toEqual({
      M: 5, WS: 5, BS: 5, S: 4, T: 3, W: 1, I: 7, A: 2, Ld: 8,
    })
  })

  it('the General keeps BS7 — the elf() default must never overwrite it', () => {
    // These entries are built from the local elf() helper, whose default BS is
    // 4 (the rank-and-file Guerrero Elfo, p.62). The BSB / Hero / Paladin rows
    // above were wrong precisely because they never overrode it. The General
    // (p.73: "Comandante  12  7  7  4  4  3  9  4  10") always did — this test
    // guards the one that was already right.
    expect(unit('he-general').statLine.BS).toBe(7)
    expect(unit('he-general').statLine).toEqual({
      M: 5, WS: 7, BS: 7, S: 4, T: 4, W: 3, I: 9, A: 4, Ld: 10,
    })
  })

  it('no High Elf character is left on the elf() BS-4 default with a higher WS', () => {
    // The generic characters are the ones this issue corrected; the rule the
    // book states is BS = WS for High Elf characters. Special characters are
    // transcribed individually and are out of this check's scope.
    for (const id of ['he-general', 'he-battle-standard', 'he-hero', 'he-paladin']) {
      const s = unit(id).statLine
      expect(s.BS, `${id}: High Elf characters have BS equal to WS`).toBe(s.WS)
    }
  })

  it('Silver Helm barding is +8 points per model (p.75)', () => {
    // "Cualquier unidad puede equipar sus Corceles con bardas por un coste
    // adicional de +8 puntos por miniatura." (p.75)
    const helms = unit('he-silver-helms')
    const barding = (helms.options ?? []).find((o) => o.id === 'barding')
    expect(barding, 'Silver Helms must offer barding').toBeDefined()
    expect(barding!.flat ?? false).toBe(false)
    expect(barding!.pointsPerModel).toBe(8)
    // 5 Silver Helms at 31 + 8 barding each = 195.
    expect(
      entryPoints(
        { id: 'e', unitId: 'he-silver-helms', size: 5, optionIds: ['barding'], magicItemIds: [] },
        he(),
      ),
    ).toBe(195)
  })

  it('White Lions stay at S4 — the p.101 reference table is the outlier', () => {
    // Book erratum: the p.101 summary table prints "Leones Blancos 12 5 4 3 3 1
    // 6 1 8" (S3), but the bestiary (p.67) and the army list (p.76) both print
    // S4. Two to one — the code keeps S4. Recorded in CITATIONS.md so nobody
    // "corrects" it off the reference table later.
    expect(unit('he-white-lions').statLine.S).toBe(4)
  })
})

// OLD-33 — a chariot's chassis is a display-only ProfileBlock, but `statLine`
// is a Partial<StatLine> and the UI renders "–" for every missing column, so an
// omitted column hides real book data. Eight chassis were short the columns the
// book prints (typically S and I); three of them (Arkhan's chariot, Volkmar's
// War Altar and the Imperial War Wagon) also held T/W the book contradicts.
// Same shape as the Orcs & Goblins chassis test above, whose
// CHARIOT_CHASSIS_STATS = { S: 7, T: 7, W: 3, I: 1 } (printed p.88) is the
// verified reference these rows were checked against.
//
// Two rows print `A: 1D6` in the book (the Undead Chariot and the Chariot of
// Arkhan). `StatLine.A` is typed `number` and still is, so `A` stays absent
// from both statLines — but since OLD-39 the printed dice expression is carried
// alongside it as a book token and rendered in the A column, so the app no
// longer shows "–" where the book prints a roll. Since OLD-43 that token lives
// in `ProfileBlock.statNotes` (any column, not just Attacks); the values are
// pinned in the OLD-43 block at the end of this file.
describe('OLD-33 — chariot chassis profiles match the book', () => {
  const CHASSIS: Array<{
    army: string
    unit: string
    profile: string
    profileEs: string
    page: string
    statLine: Partial<StatLine>
  }> = [
    {
      // Altos Elfos, printed p.79 = PDF 81 (concordant with p.68 and p.101):
      // "Carruaje  -  -  -  7  7  3  1  -  -"
      army: 'high-elves', unit: 'he-tiranoc-chariot',
      profile: 'Chariot', profileEs: 'Carro',
      page: 'Altos Elfos printed p.79',
      statLine: { S: 7, T: 7, W: 3, I: 1 },
    },
    {
      // Paladines del Caos, printed p.44 = PDF 46:
      // "CARRUAJE  –  –  –  7  7  3  1  –  –"
      army: 'chaos', unit: 'ch-gorthor',
      profile: 'Tuskgor Chariot', profileEs: 'Carro de Tuskgors',
      page: 'Paladines del Caos printed p.44',
      statLine: { S: 7, T: 7, W: 3, I: 1 },
    },
    {
      // Reino del Caos, printed p.104 = PDF 106:
      // "Carruaje  -  -  -  7  7  3  1  -  -"
      army: 'chaos', unit: 'ch-chariot',
      profile: 'Chariot', profileEs: 'Carro',
      page: 'Reino del Caos printed p.104',
      statLine: { S: 7, T: 7, W: 3, I: 1 },
    },
    {
      // Reino del Caos, printed p.109 = PDF 111:
      // "Carruaje  -  -  -  7  7  3  1  -  -"
      army: 'chaos', unit: 'ch-beast-chariot',
      profile: 'Chariot', profileEs: 'Carro',
      page: 'Reino del Caos printed p.109',
      statLine: { S: 7, T: 7, W: 3, I: 1 },
    },
    {
      // No Muertos, printed p.84 = PDF 86 (the identical row is reprinted on
      // printed p.68): "Carruaje Esquelético  -  -  -  5  5  3  1  1D6  -".
      // A: 1D6 is unrepresentable — see the block comment above.
      army: 'undead', unit: 'ud-undead-chariot',
      profile: 'Chariot', profileEs: 'Carro',
      page: 'No Muertos printed p.84',
      statLine: { S: 5, T: 5, W: 3, I: 1 },
    },
    {
      // No Muertos, printed p.91 = PDF 93:
      // "Carruaje de Arkhan  -  4  -  6  6  3  -  1D6  -".
      // Was { T: 5, W: 4 } — wrong T and W, not merely short columns.
      // A: 1D6 is unrepresentable — see the block comment above.
      army: 'undead', unit: 'ud-arkhan-the-black',
      profile: 'Chariot of Arkhan', profileEs: 'Carro de Arkhan',
      page: 'No Muertos printed p.91',
      statLine: { WS: 4, S: 6, T: 6, W: 3 },
    },
    {
      // Imperio, printed p.69 = PDF 71: "Altar  –  –  –  7  7  3  1  –  –".
      // Was { T: 5, W: 4 } — wrong T and W.
      army: 'empire', unit: 'emp-volkmar',
      profile: 'War Altar (chariot)', profileEs: 'Altar de Guerra (carro)',
      page: 'Imperio printed p.69',
      statLine: { S: 7, T: 7, W: 3, I: 1 },
    },
    {
      // Imperio, rules section printed p.20 = PDF 22: "Torre del Carruaje de
      // Guerra Imperial  -  -  -  7  7  5  1  -  -". The printed p.65 army-list
      // row omits the F column; the p.20 prose settles it ("el Atributo de
      // Fuerza del propio Carro de Guerra Imperial, es decir 7").
      // Was { T: 5, W: 4 } — wrong T and W.
      army: 'empire', unit: 'emp-war-wagon',
      profile: 'Chassis', profileEs: 'Chasis',
      page: 'Imperio printed p.20',
      statLine: { S: 7, T: 7, W: 5, I: 1 },
    },
  ]

  for (const row of CHASSIS) {
    it(`${row.unit} — ${row.profile} (${row.page})`, () => {
      const unit = getArmy(row.army)!.units.find((u) => u.id === row.unit)
      expect(unit, `${row.army}: no unit ${row.unit}`).toBeDefined()
      const chassis = (unit!.profiles ?? []).find((p) => p.name === row.profile)
      expect(chassis, `${row.unit}: no "${row.profile}" profile`).toBeDefined()
      expect(chassis!.statLine).toEqual(row.statLine)
      // Display profiles are bilingual — the Spanish name must survive the fix.
      expect(chassis!.nameEs).toBe(row.profileEs)
    })
  }

  it('none of the eight chassis carries a numeric Attacks value', () => {
    // A is either absent from the book row (the six "- -" rows) or printed as
    // 1D6, which StatLine.A cannot hold (it lives in `statNotes` since OLD-43,
    // OLD-39's Attacks-only field before that). Either way `statLine.A` must stay unset rather
    // than be invented as a number.
    for (const row of CHASSIS) {
      const unit = getArmy(row.army)!.units.find((u) => u.id === row.unit)!
      const chassis = (unit.profiles ?? []).find((p) => p.name === row.profile)!
      expect(chassis.statLine.A, `${row.unit} chassis A`).toBeUndefined()
    }
  })
})

// OLD-34 — Altos Elfos, printed p.79 = PDF 81, closing paragraph of AURIGAS DE
// TIRANOC: "Los personajes pueden montar en un Carruaje, en cuyo caso el
// personaje sustituye a uno de los tripulantes. El valor en puntos del carruaje
// no varía por ello: el personaje debe gastar, por ejemplo, +84 puntos para
// montar en el carruaje básico (ver la página 74)." The permission is printed
// individually under the General, Battle Standard Bearer, Hero and Mage
// (printed pp.73-74) and, conditional on his regiment, under the Paladin
// (printed p.74).
describe('OLD-34 — High Elf characters may ride a Tiranoc Chariot', () => {
  const he = () => getArmy('high-elves')!
  const unit = (id: string) => {
    const u = he().units.find((x) => x.id === id)
    expect(u, `no unit ${id}`).toBeDefined()
    return u!
  }
  const chariotMount = (unitId: string) =>
    (unit(unitId).mounts ?? []).find((m) => m.id === 'mount-tiranoc-chariot')
  const mountOpt = (unitId: string, optionId: string) => {
    const o = (chariotMount(unitId)!.options ?? []).find((x) => x.id === optionId)
    expect(o, `${unitId}: chariot mount has no option ${optionId}`).toBeDefined()
    return o!
  }
  const riding = (unitId: string, ...optionIds: string[]) =>
    entryPoints(
      { id: 'e', unitId, size: 1, optionIds, mountId: 'mount-tiranoc-chariot', magicItemIds: [] },
      he(),
    )

  // Every generic character type states the permission in its own entry.
  const RIDERS = ['he-general', 'he-battle-standard', 'he-hero', 'he-mage', 'he-paladin']

  it('all five generic characters offer the chariot, at the book\'s 84 points', () => {
    for (const id of RIDERS) {
      const mount = chariotMount(id)
      expect(mount, `${id} must offer the Tiranoc Chariot mount`).toBeDefined()
      expect(mount!.points, `${id}: chariot mount points`).toBe(84)
      // The standalone entry's price, unchanged: "El valor en puntos del
      // carruaje no varía por ello".
      expect(mount!.points).toBe(unit('he-tiranoc-chariot').pointsPerModel)
      expect(mount!.nameEs, `${id}: chariot mount needs a Spanish name`).toBe('Auriga de Tiranoc')
    }
  })

  it('riding it adds exactly 84 points to the character\'s own cost', () => {
    // The chariot's points are added to the character ("el coste del carruaje
    // deberá sumarse al suyo propio", printed p.73).
    expect(unit('he-general').pointsPerModel).toBe(160)
    expect(riding('he-general')).toBe(160 + 84)
    expect(unit('he-paladin').pointsPerModel).toBe(48)
    expect(riding('he-paladin')).toBe(48 + 84)
  })

  it('the chariot-level options keep their book prices through the mount', () => {
    // p.79: scythed wheels "+20 puntos", two more steeds "+6 puntos los dos
    // corceles", barding "+4 puntos cada uno" all-or-none = 8 for the pair.
    expect(mountOpt('he-general', 'mount-tiranoc-chariot-scythes').pointsPerModel).toBe(20)
    expect(mountOpt('he-general', 'mount-tiranoc-chariot-extra-steeds').pointsPerModel).toBe(6)
    expect(mountOpt('he-general', 'mount-tiranoc-chariot-barding').pointsPerModel).toBe(8)
    expect(riding('he-general', 'mount-tiranoc-chariot-scythes')).toBe(160 + 84 + 20)
    expect(riding('he-general', 'mount-tiranoc-chariot-extra-steeds')).toBe(160 + 84 + 6)
    expect(riding('he-general', 'mount-tiranoc-chariot-barding')).toBe(160 + 84 + 8)
    // Every offered option is bilingual, as the standalone entry's are.
    for (const o of chariotMount('he-general')!.options ?? []) {
      expect(o.description, `${o.id} needs a description`).toBeTruthy()
      expect(o.descEs, `${o.id} needs a Spanish description`).toBeTruthy()
    }
  })

  it('the four crew-kit options are deliberately NOT offered', () => {
    // The book says the character "sustituye a uno de los tripulantes" but
    // never states the resulting crew count, and says nothing about a per-crew
    // basis for the crew kit on a ridden chariot. The standalone entry's
    // shield / heavy armour / lance / longbow are stored as "+1 per Auriga x 2
    // Aurigas" (OLD-31), a basis that no longer holds — so they are omitted
    // rather than repriced on a guess. Only the per-CHARIOT upgrades are here.
    const ids = (chariotMount('he-general')!.options ?? []).map((o) => o.id)
    expect(ids).toEqual([
      'mount-tiranoc-chariot-scythes',
      'mount-tiranoc-chariot-extra-steeds',
      'mount-tiranoc-chariot-barding',
    ])
    for (const kit of ['shield', 'heavy-armour', 'lance', 'longbow']) {
      expect(ids.some((id) => id.includes(kit)), `crew kit "${kit}" must not be offered`).toBe(false)
    }
    // …and no crew flag either, since the ridden chariot's crew is unstated.
    expect(chariotMount('he-general')!.baseCrew).toBeUndefined()
    for (const o of chariotMount('he-general')!.options ?? []) {
      expect(o.perCrewman, `${o.id} perCrewman`).toBeFalsy()
      expect(o.addsCrewman, `${o.id} addsCrewman`).toBeFalsy()
    }
  })

  it('a ridden chariot counts against CHARACTERS, a fielded one against war machines', () => {
    // Printed p.69 = PDF 71: "Si un personaje monta en un Carruaje de Guerra su
    // valor en puntos debe sumarse al del personaje, y por tanto se
    // contabilizará contra la proporción de puntos que pueden invertirse en
    // personajes." Printed p.71 = PDF 73 (ORGANIZACIÓN DEL EJÉRCITO): "Este
    // límite de puntos no incluye el coste de un carruaje montado por un
    // personaje, que debe adquirirse con los puntos de Personajes."
    const army = he()
    const entries = [
      // General on a chariot: 160 + 84, all of it character points.
      { id: '1', unitId: 'he-general', size: 1, optionIds: [], mountId: 'mount-tiranoc-chariot', magicItemIds: [], isGeneral: true },
      // The same chariot fielded on its own stays a chariot: 84 war-machine points.
      { id: '2', unitId: 'he-tiranoc-chariot', size: 1, optionIds: [], magicItemIds: [] },
    ]
    const byRole = pointsByRole(entries, army)
    expect(byRole.character).toBe(244)
    expect(byRole.chariot).toBe(84)
    expect(byRole.warmachine).toBe(0)

    const roster: Roster = {
      id: 'r', name: 'cap check', armyId: 'high-elves', pointsLimit: 1000, entries,
    }
    const caps = summarize(roster, army).caps
    expect(caps.characters.points).toBe(244)
    // War machines + chariots share one cap: only the standalone chariot is in it.
    expect(caps.warMachines.points).toBe(84)
  })

  it('the mount prints the same chassis and steeds as the standalone entry', () => {
    const standalone = unit('he-tiranoc-chariot').profiles ?? []
    for (const id of RIDERS) {
      expect(chariotMount(id)!.profiles, `${id}: chariot mount profiles`).toEqual(standalone)
    }
    const chassis = standalone.find((p) => p.name === 'Chariot')!
    // OLD-33's corrected chassis, printed p.79 — reused, never retyped.
    expect(chassis.statLine).toEqual({ S: 7, T: 7, W: 3, I: 1 })
  })

  it('the updated rule lines are bilingual and inherit no glossary entry', () => {
    const GENERIC = 'May ride an Elven Steed (+3 pts), a monster, or a Tiranoc Chariot (+84 pts), replacing one of its Aurigas'
    const PALADIN = 'If part of a Tiranoc Chariot regiment, he rides a chariot (+84 pts), replacing one of its Aurigas'
    for (const id of ['he-general', 'he-battle-standard', 'he-hero', 'he-mage']) {
      expect(unit(id).specialRules, `${id} rule line`).toContain(GENERIC)
    }
    expect(unit('he-paladin').specialRules).toContain(PALADIN)
    // The stale unpriced prose is gone from the army entirely.
    for (const u of he().units) {
      expect(u.specialRules ?? []).not.toContain('May ride an Elven Steed (+3 pts), a monster, or a chariot')
    }
    for (const tag of [GENERIC, PALADIN]) {
      expect(RULE_PHRASE_ES[tag], `missing ES translation for "${tag}"`).toBeTruthy()
      // findRule matches by substring, first match wins — neither tag may pick
      // up an unrelated ⓘ glossary entry (the old prose matched none either).
      expect(findRule(tag), `"${tag}" must not inherit a glossary entry`).toBeUndefined()
    }
  })
})

// OLD-37 — a wizard-level option must carry the profile the book prints for that
// level, not just its points and item slots: the books give every level its own
// row (S / W / I / A / Ld all move). Each expectation below is the printed row,
// verbatim, resolved through `effectiveStatLine` exactly as EntryRow renders it.
// Movement: the Spanish books print centimetres and the data stores inches
// (8→3, 10→4, 12→5); the four ENGLISH books (Bretonnia, Lizardmen, Dogs of War)
// already print inches.
describe('OLD-37 — wizard levels carry their own profile', () => {
  type Rows = { l1: StatLine; l2: StatLine; l3?: StatLine; l4?: StatLine }
  const row = (M: number, WS: number, BS: number, S: number, T: number, W: number, I: number, A: number, Ld: number): StatLine =>
    ({ M, WS, BS, S, T, W, I, A, Ld })

  const CASES: { armyId: string; unitId: string; page: string; rows: Rows }[] = [
    {
      // Imperio printed p.58: Hechicero / Paladín Hechicero / Maestro Hechicero /
      // Gran Hechicero. M 10cm → 4".
      armyId: 'empire', unitId: 'emp-wizard', page: 'Imperio p.58',
      rows: {
        l1: row(4, 3, 3, 3, 4, 1, 4, 1, 7),
        l2: row(4, 3, 3, 4, 4, 2, 4, 1, 7),
        l3: row(4, 3, 3, 4, 4, 3, 5, 2, 7),
        l4: row(4, 3, 3, 4, 4, 4, 6, 3, 8),
      },
    },
    {
      // Bretonnia printed p.61 (English): Wizard / Wizard Champion / Master
      // Wizard / Wizard Lord. M already in inches.
      armyId: 'bretonnia', unitId: 'br-wizard', page: 'Bretonnia p.61',
      rows: {
        l1: row(4, 3, 3, 3, 4, 1, 4, 1, 7),
        l2: row(4, 3, 3, 4, 4, 2, 4, 1, 7),
        l3: row(4, 3, 3, 4, 4, 3, 5, 2, 7),
        l4: row(4, 3, 3, 4, 4, 4, 6, 3, 8),
      },
    },
    {
      // Dogs of War / Mercenaries printed p.29 (English): Hireling Wizards.
      armyId: 'dogs-of-war', unitId: 'dow-wizard', page: 'Mercenaries p.29',
      rows: {
        l1: row(4, 3, 3, 3, 4, 1, 4, 1, 7),
        l2: row(4, 3, 3, 4, 4, 2, 4, 1, 7),
        l3: row(4, 3, 3, 4, 4, 3, 5, 2, 7),
        l4: row(4, 3, 3, 4, 4, 4, 6, 3, 8),
      },
    },
    {
      // Altos Elfos printed p.74: Mago / Paladín Mago / Mago Maestro / Gran Mago.
      // M 12cm → 5".
      armyId: 'high-elves', unitId: 'he-mage', page: 'Altos Elfos p.74',
      rows: {
        l1: row(5, 4, 4, 3, 4, 1, 7, 1, 8),
        l2: row(5, 4, 4, 4, 4, 2, 7, 1, 8),
        l3: row(5, 4, 4, 4, 4, 3, 8, 2, 8),
        l4: row(5, 4, 4, 4, 4, 4, 9, 3, 9),
      },
    },
    {
      // Elfos Oscuros printed p.50: Hechicero / Paladín / Maestro / Gran
      // Hechicero — the same four rows as the High Elf Mage. M 12cm → 5".
      armyId: 'dark-elves', unitId: 'de-sorceress', page: 'Elfos Oscuros p.50',
      rows: {
        l1: row(5, 4, 4, 3, 4, 1, 7, 1, 8),
        l2: row(5, 4, 4, 4, 4, 2, 7, 1, 8),
        l3: row(5, 4, 4, 4, 4, 3, 8, 2, 8),
        l4: row(5, 4, 4, 4, 4, 4, 9, 3, 9),
      },
    },
    {
      // Skaven printed p.62: Brujo Ingeniero / Paladín Brujo / Maestro de Brujos.
      // No level-4 option — the Vidente Gris is its own always-L4 entry. M 12cm → 5".
      armyId: 'skaven', unitId: 'sk-warlock-engineer', page: 'Skaven p.62',
      rows: {
        l1: row(5, 3, 3, 3, 4, 1, 5, 1, 5),
        l2: row(5, 3, 3, 4, 4, 2, 5, 1, 6),
        l3: row(5, 3, 3, 4, 4, 3, 6, 2, 7),
      },
    },
    {
      // Enanos del Caos printed p.57: Brujo / Paladín Brujo / Maestro de Brujos /
      // Gran Brujo. M 8cm → 3".
      armyId: 'chaos-dwarfs', unitId: 'cd-sorcerer', page: 'Enanos del Caos p.57',
      rows: {
        l1: row(3, 4, 3, 3, 5, 1, 3, 1, 9),
        l2: row(3, 4, 3, 4, 5, 2, 3, 1, 9),
        l3: row(3, 4, 3, 4, 5, 3, 4, 2, 9),
        l4: row(3, 4, 3, 4, 5, 4, 5, 3, 10),
      },
    },
    {
      // Reino del Caos printed p.101: Hechicero / Paladín / Maestro / Gran
      // Hechicero. M 10cm → 4".
      armyId: 'chaos', unitId: 'ch-sorcerer', page: 'Reino del Caos p.101',
      rows: {
        l1: row(4, 6, 6, 4, 5, 1, 7, 2, 9),
        l2: row(4, 6, 6, 5, 5, 2, 7, 2, 9),
        l3: row(4, 6, 6, 5, 5, 3, 8, 3, 9),
        l4: row(4, 6, 6, 5, 5, 4, 9, 4, 10),
      },
    },
    {
      // Reino del Caos printed p.107: Shaman / Paladín / Maestro / Gran Shaman.
      // M 10cm → 4".
      armyId: 'chaos', unitId: 'ch-beast-shaman', page: 'Reino del Caos p.107',
      rows: {
        l1: row(4, 4, 3, 3, 5, 2, 4, 1, 7),
        l2: row(4, 4, 3, 4, 5, 3, 4, 1, 7),
        l3: row(4, 4, 3, 4, 5, 4, 5, 2, 7),
        l4: row(4, 4, 3, 4, 5, 5, 6, 3, 8),
      },
    },
    {
      // No Muertos printed p.80 (army list) — Nigromante / Paladín / Maestro. A
      // non-general Necromancer caps at Level 3, so no l4 option here. M 10cm → 4".
      armyId: 'undead', unitId: 'ud-necromancer', page: 'No Muertos p.80',
      rows: {
        l1: row(4, 4, 4, 4, 3, 1, 3, 2, 8),
        l2: row(4, 5, 5, 4, 3, 2, 4, 3, 9),
        l3: row(4, 6, 6, 5, 4, 3, 5, 4, 9),
      },
    },
    {
      // Hombres Lagarto printed p.73 (English): Mage-Priest & Palanquin /
      // Champion / Master / Mage-Lord. M already in inches.
      armyId: 'lizardmen', unitId: 'lz-slann', page: 'Lizardmen p.73',
      rows: {
        l1: row(4, 3, 2, 4, 4, 3, 2, 3, 8),
        l2: row(4, 4, 3, 6, 4, 4, 3, 4, 8),
        l3: row(4, 5, 4, 6, 5, 6, 5, 6, 9),
        l4: row(4, 6, 5, 6, 5, 8, 6, 8, 10),
      },
    },
    {
      // OLD-41 — Elfos Silvanos, ARMY LIST printed p.65. Mago / Paladín Mago /
      // Maestro de Magos / Gran Mago, M 12cm → 5". The l3 row is identical to l2
      // on purpose; see the contradiction test below.
      armyId: 'wood-elves', unitId: 'we-mage', page: 'Elfos Silvanos p.65',
      rows: {
        l1: row(5, 4, 4, 3, 4, 1, 7, 1, 8),
        l2: row(5, 4, 4, 4, 4, 2, 7, 1, 8),
        l3: row(5, 4, 4, 4, 4, 2, 7, 1, 8),
        l4: row(5, 4, 4, 4, 4, 4, 9, 3, 9),
      },
    },
  ]

  for (const { armyId, unitId, page, rows } of CASES) {
    it(`${armyId}/${unitId} resolves each level to its own row (${page})`, () => {
      const unit = getArmy(armyId)!.units.find((u) => u.id === unitId)!
      expect(unit, `${unitId} must exist`).toBeDefined()
      expect(effectiveStatLine(unit, []), `${unitId} level 1 (base)`).toEqual(rows.l1)
      const levels: [string, StatLine | undefined][] = [
        ['wizard-l2', rows.l2], ['wizard-l3', rows.l3], ['wizard-l4', rows.l4],
      ]
      for (const [optionId, expected] of levels) {
        const offered = (unit.options ?? []).some((o) => o.id === optionId)
        if (!expected) {
          expect(offered, `${unitId} must not offer ${optionId}`).toBe(false)
          continue
        }
        expect(offered, `${unitId} must offer ${optionId}`).toBe(true)
        expect(effectiveStatLine(unit, [optionId]), `${unitId} ${optionId}`).toEqual(expected)
      }
    })
  }

  // The Undead General is bought as a Great Necromancer already, and the single
  // level option it carries must resolve to the very same Gran Nigromante row
  // (bestiary p.57: 10 7 7 5 4 4 6 5 10; M 10cm → 4").
  it('undead/ud-general-great-necromancer stays on the Gran Nigromante row at level 4 (No Muertos p.57)', () => {
    const general = getArmy('undead')!.units.find((u) => u.id === 'ud-general-great-necromancer')!
    const greatNecromancer = row(4, 7, 7, 5, 4, 4, 6, 5, 10)
    expect(effectiveStatLine(general, []), 'base').toEqual(greatNecromancer)
    expect(effectiveStatLine(general, ['wizard-l4']), 'wizard-l4').toEqual(greatNecromancer)
  })

  // OLD-41 — the one case where the book disagrees with itself. Both pages are
  // legible at 400 dpi, so this is the book, not the scan: the bestiary (printed
  // p.42) gives the Maestro de Magos 12 4 4 4 4 3 8 2 8, while the army list
  // (printed p.65) repeats the Paladín Mago row above it, 12 4 4 4 4 2 7 1 8.
  // The owner ruled for the army list. This test exists so that "fixing" the
  // flat L2→L3 step back into a rising progression fails loudly instead of
  // quietly reinstating the rejected reading.
  it('wood-elves/we-mage keeps the army-list row at level 3, not the bestiary one', () => {
    const mage = getArmy('wood-elves')!.units.find((u) => u.id === 'we-mage')!
    const armyList = row(5, 4, 4, 4, 4, 2, 7, 1, 8)
    const bestiary = row(5, 4, 4, 4, 4, 3, 8, 2, 8)
    expect(effectiveStatLine(mage, ['wizard-l3'])).toEqual(armyList)
    expect(effectiveStatLine(mage, ['wizard-l3'])).not.toEqual(bestiary)
    // Level 3 buys points and a magic-item slot, and nothing else.
    expect(effectiveStatLine(mage, ['wizard-l3'])).toEqual(effectiveStatLine(mage, ['wizard-l2']))
  })

  // OLD-41 — Halflings stay OUT of the table above, and must stay out. The only
  // printed wizard table (Hungry Horde, PDF page 8 = printed folio 10) loses its
  // Ld column off the right edge of a 76 ppi scan, and the whole right margin of
  // that document is cropped the same way. A plausible Ld would pass every other
  // test in this file, so the absence is pinned here instead.
  it('halflings/hf-wizard has no per-level profile — the book scan cuts the Ld column', () => {
    const wizard = getArmy('halflings')!.units.find((u) => u.id === 'hf-wizard')!
    const levels = (wizard.options ?? []).filter((o) => o.id.startsWith('wizard-l'))
    expect(levels.length, 'Halflings are restricted to levels 1 and 2').toBe(1)
    for (const level of levels) {
      expect(level.statLine, `${level.id} must not invent a profile`).toBeUndefined()
    }
  })
})

// OLD-36 — five gaps between the printed High Elf army list (1997 Altos Elfos,
// Spanish) and the data here. Page numbers in the comments are the PRINTED page
// (PDF = printed + 2). Book stat columns M / HA / HP / F / R / H / I / A / L map
// to M / WS / BS / S / T / W / I / A / Ld and Movement is converted from
// centimetres (10→4", 15→6", 20→8", 22→9"). Every statline is pinned in FULL so
// a later edit to one column cannot quietly drag the others with it.
describe('OLD-36 — High Elves army-list gaps', () => {
  const he = () => getArmy('high-elves')!
  const unit = (id: string) => {
    const u = he().units.find((x) => x.id === id)
    expect(u, `no unit ${id} in the High Elf list`).toBeDefined()
    return u!
  }
  // Every generic character whose mount list is PRINCE_MOUNTS ("un monstruo
  // elegido en la sección de Monstruos de esta lista", printed pp.73-74).
  const MONSTER_RIDERS = ['he-general', 'he-battle-standard', 'he-hero', 'he-mage']

  // --- 1. Ellyrian Reavers may buy shields (printed p.76) -------------------
  it('Ellyrian Reavers offer shields at +2 points per model (p.76)', () => {
    // "Opciones: Cualquier unidad puede equiparse con Escudos por un coste
    // adicional de +2 puntos por miniatura. Cualquier unidad puede equiparse con
    // Arcos por un coste adicional de +4 puntos por miniatura, y/o con Lanzas
    // por un coste adicional de +2 puntos por miniatura." (printed p.76)
    const reavers = unit('he-ellyrian-reavers')
    const shield = (reavers.options ?? []).find((o) => o.id === 'shield')
    expect(shield, 'Ellyrian Reavers must offer shields').toBeDefined()
    expect(shield!.pointsPerModel).toBe(2)
    expect(shield!.flat ?? false).toBe(false)
    // The two options the entry already had are untouched, at the book's rates.
    expect((reavers.options ?? []).find((o) => o.id === 'bows')!.pointsPerModel).toBe(4)
    expect((reavers.options ?? []).find((o) => o.id === 'cav-lance')!.pointsPerModel).toBe(2)
    // 5 Reavers at 25 + 2 shield each = 135; with bows and lances too: 5 × 33 = 165.
    expect(
      entryPoints({ id: 'e', unitId: 'he-ellyrian-reavers', size: 5, optionIds: ['shield'], magicItemIds: [] }, he()),
    ).toBe(135)
    expect(
      entryPoints(
        { id: 'e', unitId: 'he-ellyrian-reavers', size: 5, optionIds: ['shield', 'bows', 'cav-lance'], magicItemIds: [] },
        he(),
      ),
    ).toBe(165)
  })

  // --- 2. Basilisk and Chimera are legal character mounts (p.80 via p.73) ---
  const NEW_MOUNTS: Array<{ id: string; nameEs: string; points: number; stats: StatLine }> = [
    // "Basilisco … 150 puntos / Basilisco 10 3 0 4 4 2 4 3 6" (printed p.80).
    { id: 'mount-basilisk', nameEs: 'Basilisco', points: 150, stats: { M: 4, WS: 3, BS: 0, S: 4, T: 4, W: 2, I: 4, A: 3, Ld: 6 } },
    // "Quimera … 250 puntos / Quimera 15 4 0 7 6 6 4 6 8" (printed p.80).
    { id: 'mount-chimera', nameEs: 'Quimera', points: 250, stats: { M: 6, WS: 4, BS: 0, S: 7, T: 6, W: 6, I: 4, A: 6, Ld: 8 } },
  ]

  for (const m of NEW_MOUNTS) {
    it(`every generic character may ride the ${m.nameEs} at ${m.points} points (p.80)`, () => {
      for (const id of MONSTER_RIDERS) {
        const mount = (unit(id).mounts ?? []).find((x) => x.id === m.id)
        expect(mount, `${id} must offer ${m.id}`).toBeDefined()
        expect(mount!.points, `${id}: ${m.id} points`).toBe(m.points)
        expect(mount!.nameEs, `${id}: ${m.id} Spanish name`).toBe(m.nameEs)
        expect(mount!.statLine, `${id}: ${m.id} statline`).toEqual(m.stats)
      }
      // Riding it puts the monster's points on the character's entry.
      expect(
        entryPoints({ id: 'e', unitId: 'he-hero', size: 1, optionIds: [], mountId: m.id, magicItemIds: [] }, he()),
      ).toBe(104 + m.points)
    })
  }

  it('the monster mount list covers the whole printed MONSTRUOS section (p.80)', () => {
    // Printed p.80 lists exactly eleven monsters; a character may ride "un
    // monstruo elegido en la sección de Monstruos de esta lista" (p.73), so all
    // eleven must be offered — plus the Elven Steed (+3) and the Tiranoc
    // Chariot (+84), which are not monsters.
    const ids = (unit('he-general').mounts ?? []).map((m) => m.id).sort()
    expect(ids).toEqual([
      'mount-basilisk', 'mount-chimera', 'mount-dragon', 'mount-elven-steed',
      'mount-emperor-dragon', 'mount-great-dragon', 'mount-great-eagle', 'mount-griffon',
      'mount-hippogriff', 'mount-manticore', 'mount-pegasus', 'mount-tiranoc-chariot',
      'mount-unicorn',
    ])
  })

  // --- 3. Pegasus and Unicorn are monster UNITS too (printed p.80) ----------
  const NEW_MONSTERS: Array<{ id: string; nameEs: string; points: number; stats: StatLine }> = [
    // "Pegaso … 50 puntos / Pegaso 20 3 0 4 4 3 4 2 3" (printed p.80; 20cm → 8").
    { id: 'he-pegasus', nameEs: 'Pegaso', points: 50, stats: { M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 3 } },
    // "Unicornio … 90 puntos / Unicornio 22 5 0 4 4 3 4 2 9" (printed p.80; 22cm → 9").
    { id: 'he-unicorn', nameEs: 'Unicornio', points: 90, stats: { M: 9, WS: 5, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 9 } },
  ]

  for (const m of NEW_MONSTERS) {
    it(`the ${m.nameEs} can be fielded on its own — ${m.points} points, role monster (p.80)`, () => {
      const u = unit(m.id)
      expect(u.role).toBe('monster')
      expect(u.pointsPerModel).toBe(m.points)
      expect(u.nameEs).toBe(m.nameEs)
      expect(u.statLine).toEqual(m.stats)
      expect(u.isCharacter ?? false).toBe(false)
      // Fielded alone it is a monster, so it lands in the 0-25% monster cap.
      const entry = { id: '1', unitId: m.id, size: 1, optionIds: [], magicItemIds: [] }
      expect(entryPoints(entry, he())).toBe(m.points)
      expect(pointsByRole([entry], he()).monster).toBe(m.points)
    })
  }

  it('each monster that is also a mount prints the same row both ways (p.80)', () => {
    // The p.80 table is the single source for both, so the mount option and the
    // standalone unit must never drift apart.
    const PAIRS: Array<[string, string]> = [
      ['he-basilisk', 'mount-basilisk'],
      ['he-chimera', 'mount-chimera'],
      ['he-pegasus', 'mount-pegasus'],
      ['he-unicorn', 'mount-unicorn'],
      ['he-great-eagle', 'mount-great-eagle'],
      ['he-griffon', 'mount-griffon'],
      ['he-hippogriff', 'mount-hippogriff'],
      ['he-manticore', 'mount-manticore'],
      ['he-dragon', 'mount-dragon'],
      ['he-great-dragon', 'mount-great-dragon'],
      ['he-emperor-dragon', 'mount-emperor-dragon'],
    ]
    for (const [unitId, mountId] of PAIRS) {
      const mount = (unit('he-general').mounts ?? []).find((m) => m.id === mountId)!
      expect(mount.statLine, `${mountId} vs ${unitId}: statline`).toEqual(unit(unitId).statLine)
      expect(mount.points, `${mountId} vs ${unitId}: points`).toBe(unit(unitId).pointsPerModel)
    }
  })

  // --- 4. The Repeater Bolt Thrower's own row (printed p.79) ----------------
  it('the Repeater Bolt Thrower carries the machine profile T7 W3 (p.79)', () => {
    // "Lanzavirotes de Repetición  -  -  -  -  7  3  -  -  -" (printed p.79),
    // read against the "Dotación 12 4 4 3 3 1 6 1 8" row directly above it: the
    // 7 is under R (Toughness) and the 3 under H (Wounds); the F column is a
    // dash, so the machine has NO Strength. Concordant with printed p.56
    // ("MOVIMIENTO / RESISTENCIA / HERIDAS — Como su Dotación / 7 / 3").
    const bt = unit('he-bolt-thrower')
    expect(bt.profiles, 'the bolt thrower needs a machine profile').toBeDefined()
    expect(bt.profiles!).toHaveLength(1)
    const machine = bt.profiles![0]
    expect(machine.statLine).toEqual({ T: 7, W: 3 })
    expect(machine.statLine.S, 'the machine row prints a dash under F').toBeUndefined()
    expect(machine.nameEs, 'the machine profile needs a Spanish name').toBeTruthy()
    // The unit's own statLine stays the crew row ("Dotación", p.79).
    expect(bt.statLine).toEqual({ M: 5, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 8 })
  })

  // --- 5. The Shadow Warrior ratio cap (printed p.78) -----------------------
  // "El ejército Alto Elfo puede incluir tantos regimientos de Guerreros
  // Sombríos como regimientos de Lanceros y Arqueros incluya el ejército. Sin
  // embargo, esta restricción puede ignorarse cuando los Altos Elfos deban
  // enfrentarse a un ejército de Elfos Oscuros […]" (printed p.78).
  // The exception depends on the OPPOSING army, which this app does not model:
  // the ratio is enforced as a warning and the exception is carried by the
  // unit's bilingual rule line and its ⓘ glossary entry.
  const shadowRoster = (shadowRegiments: number, lancers: number, archers: number): Roster => ({
    id: 'r', name: 's', armyId: 'high-elves', pointsLimit: 3000,
    entries: [
      { id: 'g', unitId: 'he-general', size: 1, optionIds: [], magicItemIds: [], isGeneral: true },
      ...Array.from({ length: shadowRegiments }, (_, i) => ({
        id: `sw${i}`, unitId: 'he-shadow-warriors', size: 5, optionIds: [], magicItemIds: [],
      })),
      ...Array.from({ length: lancers }, (_, i) => ({
        id: `sp${i}`, unitId: 'he-spearmen', size: 10, optionIds: [], magicItemIds: [],
      })),
      ...Array.from({ length: archers }, (_, i) => ({
        id: `ar${i}`, unitId: 'he-archers', size: 10, optionIds: [], magicItemIds: [],
      })),
    ],
  })
  const ratioViolations = (r: Roster) =>
    validateRoster(r, he()).filter((v) => v.rule === 'unit-ratio-max' && /Shadow Warrior/.test(v.message))

  it('declares the Shadow Warrior cap against Lancer + Archer regiments only (p.78)', () => {
    const cap = (he().selectionRules?.ratioCaps ?? []).find((c) => c.unitId === 'he-shadow-warriors')
    expect(cap, 'the Shadow Warrior ratio cap must be declared').toBeDefined()
    // "Lanceros y Arqueros" — the Sea Guard appears in the bolt thrower's limit
    // (p.79), not in this one.
    expect(cap!.perUnit?.ids.slice().sort()).toEqual(['he-archers', 'he-spearmen'])
    expect(cap!.perUnit?.multiplier ?? 1).toBe(1)
    expect(cap!.perUnit?.minSize, 'the book sets no minimum regiment size here').toBeUndefined()
    expect(cap!.floor, 'the book grants no free minimum here').toBeUndefined()
    expect(cap!.absoluteMax).toBeUndefined()
    expect(cap!.labelEs).toBe('Regimientos de Guerreros Sombríos')
  })

  it('allows one Shadow Warrior regiment per Lancer/Archer regiment and warns past it', () => {
    expect(ratioViolations(shadowRoster(2, 1, 1)), '2 shadow vs 1+1').toEqual([])
    expect(ratioViolations(shadowRoster(3, 2, 1)), '3 shadow vs 2+1').toEqual([])
    const over = ratioViolations(shadowRoster(3, 1, 1))
    expect(over, '3 shadow vs 1+1 must be flagged').toHaveLength(1)
    expect(over[0].severity).toBe('warning')
    expect(over[0].message).toContain('only 2 allowed')
    // With no Lancers or Archers at all, no Shadow Warriors are allowed.
    expect(ratioViolations(shadowRoster(1, 0, 0)), '1 shadow vs nothing').toHaveLength(1)
  })

  it('states the Dark Elf exception the engine cannot model, in both languages', () => {
    const tag = 'Shadow Warrior regiments limited to the number of Lancer and Archer regiments (ignored against Dark Elves)'
    expect(unit('he-shadow-warriors').specialRules ?? []).toContain(tag)
    expect(RULE_PHRASE_ES[tag], `missing ES translation for "${tag}"`).toBeTruthy()
    expect(RULE_PHRASE_ES[tag]).toContain('Elfos Oscuros')
    // ⓘ glossary: findRule matches by substring, first match wins, and 'lance'
    // is a substring of "Lancer" — without its own entry ahead of the generic
    // weapon rules this tag would open the cavalry-lance article.
    const rule = findRule(tag)
    expect(rule?.id, 'the tag must resolve to its own glossary entry').toBe('shadow-warrior-ratio')
    expect(rule!.en).toContain('Dark Elf')
    expect(rule!.es).toContain('Elfos Oscuros')
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

// OLD-39, generalised by OLD-43 — a book may print a non-numeric token in ANY
// of the nine characteristic columns: a dice expression ("5D6", "1D6"), a range
// ("2-10", the artillery dice) or a word ("Especial"/"Sp"). `StatLine` is all
// `number` and stays that way (it runs through the whole rules engine, and none
// of these tokens affects points or validation), so the printed token rides in
// the display-only `statNotes`, which every renderer shows INSTEAD of the
// numeric value. The noted column is therefore ABSENT from `statLine` rather
// than carrying an invented number beside its note.
//
// This block pins the three chariot chassis (OLD-39's original scope); the
// OLD-43 block below pins the unit and mount rows, and the sweep that forbids
// an unpinned note lives there and covers all three houses.
const CHASSIS_DICE_ATTACKS: Array<{
  army: string
  unit: string
  profile: string
  profileEs: string
  page: string
  attacksToken: string
}> = [
    {
      // No Muertos, printed p.84 = PDF 86 (the identical row is reprinted on
      // printed p.68): "Carruaje Esquelético  -  -  -  5  5  3  1  1D6  -".
      army: 'undead', unit: 'ud-undead-chariot',
      profile: 'Chariot', profileEs: 'Carro',
      page: 'No Muertos printed p.84', attacksToken: '1D6',
    },
    {
      // No Muertos, printed p.91 = PDF 93:
      // "Carruaje de Arkhan  -  4  -  6  6  3  -  1D6  -".
      army: 'undead', unit: 'ud-arkhan-the-black',
      profile: 'Chariot of Arkhan', profileEs: 'Carro de Arkhan',
      page: 'No Muertos printed p.91', attacksToken: '1D6',
    },
    {
      // Elfos Oscuros, printed p.57 = PDF 59:
      // "Carruaje Negro  -  -  -  7  7  3  -  1D6+2  -".
      army: 'dark-elves', unit: 'de-witch-king',
      profile: 'Black Chariot', profileEs: 'Carruaje Negro',
      page: 'Elfos Oscuros printed p.57', attacksToken: '1D6+2',
    },
]

describe('OLD-39 — chariot chassis print the book\'s dice Attacks', () => {
  for (const row of CHASSIS_DICE_ATTACKS) {
    it(`${row.unit} — ${row.profile} prints A ${row.attacksToken} (${row.page})`, () => {
      const unit = getArmy(row.army)!.units.find((u) => u.id === row.unit)
      expect(unit, `${row.army}: no unit ${row.unit}`).toBeDefined()
      const chassis = (unit!.profiles ?? []).find((p) => p.name === row.profile)
      expect(chassis, `${row.unit}: no "${row.profile}" profile`).toBeDefined()
      expect(chassis!.statNotes?.A).toBe(row.attacksToken)
      // The note REPLACES the numeric A — it must never be invented alongside it.
      expect(chassis!.statLine.A, `${row.unit} chassis A`).toBeUndefined()
      // Display profiles are bilingual.
      expect(chassis!.nameEs).toBe(row.profileEs)
    })
  }

  // The Witch King had no `profiles` array at all, so the chariot he always
  // rides and its draught team were invisible. Elfos Oscuros printed p.57:
  //   "Carruaje Negro  -  -  -  7  7  3  -  1D6+2  -"
  //   "Gélido          20  3  0  4  4  1  4  2     3"   (M 20cm → 8")
  it('de-witch-king carries the Black Chariot and its 2 Cold Ones (printed p.57)', () => {
    const wk = getArmy('dark-elves')!.units.find((u) => u.id === 'de-witch-king')!
    expect(wk.profiles?.map((p) => p.name)).toEqual(['Black Chariot', '2 Cold Ones'])

    const chariot = wk.profiles!.find((p) => p.name === 'Black Chariot')!
    // M/WS/BS/I/Ld are printed "-" and must stay absent, not be invented.
    expect(chariot.statLine).toEqual({ S: 7, T: 7, W: 3 })

    const coldOnes = wk.profiles!.find((p) => p.name === '2 Cold Ones')!
    expect(coldOnes.statLine).toEqual({ M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 4, A: 2, Ld: 3 })
    expect(coldOnes.nameEs).toBe('2 Gélidos')
  })

})

// OLD-43 — six unit rows and one mount row printed a book TOKEN where this
// repo had stored an invented number. OLD-39's field (ProfileBlock-only,
// Attacks-only) is replaced by `statNotes`, which reaches all three houses — a
// unit's own statLine, a MountOption's, and a ProfileBlock's — and any of the
// nine columns.
//
// Every value below was read off a 400dpi scan of the page named in the test.
describe('OLD-43 — units and mounts print the book\'s own token', () => {
  type NotedRow = {
    army: string
    unit: string
    /** Set for a row that belongs to one of the unit's mounts, not the unit. */
    mount?: string
    column: keyof StatLine
    page: string
    /** The English rendering (`statNotes`). */
    token: string
    /** The Spanish override (`statNotesEs`), when the token is a word. */
    tokenEs?: string
  }

  const NOTED: NotedRow[] = [
    // A — Reino del Caos printed p.85 = PDF 87:
    //   "Bestia de Nurgle  8  3  0  3  5  3  3  1D6  6"
    // Rules text: "Las Bestias pueden efectuar 1D6 ataques".
    { army: 'chaos', unit: 'ch-beasts-of-nurgle', column: 'A', token: '1D6', page: 'Reino del Caos printed p.85' },
    // …and the same printed row, ridden as a mount.
    {
      army: 'chaos', unit: 'ch-lord', mount: 'mount-beast-of-nurgle',
      column: 'A', token: '1D6', page: 'Reino del Caos printed p.85',
    },

    // B — Reino del Caos printed p.90 = PDF 92:
    //   "Engendro del Caos  5D6  3  0  4  5  3  3  1D6  10"
    // Rules text: "un atributo de movimiento de 5D6 centímetros" and "pueden
    // efectuar 1D6 ataques". The cm suffix is deliberate: a dice expression
    // cannot be converted to the inches used everywhere else.
    { army: 'chaos', unit: 'ch-chaos-spawn', column: 'M', token: '5D6cm', page: 'Reino del Caos printed p.90' },
    { army: 'chaos', unit: 'ch-chaos-spawn', column: 'A', token: '1D6', page: 'Reino del Caos printed p.90' },

    // C — Orcos y Goblins bestiary printed p.66 = PDF 68, headers M HA HP F R H I A L:
    //   "Goblin Fanático  5D6  Especial  5  3  1  -  1D3  -"
    // "Especial" spans the HA/HP pair (HA = Especial, HP blank).
    // M is 5D6 CENTIMETRES ("el equivalente del resultado en centímetros").
    { army: 'orcs-and-goblins', unit: 'og-night-goblin-fanatics', column: 'M', token: '5D6cm', page: 'O&G printed p.66' },
    {
      army: 'orcs-and-goblins', unit: 'og-night-goblin-fanatics',
      column: 'WS', token: 'Special', tokenEs: 'Especial', page: 'O&G printed p.66',
    },
    { army: 'orcs-and-goblins', unit: 'og-night-goblin-fanatics', column: 'BS', token: '–', page: 'O&G printed p.66' },
    { army: 'orcs-and-goblins', unit: 'og-night-goblin-fanatics', column: 'I', token: '–', page: 'O&G printed p.66' },
    { army: 'orcs-and-goblins', unit: 'og-night-goblin-fanatics', column: 'Ld', token: '–', page: 'O&G printed p.66' },
    // Attacks is the one cell the book contradicts itself on: the bestiary row
    // above prints 1D3, the army list prints 1D6. OLD-45 settled it in favour
    // of the ARMY LIST, so this row cites p.85 and not p.66 like its siblings.
    // See the dedicated test below for the scope of that ruling.
    { army: 'orcs-and-goblins', unit: 'og-night-goblin-fanatics', column: 'A', token: '1D6', page: 'O&G army list printed p.85 = PDF 87' },

    // D — Halflings bestiary printed p.7 = PDF 5:
    //   "Crazed Cook  2D6  Sp  0  5  2  1  -  D6  -"
    // The printed-12 copy of this row has its Ld clipped by the scan edge; the
    // bestiary copy on printed p.7 prints it legibly as a blank.
    // English book: Movement is ALREADY in inches, so 2D6" and not 2D6cm.
    { army: 'halflings', unit: 'hf-crazed-cooks', column: 'M', token: '2D6"', page: 'Halflings printed p.7' },
    {
      army: 'halflings', unit: 'hf-crazed-cooks',
      column: 'WS', token: 'Sp', tokenEs: 'Esp', page: 'Halflings printed p.7',
    },
    { army: 'halflings', unit: 'hf-crazed-cooks', column: 'I', token: '–', page: 'Halflings printed p.7' },
    { army: 'halflings', unit: 'hf-crazed-cooks', column: 'A', token: 'D6', page: 'Halflings printed p.7' },
    { army: 'halflings', unit: 'hf-crazed-cooks', column: 'Ld', token: '–', page: 'Halflings printed p.7' },

    // E — Norsca. M and A are identical in all three printings of this profile
    // (bestiary PDF 22, the Citadel Journal 7 revision PDF 14, army list PDF 25).
    // "2-10" is the artillery dice (2/4/6/8/10/Misfire) — a RANGE, not a dice
    // expression, which is why the field holds a free token and not a dice shape.
    { army: 'norse', unit: 'no-berserkers', column: 'M', token: '2D6"', page: 'Norsca PDF 22/14/25' },
    { army: 'norse', unit: 'no-berserkers', column: 'A', token: '2-10', page: 'Norsca PDF 22/14/25' },

    // F — Norsca PDF 33 (printed p.21, "NORSE SPECIAL CHARACTERS"):
    //   "The Ravenswyrd  2D6  6  0  4  4  1  4  2-10  10"
    { army: 'norse', unit: 'no-ravenswyrd', column: 'M', token: '2D6"', page: 'Norsca PDF 33' },
    { army: 'norse', unit: 'no-ravenswyrd', column: 'A', token: '2-10', page: 'Norsca PDF 33' },
  ]

  /** The statNotes / statLine pair a row addresses: the unit's, or its mount's. */
  const sourceOf = (row: NotedRow) => {
    const unit = getArmy(row.army)!.units.find((u) => u.id === row.unit)
    expect(unit, `${row.army}: no unit ${row.unit}`).toBeDefined()
    if (!row.mount) return unit!
    const mount = (unit!.mounts ?? []).find((m) => m.id === row.mount)
    expect(mount, `${row.unit}: no mount ${row.mount}`).toBeDefined()
    return mount!
  }

  for (const row of NOTED) {
    const who = row.mount ? `${row.unit}/${row.mount}` : row.unit
    it(`${who} prints ${row.column} as "${row.token}" (${row.page})`, () => {
      const src = sourceOf(row)
      expect(src.statNotes?.[row.column]).toBe(row.token)
      // A note REPLACES the number — the column must not also hold an invented one.
      expect(src.statLine?.[row.column], `${who} statLine.${row.column}`).toBeUndefined()
      if (row.tokenEs) expect(src.statNotesEs?.[row.column]).toBe(row.tokenEs)
      else expect(src.statNotesEs?.[row.column]).toBeUndefined()
    })
  }

  // The invented numbers this issue removes. Stated positively above and
  // negatively here, so a regression that re-adds one fails loudly.
  it('the invented numbers are gone from the six unit statLines', () => {
    const u = (armyId: string, id: string) => getArmy(armyId)!.units.find((x) => x.id === id)!

    const spawn = u('chaos', 'ch-chaos-spawn')
    expect(spawn.statLine).not.toHaveProperty('M') // was 4
    expect(spawn.statLine).not.toHaveProperty('A') // was 1
    expect(spawn.statLine).toEqual({ WS: 3, BS: 0, S: 4, T: 5, W: 3, I: 3, Ld: 10 })

    const beasts = u('chaos', 'ch-beasts-of-nurgle')
    expect(beasts.statLine).not.toHaveProperty('A') // was 1 (the statline() default was 2)
    expect(beasts.statLine).toEqual({ M: 3, WS: 3, BS: 0, S: 3, T: 5, W: 3, I: 3, Ld: 6 })

    const fanatics = u('orcs-and-goblins', 'og-night-goblin-fanatics')
    for (const k of ['M', 'WS', 'BS', 'I', 'Ld'] as const) {
      expect(fanatics.statLine, `fanatics still has ${k}`).not.toHaveProperty(k)
    }

    const cooks = u('halflings', 'hf-crazed-cooks')
    for (const k of ['M', 'WS', 'I', 'A', 'Ld'] as const) {
      expect(cooks.statLine, `crazed cooks still has ${k}`).not.toHaveProperty(k)
    }
    expect(cooks.statLine).toEqual({ BS: 0, S: 5, T: 2, W: 1 })

    for (const id of ['no-berserkers', 'no-ravenswyrd']) {
      const norse = u('norse', id)
      expect(norse.statLine, `${id} still has M`).not.toHaveProperty('M') // was 7
      expect(norse.statLine, `${id} still has A`).not.toHaveProperty('A') // was 6
    }
  })

  // The book contradicts itself on the Fanatic's Attacks: the bestiary row
  // (printed p.66 = PDF 68) prints 1D3, the army list (printed p.85 = PDF 87)
  // prints 1D6. Both were read at 400dpi and both are legible, so this is the
  // book disagreeing with itself rather than a bad scan.
  //
  // OLD-45 — the owner settled it for the ARMY LIST: A is 1D6. The column held
  // "?" while the case was open, which in turn replaced an invented A: 1 that
  // was wrong under both readings.
  //
  // The ruling is scoped to THIS row. Bestiary-vs-army-list conflicts are
  // decided case by case and never by precedent, so neither the Norsca note in
  // source/OFFSETS.md (list wins) nor the Wood Elf wizard ruling (list wins,
  // bestiary progression rejected) decided this one — and this one decides
  // nothing else either.
  //
  // Pinned because the losing reading sits nineteen pages away in the same
  // book: a later pass reading only the bestiary could "correct" it to 1D3.
  it('og-night-goblin-fanatics prints A as "1D6" — the army list wins (OLD-45)', () => {
    const fanatics = getArmy('orcs-and-goblins')!.units.find((u) => u.id === 'og-night-goblin-fanatics')!
    expect(fanatics.statLine).not.toHaveProperty('A')
    expect(fanatics.statNotes?.A).toBe('1D6')
    // Not the bestiary's 1D3, and not the "?" it showed while the case was open.
    expect(fanatics.statNotes?.A).not.toBe('1D3')
    expect(fanatics.statNotes?.A).not.toBe('?')
  })

  // The Berserker's WS/T/I/Ld disagree between printings of its own row. That is
  // a separate finding, explicitly out of scope here — pinned so this change is
  // provably confined to M and A.
  it('no-berserkers keeps every other column exactly as it was (out of scope)', () => {
    const berserkers = getArmy('norse')!.units.find((u) => u.id === 'no-berserkers')!
    expect(berserkers.statLine).toEqual({ WS: 6, BS: 0, S: 4, T: 4, W: 1, I: 4, Ld: 10 })
  })

  it('no-ravenswyrd keeps the seven columns that already matched the book (PDF 33)', () => {
    const rw = getArmy('norse')!.units.find((u) => u.id === 'no-ravenswyrd')!
    expect(rw.statLine).toEqual({ WS: 6, BS: 0, S: 4, T: 4, W: 1, I: 4, Ld: 10 })
    // His companion "The Raven" (12 - 0 4 4 2 5 - 10) was already correct: WS
    // and A are printed "-" and render "–" with no note.
    const raven = rw.profiles!.find((p) => p.name === 'The Raven')!
    expect(raven.statLine).toEqual({ M: 12, BS: 0, S: 4, T: 4, W: 2, I: 5, Ld: 10 })
    expect(raven.statNotes).toBeUndefined()
  })

  it('no unit, mount or profile in any army invents an unpinned stat note', () => {
    // Only rows actually read off a scan may carry one — a note without a
    // citation in a table above is a transcription that never happened.
    // A MountOption object is shared by every character offered that mount (the
    // Beast of Nurgle rides under five different Chaos characters), so a mount
    // row is pinned by its own id rather than by the unit it hangs off.
    const pinned = new Set<string>([
      ...CHASSIS_DICE_ATTACKS.map((r) => `${r.unit}/${r.profile}/A`),
      ...NOTED.map((r) => `${r.mount ?? r.unit}/${r.column}`),
    ])
    const check = (key: string, notes?: Record<string, string>) => {
      for (const column of Object.keys(notes ?? {})) {
        expect(pinned.has(`${key}/${column}`), `unpinned stat note on ${key}/${column}`).toBe(true)
      }
    }
    for (const army of ARMIES) {
      for (const unit of army.units) {
        check(unit.id, unit.statNotes)
        check(unit.id, unit.statNotesEs)
        for (const m of unit.mounts ?? []) {
          check(m.id, m.statNotes)
          check(m.id, m.statNotesEs)
        }
        const blocks = [
          ...(unit.profiles ?? []),
          ...(unit.mount ? [unit.mount] : []),
          ...(unit.mounts ?? []).flatMap((m) => m.profiles ?? []),
        ]
        for (const p of blocks) {
          check(`${unit.id}/${p.name}`, p.statNotes)
          check(`${unit.id}/${p.name}`, p.statNotesEs)
        }
      }
    }
  })
})

describe('OLD-38 — the two parked chariot chassis match the book', () => {
  // Reino del Caos printed p.104 = PDF 106, "CARRUAJES DEL CAOS": a single
  // entry prints ONE chassis row ("Carruaje - - - 7 7 3 1 - -") that governs
  // BOTH the Chaos Chariot (crew of 2 Chaos Warriors, drawn by 2 Chaos Steeds,
  // 122 pts) and the Marauder Chariot (crew of 2 Marauders, drawn by 2 War
  // Horses, 80 pts) — one printed chassis, two crew/draught options.
  it('ch-chariot and ch-marauder-chariot share the printed p.104 chassis (S7 T7 W3 I1)', () => {
    const chaos = getArmy('chaos')!

    const chariot = chaos.units.find((u) => u.id === 'ch-chariot')!
    const chariotChassis = chariot.profiles!.find((p) => p.name === 'Chariot')!
    expect(chariotChassis.statLine).toEqual({ S: 7, T: 7, W: 3, I: 1 })

    const marauderChariot = chaos.units.find((u) => u.id === 'ch-marauder-chariot')!
    const marauderChassis = marauderChariot.profiles!.find((p) => p.name === 'Chariot')!
    expect(marauderChassis.statLine).toEqual({ S: 7, T: 7, W: 3, I: 1 })

    // Same printed row → the two chassis objects must be identical.
    expect(marauderChassis.statLine).toEqual(chariotChassis.statLine)
  })

  // 1996 Elfos Silvanos printed p.66 = PDF 68 (repeated p.81 = PDF 83):
  //   "Carruaje de Guerra  -  -  -  -  7  3  -  -  -"
  // Only R(T) and H(W) are printed; F(S), I, A and L are all dashes — unlike
  // every other chariot chassis in this repo. Do NOT pattern-match this to
  // the S7/I1 chassis used elsewhere: adding an S or an I here would invent a
  // game value that is not on the page.
  it('we-war-chariot chassis is T7 W3 ONLY — no Strength, no Initiative (printed p.66/p.81)', () => {
    const woodElves = getArmy('wood-elves')!
    const chariot = woodElves.units.find((u) => u.id === 'we-war-chariot')!
    const chassis = chariot.profiles!.find((p) => p.name === 'Chariot')!

    expect(chassis.statLine).toEqual({ T: 7, W: 3 })
    expect(chassis.statLine).not.toHaveProperty('S')
    expect(chassis.statLine).not.toHaveProperty('I')
  })
})
