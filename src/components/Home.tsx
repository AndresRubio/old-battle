import type { Roster } from '../data/types'
import { getArmy } from '../data/armies'
import { rosterTotalPoints } from '../rules/points'
import { useLang, t, armyName } from '../i18n/lang'

// Donation links. Replace these placeholders with your real handles/URLs.
const KOFI_URL = 'https://ko-fi.com/yourhandle'
const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/yourhandle'

interface Props {
  rosters: Roster[]
  onNew: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

export function Home({ rosters, onNew, onOpen, onDelete }: Props) {
  const [lang] = useLang()
  return (
    <div className="home">
      <div className="home-head">
        <div>
          <h2>{t('yourLists', lang)}</h2>
          <p className="muted">{t('homeBlurb', lang)}</p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          {t('newList', lang)}
        </button>
      </div>

      {rosters.length === 0 ? (
        <div className="empty-state">
          <p className="empty-rune">⚔</p>
          <p>{t('noLists', lang)}</p>
          <button className="btn btn-primary" onClick={onNew}>
            {t('musterFirst', lang)}
          </button>
        </div>
      ) : (
        <ul className="roster-list">
          {rosters.map((r) => {
            const army = getArmy(r.armyId)
            const total = army ? rosterTotalPoints(r.entries, army) : 0
            return (
              <li key={r.id} className="roster-card">
                <button className="roster-card-main" onClick={() => onOpen(r.id)}>
                  <span className="roster-card-name">{r.name}</span>
                  <span className="roster-card-meta">
                    {army ? armyName(army, lang) : r.armyId} · {total}/{r.pointsLimit} {t('pts', lang)} ·{' '}
                    {r.entries.length} {t('units', lang)}
                  </span>
                </button>
                <button
                  className="btn btn-ghost btn-danger"
                  title={t('deleteList', lang)}
                  onClick={() => {
                    if (confirm(`${t('confirmDelete', lang)} "${r.name}"?`)) onDelete(r.id)
                  }}
                >
                  {t('delete', lang)}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <section className="donate-card">
        <h3 className="donate-title">{t('supportTitle', lang)}</h3>
        <p className="muted donate-blurb">{t('supportBlurb', lang)}</p>
        <div className="donate-links">
          <a className="btn btn-primary" href={KOFI_URL} target="_blank" rel="noopener noreferrer">
            {t('donateKofi', lang)}
          </a>
          <a className="btn" href={BUY_ME_A_COFFEE_URL} target="_blank" rel="noopener noreferrer">
            {t('donateCoffee', lang)}
          </a>
        </div>
      </section>
    </div>
  )
}
