import { describe, it, expect } from 'vitest'
import { validateRoster } from './validate'
import { STANDARD_5E_COMPOSITION, type Army, type Roster, type RosterEntry } from '../data/types'
import { getArmy } from '../data/armies'

// ---- Fixture army -------------------------------------------------------
const army: Army = {
  id: 'test',
  name: 'Test Army',
  composition: STANDARD_5E_COMPOSITION,
  magicItems: [
    { id: 'sword', name: 'Magic Sword', category: 'weapon', points: 25 },
    { id: 'sword2', name: 'Other Sword', category: 'weapon', points: 20 },
    { id: 'armour', name: 'Magic Armour', category: 'armour', points: 25 },
    { id: 'talisman', name: 'Lucky Charm', category: 'talisman', points: 15 },
    { id: 'banner', name: 'War Banner', category: 'banner', points: 25 },
  ],
  units: [
    {
      id: 'lord',
      name: 'General',
      role: 'character',
      pointsPerModel: 100,
      isCharacter: true,
      characterRank: 'lord', // 3 magic items
      canBeGeneral: true,
    },
    {
      id: 'hero',
      name: 'Captain',
      role: 'character',
      pointsPerModel: 50,
      isCharacter: true,
      characterRank: 'hero', // 2 magic items
      canBeGeneral: true,
    },
    {
      id: 'warriors',
      name: 'Warriors',
      role: 'regiment',
      pointsPerModel: 5,
      minSize: 10,
      maxSize: 30,
      options: [{ id: 'shield', name: 'Shield', pointsPerModel: 1 }],
    },
    {
      id: 'cannon',
      name: 'Cannon',
      role: 'warmachine',
      pointsPerModel: 100,
      max: 1, // 0-1
    },
    {
      id: 'giant',
      name: 'Giant',
      role: 'monster',
      pointsPerModel: 200,
    },
    {
      id: 'chariot',
      name: 'War Chariot',
      role: 'chariot',
      pointsPerModel: 90,
    },
  ],
}

function roster(pointsLimit: number, entries: RosterEntry[]): Roster {
  return { id: 'r', name: 'List', armyId: 'test', pointsLimit, entries }
}

function entry(over: Partial<RosterEntry> & { unitId: string }): RosterEntry {
  return {
    id: over.id ?? Math.random().toString(36).slice(2),
    size: 1,
    optionIds: [],
    magicItemIds: [],
    ...over,
  }
}

const rules = (vs: ReturnType<typeof validateRoster>) => vs.map((v) => v.rule)

// ---- Tests --------------------------------------------------------------
describe('validateRoster — points limit', () => {
  it('errors when total points exceed the limit', () => {
    const r = roster(100, [entry({ unitId: 'warriors', size: 30 })]) // 150 pts
    const v = validateRoster(r, army)
    expect(rules(v)).toContain('points-over')
    expect(v.find((x) => x.rule === 'points-over')!.severity).toBe('error')
  })

  it('does not error when within the limit', () => {
    const r = roster(1000, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'warriors', size: 20 }), // 100 pts -> regiments ok (>=25%? no, but separate test)
    ])
    const v = validateRoster(r, army)
    expect(rules(v)).not.toContain('points-over')
  })
})

describe('validateRoster — general', () => {
  it('errors when no general is selected', () => {
    const r = roster(1000, [entry({ unitId: 'warriors', size: 20 })])
    expect(rules(validateRoster(r, army))).toContain('no-general')
  })

  it('errors when more than one general is selected', () => {
    const r = roster(1000, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'hero', isGeneral: true }),
    ])
    expect(rules(validateRoster(r, army))).toContain('multiple-generals')
  })

  it('passes with exactly one valid general', () => {
    const r = roster(1000, [entry({ unitId: 'lord', isGeneral: true })])
    const rs = rules(validateRoster(r, army))
    expect(rs).not.toContain('no-general')
    expect(rs).not.toContain('multiple-generals')
  })

  it('errors when a non-character is made the General', () => {
    const r = roster(1000, [entry({ unitId: 'warriors', size: 20, isGeneral: true })])
    expect(rules(validateRoster(r, army))).toContain('invalid-general')
  })
})

describe('validateRoster — character percentage', () => {
  it('warns when characters exceed 50% of the points limit', () => {
    // 1000 pt limit, two lords = 200... not enough. Use limit 300, lord 100 + hero 50 = 150 = 50% exactly ok.
    // Push over: limit 300, lord(100)+lord(100)=200 (66%) general one of them.
    const r = roster(300, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'lord' }),
    ])
    expect(rules(validateRoster(r, army))).toContain('characters-over')
  })

  it('does not warn at exactly 50%', () => {
    const r = roster(200, [entry({ unitId: 'lord', isGeneral: true })]) // 100 = 50%
    expect(rules(validateRoster(r, army))).not.toContain('characters-over')
  })
})

describe('validateRoster — minimum regiments', () => {
  it('warns when regiments are below 25% of the limit', () => {
    // limit 1000, only a lord (100 chars) + 1 cannon -> 0 regiments
    const r = roster(1000, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'cannon' }),
    ])
    expect(rules(validateRoster(r, army))).toContain('regiments-min')
  })

  it('does not warn when regiments meet 25%', () => {
    const r = roster(1000, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'warriors', size: 30 }), // 150... need >=250
      entry({ unitId: 'warriors', size: 30 }),
    ]) // 300 regiment pts >= 250
    expect(rules(validateRoster(r, army))).not.toContain('regiments-min')
  })
})

