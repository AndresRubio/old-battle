import type { Army } from '../types'

/**
 * Construction-time integrity for assembled armies. Runs once per army at
 * module load (armies/index.ts) and THROWS on a malformed army, so a bad id,
 * a mount-option namespace collision or a dangling selection-rule reference
 * fails the moment the data is imported — in dev, in tests, in the build —
 * instead of only when armies.test.ts happens to run.
 *
 * These are the mechanical invariants of the data format. Domain-semantic
 * expectations (a possible General exists, cavalry carries a mount profile,
 * book-accurate statlines…) stay in armies.test.ts.
 */
export function assertArmyIntegrity(army: Army): Army {
  const fail = (msg: string): never => {
    throw new Error(`army data integrity [${army.id}]: ${msg}`)
  }

  const dupes = (ids: string[]): string[] => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const id of ids) {
      if (seen.has(id)) out.push(id)
      seen.add(id)
    }
    return out
  }

  // Unique unit and magic-item ids across the army.
  const dupUnits = dupes(army.units.map((u) => u.id))
  if (dupUnits.length) fail(`duplicate unit ids: ${dupUnits.join(', ')}`)
  const dupItems = dupes(army.magicItems.map((i) => i.id))
  if (dupItems.length) fail(`duplicate magic-item ids: ${dupItems.join(', ')}`)

  for (const u of army.units) {
    if (u.pointsPerModel < 0) fail(`${u.id}: negative pointsPerModel`)

    // Mount options share RosterEntry.optionIds with the unit's own options,
    // so every option id must be unique across the unit's WHOLE namespace
    // (unit options + every offered mount's options).
    const optionIds = [
      ...(u.options ?? []).map((o) => o.id),
      ...(u.mounts ?? []).flatMap((m) => (m.options ?? []).map((o) => o.id)),
    ]
    const dupOptions = dupes(optionIds)
    if (dupOptions.length) fail(`${u.id}: colliding option ids: ${dupOptions.join(', ')}`)

    if (u.mounts) {
      const dupMounts = dupes(u.mounts.map((m) => m.id))
      if (dupMounts.length) fail(`${u.id}: duplicate mount ids: ${dupMounts.join(', ')}`)
      for (const m of u.mounts) {
        if (m.points < 0) fail(`${u.id}/${m.id}: negative mount points`)
      }
      // Only characters ride mounts.
      if (!u.isCharacter) fail(`${u.id}: has mounts but is not a character`)
    }
  }

  // Every item this army exposes must be either common (no restrictedTo) or
  // explicitly allowed for this army id — an army-unique item must never leak
  // into another army's pool. A `special` item with no restriction would
  // appear in every army.
  for (const i of army.magicItems) {
    if (i.restrictedTo && i.restrictedTo.length > 0 && !i.restrictedTo.includes(army.id)) {
      fail(`magic item ${i.id} is restricted to ${i.restrictedTo.join(', ')}, not this army`)
    }
    if (i.special && (!i.restrictedTo || i.restrictedTo.length === 0)) {
      fail(`special-character item ${i.id} has no army restriction`)
    }
  }

  // Selection rules must reference real units.
  const unitIds = new Set(army.units.map((u) => u.id))
  for (const cap of army.selectionRules?.ratioCaps ?? []) {
    if (!unitIds.has(cap.unitId)) fail(`ratioCap references unknown unit ${cap.unitId}`)
    for (const id of cap.perUnit?.ids ?? []) {
      if (!unitIds.has(id)) fail(`ratioCap for ${cap.unitId} references unknown unit ${id}`)
    }
  }
  for (const group of army.selectionRules?.unitGroupCaps ?? []) {
    for (const id of group.ids) {
      if (!unitIds.has(id)) fail(`unitGroupCap "${group.labelEn}" references unknown unit ${id}`)
    }
  }
  for (const dep of army.selectionRules?.dependencies ?? []) {
    if (!unitIds.has(dep.unitId)) fail(`dependency references unknown unit ${dep.unitId}`)
    if (dep.requiresAnyOf.length === 0) fail(`dependency for ${dep.unitId} requires nothing`)
    for (const id of dep.requiresAnyOf) {
      if (!unitIds.has(id)) fail(`dependency for ${dep.unitId} references unknown unit ${id}`)
    }
  }

  return army
}
