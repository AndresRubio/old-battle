import type { Army, EquipmentOption, Roster, RosterEntry, StatLine, StatNotes, UnitProfile } from '../data/types'
import { type CarriedMagicItem, bsbPoints, carriedMagicItems, countedOptionCount, effectiveStatLine, entryPoints, findMagicItem, findUnit, unitOptionCost } from './points'
import { summarize } from './summary'
import { validateRoster } from './validate'
import {
  type Lang,
  GROUP_LABEL,
  GROUP_ORDER,
  STAT_LABEL,
  unitGroup,
  armyName,
  unitName,
  optionText,
  mountName,
  profileName,
  magicItemName,
  magicItemDesc,
  fixedExtraName,
  ruleText,
  wizardLevelLabel,
  t,
} from '../i18n/lang'
import { isWizardLevelId } from '../data/unitOptions'
import { companionMountProfile, partitionOptions, resolveStatNotes, shownProfiles, signedPoints, statCell } from './entryView'

/**
 * An option's label with its price, formatted exactly as the editor shows it:
 * a per-model price on a regiment carries the "/model" suffix so a 1/model
 * shield is not read as 1 point total. Flat and per-crewman options, and every
 * option on a single-model entry (character, chariot, war machine), print a
 * plain total.
 */
function optionLabel(
  unit: UnitProfile,
  option: EquipmentOption,
  optionIds: string[],
  lang: Lang,
): string {
  const name = isWizardLevelId(option.id) ? wizardLevelLabel(option.id, lang) : optionText(option.name, lang)
  const perModel = unit.role === 'regiment' && !option.flat && !option.perCrewman ? t('perModel', lang) : ''
  return `${name} (${signedPoints(unitOptionCost(unit, option, optionIds))} ${t('pts', lang)}${perModel})`
}

/**
 * A carried magic item as the editor shows it: its price ("included" when the
 * headline already contains it) and, for an item the character's own page
 * fixes (OLD-63), the "fixed" tag.
 */
function carriedItemLabel(c: CarriedMagicItem, lang: Lang): string {
  const price = c.included ? t('includedInCost', lang) : `${c.points} ${t('pts', lang)}`
  const tag = c.fixed ? ` [${t('fixedItem', lang)}]` : ''
  return `${magicItemName(c.item, lang)} (${price})${tag}`
}

/**
 * The entry's counted options (OLD-63) bought at least once, one
 * `<name> ×N (+total pts)` label each.
 */
function countedOptionLabels(unit: UnitProfile, entry: RosterEntry, lang: Lang): string[] {
  return partitionOptions(unit).countedOptions.flatMap((o) => {
    const n = countedOptionCount(o, entry)
    return n > 0 ? [`${optionText(o.name, lang)} ×${n} (+${o.pointsPerModel * n} ${t('pts', lang)})`] : []
  })
}

/** The unit's options the entry toggled on. A counted option is never one, even as a stale id in optionIds. */
const toggledOptions = (unit: UnitProfile, optionIds: string[]): EquipmentOption[] =>
  (unit.options ?? []).filter((o) => optionIds.includes(o.id) && !o.counted)

/** The unit's fixed extras (OLD-63), one `+ <name> (+N pts)` label each. */
function fixedExtraLabels(unit: UnitProfile, lang: Lang): string[] {
  return (unit.fixedExtras ?? []).map((x) => `+ ${fixedExtraName(x, lang)} (+${x.points} ${t('pts', lang)})`)
}

/** The nine characteristic columns, in the canonical M/WS/BS/S/T/W/I/A/Ld order. */
const STAT_KEYS = ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld'] as const
const STAT_COL = 4

/**
 * A quick-reference characteristic table (monospace-aligned): a header row of
 * localized stat labels and a row of values. Absent stats render as "–", and a
 * resolved `notes` entry prints the book's own token ("5D6", "1D6", "2-10",
 * "Especial") in its column instead of a number (`statCell` owns that rule,
 * shared with the editor's stat strip).
 * An optional `label` (mount / chariot profile) is printed above the rows.
 *
 * Columns are sized to their own content, so a wide cell ("1D6+2") pushes its
 * column out instead of shunting the header and value rows out of alignment.
 */