describe('validateRoster — separate war-machine and monster caps', () => {
  it('warns when war machines (incl. chariots) exceed 25% of the limit', () => {
    // limit 1000: cannon(100) + chariot x2(180) = 280 in the war-machine bucket > 250
    const r = roster(1000, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'warriors', size: 30 }),
      entry({ unitId: 'cannon' }),
      entry({ unitId: 'chariot' }),
      entry({ unitId: 'chariot' }),
    ])
    const got = rules(validateRoster(r, army))
    expect(got).toContain('warmachines-over')
    expect(got).not.toContain('monsters-over')
  })

  it('warns when monsters exceed 25% of the limit', () => {
    // limit 1000: giant x2 = 400 monster pts > 250
    const r = roster(1000, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'warriors', size: 30 }),
      entry({ unitId: 'giant' }),
      entry({ unitId: 'giant' }),
    ])
    const got = rules(validateRoster(r, army))
    expect(got).toContain('monsters-over')
    expect(got).not.toContain('warmachines-over')
  })

  it('does NOT warn when machines and monsters are each under 25%, even if combined over', () => {
    // cannon(100)=10% and giant(200)=20%: combined 30% but each under its own 25% cap
    const r = roster(1000, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'warriors', size: 30 }),
      entry({ unitId: 'cannon' }),
      entry({ unitId: 'giant' }),
    ])
    const got = rules(validateRoster(r, army))
    expect(got).not.toContain('warmachines-over')
    expect(got).not.toContain('monsters-over')
  })
})

describe('validateRoster — unit availability (0-X) and size', () => {
  it('warns when a 0-1 unit appears more than once', () => {
    const r = roster(2000, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'cannon' }),
      entry({ unitId: 'cannon' }),
    ])
    expect(rules(validateRoster(r, army))).toContain('unit-max')
  })

  it('warns when a regiment is below its minimum size', () => {
    const r = roster(2000, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'warriors', size: 5 }), // min 10
    ])
    expect(rules(validateRoster(r, army))).toContain('min-size')
  })

  it('warns when a unit exceeds its maximum size', () => {
    const r = roster(2000, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'warriors', size: 40 }), // max 30
    ])
    expect(rules(validateRoster(r, army))).toContain('max-size')
  })
})

describe('validateRoster — magic items', () => {
  it('warns when a character carries more items than its rank allows', () => {
    // hero allows 2; give 3
    const r = roster(2000, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'hero', magicItemIds: ['sword', 'armour', 'talisman'] }),
    ])
    expect(rules(validateRoster(r, army))).toContain('magic-items-count')
  })

  it('warns when a character carries two items of a restricted category', () => {
    // two weapons
    const r = roster(2000, [
      entry({ unitId: 'lord', isGeneral: true, magicItemIds: ['sword', 'sword2'] }),
    ])
    expect(rules(validateRoster(r, army))).toContain('magic-items-category')
  })

  it('errors when a non-character carries magic items', () => {
    const r = roster(2000, [
      entry({ unitId: 'lord', isGeneral: true }),
      entry({ unitId: 'warriors', size: 20, magicItemIds: ['sword'] }),
    ])
    expect(rules(validateRoster(r, army))).toContain('magic-items-noncharacter')
  })

  it('passes for a legal character loadout', () => {
    const r = roster(2000, [
      entry({ unitId: 'lord', isGeneral: true, magicItemIds: ['sword', 'armour', 'talisman'] }),
    ])
    const rs = rules(validateRoster(r, army))
    expect(rs).not.toContain('magic-items-count')
    expect(rs).not.toContain('magic-items-category')
    expect(rs).not.toContain('magic-items-noncharacter')
  })
})

describe('magic banners require a BSB (magic-items-banner-bsb)', () => {
  // FAQ v2.20 §23.2: only a Battle Standard Bearer may carry a magic banner.
  // `mi-battle-standard` is a COMMON banner item available to every army.
  const empire = getArmy('empire')!
  const banner = 'mi-battle-standard'
  // A normal (non-BSB) character that can carry magic items.
  const generalUnit = empire.units.find((u) => u.canBeGeneral && u.isCharacter)!.id
  const bsbUnit = 'emp-battle-standard'

  const ros = (entries: RosterEntry[]): Roster => ({
    id: 'r',
    name: 't',
    armyId: 'empire',
    pointsLimit: 3000,
    entries,
  })
  const ch = (id: string, unitId: string, over: Partial<RosterEntry> = {}): RosterEntry => ({
    id,
    unitId,
    size: 1,
    optionIds: [],
    magicItemIds: [banner],
    ...over,
  })

  it('warns when a non-BSB character carries a magic banner', () => {
    const r = ros([ch('c1', generalUnit, { isGeneral: true })])
    const banners = validateRoster(r, empire).filter((v) => v.rule === 'magic-items-banner-bsb')
    expect(banners.length).toBe(1)
  })

  it('allows a magic banner on a dedicated battle-standard unit (unit.isBSB)', () => {
    const r = ros([
      ch('gen', generalUnit, { isGeneral: true, magicItemIds: [] }),
      ch('bsb', bsbUnit),
    ])
    const banners = validateRoster(r, empire).filter((v) => v.rule === 'magic-items-banner-bsb')
    expect(banners.length).toBe(0)
  })

  it('allows a magic banner on a character flagged as BSB (entry.isBSB)', () => {
    const r = ros([ch('c1', generalUnit, { isGeneral: true, isBSB: true })])
    const banners = validateRoster(r, empire).filter((v) => v.rule === 'magic-items-banner-bsb')
    expect(banners.length).toBe(0)
  })
})

