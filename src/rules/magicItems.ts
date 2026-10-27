import type {
  Army,
  CharacterRank,
  MagicItemCategory,
  RosterEntry,
  UnitProfile,
} from '../data/types'
import { carriedMagicItems, findMagicItem, findUnit, isFixedMagicItem, type CarriedMagicItem } from './points'
import type { Finding } from './messages'

/**
 * The 5th-edition magic-item rules, in one module: how many items a character
 * may carry and which combinations are legal. Both the Muster Check
 * (validate.ts) and the editor UI (EntryRow) consume this interface, so display
 * and enforcement cannot diverge. See research/magic-items-5e.md.
 */

/**
 * Map a character rank to its magic-item allowance (5th ed limits by COUNT,
 * not points).
 *
 * The canonical chart (Warhammer Magia p.30) lists four entries beyond these
 * seven ranks. None of them needs a field of its own — each is already
 * expressible in the data, and the choice is deliberate:
 *
 * - **Vampire Count 2 / Liche 3** — numerically identical to `hero` / `lord`.
 * - **Wight — 1 *in addition to* his Wight Blade.** The blade is innate
 *   equipment, not a pool item: army lists grant it in `specialRules` and bake
 *   its cost into `pointsPerModel`, so it never lands in `magicItemIds` and
 *   costs no slot. That also settles the restricted-category question — an
 *   innate blade cannot collide with a chosen magic weapon.
 * - **Slann Mage-Priest — +1 on his normal wizard level.** Folded into the
 *   rank: `lz-slann` is `wizard2` (2 items at level 1) and its level upgrades
 *   carry `magicItemSlotsDelta`, giving the book's 2→3→4→5.
 *
 * Both special cases are pinned by tests in `src/rules/validate.test.ts`, since
 * they hold by virtue of how the data is written rather than by engine logic.
 */
export const MAGIC_ITEM_ALLOWANCE: Record<CharacterRank, number> = {
  champion: 1,
  hero: 2,
  lord: 3,
  wizard1: 1,
  wizard2: 2,
  wizard3: 3,
  wizard4: 4,
}

/** Categories restricted to at most ONE per character in 5th ed. */
export const RESTRICTED_CATEGORIES: ReadonlySet<MagicItemCategory> = new Set([
  'weapon',
  'armour',
  'shield',
  'ward',
  'banner',
  'boundSpell',
])

/**
 * Effective magic-item allowance for a character entry: the unit's own
 * `magicItemSlots` when it declares one, otherwise its rank's figure from the
 * chart, plus any option deltas on top.
 */
export function magicItemAllowance(entry: RosterEntry, unit: UnitProfile): number {
  const base =
    unit.magicItemSlots ??
    (unit.characterRank ? MAGIC_ITEM_ALLOWANCE[unit.characterRank] : 0)
  const delta = (unit.options ?? [])
    .filter((o) => entry.optionIds.includes(o.id) && o.magicItemSlotsDelta)
    .reduce((sum, o) => sum + (o.magicItemSlotsDelta ?? 0), 0)
  return base + delta
}

/** The unit's fixed extras that are one magic item each: a Dwarf rune group (OLD-69). */
const magicFixedExtraCount = (unit: UnitProfile): number =>
  (unit.fixedExtras ?? []).filter((x) => x.magicItem).length

/**
 * How many of the allowance the entry uses (OLD-69): every carried item (fixed
 * and picked) plus each fixed extra that is a magic item, such as a Dwarf rune
 * group. The Muster Check and the editor's counter both read this number; a
 * caller that already holds the carried list passes it to avoid recomputing.
 */
export function usedMagicItemSlots(
  entry: RosterEntry,
  unit: UnitProfile,
  army: Army,
  carried: CarriedMagicItem[] = carriedMagicItems(entry, unit, army),
): number {
  return carried.length + magicFixedExtraCount(unit)
}

/**
 * Whether the character's own page lets him carry this item (OLD-69). False
 * only for a unit with `allowedMagicItems` when the item is neither on that
 * list nor one of his fixed items. Every other unit chooses freely.
 */
export function isMagicItemAllowed(unit: UnitProfile, itemId: string): boolean {
  return !unit.allowedMagicItems || unit.allowedMagicItems.includes(itemId) || isFixedMagicItem(unit, itemId)
}

/**
 * All per-entry magic-item findings for one roster entry: non-characters may
 * carry none; characters are limited by count (rank + option deltas), to one
 * item per restricted category, one crown and one helm (FAQ v2.20 §19.5), and
 * only a Battle Standard Bearer may carry a magic banner (FAQ v2.20 §23.2).
 * Returns nothing when the entry carries no items.
 *
 * Works on the CARRIED items (OLD-63): the unit's fixed items plus the user's
 * picks. Fixed items count toward the allowance like picked ones, since every
 * page that states the number includes them. The page sets the fixed loadout,
 * so a category clash, a crown/helm clash or a banner on a non-BSB is reported
 * only when at least one item involved is user-picked.
 */
