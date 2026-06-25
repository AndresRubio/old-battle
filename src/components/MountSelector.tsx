import type { MountOption } from '../data/types'
import { mountName, t, type Lang } from '../i18n/lang'

interface Props {
  mounts: MountOption[]
  selectedId: string | undefined
  onSelect: (mountId: string | null) => void
  lang: Lang
  name: string
}

export function MountSelector({ mounts, selectedId, onSelect, lang, name }: Props) {
  return (
    <div className="mount-chips" role="radiogroup">
      <label className={`mount-chip ${!selectedId ? 'mount-chip-on' : ''}`}>
        <input
          type="radio"
          name={`${name}-mount`}
          checked={!selectedId}
          onChange={() => onSelect(null)}
        />
        <span>{t('onFoot', lang)}</span>
      </label>
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
