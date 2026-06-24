# PROGRESS — Warhammer 5e Army Builder

This file is the loop's memory. Each iteration: read this, do the **next unchecked task**,
verify it, then check it off and add notes. Keep entries terse. Newest notes at the bottom of LOG.

## Current status
- Phase: 6 COMPLETE — **PROJECT DONE**. Definition of Done fully met (see DoD checklist in Phase 6 below). Completion promise output iteration 15.
- Last iteration did: Wrote README.md; smoke-tested all 3 armies live (Empire / Orcs & Goblins 530pts / High Elves 515pts — all load, add units, validate correctly with per-army rosters & pickers); final npm test (49 green) + npm run build (clean).
- Next up: (nothing — complete). If reopened, possible extensions: more armies (Dwarfs, Skaven, Undead...), per-army magic items, exact army-book points if a source appears.
- KEY FACTS: Characters <=50%, Regiments >=25%, WarMachines+Monsters+Allies <=25%, must have a General. Magic items limited by COUNT per character rank (Champion/Wizard L1=1, Hero/WizardL2=2, Lord/MasterWizardL3=3, WizardLord L4=4, BSB=1), max 1 per restricted category. Sources: https://5th.whfb.app/.

## Task checklist (work top to bottom; break big ones into sub-steps as you go)

### Phase 1 — Research (use WebSearch/WebFetch; record findings in `research/`)
- [x] Research exact WFB 5th ed (1996) army composition rules: character % cap, min core/regiments %,
      Lords/Wizards/Heroes brackets by points size, monster/warmachine limits. Save to `research/composition-5e.md` with source URLs. DONE.
- [x] Research magic item points allowances per character type in 5th ed. Save to `research/magic-items-5e.md`. DONE (5th ed limits by item COUNT, not points).
- [x] Research Empire army list (units, points, stat lines, options) for 5th ed. Save to `research/army-empire.md`. DONE (period-accurate representative data; exact army-book points unavailable free, flagged APPROX).
- [x] Research Orcs & Goblins army list for 5th ed. Save to `research/army-orcs-goblins.md`. DONE (representative data + special rules: Animosity, Fanatics, Black Orc immunity).
- [x] Research High Elves army list for 5th ed. Save to `research/army-high-elves.md`. DONE.
- [x] Compile all source URLs into `CITATIONS.md`. DONE (with honest data-accuracy note).

### Phase 2 — Scaffold
- [x] Init Vite React+TS project in repo root (package.json, src/, etc.). `npm install`. DONE (vite 6, react 18).
- [x] Set up Vitest. Add `npm test` script. One trivial passing test to prove the harness. DONE (vitest 3; smoke.test.ts passes).
- [x] Commit-quality structure: src/data/, src/rules/, src/components/, src/state/. DONE.

### Phase 3 — Data model + rules engine (TDD)
- [x] Define TS types for Army, UnitProfile, Roster, RuleViolation in src/data/types.ts. DONE (+ MAGIC_ITEM_ALLOWANCE, RESTRICTED_CATEGORIES, STANDARD_5E_COMPOSITION).
- [x] Write failing tests for validateRoster covering: over points, character >50%, min core,
      magic-item allowance, 0-1 limits. Then implement src/rules/validate.ts to pass them. DONE — 18 validate tests + smoke, all green. Also src/rules/points.ts (entryPoints/pointsByRole/allowance).

### Phase 4 — Army data
- [x] Encode Empire army data from research into src/data/armies/empire.ts. DONE. Also src/data/magicItems.ts (COMMON_MAGIC_ITEMS), src/data/unitOptions.ts (wizard levels/BSB/shield), src/data/armies/index.ts (ARMIES/getArmy). Data-integrity tests added (25 tests green).
- [x] Encode Orcs & Goblins into src/data/armies/orcsGoblins.ts. DONE, registered in index. 30 tests green, build clean.
- [x] Encode High Elves into src/data/armies/highElves.ts. DONE, registered. 35 tests green, build clean. PHASE 4 COMPLETE (3 armies).