describe('validateRoster — clean list', () => {
  it('produces no violations for a legal 1000pt list', () => {
    const r = roster(1000, [
      entry({ unitId: 'lord', isGeneral: true, magicItemIds: ['sword'] }), // 125 chars (<=500)
      entry({ unitId: 'warriors', size: 30 }), // 150
      entry({ unitId: 'warriors', size: 30 }), // 150  -> 300 regiments >=250
    ])
    expect(validateRoster(r, army)).toEqual([])
  })
})

describe('unit group caps (unit-group-max)', () => {
  const ros = (armyId: string, entries: RosterEntry[]): Roster => ({ id: 'r', name: 't', armyId, pointsLimit: 2000, entries })
  const ch = (id: string, unitId: string): RosterEntry => ({ id, unitId, size: 1, optionIds: [], magicItemIds: [] })
  const groupViolations = (r: Roster, army: Army) =>
    validateRoster(r, army).filter((v) => v.rule === 'unit-group-max')

  it('Dwarfs: a runesmith + a master runesmith together → one warning', () => {
    const dwarfs = getArmy('dwarfs')!
    const r = ros('dwarfs', [ch('a', 'dw-runesmith'), ch('b', 'dw-master-runesmith')])
    const vs = groupViolations(r, dwarfs)
    expect(vs).toHaveLength(1)
    expect(vs[0].severity).toBe('warning')
  })

  it('Dwarfs: a single runesmith → no warning', () => {
    const dwarfs = getArmy('dwarfs')!
    const r = ros('dwarfs', [ch('a', 'dw-runesmith')])
    expect(groupViolations(r, dwarfs)).toHaveLength(0)
  })

  it('Vampire Counts: a vampire BSB + a wight BSB together → one warning', () => {
    const vc = getArmy('vampire-counts')!
    const r = ros('vampire-counts', [ch('a', 'vc-vampire-bsb'), ch('b', 'vc-wight-bsb')])
    expect(groupViolations(r, vc)).toHaveLength(1)
  })

  it('Vampire Counts: a single vampire BSB → no warning', () => {
    const vc = getArmy('vampire-counts')!
    const r = ros('vampire-counts', [ch('a', 'vc-vampire-bsb')])
    expect(groupViolations(r, vc)).toHaveLength(0)
  })
})

describe('magic-item uniqueness', () => {
  const empire = getArmy('empire')!
  const empChar = empire.units.find((u) => u.isCharacter)!.id
  const chaos = getArmy('chaos')!
  const chaosChar = chaos.units.find((u) => u.isCharacter)!.id
  const uniqueViolations = (r: Roster, army = empire) =>
    validateRoster(r, army).filter((v) => v.rule === 'magic-items-unique')
  const ros = (armyId: string, entries: RosterEntry[]): Roster => ({ id: 'r', name: 't', armyId, pointsLimit: 2000, entries })
  const ch = (id: string, unitId: string, items: string[]): RosterEntry => ({ id, unitId, size: 1, optionIds: [], magicItemIds: items })

  it('flags the same normal item carried by two characters', () => {
    const r = ros('empire', [ch('a', empChar, ['mi-sword-of-strength']), ch('b', empChar, ['mi-sword-of-strength'])])
    expect(uniqueViolations(r)).toHaveLength(1)
    expect(uniqueViolations(r)[0].severity).toBe('error')
  })
  it('allows two Dispel Scrolls', () => {
    const r = ros('empire', [ch('a', empChar, ['mi-dispel-scroll']), ch('b', empChar, ['mi-dispel-scroll'])])
    expect(uniqueViolations(r)).toHaveLength(0)
  })
  it('allows two Familiars', () => {
    const r = ros('empire', [ch('a', empChar, ['mi-power-familiar']), ch('b', empChar, ['mi-power-familiar'])])
    expect(uniqueViolations(r)).toHaveLength(0)
  })
  it('allows two Chaos Armours', () => {
    const r = ros('chaos', [ch('a', chaosChar, ['mi-chaos-armour']), ch('b', chaosChar, ['mi-chaos-armour'])])
    expect(uniqueViolations(r, chaos)).toHaveLength(0)
  })
  it('mixed: one normal dup + one dispel-scroll dup → exactly one violation', () => {
    const r = ros('empire', [ch('a', empChar, ['mi-sword-of-strength', 'mi-dispel-scroll']), ch('b', empChar, ['mi-sword-of-strength', 'mi-dispel-scroll'])])
    expect(uniqueViolations(r)).toHaveLength(1)
  })
  it('clean roster → no violation', () => {
    const r = ros('empire', [ch('a', empChar, ['mi-sword-of-strength']), ch('b', empChar, ['mi-dispel-scroll'])])
    expect(uniqueViolations(r)).toHaveLength(0)
  })
  // FAQ v2.20 §19.3: Power/Destroy scrolls + Healing/Strength potions are "unlimited"...
  it('allows two Power Scrolls', () => {
    const r = ros('empire', [ch('a', empChar, ['mi-power-scroll']), ch('b', empChar, ['mi-power-scroll'])])
    expect(uniqueViolations(r)).toHaveLength(0)
  })
  it('allows two Healing Potions', () => {
    const r = ros('empire', [ch('a', empChar, ['mi-healing-potion']), ch('b', empChar, ['mi-healing-potion'])])
    expect(uniqueViolations(r)).toHaveLength(0)
  })
  // ...but every OTHER scroll stays unique (e.g. the Skaven Warp Storm Scroll).
  it('still flags two Warp Storm Scrolls (non-exception scroll)', () => {
    const skaven = getArmy('skaven')!
    const skChar = skaven.units.find((u) => u.isCharacter)!.id
    const r = ros('skaven', [ch('a', skChar, ['mi-warp-storm-scroll']), ch('b', skChar, ['mi-warp-storm-scroll'])])
    expect(uniqueViolations(r, skaven)).toHaveLength(1)
  })
})

