import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Roster, RosterEntry } from '../data/types'
import { deleteRoster, loadRosters, saveRosters, updateRoster, upsertRoster } from './storage'

const KEY = 'whfb5e.rosters.v1'

function entry(id: string, over: Partial<RosterEntry> = {}): RosterEntry {
  return { id, unitId: 'emp-halberdiers', size: 5, optionIds: [], magicItemIds: [], ...over }
}

function roster(id: string, over: Partial<Roster> = {}): Roster {
  return { id, name: `List ${id}`, armyId: 'empire', pointsLimit: 1000, entries: [], ...over }
}

/** Install a minimal in-memory localStorage (vitest runs in node, which has none). */
function stubStorage(store: Record<string, string> = {}) {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v
    },
  })
  return store
}

/** Simulate an environment with no localStorage at all (jsdom always has one). */
function stubNoStorage() {
  vi.stubGlobal('localStorage', undefined)
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('loadRosters', () => {
  it('returns [] when localStorage is unavailable', () => {
    stubNoStorage()
    expect(loadRosters()).toEqual([])
  })

  it('returns [] when nothing is stored', () => {
    stubStorage()
    expect(loadRosters()).toEqual([])
  })

  it('round-trips what saveRosters wrote', () => {
    stubStorage()
    const rosters = [roster('a', { entries: [entry('e1')] }), roster('b', { pointsLimit: 2000 })]
    saveRosters(rosters)
    expect(loadRosters()).toEqual(rosters)
  })

  it('returns [] on corrupt JSON', () => {
    stubStorage({ [KEY]: '{not json' })
    expect(loadRosters()).toEqual([])
  })

  it('returns [] when the stored value is not an array', () => {
    stubStorage({ [KEY]: '{"id":"a"}' })
    expect(loadRosters()).toEqual([])
  })

  it('drops corrupt elements but keeps intact rosters', () => {
    stubStorage({
      [KEY]: JSON.stringify([roster('good'), null, { id: 'half' }, 'junk', roster('also-good')]),
    })
    expect(loadRosters().map((r) => r.id)).toEqual(['good', 'also-good'])
  })

  it('drops a roster whose entries are corrupt (null, truncated, wrong types)', () => {
    stubStorage({
      [KEY]: JSON.stringify([
        roster('has-null-entry', { entries: [entry('e1'), null as unknown as RosterEntry] }),
        roster('truncated-entry', { entries: [{ id: 'e1' } as RosterEntry] }),
        roster('bad-size', { entries: [entry('e1', { size: '5' as unknown as number })] }),
        roster('intact', { entries: [entry('e1')] }),
      ]),
    })
    expect(loadRosters().map((r) => r.id)).toEqual(['intact'])
  })
})

describe('saveRosters', () => {
  it('returns true on a successful write', () => {
    stubStorage()
    expect(saveRosters([roster('a')])).toBe(true)
  })

  it('returns false, logs, and leaves the store untouched when setItem throws (quota)', () => {
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError')
      },
    })
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(saveRosters([roster('a')])).toBe(false)
    expect(err).toHaveBeenCalledWith(
      'Failed to save army lists to localStorage',
      expect.objectContaining({ name: 'QuotaExceededError' }),
    )
    expect(store).toEqual({})
  })

  it('returns false when localStorage is unavailable', () => {
    stubNoStorage()
    expect(saveRosters([roster('a')])).toBe(false)
  })
})

describe('upsertRoster / updateRoster / deleteRoster', () => {
  it('appends a new roster and replaces an existing one in place', () => {
    const list = upsertRoster([roster('a')], roster('b'))
    expect(list.map((r) => r.id)).toEqual(['a', 'b'])
    const updated = upsertRoster(list, roster('a', { name: 'Renamed' }))
    expect(updated.map((r) => r.name)).toEqual(['Renamed', 'List b'])
  })

  it('updateRoster applies fn to the stored version of the matching roster only', () => {
    const list = [roster('a'), roster('b')]
    const next = updateRoster(list, 'b', (prev) => ({ ...prev, pointsLimit: prev.pointsLimit + 500 }))
    expect(next.map((r) => r.pointsLimit)).toEqual([1000, 1500])
    expect(next[0]).toBe(list[0])
  })

  it('updateRoster is a no-op (same array) for an unknown id', () => {
    const list = [roster('a')]
    const fn = vi.fn((r: Roster) => r)
    expect(updateRoster(list, 'missing', fn)).toBe(list)
    expect(fn).not.toHaveBeenCalled()
  })

  it('sequential updateRoster calls compose (second sees the first edit)', () => {
    let list = [roster('a')]
    list = updateRoster(list, 'a', (prev) => ({ ...prev, name: 'First' }))
    list = updateRoster(list, 'a', (prev) => ({ ...prev, name: `${prev.name} Second` }))
    expect(list[0].name).toBe('First Second')
  })

  it('deleteRoster removes by id and leaves others untouched', () => {
    const list = [roster('a'), roster('b')]
    expect(deleteRoster(list, 'a').map((r) => r.id)).toEqual(['b'])
    expect(deleteRoster(list, 'missing')).toEqual(list)
  })
})
