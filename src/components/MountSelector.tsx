import type { MountOption } from '../data/types'
import { mountName, t, type Lang } from '../i18n/lang'

interface Props {
  mounts: MountOption[]
  selectedId: string | undefined
  /** The character always rides one of `mounts` (OLD-71): no "on foot" choice. */
  required?: boolean
  onSelect: (mountId: string | null) => void
  lang: Lang
  name: string
  /** id of the visible group label, for aria-labelledby. */
  labelId: string
}

export function MountSelector({ mounts, selectedId, required, onSelect, lang, name, labelId }: Props) {
  // A saved id the unit no longer offers (the Hellsteed, OLD-74) prices as on foot, so show it so.
  const onFoot = !mounts.some((m) => m.id === selectedId)
  return (
    <div className="mount-chips" role="radiogroup" aria-labelledby={labelId}>
      {!required && (
        <label className={`mount-chip ${onFoot ? 'mount-chip-on' : ''}`}>
          <input
            type="radio"
            name={`${name}-mount`}
            checked={onFoot}
            onChange={() => onSelect(null)}
          />
          <span>{t('onFoot', lang)}</span>
        </label>
      )}
      {mounts.map((m) => (
        <label key={m.id} className={`mount-chip ${selectedId === m.id ? 'mount-chip-on' : ''}`}>
          <input
            type="radio"
            name={`${name}-mount`}
            checked={selectedId === m.id}
            onChange={() => onSelect(m.id)}
          />
          <span>
            {mountName(m, lang)} <span className="mount-cost">+{m.points}</span>
          </span>
        </label>
      ))}
    </div>
  )
}
