import type {
  Army,
  CharacterRank,
  MagicItemCategory,
  RosterEntry,
  UnitProfile,
} from '../data/types'
import { findMagicItem } from './points'
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

/** Effective magic-item allowance for a character entry (rank + any option deltas). */
export function magicItemAllowance(entry: RosterEntry, unit: UnitProfile): number {
  const base = unit.characterRank ? MAGIC_ITEM_ALLOWANCE[unit.characterRank] : 0
  const delta = (unit.options ?? [])
    .filter((o) => entry.optionIds.includes(o.id) && o.magicItemSlotsDelta)
    .reduce((sum, o) => sum + (o.magicItemSlotsDelta ?? 0), 0)
  return base + delta
}

/**
 * All per-entry magic-item findings for one roster entry: non-characters may
 * carry none; characters are limited by count (rank + option deltas), to one
 * item per restricted category, one crown and one helm (FAQ v2.20 §19.5), and
 * only a Battle Standard Bearer may carry a magic banner (FAQ v2.20 §23.2).
 * Returns nothing when the entry carries no items.
 */
export function entryMagicItemFindings(entry: RosterEntry, unit: UnitProfile, army: Army): Finding[] {
  if (entry.magicItemIds.length === 0) return []
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
  if (entry.magicItemIds.length > allowance) {
    findings.push({
      severity: 'warning',
      rule: 'magic-items-count',
      params: { unit, carried: entry.magicItemIds.length, allowance },
      entryId: entry.id,
    })
  }

  // One per restricted category
  const seen = new Map<MagicItemCategory, number>()
  for (const id of entry.magicItemIds) {
    const item = findMagicItem(army, id)
    if (!item) continue
    seen.set(item.category, (seen.get(item.category) ?? 0) + 1)
  }
  for (const [category, count] of seen) {
    if (count > 1 && RESTRICTED_CATEGORIES.has(category)) {
      findings.push({
        severity: 'warning',
        rule: 'magic-items-category',
        params: { unit, category, count },
        entryId: entry.id,
      })
    }
  }

  // FAQ v2.20 §19.5: a character may wear at most one crown and one helm.
  const groupCounts = new Map<'crown' | 'helm', number>()
  for (const id of entry.magicItemIds) {
    const g = findMagicItem(army, id)?.exclusiveGroup
    if (g) groupCounts.set(g, (groupCounts.get(g) ?? 0) + 1)
  }
  for (const [group, count] of groupCounts) {
    if (count > 1) {
      findings.push({
        severity: 'warning',
        rule: 'magic-items-exclusive-group',
        params: { unit, group, count },
        entryId: entry.id,
      })
    }
  }

  // FAQ v2.20 §23.2: only a Battle Standard Bearer may carry a magic banner.
  const carriesBanner = entry.magicItemIds.some((id) => findMagicItem(army, id)?.category === 'banner')
  if (carriesBanner && !(entry.isBSB || unit.isBSB)) {
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
 * magic standard shares the uniqueness pool with characters' items.
 */
export function armyItemUniquenessFindings(entries: RosterEntry[], army: Army): Finding[] {
  const itemUsers = new Map<string, number>()
  for (const e of entries) {
    for (const id of e.magicItemIds) {
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
