# FAQ Rules-Fidelity Pass — Design Spec

**Date:** 2026-06-24
**Status:** Design — ready for plan
**Source:** `research/faq-1996-v2.20.txt` (official WFB FAQ v2.20, June 1996; reviewed by
Jervis Johnson, Andy Chambers, Rick Priestly).

## Context & edition caveat

The FAQ self-describes as covering the **4th-edition** boxed set + its army books. "Old Battle"
targets **5th edition (1996)**. Structural rules (who may carry what, dependencies, item
duplicability, item slots) are stable across the two; **points-cost corrections are NOT** assumed to
carry over and must be verified against the 5th-ed army books before any data change.

This pass extends the existing pure rules engine (`src/rules/validate.ts`) and army/item data. It
reuses the established patterns: `selectionRules.dependencies`, the `duplicable` flag, restricted
magic-item categories, and bilingual inline messages (no new i18n keys). It does **not** simulate
tabletop play.

## Out of scope (explicitly excluded)

- **~110 tabletop-mechanics Q&As** (line of sight, movement, shooting, combat, psychology, spell
  effects, victory points). A list-builder does not model these.
- **House Rules** the FAQ itself flags as non-official (e.g. banning Ogre/Halfling characters in
  Empire & O&G, suggested ally limits, fire-and-flee rulings).