function statTableLines(
  statLine: Partial<StatLine>,
  lang: Lang,
  label?: string,
  notes?: StatNotes,
): string[] {
  const lines: string[] = []
  if (label) lines.push(`  · ${label}`)
  const cells = STAT_KEYS.map((k) => statCell(k, statLine, lang, notes))
  const widths = STAT_KEYS.map((k, i) =>
    Math.max(STAT_COL, STAT_LABEL[lang][k].length + 1, cells[i].length + 1),
  )
  lines.push('  ' + STAT_KEYS.map((k, i) => STAT_LABEL[lang][k].padEnd(widths[i])).join('').trimEnd())
  lines.push('  ' + cells.map((c, i) => c.padEnd(widths[i])).join('').trimEnd())
  return lines
}

/**
 * A full detail block for one roster entry: total points, the quick-reference
 * stat table (plus any mount / chariot profiles), selected options, special
 * abilities, and magic items with their points and rules text.
 */
function unitDetailBlock(entry: RosterEntry, army: Army, lang: Lang): string[] {
  const unit = findUnit(army, entry.unitId)
  if (!unit) return []
  const lines: string[] = []

  const isRegiment = unit.role === 'regiment'
  const prefix = isRegiment ? `${entry.size}x ` : ''
  const star = entry.isGeneral ? `[${t('general', lang)}] ` : ''
  lines.push('')
  lines.push(`${star}${prefix}${unitName(unit, lang)} — ${entryPoints(entry, army)} ${t('pts', lang)}`)

  // Some options (e.g. O&G shaman wizard levels) replace the whole statLine.
  const statLine = effectiveStatLine(unit, entry.optionIds)
  if (statLine) lines.push(...statTableLines(statLine, lang, undefined, resolveStatNotes(unit, lang)))
  // The mount row directly beneath the rider, paired exactly as the editor
  // pairs it: a cavalry regiment's fixed steed, or the profile of the
  // character's chosen mount — whose label also carries the mount's cost.
  const mount = entry.mountId ? (unit.mounts ?? []).find((m) => m.id === entry.mountId) : undefined
  const mountLabel = mount ? `${mountName(mount, lang)} (+${mount.points} ${t('pts', lang)})` : undefined
  const companion = companionMountProfile(unit, mount)
  if (companion) {
    const label = companion === unit.mount ? profileName(companion, lang) : mountLabel
    lines.push(...statTableLines(companion.statLine, lang, label, resolveStatNotes(companion, lang)))
  }
  // Extra display-only profiles: chariot crew / chassis / draught beasts, a
  // companion, and those of the options bought (OLD-71), as the editor shows them.
  for (const p of shownProfiles(unit, entry)) {
    lines.push(...statTableLines(p.statLine, lang, profileName(p, lang), resolveStatNotes(p, lang)))
  }
  // A chariot mount has no single statline: it contributes its crew /
  // draught-beast / chassis rows instead, under its own label.
  if (mount && !mount.statLine) lines.push(`  · ${mountLabel}`)
  for (const p of mount?.profiles ?? []) {
    lines.push(...statTableLines(p.statLine, lang, profileName(p, lang), resolveStatNotes(p, lang)))
  }

  // Selected equipment options (wizard levels labelled as in the summary),
  // plus the chosen mount's own selected options (e.g. a chariot's crew).
  const opts = toggledOptions(unit, entry.optionIds)
  const counted = countedOptionLabels(unit, entry, lang)
  const mountOpts = (mount?.options ?? []).filter((o) => entry.optionIds.includes(o.id))
  if (opts.length > 0 || counted.length > 0 || mountOpts.length > 0) {
    const labels = [
      ...opts.map((o) => optionLabel(unit, o, entry.optionIds, lang)),
      ...counted,
      ...mountOpts.map((o) => optionText(o.name, lang)),
    ]
    lines.push(`  ${t('options', lang)}: ${labels.join(', ')}`)
  }

  if (unit.specialRules && unit.specialRules.length > 0) {
    const rules = unit.specialRules.map((r) => ruleText(r, lang))
    lines.push(`  ${t('specialAbilities', lang)}: ${rules.join(', ')}`)
  }

  const extras = fixedExtraLabels(unit, lang)
  if (extras.length > 0) {
    lines.push(`  ${t('fixedEquipment', lang)}:`)
    for (const x of extras) lines.push(`    ${x}`)
  }

  const items = carriedMagicItems(entry, unit, army)
  if (items.length > 0) {
    lines.push(`  ${t('magicItems', lang)}:`)
    for (const c of items) {
      const desc = magicItemDesc(c.item, lang)
      lines.push(`    * ${carriedItemLabel(c, lang)}${desc ? ` — ${desc}` : ''}`)
    }
  }

  // The unit's magic standard (carried by its standard bearer).
  const standard = entry.magicStandardId ? findMagicItem(army, entry.magicStandardId) : undefined
  if (standard) {
    const desc = magicItemDesc(standard, lang)
    lines.push(`  ${t('magicStandard', lang)}:`)
    lines.push(
      `    * ${magicItemName(standard, lang)} (${standard.points} ${t('pts', lang)})${desc ? ` — ${desc}` : ''}`,
    )
  }
  return lines
}

