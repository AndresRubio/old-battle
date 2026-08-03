import type { Army, Roster, RosterEntry, UnitProfile } from '../data/types'
import { STANDARD_BEARER_ID, isWizardLevelId } from '../data/unitOptions'

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

/** Rename the roster (blank names keep the previous behaviour of the input — stored as typed). */
export function renameRoster(roster: Roster, name: string): Roster {
  return { ...roster, name }
}

/** Set the points limit, clamped to a non-negative number (the Roster invariant). */
export function setPointsLimit(roster: Roster, limit: number): Roster {
  return { ...roster, pointsLimit: Math.max(0, Number(limit) || 0) }
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

/**
 * Duplicate an entry, inserting the copy immediately after the original. The
 * copy is never the General (only one is allowed), and its arrays are cloned so
 * editing the copy never mutates the original. A verbatim copy of a character's
 * unique magic items will (correctly) trip the uniqueness check in validation.
 */
export function duplicateEntry(roster: Roster, entryId: string, id?: string): Roster {
  const idx = roster.entries.findIndex((e) => e.id === entryId)
  if (idx === -1) return roster
  const src = roster.entries[idx]
  const copy: RosterEntry = {
    ...src,
    id: id ?? genId('entry'),
    optionIds: [...src.optionIds],
    magicItemIds: [...src.magicItemIds],
    isGeneral: false,
  }
  const entries = [...roster.entries]
  entries.splice(idx + 1, 0, copy)
  return { ...roster, entries }
}

/** Move an entry one slot up (`dir === -1`) or down (`dir === 1`); clamped at the ends. */
export function moveEntry(roster: Roster, entryId: string, dir: -1 | 1): Roster {
  const idx = roster.entries.findIndex((e) => e.id === entryId)
  if (idx === -1) return roster
  const target = idx + dir
  if (target < 0 || target >= roster.entries.length) return roster
  const entries = [...roster.entries]
  ;[entries[idx], entries[target]] = [entries[target], entries[idx]]
  return { ...roster, entries }
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
      const optionIds = has ? e.optionIds.filter((o) => o !== optionId) : [...e.optionIds, optionId]
      // A unit magic standard is carried by the standard bearer — dropping the
      // Standard Bearer command option clears any chosen magic standard.
      const magicStandardId =
        optionId === STANDARD_BEARER_ID && has ? undefined : e.magicStandardId
      return { ...e, optionIds, magicStandardId }
    }),
  }
}

/** Select the unit's magic standard (a banner item id), or clear it with `null`. */
export function selectMagicStandard(roster: Roster, entryId: string, itemId: string | null): Roster {
  return updateEntry(roster, entryId, { magicStandardId: itemId ?? undefined })
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

/**
 * Select the character's mount, or clear it with `null`. Option ids that belong
 * to a DIFFERENT mount's nested options (e.g. a chariot's extra crew after
 * switching to a boar) are dropped — they would linger as stale selections.
 * Unit-own options are always kept.
 */
export function selectMount(roster: Roster, entryId: string, army: Army, mountId: string | null): Roster {
  const entry = roster.entries.find((e) => e.id === entryId)
  if (!entry) return roster
  const unit = army.units.find((u) => u.id === entry.unitId)
  const otherMountOptionIds = new Set(
    (unit?.mounts ?? [])
      .filter((m) => m.id !== mountId)
      .flatMap((m) => (m.options ?? []).map((o) => o.id)),
  )
  return updateEntry(roster, entryId, {
    mountId: mountId ?? undefined,
    optionIds: entry.optionIds.filter((id) => !otherMountOptionIds.has(id)),
  })
}

/** Select the wizard's lore of magic, or clear it with `null`. */
export function selectLore(roster: Roster, entryId: string, loreId: string | null): Roster {
  return updateEntry(roster, entryId, { loreId: loreId ?? undefined })
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
  const levelIds = (unit?.options ?? []).filter((o) => isWizardLevelId(o.id)).map((o) => o.id)
  const kept = entry.optionIds.filter((o) => !levelIds.includes(o))
  const next = optionId ? [...kept, optionId] : kept
  return updateEntry(roster, entryId, { optionIds: next })
}

/** Everything the editor can do to ONE roster entry. */
export interface EntryActions {
  changeSize(size: number): void
  toggleOption(optionId: string): void
  selectMount(mountId: string | null): void
  selectWizardLevel(optionId: string | null): void
  selectLore(loreId: string | null): void
  toggleMagicItem(itemId: string): void
  selectMagicStandard(itemId: string | null): void
  setGeneral(): void
  duplicate(): void
  moveUp(): void
  moveDown(): void
  remove(): void
}

/**
 * Bind the per-entry transforms above to one entry through the editor's
 * `commit`. EntryRow's whole write interface is this object — a new entry
 * capability means a new method here, not a new prop threaded through Editor.
 */
export function entryActions(
  commit: (fn: (prev: Roster) => Roster) => void,
  army: Army,
  entryId: string,
): EntryActions {
  return {
    changeSize: (size) => commit((prev) => updateEntry(prev, entryId, { size })),
    toggleOption: (optionId) => commit((prev) => toggleOption(prev, entryId, optionId)),
    selectMount: (mountId) => commit((prev) => selectMount(prev, entryId, army, mountId)),
    selectWizardLevel: (optionId) => commit((prev) => selectWizardLevel(prev, entryId, army, optionId)),
    selectLore: (loreId) => commit((prev) => selectLore(prev, entryId, loreId)),
    toggleMagicItem: (itemId) => commit((prev) => toggleMagicItem(prev, entryId, itemId)),
    selectMagicStandard: (itemId) => commit((prev) => selectMagicStandard(prev, entryId, itemId)),
    setGeneral: () => commit((prev) => setGeneral(prev, entryId)),
    duplicate: () => commit((prev) => duplicateEntry(prev, entryId)),
    moveUp: () => commit((prev) => moveEntry(prev, entryId, -1)),
    moveDown: () => commit((prev) => moveEntry(prev, entryId, 1)),
    remove: () => commit((prev) => removeEntry(prev, entryId)),
  }
}
