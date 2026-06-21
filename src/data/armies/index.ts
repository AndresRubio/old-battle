import type { Army } from '../types'
import { COMMAND } from '../unitOptions'
import { COMMON_MAGIC_ITEMS, ARMY_MAGIC_ITEMS } from '../magicItems'
import { EMPIRE } from './empire'
import { ORCS_AND_GOBLINS } from './orcsGoblins'
import { HIGH_ELVES } from './highElves'
import { DWARFS } from './dwarfs'
import { BRETONNIA } from './bretonnia'
import { WOOD_ELVES } from './woodElves'
import { DARK_ELVES } from './darkElves'
import { SKAVEN } from './skaven'
import { UNDEAD } from './undead'
import { CHAOS } from './chaos'
import { LIZARDMEN } from './lizardmen'
import { CHAOS_DWARFS } from './chaosDwarfs'
import { DOGS_OF_WAR } from './dogsOfWar'
import { VAMPIRE_COUNTS } from './vampireCounts'

/**
 * Give every multi-model regiment a command group (champion / standard /
 * musician) unless it already defines those options. Done once here rather than
 * repeated across ~70 unit definitions.
 */
function withCommandGroups(army: Army): Army {
  return {
    ...army,
    units: army.units.map((u) => {
      if (u.role !== 'regiment' || u.noCommand) return u
      const existing = new Set((u.options ?? []).map((o) => o.id))
      const extra = COMMAND.filter((o) => !existing.has(o.id))
      return extra.length ? { ...u, options: [...(u.options ?? []), ...extra] } : u
    }),
  }
}

/**
 * Assemble each army's magic-item pool: the shared common items plus any
 * race-restricted items, Dwarf runes, and special-character items keyed to it.
 */
function withMagicItems(army: Army): Army {
  return { ...army, magicItems: [...COMMON_MAGIC_ITEMS, ...(ARMY_MAGIC_ITEMS[army.id] ?? [])] }
}

/** All armies available in the builder (sorted alphabetically by name). */
export const ARMIES: Army[] = [
  BRETONNIA,
  CHAOS,
  CHAOS_DWARFS,
  DARK_ELVES,
  DOGS_OF_WAR,
  DWARFS,
  EMPIRE,
  HIGH_ELVES,
  LIZARDMEN,
  ORCS_AND_GOBLINS,
  SKAVEN,
  UNDEAD,
  VAMPIRE_COUNTS,
  WOOD_ELVES,
].map(withCommandGroups).map(withMagicItems)

export function getArmy(id: string): Army | undefined {
  return ARMIES.find((a) => a.id === id)
}

/** Lightweight list for army-pick menus. */
export const ARMY_OPTIONS = ARMIES.map((a) => ({ id: a.id, name: a.name, nameEs: a.nameEs ?? a.name }))
