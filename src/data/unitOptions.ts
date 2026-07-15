import type { EquipmentOption } from './types'

/** Wizard level upgrades — choose at most one (UI enforces). Cumulative points + item slots. */
export const WIZARD_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Wizard Level 2', pointsPerModel: 35, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Wizard Level 3', pointsPerModel: 70, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Wizard Level 4', pointsPerModel: 105, magicItemSlotsDelta: 3 },
]

/** Battle Standard Bearer upgrade for a hero/lord (flat cost). */
export const BSB_UPGRADE: EquipmentOption = {
  id: 'bsb',
  name: 'Battle Standard Bearer',
  pointsPerModel: 25,
  flat: true,
}

/** Per-model equipment upgrades (cost multiplied by unit size). */
export const SHIELD: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 1 }
export const LIGHT_ARMOUR: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 1 }
export const SPEARS: EquipmentOption = { id: 'spears', name: 'Spears', pointsPerModel: 1 }

/**
 * Command group — flat per-unit upgrades available to most regiments.
 *
 * In Warhammer 4th/5th edition a unit's standard bearer and musician each cost
 * DOUBLE a rank-and-file model (i.e. as two of that unit's miniatures), so the
 * cost is derived per unit from its base points rather than a fixed charge.
 * There is NO unit-champion option — champions are separate paladin / hero /
 * commander character entries bought from the Characters allowance.
 */
export function commandOptions(basePointsPerModel: number): EquipmentOption[] {
  const cost = basePointsPerModel * 2
  return [
    { id: 'standard', name: 'Standard Bearer', pointsPerModel: cost, flat: true },
    { id: 'musician', name: 'Musician', pointsPerModel: cost, flat: true },
  ]
}
