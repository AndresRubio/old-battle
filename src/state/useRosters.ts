import { useCallback, useEffect, useState } from 'react'
import type { Roster } from '../data/types'
import { deleteRoster, loadRosters, saveRosters, upsertRoster } from './storage'

/** Manages the collection of saved rosters, persisted to localStorage. */
export function useRosters() {
  const [rosters, setRosters] = useState<Roster[]>(() => loadRosters())

  useEffect(() => {
    saveRosters(rosters)
  }, [rosters])

  const save = useCallback((roster: Roster) => {
    setRosters((prev) => upsertRoster(prev, roster))
  }, [])

  const remove = useCallback((id: string) => {
    setRosters((prev) => deleteRoster(prev, id))
  }, [])

  const get = useCallback((id: string) => rosters.find((r) => r.id === id), [rosters])

  return { rosters, save, remove, get }
}
