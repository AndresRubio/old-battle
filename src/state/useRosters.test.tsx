import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react-dom/test-utils'
import { createRoot, type Root } from 'react-dom/client'
import type { Roster } from '../data/types'
import { useRosters } from './useRosters'

const KEY = 'whfb5e.rosters.v1'

function roster(id: string, over: Partial<Roster> = {}): Roster {
  return { id, name: `List ${id}`, armyId: 'empire', pointsLimit: 1000, entries: [], ...over }
}

// Render the hook inside a probe component (no testing-library dependency).
let store: ReturnType<typeof useRosters>
function Probe() {
  store = useRosters()
  return null
}

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  act(() => root?.unmount())
  container.remove()
  localStorage.clear()
  vi.restoreAllMocks()
})

function mount() {
  root = createRoot(container)
  act(() => root.render(<Probe />))
}

describe('useRosters', () => {
  it('loads stored rosters on mount', () => {
    localStorage.setItem(KEY, JSON.stringify([roster('a')]))
    mount()
    expect(store.rosters.map((r) => r.id)).toEqual(['a'])
    expect(store.saveFailed).toBe(false)
  })

  it('update(id, fn) edits the stored roster and persists to localStorage', () => {
    localStorage.setItem(KEY, JSON.stringify([roster('a')]))
    mount()
    act(() => store.update('a', (prev) => ({ ...prev, name: 'Renamed' })))
    expect(store.get('a')?.name).toBe('Renamed')
    expect(JSON.parse(localStorage.getItem(KEY)!)[0].name).toBe('Renamed')
  })

  it('two updates dispatched in the same act tick compose', () => {
    localStorage.setItem(KEY, JSON.stringify([roster('a')]))
    mount()
    act(() => {
      store.update('a', (prev) => ({ ...prev, pointsLimit: prev.pointsLimit + 500 }))
      store.update('a', (prev) => ({ ...prev, pointsLimit: prev.pointsLimit + 500 }))
    })
    expect(store.get('a')?.pointsLimit).toBe(2000)
  })

  it('update with an unknown id is a no-op', () => {
    localStorage.setItem(KEY, JSON.stringify([roster('a')]))
    mount()
    const before = store.rosters
    act(() => store.update('missing', (prev) => ({ ...prev, name: 'nope' })))
    expect(store.rosters).toBe(before)
  })

  it('sets saveFailed when persisting throws (quota), clears it when saving recovers', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    mount()
    setItem.mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    act(() => store.save(roster('a')))
    expect(store.saveFailed).toBe(true)
    setItem.mockRestore()
    act(() => store.save(roster('b')))
    expect(store.saveFailed).toBe(false)
  })
})
