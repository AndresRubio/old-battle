import { describe, it, expect } from 'vitest'
import { assertArmyIntegrity } from './integrity'
import { ARMIES } from './index'
import { STANDARD_5E_COMPOSITION, type Army, type EquipmentOption, type UnitProfile } from '../types'

const unit = (over: Partial<UnitProfile> & { id: string }): UnitProfile => ({
  name: over.id,
  role: 'regiment',
  pointsPerModel: 5,
  ...over,
})

const army = (over: Partial<Army> = {}): Army => ({
  id: 'test-army',
  name: 'Test Army',
  composition: STANDARD_5E_COMPOSITION,
  units: [unit({ id: 'a' }), unit({ id: 'b', role: 'character', isCharacter: true })],
  magicItems: [],
  ...over,
})

describe('assertArmyIntegrity', () => {
  it('returns a well-formed army unchanged (and every shipped army passes)', () => {
    const a = army()
    expect(assertArmyIntegrity(a)).toBe(a)
    // The shipped ARMIES already went through the assembly pipeline — reaching
    // this line at all proves none of them threw at module load.
    expect(ARMIES.length).toBe(16)
  })

  it('throws on duplicate unit ids', () => {
    expect(() => assertArmyIntegrity(army({ units: [unit({ id: 'a' }), unit({ id: 'a' })] }))).toThrow(
      /duplicate unit ids: a/,
    )
  })

  it('throws on duplicate magic-item ids', () => {
    const item = { id: 'mi-x', name: 'X', category: 'weapon' as const, points: 10 }
    expect(() => assertArmyIntegrity(army({ magicItems: [item, { ...item }] }))).toThrow(
      /duplicate magic-item ids: mi-x/,
    )
  })

  it('throws when a mount option id collides with the unit option namespace', () => {
    const u = unit({
      id: 'c',
      role: 'character',
      isCharacter: true,
      options: [{ id: 'shield', name: 'Shield', pointsPerModel: 2 }],
      mounts: [{ id: 'm', name: 'M', points: 10, options: [{ id: 'shield', name: 'Crew shield', pointsPerModel: 1 }] }],
    })
    expect(() => assertArmyIntegrity(army({ units: [u] }))).toThrow(/c: colliding option ids: shield/)
  })

  it('throws when a non-character has mounts', () => {
    const u = unit({ id: 'r', mounts: [{ id: 'm', name: 'M', points: 10 }] })
    expect(() => assertArmyIntegrity(army({ units: [u] }))).toThrow(/has mounts but is not a character/)
  })

  // OLD-35 — a perCrewman option on a host with no baseCrew prices at rate × 0:
  // silently free. The declaration is mandatory on any host using a crew flag.
  it('throws when a unit has crew options but no baseCrew', () => {
    const u = unit({
      id: 'ch',
      role: 'chariot',
      options: [{ id: 'crew-shields', name: 'Shields', pointsPerModel: 1, perCrewman: true }],
    })
    expect(() => assertArmyIntegrity(army({ units: [u] }))).toThrow(
      /ch: crew options \(crew-shields\) but no baseCrew/,
    )
    const adds = unit({
      id: 'ch2',
      role: 'chariot',
      options: [{ id: 'crew3', name: '3rd crewman', pointsPerModel: 5, flat: true, addsCrewman: true }],
    })
    expect(() => assertArmyIntegrity(army({ units: [adds] }))).toThrow(
      /ch2: crew options \(crew3\) but no baseCrew/,
    )
    // With baseCrew declared the same unit is fine.
    const ok = unit({ ...u, baseCrew: 2 })
    expect(assertArmyIntegrity(army({ units: [ok] }))).toBeTruthy()
  })

  it('throws on a perCrewman option on a regiment (models are not crew)', () => {
    const u = unit({
      id: 'reg',
      role: 'regiment',
      baseCrew: 2,
      options: [{ id: 'shields', name: 'Shields', pointsPerModel: 1, perCrewman: true }],
    })
    expect(() => assertArmyIntegrity(army({ units: [u] }))).toThrow(
      /reg: perCrewman option shields on a regiment/,
    )
  })

  it('throws when a mount has crew options but no baseCrew', () => {
    const u = unit({
      id: 'c',
      role: 'character',
      isCharacter: true,
      mounts: [
        {
          id: 'chariot',
          name: 'Chariot',
          points: 50,
          options: [{ id: 'crew-shields', name: 'Shields', pointsPerModel: 1, perCrewman: true }],
        },
      ],
    })
    expect(() => assertArmyIntegrity(army({ units: [u] }))).toThrow(
      /c\/chariot: crew options \(crew-shields\) but no baseCrew/,
    )
  })

  it('throws on an item restricted to a different army, and on an unrestricted special item', () => {
    expect(() =>
      assertArmyIntegrity(
        army({ magicItems: [{ id: 'mi-y', name: 'Y', category: 'weapon', points: 5, restrictedTo: ['empire'] }] }),
      ),
    ).toThrow(/restricted to empire/)
    expect(() =>
      assertArmyIntegrity(
        army({ magicItems: [{ id: 'mi-z', name: 'Z', category: 'weapon', points: 5, special: true }] }),
      ),
    ).toThrow(/special-character item mi-z/)
  })

  // OLD-43 — `UnitProfile.statLine` and `MountOption.statLine` widened from a
  // full `StatLine` to `Partial<StatLine>` so a column the book prints as a
  // token ("5D6", "2-10", "Especial") can be absent and carried in `statNotes`
  // instead. The type no longer forces completeness, so this guard is what makes
  // the widening safe: a silently dropped column would otherwise render "–" as
  // if the book printed a dash.
  describe('nine-column coverage (statLine + statNotes)', () => {
    const FULL = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }

    it('throws naming the unit and the columns nothing accounts for', () => {
      const { M, A, ...short } = FULL
      void M
      void A
      const u = unit({ id: 'gap', statLine: short })
      expect(() => assertArmyIntegrity(army({ units: [u] }))).toThrow(
        /gap: statLine has no value and no statNotes entry for M, A/,
      )
    })

    it('accepts the same unit once the missing columns carry a book token', () => {
      const { M, A, ...short } = FULL
      void M
      void A
      const u = unit({ id: 'gap', statLine: short, statNotes: { M: '5D6cm', A: '1D6' } })
      expect(assertArmyIntegrity(army({ units: [u] }))).toBeTruthy()
    })

    it('still throws when the note covers only some of the gaps', () => {
      const { M, A, ...short } = FULL
      void M
      void A
      const u = unit({ id: 'gap', statLine: short, statNotes: { M: '5D6cm' } })
      expect(() => assertArmyIntegrity(army({ units: [u] }))).toThrow(
        /gap: statLine has no value and no statNotes entry for A/,
      )
    })

    it('applies the same rule to a mount profile', () => {
      const { Ld, ...short } = FULL
      void Ld
      const withGap = unit({
        id: 'c', role: 'character', isCharacter: true,
        mounts: [{ id: 'steed', name: 'Steed', points: 10, statLine: short }],
      })
      expect(() => assertArmyIntegrity(army({ units: [withGap] }))).toThrow(
        /c\/steed: statLine has no value and no statNotes entry for Ld/,
      )
      const noted = unit({
        id: 'c', role: 'character', isCharacter: true,
        mounts: [{ id: 'steed', name: 'Steed', points: 10, statLine: short, statNotes: { Ld: '–' } }],
      })
      expect(assertArmyIntegrity(army({ units: [noted] }))).toBeTruthy()
    })

    it('leaves a unit with no statLine at all alone, and never applies to a ProfileBlock', () => {
      // A chariot chassis legitimately prints only some columns
      // ("Carruaje - - - 7 7 3 1 - -") and renders "–" for the rest.
      const u = unit({
        id: 'chariot', role: 'chariot',
        profiles: [{ name: 'Chassis', statLine: { S: 7, T: 7, W: 3, I: 1 } }],
      })
      expect(assertArmyIntegrity(army({ units: [u] }))).toBeTruthy()
    })
  })

  // OLD-46 — the Spanish stat strip prints M in the centimetres the books print,
  // read off MOVEMENT_CM. An inch value missing from that table has no book
  // value to show, so it must fail at load instead of rendering raw inches in a
  // centimetre column. Every place a profile can carry an M is checked.
  describe('Movement has a centimetre equivalent', () => {
    const line = (M: number) => ({ M, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 })
    const character = (over: Partial<UnitProfile>) =>
      unit({ id: 'c', role: 'character', isCharacter: true, ...over })

    it("throws on a unit's own M", () => {
      expect(() => assertArmyIntegrity(army({ units: [unit({ id: 'u', statLine: line(11) })] }))).toThrow(
        /u: Movement 11" has no centimetre equivalent/,
      )
    })

    it("throws on an option's replacement profile (wizard levels)", () => {
      const u = character({ options: [{ id: 'lvl2', name: 'Level 2', pointsPerModel: 50, statLine: line(11) }] })
      expect(() => assertArmyIntegrity(army({ units: [u] }))).toThrow(
        /c\/lvl2: Movement 11" has no centimetre equivalent/,
      )
    })

    it("throws on a mount's M and on its display profiles", () => {
      const mount = character({ mounts: [{ id: 'steed', name: 'Steed', points: 10, statLine: line(11) }] })
      expect(() => assertArmyIntegrity(army({ units: [mount] }))).toThrow(
        /c\/steed: Movement 11" has no centimetre equivalent/,
      )
      const crewed = character({
        mounts: [{ id: 'chariot', name: 'Chariot', points: 50, profiles: [{ name: 'Crew', statLine: { M: 11 } }] }],
      })
      expect(() => assertArmyIntegrity(army({ units: [crewed] }))).toThrow(
        /c\/chariot\/Crew: Movement 11" has no centimetre equivalent/,
      )
    })

    it("throws on a unit's display profiles", () => {
      const u = unit({ id: 'ch', role: 'chariot', profiles: [{ name: 'Steed', statLine: { M: 11 } }] })
      expect(() => assertArmyIntegrity(army({ units: [u] }))).toThrow(
        /ch\/Steed: Movement 11" has no centimetre equivalent/,
      )
    })

    it("throws on a cavalry regiment's steed", () => {
      const u = unit({ id: 'knights', statLine: line(4), mount: { name: 'Warhorse', statLine: line(11) } })
      expect(() => assertArmyIntegrity(army({ units: [u] }))).toThrow(
        /knights\/Warhorse: Movement 11" has no centimetre equivalent/,
      )
    })

    it("throws on a mount option's replacement profile", () => {
      const u = character({
        mounts: [{
          id: 'steed', name: 'Steed', points: 10, statLine: line(8),
          options: [{ id: 'fast', name: 'Fast', pointsPerModel: 1, statLine: line(11) }],
        }],
      })
      expect(() => assertArmyIntegrity(army({ units: [u] }))).toThrow(
        /c\/steed\/fast: Movement 11" has no centimetre equivalent/,
      )
    })

    it('accepts a mapped M, a blank M and a token M', () => {
      const u = character({
        statLine: line(4),
        mounts: [{ id: 'steed', name: 'Steed', points: 10, statLine: line(8) }],
        profiles: [{ name: 'Chassis', statLine: { T: 7, W: 3 } }],
      })
      const { M, ...noM } = line(0)
      void M
      const spawn = unit({ id: 'spawn', statLine: noM, statNotes: { M: '5D6cm' } })
      expect(assertArmyIntegrity(army({ units: [u, spawn] }))).toBeTruthy()
    })
  })

  it('throws on selection rules referencing unknown units', () => {
    expect(() =>
      assertArmyIntegrity(
        army({ selectionRules: { ratioCaps: [{ unitId: 'ghost', labelEn: 'G', labelEs: 'G' }] } }),
      ),
    ).toThrow(/ratioCap references unknown unit ghost/)
    expect(() =>
      assertArmyIntegrity(
        army({
          selectionRules: {
            dependencies: [{ unitId: 'a', requiresAnyOf: ['ghost'], labelEn: 'D', labelEs: 'D' }],
          },
        }),
      ),
    ).toThrow(/dependency for a references unknown unit ghost/)
    expect(() =>
      assertArmyIntegrity(
        army({ selectionRules: { unitGroupCaps: [{ ids: ['ghost'], max: 1, labelEn: 'C', labelEs: 'C' }] } }),
      ),
    ).toThrow(/unitGroupCap "C" references unknown unit ghost/)
  })
})