### Phase 5 — UI
- [x] State layer: src/state/rosterOps.ts (pure roster transforms), storage.ts (localStorage CRUD), useRosters.ts (hook). 46 tests green incl. 11 rosterOps + storage tests. DONE.
- [x] Home screen: list saved rosters + New List. DONE (src/components/Home.tsx, empty state, delete with confirm).
- [x] New-list flow: choose army + name + points limit. DONE (src/components/NewList.tsx, points presets). App.tsx router (home/new/editor) + themed CSS + summary.ts helper (+test). Editor is a stub for now. 47 tests green, build clean, dev server serves OK.
- [x] Editor: roster summary + running points + live warnings; unit picker by category. DONE + VISUALLY VERIFIED via preview (Editor.tsx, SummaryPanel.tsx, UnitPicker.tsx, EntryRow.tsx, labels.ts).
- [x] Unit options: size, equipment, magic items for characters; live points recompute. DONE & verified (statline, BSB option, wizard levels, magic items with N/allowance count, size stepper, set-General).
- [x] localStorage save/load of rosters. DONE & verified (seeded roster persisted across reload; Home shows it; editor edits auto-save). No console errors.
- [x] Export/print roster as text. DONE & verified live (src/rules/exportText.ts + test, ExportDialog.tsx w/ Copy + Print, print stylesheet). Dialog shows clean plaintext list.
- [x] Polish: consistent theme, responsive layout, no console errors. DONE. Verified mobile (375px): single-column layout holds, summary stacks on top, army list readable, NO horizontal page overflow (docScrollWidth==viewport). No console errors. Theme consistent throughout. PHASE 5 COMPLETE.

### Phase 6 — Finish
- [x] README.md with run instructions. DONE (features, 5e rules table, run/use/architecture, disclaimer).
- [x] Final check: `npm run build` clean, `npm test` green, manual smoke test of 3 armies. DONE — 49 tests green; build clean; verified Empire, Orcs & Goblins (530pts) AND High Elves (515pts) all load + add units + validate live in the UI with correct per-army rosters/pickers/warnings.
- [x] When ALL above checked AND definition-of-done in SPEC.md met, output the completion promise. DoD ALL MET (see below) -> promise output iter 15.

## DEFINITION OF DONE — all verified TRUE:
- [x] npm install && npm run build succeeds, no errors.
- [x] npm test passes (49 tests) incl. 18 rules-engine tests covering all main 5e composition rules.
- [x] 3 armies fully playable end-to-end in the UI (Empire, Orcs & Goblins, High Elves) — verified live.
- [x] Live validation warnings work (over points, char 50% cap, min 25% core, warmachine cap, magic-item allowance, 0-1 limits, general) — verified live + unit-tested.
- [x] Save/load via localStorage works — verified (persisted across reload, multiple armies).
- [x] README + CITATIONS present.
- [x] App polished (consistent parchment/gold theme, responsive desktop+mobile, no console errors) — verified via preview.

