import { useState } from 'react'
import type { Army, Roster } from '../data/types'
import { exportRosterText } from '../rules/exportText'
import { useLang, t } from '../i18n/lang'

interface Props {
  roster: Roster
  army: Army
  onClose: () => void
}

export function ExportDialog({ roster, army, onClose }: Props) {
  const [lang] = useLang()
  const text = exportRosterText(roster, army, lang)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard may be unavailable; the textarea is selectable as a fallback
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{t('exportTitle', lang)}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <textarea className="export-text" readOnly value={text} onFocus={(e) => e.target.select()} />
        <div className="button-row">
          <button className="btn" onClick={() => window.print()}>
            {t('print', lang)}
          </button>
          <button className="btn btn-primary" onClick={copy}>
            {copied ? t('copied', lang) : t('copyClipboard', lang)}
          </button>
        </div>
      </div>
    </div>
  )
}