/** Render a roster as a clean, copy-pasteable plaintext army list. */
export function exportRosterText(roster: Roster, army: Army, lang: Lang = 'en'): string {
  const lines: string[] = []
  const s = summarize(roster, army)
  const es = lang === 'es'

  lines.push(roster.name)
  lines.push(`${armyName(army, lang)} — ${es ? 'Old Battle · 5ª Edición' : 'Old Battle · 5th Edition'}`)
  lines.push(`${s.total} / ${s.limit} ${t('pts', lang)}`)
  lines.push('='.repeat(40))

  for (const group of GROUP_ORDER) {
    const entries = roster.entries.filter((e) => {
      const u = findUnit(army, e.unitId)
      return u ? unitGroup(u) === group : false
    })
    if (entries.length === 0) continue
    lines.push('')
    lines.push(`-- ${GROUP_LABEL[lang][group].toUpperCase()} --`)
    for (const e of entries) {
      const unit = findUnit(army, e.unitId)
      if (!unit) continue
      const isRegiment = unit.role === 'regiment'
      const prefix = isRegiment ? `${e.size}x ` : ''
      const star = e.isGeneral ? `[${t('general', lang)}] ` : ''
      lines.push(`${star}${prefix}${unitName(unit, lang)} ............ ${entryPoints(e, army)} ${t('pts', lang)}`)

      for (const o of toggledOptions(unit, e.optionIds)) {
        lines.push(`    + ${optionLabel(unit, o, e.optionIds, lang)}`)
      }
      for (const c of countedOptionLabels(unit, e, lang)) lines.push(`    + ${c}`)
      const bsb = bsbPoints(unit, e)
      if (bsb > 0) lines.push(`    + ${t('battleStandard', lang)} (+${bsb} ${t('pts', lang)})`)
      const mount = e.mountId ? (unit.mounts ?? []).find((m) => m.id === e.mountId) : undefined
      if (mount) {
        lines.push(`    + ${mountName(mount, lang)} (+${mount.points} ${t('pts', lang)})`)
        for (const o of (mount.options ?? []).filter((mo) => e.optionIds.includes(mo.id))) {
          lines.push(`      + ${optionText(o.name, lang)}`)
        }
      }
      for (const x of fixedExtraLabels(unit, lang)) lines.push(`    ${x}`)
      for (const c of carriedMagicItems(e, unit, army)) lines.push(`    * ${carriedItemLabel(c, lang)}`)
      const std = e.magicStandardId ? findMagicItem(army, e.magicStandardId) : undefined
      if (std) lines.push(`    * ${magicItemName(std, lang)} (${std.points} ${t('pts', lang)})`)
    }
  }

  // --- Detailed per-unit reference: stats, options, abilities, magic items ---
  const detailLines: string[] = []
  for (const group of GROUP_ORDER) {
    const entries = roster.entries.filter((e) => {
      const u = findUnit(army, e.unitId)
      return u ? unitGroup(u) === group : false
    })
    for (const e of entries) detailLines.push(...unitDetailBlock(e, army, lang))
  }
  if (detailLines.length > 0) {
    lines.push('')
    lines.push('='.repeat(40))
    lines.push(t('unitDetails', lang).toUpperCase())
    lines.push('='.repeat(40))
    lines.push(...detailLines)
  }

  const violations = validateRoster(roster, army, lang)
  if (violations.length > 0) {
    lines.push('')
    lines.push(`-- ${t('musterCheck', lang).toUpperCase()} --`)
    for (const v of violations) {
      lines.push(`${v.severity === 'error' ? '[!]' : '[~]'} ${v.message}`)
    }
  }

  lines.push('')
  lines.push(
    es
      ? 'Creado con Old Battle — Creador de Ejércitos de 5ª Edición (herramienta no oficial de aficionados).'
      : 'Built with Old Battle — 5th Edition Army Builder (unofficial fan tool).',
  )
  return lines.join('\n')
}
