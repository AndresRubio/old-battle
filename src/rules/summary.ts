import type { Army, Roster, UnitRole } from '../data/types'
import { pointsByRole, rosterTotalPoints } from './points'

export interface RosterSummary {
  total: number
  limit: number
  remaining: number
  byRole: Record<UnitRole, number>
  /** Points spent on characters / regiments / war machines (+chariots) / monsters. */
  characters: number
  regiments: number
  warMachines: number
  monsters: number
  /** Percentages of the points limit (0 when no limit set). */
  charactersPct: number
  regimentsPct: number
  warMachinesPct: number
  monstersPct: number
}

export function summarize(roster: Roster, army: Army): RosterSummary {
  const byRole = pointsByRole(roster.entries, army)
  const total = rosterTotalPoints(roster.entries, army)
  const limit = roster.pointsLimit
  // War machines and chariots share one 0-25% cap; monsters have their own.
  const warMachines = byRole.warmachine + byRole.chariot
  const pct = (n: number) => (limit > 0 ? Math.round((n / limit) * 100) : 0)
  return {
    total,
    limit,
    remaining: limit - total,
    byRole,
    characters: byRole.character,
    regiments: byRole.regiment,
    warMachines,
    monsters: byRole.monster,
    charactersPct: pct(byRole.character),
    regimentsPct: pct(byRole.regiment),
    warMachinesPct: pct(warMachines),
    monstersPct: pct(byRole.monster),
  }
}
