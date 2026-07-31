import type { Army, Roster, UnitRole } from '../data/types'
import { pointsByRole, rosterTotalPoints } from './points'

/**
 * One composition cap, fully derived: the points spent in the capped group,
 * the cap converted to points with the same floor/ceil rounding the Muster
 * Check enforces, and the breach verdict itself. Consumers render these
 * numbers — they never re-derive them.
 */
export interface CapStatus {
  /** Points spent in the capped group. */
  points: number
  /** The cap from the army's composition, as a percentage of the limit. */
  capPct: number
  /**
   * The cap in points — floor for maxima, ceil for the regiment minimum
   * (a fractional threshold can't be hit exactly, so maxima truncate and
   * minima round up). 0 when no points limit is set.
   */
  capPoints: number
  /** Share of the points limit spent, rounded for display (0 when no limit). */
  pct: number
  /** True when the cap is broken. Same maths as the Muster Check warning. */
  breached: boolean
  kind: 'max' | 'min'
}

export interface RosterSummary {
  total: number
  limit: number
  remaining: number
  byRole: Record<UnitRole, number>
  /**
   * The four 5th-edition composition caps. War machines and chariots share
   * one cap; monsters have their own.
   */
  caps: {
    characters: CapStatus
    regiments: CapStatus
    warMachines: CapStatus
    monsters: CapStatus
  }
}

export function summarize(roster: Roster, army: Army): RosterSummary {
  const byRole = pointsByRole(roster.entries, army)
  const total = rosterTotalPoints(roster.entries, army)
  const limit = roster.pointsLimit
  const { composition } = army
  const pct = (n: number) => (limit > 0 ? Math.round((n / limit) * 100) : 0)
  const maxCap = (points: number, capPct: number): CapStatus => {
    const capPoints = limit > 0 ? Math.floor((capPct / 100) * limit) : 0
    return { points, capPct, capPoints, pct: pct(points), breached: limit > 0 && points > capPoints, kind: 'max' }
  }
  const minCap = (points: number, capPct: number): CapStatus => {
    const capPoints = limit > 0 ? Math.ceil((capPct / 100) * limit) : 0
    return { points, capPct, capPoints, pct: pct(points), breached: limit > 0 && points < capPoints, kind: 'min' }
  }
  return {
    total,
    limit,
    remaining: limit - total,
    byRole,
    caps: {
      characters: maxCap(byRole.character, composition.maxCharactersPct),
      regiments: minCap(byRole.regiment, composition.minRegimentsPct),
      warMachines: maxCap(byRole.warmachine + byRole.chariot, composition.maxWarMachinesPct),
      monsters: maxCap(byRole.monster, composition.maxMonstersPct),
    },
  }
}
