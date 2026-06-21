# Orcs & Goblins — 5th Edition Army List (research)

Edition: *Warhammer Armies: Orcs & Goblins* (4th edition, 1993; used for 4th AND 5th edition).

## Sourcing note
Same approach as Empire (see research/army-empire.md): exact army-book points are not freely
available (Lexicanum 402; the avianon history page was unreachable; the book remains under
copyright). Values below are **period-accurate, internally-consistent representative values**
for the 4th/5th edition Orcs & Goblins list, flagged APPROX where the exact figure is uncertain.
Confirmed anchors from web search: Orc Arrer Boyz 7 pts, Goblins 3 pts, Orc Boyz with hand weapon +
light armour (~6 pts), spears/extra hand weapon/shield +1 pt each. Source list at bottom.

Statlines (M WS BS S T W I A Ld):
- Orc: 4 3 3 3 4 1 2 1 7   (note Toughness 4)
- Goblin: 4 2 3 3 3 1 2 1 6
- Night Goblin: 4 2 3 3 3 1 2 1 5
- Black Orc: 4 4 3 4 4 1 2 1 8

## Special rules (drive validation/warnings)
- **Animosity**: all Orc & Goblin units (except Black Orcs) are subject to Animosity.
- **Black Orcs**: immune to Animosity; quell nearby greenskin squabbling.
- **Night Goblins**: hate/fear Elves; may include **Fanatics** and **Netters**.
- A greenskin army **must be led by an Orc or Goblin Warboss** (the General).

## Characters
| Unit | Pts (base) | M WS BS S T W I A Ld | Notes / max items |
|---|---|---|---|
| Orc Warboss (Lord) | 90 APPROX | 4 6 3 4 5 3 4 4 9 | Lord = 3 items. General option. |
| Orc Big Boss (Hero) | 45 APPROX | 4 5 3 4 4 2 3 3 8 | Hero = 2 items. |
| Goblin Warboss (Lord) | 65 APPROX | 4 5 3 4 4 2 4 3 7 | Lord = 3 items. |
| Orc Shaman (Wizard L1) | 65 APPROX | 4 3 3 3 4 1 2 1 7 | +35/level to L2/L3/L4 (items = level). Waaagh! magic. |
| Night Goblin Shaman (Wizard L1) | 55 APPROX | 4 2 3 3 3 1 2 1 6 | +35/level. |

## Core (regiments — count toward 25% min)
| Unit | Pts/model | Min size | Statline | Options |
|---|---|---|---|---|
| Orc Boyz | 6 | 10 | Orc | Choppa(hand wpn)+light armour; +1 spear / +1 extra hand wpn / +1 shield; command. |
| Orc Arrer Boyz | 7 | 10 | Orc | Bow. |
| Big 'Uns (veteran Orcs) | 9 APPROX | 10 | Orc (Ld8) | Bigger, meaner Orcs. |
| Goblins | 3 | 20 | Goblin | Spear or bow + shield; command. |
| Night Goblins | 3 APPROX | 20 | Night Goblin | May add Fanatics (0-1 per unit) and Netters. |

## Special
| Unit | Pts | Min size | Statline | Notes |
|---|---|---|---|---|
| Black Orcs | 14 APPROX | 10 | Black Orc | Heavy armour, immune to Animosity. |
| Boar Boyz (Orc cavalry) | 22 APPROX | 5 | Orc on boar | Boars are tough; cavalry. |
| Goblin Wolf Riders | 11 APPROX | 5 | Goblin on wolf | Fast cavalry; spear/bow + shield. |
| Trolls | 40 APPROX | 1 | 6 3 1 5 4 3 1 3 4 | Stupidity, regeneration; monster. |
| Goblin Spear Chukka (Bolt Thrower) + 2 crew | 35 APPROX | 1 | crew Goblin | War machine. |
| Orc Rock Lobber (Stone Thrower) + 3 crew | 80 APPROX | 1 | crew Orc | War machine. |

## Rare
| Unit | Pts | Limit | Notes |
|---|---|---|---|
| Giant | 200 APPROX | 0-1 | Monster. Big and unpredictable. |
| Doom Diver Catapult + 2 crew | 80 APPROX | 0-1 | War machine. |
| Snotling Pump Wagon | 45 APPROX | — | War machine / chariot oddity. |

## App encoding notes
- Roles: Warboss/Big Boss/Shamans -> `character`; Orc Boyz/Arrer Boyz/Big 'Uns/Goblins/Night
  Goblins/Black Orcs/Boar Boyz/Wolf Riders -> `regiment` (toward 25% min); Trolls/Giant -> `monster`;
  Spear Chukka/Rock Lobber/Doom Diver/Pump Wagon -> `warmachine`. Monster+warmachine+allies share
  the 25% cap.
- `requiresGeneral` true (Orc or Goblin Warboss).
- 0-1 limits: Giant, Doom Diver.
- Special-rule tags for future UI flavour: `animosity`, `immuneToAnimosity` (Black Orcs),
  `fearElves`/`fanatics` (Night Goblins).

Sources: https://5th.whfb.app/faq/orcs-and-goblins,
https://whfb.lexicanum.com/wiki/List_of_Orcs_&_Goblins_units,
https://whfb.lexicanum.com/wiki/Warhammer_Armies:_Orcs_&_Goblins_(4th_Edition),
and web-search anchors (Orc Arrer Boyz 7, Goblins 3, Orc Boyz options). Points flagged APPROX
pending an authoritative army-book scan.
