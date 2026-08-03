import { useCallback, useState } from 'react'
import type { Roster, UnitProfile } from '../data/types'
import type { useRosters } from '../state/useRosters'
import { getArmy } from '../data/armies'
import { addEntry, entryActions, renameRoster, setPointsLimit } from '../state/rosterOps'
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
  // The store is the single source of truth — the editor renders the stored
  // roster and commits edits through the store's functional `update`, which
  // both composes same-tick edits and persists.
  const roster = store.get(rosterId)
  const [showExport, setShowExport] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const { update } = store
  const [lang] = useLang()

  const commit = useCallback(
    (fn: (prev: Roster) => Roster) => update(rosterId, fn),
    [update, rosterId],
  )

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
          onChange={(e) => commit((prev) => renameRoster(prev, e.target.value))}
          aria-label="List name"
        />
        <label className="limit-input">
          <span>{t('limit', lang)}</span>
          <input
            type="number"
            min={0}
            step={50}
            value={roster.pointsLimit}
            onChange={(e) => commit((prev) => setPointsLimit(prev, Number(e.target.value)))}
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
                  actions={entryActions(commit, army, entry.id)}
                  canMoveUp={i > 0}
                  canMoveDown={i < roster.entries.length - 1}
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
