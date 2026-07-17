import { useState } from 'react'
import type { Army, EquipmentOption, MagicItem, ProfileBlock, RosterEntry, StatLine } from '../data/types'
import { MAGIC_LORES, getLore, type Spell } from '../data/lores'
import { entryPoints, findUnit, magicItemAllowance } from '../rules/points'
import { useLang, t, type Lang, unitName, profileName, CATEGORY_LABEL, CATEGORY_ORDER, STAT_LABEL, ruleText, optionText, optionDesc, magicItemName, magicItemDesc, loreName, spellName, spellDesc } from '../i18n/lang'
import { findRule, type RuleDef } from '../data/rules'
import { RuleDialog } from './RuleDialog'
import { InfoDialog } from './InfoDialog'
import { MountSelector } from './MountSelector'

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

interface Props {
  entry: RosterEntry
  army: Army
  onChangeSize: (size: number) => void
  onToggleOption: (optionId: string) => void
  onSelectMount: (mountId: string | null) => void
  onSelectWizardLevel: (optionId: string | null) => void
  onSelectLore: (loreId: string | null) => void
  onToggleMagicItem: (itemId: string) => void
  onSelectMagicStandard: (itemId: string | null) => void
  onSetGeneral: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  onRemove: () => void
}

export function EntryRow({
  entry,
  army,
  onChangeSize,
  onToggleOption,
  onSelectMount,
  onSelectWizardLevel,
  onSelectLore,
  onToggleMagicItem,
  onSelectMagicStandard,
  onSetGeneral,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onRemove,
}: Props) {
  const [lang] = useLang()
  const unit = findUnit(army, entry.unitId)
  const [open, setOpen] = useState(false)
  const [activeRule, setActiveRule] = useState<RuleDef | null>(null)
  const [activeItem, setActiveItem] = useState<MagicItem | null>(null)
  const [activeOption, setActiveOption] = useState<EquipmentOption | null>(null)
  const [activeSpell, setActiveSpell] = useState<{ spell: Spell; loreName: string } | null>(null)
  const [itemQuery, setItemQuery] = useState('')
  const [maxPts, setMaxPts] = useState('')

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
  const loreIds = unit.lores ?? []
  const selectedLore = entry.loreId ? getLore(entry.loreId) : undefined
  const allowance = unit.isCharacter ? magicItemAllowance(entry, unit) : 0
  const mounts = unit.mounts ?? []
  const selectedMount = mounts.find((m) => m.id === entry.mountId)
  // Cavalry: pair the rider's own statLine with a mount profile shown as a
  // second row directly beneath it (top = rider, bottom = mount). The mount is
  // a regiment's fixed steed (`unit.mount`) or a character's chosen mount.
  const companionMount: ProfileBlock | undefined =
    unit.mount ??
    (selectedMount?.statLine
      ? {
          name: selectedMount.name,
          nameEs: selectedMount.nameEs,
          statLine: selectedMount.statLine,
          specialRules: selectedMount.specialRules,
        }
      : undefined)
  // Unit magic standard: a regiment the army list allows may take one banner,
  // carried by its standard bearer. The books set no points cap — it costs
  // whatever its card says — so every non-special banner is offered.
  const standardOptions = unit.magicStandard
    ? army.magicItems.filter((i) => i.category === 'banner' && !i.special)
    : []
  const hasStandardBearer = entry.optionIds.includes('standard')
  const hasOptions =
    (unit.options?.length ?? 0) > 0 || mounts.length > 0 || unit.isCharacter || loreIds.length > 0 || !!unit.magicStandard

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
        <div className="entry-actions">
          <button
            className="btn btn-ghost btn-sm entry-btn"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title={t('moveUp', lang)}
            aria-label={t('moveUp', lang)}
          >
            ▲
          </button>
          <button
            className="btn btn-ghost btn-sm entry-btn"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title={t('moveDown', lang)}
            aria-label={t('moveDown', lang)}
          >
            ▼
          </button>
          <button
            className="btn btn-ghost btn-sm entry-btn"
            onClick={onDuplicate}
            title={t('duplicate', lang)}
            aria-label={t('duplicate', lang)}
          >
            ⧉
          </button>
          <button
            className="btn btn-ghost btn-sm entry-btn btn-danger"
            onClick={onRemove}
            title={t('remove', lang)}
            aria-label={t('remove', lang)}
          >
            ✕
          </button>
        </div>
      </div>

      {open && (
        <div className="entry-detail">
          {/* Cavalry shows two labelled rows: the rider's statLine on top and
              the mount's profile directly beneath it. Non-cavalry keeps a single
              unlabelled row. */}
          {unit.statLine && (
            <StatLineRow
              statLine={unit.statLine}
              lang={lang}
              label={companionMount ? t('rider', lang) : undefined}
            />
          )}
          {companionMount && (
            <div className="profile-block">
              <StatLineRow statLine={companionMount.statLine} lang={lang} label={profileName(companionMount, lang)} />
              {companionMount.specialRules && companionMount.specialRules.length > 0 && (
                <RuleTags rules={companionMount.specialRules} lang={lang} />
              )}
            </div>
          )}

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

          {loreIds.length > 0 && (
            <div className="opt-group">
              <span className="opt-label">{t('loreOfMagic', lang)}</span>
              <div className="opt-radios">
                {loreIds.map((id) => {
                  const lore = MAGIC_LORES[id]
                  if (!lore) return null
                  return (
                    <label key={id}>
                      <input
                        type="radio"
                        name={`${entry.id}-lore`}
                        checked={entry.loreId === id}
                        onChange={() => onSelectLore(id)}
                      />
                      {loreName(lore, lang)}
                    </label>
                  )
                })}
              </div>

              {selectedLore && (
                <div className="spell-list">
                  <span className="opt-label">{t('spells', lang)}</span>
                  <ul className="spell-rows">
                    {selectedLore.spells.map((spell, i) => (
                      <li key={i} className="spell-row">
                        <span className="spell-name">{spellName(spell, lang)}</span>
                        {spell.castingValue != null && (
                          <span className="spell-cv" title={lang === 'es' ? 'Valor de lanzamiento' : 'Casting value'}>
                            {spell.castingValue}
                          </span>
                        )}
                        <button
                          type="button"
                          className="mi-info"
                          onClick={() => setActiveSpell({ spell, loreName: loreName(selectedLore, lang) })}
                          title={lang === 'es' ? 'Ver hechizo' : 'View spell'}
                          aria-label={lang === 'es' ? 'Ver hechizo' : 'View spell'}
                        >
                          ⓘ
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                    {optionDesc(o, lang) && (
                      <button
                        type="button"
                        className="mi-info"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setActiveOption(o)
                        }}
                        title={lang === 'es' ? 'Ver efecto' : 'View effect'}
                        aria-label={lang === 'es' ? 'Ver efecto' : 'View effect'}
                      >
                        ⓘ
                      </button>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {unit.magicStandard && (
            <div className="opt-group">
              <span className="opt-label">{t('magicStandard', lang)}</span>
              {!hasStandardBearer ? (
                <p className="muted small">{t('magicStandardNeedsBearer', lang)}</p>
              ) : (
                <div className="magic-items">
                  <label className="mi-item">
                    <input
                      type="radio"
                      name={`${entry.id}-std`}
                      checked={!entry.magicStandardId}
                      onChange={() => onSelectMagicStandard(null)}
                    />
                    <span className="mi-body">
                      <span className="mi-head">
                        <span className="mi-name-wrap">
                          <span className="mi-name">{t('magicStandardNone', lang)}</span>
                        </span>
                      </span>
                    </span>
                  </label>
                  {standardOptions.map((item) => (
                    <label key={item.id} className="mi-item">
                      <input
                        type="radio"
                        name={`${entry.id}-std`}
                        checked={entry.magicStandardId === item.id}
                        onChange={() => onSelectMagicStandard(item.id)}
                      />
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
                          </span>
                          <span className="mi-pts">{item.points} {t('pts', lang)}</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {mounts.length > 0 && (
            <div className="opt-group">
              <span className="opt-label" id={`${entry.id}-mount-label`}>{t('mount', lang)}</span>
              <MountSelector
                mounts={mounts}
                selectedId={entry.mountId}
                onSelect={onSelectMount}
                lang={lang}
                name={entry.id}
                labelId={`${entry.id}-mount-label`}
              />
              {/* The chosen mount's profile is shown as the rider's second stat
                  row at the top of the entry (see companionMount above). */}
            </div>
          )}

          {unit.isCharacter && (
            <div className="opt-group">
              <span className="opt-label">
                {t('magicItems', lang)} <span className="muted small">({entry.magicItemIds.length}/{allowance})</span>
              </span>
              <div className="mi-filter">
                <input
                  type="search"
                  className="mi-filter-search"
                  placeholder={t('searchItems', lang)}
                  value={itemQuery}
                  onChange={(e) => setItemQuery(e.target.value)}
                  aria-label={t('searchItems', lang)}
                />
                <input
                  type="number"
                  min={0}
                  step={5}
                  className="mi-filter-pts"
                  placeholder={t('maxPts', lang)}
                  value={maxPts}
                  onChange={(e) => setMaxPts(e.target.value)}
                  aria-label={t('maxPts', lang)}
                />
              </div>
              <div className="magic-items">
                {(() => {
                  const q = itemQuery.trim().toLowerCase()
                  const cap = maxPts.trim() === '' ? Infinity : Number(maxPts)
                  const matches = (i: MagicItem) =>
                    i.points <= cap && (q === '' || `${i.name} ${i.nameEs ?? ''}`.toLowerCase().includes(q))
                  const groups = CATEGORY_ORDER.map((cat) => {
                  const items = army.magicItems.filter((i) => i.category === cat).filter(matches)
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
                  })
                  return groups.some(Boolean)
                    ? groups
                    : <p className="muted small">{t('noItemsMatch', lang)}</p>
                })()}
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
      {activeOption && (
        <InfoDialog
          kicker={t('options', lang)}
          title={optionText(activeOption.name, lang)}
          body={optionDesc(activeOption, lang) ?? (lang === 'es' ? 'Sin descripción.' : 'No description.')}
          onClose={() => setActiveOption(null)}
        />
      )}
      {activeSpell && (
        <InfoDialog
          kicker={activeSpell.loreName}
          title={spellName(activeSpell.spell, lang)}
          body={spellDesc(activeSpell.spell, lang)}
          onClose={() => setActiveSpell(null)}
        />
      )}
    </li>
  )
}
