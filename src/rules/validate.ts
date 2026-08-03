import type { Army, Roster, RuleViolation } from '../data/types'
import { findMagicItem, findUnit, rosterTotalPoints } from './points'
import { summarize } from './summary'
import { entryMagicItemFindings, armyItemUniquenessFindings } from './magicItems'
import { STANDARD_BEARER_ID } from '../data/unitOptions'
import { isValidMagicStandard } from './entryView'
import { toViolation, type Finding, type RuleId, type RuleParams } from './messages'
import type { Lang } from '../i18n/lang'

/**
 * Validate a roster against 5th edition army-composition and
 * magic-item rules. Returns a list of violations (errors + warnings).
 *
 * Rule logic here is language-free: each check raises a typed finding
 * (rule id + params) and `messages.ts` renders the bilingual prose.
 * See research/composition-5e.md and research/magic-items-5e.md.
 */
export function validateRoster(roster: Roster, army: Army, lang: Lang = 'en'): RuleViolation[] {
  const violations: RuleViolation[] = []
  const limit = roster.pointsLimit
  const { composition } = army

  const raise = <K extends RuleId>(
    severity: Finding['severity'],
    rule: K,
    params: RuleParams[K],
    entryId?: string,
  ) => violations.push(toViolation({ severity, rule, params, entryId } as Finding, lang))

  // --- Points limit -------------------------------------------------------
  const total = rosterTotalPoints(roster.entries, army)
  if (limit > 0 && total > limit) {
    raise('error', 'points-over', { total, limit })
  }

  // --- General ------------------------------------------------------------
  if (composition.requiresGeneral) {
    const generals = roster.entries.filter((e) => e.isGeneral)
    if (generals.length === 0) {
      raise('error', 'no-general', {})
    } else if (generals.length > 1) {
      raise('error', 'multiple-generals', { count: generals.length })
    }
    for (const g of generals) {
      const unit = findUnit(army, g.unitId)
      if (unit && (unit.canBeGeneral === false || !unit.isCharacter)) {
        raise('error', 'invalid-general', { unit }, g.id)
      }
    }
  }

  // --- Percentage composition (against the agreed points limit) -----------
  // Thresholds and breach verdicts come from summarize() — the same numbers
  // the summary panel renders, so display and enforcement cannot diverge.
  if (limit > 0) {
    const { caps } = summarize(roster, army)

    if (caps.characters.breached) {
      raise('warning', 'characters-over', { cap: caps.characters })
    }
    if (caps.regiments.breached) {
      raise('warning', 'regiments-min', { cap: caps.regiments })
    }
    // War machines and chariots share one 0-25% cap...
    if (caps.warMachines.breached) {
      raise('warning', 'warmachines-over', { cap: caps.warMachines })
    }
    // ...and monsters have a separate 0-25% cap.
    if (caps.monsters.breached) {
      raise('warning', 'monsters-over', { cap: caps.monsters })
    }
  }

  // --- Per-unit checks: availability, size, magic items -------------------
  const countByUnit = new Map<string, number>()
  for (const e of roster.entries) {
    countByUnit.set(e.unitId, (countByUnit.get(e.unitId) ?? 0) + 1)
  }

  // 0-X availability (report once per offending unit)
  for (const [unitId, count] of countByUnit) {
    const unit = findUnit(army, unitId)
    if (unit && unit.max !== undefined && count > unit.max) {
      raise('warning', 'unit-max', { unit, count })
    }
  }

  // 0-N caps that span several unit variants the book treats as one slot
  // (e.g. all Runesmith ranks together). See army.selectionRules.unitGroupCaps.
  for (const group of army.selectionRules?.unitGroupCaps ?? []) {
    const groupTotal = group.ids.reduce((sum, id) => sum + (countByUnit.get(id) ?? 0), 0)
    if (groupTotal > group.max) {
      raise('warning', 'unit-group-max', {
        labelEn: group.labelEn,
        labelEs: group.labelEs,
        max: group.max,
        count: groupTotal,
      })
    }
  }

  // Ratio caps: a unit's max derived from the points limit and/or the number of
  // other qualifying entries (or their models, when countModels is set on either
  // side). See army.selectionRules.ratioCaps.
  for (const cap of army.selectionRules?.ratioCaps ?? []) {
    // Capped quantity: summed models (entry sizes) when countModels, else entry count.
    const count = cap.countModels
      ? roster.entries.filter((e) => e.unitId === cap.unitId).reduce((s, e) => s + e.size, 0)
      : (countByUnit.get(cap.unitId) ?? 0)
    if (count === 0) continue

    const pointsTermActive = cap.perPoints !== undefined && limit > 0
    const unitTermActive = cap.perUnit !== undefined
    // A points-only cap with no points limit cannot be computed — skip it,
    // consistent with the composition-% checks gated on `limit > 0`.
    if (!pointsTermActive && !unitTermActive && cap.floor === undefined) continue

    let computed = 0
    if (pointsTermActive) computed += Math.floor(limit / cap.perPoints!)
    if (unitTermActive) {
      const pu = cap.perUnit!
      const matching = roster.entries.filter(
        (e) => pu.ids.includes(e.unitId) && (pu.minSize === undefined || e.size >= pu.minSize),
      )
      // Basis: summed models (entry sizes) when countModels, else qualifying entry count.
      const basis = pu.countModels ? matching.reduce((s, e) => s + e.size, 0) : matching.length
      computed += (pu.multiplier ?? 1) * basis
    }
    // A fractional multiplier (e.g. "half the unit, rounding down") can produce a
    // non-integer limit — round down before any clamps (no-op on integer terms).
    computed = Math.floor(computed)
    // floor raises, then absoluteMax caps (absoluteMax applied last → wins).
    if (cap.floor !== undefined) computed = Math.max(computed, cap.floor)
    if (cap.absoluteMax !== undefined) computed = Math.min(computed, cap.absoluteMax)

    if (count > computed) {
      raise('warning', 'unit-ratio-max', {
        labelEn: cap.labelEn,
        labelEs: cap.labelEs,
        allowed: computed,
        count,
      })
    }
  }

  // Dependencies: a unit may only be included when a prerequisite is present.
  // See army.selectionRules.dependencies.
  for (const dep of army.selectionRules?.dependencies ?? []) {
    if ((countByUnit.get(dep.unitId) ?? 0) === 0) continue
    const satisfied =
      dep.requiresAnyOf.some((id) => (countByUnit.get(id) ?? 0) > 0) ||
      (dep.requiresOption !== undefined &&
        roster.entries.some(
          (e) => e.optionIds.includes(dep.requiresOption!) && findUnit(army, e.unitId)?.isCharacter,
        ))
    if (!satisfied) {
      raise('warning', 'unit-requires', {
        labelEn: dep.labelEn,
        labelEs: dep.labelEs,
        requiresLabelEn: dep.requiresLabelEn,
        requiresLabelEs: dep.requiresLabelEs,
        fallbackUnits: dep.requiresAnyOf.map((id) => findUnit(army, id) ?? id),
      })
    }
  }

  for (const e of roster.entries) {
    const unit = findUnit(army, e.unitId)
    if (!unit) {
      raise('error', 'unknown-unit', { unitId: e.unitId }, e.id)
      continue
    }

    // Unit size
    if (unit.minSize !== undefined && e.size < unit.minSize) {
      raise('warning', 'min-size', { unit, size: e.size, minSize: unit.minSize }, e.id)
    }
    if (unit.maxSize !== undefined && e.size > unit.maxSize) {
      raise('warning', 'max-size', { unit, size: e.size, maxSize: unit.maxSize }, e.id)
    }

    // Magic items: count, restricted categories, crown/helm, banner-BSB.
    for (const finding of entryMagicItemFindings(e, unit, army)) {
      violations.push(toViolation(finding, lang))
    }

    // Unit magic standard (carried by a regiment's standard bearer). Only units
    // the army list allows may take one. The books set no points ceiling — the
    // standard simply costs what its card says — so there is no cap to check.
    // See CITATIONS.md — Magic-standard caps.
    if (e.magicStandardId) {
      const item = findMagicItem(army, e.magicStandardId)
      if (!unit.magicStandard) {
        raise('warning', 'magic-standard-not-allowed', { unit }, e.id)
      } else {
        // Only a regiment needs a standard-bearer model. A chariot (or a monster
        // with a howdah) carries the standard itself — Magia p.42.
        if (unit.role === 'regiment' && !e.optionIds.includes(STANDARD_BEARER_ID)) {
          raise('warning', 'magic-standard-no-bearer', { unit }, e.id)
        }
        if (!item || !isValidMagicStandard(item)) {
          raise(
            'warning',
            'magic-standard-invalid-item',
            { unit, item, itemId: e.magicStandardId },
            e.id,
          )
        }
      }
    }

    // Mutually-exclusive options on one model (e.g. the four Marks of Chaos:
    // a model may bear only one). See EquipmentOption.exclusiveGroup.
    const optGroupCounts = new Map<string, number>()
    for (const oid of e.optionIds) {
      const grp = unit.options?.find((o) => o.id === oid)?.exclusiveGroup
      if (grp) optGroupCounts.set(grp, (optGroupCounts.get(grp) ?? 0) + 1)
    }
    for (const [group, count] of optGroupCounts) {
      if (count < 2) continue
      raise('warning', 'options-exclusive-group', { unit, group, count }, e.id)
    }

    // Stale mount options: selections that belong to a mount the character is
    // no longer riding (after a mount change or dismount). They contribute 0
    // points — flag them so the user can clean the entry up.
    const staleByMount = (unit.mounts ?? [])
      .filter((m) => m.id !== e.mountId)
      .map((m) => ({
        mount: m,
        selected: (m.options ?? []).filter((o) => e.optionIds.includes(o.id)),
      }))
      .filter((s) => s.selected.length > 0)
    for (const s of staleByMount) {
      raise('warning', 'mount-options-stale', { unit, mount: s.mount, options: s.selected }, e.id)
    }

    // A mount that requires an option (e.g. a daemonic mount needs the matching
    // Mark of Chaos). See MountOption.requiresOption.
    if (e.mountId) {
      const mount = unit.mounts?.find((m) => m.id === e.mountId)
      if (mount?.requiresOption && !e.optionIds.includes(mount.requiresOption)) {
        raise(
          'warning',
          'mount-requires-option',
          {
            unit,
            mount,
            requiredOption: unit.options?.find((o) => o.id === mount.requiresOption),
            requiredOptionId: mount.requiresOption,
          },
          e.id,
        )
      }
    }
  }

  // --- Magic-item uniqueness across the whole army ------------------------
  for (const finding of armyItemUniquenessFindings(roster.entries, army)) {
    violations.push(toViolation(finding, lang))
  }

  return violations
}
