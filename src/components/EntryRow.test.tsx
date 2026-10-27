import { describe, it, expect, afterEach } from 'vitest'
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { ReactElement } from 'react'
import { EntryRow } from './EntryRow'
import { getArmy } from '../data/armies'
import { setLang } from '../i18n/lang'
import { entryActions } from '../state/rosterOps'
import type { Army, Roster, RosterEntry, UnitProfile } from '../data/types'

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

// OLD-43 — the path that did not exist before: a UNIT'S OWN statLine can print
// book tokens, and so can a character's chosen MOUNT. Nothing passed notes for
// either, so the columns rendered "–" (or, worse, an invented number).
describe('EntryRow unit and mount stat notes (OLD-43)', () => {
  const chaos = getArmy('chaos')!
  const halflings = getArmy('halflings')!
  const orcs = getArmy('orcs-and-goblins')!

  /** All nine cells of the stat strip labelled `label` (unlabelled row = undefined). */
  const cells = (label?: string) => {
    const wrap = Array.from(container.querySelectorAll('.statline-wrap')).find((el) => {
      const l = el.querySelector('.stat-profile-label')?.textContent
      return label === undefined ? l === undefined || l === null : l === label
    })!
    return Array.from(wrap.querySelectorAll('.stat-v')).map((el) => el.textContent)
  }

  it("prints the Chaos Spawn's own M and A as book tokens (Reino del Caos printed p.90)", () => {
    setLang('en')
    render(<EntryRow entry={entry('ch-chaos-spawn', { size: 1 })} army={chaos} {...props} />)
    expand()
    expect(cells()).toEqual(['5D6cm', '3', '0', '4', '5', '3', '3', '1D6', '10'])
  })

  it("prints the Crazed Cook's word tokens, localized (Halflings printed p.7)", () => {
    setLang('en')
    render(<EntryRow entry={entry('hf-crazed-cooks', { size: 1 })} army={halflings} {...props} />)
    expand()
    expect(cells()).toEqual(['2D6"', 'Sp', '0', '5', '2', '1', '–', 'D6', '–'])
    act(() => root.unmount())
    container.remove()

    setLang('es')
    render(<EntryRow entry={entry('hf-crazed-cooks', { size: 1 })} army={halflings} {...props} />)
    expand()
    // Only the word column changes; the dice columns are language-neutral.
    expect(cells()).toEqual(['2D6"', 'Esp', '0', '5', '2', '1', '–', 'D6', '–'])
  })

  it("translates the Fanatic's 'Special' to 'Especial' and prints its A as the army list's '1D6'", () => {
    setLang('es')
    render(<EntryRow entry={entry('og-night-goblin-fanatics', { size: 1 })} army={orcs} {...props} />)
    expand()
    // A prints the army list's 1D6 (printed p.85): OLD-45 settled the book's
    // conflict with its own bestiary row (1D3) in favour of the list, and the
    // cell held "?" while that was open. The dice token is language-neutral,
    // so only the word column differs between EN and ES.
    expect(cells()).toEqual(['5D6cm', 'Especial', '–', '5', '3', '1', '–', '1D6', '–'])
  })

  it("prints a chosen mount's own note: the Beast of Nurgle's 1D6 Attacks (printed p.85)", () => {
    setLang('en')
    render(
      <EntryRow
        entry={entry('ch-lord', { size: 1, mountId: 'mount-beast-of-nurgle', optionIds: ['mark-nurgle'] })}
        army={chaos}
        {...props}
      />,
    )
    expand()
    expect(cells('Beast of Nurgle')).toEqual(['3', '3', '0', '3', '5', '3', '3', '1D6', '6'])
  })
})

