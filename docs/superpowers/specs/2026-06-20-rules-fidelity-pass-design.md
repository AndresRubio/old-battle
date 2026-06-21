# Rules-Fidelity Pass — Design

**Date:** 2026-06-20
**Status:** Approved (design), pending implementation plan
**Author:** brainstorming session

## Problem

`validateRoster` already enforces the core 5th-edition list-building rules
(points limit, composition percentages, a required General, unit `max` caps,
min/max unit sizes, and the per-character magic-item rules). An audit against
the 5th-edition rules — *Warhammer Magia* pp. 32-33 and the army books — found
two areas we do **not** enforce:

1. **Magic-item uniqueness across the army.** *Warhammer Magia* p. 33: "un
   jugador no podrá incluir el mismo objeto en su ejército más de una vez."
   Today the same magic item can be given to two different characters with no
   warning. The rule has three documented exceptions where duplicates *are*
   allowed: **Pergaminos de Dispersión de Magia** (Dispel Scrolls),
   **Armadura del Caos** (Chaos Armour), and **Familiares** (Familiars — a
   different wizard may each take one).

2. **Army-specific selection rules.** Each army book has a selection section
   that may impose constraints beyond what we model (army maximum wizard level,
   0-1/0-3 unit caps we may have transcribed wrong, magic-standard limits, and
   occasional "must/may-not include" clauses).

## Audit findings (what we already do correctly)

Confirmed against *Warhammer Magia* p. 32 and our code:

