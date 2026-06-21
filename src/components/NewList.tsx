import { useState } from 'react'
import type { Roster } from '../data/types'
import { ARMY_OPTIONS } from '../data/armies'
import { createRoster } from '../state/rosterOps'
import { useLang, t } from '../i18n/lang'

interface Props {
  onCreate: (roster: Roster) => void
  onCancel: () => void
}

const PRESETS = [500, 1000, 1500, 2000, 3000]

export function NewList({ onCreate, onCancel }: Props) {
  const [lang] = useLang()
  const [armyId, setArmyId] = useState(ARMY_OPTIONS[0]?.id ?? '')
  const [name, setName] = useState('')
  const [points, setPoints] = useState(2000)

  const armyLabel = (a: (typeof ARMY_OPTIONS)[number]) => (lang === 'es' ? a.nameEs : a.name)

  const submit = () => {
    if (!armyId) return
    const picked = ARMY_OPTIONS.find((a) => a.id === armyId)
    const fallback = `${picked ? armyLabel(picked) : 'New'} ${points}pts`
    onCreate(createRoster(armyId, name.trim() || fallback, points))
  }

  return (
    <div className="new-list">
      <h2>{t('newListTitle', lang)}</h2>

      <label className="field">
        <span>{t('army', lang)}</span>
        <select value={armyId} onChange={(e) => setArmyId(e.target.value)}>
          {ARMY_OPTIONS.map((a) => (
            <option key={a.id} value={a.id}>
              {armyLabel(a)}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>{t('listName', lang)}</span>
        <input
          type="text"
          placeholder={t('listNamePlaceholder', lang)}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="field">
        <span>{t('pointsLimit', lang)}</span>
        <input
          type="number"
          min={0}
          step={50}
          value={points}
          onChange={(e) => setPoints(Math.max(0, Number(e.target.value) || 0))}
        />
      </label>
      <div className="preset-row">
        {PRESETS.map((p) => (
          <button
            key={p}
            className={`chip ${points === p ? 'chip-active' : ''}`}
            onClick={() => setPoints(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="button-row">
        <button className="btn btn-ghost" onClick={onCancel}>
          {t('cancel', lang)}
        </button>
        <button className="btn btn-primary" onClick={submit}>
          {t('createEdit', lang)}
        </button>
      </div>
    </div>
  )
}
