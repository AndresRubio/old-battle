import type { Army, Roster } from '../data/types'
import { summarize, type CapStatus } from '../rules/summary'
import { useLang, t } from '../i18n/lang'

interface Props {
  roster: Roster
  army: Army
}

function Bar({ label, cap, showPct, kind, unit }: { label: string; cap: CapStatus; showPct: boolean; kind: string; unit: string }) {
  const width = Math.min(100, cap.pct)
  return (
    <div className={`bar-row${cap.breached ? ' breached' : ''}`}>
      <div className="bar-head">
        <span>{label}</span>
        <span className="bar-val">
          {cap.points} {unit}{showPct ? ` · ${cap.pct}%` : ''}
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
  const { caps } = s
  const showPct = s.limit > 0
  const overLimit = showPct && s.total > s.limit

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
        <Bar label={`${t('characters', lang)} (≤${caps.characters.capPct}%)`} cap={caps.characters} showPct={showPct} kind="char" unit={t('pts', lang)} />
        <Bar label={`${t('regiments', lang)} (≥${caps.regiments.capPct}%)`} cap={caps.regiments} showPct={showPct} kind="reg" unit={t('pts', lang)} />
        <Bar label={`${t('warMachinesChariots', lang)} (≤${caps.warMachines.capPct}%)`} cap={caps.warMachines} showPct={showPct} kind="wm" unit={t('pts', lang)} />
        <Bar label={`${t('monsters', lang)} (≤${caps.monsters.capPct}%)`} cap={caps.monsters} showPct={showPct} kind="mon" unit={t('pts', lang)} />
      </div>
    </div>
  )
}
