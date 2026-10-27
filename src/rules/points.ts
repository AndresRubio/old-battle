import type { Army, EquipmentOption, FixedMagicItem, MagicItem, MountOption, RosterEntry, StatLine, UnitProfile, UnitRole } from '../data/types'

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

/**
 * Points contributed per model by the chosen per-model equipment options. A
 * `counted` option is priced only through `countedOptionPoints`, so a stale id
 * of one in `optionIds` adds nothing here.
 */
export function optionPointsPerModel(unit: UnitProfile, optionIds: string[]): number {
  if (!unit.options) return 0
  return unit.options
    .filter((o) => optionIds.includes(o.id) && !o.counted && !isPerEntry(o))
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
    .filter((o) => optionIds.includes(o.id) && !o.counted && isPerEntry(o))
    .reduce((sum, o) => sum + unitOptionCost(unit, o, optionIds), 0)
}

/**
 * A `counted` option's count as a whole number in `[0, maxCount]` (OLD-63): a
 * missing, negative, non-finite or non-number value is 0 and a fraction is
 * floored. The one statement of the rule, used when a count is stored
 * (`setOptionCount`) and when it is read (`countedOptionCount`).
 */
export function clampOptionCount(option: EquipmentOption, raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return 0
  return Math.min(Math.floor(raw), option.maxCount ?? Infinity)
}

/**
 * How many of a `counted` option the entry buys (OLD-63), clamped by
 * `clampOptionCount` so a hand-edited roster can never price a part-hound or
 * more than the cap. The editor and the export read the count through here
 * too, so all three agree.
 */
export function countedOptionCount(option: EquipmentOption, entry: RosterEntry): number {
  return clampOptionCount(option, entry.optionCounts?.[option.id])
}

/**
 * Points from the unit's `counted` options (OLD-63): `pointsPerModel × N` for
 * each, once per entry. Counts for ids the unit does not offer as counted
 * options are ignored.
 */
