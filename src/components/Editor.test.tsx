import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { ReactElement } from 'react'
import { Editor } from './Editor'
import { getArmy } from '../data/armies'
import { createRoster, addEntry } from '../state/rosterOps'
import { setLang } from '../i18n/lang'
import type { Roster } from '../data/types'
import type { useRosters } from '../state/useRosters'

const army = getArmy('empire')!
const general = army.units.find((u) => u.id === 'emp-general')!
const karlFranz = army.units.find((u) => u.id === 'emp-karl-franz')! // a special character
const halberdiers = army.units.find((u) => u.id === 'emp-halberdiers')!
const spearmen = army.units.find((u) => u.id === 'emp-spearmen')!
const mortar = army.units.find((u) => u.id === 'emp-mortar')!
const griffon = army.units.find((u) => u.id === 'emp-griffon')!

/** A no-op store that just serves the given roster — Editor never has to
 *  actually persist anything for these render-only tests. */
function makeStore(roster: Roster): ReturnType<typeof useRosters> {
  return {
    rosters: [roster],
    save: () => {},
    update: () => {},
    remove: () => {},
    get: () => roster,
    saveFailed: false,
  }
}

let container: HTMLDivElement
let root: Root

function render(ui: ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(ui))
}

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  setLang('en')
})

const groupTitles = () =>
  Array.from(container.querySelectorAll('.entry-group-title')).map((el) => el.textContent)

const namesInGroup = (index: number) =>
  Array.from(container.querySelectorAll('.entry-group'))[index]
    ? Array.from(
        container.querySelectorAll('.entry-group')[index].querySelectorAll('.entry-name'),
      ).map((el) => el.textContent?.trim())
    : []

describe('Editor entry-list grouping', () => {
  it('renders the four section headings, in order, matching the Muster Check caps', () => {
    let r = createRoster('empire', 'Test', 2000, 'r1')
    r = addEntry(r, general, 'e1')
    r = addEntry(r, halberdiers, 'e2')
    r = addEntry(r, mortar, 'e3')
    r = addEntry(r, griffon, 'e4')
    render(<Editor rosterId="r1" store={makeStore(r)} onBack={() => {}} />)
    expect(groupTitles()).toEqual(['Characters', 'Regiments', 'War machines & chariots', 'Monsters'])
  })

  it('renders Spanish headings when the language is Spanish', () => {
    setLang('es')
    let r = createRoster('empire', 'Test', 2000, 'r1')
    r = addEntry(r, general, 'e1')
    r = addEntry(r, halberdiers, 'e2')
    r = addEntry(r, mortar, 'e3')
    r = addEntry(r, griffon, 'e4')
    render(<Editor rosterId="r1" store={makeStore(r)} onBack={() => {}} />)
    expect(groupTitles()).toEqual(['Personajes', 'Regimientos', 'Máquinas de guerra y carros', 'Monstruos'])
  })

  it('only shows the heading for sections that have an entry', () => {
    let r = createRoster('empire', 'Test', 2000, 'r1')
    r = addEntry(r, halberdiers, 'e1')
    r = addEntry(r, spearmen, 'e2')
    render(<Editor rosterId="r1" store={makeStore(r)} onBack={() => {}} />)
    expect(groupTitles()).toEqual(['Regiments'])
  })

  it('groups a named special character under Characters, not a separate heading', () => {
    let r = createRoster('empire', 'Test', 2000, 'r1')
    r = addEntry(r, karlFranz, 'e1')
    render(<Editor rosterId="r1" store={makeStore(r)} onBack={() => {}} />)
    expect(groupTitles()).toEqual(['Characters'])
  })

  it('preserves relative entry order within a section', () => {
    let r = createRoster('empire', 'Test', 2000, 'r1')
    // Added out of section order: regiment, character, regiment.
    r = addEntry(r, spearmen, 'e1')
    r = addEntry(r, general, 'e2')
    r = addEntry(r, halberdiers, 'e3')
    render(<Editor rosterId="r1" store={makeStore(r)} onBack={() => {}} />)
    expect(groupTitles()).toEqual(['Characters', 'Regiments'])
    expect(namesInGroup(1)).toEqual(['5× Spearmen', '5× Halberdiers'])
  })
})