// OLD-63 — fixed magic items and fixed extras on a special character's page.
describe('fixed magic items and fixed extras', () => {
  const pool = [
    { id: 'mi-a', name: 'A', category: 'weapon' as const, points: 10 },
    { id: 'mi-b', name: 'B', category: 'talisman' as const, points: 20 },
  ]
  const hero = (over: Partial<UnitProfile>) =>
    unit({ id: 'kf', role: 'character', isCharacter: true, characterRank: 'lord', ...over })
  const withUnit = (u: UnitProfile) => army({ units: [u], magicItems: pool })

  it('accepts a well-formed character', () => {
    const ok = hero({
      fixedMagicItems: [{ id: 'mi-a', points: 5 }, { id: 'mi-b', included: true }],
      fixedExtras: [{ id: 'x', name: 'X', points: 40 }],
    })
    expect(assertArmyIntegrity(withUnit(ok))).toBeTruthy()
  })

  it('throws when a fixed item is not in the army pool', () => {
    expect(() => assertArmyIntegrity(withUnit(hero({ fixedMagicItems: [{ id: 'mi-gone' }] })))).toThrow(
      /kf: fixed magic item mi-gone is not in the army's magic items/,
    )
  })

  it('throws when a unit lists the same fixed item twice', () => {
    expect(() =>
      assertArmyIntegrity(withUnit(hero({ fixedMagicItems: [{ id: 'mi-a' }, { id: 'mi-a' }] }))),
    ).toThrow(/kf: duplicate fixed magic items: mi-a/)
  })

  it('throws when a fixed item sets both points and included', () => {
    expect(() =>
      assertArmyIntegrity(withUnit(hero({ fixedMagicItems: [{ id: 'mi-a', points: 5, included: true }] }))),
    ).toThrow(/kf\/mi-a: fixed magic item sets both points and included/)
  })

  it('throws when a fixed item has a negative price', () => {
    expect(() => assertArmyIntegrity(withUnit(hero({ fixedMagicItems: [{ id: 'mi-a', points: -5 }] })))).toThrow(
      /kf\/mi-a: negative fixed magic item points/,
    )
  })

  it('throws when a fixed item names an option the unit does not have', () => {
    const item = { id: 'mi-a', points: 5, pointsWithOption: 3, pointsOptionId: 'gone' }
    expect(() => assertArmyIntegrity(withUnit(hero({ fixedMagicItems: [item] })))).toThrow(
      /kf\/mi-a: pointsOptionId gone is not an option of the unit/,
    )
  })

  it('throws when a fixed item has an option price without its option, or the reverse', () => {
    expect(() =>
      assertArmyIntegrity(withUnit(hero({ fixedMagicItems: [{ id: 'mi-a', pointsWithOption: 3 }] }))),
    ).toThrow(/kf\/mi-a: pointsWithOption and pointsOptionId go together/)
    expect(() =>
      assertArmyIntegrity(withUnit(hero({ fixedMagicItems: [{ id: 'mi-a', pointsOptionId: 'o' }] }))),
    ).toThrow(/kf\/mi-a: pointsWithOption and pointsOptionId go together/)
  })

  it('throws when fixed items sit on a non-character', () => {
    const regiment = unit({ id: 'r', fixedMagicItems: [{ id: 'mi-a' }] })
    expect(() => assertArmyIntegrity(withUnit(regiment))).toThrow(/r: has fixed magic items but is not a character/)
  })

  it('throws when fixed extras sit on a non-character', () => {
    const regiment = unit({ id: 'r', fixedExtras: [{ id: 'x', name: 'X', points: 40 }] })
    expect(() => assertArmyIntegrity(withUnit(regiment))).toThrow(/r: has fixed extras but is not a character/)
  })

  it('throws when fixed extra ids repeat within a unit', () => {
    const u = hero({ fixedExtras: [{ id: 'x', name: 'X', points: 40 }, { id: 'x', name: 'Y', points: 10 }] })
    expect(() => assertArmyIntegrity(withUnit(u))).toThrow(/kf: duplicate fixed extra ids: x/)
  })

  it('throws when a fixed extra has a negative price', () => {
    const u = hero({ fixedExtras: [{ id: 'x', name: 'X', points: -1 }] })
    expect(() => assertArmyIntegrity(withUnit(u))).toThrow(/kf\/x: negative fixed extra points/)
  })

  it('throws when a fixed extra has an empty name', () => {
    const u = hero({ fixedExtras: [{ id: 'x', name: '  ', points: 40 }] })
    expect(() => assertArmyIntegrity(withUnit(u))).toThrow(/kf\/x: fixed extra has no name/)
  })

  // OLD-69: the allow-list and the master runes inside a rune group.
  it('accepts an allow-list and a rune group with master runes', () => {
    const ok = hero({
      allowedMagicItems: ['mi-b'],
      fixedExtras: [{ id: 'x', name: 'X', points: 40, magicItem: true, uniqueItemIds: ['mi-a'] }],
    })
    expect(assertArmyIntegrity(withUnit(ok))).toBeTruthy()
  })

  it('throws when an allowed item is not in the army pool', () => {
    expect(() => assertArmyIntegrity(withUnit(hero({ allowedMagicItems: ['mi-gone'] })))).toThrow(
      /kf: allowed magic item mi-gone is not in the army's magic items/,
    )
  })

  it('throws when an allowed item is also a fixed item', () => {
    const u = hero({ fixedMagicItems: [{ id: 'mi-a' }], allowedMagicItems: ['mi-a'] })
    expect(() => assertArmyIntegrity(withUnit(u))).toThrow(/kf: allowed magic item mi-a is already a fixed item/)
  })

  it('throws when an allow-list sits on a non-character', () => {
    const regiment = unit({ id: 'r', allowedMagicItems: [] })
    expect(() => assertArmyIntegrity(withUnit(regiment))).toThrow(/r: has allowed magic items but is not a character/)
  })

  it('throws when a fixed extra embodies an item missing from the pool', () => {
    const u = hero({ fixedExtras: [{ id: 'x', name: 'X', points: 40, magicItem: true, uniqueItemIds: ['mi-gone'] }] })
    expect(() => assertArmyIntegrity(withUnit(u))).toThrow(/kf\/x: unique item mi-gone is not in the army's magic items/)
  })

  it('throws when a fixed extra that is not a magic item carries unique items', () => {
    const u = hero({ fixedExtras: [{ id: 'x', name: 'X', points: 40, uniqueItemIds: ['mi-a'] }] })
    expect(() => assertArmyIntegrity(withUnit(u))).toThrow(/kf\/x: uniqueItemIds on a fixed extra that is not a magic item/)
  })
})

// OLD-63 — counted options (an option bought N times, priced pointsPerModel × N
// once per entry). Only a per-entry option on a non-regiment can be counted.
describe('counted options', () => {
  const hero = (opt: Partial<EquipmentOption>, over: Partial<UnitProfile> = {}) =>
    unit({
      id: 'or',
      role: 'character',
      isCharacter: true,
      characterRank: 'lord',
      options: [{ id: 'h', name: 'Hounds', pointsPerModel: 5, ...opt }],
      ...over,
    })
  const withUnit = (u: UnitProfile) => army({ units: [u] })

  it('accepts a counted option with or without a maxCount', () => {
    expect(assertArmyIntegrity(withUnit(hero({ counted: true })))).toBeTruthy()
    expect(assertArmyIntegrity(withUnit(hero({ counted: true, maxCount: 15 })))).toBeTruthy()
  })

  it('throws when maxCount is set without counted', () => {
    expect(() => assertArmyIntegrity(withUnit(hero({ maxCount: 3 })))).toThrow(/or\/h: maxCount without counted/)
  })

  it('throws when maxCount is not a whole number >= 0', () => {
    expect(() => assertArmyIntegrity(withUnit(hero({ counted: true, maxCount: -1 })))).toThrow(
      /or\/h: maxCount must be a whole number >= 0/,
    )
    expect(() => assertArmyIntegrity(withUnit(hero({ counted: true, maxCount: 2.5 })))).toThrow(
      /or\/h: maxCount must be a whole number >= 0/,
    )
  })

  // OLD-63: Sturmjarl's card-price option is worth -5 once. A negative price
  // that scaled with the unit size or a count would be meaningless.
  it('accepts a negative price on a flat option', () => {
    expect(assertArmyIntegrity(withUnit(hero({ pointsPerModel: -5, flat: true })))).toBeTruthy()
  })

  it('throws when a negative price is not flat', () => {
    expect(() => assertArmyIntegrity(withUnit(hero({ pointsPerModel: -5 })))).toThrow(
      /or\/h: negative option price on a non-flat option/,
    )
    expect(() => assertArmyIntegrity(withUnit(hero({ pointsPerModel: -5, counted: true })))).toThrow(
      /or\/h: negative option price on a non-flat option/,
    )
  })

  it('throws when a counted option sits on a regiment', () => {
    const regiment = unit({ id: 'rg', options: [{ id: 'h', name: 'Hounds', pointsPerModel: 5, counted: true }] })
    expect(() => assertArmyIntegrity(withUnit(regiment))).toThrow(/rg\/h: counted option on a regiment/)
  })

  it.each(['flat', 'perCrewman', 'timesModelCost'] as const)('throws when a counted option sets %s', (flag) => {
    const opt: Partial<EquipmentOption> =
      flag === 'timesModelCost' ? { counted: true, timesModelCost: 2 } : { counted: true, [flag]: true }
    // perCrewman needs a crewed host to get past the crew check.
    expect(() => assertArmyIntegrity(withUnit(hero(opt, { baseCrew: 2 })))).toThrow(
      new RegExp(`or/h: counted option sets ${flag}`),
    )
  })

  it('throws when a mount option is counted (mount options are toggles only)', () => {
    const u = hero({}, {
      mounts: [
        {
          id: 'm',
          name: 'Mount',
          points: 10,
          options: [{ id: 'mh', name: 'Hounds', pointsPerModel: 5, counted: true }],
        },
      ],
    })
    expect(() => assertArmyIntegrity(withUnit(u))).toThrow(/or\/m\/mh: counted options are not supported on mounts/)
  })
})
