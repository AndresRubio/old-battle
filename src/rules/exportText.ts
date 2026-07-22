import type { Army, MagicItem, Roster, RosterEntry, StatLine } from '../data/types'
import { entryPoints, findMagicItem, findUnit } from './points'
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
  ruleText,
  t,
} from '../i18n/lang'

/** The nine characteristic columns, in the canonical M/WS/BS/S/T/W/I/A/Ld order. */
const STAT_KEYS = ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld'] as const
const STAT_COL = 4

/**
 * A quick-reference characteristic table (monospace-aligned): a header row of
 * localized stat labels and a row of values. Absent stats render as "–".
 * An optional `label` (mount / chariot profile) is printed above the rows.
 */
function statTableLines(statLine: Partial<StatLine>, lang: Lang, label?: string): string[] {
  const lines: string[] = []
  if (label) lines.push(`  · ${label}`)
  lines.push('  ' + STAT_KEYS.map((k) => STAT_LABEL[lang][k].padEnd(STAT_COL)).join('').trimEnd())
  lines.push('  ' + STAT_KEYS.map((k) => String(statLine[k] ?? '–').padEnd(STAT_COL)).join('').trimEnd())
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
  const es = lang === 'es'
  const lines: string[] = []

  const isRegiment = unit.role === 'regiment'
  const prefix = isRegiment ? `${entry.size}x ` : ''
  const star = entry.isGeneral ? `[${t('general', lang)}] ` : ''
  lines.push('')
  lines.push(`${star}${prefix}${unitName(unit, lang)} — ${entryPoints(entry, army)} ${t('pts', lang)}`)

  if (unit.statLine) lines.push(...statTableLines(unit.statLine, lang))
  // Extra display-only profiles: chariot crew / chassis / draught beasts, etc.
  for (const p of unit.profiles ?? []) {
    lines.push(...statTableLines(p.statLine, lang, profileName(p, lang)))
  }
  // The chosen mount rides with the character — show its profile too. A
  // chariot mount contributes its crew / draught-beast / chassis rows instead
  // of a single statline.
  const mount = entry.mountId ? (unit.mounts ?? []).find((m) => m.id === entry.mountId) : undefined
  if (mount) {
    const label = `${mountName(mount, lang)} (+${mount.points} ${t('pts', lang)})`
    if (mount.statLine) lines.push(...statTableLines(mount.statLine, lang, label))
    else lines.push(`  · ${label}`)
    for (const p of mount.profiles ?? []) {
      lines.push(...statTableLines(p.statLine, lang, profileName(p, lang)))
    }
  }

  // Selected equipment options (wizard levels labelled as in the summary),
  // plus the chosen mount's own selected options (e.g. a chariot's crew).
  const opts = (unit.options ?? []).filter((o) => entry.optionIds.includes(o.id))
  const mountOpts = (mount?.options ?? []).filter((o) => entry.optionIds.includes(o.id))
  if (opts.length > 0 || mountOpts.length > 0) {
    const labels = [
      ...opts.map((o) =>
        o.id.startsWith('wizard-l')
          ? `${es ? 'Nivel' : 'Level'} ${o.id.replace('wizard-l', '')}`
          : optionText(o.name, lang),
      ),
      ...mountOpts.map((o) => optionText(o.name, lang)),
    ]
    lines.push(`  ${t('options', lang)}: ${labels.join(', ')}`)
  }

  if (unit.specialRules && unit.specialRules.length > 0) {
    const rules = unit.specialRules.map((r) => ruleText(r, lang))
    lines.push(`  ${t('specialAbilities', lang)}: ${rules.join(', ')}`)
  }

  const items = entry.magicItemIds
    .map((id) => findMagicItem(army, id))
    .filter((i): i is MagicItem => i !== undefined)
  if (items.length > 0) {
    lines.push(`  ${t('magicItems', lang)}:`)
    for (const item of items) {
      const desc = magicItemDesc(item, lang)
      lines.push(
        `    * ${magicItemName(item, lang)} (${item.points} ${t('pts', lang)})${desc ? ` — ${desc}` : ''}`,
      )
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

      const opts = (unit.options ?? []).filter((o) => e.optionIds.includes(o.id))
      for (const o of opts) {
        const label = o.id.startsWith('wizard-l')
          ? `${es ? 'Nivel' : 'Level'} ${o.id.replace('wizard-l', '')}`
          : optionText(o.name, lang)
        lines.push(`    + ${label}`)
      }
      const mount = e.mountId ? (unit.mounts ?? []).find((m) => m.id === e.mountId) : undefined
      if (mount) {
        lines.push(`    + ${mountName(mount, lang)} (+${mount.points} ${t('pts', lang)})`)
        for (const o of (mount.options ?? []).filter((mo) => e.optionIds.includes(mo.id))) {
          lines.push(`      + ${optionText(o.name, lang)}`)
        }
      }
      for (const id of e.magicItemIds) {
        const item = findMagicItem(army, id)
        if (item) lines.push(`    * ${magicItemName(item, lang)} (${item.points} ${t('pts', lang)})`)
      }
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
