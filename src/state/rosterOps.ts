import type { Army, Roster, RosterEntry, UnitProfile } from '../data/types'

let counter = 0
/**
 * Generate a unique id (deterministic-friendly: pass an explicit id in tests).
 * The random component must vary across page loads — `counter` resets to 0 on
 * reload, so a counter-only/seeded scheme would regenerate ids that collide
 * with entries saved in a previous session. Wall-clock time + Math.random keeps
 * ids unique even when crypto.randomUUID is unavailable (insecure contexts).
 */
export function genId(prefix = 'id'): string {
  counter += 1
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : `${Date.now().toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`
  return `${prefix}-${counter}-${rand}`
}

export function createRoster(armyId: string, name: string, pointsLimit: number, id?: string): Roster {
  return {
    id: id ?? genId('roster'),
    name: name.trim() || 'Untitled Army',
    armyId,
    pointsLimit,
    entries: [],
  }
}

/** Sensible default size when first adding a unit (its minimum, or 1 for single models). */
export function defaultSize(unit: UnitProfile): number {
  if (unit.role === 'character' || unit.role === 'warmachine' || unit.role === 'monster' || unit.role === 'chariot') {
    return 1
  }
  return unit.minSize ?? 1
}

export function addEntry(roster: Roster, unit: UnitProfile, id?: string): Roster {
  const entry: RosterEntry = {
    id: id ?? genId('entry'),
    unitId: unit.id,
    size: defaultSize(unit),
    optionIds: [],
    magicItemIds: [],
  }
  return { ...roster, entries: [...roster.entries, entry] }
}

export function removeEntry(roster: Roster, entryId: string): Roster {
  return { ...roster, entries: roster.entries.filter((e) => e.id !== entryId) }
}

export function updateEntry(roster: Roster, entryId: string, patch: Partial<RosterEntry>): Roster {
  return {
    ...roster,
    entries: roster.entries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)),
  }
}

/** Toggle an equipment option on an entry. */
export function toggleOption(roster: Roster, entryId: string, optionId: string): Roster {
  return {
    ...roster,
    entries: roster.entries.map((e) => {
      if (e.id !== entryId) return e
      const has = e.optionIds.includes(optionId)
      return {
        ...e,
        optionIds: has ? e.optionIds.filter((o) => o !== optionId) : [...e.optionIds, optionId],
      }
    }),
  }
}

/** Toggle a magic item on a character entry. */
export function toggleMagicItem(roster: Roster, entryId: string, itemId: string): Roster {
  return {
    ...roster,
    entries: roster.entries.map((e) => {
      if (e.id !== entryId) return e
      const has = e.magicItemIds.includes(itemId)
      return {
        ...e,
        magicItemIds: has ? e.magicItemIds.filter((m) => m !== itemId) : [...e.magicItemIds, itemId],
      }
    }),
  }
}

/** Select the character's mount, or clear it with `null`. */
export function selectMount(roster: Roster, entryId: string, mountId: string | null): Roster {
  return updateEntry(roster, entryId, { mountId: mountId ?? undefined })
}

/** Make exactly one entry the General (clears the flag on all others). */
export function setGeneral(roster: Roster, entryId: string): Roster {
  return {
    ...roster,
    entries: roster.entries.map((e) => ({ ...e, isGeneral: e.id === entryId })),
  }
}

/** Wizard level options are mutually exclusive: selecting one clears the others. */
export function selectWizardLevel(roster: Roster, entryId: string, army: Army, optionId: string | null): Roster {
  const entry = roster.entries.find((e) => e.id === entryId)
  if (!entry) return roster
  const unit = army.units.find((u) => u.id === entry.unitId)
  const levelIds = (unit?.options ?? []).filter((o) => o.id.startsWith('wizard-l')).map((o) => o.id)
  const kept = entry.optionIds.filter((o) => !levelIds.includes(o))
  const next = optionId ? [...kept, optionId] : kept
  return updateEntry(roster, entryId, { optionIds: next })
}
