// Core domain types for the 5th Edition army builder.

/** Battlefield role — drives the 5th edition percentage composition rules. */
export type UnitRole = 'character' | 'regiment' | 'monster' | 'warmachine' | 'chariot'

/** Standard characteristic profile. */
export interface StatLine {
  M: number
  WS: number
  BS: number
  S: number
  T: number
  W: number
  I: number
  A: number
  Ld: number
}

/**
 * Character rank determines how many magic items the model may carry (5th ed
 * limits by COUNT, not points). See research/magic-items-5e.md.
 */
export type CharacterRank =
  | 'champion' // 1 item
  | 'hero' // 2 items
  | 'lord' // 3 items
  | 'wizard1' // 1 item
  | 'wizard2' // 2 items
  | 'wizard3' // 3 items
  | 'wizard4' // 4 items

/** Map a character rank to its magic-item allowance. */
export const MAGIC_ITEM_ALLOWANCE: Record<CharacterRank, number> = {
  champion: 1,
  hero: 2,
  lord: 3,
  wizard1: 1,
  wizard2: 2,
  wizard3: 3,
  wizard4: 4,
}

/** A per-model equipment choice (e.g. shield +1) or a character upgrade. */
export interface EquipmentOption {
  id: string
  name: string
  /** Points added per model, unless `flat` is set (then added once per unit). */
  pointsPerModel: number
  /**
   * When true the cost is a flat per-unit charge (e.g. command group, battle
   * standard) rather than multiplied by the number of models.
   */
  flat?: boolean
  /** Some upgrades (e.g. wizard level, battle standard) change the magic-item allowance. */
  magicItemSlotsDelta?: number
  /** Human-readable description of the option's in-game effect (shown via the ⓘ control). */
  description?: string
  /** Spanish description. Falls back to `description`. */
  descEs?: string
  /**
   * Options sharing one `exclusiveGroup` are mutually exclusive on a single model
   * (e.g. the four Marks of Chaos: at most one per character). Validated as rule
   * `options-exclusive-group` (warning).
   */
  exclusiveGroup?: string
}

/**
 * A rideable mount a character may take. In 5th ed the mount's cost is added to
 * the character and the pair counts toward the Characters % allowance (it is not
 * a separate roster entry). One mount per character — selection is mutually
 * exclusive via `RosterEntry.mountId`.
 */
export interface MountOption {
  id: string
  name: string
  nameEs?: string
  /** Flat points added to the character entry when this mount is chosen. */
  points: number
  /** The mount's own characteristic profile, shown beneath the rider's. */
  statLine?: StatLine
  specialRules?: string[]
  /**
   * Option id the rider must also have for this mount to be legal — e.g. a
   * daemonic mount requires the matching Mark of Chaos. Validated as rule
   * `mount-requires-option` (warning).
   */
  requiresOption?: string
}

/**
 * A read-only extra characteristic profile shown beneath a unit's main statLine
 * — e.g. a chariot's crew / chassis / draught beasts, or a special character's
 * fixed (non-selectable) mount. Display-only: its cost is already baked into the
 * unit's points, so it never changes the entry total.
 */
export interface ProfileBlock {
  name: string
  nameEs?: string
  /** Partial: a chariot chassis only has T/W; absent stats render as "–". */
  statLine: Partial<StatLine>
  specialRules?: string[]
}

export interface UnitProfile {
  id: string
  name: string
  /** Spanish name (from the original Spanish army book). Falls back to `name`. */
  nameEs?: string
  role: UnitRole
  /** Per-model cost for regiments; total base cost for single-model entries. */
  pointsPerModel: number
  statLine?: StatLine
  minSize?: number
  maxSize?: number
  /** Character-only fields. */
  isCharacter?: boolean
  characterRank?: CharacterRank
  canBeGeneral?: boolean
  canBeBSB?: boolean
  /** True for units that ARE the army Battle Standard Bearer inherently (the
   *  dedicated battle-standard character units). Such an entry may carry a magic
   *  banner without the per-entry isBSB toggle. See FAQ v2.20 §23.2. */
  isBSB?: boolean
  /**
   * Named "special character" (e.g. Zhatan, Grombrindal). Display-only: they
   * still count under their `role` for composition. When omitted it is inferred
   * from a `specialRules` entry beginning with "Special character".
   */
  isSpecialCharacter?: boolean
  /** 0-X availability: max number of entries of this unit allowed (undefined = unlimited). */
  max?: number
  /** When true, the regiment may NOT take a command group (e.g. Harpies). */
  noCommand?: boolean
  specialRules?: string[]
  options?: EquipmentOption[]
  /** Rideable mounts the character may take (mutually exclusive — one at most). */
  mounts?: MountOption[]
  /**
   * Lore(s) of magic this wizard may choose from (ids into MAGIC_LORES). Multi
   * element = the army book offers a choice ("Battle or High Magic"). Absent for
   * non-casters. Informational only — does not affect points or validation.
   */
  lores?: string[]
  /**
   * Extra display-only profiles shown beneath the main statLine: a chariot's
   * crew / chassis / draught beasts, or a special character's fixed mount.
   */
  profiles?: ProfileBlock[]
}

export interface CompositionRules {
  /** Characters may use up to this % of the total points (5th ed: 50). */
  maxCharactersPct: number
  /** At least this % must be regiments (5th ed: 25). */
  minRegimentsPct: number
  /** War machines (and chariots) may use up to this % (5th ed: 25). */
  maxWarMachinesPct: number
  /** Monsters may use up to this % (5th ed: 25). */
  maxMonstersPct: number
  /** Army must include a General (5th ed: true). */
  requiresGeneral: boolean
}

