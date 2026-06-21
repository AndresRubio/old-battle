import type { Army, Roster } from '../data/types'
import { entryPoints, findMagicItem, findUnit } from './points'
import { summarize } from './summary'
import { validateRoster } from './validate'
import {
  type Lang,
  GROUP_LABEL,
  GROUP_ORDER,
  unitGroup,
  armyName,
  unitName,
  optionText,
  magicItemName,
  t,
} from '../i18n/lang'

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
      for (const id of e.magicItemIds) {
        const item = findMagicItem(army, id)
        if (item) lines.push(`    * ${magicItemName(item, lang)} (${item.points} ${t('pts', lang)})`)
      }
    }
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
