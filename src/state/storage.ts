import type { Roster, RosterEntry } from '../data/types'

const STORAGE_KEY = 'whfb5e.rosters.v1'

function hasStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

function isEntry(x: unknown): x is RosterEntry {
  if (typeof x !== 'object' || x === null) return false
  const e = x as Record<string, unknown>
  return (
    typeof e.id === 'string' &&
    typeof e.unitId === 'string' &&
    typeof e.size === 'number' &&
    Array.isArray(e.optionIds) &&
    Array.isArray(e.magicItemIds)
  )
}

/**
 * Minimal shape check for one stored roster, including each entry. Guards app
 * boot against a corrupt element (a null, a truncated object, a mangled entry)
 * crashing every screen — a roster with any damaged entry is dropped whole,
 * intact rosters survive.
 */
function isRoster(x: unknown): x is Roster {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.armyId === 'string' &&
    typeof r.pointsLimit === 'number' &&
    Array.isArray(r.entries) &&
    r.entries.every(isEntry)
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

/**
 * Persist all rosters. Returns false when the write failed (quota exhausted,
 * storage unavailable) so the UI can warn that edits won't survive a reload.
 */
export function saveRosters(rosters: Roster[]): boolean {
  if (!hasStorage()) return false
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rosters))
    return true
  } catch (err) {
    console.error('Failed to save army lists to localStorage', err)
    return false
  }
}

export function upsertRoster(rosters: Roster[], roster: Roster): Roster[] {
  const idx = rosters.findIndex((r) => r.id === roster.id)
  if (idx === -1) return [...rosters, roster]
  const next = rosters.slice()
  next[idx] = roster
  return next
}

/**
 * Apply a functional edit to the roster with the given id; no-op when absent.
 * `fn` receives the current stored version, so same-tick edits compose.
 */
export function updateRoster(rosters: Roster[], id: string, fn: (prev: Roster) => Roster): Roster[] {
  const current = rosters.find((r) => r.id === id)
  return current ? upsertRoster(rosters, fn(current)) : rosters
}

export function deleteRoster(rosters: Roster[], id: string): Roster[] {
  return rosters.filter((r) => r.id !== id)
}