// FAQ v2.20 §19.5: at most one crown and one helm per character (one of each is fine).
describe('crown/helm exclusivity (magic-items-exclusive-group)', () => {
  const empire = getArmy('empire')!
  const lord = empire.units.find((u) => u.isCharacter && u.characterRank === 'lord')!.id
  const groupViolations = (items: string[]) =>
    validateRoster(
      { id: 'r', name: 't', armyId: 'empire', pointsLimit: 2000, entries: [
        { id: 'a', unitId: lord, size: 1, optionIds: [], magicItemIds: items, isGeneral: true },
      ] },
      empire,
    ).filter((v) => v.rule === 'magic-items-exclusive-group')

  it('flags two crowns on one character', () => {
    expect(groupViolations(['mi-crown-of-sorcery', 'mi-crown-of-power'])).toHaveLength(1)
  })
  it('flags two helms on one character', () => {
    expect(groupViolations(['mi-dragon-helm', 'mi-golden-crown-of-atrazar'])).toHaveLength(1)
  })
  it('allows one crown plus one helm', () => {
    expect(groupViolations(['mi-crown-of-power', 'mi-dragon-helm'])).toHaveLength(0)
  })
  it('allows a single crown', () => {
    expect(groupViolations(['mi-crown-of-sorcery'])).toHaveLength(0)
  })
})

// Reino del Caos p.56: a model may bear only one Mark of Chaos (the four marks
// share exclusiveGroup 'mark'). Validated as options-exclusive-group.
describe('one Mark of Chaos per model (options-exclusive-group)', () => {
  const chaos = getArmy('chaos')!
  // A generic Chaos character that offers all four marks as options.
  const lord = chaos.units.find((u) => (u.options ?? []).some((o) => o.exclusiveGroup === 'mark'))!.id
  const markViolations = (optionIds: string[]) =>
    validateRoster(
      { id: 'r', name: 't', armyId: 'chaos', pointsLimit: 2000, entries: [
        { id: 'a', unitId: lord, size: 1, optionIds, magicItemIds: [], isGeneral: true },
      ] },
      chaos,
    ).filter((v) => v.rule === 'options-exclusive-group')

  it('flags two Marks of Chaos on one character', () => {
    const v = markViolations(['mark-khorne', 'mark-nurgle'])
    expect(v).toHaveLength(1)
    expect(v[0].severity).toBe('warning')
  })
  it('flags three Marks of Chaos on one character', () => {
    expect(markViolations(['mark-khorne', 'mark-nurgle', 'mark-slaanesh'])).toHaveLength(1)
  })
  it('allows a single Mark of Chaos', () => {
    expect(markViolations(['mark-khorne'])).toHaveLength(0)
  })
  it('allows no Mark of Chaos', () => {
    expect(markViolations([])).toHaveLength(0)
  })
  it('localizes the warning (EN/ES)', () => {
    const r = { id: 'r', name: 't', armyId: 'chaos', pointsLimit: 2000, entries: [
      { id: 'a', unitId: lord, size: 1, optionIds: ['mark-khorne', 'mark-nurgle'], magicItemIds: [], isGeneral: true },
    ] }
    const en = validateRoster(r, chaos, 'en').find((v) => v.rule === 'options-exclusive-group')!
    const es = validateRoster(r, chaos, 'es').find((v) => v.rule === 'options-exclusive-group')!
    expect(en.message).toContain('only one Mark of Chaos')
    expect(es.message).toContain('una Marca del Caos')
  })
})

