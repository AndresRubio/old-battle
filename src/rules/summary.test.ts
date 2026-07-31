import { describe, it, expect } from 'vitest'
import { summarize } from './summary'
import { getArmy } from '../data/armies'
import type { Roster } from '../data/types'

const empire = getArmy('empire')!

const baseRoster = (pointsLimit: number): Roster => ({
  id: 'r',
  name: 'S',
  armyId: 'empire',
  pointsLimit,
  entries: [
    { id: '1', unitId: 'emp-general', size: 1, optionIds: [], magicItemIds: [], isGeneral: true }, // 100
    { id: '2', unitId: 'emp-halberdiers', size: 20, optionIds: [], magicItemIds: [] }, // 20*7 = 140
    { id: '3', unitId: 'emp-great-cannon', size: 1, optionIds: [], magicItemIds: [] }, // 100
  ],
})

describe('summarize', () => {
  it('computes totals, role breakdown and cap percentages', () => {
    const s = summarize(baseRoster(1000), empire)
    expect(s.total).toBe(340)
    expect(s.remaining).toBe(660)
    expect(s.caps.characters.points).toBe(100)
    expect(s.caps.regiments.points).toBe(140)
    expect(s.caps.warMachines.points).toBe(100)
    expect(s.caps.monsters.points).toBe(0)
    expect(s.caps.characters.pct).toBe(10)
    expect(s.caps.regiments.pct).toBe(14)
  })

  it('derives cap thresholds with the Muster Check rounding (floor max / ceil min)', () => {
    const s = summarize(baseRoster(750), empire)
    // Empire standard composition: chars ≤50%, regiments ≥25%, WM ≤25%, monsters ≤25%.
    expect(s.caps.characters.capPct).toBe(50)
    expect(s.caps.characters.capPoints).toBe(375)
    expect(s.caps.regiments.capPoints).toBe(188) // ceil(187.5) — minima round up
    expect(s.caps.warMachines.capPoints).toBe(187) // floor(187.5) — maxima truncate
    expect(s.caps.regiments.kind).toBe('min')
    expect(s.caps.warMachines.kind).toBe('max')
  })

  it('breach verdict matches enforcement even when the rounded pct equals the cap', () => {
    // limit 199: characters 100 pts → displayed pct rounds to 50 (= the 50% cap)
    // but the enforced threshold is floor(99.5) = 99, so the cap IS breached.
    const s = summarize(baseRoster(199), empire)
    expect(s.caps.characters.pct).toBe(50)
    expect(s.caps.characters.capPoints).toBe(99)
    expect(s.caps.characters.breached).toBe(true)
  })

  it('reports the regiment minimum as breached when short', () => {
    const s = summarize(baseRoster(1000), empire)
    // 140 pts of regiments < ceil(25% of 1000) = 250.
    expect(s.caps.regiments.capPoints).toBe(250)
    expect(s.caps.regiments.breached).toBe(true)
    expect(s.caps.characters.breached).toBe(false)
  })

  it('never breaches and shows 0% when no points limit is set', () => {
    const s = summarize(baseRoster(0), empire)
    expect(s.caps.characters.pct).toBe(0)
    expect(s.caps.characters.capPoints).toBe(0)
    expect(s.caps.characters.breached).toBe(false)
    expect(s.caps.regiments.breached).toBe(false)
  })
})
