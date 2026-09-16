import { describe, it, expect } from 'vitest'
import { assertArmyIntegrity } from './integrity'
import { ARMIES } from './index'
import { STANDARD_5E_COMPOSITION, type Army, type UnitProfile } from '../types'

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
