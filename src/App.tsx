import { useState } from 'react'
import { useRosters } from './state/useRosters'
import { Home } from './components/Home'
import { NewList } from './components/NewList'
import { Editor } from './components/Editor'
import { useLang, t } from './i18n/lang'

type View = { name: 'home' } | { name: 'new' } | { name: 'editor'; rosterId: string }

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' })
  const store = useRosters()
  const [lang, setLang] = useLang()

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" onClick={() => setView({ name: 'home' })}>
          <span className="brand-mark">⚔</span>
          <span className="brand-text">
            <span className="brand-title">{t('appTitle', lang)}</span>
            <span className="brand-sub">{t('appSub', lang)}</span>
          </span>
        </button>

        <div className="lang-toggle" role="group" aria-label="Language / Idioma">
          <button
            className={`lang-opt ${lang === 'en' ? 'lang-opt-active' : ''}`}
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
          >
            EN
          </button>
          <button
            className={`lang-opt ${lang === 'es' ? 'lang-opt-active' : ''}`}
            onClick={() => setLang('es')}
            aria-pressed={lang === 'es'}
          >
            ES
          </button>
        </div>
      </header>

      <main className="app-main">
        {view.name === 'home' && (
          <Home
            rosters={store.rosters}
            onNew={() => setView({ name: 'new' })}
            onOpen={(id) => setView({ name: 'editor', rosterId: id })}
            onDelete={store.remove}
          />
        )}
        {view.name === 'new' && (
          <NewList
            onCancel={() => setView({ name: 'home' })}
            onCreate={(roster) => {
              store.save(roster)
              setView({ name: 'editor', rosterId: roster.id })
            }}
          />
        )}
        {view.name === 'editor' && (
          <Editor
            key={view.rosterId}
            rosterId={view.rosterId}
            store={store}
            onBack={() => setView({ name: 'home' })}
          />
        )}
      </main>

      <footer className="app-footer">{t('footer', lang)}</footer>
    </div>
  )
}