- Magic items only on characters — enforced (`magic-items-noncharacter`).
- Item count ≤ rank allowance (1/2/3/4 for champion/hero/lord/wizard4, matching
  the book's Paladín/Héroe/Comandante/Gran Hechicero table) — enforced
  (`magic-items-count`).
- One each of weapon / armour / amulet / bound-spell / banner; arcane and
  enchanted unlimited — enforced. Our `ward` category is the book's "Amuleto"
  group and is correctly in `RESTRICTED_CATEGORIES`; `arcane`/`enchanted` are
  correctly excluded.
- Unit `max` caps, min/max sizes, a required and valid single General,
  composition percentages — all enforced.

No changes are needed to any of the above.

## Goals

- Enforce army-wide magic-item uniqueness with the three documented exceptions.
- Establish a data model and extraction process for army-specific selection
  rules, and enforce the rule types the books actually use.
- No regressions to existing validation; all current tests stay green.

## Non-goals

- Re-deriving the composition percentages (sourced from the army books; already
  encoded in `STANDARD_5E_COMPOSITION` and per-army `composition`).
- Magic-phase / in-game rules (spells, dispels) — list-building only.
- Special-character signature item combinations (already handled: those items
  are `special` and non-selectable).

## Phase 1 — Magic-item uniqueness

### Data prerequisites (catalog gaps found during the audit)
Two common items the uniqueness exceptions depend on are **missing** from
`src/data/magicItems.ts` and must be added first (verified by enumerating the
catalog on 2026-06-20):

- **Pergamino de Dispersión de Magia** (Dispel Scroll, 25 pts, `arcane`) — the
  catalog currently has only `Pergamino de Destrucción de Magia` (a different
  item). The Dispel Scroll is *the* primary duplicable exception, so without it
  the exception applies to nothing. Add as `mi-dispel-scroll` (common). Full
  text from *Warhammer Magia* p. 44: it may be used to dispel an enemy spell as
  it is cast; it will not dispel a spell cast with Total Power; one use only.
- **Familiar Guerrero** (Warrior Familiar, 25 pts, `arcane`, common) — the
  catalog has only `mi-power-familiar`, `mi-wizard-familiar`, `mi-chaos-familiar`.
  Add as `mi-warrior-familiar`. (Lower priority than the Dispel Scroll, but it
  completes the Familiar group and is a duplicable exception.)

These are genuine completeness fixes, consistent with the earlier additions of
*Esfera de Malfleur* and *Tormenta Demoniaca*.

### Data model
Add to `MagicItem` (`src/data/types.ts`):

```ts
/** True for the documented exceptions to army-wide uniqueness
 *  (Dispel Scrolls, Chaos Armour, Familiars). Default/undefined = unique. */
duplicable?: boolean
```

Set `duplicable: true` in `src/data/magicItems.ts` on an **explicit, enumerated
id list** — never by name or category heuristic (the flag lives on the data so
the rule has no hard-coded set, and category `arcane` holds ~40 non-familiar
items that must not be matched):

- `mi-chaos-armour` (Chaos Armour)
- `mi-power-familiar`, `mi-wizard-familiar`, `mi-chaos-familiar`,
  `mi-warrior-familiar` (the four Familiars)
- `mi-dispel-scroll` (Dispel Scroll)

### Validation
New check in `validateRoster` (`src/rules/validate.ts`), rule id
`magic-items-unique`, severity **error**:

1. Build a count keyed on the `magicItemId` **string** used across all roster
   entries (not on the resolved item object).
2. Resolve each id to its `MagicItem` via `findMagicItem` (missing items are
   skipped, as elsewhere).
3. For any id whose count ≥ 2 and whose item is not `duplicable`, push one
   violation naming the item and the offending characters.

Scope notes:
- This is purely a **cross-character** check. The "one Familiar per wizard" rule
  (a single wizard may not hold two of the same familiar) is intentionally
  **out of scope** for the validator: it is already prevented by the UI, which
  toggles ids on a per-entry array so one character cannot hold the same id
  twice. Familiars are `arcane` (unrestricted category), so `magic-items-category`
  does not cover it either; defense-in-depth here is a possible follow-up, not
  part of this phase.
- The check does **not** special-case `special` or `restrictedTo` items — two
  copies of any such item also violate uniqueness, which is intended.

### Tests (`src/rules/validate.test.ts`)
- Two characters with the same normal item → one `magic-items-unique` error.
- Two characters each with a Dispel Scroll (`mi-dispel-scroll`) → no error.
- Two characters each with Chaos Armour (`mi-chaos-armour`) → no error.
- Two wizards each with a Familiar (`mi-power-familiar`) → no error.
- **Mixed roster**: one duplicated normal item *and* a duplicated Dispel Scroll
  in the same list → exactly one violation (the normal item), exception silent.
- A legal list (no duplicates) → no `magic-items-unique` violation.

## Phase 2 — Army-book selection rules

### Extraction process
The `/tmp` OCR was cleared, so each of the 14 army PDFs in `~/Downloads/` must
be re-read. For each army, read its selection section and record, in a
structured per-army table:
- Army maximum wizard level (if stated).
- Any 0-1 / 0-3 unit caps, checked against the unit's current `max`.
- Magic-standard limits (army-wide or per type).
- Any "must include" / "may not include" clauses that are mechanically checkable.
- Maximum number of characters, if the book states one.

Each army's findings are reviewed (spec-document-reviewer or equivalent) before
encoding. Rule *types* that no book uses are dropped (YAGNI).

### Data model
Add an optional per-army `selectionRules` object, populated only with fields the
books actually use. Candidate fields (final set decided by extraction):

```ts
interface SelectionRules {
  maxWizardLevel?: number
  maxCharacters?: number
  maxMagicStandards?: number
  // …only fields the army books actually use
}
```

Correct any wrong `max` values discovered on unit profiles as part of this work.

### Validation
Add one focused check per rule type that appears, each with its own rule id and
appropriate severity (hard caps = error, soft/advisory = warning). Each check is
independent and reads from `army.selectionRules`.

### Tests
- Per-army data assertions (e.g. wizard-level options never exceed
  `maxWizardLevel`).
- One validation test per new rule type (violation + clean case).

## Architecture & boundaries

- All new logic stays inside `validateRoster`; each rule is an independent block
  that pushes `RuleViolation`s — matching the existing structure.
- Data (`types.ts`, `magicItems.ts`, per-army files) carries the rules; the
  validator stays generic and data-driven. No army-specific branching in code.
- i18n: every new message has `en` and `es` strings, following the existing
  bilingual pattern in `validateRoster`.

## Error handling
- Unknown / missing items are skipped (consistent with existing `findMagicItem`
  null-guards) — a malformed roster never throws during validation.
- Violations are surfaced through the existing `RuleViolation[]` channel and the
  Troop Review panel; no new UI surface is required.

## Testing strategy
- Unit tests as listed per phase, in the existing Vitest suites.
- Full suite (`npm test`), typecheck (`tsc`), and build must stay green.
- Phase 1 is independently shippable and verifiable before Phase 2 begins.

## Rollout
1. Phase 1 (uniqueness) — small, self-contained, ships first.
2. Phase 2 (selection-rule extraction + enforcement) — incremental, one army at
   a time, behind the same validation channel.