export type MagicItemCategory =
  | 'weapon'
  | 'armour'
  | 'shield'
  | 'ward'
  | 'banner'
  | 'boundSpell'
  | 'talisman'
  | 'enchanted'
  | 'arcane'
  | 'other'

/** Categories restricted to at most ONE per character in 5th ed. */
export const RESTRICTED_CATEGORIES: ReadonlySet<MagicItemCategory> = new Set([
  'weapon',
  'armour',
  'shield',
  'ward',
  'banner',
  'boundSpell',
])

export interface MagicItem {
  id: string
  name: string
  /** Spanish name. Falls back to `name`. */
  nameEs?: string
  category: MagicItemCategory
  points: number
  description?: string
  /** Spanish description. Falls back to `description`. */
  descEs?: string
  /** Army ids this item is restricted to (undefined/empty = common to every army). */
  restrictedTo?: string[]
  /** True for items unique to named special characters — consultable but not freely selectable. */
  special?: boolean
  /**
   * True for the documented exceptions to army-wide uniqueness (Dispel Scrolls,
   * Chaos Armour, Familiars). Undefined/false = the item is unique and may
   * appear only once per army. See the Magic supplement p.33.
   */
  duplicable?: boolean
  /**
   * Head-slot exclusivity group. A character may wear at most one 'crown' and at
   * most one 'helm' (one of each is allowed). See FAQ v2.20 §19.5.
   */
  exclusiveGroup?: 'crown' | 'helm'
}

export interface SelectionRules {
  /**
   * Caps on the COMBINED count of several unit variants the army book treats as
   * a single 0-N slot (e.g. all Runesmith ranks together; either Battle Standard
   * variant). Per-unit `max` cannot express this. Validated as `unit-group-max`.
   */
  unitGroupCaps?: {
    ids: string[]
    max: number
    labelEn: string
    labelEs: string
  }[]
  /**
   * Ratio caps: the maximum count of `unitId` is derived from the points limit
   * and/or the number of other qualifying entries in the roster. Validated as
   * rule `unit-ratio-max` (warning).
   */
  ratioCaps?: {
    /** The capped unit (the entry whose count is limited). */
    unitId: string
    labelEn: string
    labelEs: string
    /** When true, sum entry sizes (models) instead of counting entries. */
    countModels?: boolean
    /** Adds floor(pointsLimit / perPoints) to the limit. Inactive when pointsLimit === 0. */
    perPoints?: number
    /** Adds multiplier × (qualifying entry count) to the limit. */
    perUnit?: {
      /** Unit ids whose entries are counted toward the limit. */
      ids: string[]
      /** Default 1. (e.g. 2 for "up to 2 per regiment".) */
      multiplier?: number
      /** Only count entries with size ≥ minSize (default: count every entry). */
      minSize?: number
      /** When true, sum entry sizes (models) instead of counting entries. */
      countModels?: boolean
    }
    /** Lower bound — the army is always entitled to at least this many. */
    floor?: number
    /** Hard ceiling regardless of the computed limit. */
    absoluteMax?: number
  }[]
  /**
   * Prerequisites: `unitId` may only be included when at least one of
   * `requiresAnyOf` is also present in the roster. Validated as rule
   * `unit-requires` (warning).
   */
  dependencies?: {
    unitId: string
    requiresAnyOf: string[]
    labelEn: string
    labelEs: string
    /**
     * Also satisfied if any CHARACTER entry has this option id selected (e.g. a
     * Chaos god Mark). Lets a dependency be met by an option choice, not just a
     * unit's presence. See FAQ v2.20 §31.4/§31.7 (daemons need a same-god character).
     */
    requiresOption?: string
    /**
     * Human-readable requirement for the warning message (e.g. "a Khorne
     * character"). Falls back to the joined names in `requiresAnyOf`.
     */
    requiresLabelEn?: string
    requiresLabelEs?: string
  }[]
}

export interface Army {
  id: string
  name: string
  /** Spanish name. Falls back to `name`. */
  nameEs?: string
  composition: CompositionRules
  units: UnitProfile[]
  magicItems: MagicItem[]
  selectionRules?: SelectionRules
}

/** A single chosen unit/character in a roster. */
export interface RosterEntry {
  /** Unique instance id within the roster. */
  id: string
  unitId: string
  size: number
  optionIds: string[]
  magicItemIds: string[]
  /** The chosen mount id (from the unit's `mounts`), if any. */
  mountId?: string
  /** The chosen lore of magic (id into MAGIC_LORES), if the unit is a wizard. */
  loreId?: string
  isGeneral?: boolean
  isBSB?: boolean
}

export interface Roster {
  id: string
  name: string
  armyId: string
  pointsLimit: number
  entries: RosterEntry[]
}

export type Severity = 'error' | 'warning'

export interface RuleViolation {
  severity: Severity
  /** Machine-readable rule id, e.g. 'points-over'. */
  rule: string
  message: string
  /** The offending entry, when applicable. */
  entryId?: string
}

/**
 * Standard 5th edition composition: 50% characters max, 25% regiments min, and
 * SEPARATE 0-25% caps for war machines (incl. chariots) and monsters — as set
 * out in the 4th/5th ed army-list organisation charts (e.g. Dark Elves p.48).
 */
export const STANDARD_5E_COMPOSITION: CompositionRules = {
  maxCharactersPct: 50,
  minRegimentsPct: 25,
  maxWarMachinesPct: 25,
  maxMonstersPct: 25,
  requiresGeneral: true,
}