export function countedOptionPoints(unit: UnitProfile, entry: RosterEntry): number {
  return (unit.options ?? [])
    .filter((o) => o.counted)
    .reduce((sum, o) => sum + o.pointsPerModel * countedOptionCount(o, entry), 0)
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
export function effectiveStatLine(unit: UnitProfile, optionIds: string[]): Partial<StatLine> | undefined {
  let result = unit.statLine
  for (const id of optionIds) {
    const opt = unit.options?.find((o) => o.id === id)
    if (opt?.statLine) result = opt.statLine
  }
  return result
}

/**
 * Surcharge for a character toggled to act as the army Battle Standard Bearer
 * (`entry.isBSB`): the unit's own `bsbPoints`. A dedicated BSB unit
 * (`unit.isBSB`) already has the cost in its profile, and a unit with no
 * documented `bsbPoints` adds nothing.
 */
export function bsbPoints(unit: UnitProfile, entry: RosterEntry): number {
  return entry.isBSB && unit.canBeBSB && !unit.isBSB ? (unit.bsbPoints ?? 0) : 0
}

/** One magic item an entry carries: a fixed one from the unit's page or one the user picked. */
export interface CarriedMagicItem {
  item: MagicItem
  /** Given by the character's own page (`UnitProfile.fixedMagicItems`): locked on every entry. */
  fixed: boolean
  /** A fixed item the printed headline already prices in. */
  included: boolean
  /** What the item adds to the entry: 0 when included, else the page override or the card price. */
  points: number
}

/** True when the unit's own page fixes this item on every entry (OLD-63). */
export function isFixedMagicItem(unit: UnitProfile, itemId: string): boolean {
  return (unit.fixedMagicItems ?? []).some((f) => f.id === itemId)
}

/** Points of the unit's fixed extras (chariot, monster, companion, rune group). */
export function fixedExtrasPoints(unit: UnitProfile): number {
  return (unit.fixedExtras ?? []).reduce((sum, x) => sum + x.points, 0)
}

/** What a fixed item adds on top of the headline: 0 when included, else the price of its ticked option (OLD-70), the page override or the card price. */
const fixedItemPoints = (f: FixedMagicItem, item: MagicItem, optionIds: string[] = []): number =>
  f.included
    ? 0
    : f.pointsWithOption !== undefined && f.pointsOptionId && optionIds.includes(f.pointsOptionId)
      ? f.pointsWithOption
      : f.points ?? item.points

/**
 * Every magic item the entry carries (OLD-63): the unit's fixed items first,
 * in data order, then the entry's picks that are not fixed. Each id appears
 * once and ids missing from the army's pool are dropped. Fixed items are
 * derived from the unit, never written into the entry, so a saved roster that
 * already ticked one by hand is deduplicated here instead of charged twice.
 */
export function carriedMagicItems(entry: RosterEntry, unit: UnitProfile, army: Army): CarriedMagicItem[] {
  const carried: CarriedMagicItem[] = []
  const seen = new Set<string>()
  for (const f of unit.fixedMagicItems ?? []) {
    const item = findMagicItem(army, f.id)
    if (!item || seen.has(item.id)) continue
    seen.add(item.id)
    carried.push({ item, fixed: true, included: Boolean(f.included), points: fixedItemPoints(f, item, entry.optionIds) })
  }
  for (const id of entry.magicItemIds) {
    const item = findMagicItem(army, id)
    if (!item || seen.has(item.id)) continue
    seen.add(item.id)
    carried.push({ item, fixed: false, included: false, points: item.points })
  }
  return carried
}

/**
 * The magic items the unit's fixed companion carries (OLD-72, Niblit): the
 * entry's `companionMagicItemIds` that are in the army's pool, each once. Empty
 * for a unit with no companion, so a stale id on any other entry costs nothing
 * and is not counted anywhere.
 */
export function companionCarriedItems(entry: RosterEntry, unit: UnitProfile, army: Army): MagicItem[] {
  if (!unit.companionMagicItems) return []
  const out: MagicItem[] = []
  for (const id of entry.companionMagicItemIds ?? []) {
    const item = findMagicItem(army, id)
    if (item && !out.includes(item)) out.push(item)
  }
  return out
}

/**
 * The mount a new entry of this unit starts on (OLD-71): the first of its
 * mounts when the page says he always rides one (`mountRequired`, Imrik's
 * Dragon), otherwise none. `addEntry` seats it and `listedUnitPoints` prices
 * it, both through here, so the picker's price and the added entry agree.
 */
export function defaultMount(unit: UnitProfile): MountOption | undefined {
  return unit.mountRequired ? unit.mounts?.[0] : undefined
}

/**
 * The price the unit picker shows: the headline plus everything the page
 * always charges on top (non-included fixed items, fixed extras, the mount a
 * required-mount character starts on), so a character lists at what he costs
 * once added.
 */
export function listedUnitPoints(unit: UnitProfile, army: Army): number {
  const fixedItems = (unit.fixedMagicItems ?? []).reduce((sum, f) => {
    const item = findMagicItem(army, f.id)
    return sum + (item ? fixedItemPoints(f, item) : 0)
  }, 0)
  return unit.pointsPerModel + fixedItems + fixedExtrasPoints(unit) + (defaultMount(unit)?.points ?? 0)
}

/** Total points for a single roster entry: models * (base + per-model options) + flat options + counted options + BSB surcharge + mount (+ its options) + magic items (fixed and picked) + fixed extras + the companion's items. */
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
  const magicPoints = carriedMagicItems(entry, unit, army).reduce((sum, c) => sum + c.points, 0)
  // A unit's magic standard (carried by its standard bearer) adds its own points.
  const standard = entry.magicStandardId ? findMagicItem(army, entry.magicStandardId) : undefined
  const standardPoints = standard ? standard.points : 0
  const companionPoints = companionCarriedItems(entry, unit, army).reduce((sum, i) => sum + i.points, 0)
  return (
    modelPoints +
    flatPoints +
    countedOptionPoints(unit, entry) +
    bsbPoints(unit, entry) +
    mountPoints(unit, entry.mountId) +
    mountOptionPoints(unit, entry.mountId, entry.optionIds) +
    magicPoints +
    fixedExtrasPoints(unit) +
    standardPoints +
    companionPoints
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
