import type { Roster } from '../data/types'

const STORAGE_KEY = 'whfb5e.rosters.v1'

function hasStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

/** Load all saved rosters. Returns [] on any error (corrupt data, no storage). */
export function loadRosters(): Roster[] {
  if (!hasStorage()) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Roster[]
  } catch {
    return []
  }
}

export function saveRosters(rosters: Roster[]): void {
  if (!hasStorage()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rosters))
  } catch {
    // ignore quota / serialization errors
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
