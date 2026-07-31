import type { Roster } from '../data/types'

const STORAGE_KEY = 'whfb5e.rosters.v1'

function hasStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

/**
 * Minimal shape check for one stored roster. Guards app boot against a
 * corrupt array element (a null, a truncated object) crashing every screen —
 * damaged entries are dropped, intact ones survive.
 */
function isRoster(x: unknown): x is Roster {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.armyId === 'string' &&
    typeof r.pointsLimit === 'number' &&
    Array.isArray(r.entries)
  )
}

/** Load all saved rosters. Returns [] on any error (corrupt data, no storage). */
export function loadRosters(): Roster[] {
  if (!hasStorage()) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isRoster)
  } catch {
    return []
  }
}

export function saveRosters(rosters: Roster[]): void {
  if (!hasStorage()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rosters))
  } catch (err) {
    // Quota / serialization failure: the in-memory session keeps working, but
    // the change won't survive a reload — leave a trace instead of vanishing.
    console.error('Failed to save army lists to localStorage', err)
  }
}

export function upsertRoster(rosters: Roster[], roster: Roster): Roster[] {
  const idx = rosters.findIndex((r) => r.id === roster.id)
  if (idx === -1) return [...rosters, roster]
  const next = rosters.slice()
  next[idx] = roster
  return next
}

export function deleteRoster(rosters: Roster[], id: string): Roster[] {
  return rosters.filter((r) => r.id !== id)
}
