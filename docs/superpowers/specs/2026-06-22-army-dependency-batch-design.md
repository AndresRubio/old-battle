# Dependency Batch + Plague-Priest Ratio — Design Spec

**Date:** 2026-06-22
**Status:** Design — mapping confirmed against current data; ready to wire
**Predecessor:** `2026-06-21-army-ratio-rules-design.md` (shipped `ratioCaps` +
`dependencies` engine). This pass adds **data only** — no new engine code — wiring
the army books' already-transcribed "Requires X" notes into enforceable
`dependencies`, plus one clean entry-count `ratioCap`.

---

## Scope

Every rule below is already present as English `specialRules` *text* on a unit
(transcribed from the books) but invisible to the Muster Check. Wiring it into the
existing `dependencies` / `ratioCaps` arrays makes it enforce. No `validate.ts` or
`types.ts` change.

**Deliberately EXCLUDED** (need the deferred model-count or conditional engines,
not this one):
- O&G **Squig Hoppers** ("up to 5 per Night Goblin unit") and **Fanatics** ("3
  hidden per NG unit") — these cap *models* of the unit, and Fanatics are embedded
  in host units. Entry-count ratio can't express them.
- Skaven **Censer Bearers** ("up to half the Plague Monk unit's size, max 10") —
  model-count.
- Dwarfs **Slayers ≤ warrior regiments** — the extraction *claimed* this (p.87) but
  it is NOT in the current data text; not wiring an unverified rule. Revisit only
  after a book re-read.
- Skaven Queek's "replaces the Warlord as General" clause — conditional; only his
  clean "requires a Skaven Warriors regiment" half is wired.
- HE **Caradryan** → Phoenix Guard — analogous to the others but has NO transcribed
  "Requires" note, so left out for consistency (easy to add if confirmed).

---

## `dependencies` to add

### Unambiguous single/clear-target (no judgment needed)
| Army | `unitId` | `requiresAnyOf` | Source text |
|---|---|---|---|
| Dark Elves | `de-kouran` | `['de-black-guard']` | "Requires a Black Guard regiment" |
| Dark Elves | `de-tullaris` | `['de-executioners']` | "Requires an Executioner regiment" |
| Empire | `emp-zarina-katarin` | `['emp-kislev-winged-lancers','emp-kislev-horse-archers']` | "requires at least one Kislev regiment" |
| Empire | `emp-halfling-hot-pot` | `['emp-halflings']` | "requires at least one Halfling regiment" |
| High Elves | `he-alith-anar` | `['he-shadow-warriors']` | "Requires … Shadow Warriors" |
| High Elves | `he-belannaer` | `['he-sword-masters']` | "Requires … Sword Masters of Hoeth" |
| High Elves | `he-korhil` | `['he-white-lions']` | "Requires … White Lions" |
| Skaven | `sk-skrolk` | `['sk-plague-monks']` | "Requires … Plague Monks" |
| Skaven | `sk-queek` | `['sk-clanrats','sk-stormvermin']` | "requires … Skaven Warriors regiment" |

Note DE already has `de-hellebron`→`['de-witch-elves']`; the two new DE rows are
added to the same `dependencies` array.

### O&G racial gating — needs set definitions (JUDGMENT CALLS, defaults below)
Define three id sets once and reuse:
- **ORC_UNITS** = `og-orc-boyz, og-arrer-boyz, og-black-orcs, og-savage-orcs, og-big-uns, og-orc-boar-boyz, og-savage-boar-boyz`
- **GOBLIN_UNITS** (any goblin regiment) = `og-goblins, og-forest-goblins, og-night-goblins, og-goblin-wolf-riders, og-forest-goblin-spider-riders, og-night-goblin-nets-clubs`
- **COMMON_GOBLIN_UNITS** (non-Night/Forest) = `og-goblins, og-goblin-wolf-riders`
- **NIGHT_GOBLIN_UNITS** = `og-night-goblins` (the base NG regiment; deliberately
  excludes the dependent units themselves to avoid self-satisfaction)

| `unitId` | `requiresAnyOf` | Source text |
|---|---|---|
| `og-rock-lobber-small` | ORC_UNITS | "requires an Orc unit" |
| `og-rock-lobber-large` | ORC_UNITS | "requires an Orc unit" |
| `og-spear-chukka` | ORC_UNITS | "requires an Orc unit" |
| `og-orc-boar-chariot` | ORC_UNITS | "Requires an Orc unit" |
| `og-snotling-pump-wagon` | GOBLIN_UNITS | "requires a Goblin unit" |
| `og-goblin-wolf-chariot` | GOBLIN_UNITS | "Requires a Goblin unit" |
| `og-doom-diver` | COMMON_GOBLIN_UNITS | "requires a (non-Night/Forest) Goblin unit" |
| `og-squig-hunters` | NIGHT_GOBLIN_UNITS | "requires at least one Night Goblin unit" |
| `og-night-goblin-nets-clubs` | NIGHT_GOBLIN_UNITS | "requires at least one Night Goblin unit" |

Labels: each row's `labelEn`/`labelEs` reuses the owning unit's `name`/`nameEs`.

## `ratioCaps` to add
| Army | `unitId` | shape | Source text |
|---|---|---|---|
| Skaven | `sk-plague-priest` | `perUnit:{ ids:['sk-plague-monks'] }` (multiplier 1) | "One per regiment of Plague Monks" |

Skaven currently has no `selectionRules` block — add a new one with `ratioCaps`.

---

## Testing
- `validate.test.ts`: the generic `unit-requires` / `unit-ratio-max` behavior is
  already covered. Add 2-3 army-specific cases using `getArmy(...)` fixtures:
  Kouran-without/with Black Guard; an O&G war machine without any Orc unit;
  Skaven Plague Priest exceeding the Plague-Monk-regiment count.
- `armies.test.ts`: the existing per-army integrity tests (`dependency ids
  reference real units`, `ratio-cap ids reference real units`, non-empty
  `requiresAnyOf`) automatically validate every new id across all 14 armies — a
  typo'd id fails the suite. Add a couple of named survive-assembly assertions.
- Gate: `npx tsc --noEmit -p tsconfig.app.json && npm test` green.

## Judgment calls made (correct any before/after wiring)
1. **Skaven Warriors** for Queek = Clanrats + Stormvermin (Slaves excluded — they're
   slaves, not warriors).
2. **"A Goblin unit"** for pump wagon / wolf chariot includes Night & Forest goblin
   regiments (broad reading of "Goblin"). Doom Diver is the narrower
   non-Night/Forest set per its own text.
3. **"Night Goblin unit"** prerequisite = the base `og-night-goblins` regiment only,
   so Nets-&-Clubs and Squig Hunters can't satisfy their own requirement.
4. **Kislev** = both Kislev regiments (Winged Lancers, Horse Archers).
