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

/** Command group — flat per-unit upgrades available to most regiments. */
export const CHAMPION: EquipmentOption = { id: 'champion', name: 'Champion', pointsPerModel: 10, flat: true }
export const STANDARD_BEARER: EquipmentOption = { id: 'standard', name: 'Standard Bearer', pointsPerModel: 10, flat: true }
export const MUSICIAN: EquipmentOption = { id: 'musician', name: 'Musician', pointsPerModel: 5, flat: true }
export const COMMAND: EquipmentOption[] = [CHAMPION, STANDARD_BEARER, MUSICIAN]
