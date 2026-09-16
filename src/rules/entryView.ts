import type { Army, EquipmentOption, MagicItem, MountOption, ProfileBlock, StatLine, StatNotes, UnitProfile } from '../data/types'
import { isWizardLevelId, STANDARD_BEARER_ID } from '../data/unitOptions'
import { matchesQuery, type Lang } from '../i18n/lang'

/**
 * Pure per-entry derivations the editor renders. Anything the UI needs to
 * *decide* (eligibility, pairings) lives here so the rule has one statement,
 * shared with validation, and is testable without rendering a component.
 */

/**
 * The text one characteristic column shows: the value, or "–" when the book's
 * row leaves that column blank.
 *
 * ANY of the nine columns may print a non-numeric token instead of a number —
 * a dice expression ("5D6" Movement, "1D6" Attacks), a range ("2-10", the
 * artillery dice) or a word ("Especial"/"Sp" Weapon Skill). `StatLine` is all
 * `number` and stays that way, so the token rides alongside in `statNotes` and
 * REPLACES the numeric value here. This is the single statement of that rule:
 * the editor's stat strip (`StatLineRow`) and the plaintext export both go
 * through it, so the screen and the exported list can never disagree about what
 * the book prints.
 */
export function statCell(
  key: keyof StatLine,
  statLine: Partial<StatLine>,
  notes?: StatNotes,
): string {
  const note = notes?.[key]
  if (note) return note
  return String(statLine[key] ?? '–')
}

/**
 * The stat notes to render in a given language. `statNotes` holds the English
 * rendering of every noted column; `statNotesEs` overrides only the columns
 * whose token is a word rather than a dice expression ("Sp" → "Esp"), exactly
 * like the `nameEs` / `descEs` fallback convention used elsewhere.
 */
export function resolveStatNotes(
  src: { statNotes?: StatNotes; statNotesEs?: StatNotes },
  lang: Lang,
): StatNotes {
  return lang === 'es' ? { ...src.statNotes, ...src.statNotesEs } : (src.statNotes ?? {})
}

/** A unit magic standard must be a non-special banner — Magia p.42. */
export function isValidMagicStandard(item: MagicItem): boolean {
  return item.category === 'banner' && !item.special
}

/**
 * The banners a unit may choose its magic standard from: every valid banner in
 * the army's pool, or none at all when the army list gives the unit no magic
 * standard. The books set no points cap — a banner costs whatever its card says.
 */
export function eligibleMagicStandards(unit: UnitProfile, army: Army): MagicItem[] {
  return unit.magicStandard ? army.magicItems.filter(isValidMagicStandard) : []
}

/**
 * Whether the unit's magic standard has to be carried by a standard-bearer
 * model the player buys first. True exactly when the unit is offered one —
 * regiments and chariot units, whose bearer costs double an equipped model /
 * the whole chariot (FAQ 1996 §3.3, §5.1.4). A Stegadon's howdah or a Halfling
 * farm machine carries the banner itself and has no bearer to buy, so it must
 * not be asked for one. Shared by the editor and `validateRoster` so the
 * picker's gate and the warning can't diverge.
 */
export function magicStandardNeedsBearer(unit: UnitProfile): boolean {
  return unit.options?.some((o) => o.id === STANDARD_BEARER_ID) ?? false
}

/**
 * Split a unit's options into the mutually-exclusive wizard-level upgrades
 * (rendered as a radio group) and everything else (checkboxes). One statement
 * of the partition, shared by the editor and the plaintext export.
 */
export function partitionOptions(unit: UnitProfile): {
  levelOptions: EquipmentOption[]
  toggleOptions: EquipmentOption[]
} {
  const options = unit.options ?? []
  return {
    levelOptions: options.filter((o) => isWizardLevelId(o.id)),
    toggleOptions: options.filter((o) => !isWizardLevelId(o.id)),
  }
}

/** Whether the expanded entry has ANY configurable choice to offer. */
export function hasAnyOptions(unit: UnitProfile): boolean {
  return (
    (unit.options?.length ?? 0) > 0 ||
    (unit.mounts?.length ?? 0) > 0 ||
    !!unit.isCharacter ||
    (unit.lores?.length ?? 0) > 0 ||
    !!unit.magicStandard
  )
}

/**
 * The magic-item picker's filter: bilingual name search plus an optional
 * points ceiling (raw input string — '' means no cap).
 */
export function filterMagicItems(items: MagicItem[], query: string, maxPts: string): MagicItem[] {
  const q = query.trim().toLowerCase()
  const cap = maxPts.trim() === '' ? Infinity : Number(maxPts)
  return items.filter((i) => i.points <= cap && matchesQuery(i, q))
}

/**
 * Cavalry pairing: the mount profile shown as a second stat row directly
 * beneath the rider — a regiment's fixed steed (`unit.mount`) or the profile
 * of a character's chosen mount. A chariot mount has no single statLine (it
 * contributes crew / beast / chassis rows instead) and yields undefined.
 */
export function companionMountProfile(
  unit: UnitProfile,
  selectedMount: MountOption | undefined,
): ProfileBlock | undefined {
  return (
    unit.mount ??
    (selectedMount?.statLine
      ? {
          name: selectedMount.name,
          nameEs: selectedMount.nameEs,
          statLine: selectedMount.statLine,
          // The mount's book tokens ride along, or the row would print an
          // invented "–" where the book prints e.g. "1D6" Attacks.
          statNotes: selectedMount.statNotes,
          statNotesEs: selectedMount.statNotesEs,
          specialRules: selectedMount.specialRules,
        }
      : undefined)
  )
}
