# UI Polish Pass — Design

**Goal:** A thorough, full-app visual polish of the Old Battle army builder that keeps its
parchment / antique-gold / blood-red identity but tightens clarity, consistency, density, and mobile
ergonomics — using Old World Builder (old-world-builder.com) as the usability bar, not as a style to
copy.

**Approach:** Token-system foundation + targeted structural reworks. Establish a tightened CSS design
foundation (type scale, spacing scale, border/elevation rules, button hierarchy, accent discipline)
and apply it app-wide; restructure markup only where density demands it (the editor stat strip, the
mount selector, tag treatment). The rules engine, validation, i18n, and state layers are **not**
touched — this is presentation only.

**Tech stack:** React + TypeScript + Vite SPA. Styling is hand-written CSS in
`src/styles/index.css` (~1000 lines) + `src/styles/fonts.css`, driven by CSS custom properties on
`:root`. No CSS framework, no CSS-in-JS. Capacitor wraps the build as an Android app, so mobile (375px)
is a first-class target.

---

## Identity — what stays (non-negotiable)

These define the product and must survive the pass unchanged in spirit:

- Aged-parchment background with the subtle SVG noise texture + radial warm gradient.
- Dark-leather header banner (`--banner`) with gold bottom rule.
- Carved-serif display type: Cinzel / Cinzel Decorative for headings + brand; Spectral for body.
- The warm palette: parchment surfaces, antique gold, blood red.
- EN/ES toggle, the Muster Check panel, the percentage-bar summary.

The pass refines *how* these are used; it does not replace them.

---

## Section 1 — Foundations (tokens)

All foundations live as CSS custom properties on `:root` in `src/styles/index.css`, so the rest of
the pass is "apply the tokens." Existing color variables are kept; new scale/role tokens are added.

### 1a. Accent discipline

Blood-red is currently overloaded — it is the buttons **and** the points total **and** the General
star. Reassign by role:

- **Blood red (`--blood`, `--blood-bright`)** → interactive primary (primary buttons, active/selected
  states) and validation **errors** only.
- **Antique gold (`--gold`, `--gold-bright`)** → structure & labels: decorative rules, uppercase
  section labels, the General ★, card top-accents, focus rings, **warnings**.
- **Ink (`--ink`, `--ink-dim`, `--ink-faint`)** → data: the big points total, stat values, body copy.

Concrete changes this implies:
- Summary points total: red → `--ink` (the "170" in `SummaryPanel`).
- General marker ★: red → gold (in `EntryRow`).
- Keep red on: `.btn-primary`, selected mount chip, error rows/badges in Muster Check.

### 1b. Type scale

Add explicit scale tokens and apply them (replacing scattered ad-hoc `rem` sizes):

```
--fs-xs: 0.72rem;   /* uppercase gold labels */
--fs-sm: 0.82rem;   /* meta, secondary */
--fs-base: 0.95rem; /* body */
--fs-lg: 1.1rem;    /* card/unit titles */
--fs-xl: 1.4rem;    /* section headings */
--fs-2xl: 2rem;     /* points total */
```

Body line-height settles to 1.5. The brand title in the header uses a `clamp()` so it does **not**
wrap to two lines at 375px (today it does).

### 1c. Spacing scale

Add spacing tokens for consistent vertical rhythm and component gaps, and apply them to replace
one-off margins/paddings:

```
--space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
--space-4: 1rem; --space-5: 1.5rem; --space-6: 2rem;
```

### 1d. Border & elevation tokens

The app's biggest visual-noise source is competing outlines. Standardize:

- One hairline border weight: `--border` (1px, `#cbb481`). Reserve `--border-strong` for genuine
  emphasis (e.g. a card's outer edge), never for inner sub-elements.
- A single divider color `--divider` (`#e0d2ac`) for internal cell separators (lighter than borders).
- Radius tokens: `--radius-sm: 6px`, `--radius-md: 8px`, `--radius-lg: 10px`.
- Keep the existing soft card shadow on `.roster-card`; do not add new shadows elsewhere (flat).

### 1e. Button hierarchy

Formalize three variants on the existing `.btn` base (classes already partly exist):

- `.btn-primary` — blood-red fill, parchment text, gold hairline border. (Add unit, New Army List,
  Create list, Ko-fi.) The current gradient may be kept but flattened toward a solid for calm.
- `.btn` (secondary, default) — transparent/raised bg, gold-capable border, ink text. (Export, Lists,
  Cancel, Buy me a coffee.)
- `.btn-ghost` — no border, `--ink-dim` text, hover background. (Delete, inline minor actions.)

Consistent padding (`--space-2`/`--space-3`), radius (`--radius-sm`), and a gold focus ring for a11y.

---

## Section 2 — Editor density rework (the largest change)

File: `src/components/EntryRow.tsx` + its CSS (`.statline`, `.statline-wrap`, `.stat-profile-label`,
`.rule-tags-inline`, and related). Markup restructuring here, but **no change to props, data, mount/
magic-item logic, or which values render** — purely how they are presented.

### 2a. Unified stat strip

Today: nine separately-bordered stat cells (`.statline` renders each stat as its own bordered box).
Refined: one bordered, rounded container (`border: 1px solid var(--border)`, `--radius-sm`,
`overflow: hidden`) holding nine cells separated by `1px solid var(--divider)` (border-right on each
cell except the last). Each cell: tiny gold uppercase label (`--fs-xs`) over an ink value
(`font-weight: 500`). Absent stats still render `–` (existing `Partial<StatLine>` behavior preserved).

### 2b. Mount / profile stat lines as clearly-secondary

When a mount is selected (or a `ProfileBlock` is shown), its stat line uses the same unified strip
but visually subordinate: wrapped with a `border-left: 3px solid var(--gold-bright)` and a small
italic gold label (e.g. "Cold One — mount"), lighter divider color, slightly smaller. Removes the
"two equal box-grids stacked" effect. Applies to `StatLineRow` for both mounts and `profiles`.

### 2c. Calmer ability / rule tags

Today: bordered pill tags (`.rule-tags-inline` / ability tags use 1px borders + pill radius).
Refined: filled chips — soft parchment fill (`#ece0c2`), no border, `--radius-sm`, ink-warm text
(`#5c4a2a`). Keeps them legible but stops them competing with the stat strip and card borders. The
existing click-to-open-rule-dialog behavior is preserved.

---

## Section 3 — Mount selector + mobile

### 3a. Mount selector → selectable chips

File: `src/components/EntryRow.tsx` (the mount radio group). Today the mounts render as a wrap of
small native radio buttons + labels — small tap targets, weak selected-state. Refined: a wrap of
selectable chips, each showing name + cost (e.g. `Cold One +10`); the selected chip is blood-red
fill/parchment text, unselected are parchment fill + hairline border. "On foot" is the first chip.
Implementation stays a radiogroup semantically (keep `role="radio"`/keyboard + `onSelectMount`),
restyled as chips; cost styling uses `--ink-dim` on unselected. Min tap height ~40px.

### 3b. Mobile (375px)

- Brand title `clamp()`d to a single line.
- Stat strip sized to fit nine cells at 375px with the lighter dividers (already responsive; the
  unified strip reads better than nine bordered boxes when tight).
- Mount chips wrap with comfortable spacing; full-width primary actions (Add unit) retained.
- Summary panel continues to stack above the army list (existing behavior — verify it still holds).

---

## Section 4 — Apply tokens to remaining surfaces

Same foundations, applied for consistency (mostly CSS value swaps, minimal markup):

- **Home** (`Home.tsx`): roster cards, empty state, donate callout — unify border/radius/spacing
  tokens; Delete becomes `.btn-ghost`.
- **New List** (`NewList.tsx`): field labels use the gold-caps `--fs-xs` treatment consistently;
  consider OWB-style quick-pick points chips (500/1000/1500/2000/2500) **only if** it fits without
  adding rules complexity — otherwise leave the input as-is (YAGNI; flag as optional, not required).
- **Summary panel** (`SummaryPanel.tsx`): points total to ink; % bars keep gold/blood semantics
  (under-min = warning gold, over-cap = error red); consistent spacing.
- **Dialogs** (`AddUnitDialog`, `ExportDialog`, `InfoDialog`, `RuleDialog`): consistent header,
  border, radius, button hierarchy, spacing tokens.
- **Header/footer**: spacing + label tokens; leather banner + gold rule unchanged.

---

## Non-goals (YAGNI)

- No change to the rules engine, validation messages, points math, i18n strings, or data files.
- No dark mode, no theme switcher, no new fonts beyond the existing Cinzel/Spectral.
- No new dependencies, no CSS framework, no component library extraction.
- No restructuring of `App.tsx` routing or state.
- The New List quick-pick chips are optional, not required.

---

## Testing & verification

- `npx tsc --noEmit -p tsconfig.app.json` clean and `npm test` green (the suite is logic/data; CSS
  changes should not affect it — if a test relies on a class name or DOM structure that changes,
  update the test).
- Live verification via the preview tools on a **separate port** (5199 — the user runs their own dev
  server on 5173; do not disturb it): screenshot Home, New List, the editor (collapsed + expanded
  unit with a mount selected), each dialog, and the Muster Check in both EN and ES, at desktop and
  at 375px mobile. Before/after comparison against the mockups in this spec.
- No regressions in: mount selection + points folding, magic-item selection, validation
  errors/warnings rendering, EN/ES toggle.

## Definition of done

Every screen reflects the foundations (accent discipline, type/spacing scale, unified borders, button
hierarchy); the editor stat strip + mount chips match the approved mockups; mobile header doesn't
wrap and tap targets are comfortable; identity (parchment/gold/leather/Cinzel) is intact; tsc + tests
green; live screenshots confirm EN/ES + desktop/mobile.
