import { MAGIC_ITEM_ALLOWANCE } from '../data/types'
import type { Army, MagicItem, RosterEntry, UnitProfile, UnitRole } from '../data/types'

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

/** Total points for a single roster entry: models * (base + per-model options) + flat options + magic items. */
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
  return modelPoints + flatPoints + magicPoints
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
