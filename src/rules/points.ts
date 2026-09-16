import type { Army, EquipmentOption, MagicItem, MountOption, RosterEntry, StatLine, UnitProfile, UnitRole } from '../data/types'

export function findUnit(army: Army, unitId: string): UnitProfile | undefined {
  return army.units.find((u) => u.id === unitId)
}

export function findMagicItem(army: Army, itemId: string): MagicItem | undefined {
  return army.magicItems.find((i) => i.id === itemId)
}

/**
 * A host that carries crew: a chariot `MountOption`, or a chariot / war-machine
 * `UnitProfile`. Both price `perCrewman` options off the same two fields.
 */
type Crewed = { baseCrew?: number; options?: EquipmentOption[] }

/**
 * The host's current crew count: its base crew plus one per selected
 * `addsCrewman` option — the basis for `perCrewman` option costs.
 */
function crewCount(host: Crewed, optionIds: string[]): number {
  const extra = (host.options ?? []).filter((o) => optionIds.includes(o.id) && o.addsCrewman).length
  return (host.baseCrew ?? 0) + extra
}

/**
 * `perCrewman` implies a per-ENTRY charge, exactly like `flat`: the rate is
 * already multiplied by the crew count, so it must never also be multiplied by
 * the entry's size. Both kinds therefore route to `flatOptionPoints`.
 */
const isPerEntry = (o: EquipmentOption) => Boolean(o.flat || o.perCrewman)

/** Points contributed per model by the chosen per-model equipment options. */
export function optionPointsPerModel(unit: UnitProfile, optionIds: string[]): number {
  if (!unit.options) return 0
  return unit.options
    .filter((o) => optionIds.includes(o.id) && !isPerEntry(o))
    .reduce((sum, o) => sum + o.pointsPerModel, 0)
}

/**
 * What one fully-equipped rank-and-file model of the unit costs under the
 * current selection — base points plus the per-model equipment bought. For a
 * chariot this is the whole equipped chariot. The basis for `timesModelCost`.
 */
export function equippedModelCost(unit: UnitProfile, optionIds: string[]): number {
  return unit.pointsPerModel + optionPointsPerModel(unit, optionIds)
}

/**
 * Cost of ONE unit option under the current selection — the single accessor for
 * an option's price. A `timesModelCost` option (the command group) is priced as
 * that many equipped rank-and-file models and so moves with the unit's kit; a
 * `perCrewman` option (chariot crew shields/bows) is priced per crewman the
 * entry currently buys; everything else is its fixed `pointsPerModel`. Never
 * read `pointsPerModel` off a unit option directly.
 */
export function unitOptionCost(unit: UnitProfile, option: EquipmentOption, optionIds: string[]): number {
  if (option.timesModelCost) return option.timesModelCost * equippedModelCost(unit, optionIds)
  if (option.perCrewman) return option.pointsPerModel * unitCrewCount(unit, optionIds)
  return option.pointsPerModel
}

/**
 * Points from chosen per-entry options — flat ones (e.g. a command group) and
 * `perCrewman` ones, which carry their own multiplier and so must not be
 * multiplied by the entry's size on top.
 */
export function flatOptionPoints(unit: UnitProfile, optionIds: string[]): number {
  if (!unit.options) return 0
  return unit.options
    .filter((o) => optionIds.includes(o.id) && isPerEntry(o))
    .reduce((sum, o) => sum + unitOptionCost(unit, o, optionIds), 0)
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
  return crewCount(mount, optionIds)
}

/**
 * The unit's own current crew count — the standalone-chariot counterpart of
 * `mountCrewCount`, so a chariot bought as its own entry and the same chariot
 * ridden as a character mount price identically for the same crew and kit.
 */
export function unitCrewCount(unit: UnitProfile, optionIds: string[]): number {
  return crewCount(unit, optionIds)
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
  return mount.options
    .filter((o) => optionIds.includes(o.id))
    .reduce((sum, o) => sum + mountOptionCost(mount, o, optionIds), 0)
}

/**
 * Cost of ONE mount option under the current selection: `perCrewman` options
 * charge per current crew member, everything else is a flat per-entry cost.
 */
export function mountOptionCost(mount: MountOption, option: EquipmentOption, optionIds: string[]): number {
  return option.perCrewman ? option.pointsPerModel * mountCrewCount(mount, optionIds) : option.pointsPerModel
}

/**
 * The unit's characteristic profile after option upgrades. Some options carry a
 * full replacement `statLine` (e.g. O&G shaman wizard levels — the book gives
 * each level its own row, p.81): the LAST selected option (in `optionIds`
 * order) that has one wins; with none selected the base statLine applies.
 * Stale ids that don't exist on the unit are ignored.
 */
export function effectiveStatLine(unit: UnitProfile, optionIds: string[]): StatLine | undefined {
  let result = unit.statLine
  for (const id of optionIds) {
    const opt = unit.options?.find((o) => o.id === id)
    if (opt?.statLine) result = opt.statLine
  }
  return result
}

/** Total points for a single roster entry: models * (base + per-model options) + flat options + mount (+ its options) + magic items. */
export function entryPoints(entry: RosterEntry, army: Army): number {
  const unit = findUnit(army, entry.unitId)
  if (!unit) return 0
  // Only a regiment has a size. Every other role is a single model: the editor
  // renders the size stepper behind the same `role === 'regiment'` test, and
  // defaultSize() hands character / war machine / monster / chariot a 1. A
  // hand-edited or corrupted stored roster can still carry any number, and
  // without this guard the whole equipped cost silently scaled with it.
  const models = unit.role === 'regiment' ? entry.size : 1
  const modelPoints = equippedModelCost(unit, entry.optionIds) * models
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