// Reino del Caos pp.100-101: a daemonic mount requires the matching Mark of Chaos.
describe('daemonic mount requires its Mark (mount-requires-option)', () => {
  const chaos = getArmy('chaos')!
  const mountViolations = (optionIds: string[], mountId: string) =>
    validateRoster(
      { id: 'r', name: 't', armyId: 'chaos', pointsLimit: 2000, entries: [
        { id: 'a', unitId: 'ch-lord', size: 1, optionIds, magicItemIds: [], mountId, isGeneral: true },
      ] },
      chaos,
    ).filter((v) => v.rule === 'mount-requires-option')

  it('flags a Juggernaut without the Mark of Khorne', () => {
    expect(mountViolations([], 'mount-juggernaut')).toHaveLength(1)
  })
  it('allows a Juggernaut with the Mark of Khorne', () => {
    expect(mountViolations(['mark-khorne'], 'mount-juggernaut')).toHaveLength(0)
  })
  it('flags a Disc of Tzeentch without its Mark', () => {
    expect(mountViolations([], 'mount-disc')).toHaveLength(1)
  })
  it('allows the Chaos Steed with no Mark (not a daemonic mount)', () => {
    expect(mountViolations([], 'mount-chaos-steed')).toHaveLength(0)
  })
  it('localizes the warning (EN/ES)', () => {
    const r = { id: 'r', name: 't', armyId: 'chaos', pointsLimit: 2000, entries: [
      { id: 'a', unitId: 'ch-lord', size: 1, optionIds: [], magicItemIds: [], mountId: 'mount-juggernaut', isGeneral: true },
    ] }
    const en = validateRoster(r, chaos, 'en').find((v) => v.rule === 'mount-requires-option')!
    const es = validateRoster(r, chaos, 'es').find((v) => v.rule === 'mount-requires-option')!
    expect(en.message).toContain('requires')
    expect(es.message).toContain('requiere')
  })
})

// FAQ v2.20 §19.1: a magic shield is a slot separate from magic armour (one of each allowed).
describe('magic shield separate from armour (magic-items-category)', () => {
  const empire = getArmy('empire')!
  const lord = empire.units.find((u) => u.isCharacter && u.characterRank === 'lord')!.id
  const catViolations = (items: string[]) =>
    validateRoster(
      { id: 'r', name: 't', armyId: 'empire', pointsLimit: 2000, entries: [
        { id: 'a', unitId: lord, size: 1, optionIds: [], magicItemIds: items, isGeneral: true },
      ] },
      empire,
    ).filter((v) => v.rule === 'magic-items-category')

  it('allows one magic armour plus one magic shield', () => {
    expect(catViolations(['mi-meteoric-iron-armour', 'mi-enchanted-shield'])).toHaveLength(0)
  })
  it('flags two magic shields', () => {
    expect(catViolations(['mi-enchanted-shield', 'mi-spelled-shield'])).toHaveLength(1)
  })
})

