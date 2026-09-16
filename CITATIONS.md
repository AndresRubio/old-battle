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
- **OPEN — the Fanatic's Attacks contradict between two pages of its own book.** The bestiary row
  (printed **p.66**) prints **1D3**; the army list (printed **p.85** = PDF 87) prints **1D6**. Both
  were read at 400dpi and both are legible, so this is the book disagreeing with itself rather than
  a bad scan. Choosing between them is a game-value judgement and **it has not been made**: the
  owner's ruling is that bestiary-vs-army-list conflicts are settled **case by case, with no blanket
  precedent**, and this case is still open. Tracked as OLD-45.

  What the column shows meanwhile is `statNotes.A = '?'`. The old `A: 1` was **wrong under both
  readings** — the one thing the book is unambiguous about is that the cell is a dice roll — so
  leaving it would have kept exactly the confident-but-false number OLD-43 exists to remove. `?`
  asserts nothing the book does not say and is deliberately distinct from the `–` used for the
  columns the book really does leave blank. A test pins it so that picking a side later has to come
  through that test.

  **Precedent note:** `source/OFFSETS.md` records the opposite outcome for **Norsca** (*"la lista de
  ejército corrige al bestiario — gana la lista"*). That note stays scoped to Norsca and must **not**
  be generalised; per the ruling above it is one case's answer, not a rule.
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
`source/OFFSETS.md` (OLD-43) and to the still-open Orc & Goblin Fanatic Attacks (OLD-45), which was
deliberately left at `?` rather than being decided alongside this one.

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