export function entryMagicItemFindings(entry: RosterEntry, unit: UnitProfile, army: Army): Finding[] {
  const carried = carriedMagicItems(entry, unit, army)
  const used = usedMagicItemSlots(entry, unit, army, carried)
  if (used === 0) return []
  if (!unit.isCharacter) {
    return [
      {
        severity: 'error',
        rule: 'magic-items-noncharacter',
        params: { unit },
        entryId: entry.id,
      },
    ]
  }

  const findings: Finding[] = []

  const allowance = magicItemAllowance(entry, unit)
  if (used > allowance) {
    findings.push({
      severity: 'warning',
      rule: 'magic-items-count',
      params: { unit, carried: used, allowance },
      entryId: entry.id,
    })
  }

  // OLD-69: a page that names the only items he may carry. A saved roster can
  // still hold another pick, so each one is reported.
  if (unit.allowedMagicItems) {
    const allowed = unit.allowedMagicItems
      .map((id) => findMagicItem(army, id))
      .filter((i): i is NonNullable<typeof i> => i !== undefined)
    for (const c of carried) {
      if (c.fixed || isMagicItemAllowed(unit, c.item.id)) continue
      findings.push({
        severity: 'warning',
        rule: 'magic-items-not-allowed',
        params: { unit, item: c.item, allowed },
        entryId: entry.id,
      })
    }
  }

  /** Count per key, and whether any item behind the count is user-picked. */
  const tally = <K>(keyOf: (c: CarriedMagicItem) => K | undefined) => {
    const out = new Map<K, { count: number; picked: boolean }>()
    for (const c of carried) {
      const key = keyOf(c)
      if (key === undefined) continue
      const prev = out.get(key) ?? { count: 0, picked: false }
      out.set(key, { count: prev.count + 1, picked: prev.picked || !c.fixed })
    }
    return out
  }

  // One per restricted category
  for (const [category, { count, picked }] of tally((c) => c.item.category)) {
    if (count > 1 && picked && RESTRICTED_CATEGORIES.has(category)) {
      findings.push({
        severity: 'warning',
        rule: 'magic-items-category',
        params: { unit, category, count },
        entryId: entry.id,
      })
    }
  }

  // FAQ v2.20 §19.5: a character may wear at most one crown and one helm.
  for (const [group, { count, picked }] of tally((c) => c.item.exclusiveGroup)) {
    if (count > 1 && picked) {
      findings.push({
        severity: 'warning',
        rule: 'magic-items-exclusive-group',
        params: { unit, group, count },
        entryId: entry.id,
      })
    }
  }

  // FAQ v2.20 §23.2: only a Battle Standard Bearer may carry a magic banner.
  const picksBanner = carried.some((c) => !c.fixed && c.item.category === 'banner')
  if (picksBanner && !(entry.isBSB || unit.isBSB)) {
    findings.push({
      severity: 'warning',
      rule: 'magic-items-banner-bsb',
      params: { unit },
      entryId: entry.id,
    })
  }

  return findings
}

/**
 * Army-wide item uniqueness — 5th ed (Magic supplement p.33): the same magic
 * item may not be included in an army more than once. Exceptions are flagged
 * `duplicable` on the item (Dispel Scrolls, Chaos Armour, Familiars). A unit's
 * magic standard shares the uniqueness pool with characters' items, and a
 * character's fixed items (OLD-63) count like picked ones. So do the master
 * runes on a special character's rune groups (OLD-69, Enanos p.24 Law 4: no
 * master rune may be used more than once). The count is of characters: one
 * entry that both has a rune on his page and buys it again counts once.
 */
export function armyItemUniquenessFindings(entries: RosterEntry[], army: Army): Finding[] {
  const itemUsers = new Map<string, number>()
  for (const e of entries) {
    const unit = findUnit(army, e.unitId)
    const ids = new Set(unit ? carriedMagicItems(e, unit, army).map((c) => c.item.id) : e.magicItemIds)
    for (const x of unit?.fixedExtras ?? []) {
      for (const id of x.uniqueItemIds ?? []) ids.add(id)
    }
    for (const id of ids) {
      itemUsers.set(id, (itemUsers.get(id) ?? 0) + 1)
    }
    if (e.magicStandardId) {
      itemUsers.set(e.magicStandardId, (itemUsers.get(e.magicStandardId) ?? 0) + 1)
    }
  }
  const findings: Finding[] = []
  for (const [id, count] of itemUsers) {
    if (count < 2) continue
    const item = findMagicItem(army, id)
    if (!item || item.duplicable) continue
    findings.push({ severity: 'error', rule: 'magic-items-unique', params: { item, count } })
  }
  return findings
}