describe('ratio caps (unit-ratio-max)', () => {
  const ratioArmy: Army = {
    id: 'ratio',
    name: 'Ratio Army',
    composition: STANDARD_5E_COMPOSITION,
    magicItems: [],
    units: [
      { id: 'slann', name: 'Slann', role: 'character', pointsPerModel: 300, isCharacter: true, canBeGeneral: true },
      { id: 'core', name: 'Core Regiment', role: 'regiment', pointsPerModel: 5, minSize: 1 },
      { id: 'tree', name: 'Treeman', role: 'monster', pointsPerModel: 285 },
      { id: 'tg', name: 'Temple Guard', role: 'regiment', pointsPerModel: 18 },
      { id: 'terra', name: 'Terradons', role: 'regiment', pointsPerModel: 30 },
      { id: 'rbt', name: 'Bolt Thrower', role: 'warmachine', pointsPerModel: 100 },
      { id: 'combo', name: 'Combo Unit', role: 'regiment', pointsPerModel: 10 },
      { id: 'ng', name: 'Night Goblins', role: 'regiment', pointsPerModel: 2.5 },
      { id: 'hoppers', name: 'Squig Hoppers', role: 'regiment', pointsPerModel: 25 },
      { id: 'monks', name: 'Plague Monks', role: 'regiment', pointsPerModel: 6 },
      { id: 'censers', name: 'Plague Censer Bearers', role: 'regiment', pointsPerModel: 15 },
    ],
    selectionRules: {
      ratioCaps: [
        { unitId: 'tree', perPoints: 1000, absoluteMax: 3, labelEn: 'Treeman', labelEs: 'Hombre Árbol' },
        { unitId: 'tg', perUnit: { ids: ['slann'] }, labelEn: 'Temple Guard', labelEs: 'Guardia' },
        { unitId: 'terra', perUnit: { ids: ['slann'] }, floor: 1, labelEn: 'Terradons', labelEs: 'Terradones' },
        { unitId: 'rbt', perUnit: { ids: ['core'], multiplier: 2, minSize: 10 }, labelEn: 'Bolt Throwers', labelEs: 'Lanzavirotes' },
        // Exercises every term at once: floor(pts/1000) + 1×core, raised to floor 1, capped at 5.
        { unitId: 'combo', perPoints: 1000, perUnit: { ids: ['core'] }, floor: 1, absoluteMax: 5, labelEn: 'Combo', labelEs: 'Combo' },
        // Capped-side countModels: limit is 5 × (ng entries); capped quantity is summed hopper MODELS.
        { unitId: 'hoppers', countModels: true, perUnit: { ids: ['ng'], multiplier: 5 }, labelEn: 'Squig Hoppers', labelEs: 'Saltarines' },
        // Both sides countModels + fractional multiplier; limit = floor(0.5 × monk models), capped at 10.
        { unitId: 'censers', countModels: true, perUnit: { ids: ['monks'], multiplier: 0.5, countModels: true }, absoluteMax: 10, labelEn: 'Censer Bearers', labelEs: 'Portaincensarios' },
      ],
    },
  }
  const ros = (pointsLimit: number, entries: RosterEntry[]): Roster => ({ id: 'r', name: 't', armyId: 'ratio', pointsLimit, entries })
  const e = (id: string, unitId: string, size = 1): RosterEntry => ({ id, unitId, size, optionIds: [], magicItemIds: [] })
  const ratioViolations = (r: Roster) => validateRoster(r, ratioArmy).filter((v) => v.rule === 'unit-ratio-max')

  it('perPoints: Treeman capped by points and absoluteMax', () => {
    expect(ratioViolations(ros(3000, [e('1', 'tree'), e('2', 'tree'), e('3', 'tree')]))).toHaveLength(0)
    expect(ratioViolations(ros(3000, [e('1', 'tree'), e('2', 'tree'), e('3', 'tree'), e('4', 'tree')]))).toHaveLength(1)
    expect(ratioViolations(ros(5000, [e('1', 'tree'), e('2', 'tree'), e('3', 'tree'), e('4', 'tree')]))).toHaveLength(1)
  })

  it('perPoints: skipped when pointsLimit is 0', () => {
    expect(ratioViolations(ros(0, [e('1', 'tree'), e('2', 'tree'), e('3', 'tree'), e('4', 'tree')]))).toHaveLength(0)
  })

  it('perUnit: Temple Guard capped by Slann count', () => {
    expect(ratioViolations(ros(2000, [e('s', 'slann'), e('1', 'tg')]))).toHaveLength(0)
    expect(ratioViolations(ros(2000, [e('s', 'slann'), e('1', 'tg'), e('2', 'tg')]))).toHaveLength(1)
  })

  it('floor: Terradons allowed up to 1 even with 0 Slann; 2nd flags', () => {
    expect(ratioViolations(ros(2000, [e('1', 'terra')]))).toHaveLength(0)
    expect(ratioViolations(ros(2000, [e('1', 'terra'), e('2', 'terra')]))).toHaveLength(1)
  })

  it('floor loses to a higher computed limit (2 Slann → 2 Terradons allowed)', () => {
    const twoSlann = [e('s1', 'slann'), e('s2', 'slann')]
    expect(ratioViolations(ros(2000, [...twoSlann, e('1', 'terra'), e('2', 'terra')]))).toHaveLength(0)
    expect(ratioViolations(ros(2000, [...twoSlann, e('1', 'terra'), e('2', 'terra'), e('3', 'terra')]))).toHaveLength(1)
  })

  it('combined terms: perPoints + perUnit add, then floor raises and absoluteMax caps', () => {
    // 2000 pts → floor(2) + 1 core(size≥1) = 3 allowed; 3 OK, 4 flags.
    const oneCore = [e('c', 'core', 1)]
    expect(ratioViolations(ros(2000, [...oneCore, e('1', 'combo'), e('2', 'combo'), e('3', 'combo')]))).toHaveLength(0)
    expect(ratioViolations(ros(2000, [...oneCore, e('1', 'combo'), e('2', 'combo'), e('3', 'combo'), e('4', 'combo')]))).toHaveLength(1)
    // 0 pts + no core → computed = max(0, floor 1) = 1; 1 OK, 2 flags.
    expect(ratioViolations(ros(0, [e('1', 'combo')]))).toHaveLength(0)
    expect(ratioViolations(ros(0, [e('1', 'combo'), e('2', 'combo')]))).toHaveLength(1)
    // High points → floor(10)+1 = 11, capped at absoluteMax 5; 5 OK, 6 flags.
    expect(ratioViolations(ros(10000, [...oneCore, ...Array.from({ length: 5 }, (_, i) => e(`x${i}`, 'combo'))]))).toHaveLength(0)
    expect(ratioViolations(ros(10000, [...oneCore, ...Array.from({ length: 6 }, (_, i) => e(`x${i}`, 'combo'))]))).toHaveLength(1)
  })

  it('multiplier + minSize: only regiments of 10+ count, ×2', () => {
    expect(ratioViolations(ros(2000, [e('c', 'core', 10), e('1', 'rbt'), e('2', 'rbt')]))).toHaveLength(0)
    expect(ratioViolations(ros(2000, [e('c', 'core', 10), e('1', 'rbt'), e('2', 'rbt'), e('3', 'rbt')]))).toHaveLength(1)
    expect(ratioViolations(ros(2000, [e('c', 'core', 9), e('1', 'rbt')]))).toHaveLength(1)
  })

  it('count 0: a capped unit not taken is never flagged', () => {
    expect(ratioViolations(ros(2000, [e('s', 'slann')]))).toHaveLength(0)
  })

  it('message is bilingual', () => {
    const en = validateRoster(ros(2000, [e('s', 'slann'), e('1', 'tg'), e('2', 'tg')]), ratioArmy)
    const es = validateRoster(ros(2000, [e('s', 'slann'), e('1', 'tg'), e('2', 'tg')]), ratioArmy, 'es')
    expect(en.find((v) => v.rule === 'unit-ratio-max')?.message).toContain('only 1 allowed')
    expect(es.find((v) => v.rule === 'unit-ratio-max')?.message).toContain('sólo se permiten 1')
  })

  it('capped-side countModels: one entry of summed models, not entry count', () => {
    // 1 ng entry → limit = 5 models. A single hoppers entry of size 5 is OK; size 6 flags.
    expect(ratioViolations(ros(2000, [e('n', 'ng', 1), e('h', 'hoppers', 5)]))).toHaveLength(0)
    expect(ratioViolations(ros(2000, [e('n', 'ng', 1), e('h', 'hoppers', 6)]))).toHaveLength(1)
  })

  it('basis-side countModels + fractional multiplier rounds down', () => {
    // 1 monks entry size 15 → 0.5 × 15 = 7.5 → floor 7. A censers entry size 7 OK, size 8 flags.
    expect(ratioViolations(ros(2000, [e('m', 'monks', 15), e('c', 'censers', 7)]))).toHaveLength(0)
    expect(ratioViolations(ros(2000, [e('m', 'monks', 15), e('c', 'censers', 8)]))).toHaveLength(1)
  })

  it('basis-side countModels message floors the displayed limit (7, not 7.5)', () => {
    const en = validateRoster(ros(2000, [e('m', 'monks', 15), e('c', 'censers', 8)]), ratioArmy)
    const msg = en.find((v) => v.rule === 'unit-ratio-max')?.message
    expect(msg).toContain('only 7 allowed')
    expect(msg).not.toContain('7.5')
  })

  it('absoluteMax clamps under model basis', () => {
    // monks size 40 → 0.5 × 40 = 20, clamped to 10. censers size 10 OK, 11 flags.
    expect(ratioViolations(ros(2000, [e('m', 'monks', 40), e('c', 'censers', 10)]))).toHaveLength(0)
    expect(ratioViolations(ros(2000, [e('m', 'monks', 40), e('c', 'censers', 11)]))).toHaveLength(1)
  })
})

