# High Elves — 5th Edition Army List (research)

Edition: *Warhammer Armies: High Elves* (4th edition, 1994; used for 4th AND 5th edition).

## Sourcing note
Same representative approach as Empire/O&G (exact army-book points paywalled/copyright).
Values below are period-accurate, internally-consistent, flagged APPROX where uncertain.

High Elf statline (M WS BS S T W I A Ld): **5 4 4 3 3 1 5 1 8**
(Elves: fast M5, skilled WS/BS4, high Initiative 5, brave Ld8.)

## Special rules / notes
- High Elves are an elite, expensive army (few models, high quality).
- **Repeater Bolt Thrower (Eagle Claw)** is the iconic war machine.
- Army must be led by a Prince or Commander (the General).

## Characters
| Unit | Pts (base) | M WS BS S T W I A Ld | Notes / max items |
|---|---|---|---|
| High Elf Prince (Lord) | 110 APPROX | 5 7 7 4 3 3 8 4 10 | Lord = 3 items. General option. |
| High Elf Noble (Hero) | 55 APPROX | 5 6 6 4 3 2 7 3 9 | Hero = 2 items. Can be BSB. |
| High Elf Mage (Wizard L1) | 85 APPROX | 5 4 4 3 3 1 5 1 8 | +35/level to L2/L3/L4 (items = level). High Magic. |

## Core (regiments — count toward 25% min)
| Unit | Pts/model | Min size | Statline | Options |
|---|---|---|---|---|
| Spearmen (Lothern/levy) | 10 APPROX | 10 | High Elf | Spear + shield + light armour; command. |
| Archers | 11 APPROX | 10 | High Elf | Longbow. |

## Special
| Unit | Pts/model | Min size | Statline | Notes |
|---|---|---|---|---|
| Silver Helms (heavy cavalry) | 24 APPROX | 5 | 5 4 4 3 3 1 5 1 8 on barded steed | Lance, shield, heavy armour. |
| Sword Masters of Hoeth | 15 APPROX | 5 | 5 5 4 3 3 1 6 2 8 | Great weapons, 2 attacks; elite. |
| White Lions of Chrace | 14 APPROX | 5 | 5 4 4 3 3 1 5 1 8 | Great weapons, lion cloak (extra save vs missiles). |
| Phoenix Guard | 15 APPROX | 5 | 5 4 4 3 3 1 5 1 8 | Halberds, ward save, cause Fear. |
| Ellyrian Reavers (fast cavalry) | 17 APPROX | 5 | 5 4 4 3 3 1 5 1 8 on steed | Bows and/or spears; fast cavalry. |
| Tiranoc Chariot | 85 APPROX | 1 | chariot | Scythed chariot, crew + 2 steeds. |
| Repeater Bolt Thrower (Eagle Claw) + 2 crew | 100 APPROX | 1 | crew High Elf | War machine; iconic. |

## Rare
| Unit | Pts | Limit | Notes |
|---|---|---|---|
| Great Eagle | 50 APPROX | — | Flying monster/beast. |

## App encoding notes
- Roles: Prince/Noble/Mage -> `character`; Spearmen/Archers/Silver Helms/Sword Masters/White
  Lions/Phoenix Guard/Reavers -> `regiment`; Tiranoc Chariot -> `chariot` (treat as regiment for
  the 25% min unless flagged otherwise); Repeater Bolt Thrower -> `warmachine`; Great Eagle -> `monster`.
- `requiresGeneral` true (Prince or Commander).
- Flavour tags: Sword Masters/White Lions/Phoenix Guard = elite; Phoenix Guard `causeFear` + `wardSave`.

Sources: https://5th.whfb.app/ (core rules), https://whfb.lexicanum.com/wiki/List_of_High_Elves_units,
https://whfb.lexicanum.com/wiki/Warhammer_Armies:_High_Elves_(4th_Edition), and era community
references. Points flagged APPROX pending an authoritative army-book scan.
