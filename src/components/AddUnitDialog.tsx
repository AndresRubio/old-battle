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

/** Modal panel that adds units, organised by category tabs (old-world-builder style). */
export function AddUnitDialog({ army, onAdd, onClose }: Props) {
  const [lang] = useLang()
  // Categories that actually have units, in display order.
  const tabs = GROUP_ORDER.filter((g) => army.units.some((u) => unitGroup(u) === g))
  const [active, setActive] = useState<DisplayGroup>(tabs[0] ?? 'character')
  const units = army.units.filter((u) => unitGroup(u) === active)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-add" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{t('addUnits', lang)}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

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

        <div className="add-grid">
          {units.map((u) => (
            <button key={u.id} className="picker-unit" onClick={() => onAdd(u)} title={unitName(u, lang)}>
              <span className="picker-unit-name">{unitName(u, lang)}</span>
              <span className="picker-unit-pts">
                {u.pointsPerModel}
                {u.role === 'regiment' ? t('perModel', lang) : ` ${t('pts', lang)}`}
              </span>
              {u.max !== undefined && <span className="picker-unit-limit">0-{u.max}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