describe('dependencies (unit-requires)', () => {
  const depArmy: Army = {
    id: 'dep',
    name: 'Dep Army',
    composition: STANDARD_5E_COMPOSITION,
    magicItems: [],
    units: [
      { id: 'hero-a', name: 'Hero A', role: 'character', pointsPerModel: 100, isCharacter: true, canBeGeneral: true },
      { id: 'hero-b', name: 'Hero B', role: 'character', pointsPerModel: 100, isCharacter: true, canBeGeneral: true },
      { id: 'special', name: 'Special Character', role: 'character', pointsPerModel: 150, isCharacter: true },
      { id: 'witch', name: 'Witch Regiment', role: 'regiment', pointsPerModel: 10, minSize: 1 },
      { id: 'dual', name: 'Dual Dependant', role: 'character', pointsPerModel: 120, isCharacter: true },
    ],
    selectionRules: {
      dependencies: [
        { unitId: 'special', requiresAnyOf: ['witch'], labelEn: 'Special Character', labelEs: 'Personaje Especial' },
        { unitId: 'hero-a', requiresAnyOf: ['hero-b'], labelEn: 'Hero A', labelEs: 'Héroe A' },
        { unitId: 'hero-b', requiresAnyOf: ['hero-a'], labelEn: 'Hero B', labelEs: 'Héroe B' },
        { unitId: 'dual', requiresAnyOf: ['hero-a', 'hero-b'], labelEn: 'Dual', labelEs: 'Dual' },
      ],
    },
  }
  const ros = (entries: RosterEntry[]): Roster => ({ id: 'r', name: 't', armyId: 'dep', pointsLimit: 2000, entries })
  const e = (id: string, unitId: string): RosterEntry => ({ id, unitId, size: 1, optionIds: [], magicItemIds: [] })
  const depViolations = (r: Roster) => validateRoster(r, depArmy).filter((v) => v.rule === 'unit-requires')

  it('flags a special character without its prerequisite', () => {
    expect(depViolations(ros([e('1', 'special')]))).toHaveLength(1)
  })

  it('passes when the prerequisite is present', () => {
    expect(depViolations(ros([e('1', 'special'), e('2', 'witch')]))).toHaveLength(0)
  })

  it('does not flag a prerequisite-less list (unit not taken)', () => {
    expect(depViolations(ros([e('2', 'witch')]))).toHaveLength(0)
  })

  it('mutual dependency: one without the other flags; both together pass', () => {
    expect(depViolations(ros([e('1', 'hero-a')]))).toHaveLength(1)
    expect(depViolations(ros([e('1', 'hero-a'), e('2', 'hero-b')]))).toHaveLength(0)
  })

  it('message is bilingual and names the prerequisite', () => {
    const en = validateRoster(ros([e('1', 'special')]), depArmy)
    const es = validateRoster(ros([e('1', 'special')]), depArmy, 'es')
    expect(en.find((v) => v.rule === 'unit-requires')?.message).toContain('requires Witch Regiment')
    expect(es.find((v) => v.rule === 'unit-requires')?.message).toContain('requiere')
  })

  it('requiresAnyOf with multiple prereqs: satisfied by EITHER; message joins both', () => {
    // Either prerequisite present → no warning.
    expect(depViolations(ros([e('1', 'dual'), e('2', 'hero-a'), e('3', 'hero-b')]))).toHaveLength(0)
    expect(depViolations(ros([e('1', 'dual'), e('2', 'hero-b'), e('3', 'hero-a')]))).toHaveLength(0)
    // Neither present → one warning naming both prereqs.
    const vs = depViolations(ros([e('1', 'dual')]))
    expect(vs).toHaveLength(1)
    expect(vs[0].message).toContain('Hero A / Hero B')
  })
})

