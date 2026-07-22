# Citations & Sourcing

This app implements **Warhammer Fantasy Battle 5th Edition (1996)** army building. Below are the
sources used and an honest note on data accuracy.

## Rules (exact — the core deliverable)
The army-composition and magic-item rules implemented by the validation engine are taken from the
5th-edition rules, primarily via the community rules-index reconstruction:

- **Warhammer Fantasy: 5th Edition online rules index** — https://5th.whfb.app/
  - Set Limits — https://5th.whfb.app/set-limits
  - Tournament Limits — https://5th.whfb.app/set-limits/tournament-limits
  - Points Values — https://5th.whfb.app/points-values
  - Army List FAQ — https://5th.whfb.app/faq/army-list
  - Choosing Magic Items — https://5th.whfb.app/magic-items/choosing-magic-items
  - Magic Standards — https://5th.whfb.app/magic-items/magic-standards-magic-items
- **Warhammer Army Book (overview)** — https://en.wikipedia.org/wiki/Warhammer_Army_Book

### Lores of magic (spell lists — `src/data/lores.ts`)
Each wizard's selectable lore and its spells (name, casting value, effect text) are transcribed from
the 5th-edition **Warhammer Magic** deck summaries on the same rules index. English is verbatim from
the source; Spanish is our translation (same convention as the rest of the app's data).
- Battle Magic — https://5th.whfb.app/spells-summary/battle-magic
- High Magic — https://5th.whfb.app/spells-summary/high-magic-spells-summary
- Dark Magic — https://5th.whfb.app/spells-summary/dark-magic-spells-summary
- Necromantic Magic — https://5th.whfb.app/spells-summary/necromantic-magic
- Waaagh! Magic — https://5th.whfb.app/spells-summary/waaagh-magic-spells-summary
- Skaven Magic — https://5th.whfb.app/spells-summary/skaven-magic-spells-summary
- Chaos Dwarf Magic — https://5th.whfb.app/spells-summary/chaos-dwarf-magic
- Magic of Tzeentch — https://5th.whfb.app/spells-summary/tzeentch-chaos-spells
- Magic of Nurgle — https://5th.whfb.app/spells-summary/nurgle-chaos-spells
- Magic of Slaanesh — https://5th.whfb.app/spells-summary/slaanesh-chaos-spells

Three further lores come from the optional **"Further Ideas & Spells"** chapter of the 1996 Warhammer
Magic supplement (agree-with-opponent expansion rules), wired to the wizards that use them:
- Ice Magic (Tzarina Katarin) — https://5th.whfb.app/further-ideas-and-spells/ice-magic-spells
- Amber Magic (Norse shamans; the Amber College) — https://5th.whfb.app/further-ideas-and-spells/amber-spells
- Grey Magic (Olorin the Grey Wizard; the Grey College) — https://5th.whfb.app/further-ideas-and-spells/grey-spells

**Accuracy note:** for the ten core lores the English spell text is transcribed *verbatim* from the
source. For Ice / Amber / Grey the spell **names and casting values are exact**, but the effect text
is a faithful *mechanical summary* of the source (range, dice, Strength, effect) rather than the
publisher's verbatim prose — see the cited pages for the original wording. No spell text is invented.

### Composition rules implemented
- Characters: up to **50%** of total points.
- Regiments (rank-and-file): at least **25%** of total points.
- War machines + monsters + allies (combined): up to **25%**.
- Army must include a **General**.
- Magic items limited by **count per character rank** (not points): Champion/L1 wizard = 1,
  Hero/L2 = 2, Lord/L3 = 3, Wizard Lord (L4) = 4, BSB = 1; max one per restricted category.
- Optional tournament preset: ≤ 2000 pts, wizards ≤ level 3, magic items ≤ 50 pts.
- **Unit magic standards:** a regiment whose army-list entry allows a magic standard may take one,
  carried by its standard bearer, at the points value printed on the item's card — the books set **no
  per-unit cap**. The engine enforces the standard-bearer prerequisite, banner-only selection and
  army-wide uniqueness. See "Magic-standard caps" below for the sourcing.

### Magic-standard caps: there are none in 5th edition (sourced 2026-07-17)
**5th edition sets no per-unit points cap on a magic standard.** Checked against every book in
`source/` (18 scans, Spanish and English): not one army list states a ceiling. Every entry that grants
a standard prices it the same way — *"elegido de entre las cartas de estandarte mágico, **por el valor
en puntos indicado en la carta**"* (e.g. Imperio PDF 61/printed 59; Orcos y Goblins PDF 85/83; Condes
Vampiro PDF 66/64; Reino del Caos PDF 105/103). The English books match: *"Some regiments are allowed
magic standards… chosen from the magic items in the Warhammer Magic supplement"* (Bretonnia PDF
60/printed 58). A sweep for `hasta N puntos` / `up to N points` near a standard returns nothing.

The one sentence that suggests otherwise is *Warhammer Magia* PDF 44 / **printed 42** (vision-verified):
*"El valor en puntos máximo del estandarte está **habitualmente** limitado, por lo que sólo las
unidades más veteranas podrán portar los estandartes más poderosos."* Read against the lists, that is
descriptive prose, not a rule these books implement — "habitualmente" is doing the work, and no list
follows through with a number. (The familiar "worth up to 50 pts" phrasing is **8th-edition** wording
and is *not* a valid 5th-ed value.) So `UnitProfile.magicStandard` is a plain allow-flag: no
`MAGIC_STANDARD_MAX`, no cap check, no "limit unconfirmed" warning.

