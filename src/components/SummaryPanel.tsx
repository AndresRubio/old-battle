import type { Army, Roster } from '../data/types'
import { summarize } from '../rules/summary'
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
    </div>
  )
}
