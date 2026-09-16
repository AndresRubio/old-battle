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
  slip. Not modelled: `og-grom` carries no wolf profile (he takes the Wolf Chariot as a special
  rule), and the generic `GIANT_WOLF_STATS` must stay at the book's T3. Recorded here so a future
  pass does not "fix" the transcription. Linear OLD-20.
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
