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
  Vampire Counts. This **overrides** the 1996 FAQ §5.1.4 answer *"How much do standard bearers cost
  for regimental chariot units? — Double the cost of the whole chariot"*, which is a `[Primarch]`
  arbitration with no book citation behind it. Chariots therefore get no command group at all, and
  a chariot's magic standard costs only the banner's own card value.

### Command group: equipment counts before doubling (sourced 2026-08-06)
The standard bearer and musician each cost **double a rank-and-file model** — *"A unit standard
bearer costs double the points of a normal figure in the unit"* / *"A musician costs double the
points of a normal figure in the unit"*, both citing **Warhammer Armies p.2** (FAQ 1996 v2.20
§3.3, §3.5). Magia printed 42 gives the worked example: High Elf Spearman 12 → bearer 24.

What that model costs is settled by the next sentence of §3.3: *"Include the cost of all of the
equipment for a rank and file member of the unit before doubling it for the cost of the standard
bearer."* So Empire Halberdiers at 7, with light armour (+2) and shields (+1), field a 10-pt
trooper and a 20-pt standard bearer — not 14. Provenance note: the ×2 rule carries a book citation,
but the include-the-equipment clause is marked `[Primarch]`, i.e. a ruling by the FAQ compilers
rather than printed text. It is adopted because no army-book entry prices a command model
independently, so the generic rule is the only statement of the cost, and the books' own example
(a bare spearman) does not contradict it.

Mechanically this makes the command group the one option whose price depends on the rest of the
entry: `EquipmentOption.timesModelCost` declares the multiple and `unitOptionCost` derives the
points from the current selection. Reading `pointsPerModel` off such an option yields 0.

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
- **Night Goblin Shaman** (`og-shaman-night-goblin`) — replaced the wrong 6th-edition-flavoured
  "extra power dice" tag with the four actual "Shamanes Goblins Nocturnos" rules (Shaman Mushrooms,
  1 per wizard level, each usable once per battle; eating one for 1D6 extra magic cards for him
  alone; a -1 penalty to that phase's Mental Burst roll; casting without Orcs & Goblins nearby but
  no Winds of Magic cards without a nearby energy source), transcribed from *Ejércitos Warhammer:
  Orcos y Goblins* (1997, ES), **printed p.18** (PDF p.20, offset +2). Linear OLD-14.
- **Savage Orc Shaman** (`og-shaman-savage-orc`) — the two "joined to a Savage Orc unit" rules
  (an extra magic card for him alone; the war-paint ward improves 6+ → 5+ for the Shaman and the
  unit) are transcribed from *Ejércitos Warhammer: Orcos y Goblins* (1997, ES), **printed p.19**
  (PDF p.21, offset +2), via `source/transcribed/orcs-goblins.md`. Linear OLD-16.
- **Forest Goblin Shaman** (`og-shaman-forest-goblin`) — had no tags at all for its "Shamanes
  Goblins Silvanos" rules; added the two book rules (spider venom gives +1 to the Mental Burst
  roll and makes a natural 6 count as passing the Waaagh! check with no ill effect, so the worst
  possible result is a 2 and "Mental Burst" itself is impossible; any failed Waaagh! check — even
  one "saved" by that natural 6 — staggers him 2D6cm in a random direction), transcribed from
  *Ejércitos Warhammer: Orcos y Goblins* (1997, ES), **printed p.19** (PDF p.21, offset +2). Linear
  OLD-15.
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
- **Bosses** (all six `og-boss-*` entries) — HP/F/I were mistranscribed (Black Orc: I1/A3;
  Orc & Savage Orc: HP3/F3/I1; Goblin/Forest Goblin/Night Goblin: HP2/F3/I1); the book's "Jefes"
  table (printed p.80, via `source/transcribed/orcs-goblins-lista-ejercito.md`) actually gives
  HP4/F5/I3/A2 for the Black Orc Boss, HP4/F4/I3/A2 for the Orc and Savage Orc Bosses, and
  HP4/F4/I3/A2 for the Goblin/Forest Goblin/Night Goblin Bosses. Corrected; no other stats or
  points changed. Linear OLD-9.
- **Warbosses and special characters** (five `og-warboss-*` entries plus `og-azhag`, `og-oglok`,
  `og-grom`, `og-gorbad`, `og-gorfang`, `og-morglum`, `og-skarsnik`) — I/A were transcribed one
  column out because the source comments dropped the book's **H** column (nine printed columns are
  M / HA / HP / F / R / H / I / A / L). The book gives I5/A4 for the Orc, Savage Orc, Goblin,
  Forest Goblin and Night Goblin Warbosses (printed p.79, via
  `source/transcribed/orcs-goblins-lista-ejercito.md`, corroborated by the p.98 reference table),
  and for the special characters (printed pp.90-93, via `source/transcribed/orcs-goblins.md`):
  Azhag I5/A4, Oglok I4/A4, Grom I5/A4, Gorbad I5/A4, Gorfang I4/A3, Morglum I5/A4, Skarsnik I6/A4.
  The Black Orc Warboss already held the right values; only its comment was fixed. Skarsnik's row
  carries a transcription note of its own: both passes misread it and it was settled by re-reading
  the scan at 400 DPI. Corrected; no other stats or points changed. Linear OLD-18.
- **Giant Spider Initiative** (`GIANT_SPIDER_STATS`) — left at **I1** deliberately. The book
  contradicts itself: I1 in the p.79 character-mount table, I2 for the Forest Goblin Spider Riders
  on p.83; both transcription passes agree on I1 at p.79, so it is the original that disagrees with
  itself, not an OCR slip. The p.79 row is the one that applies to a character's mount, so it wins.
  Logged as an open incidencia in the transcription and on Linear OLD-18.
- **Carrying several weapons at once** — deliberately NOT restricted. A character may buy a bow, a
  short bow and a crossbow together, or a halberd and a two-handed weapon, and the builder allows
  it. The rulebook is explicit that a warrior carries a hand weapon *plus* other weapons and picks
  which to use: "Se supone que todos los guerreros están equipados con una espada (u otra arma de
  mano similar). Además, algunos guerreros estarán equipados con otras armas como lanzas, hachas a
  dos manos o alabardas. Si el jugador lo desea, las tropas equipadas de esta forma podrán golpear
  con su arma de mano en vez de hacerlo con su otra arma" (Reglamento printed p.54). The
  restrictions the rules do impose are on *use*, not purchase — a two-handed weapon or halberd
  bars the shield in close combat (p.54-55), and only one magic weapon may be wielded (p.93,
  already enforced by `RESTRICTED_CATEGORIES`). Nothing forbids owning more than one weapon, and
  the O&G Equipment List only prints prices, so adding an `exclusiveGroup` here would invent a
  rule the books do not contain. Buying redundant weapons wastes points; it is not illegal.
