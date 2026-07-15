import { useCallback, useEffect, useState } from 'react'
import type { Roster, UnitProfile } from '../data/types'
import type { useRosters } from '../state/useRosters'
import { getArmy } from '../data/armies'
import {
  addEntry,
  duplicateEntry,
  moveEntry,
  removeEntry,
  selectLore,
  selectMount,
  selectWizardLevel,
  setGeneral,
  toggleMagicItem,
  toggleOption,
  updateEntry,
} from '../state/rosterOps'
import { SummaryPanel } from './SummaryPanel'
import { MusterCheck } from './MusterCheck'
import { AddUnitDialog } from './AddUnitDialog'
import { EntryRow } from './EntryRow'
import { ExportDialog } from './ExportDialog'
import { useLang, t } from '../i18n/lang'

interface Props {
  rosterId: string
  store: ReturnType<typeof useRosters>
  onBack: () => void
}

export function Editor({ rosterId, store, onBack }: Props) {
  const initial = store.get(rosterId)
  const [roster, setRoster] = useState<Roster | undefined>(initial)
  const [showExport, setShowExport] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const { save } = store
  const [lang] = useLang()

  // Functional updates so multiple edits in one tick compose instead of
  // clobbering each other (each handler builds on the latest state, not the
  // render-closure snapshot).
  const commit = useCallback((update: (prev: Roster) => Roster) => {
    setRoster((prev) => (prev ? update(prev) : prev))
  }, [])

  // Persist whenever the roster changes (save is stable from useRosters).
  useEffect(() => {
    if (roster) save(roster)
  }, [roster, save])

  if (!roster) {
    return (
      <div className="editor">
        <button className="btn btn-ghost" onClick={onBack}>
          {t('backToLists', lang)}
        </button>
        <p className="muted">{t('listNotFound', lang)}</p>
      </div>
    )
  }

  const army = getArmy(roster.armyId)
  if (!army) {
    return (
      <div className="editor">
        <button className="btn btn-ghost" onClick={onBack}>
          {t('backToLists', lang)}
        </button>
        <p className="muted">{t('unknownArmy', lang)} "{roster.armyId}".</p>
      </div>
    )
  }

  const onAdd = (unit: UnitProfile) => commit((prev) => addEntry(prev, unit))

  return (
    <div className="editor-layout">
      <div className="editor-top">
        <button className="btn btn-ghost" onClick={onBack}>
          {t('lists', lang)}
        </button>
        <input
          className="list-name-input"
          value={roster.name}
          onChange={(e) => commit((prev) => ({ ...prev, name: e.target.value }))}
          aria-label="List name"
        />
        <label className="limit-input">
          <span>{t('limit', lang)}</span>
          <input
            type="number"
            min={0}
            step={50}
            value={roster.pointsLimit}
            onChange={(e) => commit((prev) => ({ ...prev, pointsLimit: Math.max(0, Number(e.target.value) || 0) }))}
          />
          <span>{t('pts', lang)}</span>
        </label>
        <button className="btn" onClick={() => setShowExport(true)}>
          {t('export', lang)}
        </button>
      </div>

      <div className="editor-grid">
        <aside className="editor-aside">
          <SummaryPanel roster={roster} army={army} />
        </aside>

        <div className="editor-roster">
          <div className="roster-head">
            <h3 className="section-title">{t('yourArmy', lang)} ({roster.entries.length})</h3>
            <button className="btn btn-primary add-unit-btn" onClick={() => setShowAdd(true)}>
              {t('addUnit', lang)}
            </button>
          </div>
          {roster.entries.length === 0 ? (
            <p className="muted">{t('noUnitsYet', lang)}</p>
          ) : (
            <ul className="entry-list">
              {roster.entries.map((entry, i) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  army={army}
                  onChangeSize={(size) => commit((prev) => updateEntry(prev, entry.id, { size }))}
                  onToggleOption={(optionId) => commit((prev) => toggleOption(prev, entry.id, optionId))}
                  onSelectMount={(mountId) => commit((prev) => selectMount(prev, entry.id, mountId))}
                  onSelectWizardLevel={(optionId) => commit((prev) => selectWizardLevel(prev, entry.id, army, optionId))}
                  onSelectLore={(loreId) => commit((prev) => selectLore(prev, entry.id, loreId))}
                  onToggleMagicItem={(itemId) => commit((prev) => toggleMagicItem(prev, entry.id, itemId))}
                  onSetGeneral={() => commit((prev) => setGeneral(prev, entry.id))}
                  onDuplicate={() => commit((prev) => duplicateEntry(prev, entry.id))}
                  onMoveUp={() => commit((prev) => moveEntry(prev, entry.id, -1))}
                  onMoveDown={() => commit((prev) => moveEntry(prev, entry.id, 1))}
                  canMoveUp={i > 0}
                  canMoveDown={i < roster.entries.length - 1}
                  onRemove={() => commit((prev) => removeEntry(prev, entry.id))}
                />
              ))}
            </ul>
          )}
          {roster.entries.length > 0 && <MusterCheck roster={roster} army={army} />}
        </div>
      </div>

      {showAdd && (
        <AddUnitDialog
          army={army}
          onAdd={(unit) => {
            onAdd(unit)
            setShowAdd(false)
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
      {showExport && <ExportDialog roster={roster} army={army} onClose={() => setShowExport(false)} />}
    </div>
  )
}
