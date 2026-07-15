import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { ReactElement } from 'react'
import { EntryRow } from './EntryRow'
import { getArmy } from '../data/armies'
import { setLang } from '../i18n/lang'
import type { RosterEntry } from '../data/types'

const army = getArmy('empire')!

function entry(unitId: string, over: Partial<RosterEntry> = {}): RosterEntry {
  return { id: 'e1', unitId, size: 5, optionIds: [], magicItemIds: [], ...over }
}

const noop = () => {}
const props = {
  onChangeSize: noop, onToggleOption: noop, onSelectMount: noop, onSelectWizardLevel: noop,
  onSelectLore: noop, onToggleMagicItem: noop, onSetGeneral: noop, onDuplicate: noop,
  onMoveUp: noop, onMoveDown: noop, canMoveUp: false, canMoveDown: false, onRemove: noop,
}

let container: HTMLDivElement
let root: Root

function render(ui: ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(ui))
}

/** Expand the entry so its stat rows render. */
function expand() {
  const btn = container.querySelector('.entry-expand') as HTMLButtonElement
  act(() => btn.click())
}

const labels = () =>
  Array.from(container.querySelectorAll('.stat-profile-label')).map((el) => el.textContent)

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  setLang('en')
})

describe('EntryRow cavalry profiles', () => {
  it('shows a labelled rider row on top and the mount profile beneath it', () => {
    setLang('en')
    render(<EntryRow entry={entry('emp-white-wolf-knights')} army={army} {...props} />)
    expand()
    // Two stat strips: the rider and the mount.
    expect(container.querySelectorAll('.statline').length).toBe(2)
    // Rider row is labelled "Rider"; mount row is labelled with the mount name.
    expect(labels()).toEqual(['Rider', 'Barded Warhorse'])
  })

  it('labels the rider row "Jinete" in Spanish', () => {
    setLang('es')
    render(<EntryRow entry={entry('emp-white-wolf-knights')} army={army} {...props} />)
    expand()
    expect(labels()).toEqual(['Jinete', 'Caballo de Guerra con Barda'])
  })

  it('leaves non-cavalry regiments with a single unlabelled stat row', () => {
    setLang('en')
    render(<EntryRow entry={entry('emp-halberdiers')} army={army} {...props} />)
    expand()
    expect(container.querySelectorAll('.statline').length).toBe(1)
    expect(labels()).toEqual([])
  })

  it('shows rider + mount rows for a character only once a mount is selected', () => {
    setLang('en')
    // General on foot: single unlabelled row.
    render(<EntryRow entry={entry('emp-general')} army={army} {...props} />)
    expand()
    expect(labels()).toEqual([])
    act(() => root.unmount())
    container.remove()
    // Same General with a Warhorse selected: rider + mount rows.
    render(<EntryRow entry={entry('emp-general', { mountId: 'mount-warhorse' })} army={army} {...props} />)
    expand()
    expect(labels()).toEqual(['Rider', 'Warhorse'])
  })
})
