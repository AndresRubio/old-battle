# Warhammer Fantasy Battle 5th Edition — Magic Items Rules

Sources:
- https://5th.whfb.app/magic-items/choosing-magic-items
- https://5th.whfb.app/magic-items/magic-standards-magic-items
- https://5th.whfb.app/set-limits/tournament-limits

## Key difference from 6th edition
5th edition limits magic items by **NUMBER of items per character (by rank)**, NOT by a points
allowance. (The points-allowance system is 6th edition.) Each item still has a fixed points cost
that is added to the carrying model's cost.

## Max number of magic items by character type
| Character type | Max magic items |
|---|---|
| Champion | 1 |
| Wizard (level 1) | 1 |
| Hero | 2 |
| Wizard Champion (level 2) | 2 |
| Lord | 3 |
| Master Wizard (level 3) | 3 |
| Wizard Lord (level 4) | 4 |
| Battle Standard Bearer | 1 (may be a magic standard) |

Some army-specific characters have their own limits (e.g. Vampire Counts 2, Liches 3,
Wights 1 plus their Wight Blade).

## Category restriction
> "No character can carry more than one magic weapon, magic armour, ward, bound spell or magic standard."

Exceptions: Dispel Scrolls may be duplicated across wizards; Chaos Armour may be worn by multiple
characters; Familiars may be duplicated (but not duplicates of the same type per wizard).

## Carriers
- Magic items are normally carried by **character models**.
- **Magic standards** must be carried by a regiment's standard bearer, a chariot, or the army
  battle standard bearer.

## Points
- Each magic item has a fixed points value, added to the carrying model's points.
- There is **no per-character points limit** in the base rules. Tournament/agreed games often cap
  individual magic items at **50 points**.

## How the app should encode this
- Each character `UnitProfile` gets `maxMagicItems` (by rank) and the engine enforces it.
- Track each item's `category` (weapon | armour | ward | banner | boundSpell | talisman | enchanted | arcane | other).
- `validateRoster` raises:
  - WARNING if a character has more magic items than `maxMagicItems`.
  - WARNING if a character has more than one item of the restricted categories
    (weapon, armour, ward, boundSpell, standard) — excepting the documented exceptions.
  - Optional tournament toggle: WARNING if any single item costs > 50 pts.
- Magic standards may only be assigned to a unit's standard bearer / BSB.
