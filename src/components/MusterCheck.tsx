import type { Army, Roster } from '../data/types'
import { validateRoster } from '../rules/validate'
import { useLang, t } from '../i18n/lang'

interface Props {
  roster: Roster
  army: Army
}

/**
 * The live rules verdict for a roster. Lives below the army list (the natural
 * "result at the end" position) while the points total + composition bars stay
 * up in the SummaryPanel.
 */
export function MusterCheck({ roster, army }: Props) {
  const [lang] = useLang()
  const violations = validateRoster(roster, army, lang)
  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity === 'warning')

  return (
    <div className="validation muster-check">
      <h3>
        {t('musterCheck', lang)}
        {violations.length === 0 ? (
          <span className="badge badge-ok">{t('allClear', lang)}</span>
        ) : (
          <span className="badge badge-bad">
            {errors.length} {errors.length !== 1 ? t('errors', lang) : t('error', lang)},{' '}
            {warnings.length} {warnings.length !== 1 ? t('warnings', lang) : t('warning', lang)}
          </span>
        )}
      </h3>
      {violations.length === 0 ? (
        <p className="muted">{t('obeysRules', lang)}</p>
      ) : (
        <ul className="violation-list">
          {errors.map((v, i) => (
            <li key={`e${i}`} className="violation violation-error">
              <span className="v-icon">✖</span> {v.message}
            </li>
          ))}
          {warnings.map((v, i) => (
            <li key={`w${i}`} className="violation violation-warning">
              <span className="v-icon">▲</span> {v.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
