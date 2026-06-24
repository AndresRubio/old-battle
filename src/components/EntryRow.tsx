import { useState } from 'react'
import type { Army, MagicItem, RosterEntry, StatLine } from '../data/types'
import { entryPoints, findUnit, magicItemAllowance } from '../rules/points'
import { useLang, t, type Lang, unitName, mountName, profileName, CATEGORY_LABEL, CATEGORY_ORDER, STAT_LABEL, ruleText, optionText, magicItemName, magicItemDesc } from '../i18n/lang'
import { findRule, type RuleDef } from '../data/rules'

/** One M/WS/BS/S/T/W/I/A/Ld row, optionally labelled (mount / chariot profile).
 *  Accepts partial profiles (a chariot chassis only has T/W); absent stats show "–". */
function StatLineRow({ statLine, lang, label }: { statLine: Partial<StatLine>; lang: Lang; label?: string }) {
  return (
    <div className="statline-wrap">
      {label && <span className="stat-profile-label">{label}</span>}
      <div className="statline">
        {(['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld'] as const).map((k) => (
          <span key={k} className="stat">
            <span className="stat-k">{STAT_LABEL[lang][k]}</span>
            <span className="stat-v">{statLine[k] ?? '–'}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Special-rule tags as a compact inline list (used for mount/profile blocks). */
function RuleTags({ rules, lang }: { rules: string[]; lang: Lang }) {
  return (
    <ul className="rule-tags rule-tags-inline">
      {rules.map((rule) => (
        <li key={rule}>
          <span className="rule-tag">{ruleText(rule, lang)}</span>
        </li>
      ))}
    </ul>
  )
}
import { RuleDialog } from './RuleDialog'
import { InfoDialog } from './InfoDialog'

interface Props {
  entry: RosterEntry
  army: Army
  onChangeSize: (size: number) => void
  onToggleOption: (optionId: string) => void
  onSelectMount: (mountId: string | null) => void
  onSelectWizardLevel: (optionId: string | null) => void
  onToggleMagicItem: (itemId: string) => void
  onSetGeneral: () => void
  onRemove: () => void
}

export function EntryRow({
  entry,
  army,
  onChangeSize,
  onToggleOption,
  onSelectMount,
  onSelectWizardLevel,
  onToggleMagicItem,
  onSetGeneral,
  onRemove,
}: Props) {
  const [lang] = useLang()
  const unit = findUnit(army, entry.unitId)
  const [open, setOpen] = useState(false)
  const [activeRule, setActiveRule] = useState<RuleDef | null>(null)
  const [activeItem, setActiveItem] = useState<MagicItem | null>(null)

  // The entry references a unit that no longer exists in the army data (e.g. a
  // saved roster after a data update). Render an explicit, removable row rather
  // than vanishing — otherwise the entry still counts toward points/validation
  // but the user has no way to see or delete it.
  if (!unit) {
    return (
      <li className="entry entry-unknown">
        <div className="entry-main">
          <span className="entry-name">
            <span className="v-icon">✖</span> {t('unknownUnit', lang)} “{entry.unitId}”
          </span>
          <span className="entry-pts">—</span>
          <button className="btn btn-ghost btn-sm btn-danger" onClick={onRemove} title={t('remove', lang)}>
            ✕
          </button>
        </div>
      </li>
    )
  }

  const isRegiment = unit.role === 'regiment'
  const pts = entryPoints(entry, army)
  const levelOptions = (unit.options ?? []).filter((o) => o.id.startsWith('wizard-l'))
  const toggleOptions = (unit.options ?? []).filter((o) => !o.id.startsWith('wizard-l'))
  const currentLevel = entry.optionIds.find((id) => id.startsWith('wizard-l')) ?? ''
  const allowance = unit.isCharacter ? magicItemAllowance(entry, unit) : 0
  const mounts = unit.mounts ?? []
  const selectedMount = mounts.find((m) => m.id === entry.mountId)
  const hasOptions = (unit.options?.length ?? 0) > 0 || mounts.length > 0 || unit.isCharacter

  return (
    <li className={`entry ${entry.isGeneral ? 'entry-general' : ''}`}>
      <div className="entry-main">
        <button className="entry-expand" onClick={() => setOpen((o) => !o)} title={unitName(unit, lang)}>
          <span className="entry-caret">{open ? '▾' : '▸'}</span>
          <span className="entry-name">
            {entry.isGeneral && <span className="general-star" title={t('general', lang)}>★</span>}
            {isRegiment ? `${entry.size}× ` : ''}
            {unitName(unit, lang)}
          </span>
        </button>
        <span className="entry-pts">{pts} {t('pts', lang)}</span>
        <button className="btn btn-ghost btn-sm btn-danger" onClick={onRemove} title={t('remove', lang)}>
          ✕
        </button>
      </div>

      {open && (
        <div className="entry-detail">
          {unit.statLine && <StatLineRow statLine={unit.statLine} lang={lang} />}

          {/* Extra profiles: chariot crew/chassis/draught, or a fixed mount. */}
          {unit.profiles?.map((p, i) => (
            <div key={i} className="profile-block">
              <StatLineRow statLine={p.statLine} lang={lang} label={profileName(p, lang)} />
              {p.specialRules && p.specialRules.length > 0 && <RuleTags rules={p.specialRules} lang={lang} />}
            </div>
          ))}

          {unit.specialRules && unit.specialRules.length > 0 && (
            <div className="special-rules">
              <span className="opt-label">{t('specialAbilities', lang)}</span>
              <ul className="rule-tags">
                {unit.specialRules.map((rule) => {
                  const def = findRule(rule)
                  return (
                    <li key={rule}>
                      {def ? (
                        <button
                          type="button"
                          className="rule-tag rule-tag-link"
                          onClick={() => setActiveRule(def)}
                          title={lang === 'es' ? 'Ver regla' : 'View rule'}
                        >
                          {ruleText(rule, lang)} <span className="rule-info">ⓘ</span>
                        </button>
                      ) : (
                        <span className="rule-tag">{ruleText(rule, lang)}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {isRegiment && (
            <div className="size-stepper">
              <span>{t('models', lang)}</span>
              <button className="btn btn-sm" onClick={() => onChangeSize(Math.max(1, entry.size - 1))}>
                −
              </button>
              <input
                type="number"
                min={1}
                value={entry.size}
                onChange={(e) => onChangeSize(Math.max(1, Number(e.target.value) || 1))}
              />
              <button className="btn btn-sm" onClick={() => onChangeSize(entry.size + 1)}>
                +
              </button>
              {unit.minSize && <span className="muted small">{t('min', lang)} {unit.minSize}</span>}
            </div>
          )}

          {unit.isCharacter && !entry.isGeneral && unit.canBeGeneral !== false && (
            <button className="btn btn-sm" onClick={onSetGeneral}>
              {t('makeGeneral', lang)}
            </button>
          )}

          {levelOptions.length > 0 && (
            <div className="opt-group">
              <span className="opt-label">{t('wizardLevel', lang)}</span>
              <div className="opt-radios">
                <label>
                  <input
                    type="radio"
                    name={`${entry.id}-lvl`}
                    checked={currentLevel === ''}
                    onChange={() => onSelectWizardLevel(null)}
                  />
                  {t('level1', lang)}
                </label>
                {levelOptions.map((o) => (
                  <label key={o.id}>
                    <input
                      type="radio"
                      name={`${entry.id}-lvl`}
                      checked={currentLevel === o.id}
                      onChange={() => onSelectWizardLevel(o.id)}
                    />
                    {(lang === 'es' ? 'Nivel ' : 'Level ') + o.id.replace('wizard-l', '')} (+{o.pointsPerModel})
                  </label>
                ))}
              </div>
            </div>
          )}

          {toggleOptions.length > 0 && (
            <div className="opt-group">
              <span className="opt-label">{t('options', lang)}</span>
              <div className="opt-checks">
                {toggleOptions.map((o) => (
                  <label key={o.id}>
                    <input
                      type="checkbox"
                      checked={entry.optionIds.includes(o.id)}
                      onChange={() => onToggleOption(o.id)}
                    />
                    {optionText(o.name, lang)} (+{o.pointsPerModel}
                    {isRegiment && !o.flat ? t('perModel', lang) : ''})
                  </label>
                ))}
              </div>
            </div>
          )}

          {mounts.length > 0 && (
            <div className="opt-group">
              <span className="opt-label">{t('mount', lang)}</span>
              <div className="opt-radios">
                <label>
                  <input
                    type="radio"
                    name={`${entry.id}-mount`}
                    checked={!entry.mountId}
                    onChange={() => onSelectMount(null)}
                  />
                  {t('onFoot', lang)}
                </label>
                {mounts.map((m) => (
                  <label key={m.id}>
                    <input
                      type="radio"
                      name={`${entry.id}-mount`}
                      checked={entry.mountId === m.id}
                      onChange={() => onSelectMount(m.id)}
                    />
                    {mountName(m, lang)} (+{m.points})
                  </label>
                ))}
              </div>
              {selectedMount?.statLine && (
                <div className="profile-block">
                  <StatLineRow statLine={selectedMount.statLine} lang={lang} label={mountName(selectedMount, lang)} />
                  {selectedMount.specialRules && selectedMount.specialRules.length > 0 && (
                    <RuleTags rules={selectedMount.specialRules} lang={lang} />
                  )}
                </div>
              )}
            </div>
          )}

          {unit.isCharacter && (
            <div className="opt-group">
              <span className="opt-label">
                {t('magicItems', lang)} <span className="muted small">({entry.magicItemIds.length}/{allowance})</span>
              </span>
              <div className="magic-items">
                {CATEGORY_ORDER.map((cat) => {
                  const items = army.magicItems.filter((i) => i.category === cat)
                  if (items.length === 0) return null
                  return (
                    <div key={cat} className="mi-group">
                      <div className="mi-group-title">{CATEGORY_LABEL[lang][cat]}</div>
                      {items.map((item) => {
                        const info = (
                          <span className="mi-body">
                            <span className="mi-head">
                              <span className="mi-name-wrap">
                                <span className="mi-name">{magicItemName(item, lang)}</span>
                                <button
                                  type="button"
                                  className="mi-info"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setActiveItem(item)
                                  }}
                                  title={lang === 'es' ? 'Ver texto del objeto' : 'View item text'}
                                  aria-label={lang === 'es' ? 'Ver texto del objeto' : 'View item text'}
                                >
                                  ⓘ
                                </button>
                                {item.special && (
                                  <span className="mi-special-tag">
                                    {lang === 'es' ? 'personaje especial' : 'special character'}
                                  </span>
                                )}
                              </span>
                              <span className="mi-pts">{item.points} {t('pts', lang)}</span>
                            </span>
                          </span>
                        )
                        // Special-character items: consultable (ⓘ) but not freely selectable.
                        if (item.special) {
                          return (
                            <div
                              key={item.id}
                              className="mi-item mi-item-special"
                              title={lang === 'es' ? 'Objeto de personaje especial — no seleccionable' : 'Special-character item — not selectable'}
                            >
                              <span className="mi-checkbox-spacer" aria-hidden="true" />
                              {info}
                            </div>
                          )
                        }
                        return (
                          <label key={item.id} className="mi-item">
                            <input
                              type="checkbox"
                              checked={entry.magicItemIds.includes(item.id)}
                              onChange={() => onToggleMagicItem(item.id)}
                            />
                            {info}
                          </label>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!hasOptions && <p className="muted small">{t('noOptions', lang)}</p>}
        </div>
      )}

      {activeRule && <RuleDialog rule={activeRule} lang={lang} onClose={() => setActiveRule(null)} />}
      {activeItem && (
        <InfoDialog
          kicker={CATEGORY_LABEL[lang][activeItem.category]}
          title={magicItemName(activeItem, lang)}
          body={magicItemDesc(activeItem, lang) ?? (lang === 'es' ? 'Sin descripción.' : 'No description.')}
          onClose={() => setActiveItem(null)}
        />
      )}
    </li>
  )
}
