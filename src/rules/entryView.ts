import type { Army, EquipmentOption, MagicItem, MountOption, ProfileBlock, UnitProfile } from '../data/types'
import { isWizardLevelId } from '../data/unitOptions'
import { matchesQuery } from '../i18n/lang'

/**
 * Pure per-entry derivations the editor renders. Anything the UI needs to
 * *decide* (eligibility, pairings) lives here so the rule has one statement,
 * shared with validation, and is testable without rendering a component.
 */

/** A unit magic standard must be a non-special banner — Magia p.42. */
export function isValidMagicStandard(item: MagicItem): boolean {
  return item.category === 'banner' && !item.special
}

/**
 * The banners a unit may choose its magic standard from: every valid banner in
 * the army's pool, or none at all when the army list gives the unit no magic
 * standard. The books set no points cap — a banner costs whatever its card says.
 */
export function eligibleMagicStandards(unit: UnitProfile, army: Army): MagicItem[] {
  return unit.magicStandard ? army.magicItems.filter(isValidMagicStandard) : []
}

/**
 * Split a unit's options into the mutually-exclusive wizard-level upgrades
 * (rendered as a radio group) and everything else (checkboxes). One statement
 * of the partition, shared by the editor and the plaintext export.
 */
export function partitionOptions(unit: UnitProfile): {
  levelOptions: EquipmentOption[]
  toggleOptions: EquipmentOption[]
} {
  const options = unit.options ?? []
  return {
    levelOptions: options.filter((o) => isWizardLevelId(o.id)),
    toggleOptions: options.filter((o) => !isWizardLevelId(o.id)),
  }
}

/** Whether the expanded entry has ANY configurable choice to offer. */
export function hasAnyOptions(unit: UnitProfile): boolean {
  return (
    (unit.options?.length ?? 0) > 0 ||
    (unit.mounts?.length ?? 0) > 0 ||
    !!unit.isCharacter ||
    (unit.lores?.length ?? 0) > 0 ||
    !!unit.magicStandard
  )
}

/**
 * The magic-item picker's filter: bilingual name search plus an optional
 * points ceiling (raw input string — '' means no cap).
 */
export function filterMagicItems(items: MagicItem[], query: string, maxPts: string): MagicItem[] {
  const q = query.trim().toLowerCase()
  const cap = maxPts.trim() === '' ? Infinity : Number(maxPts)
  return items.filter((i) => i.points <= cap && matchesQuery(i, q))
}

/**
 * Cavalry pairing: the mount profile shown as a second stat row directly
 * beneath the rider — a regiment's fixed steed (`unit.mount`) or the profile
 * of a character's chosen mount. A chariot mount has no single statLine (it
 * contributes crew / beast / chassis rows instead) and yields undefined.
 */
export function companionMountProfile(
  unit: UnitProfile,
  selectedMount: MountOption | undefined,
): ProfileBlock | undefined {
  return (
    unit.mount ??
    (selectedMount?.statLine
      ? {
          name: selectedMount.name,
          nameEs: selectedMount.nameEs,
          statLine: selectedMount.statLine,
          specialRules: selectedMount.specialRules,
        }
      : undefined)
  )
}
