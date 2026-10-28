import type { Army, StatLine, StatNotes } from '../types'
import { MOVEMENT_CM } from '../movement'

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

  const checkMovement = (where: string, statLine: Partial<StatLine> | undefined) => {
    const M = statLine?.M
    if (M !== undefined && MOVEMENT_CM[M] === undefined) {
      fail(`${where}: Movement ${M}" has no centimetre equivalent in MOVEMENT_CM`)
    }
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

  const itemIds = new Set(army.magicItems.map((i) => i.id))
  for (const u of army.units) {
    if (u.pointsPerModel < 0) fail(`${u.id}: negative pointsPerModel`)

    // A BSB surcharge (OLD-64) only means something on a character who may
    // OPTIONALLY become the BSB — a dedicated BSB unit has it in its base cost.
    if (u.bsbPoints !== undefined) {
      if (!u.canBeBSB || u.isBSB) fail(`${u.id}: bsbPoints needs canBeBSB and no isBSB`)
      if (u.bsbPoints < 0) fail(`${u.id}: negative bsbPoints`)
    }

    // OLD-73: a free BSB banner only means something on a character who can be the BSB.
    if (u.bsbBannerFree && !u.canBeBSB) fail(`${u.id}: bsbBannerFree needs canBeBSB`)

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

    // Every M the data holds must have the centimetre value the Spanish books
    // print for it (OLD-46): the Spanish stat strip reads it off MOVEMENT_CM,
    // and an unmapped inch value has no book figure to show. Covers every
    // profile that can carry an M — own, option replacement, cavalry steed,
    // character mount and display profiles.
    checkMovement(u.id, u.statLine)
    for (const o of u.options ?? []) {
      checkMovement(`${u.id}/${o.id}`, o.statLine)
      for (const p of o.profiles ?? []) checkMovement(`${u.id}/${o.id}/${p.name}`, p.statLine)
    }
    for (const p of u.profiles ?? []) checkMovement(`${u.id}/${p.name}`, p.statLine)
    if (u.mount) checkMovement(`${u.id}/${u.mount.name}`, u.mount.statLine)
    for (const m of u.mounts ?? []) {
      checkMovement(`${u.id}/${m.id}`, m.statLine)
      for (const o of m.options ?? []) checkMovement(`${u.id}/${m.id}/${o.id}`, o.statLine)
      for (const p of m.profiles ?? []) checkMovement(`${u.id}/${m.id}/${p.name}`, p.statLine)
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
    // Counted options (OLD-63) are bought N times and priced pointsPerModel × N
    // once per entry. Any other pricing flag would be silently ignored, and a
    // regiment's per-model price already multiplies by its size.
    for (const o of u.options ?? []) {
      // A negative price (Sturmjarl's card prices, -5) is charged once. Per model
      // or per count it would scale with the unit size or the count.
      if (o.pointsPerModel < 0 && !o.flat) fail(`${u.id}/${o.id}: negative option price on a non-flat option`)
      if (o.maxCount !== undefined && !o.counted) fail(`${u.id}/${o.id}: maxCount without counted`)
      if (!o.counted) continue
      if (o.maxCount !== undefined && !(Number.isInteger(o.maxCount) && o.maxCount >= 0)) {
        fail(`${u.id}/${o.id}: maxCount must be a whole number >= 0`)
      }
      if (u.role === 'regiment') fail(`${u.id}/${o.id}: counted option on a regiment`)
      for (const flag of ['flat', 'perCrewman', 'timesModelCost'] as const) {
        if (o[flag]) fail(`${u.id}/${o.id}: counted option sets ${flag}`)
      }
    }

    // OLD-73: an option that needs another, or prices itself off another, must name a
    // different option of the same unit, or the rule would never be met.
    const ownOptionIds = new Set((u.options ?? []).map((o) => o.id))
    for (const o of u.options ?? []) {
      if (o.requiresOptionId && (o.requiresOptionId === o.id || !ownOptionIds.has(o.requiresOptionId))) {
        fail(`${u.id}/${o.id}: requiresOptionId ${o.requiresOptionId} is not an option of the unit`)
      }
      const w = o.timesTrooperCost?.withOptionId
      if (w !== undefined && !ownOptionIds.has(w)) {
        fail(`${u.id}/${o.id}: timesTrooperCost.withOptionId ${w} is not an option of the unit`)
      }
    }

    for (const m of u.mounts ?? []) {
      // Mount options are toggles priced by mountOptionPoints, which has no counts.
      for (const o of m.options ?? []) {
        if (o.counted || o.maxCount !== undefined) {
          fail(`${u.id}/${m.id}/${o.id}: counted options are not supported on mounts`)
        }
        // OLD-71: option profiles are shown for unit options only.
        if (o.profiles) fail(`${u.id}/${m.id}/${o.id}: option profiles are not supported on mounts`)
      }
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
    // OLD-71: a required mount needs mounts to choose from, or every entry
    // would warn with no way to clear it.
    if (u.mountRequired && !u.mounts?.length) fail(`${u.id}: mountRequired without mounts`)
    // OLD-71: a character the page makes the General must be one who can be.
    if (u.mustBeGeneral && (!u.isCharacter || u.canBeGeneral === false)) {
      fail(`${u.id}: mustBeGeneral on a unit that cannot be the General`)
    }

    // Fixed magic items and fixed extras (OLD-63): a character's own page
    // prices them on every entry, so a dangling id would silently price 0 and
    // a duplicate would charge twice.
    if (u.fixedMagicItems) {
      if (!u.isCharacter) fail(`${u.id}: has fixed magic items but is not a character`)
      for (const f of u.fixedMagicItems) {
        if (!itemIds.has(f.id)) fail(`${u.id}: fixed magic item ${f.id} is not in the army's magic items`)
        if (f.points !== undefined && f.included) {
          fail(`${u.id}/${f.id}: fixed magic item sets both points and included`)
        }
        if (f.points !== undefined && f.points < 0) fail(`${u.id}/${f.id}: negative fixed magic item points`)
        // OLD-70: the card-price switch needs both halves, and the option must exist.
        if ((f.pointsWithOption === undefined) !== (f.pointsOptionId === undefined)) {
          fail(`${u.id}/${f.id}: pointsWithOption and pointsOptionId go together`)
        } else if (f.pointsOptionId !== undefined && !(u.options ?? []).some((o) => o.id === f.pointsOptionId)) {
          fail(`${u.id}/${f.id}: pointsOptionId ${f.pointsOptionId} is not an option of the unit`)
        }
      }
      const dupFixed = dupes(u.fixedMagicItems.map((f) => f.id))
      if (dupFixed.length) fail(`${u.id}: duplicate fixed magic items: ${dupFixed.join(', ')}`)
    }
    if (u.fixedExtras) {
      // OLD-73: named apart because it would also raise magic-items-noncharacter at runtime.
      const runes = u.fixedExtras.find((x) => x.magicItem)
      if (runes && !u.isCharacter) {
        fail(`${u.id}/${runes.id}: magic-item fixed extra on a unit that is not a character`)
      }
      if (!u.isCharacter) fail(`${u.id}: has fixed extras but is not a character`)
      for (const x of u.fixedExtras) {
        if (x.points < 0) fail(`${u.id}/${x.id}: negative fixed extra points`)
        if (!x.name.trim()) fail(`${u.id}/${x.id}: fixed extra has no name`)
      }
      const dupExtras = dupes(u.fixedExtras.map((x) => x.id))
      if (dupExtras.length) fail(`${u.id}: duplicate fixed extra ids: ${dupExtras.join(', ')}`)
      // OLD-69: master runes on a rune group join army uniqueness, so each must
      // be a real pool item, and only a runic item (a magic item) carries runes.
      for (const x of u.fixedExtras) {
        if (x.uniqueItemIds && !x.magicItem) {
          fail(`${u.id}/${x.id}: uniqueItemIds on a fixed extra that is not a magic item`)
        }
        for (const id of x.uniqueItemIds ?? []) {
          if (!itemIds.has(id)) fail(`${u.id}/${x.id}: unique item ${id} is not in the army's magic items`)
        }
      }
    }
    // OLD-69: the page's allow-list. A dangling id would grey out nothing and
    // name a missing item in the warning; a fixed id is already carried.
    if (u.allowedMagicItems) {
      if (!u.isCharacter) fail(`${u.id}: has allowed magic items but is not a character`)
      for (const id of u.allowedMagicItems) {
        if (!itemIds.has(id)) fail(`${u.id}: allowed magic item ${id} is not in the army's magic items`)
        if ((u.fixedMagicItems ?? []).some((f) => f.id === id)) {
          fail(`${u.id}: allowed magic item ${id} is already a fixed item`)
        }
      }
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
