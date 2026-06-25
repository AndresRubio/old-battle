# UI Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A thorough full-app visual polish of the Old Battle army builder that keeps its parchment / antique-gold / blood-red identity while tightening accent discipline, type/spacing consistency, editor density, and mobile ergonomics.

**Architecture:** Add a tightened design-token layer to `:root` in `src/styles/index.css`, then apply it across every screen (mostly CSS value swaps). Two structural changes: the editor stat strip becomes one unified bordered strip, and the mount selector is extracted into a small `MountSelector` component (TDD'd) and restyled as chips. No changes to the rules engine, data, state, or i18n strings.

**Tech Stack:** React 18 + TypeScript + Vite 6 SPA; Vitest 3 under jsdom; hand-written CSS with custom properties; Capacitor → Android.

## Global Constraints

- **Identity is fixed:** parchment background + SVG noise texture, dark-leather header banner (`--banner`) + gold rule, Cinzel / Cinzel Decorative headings, Spectral body. Do not replace these.
- **No new dependencies.** Component tests use bare `react-dom/client` + `act` from `react` (both already dependencies); do NOT add `@testing-library`.
- **No changes** to `src/rules/**`, `src/data/**`, `src/state/**`, or i18n *strings* in `src/i18n/lang.ts` (importing existing helpers/types is fine). This is presentation only.
- **Bilingual:** every screen must be verified in both EN and ES. No new user-facing strings are introduced; if one becomes necessary, STOP and escalate.
- **Mobile is first-class:** verify at 375px (the app ships as an Android app).
- **Verification gate per task:** `npx tsc --noEmit -p tsconfig.app.json` clean AND `npm test` green, plus the task's visual check.
- **Preview server runs on port 5199** (`.claude/launch.json` is already set to this). The user runs their own dev server on **port 5173 — never touch or kill it.**
- Existing CSS lives in `src/styles/index.css` (~1000 lines). Append new tokens to the `:root` block at the top; place new component rules near related existing rules.

---

## File Structure

- `src/styles/index.css` — **modified** in nearly every task: new `:root` tokens, button system, accent reassignment, stat-strip rules, chip rules, mobile rules, surface rules.
- `src/components/MountSelector.tsx` — **created** (Task 5): presentational chip radiogroup for mounts.
- `src/components/MountSelector.test.tsx` — **created** (Task 5): bare-react-dom behavior test.
- `src/components/EntryRow.tsx` — **modified** (Tasks 3, 4, 5): unified stat strip markup, chip/profile classes, swap mount radio block for `<MountSelector>`.
- `src/components/SummaryPanel.tsx` — **modified** (Task 2, only if a class is needed; expected CSS-only).
- `vite.config.ts` — read-only reference (test env already `jsdom`).

---

## Task 1: Design tokens + button hierarchy

**Files:**
- Modify: `src/styles/index.css` (`:root` block ~line 1-29; `.btn` block ~line 160-193)

**Interfaces:**
- Produces (CSS custom properties consumed by all later tasks): `--fs-xs|sm|base|lg|xl|2xl`, `--space-1..6`, `--divider`, `--radius-sm|md|lg`. Button classes: `.btn` (secondary/default), `.btn-primary`, `.btn-ghost`.

- [ ] **Step 1: Add scale + border tokens to `:root`**

In `src/styles/index.css`, inside the existing `:root { … }` block (after the existing color vars, before `font-family`), add:

```css
  /* ---- Polish: type scale ---- */
  --fs-xs: 0.72rem;
  --fs-sm: 0.82rem;
  --fs-base: 0.95rem;
  --fs-lg: 1.1rem;
  --fs-xl: 1.4rem;
  --fs-2xl: 2rem;
  /* ---- Polish: spacing scale ---- */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  /* ---- Polish: borders / radius ---- */
  --divider: #e0d2ac;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  /* Calm chip fill for ability/rule tags. */
  --chip-bg: #ece0c2;
  --chip-ink: #5c4a2a;
```

- [ ] **Step 2: Formalize the button hierarchy**

Replace the existing `.btn` … `.btn-danger:hover` block (~line 160-193) with:

```css
/* ---- Buttons ---- */
.btn {
  border: 1px solid var(--border-strong);
  background: var(--bg-raised);
  color: var(--ink);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--fs-base);
  transition: background 0.15s, border-color 0.15s, transform 0.05s;
}
.btn:hover {
  border-color: var(--gold);
}
.btn:focus-visible {
  outline: 2px solid var(--gold-bright);
  outline-offset: 1px;
}
.btn:active {
  transform: translateY(1px);
}
.btn-primary {
  background: var(--blood);
  border-color: var(--gold);
  color: #f4ead0;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.btn-primary:hover {
  background: var(--blood-bright);
  border-color: var(--gold-bright);
}
.btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--ink-dim);
}
.btn-ghost:hover {
  background: var(--bg-raised);
  border-color: var(--border);
}
.btn-danger:hover {
  border-color: var(--blood-bright);
  color: var(--blood-bright);
}
```

(This flattens the primary button's gradient to a solid blood fill and adds a gold focus ring; existing `.btn-sm` rules elsewhere are untouched.)

- [ ] **Step 3: Verify build + tests**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test`
Expected: tsc prints nothing; vitest reports all tests passing (CSS changes don't affect the suite).

- [ ] **Step 4: Visual check**

Ensure preview is running: use `preview_start` (name `dev`, port 5199) then `preview_screenshot`. Confirm on the Home screen that "+ New Army List" and "Ko-fi" are solid blood-red primaries, "Buy me a coffee" and "Delete" read as secondary/ghost, and focus rings are gold. No layout breakage.

- [ ] **Step 5: Commit**

```bash
git add src/styles/index.css
git commit -m "feat(ui): design tokens + button hierarchy"
```

---

## Task 2: Accent discipline (red → ink/gold reassignment)

**Files:**
- Modify: `src/styles/index.css` (rules for `.points-big`, `.general-star`, and bar/validation colors — search for these selectors)

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: nothing new; purely restyles existing classes `.points-big` (SummaryPanel) and `.general-star` (EntryRow). No markup change.

- [ ] **Step 1: Find the current colors**

Run: `grep -nE "points-big|general-star|points-total" src/styles/index.css`
Note the current rules (the points total and star are currently blood-red).

- [ ] **Step 2: Reassign the points total to ink**

In `src/styles/index.css`, update the `.points-big` rule so its `color` is `var(--ink)` and its size uses `font-size: var(--fs-2xl)`. Leave the `.points-total.over .points-big` (over-limit) state blood-red — find or add:

```css
.points-big {
  font-size: var(--fs-2xl);
  font-weight: 600;
  color: var(--ink);
}
.points-total.over .points-big {
  color: var(--blood-bright);
}
```

- [ ] **Step 3: Reassign the General star to gold**

Update the `.general-star` rule so `color: var(--gold-bright);` (it is currently red). Keep its size/spacing.

- [ ] **Step 4: Confirm bar semantics**

Verify the percentage bars keep meaning: `.bar-fill` cap-exceeded/under-min states should read warning-gold / error-red, neutral fills gold. Inspect the `.bar-char/.bar-reg/.bar-wm/.bar-mon` rules; if any uses blood-red for a *non-error* fill, change that fill to `var(--gold)` (reserve red for the over-limit/error case only). Do not change the validation badge/violation colors (errors stay red, warnings stay gold — already correct).

- [ ] **Step 5: Verify build + tests**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test`
Expected: clean + all green.

- [ ] **Step 6: Visual check**

Open a saved list in the editor (`preview_click` a roster card). Confirm: the big points total is near-black ink (not red); the General ★ is gold; an over-limit total still turns red (temporarily set a low limit via the Limit field to confirm, then restore). Check the Muster Check still shows red errors / gold warnings.

- [ ] **Step 7: Commit**

```bash
git add src/styles/index.css
git commit -m "feat(ui): accent discipline — points total to ink, General star to gold"
```

---

## Task 3: Unified editor stat strip

**Files:**
- Modify: `src/components/EntryRow.tsx` (the `StatLineRow` component, ~line 11-25)
- Modify: `src/styles/index.css` (rules for `.statline`, `.stat`, `.stat-k`, `.stat-v`, `.statline-wrap`)

**Interfaces:**
- Consumes: tokens from Task 1; existing `StatLineRow` props `{ statLine: Partial<StatLine>; lang; label? }` (unchanged).
- Produces: same `StatLineRow` API; only the rendered class structure + CSS change.

- [ ] **Step 1: Keep `StatLineRow` markup, ensure stable classes**

`StatLineRow` already emits `.statline-wrap > .stat-profile-label? + .statline > .stat(.stat-k + .stat-v)`. No JSX change is required for the unified look — it is achievable in CSS. Leave `EntryRow.tsx` `StatLineRow` as-is for this task. (Confirm by re-reading lines 11-25.)

- [ ] **Step 2: Restyle the stat strip in CSS**

Replace the existing `.statline` / `.stat` / `.stat-k` / `.stat-v` rules (search for them) with a single-strip treatment:

```css
.statline-wrap {
  display: grid;
  gap: var(--space-1);
}
.statline {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-1) 0;
  border-right: 1px solid var(--divider);
}
.stat:last-child {
  border-right: none;
}
.stat-k {
  font-size: var(--fs-xs);
  letter-spacing: 0.03em;
  color: var(--gold);
}
.stat-v {
  font-weight: 500;
  color: var(--ink);
}
```

(If the old rules gave each `.stat` its own full border, this removes that — the strip now has one outer border + inner dividers.)

- [ ] **Step 3: Verify build + tests**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test`
Expected: clean + all green.

- [ ] **Step 4: Visual check**

Expand a unit in the editor. Confirm the main stat line renders as one bordered strip with hairline dividers (not nine separate boxes), labels gold, values ink, and absent stats still show `–` (check a chariot/profile with partial stats, e.g. a unit with `profiles`). Verify in EN and ES (toggle header EN/ES — stat labels localize via `STAT_LABEL`).

- [ ] **Step 5: Commit**

```bash
git add src/styles/index.css src/components/EntryRow.tsx
git commit -m "feat(ui): unified editor stat strip"
```

---

## Task 4: Secondary mount/profile lines + calmer tags

**Files:**
- Modify: `src/styles/index.css` (rules for `.profile-block`, `.stat-profile-label`, `.rule-tag`, `.rule-tags`, `.rule-tags-inline`)

**Interfaces:**
- Consumes: tokens from Task 1; the stat strip from Task 3.
- Produces: nothing new; restyles existing classes already emitted by `EntryRow.tsx` (`.profile-block` wraps mount/profile `StatLineRow` + `RuleTags`).

- [ ] **Step 1: Make profile/mount blocks visually subordinate**

Replace/extend the `.profile-block` and `.stat-profile-label` rules:

```css
.profile-block {
  display: grid;
  gap: var(--space-2);
  border-left: 3px solid var(--gold-bright);
  padding-left: var(--space-3);
  margin-top: var(--space-2);
}
.stat-profile-label {
  font-size: var(--fs-sm);
  font-style: italic;
  color: var(--gold);
}
/* Mount/profile stat strips read lighter than the main line. */
.profile-block .statline {
  border-color: var(--divider);
}
.profile-block .stat {
  border-right-color: #e8dcbc;
}
.profile-block .stat-v {
  color: var(--ink-dim);
}
```

- [ ] **Step 2: Calm the ability / rule tags**

Replace the `.rule-tag` and tag-list rules so tags are soft filled chips (no heavy borders / pills). Find `.rule-tag`, `.rule-tags`, `.rule-tags-inline` and set:

```css
.rule-tags {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.rule-tags-inline {
  margin: 0;
}
.rule-tag {
  display: inline-block;
  background: var(--chip-bg);
  color: var(--chip-ink);
  border: none;
  border-radius: var(--radius-sm);
  padding: 3px 10px;
  font-size: var(--fs-sm);
}
.rule-tag-link {
  cursor: pointer;
  font: inherit;
}
.rule-tag-link:hover {
  background: #e2d3b0;
}
.rule-info {
  color: var(--gold);
}
```

(Preserve the `rule-tag-link` button behavior — clicking still opens `RuleDialog`; only the visual changes.)

- [ ] **Step 3: Verify build + tests**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test`
Expected: clean + all green.

- [ ] **Step 4: Visual check**

Expand a Dark Elf General (has a Cold One mount with stats + rules) and a unit with `specialRules`. Confirm: ability/rule tags are calm filled chips (no competing borders); the mount stat line sits under a gold left-rule with an italic gold label and lighter dividers; the ⓘ rule links still open the rule dialog. Verify EN + ES.

- [ ] **Step 5: Commit**

```bash
git add src/styles/index.css
git commit -m "feat(ui): subordinate mount/profile lines + calmer tag chips"
```

---

## Task 5: Extract `MountSelector` (TDD) + restyle as chips

**Files:**
- Create: `src/components/MountSelector.tsx`
- Create: `src/components/MountSelector.test.tsx`
- Modify: `src/components/EntryRow.tsx` (replace the mount radio block ~line 227-261 with `<MountSelector …>` + the existing selected-mount stat block)
- Modify: `src/styles/index.css` (add `.mount-chips` / `.mount-chip` rules)

**Interfaces:**
- Consumes: `MountOption` type from `../data/types`; `mountName`, `t`, `Lang` from `../i18n/lang`; tokens from Task 1.
- Produces: `MountSelector` component with props `{ mounts: MountOption[]; selectedId: string | undefined; onSelect: (mountId: string | null) => void; lang: Lang; name: string }`. Consumed by `EntryRow`.

- [ ] **Step 1: Write the failing test**

Create `src/components/MountSelector.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { ReactElement } from 'react'
import { MountSelector } from './MountSelector'
import type { MountOption } from '../data/types'

const MOUNTS: MountOption[] = [
  { id: 'mount-cold-one', name: 'Cold One', points: 10 },
  { id: 'mount-dark-steed', name: 'Dark Steed', points: 3 },
]

let container: HTMLDivElement
let root: Root

function render(ui: ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(ui))
}

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('MountSelector', () => {
  it('renders On foot plus one radio per mount', () => {
    render(<MountSelector mounts={MOUNTS} selectedId={undefined} onSelect={() => {}} lang="en" name="e1" />)
    expect(container.querySelectorAll('input[type="radio"]').length).toBe(3)
  })

  it('marks the selected mount as checked', () => {
    render(<MountSelector mounts={MOUNTS} selectedId="mount-cold-one" onSelect={() => {}} lang="en" name="e1" />)
    const checked = container.querySelector('input[type="radio"]:checked') as HTMLInputElement
    expect(checked.closest('label')?.textContent).toContain('Cold One')
  })

  it('calls onSelect with the mount id when a mount chip is chosen', () => {
    let picked: string | null | undefined = '__unset__'
    render(<MountSelector mounts={MOUNTS} selectedId={undefined} onSelect={(id) => { picked = id }} lang="en" name="e1" />)
    const radios = Array.from(container.querySelectorAll('input[type="radio"]')) as HTMLInputElement[]
    act(() => radios[1].click())
    expect(picked).toBe('mount-cold-one')
  })

  it('calls onSelect with null when On foot is chosen', () => {
    let picked: string | null | undefined = '__unset__'
    render(<MountSelector mounts={MOUNTS} selectedId="mount-cold-one" onSelect={(id) => { picked = id }} lang="en" name="e1" />)
    const radios = Array.from(container.querySelectorAll('input[type="radio"]')) as HTMLInputElement[]
    act(() => radios[0].click())
    expect(picked).toBe(null)
  })
})
```

- [ ] **Step 2: Run the test, watch it fail**

Run: `npx vitest run src/components/MountSelector.test.tsx`
Expected: FAIL — module `./MountSelector` not found (component doesn't exist yet).

- [ ] **Step 3: Create the component (minimal to pass)**

Create `src/components/MountSelector.tsx`:

```tsx
import type { MountOption } from '../data/types'
import { mountName, t, type Lang } from '../i18n/lang'

interface Props {
  mounts: MountOption[]
  selectedId: string | undefined
  onSelect: (mountId: string | null) => void
  lang: Lang
  name: string
}

export function MountSelector({ mounts, selectedId, onSelect, lang, name }: Props) {
  return (
    <div className="mount-chips" role="radiogroup">
      <label className={`mount-chip ${!selectedId ? 'mount-chip-on' : ''}`}>
        <input
          type="radio"
          name={`${name}-mount`}
          checked={!selectedId}
          onChange={() => onSelect(null)}
        />
        <span>{t('onFoot', lang)}</span>
      </label>
      {mounts.map((m) => (
        <label key={m.id} className={`mount-chip ${selectedId === m.id ? 'mount-chip-on' : ''}`}>
          <input
            type="radio"
            name={`${name}-mount`}
            checked={selectedId === m.id}
            onChange={() => onSelect(m.id)}
          />
          <span>
            {mountName(m, lang)} <span className="mount-cost">+{m.points}</span>
          </span>
        </label>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run the test, watch it pass**

Run: `npx vitest run src/components/MountSelector.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire `MountSelector` into `EntryRow`**

In `src/components/EntryRow.tsx`, add the import near the other component imports (after line 7):

```tsx
import { MountSelector } from './MountSelector'
```

Replace the mount block (currently lines ~227-261, the `{mounts.length > 0 && ( … )}` region) with:

```tsx
          {mounts.length > 0 && (
            <div className="opt-group">
              <span className="opt-label">{t('mount', lang)}</span>
              <MountSelector
                mounts={mounts}
                selectedId={entry.mountId}
                onSelect={onSelectMount}
                lang={lang}
                name={entry.id}
              />
              {selectedMount?.statLine && (
                <div className="profile-block">
                  <StatLineRow statLine={selectedMount.statLine} lang={lang} label={mountName(selectedMount, lang)} />
                  {selectedMount.specialRules && selectedMount.specialRules.length > 0 && (
                    <RuleTags rules={selectedMount.specialRules} lang={lang} />
                  )}
                </div>
              )}
            </div>
          )}
```

- [ ] **Step 6: Add chip styling**

In `src/styles/index.css`, add:

```css
/* ---- Mount selector chips ---- */
.mount-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.mount-chip {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: var(--space-2) var(--space-3);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
  cursor: pointer;
}
.mount-chip input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.mount-chip:hover {
  border-color: var(--gold);
}
.mount-chip:focus-within {
  outline: 2px solid var(--gold-bright);
  outline-offset: 1px;
}
.mount-chip-on {
  background: var(--blood);
  border-color: var(--gold);
  color: #f4ead0;
  font-weight: 500;
}
.mount-cost {
  color: var(--ink-dim);
}
.mount-chip-on .mount-cost {
  color: #e7cdb0;
}
```

- [ ] **Step 7: Verify build + full suite**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test`
Expected: clean + all green (including the 4 new MountSelector tests).

- [ ] **Step 8: Visual check**

In the editor, expand a Dark Elf General. Confirm the mounts render as chips (name + cost), the selected one is blood-red, "On foot" is first, selecting a chip updates the points total and shows the mount stat line, and keyboard arrow keys move selection within the group. Verify EN + ES.

- [ ] **Step 9: Commit**

```bash
git add src/components/MountSelector.tsx src/components/MountSelector.test.tsx src/components/EntryRow.tsx src/styles/index.css
git commit -m "feat(ui): extract MountSelector, restyle mounts as chips (TDD)"
```

---

## Task 6: Mobile refinements

**Files:**
- Modify: `src/styles/index.css` (brand title size + any `@media` blocks; search for `.brand-title` and existing `@media`)

**Interfaces:**
- Consumes: tokens from Task 1; chips from Task 5.

- [ ] **Step 1: Clamp the brand title to one line**

Update `.brand-title` (~line 123) so its size is fluid and does not wrap on a 375px screen:

```css
.brand-title {
  display: block;
  font-family: var(--font-black);
  font-size: clamp(1rem, 4.5vw, 1.45rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
  color: var(--gold-bright);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}
```

- [ ] **Step 2: Confirm tap targets + stacking**

Check the existing `@media` rules (search `@media`). Ensure on mobile: the size-stepper buttons and mount chips are ≥40px tall (chips already are from Task 5), and the summary panel stacks above the army list. Add a `@media (max-width: 640px)` rule only if a target is too small, e.g.:

```css
@media (max-width: 640px) {
  .size-stepper .btn {
    min-height: 40px;
    min-width: 40px;
  }
}
```

- [ ] **Step 3: Verify build + tests**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test`
Expected: clean + all green.

- [ ] **Step 4: Visual check at 375px**

`preview_resize` to `mobile`. Screenshot Home + the expanded editor. Confirm: the header title is a single line; the stat strip fits nine cells; mount chips wrap with comfortable spacing and tap size; nothing overflows horizontally. Reset with `preview_resize` to `desktop`.

- [ ] **Step 5: Commit**

```bash
git add src/styles/index.css
git commit -m "feat(ui): mobile refinements — single-line header, tap targets"
```

---

## Task 7: Apply tokens to remaining surfaces

**Files:**
- Modify: `src/styles/index.css` (Home: `.roster-card`, `.empty-state`, `.donate-card`; forms: `.field`, `.new-list`; dialogs: search `dialog`/`modal`/`.export`/`.info` selectors)

**Interfaces:**
- Consumes: all tokens from Task 1.

- [ ] **Step 1: Normalize Home + form surfaces**

Update `.roster-card`, `.empty-state`, `.donate-card`, `.field > span`, and `.field input/select` to use the tokens consistently: borders use `var(--border)` at 1px (keep `--border-strong` only on the donate-card top accent and dashed empty-state), radii use `var(--radius-md)`/`--radius-lg`, gaps use the spacing scale, and uppercase field labels use `font-size: var(--fs-xs)` with `color: var(--gold)`. Make the Home "Delete" button `.btn-ghost` (edit `Home.tsx` only if the class isn't already applied — check first; prefer CSS).

- [ ] **Step 2: Normalize dialogs**

Find the dialog/modal CSS (e.g. `grep -nE "dialog|modal|overlay|export|info-" src/styles/index.css`). Apply consistent: surface `var(--bg-card)`, 1px `var(--border)`, `var(--radius-lg)`, header label treatment, button hierarchy, spacing-scale padding. Do not change dialog behavior or markup unless a class is missing.

- [ ] **Step 3: Verify build + tests**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm test`
Expected: clean + all green.

- [ ] **Step 4: Visual check (all screens, EN + ES, desktop + mobile)**

Screenshot: Home, New List, editor (collapsed + expanded with a mount), the Add Unit dialog (`+ Add unit`), the Export dialog (`Export`), a rule dialog (ⓘ), and an info dialog (magic item ⓘ). Confirm consistent borders/radii/spacing, button hierarchy, and that identity (parchment/gold/leather/Cinzel) is intact. Repeat key screens in ES and at 375px.

- [ ] **Step 5: Commit**

```bash
git add src/styles/index.css src/components/Home.tsx
git commit -m "feat(ui): apply tokens to Home, forms, and dialogs"
```

---

## Final verification (after all tasks)

- [ ] `npx tsc --noEmit -p tsconfig.app.json` clean.
- [ ] `npm test` fully green (including the 4 new MountSelector tests).
- [ ] Live screenshots confirm every screen reflects the foundations, the editor stat strip + mount chips match the approved mockups, mobile header doesn't wrap, and identity is intact — in EN and ES, desktop and 375px.
- [ ] No regressions: mount selection folds points, magic-item selection works, validation errors/warnings render, EN/ES toggle works.
- [ ] Dispatch a final code review (superpowers:requesting-code-review) over the whole branch diff, then use superpowers:finishing-a-development-branch.
