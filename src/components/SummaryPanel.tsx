import type { Army, Roster } from '../data/types'
import { summarize } from '../rules/summary'
import { validateRoster } from '../rules/validate'
import { useLang, t } from '../i18n/lang'

interface Props {
  roster: Roster
  army: Army
}

function Bar({ label, value, limit, pct, kind, unit }: { label: string; value: number; limit: number; pct: number; kind: string; unit: string }) {
  const width = Math.min(100, pct)
  return (
    <div className="bar-row">
      <div className="bar-head">
        <span>{label}</span>
        <span className="bar-val">
          {value} {unit}{limit > 0 ? ` · ${pct}%` : ''}
        </span>
      </div>
      <div className="bar-track">
        <div className={`bar-fill bar-${kind}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export function SummaryPanel({ roster, army }: Props) {
  const [lang] = useLang()
  const s = summarize(roster, army)
  const c = army.composition
  const violations = validateRoster(roster, army, lang)
  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity === 'warning')
  const overLimit = s.limit > 0 && s.total > s.limit

  return (
    <div className="summary">
      <div className={`points-total ${overLimit ? 'over' : ''}`}>
        <span className="points-big">{s.total}</span>
        <span className="points-limit">/ {s.limit} {t('pts', lang)}</span>
        <span className="points-remaining">
          {s.remaining >= 0 ? `${s.remaining} ${t('left', lang)}` : `${-s.remaining} ${t('over', lang)}`}
        </span>
      </div>

      <div className="bars">
        <Bar label={`${t('characters', lang)} (≤${c.maxCharactersPct}%)`} value={s.characters} limit={s.limit} pct={s.charactersPct} kind="char" unit={t('pts', lang)} />
        <Bar label={`${t('regiments', lang)} (≥${c.minRegimentsPct}%)`} value={s.regiments} limit={s.limit} pct={s.regimentsPct} kind="reg" unit={t('pts', lang)} />
        <Bar label={`${t('warMachinesChariots', lang)} (≤${c.maxWarMachinesPct}%)`} value={s.warMachines} limit={s.limit} pct={s.warMachinesPct} kind="wm" unit={t('pts', lang)} />
        <Bar label={`${t('monsters', lang)} (≤${c.maxMonstersPct}%)`} value={s.monsters} limit={s.limit} pct={s.monstersPct} kind="mon" unit={t('pts', lang)} />
      </div>

      <div className="validation">
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
    </div>
  )
}