describe('EntryRow magic standard filter', () => {
  /** Type into a controlled input the way React listens for it. */
  function typeInto(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setter.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
  const standardNames = () =>
    Array.from(container.querySelectorAll('.magic-items .mi-name')).map((el) => el.textContent)

  it('filters a regiment banner list by name and max points', () => {
    render(<EntryRow entry={entry('emp-white-wolf-knights', { optionIds: ['standard'] })} army={army} {...props} />)
    expand()
    expect(standardNames()).toContain('Banner of Hatred')

    typeInto(container.querySelector('.mi-filter-search') as HTMLInputElement, 'hatred')
    expect(standardNames()).toEqual(['No magic standard', 'Banner of Hatred'])

    typeInto(container.querySelector('.mi-filter-search') as HTMLInputElement, '')
    typeInto(container.querySelector('.mi-filter-pts') as HTMLInputElement, '50')
    expect(standardNames()).not.toContain('Banner of Battle')
    expect(standardNames()).toContain('Banner of Power')
  })

  it('shows the no-match note when nothing passes the filter', () => {
    render(<EntryRow entry={entry('emp-white-wolf-knights', { optionIds: ['standard'] })} army={army} {...props} />)
    expand()
    typeInto(container.querySelector('.mi-filter-search') as HTMLInputElement, 'zzz')
    expect(container.textContent).toContain('No items match the filter.')
  })

  it('hides the filter until the regiment buys a standard bearer', () => {
    render(<EntryRow entry={entry('emp-white-wolf-knights')} army={army} {...props} />)
    expand()
    expect(container.querySelector('.mi-filter')).toBeNull()
  })
})

// OLD-46 — the stat strip prints M in the centimetres the Spanish books print
// (8" → 20 cm), on the unit's own row and on a cavalry unit's steed row alike.
describe('EntryRow Movement in centimetres in Spanish (OLD-46)', () => {
  /** The M-column cell of the stat strip labelled `label`. */
  const movementFor = (label: string) => {
    const wrap = Array.from(container.querySelectorAll('.statline-wrap')).find(
      (el) => el.querySelector('.stat-profile-label')?.textContent === label,
    )
    return wrap?.querySelectorAll('.stat-v')[0]?.textContent
  }

  it('prints the rider and its steed in inches in English', () => {
    setLang('en')
    render(<EntryRow entry={entry('emp-white-wolf-knights')} army={army} {...props} />)
    expand()
    // OLD-49 — the rider walks at its own 4"; the horse carries it at 8".
    expect(movementFor('Rider')).toBe('4')
    expect(movementFor('Barded Warhorse')).toBe('8')
  })

  it('prints the rider and its steed in centimetres in Spanish', () => {
    setLang('es')
    render(<EntryRow entry={entry('emp-white-wolf-knights')} army={army} {...props} />)
    expand()
    expect(movementFor('Jinete')).toBe('10')
    expect(movementFor('Caballo de Guerra con Barda')).toBe('20')
  })
})

// OLD-65 — a character's chosen magic items are listed on their own, above the
// full category list, and the search filter never hides them.
describe('EntryRow selected magic items block (OLD-65)', () => {
  const FORTUNE = 'mi-armour-of-fortune'
  const JADE = 'mi-jade-amulet'
  const withItems = (ids: string[]) => entry('emp-general', { magicItemIds: ids })
  const selectedNames = () =>
    Array.from(container.querySelectorAll('.mi-selected .mi-name')).map((el) => el.textContent)

  function typeInto(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setter.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  it('lists the selected items in selection order', () => {
    expect(army.magicItems.some((i) => i.id === FORTUNE)).toBe(true)
    expect(army.magicItems.some((i) => i.id === JADE)).toBe(true)
    render(<EntryRow entry={withItems([JADE, FORTUNE])} army={army} {...props} />)
    expand()
    expect(selectedNames()).toEqual(['Jade Amulet', 'Armour of Fortune'])
    // Still checked in the full list as well.
    const checked = container.querySelectorAll('.magic-items .mi-group input[type="checkbox"]:checked')
    expect(checked.length).toBe(2)
  })

  it('keeps listing them when the search text matches neither', () => {
    render(<EntryRow entry={withItems([JADE, FORTUNE])} army={army} {...props} />)
    expand()
    typeInto(container.querySelector('.mi-filter-search') as HTMLInputElement, 'zzz')
    expect(container.textContent).toContain('No items match the filter.')
    expect(selectedNames()).toEqual(['Jade Amulet', 'Armour of Fortune'])
  })

  it('renders no block when nothing is selected', () => {
    render(<EntryRow entry={withItems([])} army={army} {...props} />)
    expand()
    expect(container.querySelector('.mi-selected')).toBeNull()
  })

  it('removes the item when its selected row is unchecked', () => {
    let result = {
      id: 'r1', name: 'R', armyId: 'empire', pointsLimit: 2000, entries: [withItems([JADE, FORTUNE])],
    } as unknown as Roster
    const actions = entryActions((fn) => { result = fn(result) }, army, 'e1')
    render(<EntryRow entry={withItems([JADE, FORTUNE])} army={army} {...props} actions={actions} />)
    expand()
    const box = container.querySelector('.mi-selected input[type="checkbox"]') as HTMLInputElement
    act(() => box.click())
    expect(result.entries[0].magicItemIds).toEqual([FORTUNE])
  })

  it('titles the block "Seleccionados" in Spanish', () => {
    setLang('es')
    render(<EntryRow entry={withItems([FORTUNE])} army={army} {...props} />)
    expand()
    expect(container.querySelector('.mi-selected .mi-group-title')?.textContent).toBe('Seleccionados')
  })
})

describe('EntryRow fixed magic items and fixed extras (OLD-63)', () => {
  it('shows Karl Franz a mount selector (Imperio p.67-68)', () => {
    render(<EntryRow entry={entry('emp-karl-franz', { size: 1 })} army={army} {...props} />)
    expand()
    const chips = Array.from(container.querySelectorAll('.mount-chips label')).map((el) => el.textContent)
    expect(chips).toContain('Griffon +150')
    expect(chips).toContain('Barded Warhorse +7')
  })

  const HAMMER = 'mi-hammer-of-sigmar'
  const SEAL = 'mi-silver-seal'
  const kf = (over: Partial<RosterEntry> = {}) => entry('emp-karl-franz', { size: 1, ...over })
  /** Every magic-item row in a container, as [name, checked, disabled, tag, price]. */
  const rows = (selector: string) =>
    Array.from(container.querySelectorAll(`${selector} .mi-item`)).map((row) => {
      const box = row.querySelector('input[type="checkbox"]') as HTMLInputElement | null
      return [
        row.querySelector('.mi-name')?.textContent,
        box?.checked,
        box?.disabled,
        row.querySelector('.mi-fixed-tag')?.textContent,
        row.querySelector('.mi-pts')?.textContent,
      ]
    })
  const rowFor = (selector: string, name: string) => rows(selector).find((r) => r[0] === name)

  it('counts the fixed items in the header: (2/3) for a bare Karl Franz', () => {
    render(<EntryRow entry={kf()} army={army} {...props} />)
    expand()
    const header = Array.from(container.querySelectorAll('.opt-label')).find((el) =>
      el.textContent?.startsWith('Magic Items'),
    )
    expect(header?.textContent).toBe('Magic Items (2/3)')
  })

  it('lists the Hammer and the Seal as checked, locked and tagged "fixed", fixed first', () => {
    render(<EntryRow entry={kf({ magicItemIds: ['mi-sword-of-justice'] })} army={army} {...props} />)
    expand()
    expect(rows('.mi-selected')).toEqual([
      ['Hammer of Sigmar', true, true, 'fixed', '100 pts'],
      ['The Silver Seal', true, true, 'fixed', '75 pts'],
      ['Sword of Justice', true, false, undefined, '50 pts'],
    ])
    // The same locked rows in the category list.
    expect(rowFor('.magic-items .mi-group', 'Hammer of Sigmar')).toEqual(['Hammer of Sigmar', true, true, 'fixed', '100 pts'])
    expect(rowFor('.magic-items .mi-group', 'The Silver Seal')).toEqual(['The Silver Seal', true, true, 'fixed', '75 pts'])
  })

  it('changes nothing when a fixed row is clicked', () => {
    const start = { id: 'r1', name: 'R', armyId: 'empire', pointsLimit: 2000, entries: [kf()] } as unknown as Roster
    let result = start
    const actions = entryActions((fn) => { result = fn(result) }, army, 'e1')
    render(<EntryRow entry={kf()} army={army} {...props} actions={actions} />)
    expand()
    for (const box of container.querySelectorAll<HTMLInputElement>('.mi-selected input[type="checkbox"]')) {
      act(() => box.click())
    }
    expect(result).toBe(start)
    expect(result.entries[0].magicItemIds).toEqual([])
  })

  it('tags them "fijo" in Spanish', () => {
    setLang('es')
    render(<EntryRow entry={kf()} army={army} {...props} />)
    expand()
    expect(rows('.mi-selected').map((r) => r[3])).toEqual(['fijo', 'fijo'])
  })

  describe('a synthetic character with an override, an included item, a special item and an extra', () => {
    const synthUnit: UnitProfile = {
      id: 'synth-hero',
      name: 'Synth Hero',
      role: 'character',
      pointsPerModel: 100,
      isCharacter: true,
      characterRank: 'lord',
      fixedMagicItems: [{ id: HAMMER, points: 25 }, { id: SEAL, included: true }, { id: 'mi-dragon-bow' }],
      fixedExtras: [{ id: 'x', name: 'War Wagon', nameEs: 'Carromato', points: 40 }],
    }
    const synth: Army = { ...army, units: [...army.units, synthUnit] }
    const synthProps = { ...props, actions: entryActions(() => {}, synth, 'e1') }

    it('prints the override price, "included" in place of a price, and the special item locked', () => {
      render(<EntryRow entry={entry('synth-hero', { size: 1 })} army={synth} {...synthProps} />)
      expand()
      expect(rows('.mi-selected')).toEqual([
        ['Hammer of Sigmar', true, true, 'fixed', '25 pts'],
        ['The Silver Seal', true, true, 'fixed', 'included'],
        ['Dragon Bow', true, true, 'fixed', '40 pts'],
      ])
      // A SPECIAL item on its owner is a locked, checked row in the category list too.
      expect(rowFor('.magic-items .mi-group', 'Dragon Bow')).toEqual(['Dragon Bow', true, true, 'fixed', '40 pts'])
    })

    it('keeps a SPECIAL item unselectable on anyone else', () => {
      render(<EntryRow entry={entry('emp-general', { size: 1 })} army={synth} {...synthProps} />)
      expand()
      const bow = Array.from(container.querySelectorAll('.magic-items .mi-item-special .mi-name')).map((el) => el.textContent)
      expect(bow).toContain('Dragon Bow')
    })

    it('lists the fixed extras under "Fixed equipment" with their price', () => {
      render(<EntryRow entry={entry('synth-hero', { size: 1 })} army={synth} {...synthProps} />)
      expand()
      const group = container.querySelector('.fixed-extras')
      expect(group?.querySelector('.opt-label')?.textContent).toBe('Fixed equipment')
      expect(Array.from(group!.querySelectorAll('li')).map((li) => li.textContent)).toEqual(['War Wagon (+40)'])
    })

    it('resolves the extra and the tags in Spanish', () => {
      setLang('es')
      render(<EntryRow entry={entry('synth-hero', { size: 1 })} army={synth} {...synthProps} />)
      expand()
      const group = container.querySelector('.fixed-extras')
      expect(group?.querySelector('.opt-label')?.textContent).toBe('Equipo fijo')
      expect(Array.from(group!.querySelectorAll('li')).map((li) => li.textContent)).toEqual(['Carromato (+40)'])
      expect(rows('.mi-selected')[1].slice(3)).toEqual(['fijo', 'incluido'])
    })
  })
})

// OLD-63, Bretonnia p.66-67: Louen's headline includes his page items, so the
// Crown and the Armour of Brilliance print "included" in place of a price.
describe('EntryRow included fixed items and signed option prices (OLD-63)', () => {
  const miRows = (selector: string) =>
    Array.from(container.querySelectorAll(`${selector} .mi-item`)).map((row) => [
      row.querySelector('.mi-name')?.textContent,
      (row.querySelector('input[type="checkbox"]') as HTMLInputElement | null)?.disabled,
      row.querySelector('.mi-fixed-tag')?.textContent,
      row.querySelector('.mi-pts')?.textContent,
    ])

  it('shows Louen\'s Crown and Armour tagged "fixed" and "included", with no price', () => {
    const bretonnia = getArmy('bretonnia')!
    const p = { ...props, actions: entryActions(() => {}, bretonnia, 'e1') }
    render(<EntryRow entry={entry('br-louen-leoncoeur', { size: 1 })} army={bretonnia} {...p} />)
    expand()
    expect(miRows('.mi-selected')).toEqual([
      ['Crown of Bretonnia', true, 'fixed', 'included'],
      ['Armour of Brilliance', true, 'fixed', 'included'],
    ])
    expect(container.querySelector('.mi-selected')?.textContent).not.toMatch(/\d+ pts/)
  })

  // Norsca PDF 32 and 35 (OLD-70): ticking the card-price option moves the two
  // locked rows to the card prices, so the sheet reads 316 + 50 + 75 and the
  // option itself adds nothing.
  const sturmjarlPrices = (optionIds: string[]) => {
    const norse = getArmy('norse')!
    const p = { ...props, actions: entryActions(() => {}, norse, 'e1') }
    render(<EntryRow entry={entry('no-sturmjarl', { size: 1, optionIds })} army={norse} {...p} />)
    expand()
    return Array.from(container.querySelectorAll('.mi-selected .mi-pts')).map((el) => el.textContent)
  }

  it("shows Sturmjarl's locked rows at the page prices until the option is ticked", () => {
    expect(sturmjarlPrices([])).toEqual(['100 pts', '30 pts'])
  })

  it("shows Sturmjarl's locked rows at the card prices with the option ticked, the option itself free", () => {
    expect(sturmjarlPrices(['card-prices'])).toEqual(['50 pts', '75 pts'])
    const label = Array.from(container.querySelectorAll('.opt-checks label')).find((el) =>
      el.textContent?.startsWith('Item-card prices'),
    )
    expect(label?.textContent).toContain('Item-card prices (Gift of Loki 50, Runes 75) (+0)')
    expect(container.textContent).not.toContain('(-5)')
  })
})

// OLD-63 — a counted option (Orion's hounds) is a number input, not a checkbox.
describe('EntryRow counted options (OLD-63)', () => {
  const hunter: UnitProfile = {
    id: 'synth-hunter',
    name: 'Synth Hunter',
    role: 'character',
    pointsPerModel: 100,
    isCharacter: true,
    characterRank: 'lord',
    options: [
      { id: 'hounds', name: 'Hunting Hounds', pointsPerModel: 5, counted: true },
      { id: 'guards', name: 'Guards', pointsPerModel: 10, counted: true, maxCount: 2 },
    ],
  }
  const synth: Army = { ...army, units: [...army.units, hunter] }

  /** Owns a one-entry roster so every input commits and re-renders, like the Editor. */
  function Stateful({ start }: { start: RosterEntry }) {
    const [roster, setRoster] = useState<Roster>({
      id: 'r1', name: 'R', armyId: 'empire', pointsLimit: 2000, entries: [start],
    })
    const actions = entryActions((fn) => setRoster(fn), synth, start.id)
    return <EntryRow entry={roster.entries[0]} army={synth} actions={actions} canMoveUp={false} canMoveDown={false} />
  }

  function typeInto(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setter.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  const inputs = () => Array.from(container.querySelectorAll<HTMLInputElement>('.counted-option input[type="number"]'))
  const total = () => container.querySelector('.entry-pts')?.textContent
  const subtotals = () => Array.from(container.querySelectorAll('.counted-subtotal')).map((el) => el.textContent)

  it('renders a labelled number input per counted option, none as a checkbox', () => {
    render(<Stateful start={entry('synth-hunter', { size: 1 })} />)
    expand()
    const labels = Array.from(container.querySelectorAll('.counted-option')).map((el) => el.querySelector('.counted-name')?.textContent)
    expect(labels).toEqual(['Hunting Hounds', 'Guards'])
    expect(Array.from(container.querySelectorAll('.counted-each')).map((el) => el.textContent)).toEqual([
      '(+5 each)',
      '(+10 each)',
    ])
    const [h, g] = inputs()
    expect([h.min, h.max, h.value]).toEqual(['0', '', '0'])
    expect([g.min, g.max, g.value]).toEqual(['0', '2', '0'])
    expect(container.querySelectorAll('.opt-checks input[type="checkbox"]').length).toBe(0)
  })

  it('changes the entry total and the subtotal as the count changes', () => {
    render(<Stateful start={entry('synth-hunter', { size: 1 })} />)
    expand()
    expect(total()).toBe('100 pts')
    typeInto(inputs()[0], '4')
    expect(total()).toBe('120 pts')
    expect(inputs()[0].value).toBe('4')
    expect(subtotals()).toEqual(['20 pts', '0 pts'])
    typeInto(inputs()[1], '9')
    // Clamped at maxCount 2.
    expect(inputs()[1].value).toBe('2')
    expect(total()).toBe('140 pts')
    typeInto(inputs()[0], '')
    expect(total()).toBe('120 pts')
  })

  it('prints "(+5 c/u)" in Spanish', () => {
    setLang('es')
    render(<Stateful start={entry('synth-hunter', { size: 1, optionCounts: { hounds: 3 } })} />)
    expand()
    expect(container.querySelector('.counted-each')?.textContent).toBe('(+5 c/u)')
    expect(subtotals()[0]).toBe('15 ptos')
  })
})

// OLD-64 — a character with a documented BSB surcharge gets a toggle.
describe('EntryRow Battle Standard Bearer toggle', () => {
  const bsbButton = () => (container.querySelector('.bsb-toggle') as HTMLButtonElement | null) ?? undefined

  it('offers Ludwig the toggle, priced from his data', () => {
    setLang('en')
    render(<EntryRow entry={entry('emp-ludwig', { size: 1 })} army={army} {...props} />)
    expand()
    expect(bsbButton()?.textContent).toBe('Make Battle Standard Bearer (+50)')
  })

  it('shows the remove label and adds the +50 once toggled', () => {
    setLang('es')
    render(<EntryRow entry={entry('emp-ludwig', { size: 1, isBSB: true })} army={army} {...props} />)
    expect(container.querySelector('.entry-pts')?.textContent).toMatch(/^120 /)
    expand()
    expect(bsbButton()?.textContent).toBe('Quitar Portaestandarte de Batalla')
  })

  it('commits the toggle through the entry actions', () => {
    setLang('en')
    let roster = {
      id: 'r', name: 't', armyId: 'empire', pointsLimit: 1000,
      entries: [entry('emp-ludwig', { size: 1 })],
    }
    const actions = entryActions((fn) => { roster = fn(roster) }, army, 'e1')
    render(<EntryRow entry={roster.entries[0]} army={army} actions={actions} canMoveUp={false} canMoveDown={false} />)
    expand()
    act(() => bsbButton()!.click())
    expect(roster.entries[0].isBSB).toBe(true)
  })

  it('offers no toggle to a canBeBSB character without a documented cost', () => {
    setLang('en')
    const dow = getArmy('dogs-of-war')!
    expect(dow.units.find((u) => u.id === 'dow-paymaster')!.canBeBSB).toBe(true)
    render(<EntryRow entry={entry('dow-paymaster', { size: 1 })} army={dow} {...props} />)
    expand()
    expect(bsbButton()).toBeUndefined()
  })
})

// OLD-69 — a character whose page names the only items he may carry: the
// picker greys out everything else, and the counter counts runic items.
describe('EntryRow page item limits (OLD-69)', () => {
  const JADE = 'mi-jade-amulet'
  const rowOf = (name: string) =>
    Array.from(container.querySelectorAll('.magic-items .mi-group .mi-item')).find(
      (row) => row.querySelector('.mi-name')?.textContent === name,
    ) as HTMLElement | undefined
  const header = () =>
    Array.from(container.querySelectorAll('.opt-label')).find((el) => /^(Magic Items|Objetos)/.test(el.textContent ?? ''))
      ?.textContent

  it('greys out every item Boris may not take, with a title saying why', () => {
    render(<EntryRow entry={entry('emp-boris-todbringer', { size: 1 })} army={army} {...props} />)
    expand()
    const jade = rowOf('Jade Amulet')!
    expect(jade.classList.contains('mi-item-not-allowed')).toBe(true)
    expect(jade.querySelector('input')).toBeNull()
    expect(jade.getAttribute('title')).toBe('Not available to this character')
    // His own Runefang stays a locked, checked fixed row.
    expect(rowOf('Runefang')!.classList.contains('mi-item-fixed')).toBe(true)
    expect(header()).toBe('Magic Items (2/2)')
  })

  it('titles the greyed rows in Spanish', () => {
    setLang('es')
    render(<EntryRow entry={entry('emp-boris-todbringer', { size: 1 })} army={army} {...props} />)
    expand()
    const row = container.querySelector('.magic-items .mi-item-not-allowed')!
    expect(row.getAttribute('title')).toBe('Este personaje no puede llevarlo')
  })

  it('lets Ludwig tick the Sword of Justice and nothing else', () => {
    render(<EntryRow entry={entry('emp-ludwig', { size: 1 })} army={army} {...props} />)
    expand()
    const sword = rowOf('Sword of Justice')!
    expect(sword.classList.contains('mi-item-not-allowed')).toBe(false)
    expect((sword.querySelector('input[type="checkbox"]') as HTMLInputElement).disabled).toBe(false)
    expect(rowOf('Jade Amulet')!.classList.contains('mi-item-not-allowed')).toBe(true)
    expect(header()).toBe('Magic Items (0/1)')
  })

  it('leaves a saved pick he may not take tickable, so it can be removed', () => {
    const saved = entry('emp-boris-todbringer', { size: 1, magicItemIds: [JADE] })
    let result = { id: 'r1', name: 'R', armyId: 'empire', pointsLimit: 2000, entries: [saved] } as unknown as Roster
    const actions = entryActions((fn) => { result = fn(result) }, army, 'e1')
    render(<EntryRow entry={saved} army={army} {...props} actions={actions} />)
    expand()
    const box = Array.from(container.querySelectorAll('.mi-selected .mi-item'))
      .find((row) => row.querySelector('.mi-name')?.textContent === 'Jade Amulet')!
      .querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(box.checked).toBe(true)
    expect(box.disabled).toBe(false)
    act(() => box.click())
    expect(result.entries[0].magicItemIds).toEqual([])
  })

  it('keeps every item open to a character with no page limit', () => {
    render(<EntryRow entry={entry('emp-general', { size: 1 })} army={army} {...props} />)
    expand()
    expect(container.querySelector('.mi-item-not-allowed')).toBeNull()
    expect(rowOf('Sword of Justice')!.querySelector('input[type="checkbox"]')).not.toBeNull()
  })

  it.each(['dw-king-kazador', 'dw-kragg-the-grim'])('counts the %s rune groups in the header (3/3)', (id) => {
    const dwarfs = getArmy('dwarfs')!
    const dwProps = { ...props, actions: entryActions(() => {}, dwarfs, 'e1') }
    render(<EntryRow entry={entry(id, { size: 1 })} army={dwarfs} {...dwProps} />)
    expand()
    expect(header()).toBe('Magic Items (3/3)')
  })
})


// OLD-71: Altos Elfos p.94, "Imrik siempre monta un Dragón". The selector offers
// only his three dragons, never "On foot".
describe('EntryRow required mount (OLD-71)', () => {
  const he = getArmy('high-elves')!
  const heProps = { ...props, actions: entryActions(() => {}, he, 'e1') }
  const chips = () => Array.from(container.querySelectorAll('.mount-chip')).map((el) => el.textContent ?? '')

  it('offers Imrik his dragons and no on-foot choice', () => {
    render(<EntryRow entry={entry('he-imrik', { size: 1, mountId: 'mount-dragon' })} army={he} {...heProps} />)
    expand()
    expect(chips()).toEqual(['Dragon +450', 'Great Dragon +600', 'Emperor Dragon +750'])
    expect(labels()).toEqual(['Rider', 'Dragon'])
  })

  it('renders a stale on-foot Imrik with no chip ticked rather than crashing', () => {
    render(<EntryRow entry={entry('he-imrik', { size: 1 })} army={he} {...heProps} />)
    expand()
    expect(chips()).toHaveLength(3)
    expect(container.querySelectorAll('.mount-chip input:checked')).toHaveLength(0)
  })

  it('still offers "On foot" to a character whose mount is optional', () => {
    render(<EntryRow entry={entry('he-general', { size: 1 })} army={he} {...heProps} />)
    expand()
    expect(chips()[0]).toBe('On foot')
  })
})

// OLD-71: profiles the special characters' pages print and the editor did not show.
describe('EntryRow special character companion profiles (OLD-71)', () => {
  const show = (armyId: string, e: RosterEntry) => {
    const a = getArmy(armyId)!
    render(<EntryRow entry={e} army={a} {...props} actions={entryActions(() => {}, a, 'e1')} />)
    expand()
  }
  /** The cells of the stat strip labelled `label`, M first. */
  const cellsFor = (label: string) => {
    const wrap = Array.from(container.querySelectorAll('.statline-wrap')).find(
      (el) => el.querySelector('.stat-profile-label')?.textContent === label,
    )
    return wrap ? Array.from(wrap.querySelectorAll('.stat-v')).map((el) => el.textContent) : undefined
  }

  // Elfos Silvanos p.71: "Mastín de Caza 12 4 - 4 3 1 3 1 3".
  it("shows Orion's Hunting Hound only once hounds are bought", () => {
    setLang('en')
    show('wood-elves', entry('we-orion', { size: 1 }))
    expect(labels()).toEqual([])
    act(() => root.unmount())
    container.remove()
    show('wood-elves', entry('we-orion', { size: 1, optionCounts: { 'hunting-hounds': 3 } }))
    expect(labels()).toEqual(['Hunting Hound'])
    expect(cellsFor('Hunting Hound')).toEqual(['5', '4', '–', '4', '3', '1', '3', '1', '3'])
  })

  it('prints the hound as the Spanish book does, M in centimetres', () => {
    setLang('es')
    show('wood-elves', entry('we-orion', { size: 1, optionCounts: { 'hunting-hounds': 1 } }))
    expect(cellsFor('Mastín de Caza')).toEqual(['12', '4', '–', '4', '3', '1', '3', '1', '3'])
  })

  // Bretonnia p.71: Hugo le Petit 4 3 4 5 4 1 3 1 7, Gui le Gros 4 3 4 3 3 1 3 1 7.
  it("shows Bertrand's two henchmen", () => {
    setLang('en')
    show('bretonnia', entry('br-bertrand', { size: 1 }))
    expect(labels()).toEqual(['Hugo le Petit', 'Gui le Gros'])
    expect(cellsFor('Hugo le Petit')).toEqual(['4', '3', '4', '5', '4', '1', '3', '1', '7'])
    expect(cellsFor('Gui le Gros')).toEqual(['4', '3', '4', '3', '3', '1', '3', '1', '7'])
  })

  // Orcos y Goblins p.91: Niblit 10 3 4 4 3 1 3 2 5 (cm).
  it("shows Grom's companion Niblit", () => {
    setLang('es')
    show('orcs-and-goblins', entry('og-grom', { size: 1 }))
    expect(labels()).toEqual(['Niblit'])
    expect(cellsFor('Niblit')).toEqual(['10', '3', '4', '4', '3', '1', '3', '2', '5'])
  })

  // Enanos p.83: Porteador 8 5 4 4 4 1 3 2 9 (cm); Thorgrim's page uses the same Throne.
  it.each(['dw-general', 'dw-thorgrim'])('shows the four Throne bearers on %s only with the Throne', (id) => {
    setLang('en')
    show('dwarfs', entry(id, { size: 1 }))
    expect(labels()).toEqual([])
    act(() => root.unmount())
    container.remove()
    show('dwarfs', entry(id, { size: 1, optionIds: ['throne-of-power'] }))
    expect(labels()).toEqual(['4 Throne bearers'])
    expect(cellsFor('4 Throne bearers')).toEqual(['3', '5', '4', '4', '4', '1', '3', '2', '9'])
  })

  it('names the bearers in Spanish, M in centimetres', () => {
    setLang('es')
    show('dwarfs', entry('dw-thorgrim', { size: 1, optionIds: ['throne-of-power'] }))
    expect(cellsFor('4 Porteadores')).toEqual(['8', '5', '4', '4', '4', '1', '3', '2', '9'])
  })
})
