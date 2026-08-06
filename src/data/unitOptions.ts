import type { EquipmentOption } from './types'

/**
 * Option-identity conventions — owned HERE, nowhere else.
 *
 * `standard` / `musician` are injected by `withCommandGroups` (armies/index.ts)
 * and the `wizard-l<N>` id shape is shared by every army file's wizard-level
 * options. Any module that needs to recognise one of these identities imports
 * the helpers below; never re-state the literal or the prefix at a call site.
 */
export const STANDARD_BEARER_ID = 'standard'
export const MUSICIAN_ID = 'musician'
const WIZARD_LEVEL_PREFIX = 'wizard-l'
/** True for the mutually-exclusive wizard-level upgrade options. */
export function isWizardLevelId(optionId: string): boolean {
  return optionId.startsWith(WIZARD_LEVEL_PREFIX)
}
/** Numeric level of a `wizard-l<N>` option id, or undefined for other options. */
export function wizardLevelOf(optionId: string): number | undefined {
  return isWizardLevelId(optionId) ? Number(optionId.slice(WIZARD_LEVEL_PREFIX.length)) : undefined
}

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
 * DOUBLE a rank-and-file model, counting that model's equipment: "Include the
 * cost of all of the equipment for a rank and file member of the unit before
 * doubling it" (FAQ 1996 §3.3/§3.5, citing Warhammer Armies p.2). They are
 * therefore declared with `timesModelCost` and priced from the entry's current
 * selection by `unitOptionCost` — `pointsPerModel` stays 0 and must not be read.
 *
 * There is NO unit-champion option — champions are separate paladin / hero /
 * commander character entries bought from the Characters allowance.
 *
 * A chariot gets NO command group: it carries its standard itself and its cost
 * is expressly not doubled — "el valor del estandarte deberá añadirse al del
 * carruaje, pero el valor del carruaje no deberá duplicarse" (Magia printed
 * 42). That book rule outranks the 1996 FAQ §5.1.4 answer, which prices a
 * chariot standard bearer at double the whole chariot. See CITATIONS.md.
 */
export const COMMAND_OPTIONS: EquipmentOption[] = [
  { id: STANDARD_BEARER_ID, name: 'Standard Bearer', pointsPerModel: 0, timesModelCost: 2, flat: true },
  { id: MUSICIAN_ID, name: 'Musician', pointsPerModel: 0, timesModelCost: 2, flat: true },
]
