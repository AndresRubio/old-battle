import { useState } from 'react'
import type { Army, UnitProfile } from '../data/types'
import {
  useLang,
  GROUP_LABEL,
  GROUP_ORDER,
  unitGroup,
  type DisplayGroup,
  unitName,
  t,
} from '../i18n/lang'

interface Props {
  army: Army
  onAdd: (unit: UnitProfile) => void
  onClose: () => void
}

/** Modal panel that adds units, organised by category tabs (classic army-builder style).
 *  A search box filters across ALL categories so you don't have to browse tab by tab. */
export function AddUnitDialog({ army, onAdd, onClose }: Props) {
  const [lang] = useLang()
  // Categories that actually have units, in display order.
  const tabs = GROUP_ORDER.filter((g) => army.units.some((u) => unitGroup(u) === g))
  const [active, setActive] = useState<DisplayGroup>(tabs[0] ?? 'character')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const searching = q.length > 0
  // While searching, match by name (EN + ES) across every category; otherwise
  // show just the active tab.
  const units = searching
    ? army.units.filter((u) => `${u.name} ${u.nameEs ?? ''}`.toLowerCase().includes(q))
    : army.units.filter((u) => unitGroup(u) === active)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-add" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{t('addUnits', lang)}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <input
          type="search"
          className="add-search"
          placeholder={t('searchUnits', lang)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('searchUnits', lang)}
          autoFocus
        />

        {!searching && (
          <div className="add-tabs" role="tablist">
            {tabs.map((g) => (
              <button
                key={g}
                role="tab"
                aria-selected={active === g}
                className={`add-tab ${active === g ? 'add-tab-active' : ''}`}
                onClick={() => setActive(g)}
              >
                {GROUP_LABEL[lang][g]}
              </button>
            ))}
          </div>
        )}

        {units.length === 0 ? (
          <p className="muted small">{t('noUnitsMatch', lang)}</p>
        ) : (
          <div className="add-grid">
            {units.map((u) => (
              <button key={u.id} className="picker-unit" onClick={() => onAdd(u)} title={unitName(u, lang)}>
                <span className="picker-unit-name">{unitName(u, lang)}</span>
                <span className="picker-unit-pts">
                  {u.pointsPerModel}
                  {u.role === 'regiment' ? t('perModel', lang) : ` ${t('pts', lang)}`}
                </span>
                {searching && <span className="picker-unit-group">{GROUP_LABEL[lang][unitGroup(u)]}</span>}
                {u.max !== undefined && <span className="picker-unit-limit">0-{u.max}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
