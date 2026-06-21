# Warhammer Fantasy Battle 5th Edition — Army Composition Rules

Sources:
- https://5th.whfb.app/ (Warhammer Fantasy 5th Edition online rules index — authoritative reconstruction of the 1996 rulebook)
- https://5th.whfb.app/set-limits
- https://5th.whfb.app/set-limits/tournament-limits
- https://5th.whfb.app/faq/army-list
- https://5th.whfb.app/points-values
- Wikipedia: https://en.wikipedia.org/wiki/Warhammer_Army_Book
- Cross-checked summary via web search of 5th ed army selection.

## Core percentage system (the mandatory rules)
An army is chosen to a mutually agreed points total. The standard restrictions are:

| Category | Limit | Notes |
|---|---|---|
| **Characters** | **up to 50%** of total points | Generals, heroes, wizards, champions. |
| **Regiments (rank-and-file regular troops / "core")** | **at least 25%** of total points | The minimum backbone of the army. |
| **War machines and/or monsters and/or allies** | **up to 25%** of total points (combined) | Shared cap across these categories. |

- Every army **must have a General** (the most senior character / army commander).
- The above are the broad standard limits. Individual **Warhammer Armies** books further restrict
  specific units with **0-1** ("up to one") or **0-X** availability limits, and minimum unit sizes.
  Note: the 4th and 5th edition shared the same army books.

## Characters / wizards
- The number of characters is primarily bounded by the **50% characters cap**.
- **Wizards** may be restricted by magic level (1, 2, or 3). In **tournament** play wizards are
  capped at **magic level 3** and the army is capped at **2000 points**.
- Army books may set 0-1 limits on specific named/special characters.

## Set limits (optional, player-agreed — model as soft warnings, off by default)
From the Set Limits page, players may agree to reduce/cap things for a given game:
- Percentage of points available for characters reduced to an agreed value or zero.
- Percentage of points available for war machines reduced to an agreed value or zero.
- An agreed maximum number of characters per side.
- Wizards limited to a maximum magic level, or a maximum number of wizards.

## Tournament limits (a common preset)
- Max **2000 points** per side.
- Wizards max **magic level 3**.
- Individual magic items often capped at **50 points** (an agreed set limit; see magic-items-5e.md).

## How the app should encode this
`Army.composition` =
```
{
  maxCharactersPct: 50,
  minRegimentsPct: 25,
  maxWarMachinesMonstersAlliesPct: 25,
  requiresGeneral: true
}
```
`validateRoster` raises:
- ERROR if total points > points limit.
- ERROR if no General selected.
- WARNING (or error) if character points > 50% of the points limit.
- WARNING if regiment points < 25% of the points limit.
- WARNING if (war machines + monsters + allies) points > 25% of the points limit.
- WARNING for each unit exceeding its 0-1 / 0-X availability or below min unit size.
Optional set-limit toggles (tournament mode) can tighten these.
