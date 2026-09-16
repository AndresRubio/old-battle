import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { ReactElement } from 'react'
import { EntryRow } from './EntryRow'
import { getArmy } from '../data/armies'
import { setLang } from '../i18n/lang'
import { entryActions } from '../state/rosterOps'
import type { RosterEntry } from '../data/types'

const army = getArmy('empire')!

function entry(unitId: string, over: Partial<RosterEntry> = {}): RosterEntry {
  return { id: 'e1', unitId, size: 5, optionIds: [], magicItemIds: [], ...over }
}

// These render-only tests never write, so a no-op commit is enough.
const props = { actions: entryActions(() => {}, army, 'e1'), canMoveUp: false, canMoveDown: false }

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

// OLD-8 — a chariot taken as a character's mount renders its own profiles and
// nested option checkboxes beneath the mount radio list.
describe('EntryRow chariot mounts (Orcs & Goblins)', () => {
  const orcs = getArmy('orcs-and-goblins')!
  const warboss = (over: Partial<RosterEntry> = {}) =>
    entry('og-warboss-orc', { size: 1, mountId: 'mount-boar-chariot', ...over })

  const mountOptionLabels = () =>
    Array.from(container.querySelectorAll('.mount-opt-checks label')).map((el) =>
      (el.textContent ?? '').replace('ⓘ', '').trim(),
    )

  it('renders the chariot crew / boars / chassis profile rows beneath the rider', () => {
    setLang('en')
    render(<EntryRow entry={warboss()} army={orcs} {...props} />)
    expand()
    expect(labels()).toEqual(['2 Orc crew', '2 War Boars', 'Chariot'])
  })

  it('renders the chariot profile labels in Spanish', () => {
    setLang('es')
    render(<EntryRow entry={warboss()} army={orcs} {...props} />)
    expand()
    expect(labels()).toEqual(['2 tripulantes Orcos', '2 Jabalíes de Guerra', 'Carro'])
  })

  it('lists the chariot options as checkboxes with their current costs', () => {
    setLang('en')
    render(<EntryRow entry={warboss()} army={orcs} {...props} />)
    expand()
    // perCrewman shields/bows show the 2-crew computed total (+1 × 2 = +2).
    expect(mountOptionLabels()).toEqual([
      '3rd crewman (+7.5)',
      '4th crewman (+7.5)',
      'Shields for crew (+2)',
      'Short bows for crew (+2)',
      'Scythed wheels (+20)',
    ])
  })

  it('recomputes perCrewman costs when extra crew are selected', () => {
    setLang('en')
    render(
      <EntryRow
        entry={warboss({ optionIds: ['mount-boar-chariot-crew3', 'mount-boar-chariot-crew4'] })}
        army={orcs}
        {...props}
      />,
    )
    expand()
    expect(mountOptionLabels()).toContain('Shields for crew (+4)')
  })

  it('translates the chariot option labels to Spanish', () => {
    setLang('es')
    render(<EntryRow entry={warboss()} army={orcs} {...props} />)
    expand()
    expect(mountOptionLabels()).toEqual([
      'Tercer tripulante (+7.5)',
      'Cuarto tripulante (+7.5)',
      'Escudos para la tripulación (+2)',
      'Arcos cortos para la tripulación (+2)',
      'Ruedas con cuchillas (+20)',
    ])
  })

  it('hides the chariot options and profiles when another mount is selected', () => {
    setLang('en')
    render(<EntryRow entry={warboss({ mountId: 'mount-war-boar' })} army={orcs} {...props} />)
    expand()
    expect(container.querySelectorAll('.mount-opt-checks').length).toBe(0)
    expect(labels()).toEqual(['Rider', 'War Boar'])
  })
})

// OLD-39 — where the book prints a dice expression in a chassis's Attacks
// column, the stat strip must show it instead of the "–" it used to render.
describe('EntryRow dice Attacks (OLD-39)', () => {
  const undead = getArmy('undead')!
  const darkElves = getArmy('dark-elves')!

  /** The A-column cell of the stat strip labelled `label` (M/WS/BS/S/T/W/I/A/Ld). */
  const attacksFor = (label: string) => {
    const wrap = Array.from(container.querySelectorAll('.statline-wrap')).find(
      (el) => el.querySelector('.stat-profile-label')?.textContent === label,
    )
    return wrap?.querySelectorAll('.stat-v')[7]?.textContent
  }

  it('prints the Undead Chariot chassis A as 1D6 (No Muertos printed p.84)', () => {
    setLang('en')
    render(<EntryRow entry={entry('ud-undead-chariot', { size: 1 })} army={undead} {...props} />)
    expand()
    expect(attacksFor('Chariot')).toBe('1D6')
    // The columns the book leaves blank still render "–".
    const chassis = Array.from(container.querySelectorAll('.statline-wrap')).find(
      (el) => el.querySelector('.stat-profile-label')?.textContent === 'Chariot',
    )!
    expect(chassis.querySelectorAll('.stat-v')[0].textContent).toBe('–')
    // The note belongs to the chassis alone: the unit's own row keeps its number.
    const own = container.querySelectorAll('.statline-wrap')[0]
    expect(own.querySelectorAll('.stat-v')[7].textContent).toBe('1')
  })

  it("prints the Witch King's Black Chariot A as 1D6+2 (Elfos Oscuros printed p.57)", () => {
    setLang('en')
    render(<EntryRow entry={entry('de-witch-king', { size: 1 })} army={darkElves} {...props} />)
    expand()
    expect(attacksFor('Black Chariot')).toBe('1D6+2')
    // Its draught team is an ordinary numeric profile.
    expect(attacksFor('2 Cold Ones')).toBe('2')
  })

  it('prints the same dice token under the Spanish labels', () => {
    setLang('es')
    render(<EntryRow entry={entry('de-witch-king', { size: 1 })} army={darkElves} {...props} />)
    expand()
    expect(attacksFor('Carruaje Negro')).toBe('1D6+2')
    expect(attacksFor('2 Gélidos')).toBe('2')
  })
})
