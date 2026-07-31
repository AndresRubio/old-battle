import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Roster } from '../data/types'
import { deleteRoster, loadRosters, saveRosters, upsertRoster } from './storage'

const KEY = 'whfb5e.rosters.v1'

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

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('loadRosters', () => {
  it('returns [] when localStorage is unavailable', () => {
    expect(loadRosters()).toEqual([])
  })

  it('returns [] when nothing is stored', () => {
    stubStorage()
    expect(loadRosters()).toEqual([])
  })

  it('round-trips what saveRosters wrote', () => {
    stubStorage()
    const rosters = [roster('a'), roster('b', { pointsLimit: 2000 })]
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
})

describe('saveRosters', () => {
  it('logs instead of throwing when setItem fails (quota)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError')
      },
    })
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => saveRosters([roster('a')])).not.toThrow()
    expect(err).toHaveBeenCalledOnce()
  })
})

describe('upsertRoster / deleteRoster', () => {
  it('appends a new roster and replaces an existing one in place', () => {
    const list = upsertRoster([roster('a')], roster('b'))
    expect(list.map((r) => r.id)).toEqual(['a', 'b'])
    const updated = upsertRoster(list, roster('a', { name: 'Renamed' }))
    expect(updated.map((r) => r.name)).toEqual(['Renamed', 'List b'])
  })

  it('deleteRoster removes by id and leaves others untouched', () => {
    const list = [roster('a'), roster('b')]
    expect(deleteRoster(list, 'a').map((r) => r.id)).toEqual(['b'])
    expect(deleteRoster(list, 'missing')).toEqual(list)
  })
})