- **Runic-system redesign** (FAQ §26.4/27.5 "a runic item counts as one magic item regardless of
  rune count"). Today each Dwarf rune is an individual `MagicItem` and the allowance counts each as
  one. Honoring this correctly means modeling rune *combinations* per item — a deep, Dwarf-specific
  change. Deferred to its own future spec; called out here so it is not forgotten.

## Phases

### Phase 1 — Expand the `duplicable` set (data only, low risk)

FAQ §19.3: the following are exceptions to army-wide magic-item uniqueness ("unlimited"): Dispel
Scroll, **Power Scroll**, **Destroy/Magic-Destruction Scroll**, **Healing Potion**, **Strength
Potion**, **Runefang**, and (Dwarf) **Rune of Stone**. All *other* scrolls (Warp Scroll, Warp Storm
Scroll, etc.) remain limited to 1.

Items already present but missing the flag: `mi-power-scroll`, `mi-scroll-of-magic-destruction`,
`mi-healing-potion`, `mi-potion-of-strength`, `mi-runefang`, `mi-rune-of-stone`.

- **Change:** add `duplicable: true` to those six items in `src/data/magicItems.ts`.
- **Test:** extend `armies.test.ts` "marks exactly the documented exceptions as duplicable" (or a
  new focused test) to assert the new duplicable set; add a `validate.test.ts` case proving two
  Power Scrolls produce **no** `magic-items-unique` error while two Warp Scrolls still do.

### Phase 2 — Magic banners require a Battle Standard Bearer (validation)

FAQ §23.2: only a Battle Standard Bearer may take a magic banner. The engine has the `banner`
category but never checks the bearer is a BSB.

- **Model:** a character entry "is a BSB" when `entry.isBSB === true` **or** `entry.optionIds`
  includes the `bsb` option (`BSB_UPGRADE.id`). Some armies have inherently-BSB units (`unit.isBSB`).
- **Change (`validate.ts`):** in the per-entry magic-item block, if the entry carries any item of
  `category: 'banner'` and the entry is not a BSB, push a `warning` `rule: 'magic-items-banner-bsb'`
  with a bilingual inline message ("only a Battle Standard Bearer may carry a magic standard" /
  "sólo el Portaestandarte de Batalla puede portar un estandarte mágico").
- **Test:** banner on a non-BSB character → warning; same banner on a BSB (via `isBSB` and via the
  `bsb` option) → no warning.

### Phase 3 — Crown/Helm mutual exclusivity (model + validation)

FAQ §19.5: a character may not wear two crowns or two helms; one crown + one helm is allowed.
Named items: **Crowns** — War Crown of Saphery, Crown of Sorcery, Dragon Crown of Karaz, Crown of
Command, Tomb King's Crown. **Helms** — Dragonhelm, Golden Helm of Atrazar, Helm of Many Eyes.

- **Model:** add optional `exclusiveGroup?: 'crown' | 'helm'` to `MagicItem` (`types.ts`). Tag the
  matching items in `magicItems.ts` (resolve exact ids; note the data has both real matches and
  similarly-named non-matches like "Crown of Power"/"Crown of Bretonnia" — tag ONLY the FAQ-listed
  items, verifying each by description).
- **Change (`validate.ts`):** per character, count items by `exclusiveGroup`; if any group > 1, push
  a `warning` `rule: 'magic-items-exclusive-group'` (bilingual: "a character may carry only one
  crown/helm" / "un personaje sólo puede llevar una corona/un yelmo").
- **Test:** two crowns → warning; one crown + one helm → no warning.

### Phase 4 — Per-army dependencies & equipment bans (data, existing engine)

All of these fit the existing `selectionRules.dependencies` (unit requires unit) or are command-group
data tweaks. Each gets a behavioral test in `validate.test.ts` and a survive-assembly assertion in
`armies.test.ts`.

- **Empire** §28.5: Ice/Kislev Mages require a Kislev unit present → `dependencies` on the Ice-Mage
  unit, `requiresAnyOf` = Kislev unit ids. (Mirror of the existing Tzarina dependency.)
- **Skaven** §35.1: Thanquol requires Boneripper → dependency. §35.3: Assassins require a Gutter
  Runner unit present (engine has no unit-within-unit concept; "present in army" is the documented
  approximation) → dependency.
- **Undead** §36.5: Wight/Wraith champions may only lead Skeletons/Zombies/Ghouls — model as the
  relevant champion units depending on one of those core unit ids being present.
- **Dark Elves** §33.5: Assassins require one of the listed host units present → dependency.
- **O&G** §34.2: Goblin Wolf Riders count as a goblin mob for Doom Diver eligibility → add the Wolf
  Rider id to the existing Doom Diver dependency's `requiresAnyOf` (already partially present — verify).
- **Champion bans** (§28.7 Outriders/Flagellants, §35.6 Gutter Runners): suppress the auto command
  group via `noCommand`/the existing command-group mechanism in data — verify current behavior first.

### Phase 5 — Deferred / needs-decision (documented, not built this pass)

- **Chaos daemons require a same-god character** (§31.4/31.7): RESOLVED 2026-06-24 — extended the
  dependency engine with `requiresOption` (satisfied if any CHARACTER entry bears that god's Mark
  option) + `requiresLabel` for the message. Wired 14 daemon deps in chaos.ts (fixed-god chars in
  `requiresAnyOf`, the Mark in `requiresOption`). The generic `ch-daemon-bsb` is not a satisfier.
  Historical note (why it was hard): **not modelable with the id-only engine alone** — The generic Chaos characters
  (Lord/Hero/Champion/Sorcerer/BSB/Daemon Prince) carry their god as a *selectable Mark option*, not
  as a fixed unit property, and `ch-daemon-bsb` is one merged entry for all four gods. Since the
  dependency check sees only unit ids (not the chosen Mark), any id-only wiring is either too lenient
  (a Slaanesh-marked Lord wrongly satisfies a Khorne daemon) or too strict (a Khorne-marked Lord
  false-warns). Correct modeling needs an **option/Mark-aware dependency** (inspect each entry's
  chosen Mark) — an engine extension. Deferred until that extension is decided.
- **Skaven Ikit Claw must be the General** (§35.1) and the **25%-war-machines-when-Ikit** rule: needs
  a conditional ("if unit X is in the list, then …") predicate the engine lacks (same family as the
  previously-deferred conditional-caps work).
- **Magic shield as a slot separate from armour** (§19.1): today every magic shield is
  `category: 'armour'`, so the engine wrongly blocks armour+shield combos. Fixing means a new
  `shield` category + recategorizing many items + equipment-combination review. Invasive — own phase.
- **Points corrections** (§33.7.3 Blood Banner 10, §33.8 Sea Dragon Cloak 5, §31.9 Daemonette on
  Steed 25): apply ONLY after verifying against the 5th-ed army books (edition caveat).

## Verification gate (every phase)

`npx tsc --noEmit -p tsconfig.app.json && npm test` green, plus live UI spot-check in the Vite
preview for any rule that surfaces in the Muster Check. Append a PROGRESS.md line per phase.
</content>
