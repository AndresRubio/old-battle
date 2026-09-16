import type { Army, StatLine, StatNotes } from '../types'

/** The nine characteristic columns, in the canonical M/WS/BS/S/T/W/I/A/Ld order. */
const STAT_KEYS: Array<keyof StatLine> = ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld']

/**
 * Columns a profile neither prints as a number nor explains with a book token
 * (OLD-43). `UnitProfile.statLine` and `MountOption.statLine` are
 * `Partial<StatLine>` so a column whose book value is a token ("5D6", "2-10",
 * "Especial") can be absent and carried in `statNotes` instead — but the type no
 * longer forces completeness, so a plain typo would silently drop a stat and the
 * UI would render "–" as if the book printed a dash. Every one of the nine
 * columns must therefore be accounted for by one side or the other.
 *
 * Deliberately NOT applied to `ProfileBlock`: a chariot chassis legitimately
 * prints only some columns ("Carruaje - - - 7 7 3 1 - -") and renders "–" for
 * the rest, which is exactly what the book shows.
 */
const unaccountedStats = (
  statLine: Partial<StatLine>,
  statNotes: StatNotes | undefined,
): Array<keyof StatLine> =>
  STAT_KEYS.filter((k) => statLine[k] === undefined && statNotes?.[k] === undefined)

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

    // Every characteristic column a unit or a mount claims to have must be
    // either a number or a book token — see `unaccountedStats`.
    if (u.statLine) {
      const missing = unaccountedStats(u.statLine, u.statNotes)
      if (missing.length) {
        fail(`${u.id}: statLine has no value and no statNotes entry for ${missing.join(', ')}`)
      }
    }
    for (const m of u.mounts ?? []) {
      if (!m.statLine) continue
      const missing = unaccountedStats(m.statLine, m.statNotes)
      if (missing.length) {
        fail(`${u.id}/${m.id}: statLine has no value and no statNotes entry for ${missing.join(', ')}`)
      }
    }

    // Mount options share RosterEntry.optionIds with the unit's own options,
    // so every option id must be unique across the unit's WHOLE namespace
    // (unit options + every offered mount's options).
    const optionIds = [
      ...(u.options ?? []).map((o) => o.id),
      ...(u.mounts ?? []).flatMap((m) => (m.options ?? []).map((o) => o.id)),
    ]
    const dupOptions = dupes(optionIds)
    if (dupOptions.length) fail(`${u.id}: colliding option ids: ${dupOptions.join(', ')}`)

    // Crew pricing (OLD-35). A `perCrewman` option costs rate × the host's crew
    // count, so a host that forgets `baseCrew` prices it at rate × 0 — silently
    // free, and invisible in the UI. Require the declaration on any host that
    // uses either crew flag. `perCrewman` is also incoherent on a regiment,
    // whose models are rank and file, not crew.
    const crewOpts = (u.options ?? []).filter((o) => o.perCrewman || o.addsCrewman)
    if (crewOpts.length && u.baseCrew === undefined) {
      fail(`${u.id}: crew options (${crewOpts.map((o) => o.id).join(', ')}) but no baseCrew`)
    }
    const regimentPerCrewman = (u.options ?? []).filter((o) => o.perCrewman && u.role === 'regiment')
    if (regimentPerCrewman.length) {
      fail(`${u.id}: perCrewman option ${regimentPerCrewman[0].id} on a regiment (models are not crew)`)
    }
    for (const m of u.mounts ?? []) {
      const mCrewOpts = (m.options ?? []).filter((o) => o.perCrewman || o.addsCrewman)
      if (mCrewOpts.length && m.baseCrew === undefined) {
        fail(`${u.id}/${m.id}: crew options (${mCrewOpts.map((o) => o.id).join(', ')}) but no baseCrew`)
      }
    }

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