## LOG (append one short line per iteration: what changed, what's verified)
- Iter 1: Wrote research/composition-5e.md + research/magic-items-5e.md from https://5th.whfb.app/. Locked core composition (50/25/25 + General) and magic-item count limits. Verified by reading multiple FAQ/rules pages. Next: army lists.
- Iter 2: Wrote research/army-empire.md (characters/core/special/rare, statlines, period points). Established sourcing approach (representative + flagged, since exact army-book points are paywalled/copyright). Next: Orcs & Goblins.
- Iter 3: Wrote research/army-orcs-goblins.md (full roster + special rules). Next: High Elves, then CITATIONS, then scaffold.
- Iter 4: Wrote research/army-high-elves.md + CITATIONS.md (with honest data note). PHASE 1 RESEARCH COMPLETE. Next: scaffold Vite project.
- Iter 5: Scaffolded Vite6+React18+TS+Vitest3. Verified `npm test` (1 pass) and `npm run build` (clean). PHASE 2 COMPLETE. Next: types + rules engine TDD.
- Iter 6: TDD rules engine — types.ts + points.ts + validate.ts. 19 tests green (red->green verified), build clean. PHASE 3 COMPLETE. Next: Empire army data.
- Iter 7: Encoded Empire army + shared magic items/options + armies index + integrity tests. 25 tests green, build clean. Next: Orcs & Goblins data.
- Iter 8: Encoded Orcs & Goblins army (18 units, Animosity/Fanatics/Black Orc tags). 30 tests green, build clean. Next: High Elves.
- Iter 9: Encoded High Elves army (13 units, elite tags). 35 tests green, build clean. PHASE 4 COMPLETE. Next: Phase 5 UI (state layer first).
- Iter 10: Built state layer (rosterOps + storage + useRosters hook) with 11 new tests. 46 tests green, build clean. Next: UI screens (router + Home).
- Iter 11: UI shell — App router, Home, NewList, theme CSS, summary helper (+test). 47 tests green, build clean, dev server serves OK. Next: full Editor (the big one).
- Iter 12: Built + visually verified the full Editor (live validation, role bars, options, magic items, picker). Persistence confirmed. No console errors. 47 tests green, build clean. Next: export-as-text + polish.
- Iter 13: Added Export/Print dialog (exportText.ts +test, ExportDialog.tsx, print CSS); verified live. 49 tests green, build clean. Next: responsive polish + README.
- Iter 14: Verified mobile responsive layout (single-column, no overflow, no console errors). PHASE 5 COMPLETE. Next: README + final DoD verification (Phase 6).
- Iter 15: Wrote README.md. Smoke-tested all 3 armies live in UI (Empire/O&G/High Elves load+add+validate). Final: 49 tests green, build clean. ALL DoD bullets verified TRUE. PROJECT COMPLETE — promise output.
- Iter (2026-06-21): Rules-fidelity follow-up — army ratio caps + special-character dependencies. Added `SelectionRules.ratioCaps` (`unit-ratio-max`: count derived from points and/or other-unit counts, with floor/absoluteMax/multiplier/minSize) and `SelectionRules.dependencies` (`unit-requires`: a unit needs a prerequisite present), both warnings. Wired 7 ratio caps across 6 armies (Treeman 1/1000≤3, VC Spectral Maidens 1/1000, VC Vampire Bats, Lizardmen Temple Guard + Terradons per-Slann, HE & DE bolt throwers) and 4 dependencies (Hellebron→Witch Elves, Isabella→Vlad, Gotrek↔Felix). Removed stale `lz-temple-guard.max`. 245 tests green, tsc clean. Spec/plan in docs/superpowers. Deferred (documented): vc-krell "Kemmler-as-General", Shadow Warriors waiver, model-count ratios, allies.
- Iter (2026-06-22): Dependency batch + Plague-Priest ratio (data-only; reuses the ratioCaps/dependencies engine). Wired 16 `dependencies` from already-transcribed "Requires X" notes — DE Kouran→Black Guard, DE Tullaris→Executioners, Empire Zarina→Kislev, Hot Pot→Halflings, HE Alith Anar/Belannaer/Korhil→their elite regiments, Skaven Skrolk→Plague Monks, Queek→Skaven Warriors, and 9 O&G war-machine/chariot racial gates (Orc/Goblin/Common-Goblin/Night-Goblin unit sets) — plus 1 ratioCap (Skaven Plague Priest ≤ Plague Monk regiments). Spec-reviewed, UI-verified live, 252 tests green. Spec: docs/superpowers/specs/2026-06-22-army-dependency-batch-design.md. Still deferred: model-count ratios (Squig Hoppers/Fanatics/Censer Bearers), Dwarf Slayers (unverified in data), conditional caps, allies.
- Iter (2026-06-22): Ratio caps model-count mode. Added `countModels?` to ratioCaps (capped side) and `perUnit` (basis side) so caps can count models (sum of entry sizes), with computed limit floored before floor/absoluteMax clamps. Wired O&G Squig Hoppers (≤5 models per Night Goblin unit), Fanatics (≤3 per NG unit), Skaven Censer Bearers (≤½ Plague Monk models, max 10). Spec+quality reviewed (approved), 258 tests green. Spec: docs/superpowers/specs/2026-06-22-ratio-model-count-design.md. Remaining deferred: Dwarf Slayers (unverified), conditional caps/waivers, allies.
- Iter (2026-06-22): Dwarf Slayers ratio cap. Verified against the army book (1995 Enanos.pdf p.87 "MATADORES": cannot include more Slayer regiments than other normal Dwarf warrior regiments). Wired `dw-slayers` ratioCap perUnit=[dw-warriors,dw-longbeards,dw-hammerers,dw-ironbreakers,dw-quarrellers,dw-thunderers,dw-miners] (entry-count, multiplier 1). Behavioral test + UI-verified ("Slayers: only 1 allowed (2 in the list)"). 259 tests green.
- Iter (2026-06-24): FAQ rules-fidelity pass — Phase 1 (duplicable set). Analyzed the official 1996 WFB FAQ v2.20 (archived research/faq-1996-v2.20.txt); spec docs/superpowers/specs/2026-06-24-faq-rules-fidelity-design.md. FAQ §19.3/§27.5: marked Power Scroll, Scroll of Magic Destruction, Healing Potion, Potion of Strength (common) + Runefang (empire) + Rune of Stone (dwarfs) as `duplicable`. Updated the duplicable-set test; added behavioral tests (2 Power Scrolls/Healing Potions OK, 2 Warp Storm Scrolls still flagged). 263 tests green, tsc clean. Remaining phases: 2 banner-only-BSB, 3 crown/helm exclusivity, 4 per-army dependencies, 5 deferred (Chaos daemons↔god, Ikit-general, magic shield as separate slot, runic=1-item, points corrections — edition caveat: FAQ is 4th-ed).
- Iter (2026-06-24): FAQ Phase 2 — magic banners require a BSB (FAQ §23.2, strict mode). Added inherent `UnitProfile.isBSB`, flagged the 20 dedicated battle-standard units, and added a `magic-items-banner-bsb` warning (a character carrying a `category:'banner'` item must satisfy `e.isBSB || unit.isBSB`). Tests: 3 behavioral (non-BSB→warn; dedicated unit→ok; entry.isBSB→ok) + a generic per-army "battle-standard units have isBSB" assertion. 280 tests green, tsc clean.
- Iter (2026-06-24): FAQ Phase 3 — crown/helm exclusivity (FAQ §19.5). Added `MagicItem.exclusiveGroup?: 'crown' | 'helm'` and tagged 8 items (crowns: Crown of Sorcery, Crown of Power [=Crown of Command, Ld 10], Dragon Crown of Karaz, War Crown of Saphery, Crown of the Tomb King ×2 pools; helms: Dragon Helm, Helm of Many Eyes, Golden Crown of Atrazar [FAQ "Golden Helm of Atrazar"]). New `magic-items-exclusive-group` warning (>1 per group per character). Crown of Bretonnia intentionally NOT tagged (not in the FAQ's closed list; post-FAQ item). 4 behavioral tests (2 crowns→warn, 2 helms→warn, crown+helm→ok, single→ok). 284 tests green, tsc clean. Remaining: Phase 4 per-army dependencies; Phase 5 deferred (Chaos daemons↔god, Ikit-general, magic shield as separate slot, runic=1-item, points corrections).
- Iter (2026-06-24): FAQ Phase 4 — per-army dependencies. After verifying ids against the actual 5th-ed data, most of the planned items did NOT apply (no separate Ice Mage/Boneripper/Outrider units; Wight/Wraith champion-leading needs a char-in-unit concept the engine lacks; Doom Diver↔Wolf Riders already wired; allies rules N/A — no allies system). Wired the 2 clean, supported ones: DE Assassin requires a host unit (§33.5: Executioners/Black Guard/Scouts/Corsairs/Warriors/Spearmen/City Guard/Crossbowmen), Skaven Assassins require Sewer (Gutter) Runners (§35.3, id sk-sewer-runners). 2 behavioral tests. 286 tests green, tsc clean. Champion bans (§28.7/§35.6) left out per the 4th-vs-5th edition caveat (data is 5th-ed transcription).
- Iter (2026-06-24): FAQ Phase 5 investigated → DEFERRED. Chaos daemons↔god (§31.4/§31.7) is NOT faithfully modelable with the id-only dependencies engine: the generic Chaos characters carry their god as a selectable Mark OPTION (and ch-daemon-bsb merges all four gods), so id-only wiring is either too lenient (wrong-god char satisfies) or too strict (marked char false-warns). Needs an option/Mark-aware dependency (engine extension). Also still deferred: Ikit-must-be-General (conditional predicate), magic shield as a separate slot (invasive recategorization), runic=1-item (Dwarf rune-system redesign), points corrections (4th-vs-5th edition caveat). FAQ pass concludes at Phase 4: Phases 1-4 shipped, 286 tests green, tsc clean.
- Iter (2026-06-24): FAQ Phase 5a — magic shield as a slot separate from armour (§19.1). Added `'shield'` to MagicItemCategory + RESTRICTED_CATEGORIES, CATEGORY_ORDER/CATEGORY_LABEL (EN "Magic Shield"/ES "Escudo Mágico"). Recategorized the 7 pure magic shields armour→shield (Spell-Eater, Anti-Spell, Shield of Ptolos, Enchanted, Spelled, Chaos Runeshield, Runic Shield); armours that merely *include* a shield stay 'armour'. Now armour+shield coexist (each capped at 1). 2 tests. 288 green, tsc clean.
- Iter (2026-06-24): FAQ Phase 5b — Chaos daemons↔god (§31.4/§31.7) RESOLVED via an option-aware dependency engine. Extended `dependencies` with `requiresOption` (satisfied when any CHARACTER entry bears that option, e.g. a god Mark) and `requiresLabelEn/Es` (clear message). Wired 14 Chaos daemon dependencies (fixed-god chars in requiresAnyOf: greater daemons + special chars; the god's Mark in requiresOption). ch-daemon-bsb (merged 4-god entry) intentionally not a satisfier. Test covers no-char→warn, fixed-god char→ok, correct Mark→ok, wrong-god Mark→warn. 289 tests green, tsc clean.
