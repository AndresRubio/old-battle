import {
  RESTRICTED_CATEGORIES,
  type Army,
  type MagicItemCategory,
  type Roster,
  type RuleViolation,
} from '../data/types'
import {
  entryPoints,
  findMagicItem,
  findUnit,
  magicItemAllowance,
  pointsByRole,
  rosterTotalPoints,
} from './points'
import { type Lang, unitName, CATEGORY_LABEL } from '../i18n/lang'

/**
 * Validate a roster against Warhammer 5th edition army-composition and
 * magic-item rules. Returns a list of violations (errors + warnings).
 * Messages are localised via `lang` (defaults to English).
 * See research/composition-5e.md and research/magic-items-5e.md.
 */
export function validateRoster(roster: Roster, army: Army, lang: Lang = 'en'): RuleViolation[] {
  const violations: RuleViolation[] = []
  const limit = roster.pointsLimit
  const { composition } = army
  const es = lang === 'es'
  const name = (unitId: string) => {
    const u = findUnit(army, unitId)
    return u ? unitName(u, lang) : unitId
  }

  // --- Points limit -------------------------------------------------------
  const total = rosterTotalPoints(roster.entries, army)
  if (limit > 0 && total > limit) {
    violations.push({
      severity: 'error',
      rule: 'points-over',
      message: es
        ? `El ejército suma ${total} ptos, ${total - limit} por encima del límite de ${limit} ptos.`
        : `Army is ${total} pts, over the ${limit} pt limit by ${total - limit}.`,
    })
  }

  // --- General ------------------------------------------------------------
  if (composition.requiresGeneral) {
    const generals = roster.entries.filter((e) => e.isGeneral)
    if (generals.length === 0) {
      violations.push({
        severity: 'error',
        rule: 'no-general',
        message: es
          ? 'Todo ejército debe tener un General. Nombra General a un personaje.'
          : 'Every army must have a General. Nominate one character as the General.',
      })
    } else if (generals.length > 1) {
      violations.push({
        severity: 'error',
        rule: 'multiple-generals',
        message: es
          ? `Sólo se permite un General (hay ${generals.length}).`
          : `Only one General is allowed (found ${generals.length}).`,
      })
    }
    for (const g of generals) {
      const unit = findUnit(army, g.unitId)
      if (unit && (unit.canBeGeneral === false || !unit.isCharacter)) {
        violations.push({
          severity: 'error',
          rule: 'invalid-general',
          message: es
            ? `${unitName(unit, lang)} no puede ser el General del ejército.`
            : `${unit.name} cannot be the army General.`,
          entryId: g.id,
        })
      }
    }
  }

  // --- Percentage composition (against the agreed points limit) -----------
  if (limit > 0) {
    const byRole = pointsByRole(roster.entries, army)

    const charMax = Math.floor((composition.maxCharactersPct / 100) * limit)
    if (byRole.character > charMax) {
      violations.push({
        severity: 'warning',
        rule: 'characters-over',
        message: es
          ? `Los personajes usan ${byRole.character} ptos, superando el tope del ${composition.maxCharactersPct}% (${charMax} ptos).`
          : `Characters use ${byRole.character} pts, over the ${composition.maxCharactersPct}% cap (${charMax} pts).`,
      })
    }

    const regMin = Math.ceil((composition.minRegimentsPct / 100) * limit)
    if (byRole.regiment < regMin) {
      violations.push({
        severity: 'warning',
        rule: 'regiments-min',
        message: es
          ? `Los regimientos sólo suman ${byRole.regiment} ptos; se requiere al menos el ${composition.minRegimentsPct}% (${regMin} ptos).`
          : `Regiments are only ${byRole.regiment} pts; at least ${composition.minRegimentsPct}% (${regMin} pts) is required.`,
      })
    }

    // War machines (and chariots) have their own 0-25% cap...
    const warMachines = byRole.warmachine + byRole.chariot
    const wmMax = Math.floor((composition.maxWarMachinesPct / 100) * limit)
    if (warMachines > wmMax) {
      violations.push({
        severity: 'warning',
        rule: 'warmachines-over',
        message: es
          ? `Las máquinas de guerra y carros usan ${warMachines} ptos, superando el tope del ${composition.maxWarMachinesPct}% (${wmMax} ptos).`
          : `War machines & chariots use ${warMachines} pts, over the ${composition.maxWarMachinesPct}% cap (${wmMax} pts).`,
      })
    }

    // ...and monsters have a separate 0-25% cap.
    const monMax = Math.floor((composition.maxMonstersPct / 100) * limit)
    if (byRole.monster > monMax) {
      violations.push({
        severity: 'warning',
        rule: 'monsters-over',
        message: es
          ? `Los monstruos usan ${byRole.monster} ptos, superando el tope del ${composition.maxMonstersPct}% (${monMax} ptos).`
          : `Monsters use ${byRole.monster} pts, over the ${composition.maxMonstersPct}% cap (${monMax} pts).`,
      })
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
      violations.push({
        severity: 'warning',
        rule: 'unit-max',
        message: es
          ? `${name(unitId)}: sólo se permiten ${unit.max}, pero hay ${count} en la lista.`
          : `${unit.name}: only ${unit.max} allowed, but ${count} are in the list.`,
      })
    }
  }

  // 0-N caps that span several unit variants the book treats as one slot
  // (e.g. all Runesmith ranks together). See army.selectionRules.unitGroupCaps.
  for (const group of army.selectionRules?.unitGroupCaps ?? []) {
    const groupTotal = group.ids.reduce((sum, id) => sum + (countByUnit.get(id) ?? 0), 0)
    if (groupTotal > group.max) {
      violations.push({
        severity: 'warning',
        rule: 'unit-group-max',
        message: es
          ? `${group.labelEs}: sólo se permiten ${group.max} en el ejército, pero hay ${groupTotal} en la lista.`
          : `${group.labelEn}: only ${group.max} allowed in the army, but ${groupTotal} are in the list.`,
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
      violations.push({
        severity: 'warning',
        rule: 'unit-ratio-max',
        message: es
          ? `${cap.labelEs}: sólo se permiten ${computed} (hay ${count} en la lista).`
          : `${cap.labelEn}: only ${computed} allowed (${count} in the list).`,
      })
    }
  }

  // Dependencies: a unit may only be included when a prerequisite is present.
  // See army.selectionRules.dependencies.
  for (const dep of army.selectionRules?.dependencies ?? []) {
    if ((countByUnit.get(dep.unitId) ?? 0) === 0) continue
    const satisfied = dep.requiresAnyOf.some((id) => (countByUnit.get(id) ?? 0) > 0)
    if (!satisfied) {
      const prereqNames = dep.requiresAnyOf.map((id) => name(id)).join(' / ')
      violations.push({
        severity: 'warning',
        rule: 'unit-requires',
        message: es
          ? `${dep.labelEs}: requiere ${prereqNames} en el ejército.`
          : `${dep.labelEn}: requires ${prereqNames} in the army.`,
      })
    }
  }

  for (const e of roster.entries) {
    const unit = findUnit(army, e.unitId)
    if (!unit) {
      violations.push({
        severity: 'error',
        rule: 'unknown-unit',
        message: es ? `Unidad desconocida "${e.unitId}" en la lista.` : `Unknown unit "${e.unitId}" in roster.`,
        entryId: e.id,
      })
      continue
    }
    const un = unitName(unit, lang)

    // Unit size
    if (unit.minSize !== undefined && e.size < unit.minSize) {
      violations.push({
        severity: 'warning',
        rule: 'min-size',
        message: es
          ? `${un}: la unidad tiene ${e.size} miniaturas, por debajo del mínimo de ${unit.minSize}.`
          : `${unit.name}: unit has ${e.size} models, below the minimum of ${unit.minSize}.`,
        entryId: e.id,
      })
    }
    if (unit.maxSize !== undefined && e.size > unit.maxSize) {
      violations.push({
        severity: 'warning',
        rule: 'max-size',
        message: es
          ? `${un}: la unidad tiene ${e.size} miniaturas, por encima del máximo de ${unit.maxSize}.`
          : `${unit.name}: unit has ${e.size} models, above the maximum of ${unit.maxSize}.`,
        entryId: e.id,
      })
    }

    // Magic items
    if (e.magicItemIds.length > 0) {
      if (!unit.isCharacter) {
        violations.push({
          severity: 'error',
          rule: 'magic-items-noncharacter',
          message: es
            ? `${un}: sólo los personajes pueden portar objetos mágicos.`
            : `${unit.name}: only characters may carry magic items.`,
          entryId: e.id,
        })
      } else {
        const allowance = magicItemAllowance(e, unit)
        if (e.magicItemIds.length > allowance) {
          violations.push({
            severity: 'warning',
            rule: 'magic-items-count',
            message: es
              ? `${un}: porta ${e.magicItemIds.length} objetos mágicos pero sólo puede llevar ${allowance}.`
              : `${unit.name}: carries ${e.magicItemIds.length} magic items but may carry only ${allowance}.`,
            entryId: e.id,
          })
        }
        // One per restricted category
        const seen = new Map<MagicItemCategory, number>()
        for (const id of e.magicItemIds) {
          const item = findMagicItem(army, id)
          if (!item) continue
          seen.set(item.category, (seen.get(item.category) ?? 0) + 1)
        }
        for (const [cat, n] of seen) {
          if (n > 1 && RESTRICTED_CATEGORIES.has(cat)) {
            violations.push({
              severity: 'warning',
              rule: 'magic-items-category',
              message: es
                ? `${un}: tiene ${n} objetos de tipo "${CATEGORY_LABEL.es[cat]}" pero sólo puede llevar uno.`
                : `${unit.name}: has ${n} ${cat} items but may have only one.`,
              entryId: e.id,
            })
          }
        }
        // FAQ v2.20 §19.5: a character may wear at most one crown and one helm.
        const groupCounts = new Map<'crown' | 'helm', number>()
        for (const id of e.magicItemIds) {
          const g = findMagicItem(army, id)?.exclusiveGroup
          if (g) groupCounts.set(g, (groupCounts.get(g) ?? 0) + 1)
        }
        for (const [g, n] of groupCounts) {
          if (n > 1) {
            violations.push({
              severity: 'warning',
              rule: 'magic-items-exclusive-group',
              message: es
                ? `${un}: un personaje sólo puede llevar ${g === 'crown' ? 'una corona' : 'un yelmo'}.`
                : `${unit.name}: a character may carry only one ${g}.`,
              entryId: e.id,
            })
          }
        }
        // FAQ v2.20 §23.2: only a Battle Standard Bearer may carry a magic banner.
        const carriesBanner = e.magicItemIds.some((id) => findMagicItem(army, id)?.category === 'banner')
        if (carriesBanner && !(e.isBSB || unit.isBSB)) {
          violations.push({
            severity: 'warning',
            rule: 'magic-items-banner-bsb',
            message: es
              ? `${un}: sólo el Portaestandarte de Batalla puede portar un estandarte mágico.`
              : `${unit.name}: only a Battle Standard Bearer may carry a magic standard.`,
            entryId: e.id,
          })
        }
      }
    }

    // Points sanity (defensive — surfaces data bugs)
    void entryPoints(e, army)
  }

  // --- Magic-item uniqueness across the whole army ------------------------
  // 5th ed (Warhammer Magia p.33): the same magic item may not be included in
  // an army more than once. Exceptions are flagged `duplicable` on the item
  // (Dispel Scrolls, Chaos Armour, Familiars).
  const itemUsers = new Map<string, number>()
  for (const e of roster.entries) {
    for (const id of e.magicItemIds) {
      itemUsers.set(id, (itemUsers.get(id) ?? 0) + 1)
    }
  }
  for (const [id, count] of itemUsers) {
    if (count < 2) continue
    const item = findMagicItem(army, id)
    if (!item || item.duplicable) continue
    const itemName = es ? (item.nameEs ?? item.name) : item.name
    violations.push({
      severity: 'error',
      rule: 'magic-items-unique',
      message: es
        ? `${itemName}: objeto mágico duplicado — cada objeto mágico es único y sólo puede incluirse una vez en el ejército (lo llevan ${count} personajes).`
        : `${itemName}: duplicate magic item — each magic item is unique and may appear only once per army (carried by ${count} characters).`,
    })
  }

  return violations
}
