import { describe, it, expect } from 'vitest'
import {
  addEntry,
  createRoster,
  removeEntry,
  selectMount,
  selectWizardLevel,
  setGeneral,
  toggleMagicItem,
  toggleOption,
  updateEntry,
} from './rosterOps'
import { deleteRoster, upsertRoster } from './storage'
import { getArmy } from '../data/armies'

const empire = getArmy('empire')!
const halberdiers = empire.units.find((u) => u.id === 'emp-halberdiers')!
const general = empire.units.find((u) => u.id === 'emp-general')!
const wizard = empire.units.find((u) => u.id === 'emp-wizard')!

describe('rosterOps', () => {
  it('creates an empty roster with a default name', () => {
    const r = createRoster('empire', '  ', 2000, 'r1')
    expect(r).toMatchObject({ id: 'r1', armyId: 'empire', pointsLimit: 2000, name: 'Untitled Army', entries: [] })
  })

  it('adds an entry at the unit default size (regiment min size)', () => {
    const r = addEntry(createRoster('empire', 'A', 1000, 'r1'), halberdiers, 'e1')
    expect(r.entries).toHaveLength(1)
    expect(r.entries[0]).toMatchObject({ id: 'e1', unitId: 'emp-halberdiers', size: 5 })
  })

  it('adds a single-model character at size 1', () => {
    const r = addEntry(createRoster('empire', 'A', 1000, 'r1'), general, 'e1')
    expect(r.entries[0].size).toBe(1)
  })

  it('removes an entry', () => {
    let r = addEntry(createRoster('empire', 'A', 1000, 'r1'), halberdiers, 'e1')
    r = addEntry(r, general, 'e2')
    r = removeEntry(r, 'e1')
    expect(r.entries.map((e) => e.id)).toEqual(['e2'])
  })

  it('updates an entry (size)', () => {
    let r = addEntry(createRoster('empire', 'A', 1000, 'r1'), halberdiers, 'e1')
    r = updateEntry(r, 'e1', { size: 25 })
    expect(r.entries[0].size).toBe(25)
  })

  it('toggles equipment options on and off', () => {
    let r = addEntry(createRoster('empire', 'A', 1000, 'r1'), halberdiers, 'e1')
    r = toggleOption(r, 'e1', 'shield')
    expect(r.entries[0].optionIds).toContain('shield')
    r = toggleOption(r, 'e1', 'shield')
    expect(r.entries[0].optionIds).not.toContain('shield')
  })

  it('toggles magic items', () => {
    let r = addEntry(createRoster('empire', 'A', 1000, 'r1'), general, 'e1')
    r = toggleMagicItem(r, 'e1', 'mi-sword-of-strength')
    expect(r.entries[0].magicItemIds).toEqual(['mi-sword-of-strength'])
  })

  it('setGeneral marks exactly one entry as general', () => {
    let r = addEntry(createRoster('empire', 'A', 1000, 'r1'), general, 'e1')
    r = addEntry(r, halberdiers, 'e2')
    r = setGeneral(r, 'e1')
    expect(r.entries.filter((e) => e.isGeneral).map((e) => e.id)).toEqual(['e1'])
    r = setGeneral(r, 'e2')
    expect(r.entries.filter((e) => e.isGeneral).map((e) => e.id)).toEqual(['e2'])
  })

  it('selectMount sets and clears the mount (mutually exclusive)', () => {
    const bret = getArmy('bretonnia')!
    const brGeneral = bret.units.find((u) => u.id === 'br-general')!
    let r = addEntry(createRoster('bretonnia', 'A', 2000, 'r1'), brGeneral, 'e1')
    r = selectMount(r, 'e1', 'mount-pegasus')
    expect(r.entries[0].mountId).toBe('mount-pegasus')
    r = selectMount(r, 'e1', 'mount-dragon') // replaces, never accumulates
    expect(r.entries[0].mountId).toBe('mount-dragon')
    r = selectMount(r, 'e1', null)
    expect(r.entries[0].mountId).toBeUndefined()
  })

  it('selectWizardLevel keeps only one level option', () => {
    let r = addEntry(createRoster('empire', 'A', 1000, 'r1'), wizard, 'e1')
    r = selectWizardLevel(r, 'e1', empire, 'wizard-l2')
    expect(r.entries[0].optionIds).toEqual(['wizard-l2'])
    r = selectWizardLevel(r, 'e1', empire, 'wizard-l4')
    expect(r.entries[0].optionIds).toEqual(['wizard-l4'])
    r = selectWizardLevel(r, 'e1', empire, null)
    expect(r.entries[0].optionIds).toEqual([])
  })
})

describe('storage helpers (pure)', () => {
  it('upsertRoster inserts then replaces by id', () => {
    const a = createRoster('empire', 'A', 1000, 'r1')
    const b = createRoster('empire', 'B', 2000, 'r2')
    let list = upsertRoster([], a)
    list = upsertRoster(list, b)
    expect(list.map((r) => r.id)).toEqual(['r1', 'r2'])
    const a2 = { ...a, name: 'A2' }
    list = upsertRoster(list, a2)
    expect(list).toHaveLength(2)
    expect(list.find((r) => r.id === 'r1')!.name).toBe('A2')
  })

  it('deleteRoster removes by id', () => {
    const a = createRoster('empire', 'A', 1000, 'r1')
    const b = createRoster('empire', 'B', 2000, 'r2')
    const list = deleteRoster([a, b], 'r1')
    expect(list.map((r) => r.id)).toEqual(['r2'])
  })
})