What the books *do* constrain is **which units** may take one. The preamble is always *"a algunos
regimientos se les permite portar un estandarte mágico"* — permission is granted **entry by entry**,
in each unit's `OPCIONES:` / `Options:` block, never army-wide. Two related rules that are real:
- **Pricing** (Magia printed 42): the standard's points are added to the standard bearer and are
  **not** doubled — "el valor en puntos del estandarte no debe duplicarse". Book example: High Elf
  Spearman 12 → bearer 24 → with a 50-pt standard = 24+50 = 74.
- **Chariots** (Magia printed 42): *"Algunos carruajes de guerra también pueden portar un estandarte
  mágico… el valor del estandarte deberá añadirse al del carruaje, pero el valor del carruaje no
  deberá duplicarse."* Confirmed in the lists for O&G, High Elves, Wood Elves, Chaos, Undead and
  Vampire Counts.

(Halflings and Norse had no official 5th-ed army book, so their entries follow the Hungry Horde and
Norsca supplements rather than a *Warhammer Armies* volume.)

## Army data (representative — see note)
**Important honesty note:** exact 5th-edition army-book points values are **not freely available**
in machine-readable form. The 4th/5th-edition *Warhammer Armies* books remain under copyright;
Lexicanum returns HTTP 402; the rules-index sites host the core rules and a bestiary but not full
faction lists. Accordingly, the unit rosters, statlines and points in `src/data/armies/` are
**period-accurate, internally-consistent representative values** for the 4th/5th-edition books, with
individual figures flagged `APPROX` in the research notes where the exact army-book number could not
be confirmed. They are suitable for a faithful list-building experience and for exercising the
(exact) rules engine, but should not be treated as the official points.

### Special rules sourced from the army books (`source/`)
- **Savage Orc Shaman** (`og-shaman-savage-orc`) — the two "joined to a Savage Orc unit" rules
  (an extra magic card for him alone; the war-paint ward improves 6+ → 5+ for the Shaman and the
  unit) are transcribed from *Ejércitos Warhammer: Orcos y Goblins* (1997, ES), **printed p.19**
  (PDF p.21, offset +2), via `source/transcribed/orcs-goblins.md`. Linear OLD-16.
- **Battle Standard Bearers** (all six `og-bsb-*` entries) — I/A were transcribed as I1/A3; the
  book (printed p.79, via `source/transcribed/orcs-goblins-lista-ejercito.md`) actually gives I3/A2
  for all six BSBs. Corrected; no other stats or points changed. Linear OLD-6.
- **Big Bosses** (all six `og-bigboss-*` entries) — I/A were transcribed as I2/A4; the book
  (printed p.80, via `source/transcribed/orcs-goblins-lista-ejercito.md`) actually gives I4/A3
  for all six Big Bosses. Corrected; no other stats or points changed. Linear OLD-7.
- **Chariot mounts for characters** (`mount-boar-chariot` 81 pts, `mount-wolf-chariot` 65 pts) —
  chariot profiles (crew / draught beasts / chassis F7 R7 H3 I1) and option costs (extra crewman
  +7.5 orc / +3.5 goblin, 3rd Giant Wolf +4, crew shields & short bows +1/+0.5 per crewman,
  scythed wheels +20) transcribed from the book's printed p.88 army-list entries. The standalone
  chariot units' chassis rows were also completed from `{T7 W3}` to `{S7 T7 W3 I1}` per the same
  book row. Linear OLD-8.

### Statlines verified against the 5th-edition bestiary
The following monster statlines were corrected to match the authoritative 5th-edition bestiary
(per-unit pages under https://5th.whfb.app/unit/...): **Giant** (M6 WS3 BS3 S7 T6 W6 I3 A* Ld6),
**Troll** (M6 WS3 BS1 S5 T4 W3 I1 A3 Ld4), **Treeman** (M6 WS8 BS3 S6 T7 W6 I2 A4 Ld9),
**Ogre** (M6 WS3 BS2 S4 T5 W3 I3 A2 Ld7), **Great Eagle** (M2 WS7 BS0 S5 T4 W3 I5 A2 Ld8).
Other monster/troop statlines remain representative where no bestiary page was available.

**Points values:** exact 1996 army-book points are still not freely available online (checked
Lexicanum [paywalled], the 5th-edition rules index [core rules + bestiary only, no points], and
community PDF collections [cover pages only]). All points in `src/data/armies/` therefore remain
period-accurate representative estimates. If you have the army books or a reliable transcription,
the exact numbers can be dropped straight into the data files.

Army sources consulted:
- The Empire — https://whfb.lexicanum.com/wiki/Armies_of_the_Empire ;
  roster structure cross-ref https://6th.whfb.app/army/the-empire — see research/army-empire.md
- Orcs & Goblins — https://5th.whfb.app/faq/orcs-and-goblins ;
  https://whfb.lexicanum.com/wiki/List_of_Orcs_%26_Goblins_units — see research/army-orcs-goblins.md
- High Elves — https://whfb.lexicanum.com/wiki/List_of_High_Elves_units — see research/army-high-elves.md

## Disclaimer
Warhammer and all associated names are trademarks of Games Workshop. This is an unofficial,
fan-made list-building tool for personal use and is not affiliated with or endorsed by Games Workshop.
