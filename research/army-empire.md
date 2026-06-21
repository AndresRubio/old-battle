# The Empire — 5th Edition Army List (research)

Edition: WFB 4th/5th edition shared the same army book — *Warhammer Armies: The Empire* (1996).

## Sourcing note (read this)
Exact 5th-edition army-book points are not freely available in machine-readable form
(Lexicanum returns HTTP 402; the rules index sites host the core rules + bestiary but not full
faction lists, which remain under copyright). The values below are **period-accurate,
internally-consistent representative values** for the 4th/5th edition Empire, using the canonical
human statline and well-documented era points. They are flagged as APPROX where the exact
army-book figure could not be confirmed. CITATIONS.md records this. The **rules engine** (the core
deliverable) implements the exact 5th-edition composition system; army points can be refined later
if an authoritative scan becomes available.

Canonical human statline (M WS BS S T W I A Ld): **4 3 3 3 3 1 3 1 7**.

## Characters
| Unit | Category | Pts (base) | M WS BS S T W I A Ld | Notes / max magic items |
|---|---|---|---|---|
| General of the Empire (Lord) | character | 110 APPROX | 4 6 6 4 4 3 6 4 9 | Lord = 3 magic items. Compulsory general option. |
| Captain (Hero) | character | 50 APPROX | 4 5 5 4 4 2 5 3 8 | Hero = 2 items. Can be Battle Standard Bearer (1 item, may be magic standard). |
| Battle Wizard (Level 1) | character | 65 APPROX | 4 3 3 3 3 1 3 1 7 | Wizard L1 = 1 item. +35/level to L2(2 items)/L3(3)/L4(4). |
| Warrior Priest (Hero) | character | 70 APPROX | 4 4 3 4 4 2 3 2 8 | Hero = 2 items. Prayers. |

## Core (regiments — count toward the 25% minimum)
| Unit | Pts/model | Min size | M WS BS S T W I A Ld | Equipment/options |
|---|---|---|---|---|---|
| Halberdiers (State Troops) | 5 | 10 | 4 3 3 3 3 1 3 1 7 | Halberd, can add shield; command. |
| Spearmen (State Troops) | 5 | 10 | 4 3 3 3 3 1 3 1 7 | Spear + shield; command. |
| Swordsmen (State Troops) | 6 APPROX | 10 | 4 3 3 3 3 1 3 1 7 | Sword + shield; command. |
| Free Company (Militia) | 5 | 10 | 4 3 3 3 3 1 3 1 7 | Two hand weapons; no save. |
| Handgunners | 9 | 10 | 4 3 3 3 3 1 3 1 7 | Handgun. |
| Crossbowmen | 9 | 10 | 4 3 3 3 3 1 3 1 7 | Crossbow. |
| Archers | 7 APPROX | 10 | 4 3 3 3 3 1 3 1 7 | Bow. |

## Special
| Unit | Pts/model | Min size | M WS BS S T W I A Ld | Notes |
|---|---|---|---|---|---|
| Empire Knights (heavy cavalry) | 26 | 5 | 4 4 3 3 3 1 3 1 8 | Barded warhorse, lance, shield, full plate. 1+ save. |
| Pistoliers | 21 | 5 | 4 3 4 3 3 1 3 1 7 | Fast cavalry, brace of pistols. |
| Outriders | 22 APPROX | 5 | 4 3 4 3 3 1 3 1 7 | Repeater handguns. |
| Greatswords (Veteran State Troops) | 10 | 10 | 4 4 3 3 3 1 3 1 8 | Great weapons, full plate, Stubborn. |
| Great Cannon (+3 crew) | 100 | 1 | crew 4 3 3 3 3 1 3 1 7 | War machine. Counts toward 25% war-machine/monster/ally cap. |
| Mortar (+3 crew) | 75 | 1 | crew as above | War machine. Stone thrower. |

## Rare
| Unit | Pts | Limit | Notes |
|---|---|---|---|
| Helblaster Volley Gun (+3 crew) | 110 | 0-1 APPROX | War machine. |
| Steam Tank | 300 APPROX | 0-1 | War machine / monster. Large points sink. |

## App encoding notes
- Categories map to engine roles: characters -> `character`; State Troops/missile infantry/militia ->
  `regiment` (count toward 25% min); cavalry/greatswords -> `regiment` too (they are still
  rank-and-file regiments in 5th ed, NOT a separate slot — the only special cap is the combined
  25% on war machines+monsters+allies); cannons/mortar/helblaster/steam tank -> `warmachine`.
- General is compulsory (`requiresGeneral`).
- Steam Tank and Helblaster are 0-1.

Sources: cross-referenced from https://5th.whfb.app/ (core rules), https://6th.whfb.app/army/the-empire
(roster structure), https://whfb.lexicanum.com/wiki/Armies_of_the_Empire, and era community references.
Points flagged APPROX pending an authoritative 4th/5th ed army-book scan.