describe('dependency/ratio batch (data)', () => {
  const e = (id: string, unitId: string, size = 1): RosterEntry => ({ id, unitId, size, optionIds: [], magicItemIds: [] })
  const ros = (armyId: string, entries: RosterEntry[]): Roster => ({ id: 'r', name: 't', armyId, pointsLimit: 3000, entries })

  it('Dark Elves: Kouran requires Black Guard', () => {
    const de = getArmy('dark-elves')!
    const requires = (r: Roster) => validateRoster(r, de).filter((v) => v.rule === 'unit-requires')
    expect(requires(ros('dark-elves', [e('1', 'de-kouran')]))).toHaveLength(1)
    expect(requires(ros('dark-elves', [e('1', 'de-kouran'), e('2', 'de-black-guard', 10)]))).toHaveLength(0)
  })

  it('Dark Elves: Assassin requires a host unit (FAQ §33.5)', () => {
    const de = getArmy('dark-elves')!
    const requires = (r: Roster) => validateRoster(r, de).filter((v) => v.rule === 'unit-requires')
    expect(requires(ros('dark-elves', [e('1', 'de-assassin')]))).toHaveLength(1)
    expect(requires(ros('dark-elves', [e('1', 'de-assassin'), e('2', 'de-corsairs', 10)]))).toHaveLength(0)
  })

  it('Skaven: Assassins require a Sewer (Gutter) Runner unit (FAQ §35.3)', () => {
    const sk = getArmy('skaven')!
    const requires = (r: Roster) => validateRoster(r, sk).filter((v) => v.rule === 'unit-requires')
    expect(requires(ros('skaven', [e('1', 'sk-assassins')]))).toHaveLength(1)
    expect(requires(ros('skaven', [e('1', 'sk-assassins'), e('2', 'sk-sewer-runners', 5)]))).toHaveLength(0)
  })

  it('Chaos: daemons require a same-god character; a Mark satisfies it (FAQ §31.4)', () => {
    const chaos = getArmy('chaos')!
    const requires = (r: Roster) => validateRoster(r, chaos).filter((v) => v.rule === 'unit-requires')
    const lordWith = (mark: string): RosterEntry => ({ id: 'L', unitId: 'ch-lord', size: 1, optionIds: [mark], magicItemIds: [] })
    // Bloodletters (Khorne) with no Khorne character → warning.
    expect(requires(ros('chaos', [e('1', 'ch-bloodletters', 10)]))).toHaveLength(1)
    // Satisfied by a fixed-god Khorne character (a Bloodthirster).
    expect(requires(ros('chaos', [e('1', 'ch-bloodletters', 10), e('2', 'ch-bloodthirster')]))).toHaveLength(0)
    // Satisfied by a generic Chaos Lord bearing the Mark of Khorne.
    expect(requires(ros('chaos', [e('1', 'ch-bloodletters', 10), lordWith('mark-khorne')]))).toHaveLength(0)
    // A WRONG-god Mark (Slaanesh) does NOT satisfy Khorne daemons.
    expect(requires(ros('chaos', [e('1', 'ch-bloodletters', 10), lordWith('mark-slaanesh')]))).toHaveLength(1)
  })

  it('Orcs & Goblins: Rock Lobber (Small) requires an orc unit', () => {
    const og = getArmy('orcs-and-goblins')!
    const requires = (r: Roster) => validateRoster(r, og).filter((v) => v.rule === 'unit-requires')
    expect(requires(ros('orcs-and-goblins', [e('1', 'og-rock-lobber-small')]))).toHaveLength(1)
    expect(requires(ros('orcs-and-goblins', [e('1', 'og-rock-lobber-small'), e('2', 'og-orc-boyz', 10)]))).toHaveLength(0)
  })

  it('Skaven: Plague Priests capped one per Plague Monk regiment', () => {
    const sk = getArmy('skaven')!
    const ratio = (r: Roster) => validateRoster(r, sk).filter((v) => v.rule === 'unit-ratio-max')
    // 2 priests, only 1 plague-monk regiment → over the cap.
    expect(ratio(ros('skaven', [
      e('1', 'sk-plague-priest'), e('2', 'sk-plague-priest'),
      e('3', 'sk-plague-monks', 10),
    ]))).toHaveLength(1)
    // 2 priests, 2 plague-monk regiments → fine.
    expect(ratio(ros('skaven', [
      e('1', 'sk-plague-priest'), e('2', 'sk-plague-priest'),
      e('3', 'sk-plague-monks', 10), e('4', 'sk-plague-monks', 10),
    ]))).toHaveLength(0)
  })

  it('Dwarfs: Slayer regiments capped by the number of other warrior regiments', () => {
    const dw = getArmy('dwarfs')!
    const ratio = (r: Roster) => validateRoster(r, dw).filter((v) => v.rule === 'unit-ratio-max')
    // 2 Slayer regiments, only 1 warrior regiment → over the cap.
    expect(ratio(ros('dwarfs', [
      e('1', 'dw-slayers', 10), e('2', 'dw-slayers', 10),
      e('3', 'dw-warriors', 10),
    ]))).toHaveLength(1)
    // 2 Slayer regiments, 2 warrior regiments (different types) → fine.
    expect(ratio(ros('dwarfs', [
      e('1', 'dw-slayers', 10), e('2', 'dw-slayers', 10),
      e('3', 'dw-warriors', 10), e('4', 'dw-thunderers', 10),
    ]))).toHaveLength(0)
  })
})
