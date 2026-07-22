import { MAGIC_ITEM_ALLOWANCE } from '../data/types'
import type { Army, MagicItem, MountOption, RosterEntry, UnitProfile, UnitRole } from '../data/types'

export function findUnit(army: Army, unitId: string): UnitProfile | undefined {
  return army.units.find((u) => u.id === unitId)
}

export function findMagicItem(army: Army, itemId: string): MagicItem | undefined {
  return army.magicItems.find((i) => i.id === itemId)
}

/** Points contributed per model by the chosen per-model equipment options. */
export function optionPointsPerModel(unit: UnitProfile, optionIds: string[]): number {
  if (!unit.options) return 0
  return unit.options
    .filter((o) => optionIds.includes(o.id) && !o.flat)
    .reduce((sum, o) => sum + o.pointsPerModel, 0)
}

/** Points from chosen flat (per-unit) options, e.g. a command group. */
export function flatOptionPoints(unit: UnitProfile, optionIds: string[]): number {
  if (!unit.options) return 0
  return unit.options
    .filter((o) => optionIds.includes(o.id) && o.flat)
    .reduce((sum, o) => sum + o.pointsPerModel, 0)
}

/** Points from the chosen mount (flat — a character rides one mount). */
export function mountPoints(unit: UnitProfile, mountId: string | undefined): number {
  if (!mountId || !unit.mounts) return 0
  const mount = unit.mounts.find((m) => m.id === mountId)
  return mount ? mount.points : 0
}

/**
 * The mount's current crew count: its base crew plus one per selected
 * `addsCrewman` option — the basis for `perCrewman` option costs.
 */
export function mountCrewCount(mount: MountOption, optionIds: string[]): number {
  const extra = (mount.options ?? []).filter((o) => optionIds.includes(o.id) && o.addsCrewman).length
  return (mount.baseCrew ?? 0) + extra
}

/**
 * Points from the chosen mount's own selected options (e.g. a chariot's extra
 * crew or scythed wheels). Charged once per entry — never multiplied by unit
 * size; `perCrewman` options are multiplied by the mount's current crew count.
 * Selections that belong to a mount the character is NOT riding contribute 0
 * (and are flagged by validation as `mount-options-stale`).
 */
export function mountOptionPoints(unit: UnitProfile, mountId: string | undefined, optionIds: string[]): number {
  if (!mountId || !unit.mounts) return 0
  const mount = unit.mounts.find((m) => m.id === mountId)
  if (!mount?.options) return 0
  const crew = mountCrewCount(mount, optionIds)
  return mount.options
    .filter((o) => optionIds.includes(o.id))
    .reduce((sum, o) => sum + (o.perCrewman ? o.pointsPerModel * crew : o.pointsPerModel), 0)
}

/** Total points for a single roster entry: models * (base + per-model options) + flat options + mount (+ its options) + magic items. */
export function entryPoints(entry: RosterEntry, army: Army): number {
  const unit = findUnit(army, entry.unitId)
  if (!unit) return 0
  const perModel = unit.pointsPerModel + optionPointsPerModel(unit, entry.optionIds)
  const modelPoints = perModel * entry.size
  const flatPoints = flatOptionPoints(unit, entry.optionIds)
  const magicPoints = entry.magicItemIds.reduce((sum, id) => {
    const item = findMagicItem(army, id)
    return sum + (item ? item.points : 0)
  }, 0)
  // A unit's magic standard (carried by its standard bearer) adds its own points.
  const standard = entry.magicStandardId ? findMagicItem(army, entry.magicStandardId) : undefined
  const standardPoints = standard ? standard.points : 0
  return (
    modelPoints +
    flatPoints +
    mountPoints(unit, entry.mountId) +
    mountOptionPoints(unit, entry.mountId, entry.optionIds) +
    magicPoints +
    standardPoints
  )
}

export function rosterTotalPoints(entries: RosterEntry[], army: Army): number {
  return entries.reduce((sum, e) => sum + entryPoints(e, army), 0)
}

/** Points spent per battlefield role. */
export function pointsByRole(entries: RosterEntry[], army: Army): Record<UnitRole, number> {
  const totals: Record<UnitRole, number> = {
    character: 0,
    regiment: 0,
    monster: 0,
    warmachine: 0,
    chariot: 0,
  }
  for (const entry of entries) {
    const unit = findUnit(army, entry.unitId)
    if (!unit) continue
    totals[unit.role] += entryPoints(entry, army)
  }
  return totals
}

/** Effective magic-item allowance for a character entry (rank + any option deltas). */
export function magicItemAllowance(entry: RosterEntry, unit: UnitProfile): number {
  const base = unit.characterRank ? MAGIC_ITEM_ALLOWANCE[unit.characterRank] : 0
  const delta = (unit.options ?? [])
    .filter((o) => entry.optionIds.includes(o.id) && o.magicItemSlotsDelta)
    .reduce((sum, o) => sum + (o.magicItemSlotsDelta ?? 0), 0)
  return base + delta
}
