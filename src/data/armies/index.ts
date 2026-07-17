import type { Army } from '../types'
import { commandOptions } from '../unitOptions'
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
import { HALFLINGS } from './halflings'
import { NORSE } from './norse'

/**
 * Give every multi-model regiment a command group (standard bearer + musician,
 * each priced at double the unit's base cost) unless it already defines those
 * options. Done once here rather than repeated across ~70 unit definitions.
 * There is no unit-champion option in 4th/5th ed — champions are separate
 * paladin/hero/commander character entries.
 */
function withCommandGroups(army: Army): Army {
  return {
    ...army,
    units: army.units.map((u) => {
      if (u.role !== 'regiment' || u.noCommand) return u
      const existing = new Set((u.options ?? []).map((o) => o.id))
      const extra = commandOptions(u.pointsPerModel).filter((o) => !existing.has(o.id))
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

/**
 * Flag every regiment whose army-list entry allows a **magic standard** (detected
 * from its `specialRules`, e.g. "May carry a magic standard") so the editor can
 * offer a magic-standard picker.
 *
 * There is deliberately no points cap. Every 5th-ed army list grants the standard
 * at "el valor en puntos indicado en la carta" — the books name no per-unit
 * ceiling, so the choice is bounded only by which items exist. Permission is
 * granted entry by entry, never army-wide: the army-list preamble says only that
 * "a algunos regimientos se les permite portar estandartes mágicos". See
 * CITATIONS.md — Magic-standard caps.
 *
 * A unit that already declares `magicStandard` explicitly, or that cannot take a
 * command group (`noCommand`), is left untouched. Non-regiment carriers (the army
 * Battle Standard character) go through the character magic-item path instead.
 */
function withMagicStandards(army: Army): Army {
  return {
    ...army,
    units: army.units.map((u) => {
      // Regiments carry it on a standard-bearer model; chariots carry it on the
      // chariot itself ("Algunos carruajes de guerra también pueden portar un
      // estandarte mágico" — Magia p.42), so `noCommand` only bars a regiment.
      const carrier = u.role === 'regiment' || u.role === 'chariot'
      if (u.magicStandard || !carrier || (u.role === 'regiment' && u.noCommand)) return u
      const allowed = u.specialRules?.some((r) => /magic standard/i.test(r)) ?? false
      return allowed ? { ...u, magicStandard: true } : u
    }),
  }
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
  HALFLINGS,
  HIGH_ELVES,
  LIZARDMEN,
  NORSE,
  ORCS_AND_GOBLINS,
  SKAVEN,
  UNDEAD,
  VAMPIRE_COUNTS,
  WOOD_ELVES,
].map(withCommandGroups).map(withMagicStandards).map(withMagicItems)

export function getArmy(id: string): Army | undefined {
  return ARMIES.find((a) => a.id === id)
}

/** Lightweight list for army-pick menus. */
export const ARMY_OPTIONS = ARMIES.map((a) => ({ id: a.id, name: a.name, nameEs: a.nameEs ?? a.name }))
