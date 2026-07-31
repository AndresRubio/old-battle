import type { Army, MagicItem, MountOption, ProfileBlock, UnitProfile } from '../data/types'

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