- **Character equipment list** (`OG_CHARACTER_EQUIPMENT`) — the book's "LISTA DE EQUIPO" (printed
  p.78, PDF page 80, read directly off the scan) is "todas las armas y armaduras normales con que
  puede equiparse un personaje Orco o Goblin": additional hand weapon 1, two-handed weapon 2,
  spear 1, halberd 2, bow 2, short bow 1, crossbow 3, shield 1, light armour 2. The first hand
  weapon is free and is already each character's base kit, so only these nine paid rows are
  offered. The list is deliberately **without heavy armour** — the armour-save table on the same
  page mentions Armadura Pesada, but the Equipment List does not offer it to Orcs & Goblins.
  Applied to all 29 non-special characters: Warboss ("cualquier arma o armadura de entre las que
  aparecen en la Lista de Equipo", p.79), Battle Standard (same wording, p.79), Big Boss
  ("cualquier arma o armadura de las indicadas en la Lista de Equipo", p.80), Shaman ("cualquiera
  de las armas o armaduras permitidas al tipo de tropas indicadas en esta lista", p.81) and Boss
  ("siempre está armado y equipado de la misma forma que el resto de los miembros de su regimiento
  — consulta la Lista de Equipo para sus valores en puntos", p.80). The seven special characters
  are excluded: each has a fixed kit in its own "ARMAS Y ARMADURA" paragraph. Two of the book's
  restrictions cannot be enforced by the app — a Boss entry has no link to a regiment entry, and
  "troop type" is not modelled — so both are surfaced as note tags on the affected entries rather
  than silently dropped or silently invented. Linear OLD-19.
- **War Boar and Giant Wolf mount profiles** (`WAR_BOAR_STATS`, `GIANT_WOLF_STATS`) — the same
  dropped-**H** column shift as the Warbosses above, but on the beast rows it moved **HA** as well
  as I. The book (printed p.79 character-mount table, **read directly off the PDF scan**) gives
  War Boar `18 4 0 3 4 1 3 1 3` and Giant Wolf `22 4 0 3 3 1 3 1 3` for the nine columns
  M / HA / HP / F / R / H / I / A / L; the code held War Boar HA3/I2 and Giant Wolf HA3. Corrected
  to HA4/I3 and HA4 respectively. The two rows are corroborated by the p.73/p.74 bestiary entries,
  both p.82 rider entries, the two p.88 chariots, the p.98 reference table and the mount rows of
  Oglok, Gorbad, Gorfang and Morglum (pp.90-92) — every one identical. Both are single constants
  shared by character mounts, cavalry steeds and chariot draught teams, so the fix reaches all of
  them at once. Movement converted as usual (18cm→7", 22cm→9"). No points changed. Linear OLD-20.
- **Grom's Giant Wolves** (printed p.91) — the book really does print `22 4 0 3 **4** 1 3 1 3` for
  the wolves pulling Grom's chariot, i.e. **T4** where every other Giant Wolf row in the book has
  T3. Confirmed by re-reading the scan at 400 DPI, so it is a special-character variant, not an OCR
  slip. The generic `GIANT_WOLF_STATS` must stay at the book's T3. Recorded here so a future
  pass does not "fix" the transcription. Linear OLD-20. Grom now shows his own T4 wolf row (OLD-73,
  see the Orcs & Goblins subsection below).
- **Orc Shaman mounts** (`og-shaman-orc`) — wrongly offered a Giant Wolf mount; the book's
  "Shamanes" section (printed p.81, "Monturas" paragraph, via
  `source/transcribed/orcs-goblins-lista-ejercito.md`) gives Orc/Savage Orc shamans War Boar (+8)
  or a monster/chariot — the Giant Wolf is the Goblin shaman's mount, not the Orc's. Swapped
  `og-shaman-orc` onto `ORC_MOUNTS` (War Boar + Orc Boar Chariot + monsters); removed the Giant
  Wolf and the now-unused `ORC_SHAMAN_MOUNTS` const. Linear OLD-11 (child of OLD-10).
- **Orc & Savage Orc Shaman per-level statlines** (`og-shaman-orc`, `og-shaman-savage-orc`) — the
  book's "Shamanes Orcos" table (printed p.81, via `source/transcribed/orcs-goblins-lista-ejercito.md`)
  gives each wizard level its own full profile (Shaman F3 H1 I3 A1 / Paladín F4 H2 I3 A1 / Maestro
  F4 H3 I4 A2 / Gran F4 H4 I5 A3 L8) and notes "Los Orcos Salvajes usan los atributos de los
  Shamanes Orcos"; the levels are now replacement `statLine`s on the wizard-level options, and the
  Savage Orc Shaman's base was corrected from the level-2 row (F4/H2) to the level-1 row (F3/H1).
  No points changed. Linear OLD-12.
- **Goblin/Forest Goblin/Night Goblin Shaman per-level statlines** (`og-shaman-goblin`,
  `og-shaman-forest-goblin`, `og-shaman-night-goblin`) — the book's "Shamanes Goblins" table
  (printed p.81, via `source/transcribed/orcs-goblins-lista-ejercito.md`) gives each wizard level
  its own full profile (Shaman F3 H1 I3 A1 L5 / Paladín F4 H2 I3 A1 L5 / Maestro F4 H3 I4 A2 L5 /
  Gran F4 H4 I5 A3 L6), shared by all three goblin variants; the levels are now replacement
  `statLine`s on `GOBLIN_SHAMAN_LEVELS`. No points changed. Linear OLD-13.
- **Goblin/Forest Goblin/Night Goblin Shaman mounts** (`og-shaman-goblin`,
  `og-shaman-forest-goblin`, `og-shaman-night-goblin`) — verified against the book's "Shamanes"
  → "Monturas" paragraph (printed p.81, via `source/transcribed/orcs-goblins-lista-ejercito.md`):
  Goblin → Giant Wolf +4, Goblin Silvano → Giant Spider +4, Goblin Nocturno → no beast (monster or
  chariot only); any Shaman may also ride a monster or the Goblin Wolf Chariot (+65), never the
  Orc Boar Chariot. Data already matched (`GOBLIN_MOUNTS`/`FOREST_GOBLIN_MOUNTS`/
  `NIGHT_GOBLIN_MOUNTS` from OLD-8/OLD-11); added a regression test pinning the full mount matrix.
  No data changed. Linear OLD-17.
- **Ogres category** (`og-ogres`) — moved from the Monsters section to the Regiments section
  (`role: 'monster'` → `'regiment'`); the book has no Ogres line in its Monsters table, they are a
  mercenary regiment. Points, statline and equipment options unchanged. `minSize` was left at its
  pre-existing value (1), which is unverified against the book — flagged as Linear OLD-30, needs a
  local pass with `source/` to confirm the regiment's real minimum unit size before it is trusted.
  Linear OLD-22.
- **Ogre minimum unit size** (`og-ogres`) — `minSize: 1` → `5`, closing the OLD-22 note above.
  `source/1997 orcos y goblins.pdf`, printed p.82 = PDF 84 (PEÑAS section header): a regiment has
  no maximum size, but every unit must be composed of at least 5 models *unless stated otherwise*.
  On printed p.86 = PDF 88, three of the four mercenary entries state otherwise — Giants ("units
  of fewer than five miniatures"), Trolls ("below the normal minimum of five miniatures") and
  Snotlings (their own per-base organisation table) — and the Ogres entry does not, so the default
  floor applies. The same p.86 read also confirms the entry's unchanged data: 40 pts/model,
  M15 HA3 HP2 F4 R5 H3 I3 A2 L7, hand weapon, no save, one of additional hand weapon (+1) /
  two-handed weapon (+2) / halberd (+2), plus light armour (+2). The entry likewise carries no
  command-group prohibition — contrast Squig Hoppers on the same page, which are expressly denied
  champions, standards and musicians — so `noCommand` stays unset. Linear OLD-30.
- **Trolls and Snotlings category, and the three Troll types** (`og-trolls`, `og-snotlings`) —
  both moved from the Monsters section to the Regiments section (`role: 'monster'` → `'regiment'`),
  the same correction OLD-27 made for the Giant. `source/1997 orcos y goblins.pdf`, CONTENIDO
  (printed p.2 = PDF 4): "TROLLS ... 86" and "SNOTLINGS ... 86" are listed under **PEÑAS**, while
  **LISTA DE MONSTRUOS** is a separate section on p.89 holding neither. Because a non-regiment
  entry is a single-model entry to `entryPoints`, a unit of three Trolls used to cost 65 pts
  instead of 195; as regiments they are priced per model as the book prices them.
  Printed p.86 = PDF 88 confirms the unchanged entry data — Trolls 65 pts/model, M15 HA3 HP1 F5 R4
  H3 I1 A3 L4; Snotlings 15 pts/base, M10 HA2 HP2 F1 R1 H3 I3 A3 L4 — and gives both a `minSize`
  of 1: Trolls, "el número de Trolls en una unidad puede ser inferior al mínimo normal de cinco
  miniaturas [...] Podrías, por ejemplo, tener sólo un Troll en tu ejército y contaría como una
  unidad él solo"; Snotlings, "si tienes tan sólo una peana de Snotlings, ésta contará como una
  unidad por sí misma". The per-army-size unit-count tables on the same page (1-5 Trolls = 1 unit,
  6-10 = up to 2, …) are NOT modelled — the app has no rule shape for them, and the printed Troll
  ranges overlap (11-15 → up to 3 units, then "de 12 a 20 Trolls = hasta 4 unidades"), an
  inconsistency of the original also recorded in `source/transcribed/`.
  The three Troll types come from the same page: "cualquiera de los tres tipos: Trolls, Trolls de
  Río, y Trolls de Piedra [...] deben estar organizados en unidades del mismo tipo", all at the one
  65 pts/model price — so they are modelled as three 0-pt options sharing `exclusiveGroup:
  'troll-type'`, not as three separate entries or as a points upgrade. Their effects are from the
  Bestiary (printed p.75 = PDF 77), where the army-list entry sends the reader: **Stone Trolls**
  automatically dispel a spell cast at the unit on a 4, 5 or 6 on 1D6 (both sides' spells; it does
  not stop magic weapons or items unless they cast spells conventionally); **River Trolls** impose
  -1 to hit them in close combat, to a minimum chance of 6, with no effect on shooting; common
  Trolls add nothing to the fear / stupidity / regeneration / vomit rules every Troll has.
  `noCommand: true` on both, applying the criterion OLD-27 set for the Giant: the book gives Trolls
  no equipment and no OPCIONES line at all ("Los Trolls no necesitan armas para luchar, aunque a
  menudo llevan un gran garrote"), unlike the rank-and-file `og-ogres`; and for Snotlings the
  Bestiary (printed p.72 = PDF 74, "OFICIALES") says heroes may neither join nor lead them and that
  they are "demasiado excitados como para entender incluso las órdenes más simples". The same p.72
  read also removed an unsourced claim from the Snotlings entry — "9 models per base" appears
  neither there nor on p.86, which say only that a base holds several Snotlings and is used as a
  single creature with multiple attacks and wounds. Linear OLD-28.
- **War-machine crew light armour** (Orcs & Goblins, Dwarfs, Skaven) — the books price this
  upgrade *per crew model*, but a war machine is a single-model entry to `entryPoints` (only
  `role: 'regiment'` multiplies by `size`), so each option is stored `flat`, already multiplied by
  the machine's fixed crew. O&G `source/1997 orcos y goblins.pdf` printed p.87 = PDF 89, the same
  line under LANZADOR DE ROCAS and LANZAVIROTES: "La dotación [...] puede equiparse con Armaduras
  Ligeras por un coste adicional de +2 puntos por miniatura", with "tres Orcos" of crew → **+6**
  (it was only a `specialRules` note before, with no way to buy it). Dwarfs
  `source/1995 Enanos.pdf` printed pp.88-89 = PDF 90-91, the same line under all six machines
  (Cañón 110, Cañón Órgano 65, Cañón Lanzallamas 119, Lanzador de Virotes 54, Lanzador de Rocas
  Pequeño 74 / Grande 104), each with "una dotación de tres artilleros Enanos" → **+6** (was
  encoded as a per-model 2, i.e. 2 pts for a three-man crew). Skaven `source/1995 skaven.pdf`
  printed p.67 = PDF 69: "Cada Mosquete Jezzail tiene una dotación de dos Skaven [...] puede
  equiparse con armaduras ligeras a un coste de +4 puntos por miniatura" → **+8** (it was pointing
  at the generic 2-pt infantry light armour). All thirteen machines' base points already matched
  the book and are unchanged. Those same pages also settle the issue's other question: **no war
  machine in these three books may buy extra crew** — the crew is fixed (three Orcs, three Dwarfs,
  two Skaven; the O&G Snotling Pump Wagon is crewed by one Snotling base, the Doom Diver by an
  implied unlimited supply, the Dwarf Gyrocopter by a single pilot). The only "tripulantes
  adicionales" the O&G book prices belong to the chariots (p.88, implemented in OLD-23).
  Linear OLD-25.
- **Tiranoc Chariot per-crewman and per-steed options** (High Elves) — `source/1997 Altos Elfos.pdf`
  printed p.79 = PDF 81, MÁQUINAS DE GUERRA / AURIGAS DE TIRANOC. The entry is "84 puntos por
  miniatura" (base unchanged) for a chariot "tirado por dos Corceles Élficos y tripulado por dos
  Elfos" — **two Aurigas, two steeds**. Its OPCIONES line: "Cualquier Auriga puede equiparse con un
  Escudo por un coste adicional de +1, y/o sustituir su Armadura Ligera por una Armadura Pesada por
  un coste adicional de +1 punto por Auriga. Cualquier Auriga puede equiparse con una Lanza por un
  coste adicional de +1 punto por miniatura, y sustituir su Arco por un Arco Largo por un coste
  adicional de +1 punto por miniatura." — all four are priced **per Auriga**, so each is stored
  `flat` at **+2** (1 × 2 crew), the same modelling fix OLD-25 applied to war-machine crews. Barding
  likewise: "Los Corceles de los Carruajes pueden equiparse con Barda con un coste adicional de +4
  puntos cada uno. Debe equiparse con barda a todos los Corceles, o a ninguno." → `flat` **+8**
  (4 × 2 steeds); note the book would charge 4 × 4 = 16 on a chariot that also takes the extra pair
  of steeds, which an `EquipmentOption` cannot express (its cost cannot depend on another
  selection). The two genuinely per-chariot options are unchanged at their printed face value:
  "cuchillas en las ruedas por un coste adicional de +20 puntos" and "dos Corceles Élficos más [...]
  por un coste adicional de +6 puntos los dos corceles". The same page's Repeater Bolt Thrower (100
  pts, "una dotación de dos Altos Elfos") has no OPCIONES line at all, so it correctly offers none.
  Linear OLD-31.
- **High Elf character and chariot statlines, and Silver Helm barding** (High Elves) —
  `source/1997 Altos Elfos.pdf`, a Spanish image scan whose PDF index runs **+2** ahead of the
  printed page. Book stat columns M / HA / HP / F / R / H / I / A / L → M / WS / BS / S / T / W /
  I / A / Ld; Movement converted as usual (12cm→5"). Five values corrected, each read off the scan
  and cross-checked on up to three independent pages:
  - **Tiranoc Chariot crew Strength** (`he-tiranoc-chariot`) — `S: 4` → **`S: 3`**. Printed p.79 =
    PDF 81 prints "Auriga 12 5 4 3 3 1 7 1 8"; printed p.68 = PDF 70 (bestiary) and the printed
    p.101 = PDF 103 reference table print the same row. Three concordant sources: an Auriga is an
    ordinary S3 Elf warrior. The chariot's own chassis (T7 W3) and its 84-pt base are unchanged.
  - **Battle Standard Bearer Ballistic Skill** (`he-battle-standard`) — `BS: 4` → **`BS: 5`**.
    Printed p.73 = PDF 75: "Portaestandarte de Batalla 12 5 5 4 3 1 7 2 8" (confirmed printed
    p.101 = PDF 103).
  - **High Elf Hero Ballistic Skill** (`he-hero`) — `BS: 4` → **`BS: 6`**. Printed p.73 = PDF 75:
    "Héroe 12 6 6 4 4 2 8 3 9" (confirmed printed p.101 = PDF 103).
  - **Paladin Ballistic Skill** (`he-paladin`) — `BS: 4` → **`BS: 5`**. Printed p.74 = PDF 76:
    "Paladín 12 5 5 4 3 1 7 2 8" (confirmed printed p.101 = PDF 103).
    Cause of the three BS errors: these entries are built from the file-local `elf()` helper, whose
    default BS is 4 (the rank-and-file Guerrero Elfo, p.62), and none of them overrode it. The book
    gives High Elf characters **BS equal to WS** (Paladín 5/5, Héroe 6/6, Comandante 7/7); only the
    General (`he-general`, already `BS: 7`) had the override and is unchanged. `armies.test.ts` now
    pins all four rows in full, plus BS === WS across the four generic characters.
  - **Silver Helm barding** (`he-silver-helms`) — `pointsPerModel: 4` → **`8`**. Printed p.75 =
    PDF 77: "Cualquier unidad puede equipar sus Corceles con bardas por un coste adicional de +8
    puntos por miniatura." The constant was named `BARDING_4` after the wrong price and is renamed
    `BARDING_8`; it is used by the Silver Helms entry only (the Tiranoc Chariot has its own
    `CHARIOT_BARDING`, the separate per-steed +4 of OLD-31 — a different book line, unchanged).
  Linear OLD-32.

#### Known book conflicts left as-is (High Elves)
Two readings from the same scan that must **not** be "corrected" later by someone working off the
book's own reference table. Both are recorded here deliberately; the code is unchanged.
- **White Lions Strength — book erratum, code keeps S4.** The printed p.101 = PDF 103 summary table
  prints "Leones Blancos 12 5 4 3 3 1 6 1 8", i.e. **S 3**. The bestiary (printed p.67 = PDF 69)
  and the army list (printed p.76 = PDF 78) both print **S 4**. Two independent pages to one, and
  S4 is what a two-handed axe-armed Chracian is elsewhere in the edition, so `he-white-lions` keeps
  `S: 4`; the reference table is the outlier. Pinned by a test in `armies.test.ts`. Linear OLD-32.
- **Great Eagle Ballistic Skill — unverified, code keeps BS0.** Printed p.80 = PDF 82 renders the
  HP (BS) column as a smudged, unreadable glyph: "Águila Gigante 5 7 ö 5 4 3 5 2 8". `BS: 0` is
  what the code has and is consistent with every other monster in that table, but the printed digit
  itself could not be read on this scan — it is *unverified*, not confirmed. Left alone pending a
  cleaner scan. Linear OLD-32.
- **Standalone O&G chariots: crew shields and short bows are priced per crewman** (Orcs & Goblins)
  — `source/1997 orcos y goblins.pdf` printed p.88 = PDF 90, CARRUAJE DE JABALÍES ORCO (81 puntos,
  "2 tripulantes Orcos", 2 War Boars) and CARRUAJE DE LOBOS GOBLIN (65 puntos, 2 Goblin crew, 2
  Giant Wolves). Their OPCIONES lines: "Cualquier Carruaje puede contar con dos tripulantes
  adicionales por un coste de 7,5 puntos cada uno [3,5 on the Wolf Chariot]. La tripulación de
  cualquier Carruaje puede equiparse con Escudos por un coste adicional de **+1 punto por
  tripulante** [+0,5 on the Wolf Chariot]. La dotación de cualquier Carruaje puede equiparse con
  Arcos Cortos por un coste adicional de **+1 punto por tripulante** [+0,5]. Cualquier Carruaje
  puede equiparse con ruedas con cuchillas por un coste adicional de 20 puntos **por carruaje**."
  The base points (81 / 65) and every printed rate are unchanged; what was wrong was the
  multiplier. OLD-23 had stored shields and bows as plain per-model options, and since a chariot is
  a single-model entry for `entryPoints` (only `role: 'regiment'` multiplies by `size`), they
  charged for **one** crewman instead of the crew. Unlike the war-machine crews of OLD-25 and the
  Tiranoc Chariot of OLD-31, a `flat` pre-multiplied total cannot express this: the crew is not
  fixed — "dos tripulantes adicionales" means the entry may carry 2, 3 or 4 crewmen, so the cost
  has to follow the selection. `UnitProfile.baseCrew` (2 on both) plus the existing `perCrewman` /
  `addsCrewman` flags — until now honoured only for a `MountOption` — now drive the unit resolver
  too, so a standalone chariot and the same chariot ridden as a character mount price identically
  for the same crew and kit. Full Boar Chariot: 81 + 7,5 + 7,5 + 4×1 + 4×1 + 20 = **124**. Scythed
  wheels stay flat at 20, priced "por carruaje"; the Wolf Chariot's third Giant Wolf stays flat at
  4, the book attaching no per-anything qualifier to it. Nothing in the book's OPCIONES lines is
  missing from the data, and nothing in the data is absent from the book. Linear OLD-35.

#### Chariot chassis display profiles (OLD-33)
A chariot's chassis is a display-only `ProfileBlock`, and `ProfileBlock.statLine` is a
`Partial<StatLine>` so the UI prints "–" for any column left out. Eight chassis were short the
columns their book actually prints — typically **Strength and Initiative** — so the app was hiding
real book data; three of them also carried **T and W the book contradicts**. Each row below was read
off the PDF scan and cross-checked against `source/transcribed/*.md`. Page offset is **+2** for every
book (PDF index = printed page + 2), per `source/OFFSETS.md`. The verified reference these were
checked against is `CHARIOT_CHASSIS_STATS = { S: 7, T: 7, W: 3, I: 1 }` in `orcsGoblins.ts`
(printed p.88, unchanged). No points changed — these are display profiles only.
- **Tiranoc Chariot chassis** (`he-tiranoc-chariot`) — `{ T: 7, W: 3 }` → **`{ S: 7, T: 7, W: 3,
  I: 1 }`**. *Altos Elfos*, printed **p.79** = PDF 81: "Carruaje - - - 7 7 3 1 - -". Printed p.68
  (bestiary) and the printed p.101 reference table print the same row — three concordant pages.
- **Gorthor's Tuskgor Chariot** (`ch-gorthor`) — `{ S: 7, T: 7, W: 3 }` → **`{ S: 7, T: 7, W: 3,
  I: 1 }`**. *Paladines del Caos*, printed **p.44** = PDF 46: "CARRUAJE – – – 7 7 3 1 – –".
- **Chaos Chariot chassis** (`ch-chariot`) — `{ T: 7, W: 3 }` → **`{ S: 7, T: 7, W: 3, I: 1 }`**.
  *Reino del Caos*, printed **p.104** = PDF 106: "Carruaje - - - 7 7 3 1 - -".
- **Beastman Chariot chassis** (`ch-beast-chariot`) — `{ T: 7, W: 3 }` → **`{ S: 7, T: 7, W: 3,
  I: 1 }`**. *Reino del Caos*, printed **p.109** = PDF 111: "Carruaje - - - 7 7 3 1 - -".
- **Undead Chariot chassis** (`ud-undead-chariot`) — `{ T: 5, W: 3 }` → **`{ S: 5, T: 5, W: 3,
  I: 1 }`**. *No Muertos*, printed **p.84** = PDF 86: "Carruaje Esquelético - - - 5 5 3 1 1D6 -";
  the identical row is reprinted on printed p.68.
- **Chariot of Arkhan** (`ud-arkhan-the-black`) — `{ T: 5, W: 4 }` → **`{ WS: 4, S: 6, T: 6,
  W: 3 }`**. *No Muertos*, printed **p.91** = PDF 93: "Carruaje de Arkhan - 4 - 6 6 3 - 1D6 -".
  **T and W were wrong**, not merely missing: the book gives T6 W3, the code held T5 W4.
- **Volkmar's War Altar** (`emp-volkmar`) — `{ T: 5, W: 4 }` → **`{ S: 7, T: 7, W: 3, I: 1 }`**.
  *Imperio*, printed **p.69** = PDF 71: "Altar – – – 7 7 3 1 – –". **T and W were wrong.**
- **Imperial War Wagon chassis** (`emp-war-wagon`) — `{ T: 5, W: 4 }` → **`{ S: 7, T: 7, W: 5,
  I: 1 }`**. *Imperio*, rules section printed **p.20** = PDF 22: "Torre del Carruaje de Guerra
  Imperial - - - 7 7 5 1 - -". The army-list row on printed p.65 = PDF 67 prints the same line
  **without the F column**, and the prose on printed p.20 settles which Strength applies: *"el
  Atributo de Fuerza del propio Carro de Guerra Imperial, es decir 7"*. **T and W were wrong** (the
  book gives T7 W5, the code held T5 W4).

**The `A: 1D6` that cannot be entered — resolved by OLD-39, then generalised by OLD-43 (both
below).** The Undead Chariot (printed p.84) and the Chariot of Arkhan (printed p.91) both print
**1D6 Attacks**. `StatLine.A` is typed `number` and still is, so `A` remains deliberately **absent**
from both statLines rather than being flattened to an invented average or to a literal. What has
changed is that the printed token is no longer dropped: it is carried beside the statLine and
rendered in the A column, so the UI no longer prints "–" where the book prints a roll. OLD-39 did
that with an Attacks-only `ProfileBlock.attacksNote`; **OLD-43 removed that field** and replaced it
with `statNotes`, which works in all nine columns and on units and mounts as well as profiles.
Pinned by tests in `armies.test.ts`.

**Parked deliberately — do not "fix" these off the same audit.** Each needs its own decision and has
its own Linear issue:
- ~~**Marauder Chariot** (`ch-marauder-chariot`, `{ T: 5, W: 3 }`) — printed p.104 shows a single
  "Carruaje" row inside the Chaos-Warrior group and **no second chassis row** for the 80-pt Carruaje
  Bárbaro. Whether that one row governs both chariots is unresolved, so nothing was changed.~~
  **Done in OLD-38** (below): one printed row governs both chariots; now `{ S: 7, T: 7, W: 3, I: 1 }`.
- ~~**Wood Elf War Chariot** (`we-war-chariot`, `{ T: 4, W: 3 }`) — the book appears to print T7, but
  a light elven chariot at T7 is surprising enough that the scan needs a human eye first.~~
  **Done in OLD-38** (below): confirmed `{ T: 7, W: 3 }`, no S or I printed.
- **Black Coach chassis** (`vc-black-coach`) — the book prints a full nine-column row that the
  unit's own top-level `statLine` already carries; filling the `ProfileBlock` would duplicate it in
  the UI. A display-design question, not a data fix.
- ~~**Malekith's Black Chariot** (`de-witch-king`) — has no `profiles` array at all, so this is an
  addition rather than a correction.~~ **Done in OLD-39** (below): the `profiles` array was added.
- **The Imperial War Wagon's top-level `statLine`** (`emp-war-wagon`) also disagrees with the book;
  only the chassis `ProfileBlock` was in scope here.
- **The Chaos convention** of putting chassis stats in the unit's top-level `statLine`
  (`ch-chariot`, `ch-marauder-chariot`) while every other army puts the crew there.

#### Dice expressions in a profile's Attacks column (OLD-39)
Some books print a **dice expression** where the Attacks column expects a number. `StatLine.A` is
typed `number` and was **not** widened: that type runs through the whole rules engine (every sum,
comparison and ordering that reads `.A`), while a chariot chassis's Attacks affects no points and no
validation. Instead a `ProfileBlock` carries an optional display-only string, which
every renderer prints **in place of** the numeric A — the editor's stat strip (`EntryRow`) and the
plaintext export both go through `statCell` in `rules/entryView.ts`, so screen and export cannot
disagree. Rows read off the scans at 400 dpi; offset **+2** per `source/OFFSETS.md`. No points
changed.

> **Superseded by OLD-43 (below).** The field OLD-39 introduced was `ProfileBlock.attacksNote`, a
> single Attacks-only string on display profiles. OLD-43 replaced it with `statNotes`, keyed by
> column and available on units and mounts as well; `attacksNote` no longer exists anywhere in the
> source. The three rows below are unchanged — only the field they live in.

- **Undead Chariot chassis** (`ud-undead-chariot`) → `statNotes: { A: '1D6' }`. *No Muertos*, printed
  **p.84** = PDF 86: "Carruaje Esquelético - - - 5 5 3 1 1D6 -" (reprinted on printed p.68).
- **Chariot of Arkhan** (`ud-arkhan-the-black`) → `statNotes: { A: '1D6' }`. *No Muertos*, printed
  **p.91** = PDF 93: "Carruaje de Arkhan - 4 - 6 6 3 - 1D6 -".
- **Malekith's Black Chariot** (`de-witch-king`) → the unit had **no `profiles` array at all**, so
  the chariot he always rides and its team were invisible in the app. *Elfos Oscuros*, printed
  **p.57** = PDF 59 prints a three-row PERFIL table; the two non-rider rows were added:
  "Carruaje Negro - - - 7 7 3 - 1D6+2 -" → `{ S: 7, T: 7, W: 3 }` + `statNotes: { A: '1D6+2' }`, and
  "Gélido 20 3 0 4 4 1 4 2 3" → `{ M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 4, A: 2, Ld: 3 }`
  (M 20cm → 8"). Columns printed "-" stay **absent**, not invented. Note the book labels the draught
  row *Gélido* while this file's generic mount for the same beast is *Caballo Frío* and prints **I 1**
  against p.57's **I 4**; that mount row comes from another page and was deliberately left alone.
- **Out of scope here, on purpose.** The survey behind this issue also found dice and range tokens
  in a **unit's own `statLine`** (Engendro del Caos, Goblin Fanático, Crazed Cook, Berserker) and in
  a **`MountOption.statLine`** (Bestia de Nurgle). Those are full `StatLine`s, several print the
  token in **M** or **WS** rather than A, and they held invented numeric stand-ins — all of which
  needed a wider design than this one. **Done in OLD-43 (below)**, where the page labels OLD-39
  recorded for two of them (*Reino del Caos* "p.120" and "p.115") turned out to be wrong; the true
  pages are printed **90** and printed **85**.

#### The two chariot chassis parked by OLD-33 (OLD-38)
Both readings below were blocked on a page whose printed layout needed a human eye, so OLD-33 left
them alone. Both pages were rasterised at 400 dpi and read directly; the app's `ProfileBlock.statLine`
is a `Partial<StatLine>`, so only the columns actually printed are ever filled in.
- **Marauder Chariot chassis** (`ch-marauder-chariot`) — `{ T: 5, W: 3 }` → **`{ S: 7, T: 7, W: 3,
  I: 1 }`**. *Reino del Caos*, printed **p.104** = PDF 106. The page is a single entry titled
  "CARRUAJES DEL CAOS" that prints **one chassis row** covering both variants: *"Un Carruaje posee
  una tripulación compuesta por dos Bárbaros y está tirado por dos Caballos de Guerra, o bien posee
  una tripulación de dos Guerreros del Caos y está tirado por dos Corceles del Caos."* The printed
  "Carruaje - - - 7 7 3 1 - -" row is shared by both the 122-pt Chaos Chariot (`ch-chariot`,
  already corrected by OLD-33) and the 80-pt Marauder Chariot; the code's old `T: 5` matched no
  printed row. Extracted as `CHAOS_CHARIOT_CHASSIS_STATS` in `chaos.ts` (mirrors
  `CHARIOT_CHASSIS_STATS` in `orcsGoblins.ts`) so the two Chaos chariots share one source of truth
  and cannot drift apart again; the `specialRules` prose line ("Chariot (T5 W3) …") was updated to
  match the same corrected value.
- **Wood Elf War Chariot chassis** (`we-war-chariot`) — `{ T: 4, W: 3 }` → **`{ T: 7, W: 3 }`**.
  *1996 Elfos Silvanos*, printed **p.66** = PDF 68 (the identical row is reprinted at printed
  **p.81** = PDF 83): "Carruaje de Guerra - - - - 7 3 - - -". **Only R (T7) and H (W3) are
  printed** — unlike every other chariot chassis in this repo, the F, I, A and L columns are all
  dashes, so the corrected value is `{ T: 7, W: 3 }` **only**; no S or I is added. Pinned by a test
  that explicitly asserts the chassis carries no `S` and no `I`, to guard against a future
  pattern-match to the `{ S: 7, T: 7, W: 3, I: 1 }` chassis used elsewhere. Linear OLD-38.

#### High Elf characters riding a Tiranoc Chariot (OLD-34)
Source: `source/1997 Altos Elfos.pdf`, offset **+2** (PDF index = printed page + 2). This was a
**gap**, not a contradiction: the ability existed only as unpriced English prose in `specialRules`
("May ride an Elven Steed (+3 pts), a monster, or a chariot") and `PRINCE_MOUNTS` offered no
chariot, so a legal list could not be built. Nothing already in the data was wrong.
- **The price: +84 points.** Printed **p.79** = PDF 81, closing paragraph of AURIGAS DE TIRANOC:
  *"Los personajes pueden montar en un Carruaje, en cuyo caso el personaje sustituye a uno de los
  tripulantes. El valor en puntos del carruaje no varía por ello: el personaje debe gastar, por
  ejemplo, +84 puntos para montar en el carruaje básico (ver la página 74)."* The same 84 the
  standalone `he-tiranoc-chariot` entry costs — the chariot is not repriced for being ridden.
  Note that "ver la página 74" points at **prose, not a table**: there is no mount table on printed
  p.74, and the only mount cost printed as a number in the character section is the Elven Steed's
  +3 (monsters are by reference to the printed p.80 table).
- **Who may ride — all five generic character types, each stated individually.** Printed **p.73** =
  PDF 75 for the General, Battle Standard Bearer, Hero and Mage: *"También puede entrar en combate
  montado en un carruaje de la sección de Máquinas de Guerra de esta lista, en cuyo caso sustituirá
  a uno de los tripulantes y el coste del carruaje deberá sumarse al suyo propio"*, printed under
  each entry in turn (the Mage's on printed p.74 = PDF 76). The **Paladin**'s permission is
  conditional — printed **p.74** = PDF 76, Reglas Especiales: *"Si forma parte de un regimiento de
  Carruajes de Guerra de Tiranoc, el Paladín también monta en un carruaje (ver la Lista de Máquinas
  de Guerra). En este caso sustituirá a un tripulante y el coste del carruaje se sumará al suyo."*
  The app has no way to express "only as part of a chariot regiment", so the mount is offered and
  the condition is stated in the Paladin's own rule line (bilingual); silently dropping a legal
  option, or silently blessing an illegal list, would both be worse.
- **Which cap it counts against.** Printed **p.69** = PDF 71: *"Carruajes de Guerra. Si un personaje
  monta en un Carruaje de Guerra su valor en puntos debe sumarse al del personaje, y por tanto se
  contabilizará contra la proporción de puntos que pueden invertirse en personajes."* And printed
  **p.71** = PDF 73 (ORGANIZACIÓN DEL EJÉRCITO), of the war-machine allowance: *"Este límite de
  puntos **no incluye el coste de un carruaje montado por un personaje**, que debe adquirirse con
  los puntos de Personajes."* So a ridden chariot leaves the 0-25% war machines + chariots cap and
  enters the 0-50% characters cap. The engine already did this and was **not changed**: a
  `MountOption`'s points land on the character's entry and `pointsByRole` buckets an entry by its
  unit's `role`. Verified and pinned by a test (`armies.test.ts`) that fields a General on the
  chariot alongside a standalone `he-tiranoc-chariot` and asserts 244 character points against 84
  war-machine/chariot points.
- **Deliberately omitted: the four crew-kit options.** The mount offers only the upgrades the book
  prices **per chariot** — scythed wheels (+20), the extra pair of Elven Steeds (+6) and barding
  (+8 for the two steeds), all printed p.79. It does **not** offer the standalone entry's shield,
  heavy armour, lance and longbow. Those are printed "+1 punto por Auriga" and stored (OLD-31) as a
  `flat` 2 meaning "+1 per Auriga × 2 Aurigas". A character *replaces* an Auriga, and the book
  states **neither the ridden chariot's resulting crew count nor any per-crew basis for that kit on
  a ridden chariot** — so any number here would be an invented game value rather than a transcribed
  one, and the options are left out instead. For the same reason the mount declares no `baseCrew`.
  This is an **open question for a future issue**, not an oversight; it is pinned by a test so the
  omission cannot be quietly filled in with a guess.
- No points, profile or option value changed anywhere. The chassis and steed `ProfileBlock`s are the
  OLD-33 rows, now a shared constant (`TIRANOC_CHARIOT_PROFILES`) used by both the standalone entry
  and the mount, so the two can never drift. Linear OLD-34.

#### Wizard-level statlines (OLD-37)
A wizard-level option used to raise only points and `magicItemSlotsDelta`, so a Level-4 wizard was
displayed with the Level-1 row. Every book prints a **separate profile per level** (S / W / I / A /
Ld all move), so each level option now carries the printed row as an `EquipmentOption.statLine`,
resolved by `effectiveStatLine`. Option **ids are unchanged** (stored rosters keep their selection)
and **no points value or item-slot delta was touched**. The rows below are verbatim from the scans,
in the books' own nine columns (Spanish M / HA / HP / F / R / H / I / A / L); Movement is converted
to inches in the data as usual (8cm→3", 10→4, 12→5) except in the English books, which already
print inches. Each army's level-1 row is the unit's own base `statLine`.
- **The Empire** (`emp-wizard`) — printed **p.58** = PDF 60, HECHICEROS:
  Hechicero `10 3 3 3 4 1 4 1 7` / Paladín Hechicero `10 3 3 4 4 2 4 1 7` /
  Maestro Hechicero `10 3 3 4 4 3 5 2 7` / Gran Hechicero `10 3 3 4 4 4 6 3 8`.
- **Bretonnia** (`br-wizard`) — printed **p.61** = PDF 63, WIZARDS (English book, M in inches):
  Wizard `4 3 3 3 4 1 4 1 7` / Wizard Champion `4 3 3 4 4 2 4 1 7` /
  Master Wizard `4 3 3 4 4 3 5 2 7` / Wizard Lord `4 3 3 4 4 4 6 3 8`. The Damsel's **base T was
  3 and the book prints 4**, so the base row was corrected too — the only profile value changed
  outside the level options. (`source/transcribed/bretonnia.md` has the Wizard Lord as
  `... 5 3 7`; the scan at 400 DPI reads `6 3 8` and the PDF wins.)
- **Dogs of War** (`dow-wizard`) — printed **p.29** = PDF 31, HIRELING WIZARDS (English book):
  the same four rows as Bretonnia/Empire, Wizard Lord included: `4 3 3 4 4 4 6 3 8`.
  (`source/transcribed/dogs-of-war.md` "resolves" the Wizard Lord's Attacks to 2; the scan at
  400 DPI reads **A 3**. The PDF wins; the transcription's Incidencias entry is wrong.)
- **High Elves** (`he-mage`) — printed **p.74** = PDF 76, MAGOS:
  Mago `12 4 4 3 4 1 7 1 8` / Paladín Mago `12 4 4 4 4 2 7 1 8` /
  Mago Maestro `12 4 4 4 4 3 8 2 8` / Gran Mago `12 4 4 4 4 4 9 3 9`.
- **Dark Elves** (`de-sorceress`) — printed **p.50** = PDF 52, HECHICEROS ELFOS OSCUROS: the same
  four rows as the High Elf Mage, `12 4 4 3 4 1 7 1 8` … `12 4 4 4 4 4 9 3 9`.
- **Skaven** (`sk-warlock-engineer`) — printed **p.62** = PDF 64, BRUJOS Y VIDENTES SKAVEN:
  Brujo Ingeniero `12 3 3 3 4 1 5 1 5` / Paladín Brujo `12 3 3 4 4 2 5 1 6` /
  Maestro de Brujos `12 3 3 4 4 3 6 2 7`. No level-4 option: the Vidente Gris
  (`12 6 6 4 4 4 7 4 7`, same page) is a separate always-Level-4 entry.
- **Chaos Dwarfs** (`cd-sorcerer`) — printed **p.57** = PDF 59, BRUJOS ENANOS DEL CAOS:
  Brujo `8 4 3 3 5 1 3 1 9` / Paladín Brujo `8 4 3 4 5 2 3 1 9` /
  Maestro de Brujos `8 4 3 4 5 3 4 2 9` / Gran Brujo `8 4 3 4 5 4 5 3 10`.
- **Chaos — Sorcerers** (`ch-sorcerer`) — *Reino del Caos* printed **p.101** = PDF 103:
  Hechicero `10 6 6 4 5 1 7 2 9` / Paladín Hechicero `10 6 6 5 5 2 7 2 9` /
  Maestro Hechicero `10 6 6 5 5 3 8 3 9` / Gran Hechicero `10 6 6 5 5 4 9 4 10`. Note the level-1
  row really does print **F 4** where the three upper rows print F 5 (already recorded in
  `source/transcribed/chaos-realm.md`; confirmed again here).
- **Chaos — Beastman Shamans** (`ch-beast-shaman`) — *Reino del Caos* printed **p.107** = PDF 109:
  Shaman `10 4 3 3 5 2 4 1 7` / Paladín Shaman `10 4 3 4 5 3 4 1 7` /
  Maestro Shaman `10 4 3 4 5 4 5 2 7` / Gran Shaman `10 4 3 4 5 5 6 3 8`.
- **Undead** (`ud-necromancer`) — army list printed **p.80** = PDF 82, NIGROMANTES:
  Nigromante `10 4 4 4 3 1 3 2 8` / Paladín Nigromante `10 5 5 4 3 2 4 3 9` /
  Maestro Nigromante `10 6 6 5 4 3 5 4 9`. The army list prints only these three (a non-general
  Necromancer caps at Level 3); the **Gran Nigromante** row `10 7 7 5 4 4 6 5 10` comes from the
  bestiary table printed **p.57** = PDF 59, which agrees with the army list on the other three. It
  is carried by the `wizard-l4` option that only `ud-general-great-necromancer` offers — and is the
  General's own base row, so selecting the level is a no-op there rather than a downgrade.
- **Lizardmen** (`lz-slann`) — printed **p.73** = PDF 75, 1 SLANN GENERAL (English book):
  Mage-Priest & Palanquin `4 3 2 4 4 3 2 3 8` / Mage-Priest Champion `4 4 3 6 4 4 3 4 8` /
  Master Mage-Priest `4 5 4 6 5 6 5 6 9` / Mage-Lord `4 6 5 6 5 8 6 8 10`.

**Left out deliberately, and why** — both were revisited in **OLD-41 (below)**:
- **Wood Elves** — the book **contradicts itself**. The army list printed **p.65** = PDF 67 gives
  Maestro de Magos `12 4 4 4 4 2 7 1 8`, an exact duplicate of the Paladín Mago row above it, while
  the bestiary printed **p.42** = PDF 44 gives `12 4 4 4 4 3 8 2 8` (the row every other Elf book
  prints for that rank). Both pages were re-read at high resolution: neither is illegible, they
  simply disagree, and nothing in the book settles which the level-3 Wood Elf Mage should use.
  **Resolved in OLD-41**: the owner ruled for the army list, and `WE_WIZARD_LEVELS` now carries all
  three rows.
- **Halflings** — the Wizard table on PDF page 8 (the *Hungry Horde* compilation; cite by PDF index,
  the folios are not continuous) has its **Ld column cut off at the scan's right edge**: Wizard
  `4 2 4 2 3 1 5 1 ?` and Wizard Champion `4 2 4 3 3 2 5 2 ?`. An unreadable digit is not a value,
  so `HF_WIZARD_LEVELS` was left alone. **Confirmed unrecoverable in OLD-41** and still left alone.
- **Orcs & Goblins** already carried per-level statlines (OLD-12 / OLD-13) and is untouched.
  **Dwarfs** have no wizards. **Vampire Counts** and **Norse** model every wizard level as its own
  unit entry rather than as a level option, so there is nothing for this mechanism to fix.

#### High Elves army-list gaps (OLD-36)
Source: `source/1997 Altos Elfos.pdf`, offset **+2** (PDF index = printed page + 2). Five **gaps**,
not contradictions: nothing already in the data was wrong, five things the book prints were simply
absent. Every row below was re-read from the scan at 400 dpi. Movement converted as usual
(10cm→4", 15→6", 20→8", 22→9").
- **Ellyrian Reavers (`he-ellyrian-reavers`) may buy shields, +2 points per model.** Printed
  **p.76** = PDF 78, CABALLEROS SEGADORES, Opciones: *"Cualquier unidad puede equiparse con Escudos
  por un coste adicional de +2 puntos por miniatura. Cualquier unidad puede equiparse con Arcos por
  un coste adicional de +4 puntos por miniatura, y/o con Lanzas por un coste adicional de +2 puntos
  por miniatura."* The entry carried the bows (+4) and the lances (+2) but not the shields. The
  file's existing `SHIELD_2` constant already held the +2 price (Silver Helms, printed p.75); no new
  rate was introduced.
- **The Basilisk and the Chimera are legal character mounts.** Printed **p.73** = PDF 75, under the
  General (and again under the Battle Standard Bearer, the Hero and — printed p.74 — the Mage):
  *"El General puede montar un Corcel Élfico (+3 puntos), o un monstruo elegido en la sección de
  Monstruos de esta lista, en cuyo caso su valor en puntos deberá sumarse al del General."* That
  section is the whole printed **p.80** = PDF 82 table, which lists eleven monsters; `PRINCE_MOUNTS`
  offered nine. Added: **Basilisco 150 puntos** *"Basilisco 10 3 0 4 4 2 4 3 6"* and
  **Quimera 250 puntos** *"Quimera 15 4 0 7 6 6 4 6 8"*. The other nine printed rows were re-read
  and all match the data unchanged (Dragón 450 `15 6 0 6 6 7 8 7 7`, Gran Dragón 600
  `15 7 0 7 7 8 7 8 8`, Dragón Emperador 750 `15 8 0 8 8 9 6 9 9`, Águila Gigante 75
  `5 7 0 5 4 3 5 2 8`, Grifo 150 `15 5 0 6 5 5 7 4 8`, Hipogrifo 145 `20 5 0 6 5 5 6 3 8`,
  Mantícora 200 `15 6 0 7 7 5 4 4 8`, Pegaso 50 `20 3 0 4 4 3 4 2 3`, Unicornio 90
  `22 5 0 4 4 3 4 2 9`).
- **Pegasus and Unicorn now exist as monster units, not only as mounts.** Same printed **p.80**
  MONSTRUOS table: **Pegaso 50 puntos** *"Pegaso 20 3 0 4 4 3 4 2 3"* → `he-pegasus` (M8) and
  **Unicornio 90 puntos** *"Unicornio 22 5 0 4 4 3 4 2 9"* → `he-unicorn` (M9). The p.80 table
  prints **points and statline only — no special-rules text for any of the eleven monsters**, so the
  two new entries carry exactly the tags their existing mount options already carried (`Flying` for
  the Pegasus, none for the Unicorn); no rule was invented for them. A test pins mount and unit to
  the same row for all eleven so the two renderings can never drift.
- **The Repeater Bolt Thrower's machine `ProfileBlock`: T7 W3, no Strength.** Printed **p.79** =
  PDF 81 prints two rows under LANZAVIROTES DE REPETICIÓN: *"Dotación 12 4 4 3 3 1 6 1 8"* (the
  crew, which is the unit's own `statLine`) and *"Lanzavirotes de Repetición - - - - 7 3 - - -"*.
  Read at 400 dpi against the Dotación row above it for column alignment (M HA HP F R H I A L): the
  **7 sits under R and the 3 under H, and the F column is a dash** — the machine has Toughness and
  Wounds and no Strength, unlike a chariot chassis. Concordant with the special-rules page, printed
  **p.56** = PDF 58: *"MOVIMIENTO / RESISTENCIA / HERIDAS — Como su Dotación / 7 / 3"*. The
  Movement column is a dash on p.79 because the machine moves with its crew, so no M is stored.
- **The Shadow Warrior ratio cap, and the part of it that cannot be modelled.** Printed **p.78** =
  PDF 80, GUERREROS SOMBRÍOS: *"El ejército Alto Elfo puede incluir tantos regimientos de Guerreros
  Sombríos como regimientos de Lanceros y Arqueros incluya el ejército. Sin embargo, esta
  restricción puede ignorarse cuando los Altos Elfos deban enfrentarse a un ejército de Elfos
  Oscuros, en cuyo caso el ejército Alto Elfo puede incluir tantos regimientos de Guerreros
  Sombríos como se desee."* The ratio itself fits `selectionRules.ratioCaps` exactly and is now
  declared there: `perUnit.ids = ['he-spearmen', 'he-archers']`, multiplier 1, **no floor** (the
  book grants no free minimum here — unlike the bolt thrower's own limit on printed p.79, which
  does say *"pero siempre pueden incluirse un mínimo de dos"* and which also counts the Guardia del
  Mar, named there and **not** named here). The **"ignored against Dark Elves" exception cannot be
  expressed**: the roster has no opposing army, and this app models none, so inventing a mechanism
  for it was refused. The violation is a `warning`, and the exception is stated where the player
  reads it — a bilingual rule line on the unit and its own ⓘ glossary entry (`shadow-warrior-ratio`
  in `src/data/rules.ts`). That glossary entry is deliberately placed **before** the generic weapon
  rules: `findRule` matches by substring and first match wins, and `lance` is a substring of
  *"Lancer"*, so without it the tag would have opened the cavalry-lance article.
- **Out of scope, untouched:** the allies rule (0-25%, printed p.71). Linear OLD-36.

#### Halfling farm-machine crew kit — checked against the book, no change needed (OLD-40)
Source: `source/Halflings!_Hungry_Horde_COMPLETO_con_Lumpin_Croop.pdf`. **Cited by PDF index** — the
offset is not constant in this compilation (see `source/OFFSETS.md`); the WAR MACHINES spread is
**PDF page 12** (folio 14) continuing onto **PDF page 13** (folio 15). English source, Movement
already in inches. Re-read at 400–1200 dpi.

The question OLD-40 asked was whether `hf-shearer` / `hf-reaper`'s `crew-bows` (1) and
`crew-shields` (0.5) should become `perCrewman` under the OLD-35 mechanism. **They should not.**
PDF 12, right column, OPTIONS, verbatim (`[…]` = lost to the scan's cut right edge, resolved from
the continuation at the top of PDF 13's left column, which is cut on its *left* edge):

> **Options**: The Reaper may have one additi[onal] Halfling crewman at +3 1/2 points. Extra [pull]
> animals can be added to push the machin[e,] War Sheep at +4 points and Battle Rams a[t +? ]
> points to a maximum of four. The crew ca[n] have bows at +1 point and shields at +1/[2 ]
> **poin**t. One Farm Machine in [you]r army can carry a Magic [Ban]ner.

The rates carry **no per-anything qualifier** — no *"each"*, no *"per crewman"*, no *"per model"*.
The tail was recovered from PDF 13's first line, which reads `…t. One Farm Machine in`: the word
closing that sentence ends in **t**, i.e. *point* (singular), so *"each"* (ending in *h*) is
excluded, and the strip lost off PDF 12's right edge is only 2–5 characters wide — far too narrow to
hold *" point each"*. This is exactly the case the O&G chariot entry (OLD-35) makes explicit and
this one does not: there the book prints *"+1 punto **por tripulante**"*, here it prints a bare
*"+1 point"* against a collective *"The crew"*. The kit is therefore priced **per machine**, which
is what the data already says (`flat: true` on both options, on both machines). **Nothing was
changed.** Do not re-open this without a better scan.

Also read on the same spread, and likewise left alone:
- **Base crew — the book contradicts itself and nothing settles it.** The section intro says *"Both
  machines have a crew of three Halflings."*, while the Shearer's own entry says it *"is pushed by
  [a] war sheep and carries a crew of two Halfli[ngs]."* Both sentences are fully legible; they
  simply disagree. No `baseCrew` was added to either unit — it is only *required* by
  `assertArmyIntegrity` on a host that carries `perCrewman` / `addsCrewman`, and since the kit is
  per machine neither host needs one. `hf-shearer`'s display profile keeps its *"(x2)"* from the
  Shearer's own sentence; `hf-reaper`'s stays uncounted.
- **The extra Battle Ram's cost is still unreadable.** *"Battle Rams a[t +? ] points"* — the digit
  sits in the cut strip. `extra-ram` keeps its commented-as-approximate 5, the bestiary Battle Ram
  value; no value was invented for it. (Same cut as the Wizard-table Ld column noted under OLD-37.)
- **Everything else in OPTIONS is already in the data and nothing in the data is absent from the
  book**: `extra-crew` 3.5 (Reaper only, as printed), `extra-sheep` 4, the four-animal maximum, the
  *Equipment* line *"Crew carry hand weapons and wear light armour."*, and the one-Farm-Machine
  magic banner. The per-army half of that banner rule remains unmodelled (pre-existing, noted in
  the file).
- **`hf-chuck-wagon`'s top-level `statLine` duplicates the Aurochs row, and the book does not settle
  it.** PDF page 7 (folio 9), CHUCK WAGON, prints exactly three rows — *Chef* `4 4 4 4 2 1 6 2 8`,
  *Cook* `4 3 3 3 2 1 5 1 8`, *Aurochs* `6 3 0 5 5 3 2 3 5` — and **no wagon/chassis row at all**.
  So the Aurochs profile standing in as the entry's own statLine is neither confirmed nor refuted by
  the source: it is a display choice (the wagon moves as the beast pulling it), not a transcription
  error to correct against a printed row. Left as-is, deliberately.

#### Book tokens in any characteristic column — six units and one mount (OLD-43)
OLD-39 could print a dice expression in **one** column (Attacks) of **one** kind of row (a display
`ProfileBlock`). The real problem is wider: a book may print a non-numeric token in **any** of the
nine columns, in **three** places — a unit's own `statLine`, a `MountOption.statLine` and a
`ProfileBlock.statLine` — and the tokens are not all dice ("2-10" is a range; "Especial"/"Sp" is a
word). Six unit rows and one mount row held **invented numbers** where the book prints a token.

**Mechanism.** `ProfileBlock.attacksNote` is **gone**, replaced by `StatNotes` — a partial map from
column to printed token — as `statNotes` (+ `statNotesEs`, which overrides only the columns whose
token is a *word*, following the `nameEs`/`descEs` fallback convention) on all three types.
`StatLine` stays all-`number`: a token affects no points and no validation, so this is a
display-only channel rather than a widening of the type the whole rules engine reads. A noted column
is **absent** from `statLine` — never a number beside its note — and `statCell` in
`rules/entryView.ts` is the single statement of "the note replaces the value", shared by `EntryRow`
and the plaintext export. `UnitProfile.statLine` and `MountOption.statLine` widened to
`Partial<StatLine>`; `assertArmyIntegrity` now requires all nine columns to be accounted for by
`statLine` **or** `statNotes` on a unit or a mount, so the lost type-level completeness cannot become
a silent omission. (Not applied to `ProfileBlock`: a chariot chassis legitimately prints only some
columns.) Movement tokens carry their **unit** explicitly — a dice expression cannot be run through
the repo's usual cm→inch conversion, so a Spanish book's roll reads `5D6cm` and an English book's
`2D6"`. Rows read off the scans at 400 dpi. **No points changed.**

- **Beasts of Nurgle** (`ch-beasts-of-nurgle`) and the **Beast of Nurgle mount**
  (`mount-beast-of-nurgle`, shared by five Chaos characters) → `A` dropped, `statNotes: { A: '1D6' }`.
  *Reino del Caos*, printed **p.85** = PDF 87: "Bestia de Nurgle 8 3 0 3 5 3 3 1D6 6". Confirmed by
  the rules text: *"Las Bestias pueden efectuar 1D6 ataques"*. `M: 3` is correct and stays (8cm → 3").
  **The page label OLD-39 recorded for this row, "p.115", was wrong** — it is not a page of this book.
  The unit previously held `A: 1` via the file-local `statline()` helper (whose default is 2), so it
  is now built from the shared row directly rather than through the helper.
- **Chaos Spawn** (`ch-chaos-spawn`) → `M` and `A` dropped, `statNotes: { M: '5D6cm', A: '1D6' }`.
  *Reino del Caos*, printed **p.90** = PDF 92: "Engendro del Caos 5D6 3 0 4 5 3 3 1D6 10". Both cells
  confirmed by the rules text: *"un atributo de movimiento de 5D6 centímetros"* and *"pueden efectuar
  1D6 ataques"*. Previously `M: 4` and `A: 1`, both invented. **The page label OLD-39 recorded,
  "p.120", was wrong**; the true page is printed **90**.
- **Night Goblin Fanatics** (`og-night-goblin-fanatics`) → `M`, `WS`, `BS`, `I`, `Ld` dropped,
  `statNotes: { M: '5D6cm', WS: 'Special', BS: '–', I: '–', Ld: '–' }` +
  `statNotesEs: { WS: 'Especial' }`. *Orcos y Goblins* bestiary, printed **p.66** = PDF 68, headers
  M HA HP F R H I A L: "Goblin Fanático 5D6 Especial 5 3 1 - 1D3 -", with *Especial* spanning the
  HA/HP pair (HA = Especial, HP blank). Only `S: 5, T: 3, W: 1` are numbers and they stay. The M
  token is centimetres per the rules text: *"desplaza la miniatura en esa dirección el equivalente
  del resultado en centímetros"*. The comment previously above this row (`// PDF p.85: M5D6 Especial
  F5 R3 H1 I1D6 A- L-`) was **mis-transcribed** — it had I and A swapped — and labelled a printed
  page as a PDF page; it has been replaced with the citation above.
- **RESOLVED (OLD-45) — the Fanatic's Attacks contradict between two pages of its own book, and the
  army list wins.** The bestiary row (printed **p.66** = PDF 68) prints **1D3**; the army list
  (printed **p.85** = PDF 87) prints **1D6**. Both were read at 400dpi and both are legible, so this
  is the book disagreeing with itself rather than a bad scan; the two rows agree on every other
  column. The owner ruled for the **army list**, so `statNotes.A = '1D6'` and the entry cites
  printed **p.85** for that one cell while the rest of its row cites printed p.66.

  A supporting hint, not the reason: the rules text on p.66 says the ball inflicts *"1D6 impactos de
  Fuerza 5"* on contact. Those are **hits caused**, not the A attribute, so it does not settle the
  cell — but it is a plausible origin for the 1D6 the list prints.

  The column showed `'?'` between OLD-43 and this ruling, which in turn had replaced an invented
  `A: 1` that was **wrong under both readings** — the one thing the book is unambiguous about is
  that the cell is a dice roll. A test pins the 1D6 and explicitly rejects both the bestiary's 1D3
  and the old `?`, because the losing reading sits nineteen pages away in the same book.

  **Precedent note:** this ruling covers **this row only**. Bestiary-vs-army-list conflicts are
  settled **case by case, with no blanket precedent** — that the Norsca note in `source/OFFSETS.md`
  and the Wood Elf wizard ruling also went to the list did **not** decide this one, and this one
  decides nothing else.
- **Crazed Cooks** (`hf-crazed-cooks`) → `M`, `WS`, `I`, `A`, `Ld` dropped,
  `statNotes: { M: '2D6"', WS: 'Sp', I: '–', A: 'D6', Ld: '–' }` + `statNotesEs: { WS: 'Esp' }`.
  *Halflings* bestiary, printed **p.7** = PDF 5: "Crazed Cook 2D6 Sp 0 5 2 1 - D6 -". Only
  `BS: 0, S: 5, T: 2, W: 1` are numbers and they stay; the previous `M: 6, WS: 0, I: 0, A: 6, Ld: 0`
  were invented. The printed-**12** copy of the same row has its **Ld clipped by the edge of the
  scan** (the same cut noted under OLD-37 and OLD-40), so the bestiary copy on printed p.7 — where Ld
  prints legibly as a blank — is the citation. The Halfling book is **English** and already gives
  Movement in inches, so the cm→inch conversion does **not** apply: `2D6"`, not `2D6cm`.
- **Berserkers** (`no-berserkers`) → `M` and `A` dropped, `statNotes: { M: '2D6"', A: '2-10' }`.
  *Norsca*. M and A are identical in all three printings of this profile — the bestiary (PDF 22), the
  *Citadel Journal 7* revision (PDF 14) and the army list (PDF 25): "2D6" and "2-10". Previously
  `M: 7` and `A: 6`, both invented. **"2-10" is the artillery dice** (faces 2/4/6/8/10/Misfire) — a
  *range*, not a dice expression, which is precisely why the field holds a free token rather than a
  dice-shaped value. English book, already inches.
- **Out of scope, deliberately:** this unit's **WS/T/I/Ld disagree between printings of its own
  row**. That is a separate finding and **nothing else on the unit was touched**; a test pins the
  remaining seven columns so the change is provably confined to M and A.
- **The Ravenswyrd** (`no-ravenswyrd`) → `M` and `A` dropped, `statNotes: { M: '2D6"', A: '2-10' }`.
  *Norsca* **PDF 33** (printed p.21, the "NORSE SPECIAL CHARACTERS" article):
  "The Ravenswyrd 2D6 6 0 4 4 1 4 2-10 10". The issue reported this profile as *not located in the
  scan*; **it is located**, at PDF 33. Every other column (`WS 6, BS 0, S 4, T 4, W 1, I 4, Ld 10`)
  already matched the book and was left alone, as was his companion `ProfileBlock` "The Raven"
  ("12 - 0 4 4 2 5 - 10"), already correct with WS and A absent and rendering "–".

#### The two wizard tables OLD-37 parked (OLD-41)
Neither was a coding gap. One needed a ruling, the other cannot be read at all.

**Wood Elves (`we-mage`) — the book disagrees with itself, and the army list wins.**
`source/1996 elfos silvanos.pdf`. Both pages were rasterised at 400 dpi and their printed folios
checked before being trusted (PDF 44 prints folio **42**, PDF 67 prints folio **65**); both tables
are perfectly legible, so this is the book, not the scan.

| Rank | Bestiary, printed **p.42** = PDF 44 | Army list, printed **p.65** = PDF 67 |
|---|---|---|
| Mago | `12 4 4 3 4 1 7 1 8` | `12 4 4 3 4 1 7 1 8` |
| Paladín Mago | `12 4 4 4 4 2 7 1 8` | `12 4 4 4 4 2 7 1 8` |
| **Maestro de Magos** | `12 4 4 4 4 3 8 2 8` ← H3 I8 A2 | `12 4 4 4 4 2 7 1 8` ← H2 I7 A1 |
| Gran Mago | `12 4 4 4 4 4 9 3 9` | `12 4 4 4 4 4 9 3 9` |

Three of the four rows agree digit for digit. The Maestro's does not, and the army list's version of
it is an **exact duplicate of the Paladín Mago row printed directly above it**, which leaves level 3
with no profile improvement over level 2 and then jumps two steps at once to the Gran Mago.

**The owner ruled for the army list**: `wizard-l3` carries `12 4 4 4 4 2 7 1 8` (M 12cm → 5"), the
same row as `wizard-l2`, so buying level 3 raises points and magic-item slots and nothing else. That
is deliberate and a test pins it, because the alternative reading is *tempting* — the bestiary's
H 1/2/3/4 · I 7/7/8/9 · A 1/1/2/3 progression is exactly what the High Elf and Dark Elf books print
for the same four ranks, so a later pass could easily "correct" this back and silently reinstate the
rejected reading.

**Precedent note:** this ruling covers **Wood Elves only**. Bestiary-vs-army-list conflicts are
settled case by case, never by precedent — the same scoping applied to the Norsca note in
`source/OFFSETS.md` (OLD-43) and to the Orc & Goblin Fanatic Attacks, which was deliberately left at
`?` rather than being decided alongside this one and was later settled on its own terms in OLD-45.

**Halflings (`hf-wizard`) — the Ld column is not recoverable, and no value was invented.**
The only printed wizard table is in the *Hungry Horde* compilation at **PDF page 8** (printed folio
**10**; cite by PDF index, the folios are not continuous there):

```
Wizard            4  2  4  2  3  1  5  1  [Ld cut off]
Wizard Champion   4  2  4  3  3  2  5  2  [Ld cut off]
```

Three independent reasons it stays unread, rather than merely "not read yet":
- the embedded page image is **594×891 at 76 ppi**, so rasterising at 400 dpi adds no information
  that is not already visible;
- the page's **`CropBox` equals its `MediaBox`** — nothing is hidden outside the visible frame, the
  right edge is missing from the scan itself;
- the cut runs down the **whole right margin of that document**, not just this table: the Sheep Dog,
  Giant Swans, Crazed Cook, Housewife, Aragand and Giblit all lose their Ld the same way, as do the
  Shearer's and Reaper's Attacks and points. `source/transcribed/halflings.md` recorded the same
  thing independently in two passes.

There is no second copy of the article in `source/`. `HF_WIZARD_LEVELS` therefore carries **no
`statLine`** — a plausible Ld would pass every test in the repo, which is exactly why none is
written — and a test pins its absence.

#### Staff of Nurgle priced at 0 → 100 pts (2026-10-09)
Source: `source/1997 Warhammer Magia.pdf`, offset +2, vision-verified. The OBJETOS PORTADORES DE
HECHIZO entry on **printed p.44 = PDF 46** reads *"BÁCULO DE NURGLE … 100 puntos"* ("Sólo Hechiceros
del Caos de Nurgle"), and the summary table on **printed p.75 = PDF 77** gives the same 100.
`mi-staff-of-nurgle` had carried `points: 0` since the initial commit — the only 0-pt item in the
catalog. Corrected to 100 and pinned by a test in `armies.test.ts`.

Side note, no app change: `source/transcribed/magia.md` claims the *Garra de Nagash* on that same
p.44 prints no cost. The scan does print *"50 puntos"*, which is what the app already charges.

#### Marauder Horsemen and Chaos Ogres — Reino del Caos p.105 (2026-10-09)
Source: `source/1998 Reino del Caos.pdf`, offset +2, **printed p.105 = PDF 107**, vision-verified.
- **Marauder Horseman rider** (`ch-marauder-horsemen`) — BS 4 / T 4 → **BS 3 / T 3**. The row prints
  *"Jinete Bárbaro 10 4 3 4 3 1 4 2 7"*, the same as the Bárbaro del Caos in the bestiary (printed
  p.76), so the book does not contradict itself here. The Caballo de Guerra row
  (*"20 3 0 3 3 1 3 1 5"*) was already right.
- **No cavalry lance** — checked because a user asked about it, and nothing changes: the only options
  printed are *"Flagelos (+2 puntos por miniatura)"* and *"Escudos (+2 puntos por miniatura)"*, which
  is exactly what the app offers. A test pins that list.
- **Fast cavalry is conditional.** The Reglamento (printed p.23) defines fast cavalry as cavalry
  with a save *"no superior a 5 ó más"* and Movement of at least 15cm. Light armour + horse gives the
  printed 5+; shields take it to 4+, so the unit stops being fast cavalry. Special-rule tags are
  static, so the app cannot hide the tag when shields are bought; the tag itself now says so:
  *"Fast cavalry — lost if they take shields (save becomes 4+)"*.
- **Chaos Ogres** (`ch-ogres`) — added the missing heavy armour option: *"Armadura Ligera (+2
  puntos) o Armadura Pesada (+3 puntos)"*. The two are mutually exclusive; see the next entry.

#### Light and heavy armour are alternatives, app-wide (2026-10-09)
Source: `source/1996 Reglamento.pdf`, **printed p.30 = PDF 32**, vision-verified. The armour-save
table (*ARMADURAS*) has a row for *"Escudo o Armadura Ligera"*, one for *"Escudo y Armadura Ligera o
Armadura Pesada"* and one for *"Armadura Pesada y Escudo"*, but none for light and heavy together.
A model wears one or the other. Thirteen units offered both as independent options, so a roster
could buy both:
- Bretonnia: `br-general`, `br-hero` and `br-battle-standard`.
- Chaos: `ch-ogres`.
- Norse: `no-norse-dwarfs`.
- Undead: `ud-skeleton-warriors`.
- Vampire Counts: `vc-skeletons` and six characters, whose option id is `heavy-armour-char`.

Each pair now shares `exclusiveGroup: 'armour'`, like the Marks of Chaos. Buying both raises the
`options-exclusive-group` warning; the checkboxes don't untick each other. The warning text was
widened by the next entry. A sweep in `armies.test.ts` pins the list of
units and fails if a new unit offers both without the group. Crew and rider armour on one entry
(`crew-light-armour` / `rider-light-armour` on the Norse war mammoth) belong to different models
and stay independent.

#### Chaos armour is a third alternative to light and heavy armour (2026-10-09)
Source: `source/1998 Reino del Caos.pdf`, offset +2, **printed p.100 = PDF 102**, vision-verified.
The PALADINES DEL CAOS entry (Paladín, Héroe and Comandante) reads *"Puede equiparse con Escudo
(+1 punto), y con Armadura Ligera (+2 puntos), Armadura Pesada (+3 puntos) o Armadura del Caos (+10
puntos)"*. The shield is added with *"y"*, but the three armours are joined by *"o"*. The owner
confirmed the reading. The rules on pp.59/61 agree: Chaos armour gives a basic 4+ save *"que puede
combinarse con un escudo"*, and nothing is said about combining it with other armour. The +10
character option `CHAOS_ARMOUR_10` therefore joins `exclusiveGroup: 'armour'`. Units offering two
armours now include `ch-lord`, `ch-hero`, `ch-champion` and `ch-battle-standard`, which offer heavy
and Chaos armour. The sorcerer's Chaos armour has no alternative to clash with. The regiment rates
(+7 Warriors and chariot crew, +14 Knights) *replace* the heavy armour the unit already wears
(*"Sustituir Armadura Pesada por Armadura del Caos"*), so they have nothing to pair with either.
The warning now reads *"a model may carry only one kind of armour"* / *"una miniatura sólo puede
portar un tipo de armadura"*, which covers both cases.

#### Chaos character armoury completed (2026-10-09)
Source: `source/1998 Reino del Caos.pdf`, offset +2, vision-verified on **printed p.100 = PDF 102**
(Paladín, Héroe and Comandante del Caos) and **printed p.102 = PDF 104** (Portaestandarte de
Batalla). Both pages print the same kit, and `ch-lord`, `ch-hero`, `ch-champion` and
`ch-battle-standard` were missing three items:
- **Light armour +2.** *"Escudo (+1 punto), y con Armadura Ligera (+2 puntos), Armadura Pesada (+3
  puntos) o Armadura del Caos (+10 puntos)"*. It joins `exclusiveGroup: 'armour'` with the other two.
- **Cavalry lance +2.** *"o Lanza de Caballería (+2 puntos) en el caso que se trate de una miniatura
  a caballo"*. This adds a new `EquipmentOption.requiresMount` flag. The lance is offered on foot as
  well, but the new `option-requires-mount` warning fires until the character has a mount. Any
  mount counts: the book's *"a caballo"* is read as "mounted", not "on a horse".
- **Barding +4.** *"Si la miniatura está montada en un Corcel del Caos, éste puede equiparse con
  Barda (+4 puntos)"*. It is an option of the Chaos Steed mount (`mount-chaos-steed-barding`), so
  it appears only while the rider is on one and goes stale if the mount changes. The Sorcerer
  (printed p.101) prints the same barding line and rides the same Chaos Steed, so he gets it too.

The four characters also carried a **"Chaos armour"** special-rule tag, which read as if they wore it
by default. The book prices it as a +10 option, so the tag is gone.

The weapon lists are now complete too. The Battle Standard Bearer (p.102) had only the lance, and
the Sorcerer (**printed p.101 = PDF 103**, vision-verified) had no weapon at all. Both now get the
six weapons the book prints for every Chaos character, at the same prices: additional hand weapon
+1, double-handed weapon +2, halberd +2, spear +1, flail +1 and cavalry lance +2 (mounted only). A
test pins the six for all five characters. The book joins them with *"o"*, but they stay
independent options; see the next entry.

#### Weapons are NOT mutually exclusive — decided 2026-10-09
Unlike body armour (see *Light and heavy armour are alternatives, app-wide* above), buying several
weapons is legal, so the app does not put weapon options in an `exclusiveGroup` in any army.
- **FAQ 1996 §4.1** (`research/faq-1996-v2.20.txt`, Primarch): *"A character may change weapons in a
  combat freely."* A character may carry several weapons, e.g. a cavalry lance for the charge and a
  double-handed weapon afterwards.
- **FAQ 1996 §29.2** (High Elf units): asked about warriors with spears *and* a second hand weapon,
  the answer only limits the bonus attack to fighting with two hand weapons. It does not forbid
  buying both.
- The army books' *"…, Flagelo (+1 punto), o Lanza de Caballería (+2 puntos)"* is read as listing
  what may be bought, not as a single choice.

The owner chose this after weighing it against making weapons exclusive everywhere, or for
regiments only. Do not add weapon exclusivity without revisiting this entry.

#### Movement in centimetres in Spanish — OLD-46 (2026-10-13)
The data stores M in inches, and the Spanish UI now prints it in the centimetres the Spanish books
use. Both directions go through `MOVEMENT_CM` (`src/data/movement.ts`), which was read off the
books rather than derived from a formula:

```
in:  0  2  3   4   5   6   7   8   9  10  12  24
cm:  0  5  8  10  12  15  18  20  22  25  30  60
```

The Spanish army books print exactly these M values: 5, 8, 10, 12, 15, 18, 20, 22, 25, 30, 60. The
table is one-to-one over them, so inverting it gives back the printed number. Matched by name
against the M column of every Spanish transcription in `source/transcribed/`, **294 of the data's
profiles convert back to exactly what the book prints**. The rest either don't match by name, or are war
machines where the book prints `-` on the machine and the data carries the crew's M. The Bretonnia
(1997) and Lizardmen (1997) PDFs are English editions printed in inches despite their Spanish
filenames, so like Norse, Halflings and Dogs of War they have no printed cm. The Spanish UI converts
them through the same table so that the whole UI is in centimetres. Dice tokens in M stay as printed,
unit included: Norse and Halfling `2D6"`, Fanatic and Chaos Spawn `5D6cm`.

The cross-check turned up four profiles converted with the wrong row. Without fixing them, the
Spanish UI would show a cm value the book never prints. All four were vision-verified on the PDF:
- **Dark Elves Hippogriff** (`de-hippogriff`): M 7 → **8**. `source/1995 elfos oscuros.pdf`, offset
  +2: **printed p.55 = PDF 57** (MONSTRUOS, *"Hipogrifo 20 5 0 6 5 5 6 3 8"*) and **printed p.80 =
  PDF 82** (bestiary, same row).
- **Dark Elves Dark Pegasus mount** (`mount-dark-pegasus`): M 7 → **8**. Printed p.80, *"Pegaso
  Oscuro 20 3 0 4 4 3 4 2 5"*.
- **Dark Elves Black Pegasus Sulephet** (Morathi's profile): M 7 → **8**. **Printed p.59 = PDF 61**,
  *"Pegaso Negro 20 3 0 4 4 3 4 2 5"*; p.55 prints the same row.
- **Dwarfs Josef Bugman** (`dw-josef-bugman`): M 4 → **3**. `source/1995 Enanos.pdf`, offset +2,
  **printed p.95 = PDF 97**, *"Josef Bugman 8 6 5 4 5 2 4 3 10"*. He is a Dwarf, and 8 cm is 3".

The Dark Elves error came from the header of `darkElves.ts`, which documented `20→7`; it now reads
`20→8`, like every other army. Two profiles are left for OLD-47: the Skaven Doomwheel (the book prints
M `7D6`, and the rules on p.31 and the list on p.67 give different rows) and the Empire Steam Tank
(the data has M `0`, the book prints `-`).

#### Chaos Dwarf allied Orc regiment — Strength (OLD-54, 2026-10-17)
`cd-orcs` carried S 4. *Ejércitos Warhammer: Enanos del Caos* (1995, ES) prints the row twice and
both read **S 3**: the army list, **printed p.60 = PDF 62** (*"Orco 10 3 3 3 4 1 2 1 7"*), and the
bestiary, **printed p.13 = PDF 15** (same row). Toughness 4 was already right; only Strength moved,
to **3**.

#### Chaos Dwarf war machines — the machine's own profile row (OLD-55, 2026-10-17)
The three entries carried only their crew's statline. The book's MAQUINAS DE GUERRA list,
**printed p.61 = PDF 63**, prints two rows for each machine: the machine, then its crew. (The issue
cited p.62; that page is MONSTRUOS. The war machines are on p.61.) All three machine rows read the
same under the `M HA HP F R H I A L` columns:

```
LANZAVIROTES   -  -  -  -  7  3  -  -  -
LANZACOHETES   -  -  -  -  7  3  -  -  -
CAÑON          -  -  -  -  7  3  -  -  -
```

Read at 300 dpi against the crew row printed directly beneath each one: the **7 sits under R and
the 3 under H**, and the F column is a dash — Toughness 7, 3 Wounds, no Strength of its own. The
Strength that matters is the weapon's, from the table below each profile (Bolt Thrower S5 -1 per
rank, Death Rocket S5, Earthshaker S7), which the entries already carried. This is the same reading
and the same fix as the High Elf Repeater Bolt Thrower in OLD-36.

`source/transcribed/chaos-dwarfs.md` had these three rows shifted one column (F 7, R 3); corrected
there too, with a note.

#### Great Taurus: Burning Hide and Fire Breath (OLD-56, 2026-10-17)
Both rules now carry the book's own description, from **printed p.10 = PDF 12**, and each opens its
own glossary article instead of a generic one.

**Piel Ardiente.** The tag used to read *"Fiery body (4+ ward save)"*, which the book does not
support. It prints: *"su duro pellejo puede detener los golpes de las armas **como si fuera una
armadura**. Por ello, los Grandes Tauros disponen de una tirada de salvación de 4, 5 ó 6."* That is
an armour save, so the tag now reads `Burning Hide — 4+ armour save`.

**Aliento de Fuego.** The tag was the bare words "Fire breath", which opened the shared
`breath-weapon` article, and that article says the hits are **Strength 4**. The Great Taurus
breathes at **Strength 3** (*"Cada miniatura alcanzada recibirá un único ataque de Fuerza 3"*), so
it gets an entry of its own, with the teardrop template, the hit on 4+, the buildings catching fire
and the extra wounds against flammable targets such as Treemen and Mummies.

The same two tags sit on the Great Taurus as a monster and as a character mount. Both were changed.

#### Lammasu: Magical Breath, the whole rule (OLD-57, 2026-10-17)
The tag read *"Sorcerous aura, dispels spells on 4+"*, which is only the first half of what
**printed p.11 = PDF 13** gives the creature, and it opened no glossary article at all.

The book's RESPIRACION MAGICA does two things. The 4+ dispel, once per spell cast at the Lammasu or
its rider, after which ordinary Dispel Magic cards may still be played. And a close-combat
protection: *"Si alguien intenta atacar al Lammasu o a su jinete con un arma mágica, la posibilidad
de impactar siempre se reducirá en -1"*, whatever the other modifiers, so nothing can need better
than a 2+ and a weapon that would hit automatically must roll a 2 or more. The attacker may choose
an ordinary weapon instead. It applies only to weapons swung in close combat, not to fireballs or
lightning the weapon produces, since those are cast as spells and fall under the dispel half.

Both halves are now in the tag, and the rule has its own glossary entry carrying the full text. The
tag sits on the Lammasu as a monster and as a character mount; both were changed.

#### The three rules every Chaos Dwarf carries (OLD-51, 2026-10-17)
From the bestiary, **printed p.9 = PDF 11**, now on every Chaos Dwarf character and regiment, each
with its own glossary article:

**ARMADURA.** *"los Enanos del Caos poseen un Atributo de Movimiento de 8 centímetros,
independientemente del tipo de armadura con el que estén equipados."* M 8cm, which is the 3" the
data already stored, whatever armour the model buys.

**PERSECUCION Y HUIDA.** They pursue and flee 3cm less than other troops, *"el equivalente de
5D6-3 centímetros en vez de 5D6."*

**MAGIA.** This one is a denial, and getting it backwards would be worse than leaving it out.
Ordinary Dwarfs dispel on a 4+ with no wizard; the book says *"Esta regla no se aplica a los Enanos
del Caos; pueden emplear Dispersiones de Magia igual que los humanos o los demás ejércitos."* The
tag is pinned through `TAG_RULE_OVERRIDES`, because the alias `magic resistance` sits inside its own
text and would otherwise open the Magic Resistance article and promise the opposite.

**BRUJOS ENANOS DEL CAOS**, same page, replaces the bare tag *"Uses the Chaos Dwarf spell deck"* on
the Sorcerer: their own deck of ten cards, dealt 1/2/3/4 by level, with discards redrawn from the
same deck.

Who does **not** get them. Bull Centaurs (their bestiary page is p.10) and the Hobgoblin, Orc,
Black Orc and Goblin troops (pp.11-13), as the issue states. Astragoth keeps only MAGIA and the
Sorcerers' deck: his own MOVIMIENTO rule on p.64 gives him M 15cm, a 15cm charge, no march bonus and
*"los 5D6 centímetros habituales"* when pursuing and fleeing, so the first two rules are replaced,
not added. The war machine crews are Chaos Dwarfs but are neither characters nor regiments, so they
were left alone.

One trap on the way: the first draft gave the Pursuit article the alias `pursuit`, which promptly
attached it to the unrelated Norse tag *"Dwarfs, hate all Orcs and Goblins, Elf Grudge, Dwarf
movement/pursuit rules"*. The snapshot in `rule-tags.txt` caught it. The alias is now
`pursues and flees`.

#### Hobgoblin and Sneaky Gitz rules (OLD-52, 2026-10-17)
Seven articles, all from the bestiary: Hobgoblins on **printed p.11 = PDF 13**, Sneaky Gitz on
**printed p.12 = PDF 14**.

Every Hobgoblin regiment (Warriors, Archers, Wolf Riders) now carries three. **ANIMOSIDAD**, where
the twist is that the army's *other* greenskins pass their checks automatically with no roll, since
they are too busy watching the Hobgoblins, while the Hobgoblins test as normal. **PANICO**, which
runs one way: greenskins take no test when Hobgoblins break past them, but Hobgoblins must test
when Orcs or Goblins break near them, because they cannot ignore fleeing Goblins the way Orcs can.
**OFICIALES ORCOS NEGROS**, a Black Orc character will take command of other greenskins but never
of Hobgoblins.

The Sneaky Gitz had three rough tags; they now carry the book's four plus animosity and panic,
which p.12 gives them *"como los demás Hobgoblins"*. Their own four: the flank envelopment (any
number of models, after the first round, won or lost, and the enemy can never envelop them back),
the poisoned daggers (an extra -1 to the enemy's armour save), the second dagger's extra attack,
and the Sneaky Git Boss, who is an exception to the Paladin rules and may take two daggers or a
hand weapon and shield. They do not get the Black Orc officers clause: p.12 does not repeat it for
them.

Aliases here are all specific (`hobgoblin animosity`, `hobgoblin panic`, `poisoned daggers`). Bare
`animosity`, `panic` or `poisoned` would have reached across the other fifteen armies. The
`poisoned daggers` alias starts at the same position as the generic `poisoned`, and the longer one
wins the tie.

Left alone: the Hobgoblin Hero, a character rather than a regiment, which keeps its plain Animosity
tag, since the issue asks about regiments.

#### Orc, Black Orc and Goblin rules (OLD-53, 2026-10-17)
The greenskin regiments a Chaos Dwarf army may field get the bestiary's own rules: Black Orcs from
**printed p.12 = PDF 14**, Orcs and Goblins from **printed p.13 = PDF 15**. Seven articles.

**Black Orcs** had one summary tag, *"Immune to Animosity & panic from other greenskins"*, standing
in for three separate rules. ANIMOSIDAD: they never test, and because they are not subject to it
they can never be the victim of another unit's animosity either. LIDERES ORCOS NEGROS, which was
missing altogether: a Black Orc character may join and command any Orc or Goblin unit, and that
unit stops being subject to Animosity while he leads it, but he will not take Hobgoblins. PANICO:
no test when a broken greenskin unit flees past, and the book is explicit that this covers the
Black Orcs themselves, not the units a Black Orc character leads.

**Orcs** had a bare "Animosity" tag. The book's version carries the Hobgoblin clause: with
Hobgoblin mobs in the army the Orcs pass automatically, no dice. PANICO was missing: a fleeing
Goblin unit never panics Orcs.

**Goblins** had "Animosity" and "Fear Elves". Both are now the book's: the fear applies to any Elf
unit the Goblins do not outnumber two to one, and animosity carries the same Hobgoblin clause as
the Orcs'.

#### Zhatan the Black: equipment and a fourth magic item (OLD-58, 2026-10-17)
All from his entry on **printed p.63 = PDF 65**.

**WS was already right.** The issue reports it as 7; the data has carried 8 since the first commit,
and the book prints `ZHATAN 8 8 6 4 5 4 6 4 10`. Nothing to change there.

**Equipment.** The tag read *"Heavy armour, shield & the Hammer of Hashut"*, and two thirds of that
is invented. The book says *"Zhatan está equipado con Armadura Pesada y un Martillo de Guerra."* No
shield, and an ordinary war hammer rather than a named magic weapon, which is also what makes the
save the 5+ the issue asks for: heavy armour alone is 5+, while heavy armour and shield would be
4+. (The army's magic item list does hold a *Black Hammer of Hashut*, which is a different thing
and is still selectable.)

**Four magic items.** *"Zhatan es un Comandante, y normalmente podría tener hasta tres objetos
mágicos. En cambio, a causa de su enorme estatura... y el poder de su maestro Gorth, puede tener
hasta cuatro objetos mágicos."* He is the first non-wizard in the data to be allowed more than his
rank gives, so `UnitProfile` gains an optional `magicItemSlots`, which `magicItemAllowance` prefers
over the rank chart, with option deltas still applied on top. Three tests in `validate.test.ts`
pin it: Zhatan gets 4 while `MAGIC_ITEM_ALLOWANCE.lord` stays 3, every other Chaos Dwarf character
still follows its rank, and a fifth item raises `magic-items-count`.

#### Astragoth: four wrong characteristics and three rules (OLD-59, 2026-10-17)
His entry is on **printed p.64 = PDF 66**, which prints `ASTRAGOTH 15 6 3 5 5 4 5 3 10`. The data
had four columns wrong, the four the issue names:

```
         M    WS  BS  S    T   W    I    A   Ld
book     15    6   3  5    5   4    5    3   10
was      8     6   3  4    5   3    2    3   10   (M stored as 3")
now      15    6   3  5    5   4    5    3   10   (M stored as 6")
```

He is the one Chaos Dwarf who does not move 8cm: the walking machine carries him at 15cm, which is
also why OLD-51 leaves the bestiary Armour and Pursuit rules off him.

The three rules from the same page, each now a glossary article. **ARMAS Y ARMADURA**, which was a
bare *"3+ armour save (mechanical body)"*: the save comes from the machine he is installed in plus
his armour, since his legs are petrified. **MOVIMIENTO**, which the data reduced to *"Charges only
6\""*: he charges 15cm, cannot double his Movement to march, and the one exception is that he
pursues and flees the ordinary 5D6. **ATAQUE MORTIFERO**, which the data had as *"re-roll all
attacks on a hit"*, something the book does not say: if he hits the same target with all three
Attacks, he immediately attacks that target again with all of them.

The alias for the last one is `attacks it again with all of them`, not `deadly attack`. The short
version also matched the Empire tag *"Protected by Sigmar... Strength 10 Deadly Attack in close
combat"*, a different rule in a different book. The `rule-tags.txt` snapshot caught it, the second
time in this batch.

#### Gorduz Backstabber: his starting kit (OLD-60, 2026-10-17)
**Printed p.63 = PDF 65**: *"Gorduz el Traicionero está equipado con una Armadura Ligera, un Escudo
y un Hacha."* The tag said *"Light armour, shield & hand weapon"*, which left out the axe the book
names and never stated the save. Light armour and shield together are a 5+ on the armour table of
printed p.54, so the tag now reads `Light armour, shield & axe (5+ save)`.

His profile was already right against the same page, `GORDUZ 10 6 6 4 4 3 5 4 8`, as were the Giant
Wolf at +4 points and the three magic items.

#### Gorduz Backstabber: Predestined! (OLD-62, 2026-10-18)
**Printed p.63 = PDF 65**, under REGLAS ESPECIALES: *"¡Predestinado... Afortunado...
Escurridizo...! Llámese como se quiera, Gorduz el Traicionero tiene una habilidad especial para
sobrevivir. Al sufrir su última (y para otros fatal) herida, puede efectuar una tirada de salvación
sin modificar de 4, 5 ó 6 en 1D6. Podrá efectuar y superar esta tirada siempre que sufra su última
herida ¡siguiendo vivo hasta que se le acabe la suerte!"*

The tag read *"Predestined — survives his final wound on a 4+"*, which lost two things the book
says: the roll is an **unmodified save**, and he gets it **every time** he takes his last wound, not
once. It also matched no glossary alias, so it carried no ⓘ at all. The tag now reads `Predestined
— an unmodified save of 4+ each time he suffers his last wound` and `RULES` carries the book's text
under `gorduz-predestined`.

The repo's own transcription (`source/transcribed/chaos-dwarfs.md`) renders the sentence as *"puede
efectuar una tirada; con 4, 5 ó 6 en 1D6"*, dropping *"de salvación sin modificar"*. The PDF wins,
and a 400 dpi render of the paragraph was used to read it.

The alias is the single word `predestined`, which appears in no other army's tag. That is
deliberate: this batch twice caught a broader alias stealing someone else's ⓘ (a bare `pursuit`
took a Norse tag, a bare `deadly attack` an Empire one). The tag leads with the word, so it matches
at index 0 and nothing later in the tag can outrank it.

#### Black Orc regiment: its base equipment (OLD-61, 2026-10-18)
**Printed p.60 = PDF 62**: *"EQUIPO: Los Orcos Negros están equipados con armaduras ligeras y armas
de mano. TIRADA DE SALVACIÓN: 6+."* The shield is an option the same box prices at +1 point per
model, and the entry already offered it, so the tag `Light armour & shield (6+)` both folded a paid
option into the base kit and contradicted itself: light armour plus shield is a 5+ on the armour
table of **printed p.54 = PDF 56** (*"Escudo o armadura ligera 6+ / Escudo y armadura ligera o sólo
armadura pesada 5+"*), not the 6+ the book prints for this unit. The 6+ is light armour alone, so
the tag now reads `Light armour & hand weapons (6+)`.

#### Chaos Dwarf character equipment list (OLD-50, 2026-10-17)
Characters could buy no ordinary equipment at all. They now carry the list from **printed p.55 =
PDF 57** ("VALORES EN PUNTOS DEL EQUIPO"), read together with the legend on **printed p.54 = PDF
56**: an item marked `*` is not available to Chaos Dwarfs or Bull Centaurs, and one marked `**` is
barred to those two and to Hobgoblins as well.

Every character box on pp.56-57 carries the same sentence, so the entitlement is the book's:
*"puede equiparse con cualquier combinación de armas y armadura permitida a cualquiera de los tipos
de tropa de esta lista e incluida en la Lista del Equipo"*. Their EQUIPO line is a free hand weapon
(*"Arma de mano: Hacha, Maza, Garrote, etc."*), which every character already has, so only the paid
rows are offered.

Open to all seven characters, at the printed price:

```
Shield 1 · Light armour 2 · Heavy armour 3 · Handgun 3 · Pistol 2
Additional hand weapon 1 · Two-handed weapon 2 · Flail 1 · Halberd 2 · Spear 1
```

The Hobgoblin Hero adds the four `*` rows, which the legend bars only to Dwarfs and Bull Centaurs:
bow 2, short bow 1, javelin 1, sling 1. The `**` rows go to nobody here, since the three troop
types that could take them (Orcs, Black Orcs, Goblins) field no characters in this list: barding 4,
long bow 3, crossbow 3, repeater crossbow 4, cavalry lance 2.

Light and heavy armour share `exclusiveGroup: 'armour'`, so buying both raises
`options-exclusive-group`, as everywhere else. Names are singular, since a character is one model;
the plural constants in the same file are the regiments' per-model prices from pp.58-60, a
different table that happens to share several ids.

The three special characters are left out on purpose. Pages 63-64 arm Zhatan, Gorduz and Astragoth
by name and never offer them the list, and a test asserts they have no equipment options at all.

#### Cavalry rider Movement, swept army by army (OLD-49, 2026-10-18)
Of the 38 regiments with a fixed steed, 19 gave the rider the steed's Movement. Every one of those
19 was read on its own page. Fifteen were wrong and four were faithful to a printed row, which is
what made this worth checking rather than applying a pattern.

**The 15.** These books print two rows and give the rider its own on-foot Movement. The mount row
was already right in each case; only the rider moved.

| Units | Page | Printed rider row | Was | Now |
|---|---|---|---|---|
| Empire: White Wolf, Panther, Blazing Sun, Reiksgard knights | printed 59-60 = PDF 61-62 | `10 4 3 4 3 1 4 1 7` | M 8 | M 4 |
| Empire: Kislev Winged Lancers | printed 63 = PDF 65 | `10 4 3 3 3 1 3 1 7` | M 8 | M 4 |
| Chaos: Chaos Knights | printed 103 = PDF 105 | `10 6 6 4 4 1 6 2 9` | M 8 | M 4 |
| Chaos: Marauder Horsemen | printed 105 = PDF 107 | `10 4 3 4 3 1 4 2 7` | M 8 | M 4 |
| Chaos: Bloodletters on Juggernauts | printed 114 = PDF 116 | Desangrador `10 5 5 4 3 1 6 2 10` | M 7 | M 4 |
| Chaos Dwarfs: Hobgoblin Wolf Riders | printed 60 = PDF 62 | Hobgoblin `10 3 3 3 3 1 2 1 6` | M 9 | M 4 |
| O&G: Savage Boar Boyz, Orc Boar Boyz, Goblin Wolf Riders, Forest Goblin Spider Riders | printed 82-83 = PDF 84-85 | rider `10 ...` in all four | M 7/7/9/7 | M 4 |
| Vampire Counts: Wight Cavalry | printed 64 = PDF 66 | Tumulario `10 3 0 3 4 1 3 1 8` | M 8 | M 4 |
| Lizardmen: Cold One Riders | printed 76 = PDF 78 | Grt Crested Skink `6 2 3 4 2 1 4 1 6` | M 8 | M 6 |

The Lizardmen book is the English edition, so its 6 is already inches; the rest convert 10cm to 4".

**The 4 that were right, and now show it.** These entries print a SINGLE combined row carrying the
mount's Movement, with no steed profile at all, so their M 8 was faithful. The data nonetheless
added a steed row the book does not print. Owner's call (OLD-49): drop the steed row so the entry
matches the page.

- Empire Pistoliers, printed 61 = PDF 63: `Pistolero 20 3 3 3 3 1 3 1 7`, one row.
- Empire Outriders (Engineer Scouts), printed 61 = PDF 63: `Explorador 20 3 3 3 3 1 3 1 7`, one row.
- Empire Kislev Horse Archers, printed 64 = PDF 66: `Arquero a Caballo 20 3 3 3 3 1 3 1 7`, one row.
- Halfling War Sheep Riders, printed 11 = PDF 9: `Halfling 8* 2 4 2 2 1 5 1 8`, one row, and the
  asterisk has no footnote on the page. It is the only one of the five Halfling rider entries
  printed this way; Eagle, Swan, Battle Ram and Goat Riders all print the Halfling at M 4 with the
  mount below. The bestiary's War Sheep (printed 8) is M 8 with every other characteristic a dash,
  which is presumably why the list gives it no row.

Each of the four keeps its mount in prose on the unit's own rules ("Light armour & Warhorse (5+
save)"), and the Halflings keep Skittish, so nothing was lost with the row.

**Empire knight Strength, found in the same rows.** The four orders print **S 4**, and the data had
S 3. The foot entry on the same list settles it: `Caballero a Pie de la Reiksgard 10 4 3 4 3 1 4 1 7`
(printed 61 = PDF 63). Corrected alongside the Movement.

The other 19 regiments, the ones already giving the rider its own M, were left alone. Four of them
were vision-checked in passing (the Halfling Eagle, Swan, Battle Ram and Goat Riders on PDF 9) and
are correct.

#### Doomwheel and Steam Tank, the two profiles OLD-46 parked (OLD-47, 2026-10-18)
Both were left out of the centimetres work because their Movement could not be a number. Read on
the scans at 300 dpi, neither turned out to be the book contradicting itself.

**Doomwheel.** Skaven prints it twice, in the war-machine rules (**printed p.31 = PDF 33**) and in
the army list (**printed p.67 = PDF 69**), and the two tables are the same:

```
Generador de Piedra Disformidad   -    -  -  -  5  Especial  -  -  -
Rueda                             7D6  -  -  7  7  3         1  -  -
Ingeniero Brujo                   12   4  4  4  3  1         5  2  10      (p.67 prints 5)
Ratas                             -    3  0  3  2  6         1  6  10
```

The only cell that differs is the Engineer's Movement: 12 on p.31, 5 on p.67. Those are the same
speed written in different units, since 12cm is 5", and every other row on p.67 is in centimetres,
so that one cell was printed in inches. The data stores inches, so M 5, and the Spanish UI prints
it back as 12cm. Nothing to arbitrate.

What the entry had was wrong on its own terms: `M 7, WS 0, BS 0, S 0, T 7, W 3, I 1, A 0, Ld 5`.
The Wheel has **S 7**, the book puts a dash in WS, BS, A and Ld where the data invented zeros and
an Ld of 5, and M is the token `7D6cm` (the MOVIMIENTO text on p.31 says centimetres, as with the
Goblin Fanatic). The other three rows were prose, and wrong in several columns: the Engineer was
given WS5 BS4 T4 W3 A1 against the printed WS4 BS4 T3 W1 A2, and the rats WS3 S0 T4 W2 I6 A1
against the printed WS3 BS0 S3 T2 W6 I1 A6. They are now profile rows carrying the printed values,
like the Chaos Dwarf war machines of OLD-55. The rats' six Wounds is the number the rules mean when
six wounds kill them all and the Wheel stops.

**Steam Tank.** **Printed p.65 = PDF 67** reads `Tanque a Vapor  -  3  3  7  10  5  -  -  10`. Every
characteristic in the data was already right. The fault was that the book's dashes in M, I and A
were stored as `0`, so the app showed a tank with Movement 0, Initiative 0 and no Attacks. They are
notes now.

Both transcriptions were corrected too. `empire.md` had the tank row as `- - 3 7 10 4[?]`, dropping
WS and misreading W. `skaven.md` had resolved its own p.31 incident the wrong way, adopting a pass
that shifted the Wheel row one column, and had the Engineer's Ld as 6 instead of 10.

#### Ludwig Schwartzhelm: acting as Battle Standard Bearer (OLD-64, 2026-10-26)
**Printed p.69**, Ludwig's cost table: `+50 | si actúa como Estandarte de Batalla`. The data flagged
him `canBeBSB` and carried the cost only as the tag *"+50 pts to act as Battle Standard Bearer"*, so
the app never added the 50. He now has `bsbPoints: 50`, and the editor's "Make Battle Standard Bearer"
toggle (`entry.isBSB`) charges it once: 70 on his own, 120 as Battle Standard Bearer. It adds no magic
item slot, since the book gives him no other magic item. The Sword of Justice's +50 is OLD-63.

#### Empire: special characters' extra costs (OLD-63, 2026-10-26)
**Karl Franz, Imperio printed p.67-68**, cost table: `Karl Franz 110 puntos / +100 Martillo de
Sigmar / +75 El Sello de Plata`. The text: "El Emperador puede tener tres objetos mágicos, dos de
los cuales deben ser el Martillo de Sigmar (+100 puntos) y el Sello de Plata (+75 puntos) … un
objeto mágico adicional". Both items are mandatory (owner ruling 1 of 2026-10-26: the character
pages win over p.67), so `emp-karl-franz` now carries them as `fixedMagicItems`: always charged at
their card prices (100 and 75, which match the page), locked in the editor, never bought twice.
A bare Karl Franz goes from 110 to 285; his one free pick is added on top.

The fixed items count toward his three-item allowance, as the page says. Every page that states
the number agrees: Kurt Helborg p.71 ("hasta tres objetos mágicos, uno de los cuales debe ser uno
de los Colmillos Rúnicos … Los otros dos"), the Supreme Patriarch p.70-71 ("hasta cuatro objetos
mágicos, uno de los cuales debe ser el Báculo de Volans"), Zarina p.74 ("hasta tres … uno de los
cuales debe ser … Fearfrost"), Dieter Helsnicht, No Muertos p.95 ("hasta cuatro … Dos de ellos
deben ser"), and Keorl, Norsca PDF 34 ("entitled to carry three magic items. Two of these will
always be").

**Karl Franz's mount, p.67-68.** "Montura: El Emperador puede entrar en combate montado en un
Caballo de Guerra con barda metálica (+7 puntos incluyendo la barda), o un Monstruo … el favorito
del Emperador es el Grifo Garra de Muerte (+150 puntos)." The data had him riding the Griffon
with its 150 buried in the headline and a display-only "Griffon Deathclaw" profile. He now takes
the same mount list as Helborg (p.71) and the Supreme Patriarch (p.70-71), extracted into one
constant, and the Griffon is the mount option at +150 that carries its statline (the page prints
no separate Deathclaw profile). The bare entry stays at 285; 292 on the warhorse, 435 on the Griffon.

**Fixed items of the other eight, one per printed cost table.** Each item is mandatory (owner
ruling 1 of 2026-10-26: the character pages win over the p.67 note that lets the Electors' Runefangs
be counted separately for players without Magia de Batalla). Each price below equals the card
price, so no override is stored.

| Character | Page | Table | Fixed items | Bare entry |
|---|---|---|---|---|
| Grand Theogonist Volkmar | p.69-70 | `+80 Báculo del Poder / +75 Grifo de Jade / +35 Cuerno de Sigismund` | Staff of Power, Jade Griffon, Horn of Sigismund | 150 to 340 |
| Supreme Patriarch | p.70-71 | `+75 Báculo de Volans` | Staff of Volans | 290 to 365 |
| Kurt Helborg | p.71 | `+30 Colmillo Rúnico` | Runefang | 110 to 140 |
| Boris Todbringer | p.72 | `+30 Colmillo Rúnico / +25 Talismán de Ulric` | Runefang, Talisman of Ulric | 90 to 145 |
| Aldebrand Ludenhof | p.72 | `+30 Colmillo Rúnico` | Runefang | 90 to 120 |
| Valmir von Raukov | p.72-73 | `+30 Colmillo Rúnico / +40 Arco del Dragón` | Runefang, Dragon Bow | 90 to 160 |
| Marius Leitdorf | p.73 | `+30 Colmillo Rúnico` | Runefang | 110 to 140 |
| Zarina Katarin | p.74 | `+100 Fearfrost` | Fearfrost | 200 to 300 |

Volkmar's equipment line (p.70) reads "no lleva ni armas ni armadura, pero posee tres objetos
mágicos", and the three items above are those three, so `magicItemSlots` is 3 and he has no
free pick. The old rule line "Three additional magic items" contradicted that and is gone. The
Runefang is `duplicable` because p.67 says "Existen doce Colmillos Rúnicos", so Helborg and
several Counts can each carry one in the same army. The Electors' mounts (p.72-73, a barded
Warhorse each, no price printed), Volkmar's War Altar and Zarina's Warhorse keep their current
treatment: the unpriced mounts stay as they are and the Altar and Warhorse stay display-only.
Ludwig (p.69) and Magnus (p.68-69) do not change.

**Profiles corrected (OLD-67, 2026-10-26).** Volkmar (Imperio p.69) prints W3 I5 A3, the data had W4 I3 A5. Aldebrand Ludenhof (p.72) and Marius Leitdorf (p.73) print BS5 like the other Elector Counts, the data had BS4.

**Magic item limits (OLD-69, 2026-10-27).** Imperio p.72: Boris Todbringer "tiene dos objetos mágicos", the Runefang and the Talisman of Ulric, and Aldebrand Ludenhof "posee un sólo objeto mágico", a Runefang. p.73: Valmir von Raukov "tiene dos objetos mágicos", the Runefang and the Dragon Bow, and Marius Leitdorf "tiene un objeto mágico", a Runefang. Their allowance moves from a lord's 3 to 2, 1, 2 and 1, all filled by their fixed items, and they may buy no other item. Ludwig Schwartzhelm (p.69) may be armed with the Sword of Justice (+50) and "no puede tener ningún otro objeto mágico": his allowance moves from a hero's 2 to 1, the sword stays optional (OLD-63 ruling), and no other item may be bought, a magic banner as Battle Standard Bearer included.

#### Dwarfs and Skaven: special characters' extra costs (OLD-63, 2026-10-26)
**Dwarfs, Enanos (1995, ES) printed pp.90-96.** Each page prints a cost table of the form
`<character> N puntos / +Runas de Arma / +Runas de Defensa / +Runas Talismánicas`. The runes are
priced per group, so each group is a `fixedExtra` (`weapon-runes`, `defence-runes`,
`talismanic-runes`) named after the object that carries it. The pool's single-rune items stay
untouched. A bare entry goes from the headline to the sum of its page.

| Character | Page | Table | Fixed extras and items | Bare entry |
|---|---|---|---|---|
| King Kazador | p.90 | `+170 Runas de Arma / +100 Runas de Defensa / +50 Runas Talismánicas` | Hammer of Karak Azul 170, Armour of the King of Karak Azul 100, Horn of Storms 50 | 174 to 494 |
| Ungrim Ironfist | p.91 | `+90 / +55 / +70` | Axe of Dargo 90, Crown of the Slayers 55, Dragon Cloak 70 | 210 to 425 |
| Kragg the Grim | p.92 | `+165 / +150 / +45` | Hammer of Kragg 165, Armour of Kragg 150, Runic Staff 45 | 309 to 669 |
| Gotrek | p.93 | `+125 Hacha de Gotrek` | Axe of Gotrek (card, 125) | 225 to 350 |
| Felix Jaeger | p.93 | `+50 Espada de Félix`; "empuña una Espada de Bronce Fulgurante" | Sword of Shining Bronze (card, 50) | 77 to 127 |
| Josef Bugman | p.95 | `+40 Runas de Armas / +25 Jarra de Cerveza Rúnica` | Bugman's rune axe 40; Bugman's Tankard at 25 | 111 to 176 |
| Burlok Damminson | p.96 | `+25 Runas de Armas / +55 Runas de Defensa` | Burlok's Hammer 25, Burlok's Armour 55 | 130 to 210 |
| Thorgrim Grudgebearer | p.94 | `+50 Gran Libro / +140 Trono / +75 Corona / +75 Armadura de Skaldor / +125 Hacha de Grimnir` | Great Book of Grudges, Dragon Crown of Karaz, Armour of Skaldor, Axe of Grimnir (cards, 50+75+75+125) | 160 to 485 |

King Kazador's hammer: the page lists the Master Rune of Death, the "Runa de Ataque" (+1 to
Weapon Skill) and the Rune of Power. The data said Rune of Cleaving, which is a different rune and
would not add up to the 170 the page charges, so the line now reads Rune of Striking (the pool's
name for "Runa de Ataque").

**Josef Bugman's tankard.** The page prices it at +25 ("+Jarra de Cerveza Rúnica +25 puntos"), the
magic-item card at 50 (Magia p.38 and p.74). The tankard is a fixed item with `points: 25`, so he
pays the page price; the card stays at 50 for everyone else. Owner decision (2026-10-26).

**Thorgrim's Throne of Power, +140: user choice (owner ruling 2026-10-26).** The page reads both, in its
background text (checked in the PDF; the transcription omits it), "Es transportado sobre el Trono del
Poder por sus cuatro vigorosos porteadores" and, under ESPECIAL (p.94), "Thorgrim puede entrar en combate
sentado en el Trono del Poder y acompañado por sus cuatro porteadores". The two do not agree on
whether the Throne is mandatory, so the owner left it to the player: an unticked option,
`throne-of-power`, 140. The bare entry is 485 and 625 with the Throne. The four
other items are fixed: the page says he "va armado con el Hacha de Grimnir y entra siempre en
batalla con la Armadura de Skaldor" and wears the Crown and the Great Book. That is four items
against a lord's three slots, so `magicItemSlots` is 4.

Gotrek's axe was labelled "Gotrek's Axe of Grimnir" in the data, but the page and the card are the
Hacha de Gotrek; the line now says Axe of Gotrek. Felix's sword line stays as it was.

**Skaven, Skaven (1995, ES) printed pp.69-74.** Throt did not change here; OLD-73 later made the Warpstone Amulet his fixed first item (see below).

| Character | Page | Table | Fixed extras and items | Bare entry |
|---|---|---|---|---|
| Grey Seer Thanquol | p.69 | `Destripahuesos +45 puntos` | Boneripper (bodyguard) 45 | 380 to 425 |
| Lord Skrolk | p.70 | `+75 Liber Bubonicus / +100 Báculo de Corrupción` | Liber Bubonicus, Staff of Corruption (cards, 75+100) | 225 to 400 |
| Ikit Claw | p.71 | `+25 Tormenta Demoníaca` | Daemonic Storm (card, 25) | 315 to 340 |
| Deathmaster Snikch | p.73 | `+40 Brazaletes de Poder / +75 Capa de las Sombras` | Bracelets of Power, Cloak of Shadows (cards, 40+75) | 230 to 345 |
| Queek Headtaker | p.74 | `+50 Degolladora de Enanos / +50 Armadura de Disformidad` | Dwarf Cleaver, Warpstone Armour (cards, 50+50) | 138 to 238 |

Thanquol's Boneripper is mandatory: p.69 says "Destripahuesos permanecerá junto a Thanquol en
todo momento" (checked in the PDF, which the transcription paraphrases). The rule line used to say
"May be accompanied" and now says "Accompanied by his bodyguard". Skrolk's +100 is the Báculo de
Corrupción, not the Plague Censer, which has no printed cost; the rule line named the wrong
object. Snikch's and Queek's items are "los primeros dos" of their allowances (p.73, p.74), Ikit's
Tormenta Demoníaca is "el primero que debe adquirir" (p.71), and Skrolk's two items are "siempre"
his (p.70).

**Profiles corrected (OLD-67, 2026-10-26).** Dwarfs (Enanos): Felix Jaeger (p.93) prints T4 I5 Ld8, the data had T5 I4 Ld10, which is Bugman's row. His BS stays 5 and M4 WS6 W2 A3 were right; the OLD-67 issue text read BS4 T3 from the same row, and a 300 dpi crop gives BS5 T4. Ungrim Ironfist (p.91) prints M8cm WS7 BS6 S4 T5 W3 I5 A4 Ld10, so the data row was shifted one column; T5 is the base value, the Crown of the Slayers' +1 Toughness stays in the rules text like Kragg's and Bugman's.

**Rule texts corrected (OLD-68, 2026-10-27).** Skaven (p.69): Thanquol wears no armour and fights with a sword, and only Destripahuesos fights with fangs and claws; the tag said claws and teeth for Thanquol himself. Ikit Claw (pp.71-72): the book calls the Tormenta Demoníaca a halberd-type weapon, and Warhammer Magia (p.42) prints "Arma a Dos Manos" and "El personaje no podrá poseer ninguna otra arma mágica". The item moved from the arcane category to weapon, so the one-magic-weapon rule now blocks a second weapon on Ikit, and its Spanish name carries the accent (Tormenta Demoníaca). His 25 points are unchanged.

**Magic item limits (OLD-69, 2026-10-27).** Enanos p.24 and p.80 count runic items as magic items under the max-items table, so each rune group of a special character now uses one slot (owner decision on the issue). Kazador (lord, three rune groups, p.90), Ungrim (lord, three, p.91), Burlok (hero, two, p.96) and Bugman (hero, his rune axe and the Tankard, p.95) have no free pick left. Kragg the Grim (p.92) prints no count; his statline is the Gran Herrero Rúnico row, and p.84 gives a Runesmith "de cualquier tipo" up to three items, so his allowance moves from a hero's 2 to 3, all filled by his three runic items. The same p.84 rule (and p.80) moves the Runesmith, Master Runesmith and Rune Lord from 2 to 3. Gotrek's axe is the only magic item he may have and Felix's sword the only one he may have (p.94, Maldición de Gotrek): Gotrek moves from 3 to 1 and Felix from 2 to 1, and neither may buy anything. Law 4 (p.24, Runas Celosas) forbids using a master rune more than once, so the master runes on the rune groups now count for army uniqueness: Kazador's Death, Adamant and Dread (p.90), Ungrim's Spite (p.91), Kragg's Adamant (p.92) and Burlok's Swiftness (p.96). Kazador and Kragg both bear the Master Rune of Adamant, so fielding both raises the duplicate-item error (owner decision). Kragg's own Master Rune of Kragg is not a buyable item.

Skaven: Lord Skrolk (p.70) may carry up to three items, two of them always the Staff of Corruption and the Liber Bubonicus, so his allowance moves from 2 to 3 (one free pick). Deathmaster Snikch (p.73) up to three, the first two the Brazaletes and the Capa (2 to 3). Warlord Queek (p.74) up to four, the first two the Degolladora and the Armadura (3 to 4). The Verminlord (p.62) has only the Doom Glaive, which has no item card, and no other item (4 to 0). Throt (p.72) stayed at two; at the time the rule that his first item must be the Warpstone Amulet was not enforced, which OLD-73 later did.

**Unit and option costs (OLD-71, 2026-10-27).** Enanos p.83: "Si el General es el Alto Rey de los Enanos, podrá entrar en combate sobre el Trono del Poder y acompañado por cuatro porteadores. El valor en puntos total del Trono y sus porteadores es de 140 puntos." The Dwarf General (160) now has the same flat `throne-of-power` option as Thorgrim, 140 points, whose description says it is only for a General who is the High King: 160 to 300 with the Throne.

**Shown profiles (OLD-71, 2026-10-27).** Enanos p.83 prints the Throne's bearers: "Porteador 8 5 4 4 4 1 3 2 9". Thorgrim and the Dwarf General now show a "4 Throne bearers" row (M 3", 8 cm in Spanish) while their Throne of Power option is bought. Display only: the 140 does not change.

**Rule changes (OLD-73, 2026-10-28).** Skaven p.71 (Ikit Claw): "Ikit puede elegir libremente sus hechizos de cualquier mazo de Hechizos Mágicos, excepto del correspondiente a los hechizos de la magia ¡Waaagh!". His lores go from `skaven` to `skaven, battle, high, dark, necromantic`: the Skaven deck and the four decks of Warhammer Magia de Batalla. The later army-book decks (Chaos Dwarf, the Chaos gods, Norse) stay out: the text excludes only Waaagh, so whether they count is an owner call, and the owner chose these five. Ikit stays optional as General (owner decision): the text says he replaces the Warlord "si se decide incluirle" but also "Si se adquiere como General". Skaven p.72 (Throt): "el primer objeto mágico que elija debe ser el Amuleto de Piedra de Disformidad", header "Amuleto de Piedra de Disformidad +10 puntos". The amulet (card, 10) is now his fixed item, charged on top of 70 (70 to 80), and his allowance of 2 leaves one free pick. Enanos pp.83 and 94: there is one Throne of Power, which Thorgrim's page and the generic General's page both offer, and the General's page grants it only "si el General es el Alto Rey". Two entries carrying it raise the warning `option-one-per-army`, and the generic General's Throne on an entry that is not the army General raises `option-general-only`. Thorgrim carries no General-only flag: his page says "Si el trono se emplea para transportar a otro rey Enano", so he may bring it for another king. Both rules are warnings because the app cannot tell which king the player declared.

#### Wood Elves: special characters' extra costs (OLD-63, 2026-10-26)
**Wood Elves, Elfos Silvanos (1996, ES) printed pp.70-80.** Each page prints its extras under the
headline as `+N puntos: <objeto>`. Items in the pool are fixed at their card price, which matches
every page; the rest are `fixedExtras`. Durthu and Drycha print no extras and do not change.

| Character | Page | Table | Fixed items and extras | Bare entry |
|---|---|---|---|---|
| Orion | p.70-71 | `+50 Lanza de Kurnous / +50 Cuerno de la Cacería Salvaje / +50 Capa de Isha / +5 por Mastín` | Spear of Kurnous, Horn of the Wild Hunt, Cloak of Isha (cards, 50+50+50); hounds a counted option | 300 to 450 |
| Ariel | p.71-72 | `+50 Báculo de Olmo / +25 Bellotas del Roble Eterno / +25 Venablo de Muerte / +25 Vino de Bayas` | Staff of the Elm, Acorns of the Eternal Oak, Dart of Death, Berry Wine (cards) | 366 to 491 |
| Naieth | p.74 | `+15 Othu el Búho / +30 Báculo de los Augurios` | Staff of the Auguries (card, 30); Othu the Owl 15 | 59 to 104 |
| Thalandor | p.75 | `+5 Pintura de Guerra Mágica / +15 Talismán de Qwarr / +25 Lanza de Daith / +95 Gwandor el Águila Gigante` | Magic War Paint, Talisman of Qwarr, Spear of Daith (cards); Gwandor 95 | 240 to 380 |
| Lothlann | p.76 | `+50 Estandarte de Athel Loren / +7 Corcel Élfico con Barda` | Battle Banner of Athel Loren (card, 50); Barded Elven Steed 7 | 101 to 158 |
| Scarloc | p.77 | `+25 Flecha Lluvia de Muerte` | Death Rain Arrow (card, 25) | 54 to 79 |
| Wychwethyl | p.77-78 | `+25 Tambor de Piel de Orco` | Orc-Skin Drum (card, 25) | 75 to 100 |
| Sceolan | p.78 | `+10 Escudo de Bronce / +50 Arco de Loren` | Bronze Shield (new, 10), Bow of Loren (card, now 50) | 106 to 166 |
| Skaw | p.79 | `+15 Halcones / +25 Flagelo de Garras` | Claw Scourge (new, 25); Falcons 15 | 51 to 91 |
| Gruarth | p.80 | `+66 Tigres Dientes de Sable / +10 Boleadoras` | Bolas (new, 10); Sabre-Tooth Tigers Colmillo & Garra 66 | 90 to 166 |

**Orion's hounds.** p.71: "+5 puntos por cada Mastín, tantos como se desee". The hounds are a
counted option, `hunting-hounds` (Mastines de Caza), 5 each with no cap; four hounds make 470.

**Three new items.** The pool lacked Sceolan's Escudo de Bronce (p.78, shield, 10), Skaw's Flagelo
de Garras (p.79, weapon, 25) and Gruarth's Boleadoras (p.80, weapon, 10). Each is a Wood Elf
special-character item. Their Spanish text is the page's rules paragraph, read in the PDF; the
English text renders it, with the Bolas' 30 cm range as 12 inches.

**Bow of Loren corrected from 60 to 50.** Elfos Silvanos p.78 prints "+50 puntos: Arco de Loren"
and the Magia card list prints 50 (Magia p.72); only Magia p.34 prints 60. The item is shared with
the High Elves (`restrictedTo: ['high-elves', 'wood-elves']`), so it costs 50 there too. Owner
decision (2026-10-26).

**Rule texts and classification corrected (OLD-68, 2026-10-27).** Elfos Silvanos: Durthu (p.76) may be included "como personaje independiente" and p.61 says special characters are counted against the characters allowance, so his role is now character and his 360 points count toward Characters (50%), not Monsters (25%). The book gives him no magic items and no General's post, so he still has no item picker and no General toggle. His Swarm of Sprites (p.76) hits with Strength 3 (the data said 4) and also attacks his close-combat opponent; the Spanish book calls them Duendes. Naieth (p.74) is "la Vidente" in Spanish (the English name is unchanged), is an Elfa Silvana wizard who uses Battle Magic only, and carries the "Báculo de los Augurios".

**Shown profiles (OLD-71, 2026-10-27).** Elfos Silvanos p.71 prints "Mastín de Caza 12 4 - 4 3 1 3 1 3". Orion now shows a Hunting Hound row (M 5", the book's "-" BS left blank) while he buys at least one hound. Display only: each hound still costs 5.

**Treemen are a regiment (OLD-73, 2026-10-28).** Elfos Silvanos p.66: the points spent on Treemen "también debe proceder de la proporción de esta sección de la lista de ejército, no de la sección de Monstruos". Elfos Silvanos p.68: "Un ejército puede incluir hasta un Hombre Árbol por cada 1.000 puntos del valor total en puntos del ejército. Por tanto, un ejército de 3.000 puntos podrá incluir hasta un máximo de tres Hombres Árbol, y uno de 5.000 puntos hasta cinco." The Treeman moves from Monsters to Regiments, the ceiling of 3 goes (the 3,000-point figure is only the book's example) and the tag reads "0-1 per 1,000 pts". The page adds "No es necesario organizar a los Hombres Árbol en unidades; pueden luchar como miniaturas independientes", so the entry has no minimum size and no command group, and the cap counts models, so a unit of three counts as three. The Treeman's 280 points and statline are unchanged.

#### Dark Elves and Undead: special characters' extra costs (OLD-63, 2026-10-26)
**Dark Elves, Elfos Oscuros (1995, ES) printed pp.56-63.** Each page lists a table of items with
`+N puntos` (the Manticore as `Mantícora 200 puntos`) under a headline that does not contain them.
Items in the pool are fixed at their card price, which matches every page; the mounts and the
chariot are `fixedExtras`. The Armour of Fortune (15), Enchanted Shield (5), Meteoric Iron Armour
(25), Black Amulet (50) and the other common cards match the pages.

| Character | Page | Table | Fixed items and extras | Bare entry |
|---|---|---|---|---|
| Witch King | p.56-57 | `+50 Corona de Hierro / +60 Armadura del Rey Brujo / +50 Escudo Antihechizos / +75 Destructora / +90 Carruaje Negro` | Iron Crown (new, 50), Armour of the Witch King (new, 60), Anti-Spell Shield, Destroyer (cards); Black Chariot 90 | 350 to 675 |
| Morathi | p.59 | `+15 Espada Oscura / +25 Amuleto Ámbar / +30 Pergamino de Energía / +25 Pergamino de Dispersión de Magia / +50 Pegaso Negro` | Dark Sword, Amber Amulet, Power Scroll, Dispel Scroll (cards); Black Pegasus Sulephet 50 | 327 to 472 |
| Hellebron | p.60-61 | `+100 Espada de Muerte / +20 Espada Defensora / +25 Amuleto del Fuego / Mantícora 200 puntos` | Sword of Death, Defender Sword, Amulet of Fire (cards); Manticore 200 | 207 to 552 |
| Rakarth | p.58 | `+25 Látigo de la Agonía / +15 Armadura de la Suerte / +5 Escudo Encantado / +450 Dragón Negro` | Whip of Agony, Armour of Fortune, Enchanted Shield (cards); Black Dragon Bracchus 450 | 134 to 629 |
| Kouran | p.60 | `+20 Espada de Hierro Encantado / +25 Armadura de Hierro Meteórico` | both cards | 105 to 150 |
| Tullaris | p.61-62 | `+50 Hacha de los Verdugos / +50 Amuleto Negro` | both cards | 123 to 223 |
| Shadowblade | p.62-63 | `+25 Corazón del Infortunio / +10 Poción de Fuerza` | both cards | 115 to 150 |

**Hellebron's unsigned 200.** p.60-61 prints "Mantícora 200 puntos" without the "+" the other rows
carry. It is read as an add-on: a 207-point entry cannot contain a 200-point monster, and the same
table shape (items below the headline) holds for every other character. Total 552.

**Hellebron's two weapons.** The Sword of Death and the Defender Sword are both weapons; the page
fixes both, so the one-per-category rule does not apply to them (it polices only the user's picks).

**Allowance above the rank.** Rakarth is a Hero (2 items) and his page fixes three; Shadowblade is
a Champion (1 item) and his page fixes two. Both set `magicItemSlots` to the page's number
(Rakarth 3, Shadowblade 2). Morathi and the Witch King fit their level-4 allowance of 4.

**Two new items.** The pool lacked the Iron Crown (p.56-57, arcane, 50, in the crown group) and the
Armour of the Witch King (p.56-57, armour, 60). Both are Dark Elf special-character items; their
Spanish text is the page's rules paragraph and the English text renders it.

**No Muertos (1995, ES) printed pp.86-95.** p.86 says "El valor en puntos del personaje no incluye el
coste de sus objetos mágicos". Vlad von Carstein, Heinrich Kemmler, Isabella and Manfred do not
change.

| Character | Page | Table | Fixed items and extras | Bare entry |
|---|---|---|---|---|
| Nagash | p.86-87 | `+35 Mortis / +100 Armadura Negra de Nagash / +100 Libro de Nagash / +40 Báculo del Poder` | Mortis, Black Armour, Book of Nagash, Staff of Power (cards) | 475 to 750 |
| Arkhan | p.91-92 | `+50 Báculo de Condenación / +50 Espada Funeraria de Arkhan / +25 Libro Maldito / +50 Carruaje de Arkhan` | Staff of Damnation, Funereal Sword of Arkhan, The Cursed Book (cards); Chariot of Arkhan 50 | 350 to 525 |
| Krell | p.92-93 | `+50 Armadura del Defensor / +125 Hacha Negra de Krell` | Armour of the Defender, Black Axe of Krell (cards) | 160 to 335 |
| Settra | p.94-95 | `+50 Báculo de Osiris / +75 Corona del Rey Funerario / +30 Flagelo de Cráneos` | Staff of Osiris, Flail of Skulls (cards); Crown of the Tomb King at 75 | 210 to 365 |
| Dieter Helsnicht | p.95 | `+65 Espada Rúnica del Caos / +50 Báculo Llameante de la Muerte / +200 Mantícora` | Rune Sword of Chaos, Flaming Staff of Death (cards); Manticore 200 | 410 to 725 |

**Settra's Crown at 75, the card at 50.** p.94 prints "+75 puntos de la Corona del Rey Funerario";
the Magia card list (p.38 and p.74) prints 50 for every other Tomb King. His page price is a
`points` override on his fixed item, so the card stays at 50. **User choice (owner ruling
2026-10-26).**

**The Armour of the Defender is in the common pool.** Krell's page (p.92-93) fixes it at 50. The
Magia card (p.36 and p.73) prints a dash in the restriction column, so no race restriction applies;
it moves from the Empire-only list to the common pool, so every army can take it. Owner decision
(2026-10-26).

**Item names that agree within one sheet (OLD-70, 2026-10-26).** No Muertos: Arkhan's chariot is
"Carruaje de Arkhan" in the extra (p.91), the profile row (p.91) and the rule heading "El Carruaje
de Arkhan" (p.92); the profile and the riding rule said "Carro" and "Chariot of Arkhan". Krell
(p.92) and Settra (p.94) now read "Fixed magic items" with the printed Spanish names (Armadura del
Defensor, Hacha Negra de Krell, Báculo de Osiris, Corona del Rey Funerario, Flagelo de Cráneos);
Settra's English tag said "Skull Flail" next to his locked row "Flail of Skulls". No values moved.

**Profiles corrected (OLD-67, 2026-10-26).** Undead (No Muertos): Vlad von Carstein (p.87) prints M15cm WS8 BS6 S7 T6 W4 I9 A4 Ld10, the data had a copy of Isabella's row for WS to I. The reference table (p.97) prints the same row for the Señor de Vampiros. Isabella von Carstein (p.88) prints A3, the data had A4. Dark Elves (Elfos Oscuros): Morathi (p.59) prints W4 A3, the data had W3 A2.

**Rule texts corrected (OLD-68, 2026-10-27).** No Muertos: Vlad (p.87) "normalmente lleva" the Anillo de los Carstein (+50) and the Espada de Energía Maldita (+75); the tag now uses the item cards' English names and the book's Spanish ones. Vlad, Isabella and Manfred (pp.87-88) may ride a "Corcel Esquelético (+2 puntos)"; the 1995 book never says Pesadilla. Their mount is labelled Skeletal Steed / Corcel Esquelético and keeps its internal id, so saved rosters keep the 2 points. The generic Undead vampires were not checked here; OLD-73 moved them to the Skeletal Steed too (pp.79-80).

**Skeletal Steed corrected (OLD-73, 2026-10-28).** No Muertos pp.59, 79 and 80 print "Corcel Esquelético 20 2 0 3 3 1 2 1 5" (20 cm = 8"): the Skeletal Steed goes from WS3 Ld4 to WS2 Ld5, which also reaches Skeletal Cavalry and the Undead Chariot team. The generic Vampire Lord and Vampire (pp.79 and 80, "Corcel Esquelético (+2 puntos)") ride that same steed, so the mount that kept the id `mount-nightmare` is now labelled Skeletal Steed and the two tags say "May ride a Skeletal Steed (+2)". "Pesadilla" is the 1999 Vampire Counts name and does not appear in this book. The bestiary (p.59) gives the steed no fear, so 'Causes fear' is removed. Saved rosters keep their price: the id and the +2 are unchanged.

#### Orcs & Goblins: special characters' extra costs (OLD-63, 2026-10-26)
**Orcs & Goblins, Orcos y Goblins (1997, ES) printed pp.90-93; chariot prices p.88.** Each page
lists its extras as `+N puntos` under a headline that excludes them. Items in the pool are fixed
at their card price, which matches every page (Crown of Sorcery 125, Morgor the Mutilator 125,
Elf-Biter 50, Skarsnik's Prodder 75).

| Character | Page | Table | Fixed items and extras | Bare entry |
|---|---|---|---|---|
| Azhag | p.90 | `+125 Corona de la Hechicería / +180 Serpiente Alada` | Crown of Sorcery (card); Winged Serpent 180 | 130 to 435 |
| Oglok | p.90 | none; mount "un carruaje tirado por Jabalíes de Guerra o por Lobos Gigantes" | none | 90 (155 in the Wolf Chariot) |
| Grom | p.91 | `+65 Niblit con Estandarte de Batalla / +62 Carruaje / +50 Hacha de Grom` | Elf-Biter, the Axe of Grom (card); Niblit 65; Wolf Chariot 62 | 80 to 257 |
| Gorbad | p.91 | `+125 Morgor la Mutiladora` | Morgor the Mutilator (card) | 120 to 245 |
| Gorfang | p.92 | none; same chariot mount as Oglok | none | 90 (155 in the Wolf Chariot) |
| Morglum | p.92 | none; same chariot mount as Oglok | none | 150 (215 in the Wolf Chariot) |
| Skarsnik | p.93 | `+75 Pincho de Skarsnik / +50 Gobbla`; "un carruaje tirado por Jabalíes de Guerra o Lobos Gigantes" | Skarsnik's Prodder (card); Gobbla 50 | 80 to 205 (286 in the Boar Chariot, 270 in the Wolf Chariot) |

**Chariot mounts.** Oglok, Gorfang and Morglum add the Wolf Chariot (65, p.88) to their War Boar,
monster and Boar Chariot (81, p.88) list through `ORC_SPECIAL_MOUNTS`; the generic Orc characters
keep `ORC_MOUNTS` and still cannot ride a Wolf Chariot. Skarsnik's list is the two chariots only
(he has no beast mount on p.93).

**Grom's retinue.** Niblit (+65, with the army Battle Standard) and the Wolf Chariot (+62) are
fixed extras because p.91 prices both and Grom always arrives with them.

**Gorbad's War Boar.** p.91 prints no cost for it, so it stays a display profile and adds nothing
to his 245.

**Rule text corrected (OLD-68, 2026-10-27).** Orcos y Goblins p.92: Gorfang Rotgut is equipped with light armour, a shield and "una enorme Espada"; the tag said magic sword, but his magic items are a free choice and are not named there.

**Shown profiles (OLD-71, 2026-10-27).** Orcos y Goblins p.91 prints "Niblit 10 3 4 4 3 1 3 2 5". Grom now shows a Niblit row (M 4"). Display only: Niblit stays a 65-point fixed extra. The same table prints the chariot and a Giant Wolf at "22 4 0 3 4 1 3 1 3", Toughness 4 where p.88 gives the Goblin Wolf Chariot's wolves Toughness 3; those two rows were held back until the owner chose Grom's page (OLD-73).

**Niblit's magic item (OLD-72, 2026-10-27).** Orcos y Goblins p.91 (Grom el Panzudo): "Niblit puede llevar un único objeto mágico, elegido de entre los presentados en Warhammer Magia." Niblit now has one item slot of his own beside Grom's three, picked from the same pool as any Orc character and priced at the card. Owner decisions: his restricted categories (one weapon, one armour, one ward and so on) and the one crown and one helm rule are counted apart from Grom's; the army-wide uniqueness rule is shared, so Grom and Niblit cannot carry the same item; and Niblit may carry a magic banner because he carries the army battle standard (FAQ v2.20 §23.2). No game value was added: the only figures are the one item and the standard-bearer role.

**Gorfang as General and Grom's chariot (OLD-73, 2026-10-28).** Orcos y Goblins p.92: "Puedes incluir a Gorfang Rotgut en tu ejército como un Gran Jefe o Señor de la Guerra Orco si lo deseas". He can now be the General; his page still prints "hasta dos objetos mágicos", so his allowance stays 2. The page also asks for at least one Orc unit, which the app does not check. Orcos y Goblins p.91 prints "Carruaje - - - 7 7 3 1 - -" and "Lobo Gigante 22 4 0 3 4 1 3 1 3" for Grom, who enters battle "en un carruaje tirado por tres Lobos Gigantes". Owner decision: Grom shows both rows with the wolf at Toughness 4 as his page prints it (M 22 cm = 9"), and the generic Giant Wolf stays at T3 (p.88). Display only: the chariot stays a 62-point fixed extra.

#### Bretonnia, Chaos, Norse, Vampire Counts and Dogs of War: special characters' extra costs (OLD-63, 2026-10-26)
**Three books print the headline as a total that already holds the items.** Bretonnia (1997, EN)
p.66: "Each character's points value is a total that includes equipment, mount, magic items".
Paladines del Caos (1998, ES) p.13: "se indica como un total, que incluye equipo, montura, objetos
mágicos", and p.21 for Mordrek: "Valor incluido en el total". Condes Vampiro (1999, ES) p.69: "El
valor en puntos indicado para cada personaje es su coste total (equipo, montura, objetos mágicos
...)". These characters keep their totals; their page items become fixed with `included: true`
(adds 0, cannot be bought a second time on top).

| Character | Page | Locked items (`included`) | Bare entry |
|---|---|---|---|
| Louen Leoncoeur | Bretonnia p.67 | Crown of Bretonnia; Armour of Brilliance = Magia's Armadura Brillante (75, same effect) | 505 to 505 |
| Baron Odo | Bretonnia p.69 | Morning Star of Fracasse = Magia's Flagelo de Fracasse (30) | 110 to 110 |
| Tancred | Bretonnia p.70 | Blade of Couronne | 265 to 265 (268 on the warhorse) |
| Armand d'Aquitaine | Bretonnia p.73-74 | Banner of the Lady of the Lake | 235 to 235 |
| Count Mordrek | Paladines del Caos pp.20-21 | Sword of Transformation; Chaos Runeshield | 398 to 398 |
| Dieter Helsnicht | Condes Vampiro p.70 | Flaming Staff of Death; Chaos Runic Sword | 690 to 690 |
| Heinrich Kemmler | Condes Vampiro p.71 | Chaos Funerary Sword; Skull Staff | 450 to 450 |
| Krell | Condes Vampiro p.72 | Black Axe of Krell; Armour of the Defender (`magicItemSlots: 2`) | 280 to 280 |
| Vlad von Carstein | Condes Vampiro p.78 | Ring of the von Carsteins | 680 to 680 |

**Tancred's mount.** p.70: "The Duke may ride a barded Bretonnian Warhorse (+3 points) or a monster
chosen from the Monsters List at the appropriate points cost." He now has the Knight mount list
(warhorse 3, monsters at their list price).

**Dieter's tag.** The Vampire Counts tag listed the Skull Staff, which is Kemmler's (p.71). Dieter's
p.70 table prints the Báculo Llameante de la Muerte (50), Espada Rúnica del Caos (65) and Pergamino
de Energía (30); the tag now names the Flaming Staff of Death. The Power Scroll (30) is inside his
690 and locked as included (owner decision 2026-10-26), so he carries three items against an
allowance of four.

**Krell's slots.** p.72 gives him two magic items; a champion's rank allows one, so
`magicItemSlots: 2` holds both.

**Norsca (1994, EN), by PDF index.** The pages print the headline without the items.

| Character | PDF | Page prints | Data | Bare entry |
|---|---|---|---|---|
| Keorl Thunderhand | 34 | "130 points (+125 Dragon Slayer, +30 Thorim's Ring)" | 130 + Dragon Slayer (the common Matadragones, same effect, 125) + Thorim's Ring (30), both fixed at card price | 285 to 285 |
| Stürmjarl | 32 | "316 points (+100 Gift of Loki, +30 Runes)" | 316 + Gift of Loki (page price 100) + Runes (page price 30) | 446 to 446 |

**Stürmjarl's two prices.** The magic-item card sheet (PDF 35) prints Gift of Loki 50 and Runes 75,
so the book disagrees with itself (130 on the character page, 125 on the cards). The data keeps
the page prices by default and offers one checkbox, "Item-card prices (Gift of Loki 50, Runes
75)", which gives 441. **user choice (owner ruling 2026-10-26)**. Since OLD-70 the two locked rows
show the card prices (50 and 75) while the box is ticked and the option itself costs 0, so the
sheet reads 316 + 50 + 75 and the total stays 441; unticked it is 446. Integrity still accepts a
negative option price only on a flat option, and now checks that a fixed item's `pointsOptionId`
names an option of the unit.

**Item names that agree within one sheet (OLD-70, 2026-10-26).** Bretonnia (English, printed p.67):
the book prints "The Armour of Brilliance" for Louen's armour, so the item's English name is now
that (it was "Shining Armour", a name no book prints); the Spanish name stays Magia's "Armadura
Brillante", and Louen's Spanish tag now reads "Corona de Bretonia, Armadura Brillante". Chaos
(Paladines del Caos printed p.21): Mordrek's sword is "Espada de la Transformación", so his tags
say Sword of Transformation (they said Sword of Change / Espada del Cambio), and the reward is
"Condenación Eterna" in Spanish (the data had "Condena Eterna", in the tag and in the rule line).
Item ids are unchanged, so saved rosters are unaffected.

**Dogs of War (1998, EN) pp.64-67.**

| Character | Page | Change | Bare entry |
|---|---|---|---|
| Mydas the Mean | p.64-65 | "between 5 and 20 bodyguards ... Each extra bodyguard after the first five costs 12 points": counted option, 12 each, up to 15. "a standard bearer and musician at double the points cost of a normal trooper": 2 × 12 = 24 each, flat | 210 to 210 (270 with 5 extra; +24 for each of standard and musician) |
| Marco Colombo | p.67 | "Marco Colombo carries three magic items ... Gem of Lustria, Gourd of Lustrian Wine and Scroll of Araby"; the Navigator's Telescope is under Special Rules, so it moved out of the magic-items tag | 176 to 176 |

**Profiles corrected (OLD-67, 2026-10-26).** Bretonnia (Bretonia, English, inches): Armand d'Aquitaine (p.73) prints T3 W1, the data had T4 W3. Suliman le Saracen, Odo's retainer (p.69), prints T3, and Jules le Jongleur, Tristan's retainer (p.72), prints WS3; both live only in the "Accompanied by" rule text, so the English line and its Spanish key in `RULE_PHRASE_ES` changed together. Vampire Counts (Condes Vampiro): Krell (p.72) prints I5, the data had I3. Isabela von Carstein (p.78) prints BS4, the data had BS5. Chaos (Paladines del Caos): Gorthor's two Tuskgors (p.44) print W2 I2 Ld3, the data had W1 I3 Ld7, and the Reino del Caos bestiary (p.78) prints the same row. Mordrek's Corcel del Caos (p.20) prints WS4 I4, the data had WS3 I3. Gorthor's own row and his Tuskgors' M7 are unchanged.

**Rule texts corrected (OLD-68, 2026-10-27).** Norse (Norsca, printed p.20): Erik Redaxe's Invocation of Thor lasts the turn it is invoked and the next, strikes one chosen enemy unit (not two) with D6 S4 hits at the start of each of those turns, and only magic armour saves against it. Chaos (Paladines del Caos p.34): Scyla's Señor is any character named for the role, with no Khorne requirement, and Scyla follows the Chaos Spawn rules (same profile) if his Señor dies or leaves the battlefield. Dogs of War (p.64): Lucrezzia's Stunning Beauty only rallies friendly fleeing units within 6" of her at the start of her turn; the opponents' lost attack is not in the book.

**Magic item limits (OLD-69, 2026-10-27).** Paladines del Caos p.21: Count Mordrek has three items, the Sword of Transformation, the Chaos Runeshield and the Reward Eternal Damnation, and "no puede poseer otros". The Reward is not an item card, so his allowance moves from 3 to 2 and he may buy nothing. Arbaal (p.29) has two Rewards and no other item (3 to 0). Egrimm van Horstmann (p.33) has the Rune Sword, the Chaos Familiar, the Skull of Katam and a Reward, all inside his 521, and no others (4 to 0). Khazrak (p.43) has one item, the Scourge, and no other (3 to 0). Dogs of War (Mercenarios p.65): Mydas the Mean has a single item, the Treasure Map, inside his 210, and may be given no more. The map is not an item card, so his allowance moves from 1 to 0, which also stops a Battle Standard Bearer Mydas from buying a banner.

**Unit and option costs (OLD-71, 2026-10-27).** Each cost a page charges to a unit or to an option is now bought in the app, priced where the book says it is paid from.

| Character | Page | Book | Data |
|---|---|---|---|
| Archaon | Paladines del Caos p.17 | One regiment of Chaos Warriors or Chaos Knights of his host may be the Swords of Chaos, "+2 puntos por miniatura si es un Guerrero del Caos, y +4 puntos por miniatura si es un Caballero del Caos"; they hate all enemies | Regiments `ch-swords-of-chaos-warriors` (24 + 2 = 26 a model) and `ch-swords-of-chaos-knights` (66 + 4 = 70), same kit and options as the plain regiments; at most one of the two (`unitGroupCaps`), only with Archaon (`dependencies`). 10 Warriors cost 260, 5 Knights 350, in Regiments |
| Khazrak | Paladines del Caos p.42 | His host "ha de incluir como mínimo una unidad de Mastines del Caos, cuyo valor en puntos será de 10 puntos por miniatura" | Regiment `ch-khazrak-hounds`, 10 a model, 0-1, no command group; it needs Khazrak and Khazrak needs it (owner decision on the issue: one unit). The Beastman-host and Warrior-host hounds stay at 12 |
| Bertrand | Bretonnia p.71 | 83 points "+1 extra point per Bowman in the regiment", paid "from the allowance for regiments"; the Bowmen of Bergerac never wear armour and take a standard bearer and musician in the normal way | Regiment `br-bowmen-of-bergerac`, 8 + 1 = 9 a model, no armour option, 0-1, command group at double a model (18); it needs Bertrand and Bertrand needs it. Bertrand stays 83 in Characters; 10 Bowmen cost 90 in Regiments |
| Paymaster | Mercenarios p.28 | Money Lender "+25 points"; "between 5 and 20 bodyguards ... Each bodyguard costs 12 points"; shields "+1 point per model"; standard bearer and musician "each costing double the points of a normal trooper" | Options on `dow-paymaster`, all in Characters (owner decision on the issue, Mydas's pattern): Money Lender 25, Bodyguard (5 models) 60, extra bodyguards 12 each up to 15, bodyguard shields 1 each up to 20, standard bearer and musician 24 each (26 with shields, OLD-73). 125 to 462 with everything |

The unused generic `BSB_UPGRADE` (+25, id `bsb`) left `src/data/unitOptions.ts`: no unit used it since the first commit, and each book prints its own Battle Standard price.

**Page requirements and shown profiles (OLD-71, 2026-10-27).** Paladines del Caos p.16: "Si un ejército incluye a Archaon éste será su General". Archaon now carries `mustBeGeneral`, and an Archaon entry that is not the General raises the `must-be-general` error. Bretonnia p.71 prints "Hugo le Petit 4 3 4 5 4 1 3 1 7" and "Gui le Gros 4 3 4 3 3 1 3 1 7"; Bertrand now shows both as fixed rows, display only.

**Paymaster's bodyguard command group (OLD-73, 2026-10-28).** Mercenarios printed p.28 (PDF 30): "Each bodyguard costs 12 points and is equipped with a halberd and light armour. They may have shields at an additional cost of +1 point per model. The unit may have a regimental standard bearer and/or musician, each costing double the points of a normal trooper." A shielded trooper costs 13, so the standard bearer and the musician each cost 24 without shields and 26 with them; the price follows the shield choice (`timesTrooperCost`) and any shield bought counts as shielded, since the book says nothing about a part-shielded unit. The standard bearer, the musician, the shields and the extra bodyguards need the bodyguard retinue (`requiresOptionId`, warning `option-requires-option`). Mydas (printed p.65, PDF 67): "The bodyguard may include a standard bearer and musician at double the points cost of a normal trooper"; his trooper costs 12 and the page offers no shields, so his 24 stays. His 210 already includes five bodyguards, so his options need no retinue option. An option that costs nothing now shows no "(+0)" in the editor and the export.

**Profiles corrected (OLD-73, 2026-10-28).** Reino del Caos p.78 and p.109 print "Tuskgor 18 3 0 4 4 2 2 1 3" (18 cm = 7"): the Beastman Chariot's Tuskgors go from W1 I3 Ld7 to W2 I2 Ld3, the row Gorthor's own Tuskgors already carried. Reino del Caos p.76 and p.103 print "Corcel del Caos 20 4 0 4 4 1 4 1 5": the Chaos Steed goes from WS3 I3 to WS4 I4, which reaches every Chaos character mount, both Chaos Knight regiments and the Chaos Chariot team, and agrees with Mordrek's steed. Condes Vampiro p.58 and p.62 print "Pesadilla 20 2 0 3 3 1 2 1 5": the Nightmare goes from WS3 Ld4 to WS2 Ld5. Manfred's own page (p.73) prints Ld4 for his Nightmare; the owner chose Ld5 for every Nightmare, so his steed follows. The Hellsteed prints no row of its own, so it follows the Nightmare it is built on. No points changed.

**Characters who must be the General (OLD-73, 2026-10-28).** Paladines del Caos p.44: "Si se incluye a Gorthor siempre será el General." Norsca PDF 34: "If you decide to do this, Keorl Thunderhand is the general of your army and therefore replaces the general described in the main army list." Both now carry `mustBeGeneral`, as Archaon does (owner decision; Keorl's wording is softer than Gorthor's "siempre"). Manfred von Carstein stays optional: Vampire Counts p.73 "aunque no es obligatorio", Undead p.88 "pero no es obligatorio".

#### High Elves: special characters' extra costs (OLD-63, 2026-10-26)
**Altos Elfos (1997, ES) printed pp.81-94.** Each character's page prints the headline in its title
and a price beside every item, and never says whether the headline holds the items. The owner
ruled on 2026-10-26 that the player decides: each character below has a flat option
`items-on-top` ("Items not included in the headline cost"), unticked by default. Unticked, the
total is the printed headline, as before. Ticked, it adds the sum of the page's items.
**User choice (owner ruling 2026-10-26)**, not a book value.

| Character | Page | Items on the page | Sum | Default to ticked |
|---|---|---|---|---|
| Alith Anar | p.82 | Piedra de Medianoche 50, Corona Sombría 15, Arco Lunar 50 | 115 | 285 to 400 |
| Eltharion | p.83 | Espada Colmillo 50, Yelmo de Yvresse 10, Talismán de Hoeth 85 | 145 | 467 to 612 |
| Belannaer | p.89 | Capa de Estrellas 45, Espada de Bel-Korhadris 60, Libro del Fénix 75, Báculo de Cyeos 25 | 205 | 555 to 760 |
| Korhil | p.91 | Hacha Chayal 65, Piel de Charandis 10 | 75 | 198 to 273 |
| Tyrion | p.92 | Colmillo Solar 125, Armadura del Dragón de Aenarion 75, Corazón de Avelorn 50 | 250 | 425 to 675 |
| Teclis | p.93 | Báculo Lunar 20, Corona de Guerra de Saphery 125, Espada de Teclis 100, Pergamino de Hoeth 55 | 300 | 630 to 930 |
| Imrik | p.94 | Lanza Estelar 60, Cuerno del Dragón 15, Armadura de Caledor 30 | 105 | 275 to 380 (plus his dragon) |

Four items the pool also sells are now `fixedMagicItems` with `included: true` (owner approval,
2026-10-26): Talisman of Hoeth on Eltharion (card 85), War Crown of Saphery and Sword of Teclis on
Teclis (cards 125 and 100) and Star Lance on Imrik (card 60). Each page price equals its card
price. They are locked in the editor and add 0 on their own, because the option carries their
price when ticked, so no reading charges them twice or lets a second pick buy them again. The
other items on these pages are not in the pool and stay as text and option sum only. Alarielle
(p.84) does not change: her page states that the headline includes her items.

**Rule texts corrected (OLD-68, 2026-10-27).** Altos Elfos: Tyrion (p.92) has an armour save of 1+ with the Armadura del Dragón de Aenarion when mounted on Malhandir (Warhammer Magia p.47 adds 3+ on foot), cannot use a shield, and has a 4+ special save if the armour save fails. The save belongs to Tyrion's armour; Malhandir only wears the barding, so the old "barding, 2+ save" wording moved to Tyrion's tag and Malhandir's tag now says Tyrion saves on 1+ when mounted. The armour stays at 75 points as on his page (the Magia card prints 70). Alith Anar (p.82) fights on foot: he is a skirmisher leader (a High Elf infantry unit he leads may skirmish) with a special deployment after the enemy, which the unit he joins does not gain; the tag called him fast cavalry.

**Magic item limits (OLD-69, 2026-10-27).** Altos Elfos p.82: Alith Anar always carries the Stone of Midnight, the Shadow Crown and the Moonbow, and "No puede poseer otros objetos mágicos". Alarielle (p.87, Objetos Mágicos) has the Star of Avelorn, the Jewel Shield of Isha and the Sceptre of Avelorn, and "no puede poseer ningún otro objeto mágico". None of their items is a pool card, so their allowance moves from 3 and 4 to 0 and they may buy nothing.

**Required mount (OLD-71, 2026-10-27).** Altos Elfos p.94: "Imrik siempre monta un Dragón", at +450 (Dragón), +600 (Gran Dragón) or +750 (Dragón Emperador). Imrik now carries `mountRequired`: a new entry starts on the Dragon, the mount selector has no "on foot" choice, and a saved roster with Imrik on foot raises the `mount-required` warning. The data comment cited p.86; the page is p.94.

#### Lizardmen: special characters' extra costs (OLD-63, 2026-10-26)
**Warhammer Armies: Lizardmen (1997, EN) printed pp.79-89.** Same case as the High Elves: each
page prints a cost beside a headline and a price beside every item, and does not say whether the
headline includes them. Each character below has the flat option `items-on-top`, unticked by
default. **User choice (owner ruling 2026-10-26)**, not a book value.

| Character | Page | Items on the page | Sum | Default to ticked |
|---|---|---|---|---|
| Venerable Lord Kroak | pp.79-80 | Standard of the Sacred Serpent 25, Gold Death Mask 50, Ceremonial Mace of Malachite 50, Amulet of Itza 25, Glyph of Potec 20 | 170 | 620 to 790 |
| Itzi-Bitzi | p.85 | Piranha Blade 35 | 35 | 105 to 140 |
| Tenehuini | p.86 | Dagger of Sotek 50, Totem of Sotek 10 | 60 | 120 to 180 |
| Lord Mazdamundi | p.89 | Cobra Mace of Mazdamundi 15, Plaque of Tepec 50, Plaque of Xoloc 50, Itxi Grubs 50, Egg of the Quango 10, Sunburst Standard of Hexoatl 50 | 225 | 900 to 1125 |

The Dagger of Sotek (card 50) is the one pool item among them: it is now a locked fixed item of
Tenehuini with `included: true` (owner approval, 2026-10-26), so it cannot be bought a second time.

**Profile corrected (OLD-67, 2026-10-26).** Oxayotl (Hombres Lagarto p.83): the printed Toughness is 4, the data had 3. The rest of his row (M6 WS4 BS5 S4 W3 I7 A3 Ld7) was right.

**Rule text corrected (OLD-68, 2026-10-27).** Hombres Lagarto (English, p.85): Itzi-Bitzi carries a single magic item, the Piranha Blade, so the tag no longer says "no magic items". The Spanish tag calls it Hoja Piraña; the Piranha Blade has no item card of its own.

**Magic item limit (OLD-69, 2026-10-27).** Lizardmen (English, p.85): Itzi-Bitzi carries one magic item, always the Piranha Blade, which has no item card. His allowance moves from a hero's 2 to 0 and he may buy nothing.

**Battle Standard Bearer (OLD-73, 2026-10-28).** Hombres Lagarto (English) printed p.73, 1 Slann General: "General may have Battle Standard ... +50 points" and "Your Lizardman army may have a Battle Standard (+50 points). If it does, the Battle Standard will be attached to the General's palanquin. The Battle Standard may be a magical standard. If so, it will not count as one of the General's magic items." The Slann now has `canBeBSB` and `bsbPoints: 50` (115 to 165), on Ludwig's pattern. A magic banner he picks while he is both the army General and the Battle Standard Bearer does not use one of his item slots (`bsbBannerFree`); it still pays its card price, counts toward army uniqueness and the one-banner limit.

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
