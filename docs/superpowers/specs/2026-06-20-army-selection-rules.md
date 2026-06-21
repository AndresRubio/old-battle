# Army-Book Selection Rules — Extraction (Phase 2 Task 6)

**Date:** 2026-06-20
**Status:** Extraction complete; pending review → field-set decision → enforcement plan
**Source:** the 14 original Spanish (one English: Dogs of War, Lizardmen) GW 5th-ed army books in `~/Downloads/`, re-read page-by-page on 2026-06-20.

This is the discovery deliverable for Phase 2 of the Rules-Fidelity Pass
(`2026-06-20-rules-fidelity-pass-design.md`). It records, per army, every
**mechanically-checkable list-building constraint** the book states, cross-checked
against the current `src/data/armies/*.ts`. The synthesis at the end classifies
every finding and decides the `SelectionRules` field set (YAGNI).

> **What the engine already enforces** (so most findings need no new code):
> - Per-unit `max` caps → rule `unit-max` (warning). `validate.ts:140`.
> - Per-army composition % (characters/regiments/war-machines/monsters) → reads
>   `army.composition`. `validate.ts:82`. Deviations are **data fixes**, not logic.
> - One General, valid General → `no-general` / `multiple-generals` / `invalid-general`.
> - Magic-item count/category/uniqueness → Phase 1.
> - Wizard levels are capped by each unit's level-upgrade option ladder (all top at L4).

---

## Per-army findings

### Bretonnia
- **Composition deviation (DATA FIX):** book sets **Characters 0–75%** (p.59–60), not 50%; **no war machines allowed** (p.59); Knights ≥25%, Commoners 0–50%, Monsters 0–25%. Current `bretonnia.ts` uses `STANDARD_5E_COMPOSITION` (50% / war-machines 25%).
- Max wizard level: 4 (correct). 0-1 caps `br-grail-knights`, `br-questing-knights`, `br-battle-standard` all correct.
- Knights Errant: only one unit may carry a magic standard (per-type) — correctly noted on `br-knights-errant`.
- Allies 0–25% (Wood Elf/Empire/Dwarf/High Elf) — not modeled (no ally system). Deferred.

### Chaos
- Max wizard level 4 (correct). 0-1 caps `ch-battle-standard`, `ch-beast-battle-standard`, `ch-daemon-bsb`, `ch-bestigors` all correct.
- **`ch-harpies` missing 0-1 cap (CONDITIONAL — DEFER):** book caps Harpies at one unit *unless the General is a Beastman Warlord* (p.118). An unconditional `max:1` would false-positive Beastman-led armies; the conditional is out of simple-`max` scope. Document, don't enforce yet.
- Mark/host-composition gating (Khorne has no sorcerers — already correct in data; mono-god Greater-Daemon hosts; "requires unit X present" for Ogres/Chariots/Minotaurs) — conditional, deferred.

### Chaos Dwarfs
- **`cd-battle-standard` missing `max:1` (DATA FIX):** book heading "0-1 ESTANDARTE DE BATALLA" (p.56).
- **`cd-bull-centaurs` missing magic-standard option (DATA FIX, magic-item scope):** book p.58 grants Bull Centaurs a magic standard; data only has it on `cd-warriors`.
- 0-1 caps `cd-bull-centaur-commander`, `cd-black-orcs`, and the 3 special characters all correct. Max wizard level 4 correct.
- Must include ≥1 Chaos Dwarf Warriors regiment (p.58); Hobgoblin Hero requires ≥1 Hobgoblin regiment (p.57) — conditional/must-include, deferred.

### Dark Elves
- All 0-1 caps correct (`de-executioners`, `de-black-guard`, `de-harpies` (+`noCommand`), `de-cauldron-of-blood`). Max wizard level 4 correct.
- **`de-hellebron` missing dependency note (MINOR DATA):** book requires a Witch Elf regiment (p.60); other special-char dependencies (Kouran→Black Guard, Tullaris→Executioners) are already noted. Add the note for parity. Enforcement of the dependency itself = deferred (conditional).
- Repeater Bolt Throwers: max 2 per regiment of 10+ (p.54) — ratio cap, deferred.

### Dogs of War
- **Composition deviation (DATA FIX):** book uses **Characters 0–35% / Regiments of Renown 65%+** (printed p.27); no monster/war-machine/ally categories. Current data uses `STANDARD_5E_COMPOSITION`.
- 0-1 `dow-paymaster` correct. All Regiments of Renown + special characters are `max:1` (unique) — correct ("There Can Be Only One", p.23). `dow-long-drong` `maxSize:20` correct.
- "Must include a Mercenary General" — universal must-include (covered by `requiresGeneral`).

### Dwarfs
- Max wizard level: n/a (no wizards) — correct. All single-unit 0-1 caps correct (`dw-longbeards`, `dw-hammerers`, `dw-ironbreakers`, `dw-miners`, `dw-battle-standard`, `dw-anvil-of-doom`).
- **Runesmith 0-1 is per-id, should be combined (NEW — group cap):** book caps the *combined* total of `dw-runesmith` + `dw-master-runesmith` + `dw-rune-lord` to **one** (p.84). Current per-id `max:1` allows one of each.
- Slayer regiments ≤ number of normal warrior-type regiments (p.87) — cross-unit ratio, deferred. Allies 0–25% (4 lists) — deferred. Gotrek+Felix must be fielded together — conditional, noted.

### Empire
- **No discrepancies.** Every 0-1 cap correct, plus `emp-steam-tank` `max:8` and `emp-halfling-hot-pot` `max:1`. Max wizard level 4 correct. Halfling Hot Pot / Zarina-Kislev dependencies noted. Allies restricted to 4 lists — deferred.

### High Elves
- Max wizard level 4 correct. All 0-1 caps correct (`he-battle-standard`, `he-dragon-princes`, `he-white-lions`, `he-phoenix-guard`, `he-sword-masters`).
- **`he-shadow-warriors` missing cap (NEW — ratio, DEFER):** count ≤ (Lancers + Archers regiments), waived vs Dark Elves (p.78). Conditional waiver → deferred.
- Repeater Bolt Throwers ≤ (Archers+Lancers+Sea Guard), min 2 (p.79) — ratio with floor, deferred. Dragon Princes magic standard at half cost — noted.

### Lizardmen
- **Composition deviation (DATA FIX):** **no war machines, no allies** (p.72). Current data uses `STANDARD_5E_COMPOSITION` (war-machines 25%).
- Max wizard level: Slann to L4 correct; Skink Shaman L1-only modeled as `wizard2` (2 items) — correct per book.
- **Per-Slann ratio caps (NEW — DEFER):** Temple Guard 1 unit per Slann (`lz-temple-guard` static `max:1` — correct only for 1-Slann armies); Terradons 1 per Slann (`lz-terradons` has no `max`). Stegadons/Salamanders scale with other unit counts. Ratio caps → deferred.

### Orcs & Goblins
- Max wizard level 4 correct. All 0-1 caps correct (`og-big-uns`, `og-black-orcs`, `og-squig-hunters`, `og-night-goblin-nets-clubs`, the 6 BSB variants).
- War-machine "requires unit X" gating, Fanatics/Squig-Hopper per-NG-unit counts — all already noted in data as text. Race-matching for characters, Troll/Snotling unit-scaling, allies — deferred (conditional/ratio).

### Skaven
- **No discrepancies.** All 0-1 caps correct (`sk-battle-standard`, `sk-stormvermin`, `sk-sewer-runners`). Max wizard level 4 (Grey Seer), warlocks capped at L3 — correct. Plague Priest per-Plague-Monk-regiment, Censer Bearers ≤ half (max 10), Rat Swarm pricing, one Bell per Grey Seer — all noted in text. Ratio enforcement deferred.

### Undead
- No 0-1 unit caps in the book (explicit, p.77) — data correctly has none. Max wizard level 4 via General.
- **`ud-necromancer` may over-offer L4 (VERIFY/DATA FIX):** non-general Necromancer caps at **L3 (Maestro)** per book (p.80); only the General is L4. Verify the base-necromancer upgrade ladder and trim L4 if present.
- Isabella requires Vlad (p.88) — conditional dependency, noted, deferred.

### Vampire Counts
- Max wizard level 4 correct. `vc-spectral-host`, `vc-black-coach` 0-1 correct.
- **Battle Standard 0-1 is per-variant, should be combined (NEW — group cap):** book caps the BSB *role* to one (p.63) but data gives `vc-vampire-bsb` and `vc-wight-bsb` independent `max:1`, allowing 2 BSBs.
- Vampire Bats ≤ (Zombie+Skeleton+Grave-Guard+Ghoul+Black-Knight units); Spectral Maidens 1/1000 pts; Bat Swarm pricing — ratio caps, deferred. Krell/Kemmler, Isabela/Vlad, Walach dependencies — noted, deferred.

### Wood Elves
- Max wizard level 4 correct. `we-waywatchers`, `we-battle-standard` 0-1 correct; all special characters `max:1`.
- **`we-treeman` missing cap (NEW — ratio, DEFER):** 1 per 1,000 pts, absolute max 3 (p.68). Currently text-only.
- Allies 0–25% (4 lists) — deferred.

---

## Synthesis — recurring rule types & field-set decision

| Rule type | Armies affected | Already modeled? | Decision |
|---|---|---|---|
| **Composition % deviation** | Bretonnia (75% chars, no WM), Dogs of War (35/65), Lizardmen (no WM) | Yes — `army.composition` | **FIX DATA** now (no new model) |
| **Combined cap across unit variants** | Dwarfs (3 Runesmith types ≤1), Vampire Counts (2 BSB variants ≤1) | No — per-id `max` can't express it | **NEW**: `SelectionRules.unitGroupCaps` + validator |
| **Single-unit 0-1 missed** | Chaos Dwarfs (`cd-battle-standard`) | Field exists, value missing | **FIX DATA** (`max:1`) now |
| **Wizard level over-offered** | Undead (`ud-necromancer` L3 cap) | Via option ladder | **VERIFY → FIX DATA** if wrong |
| **Per-points ratio cap** | Wood Elves Treeman (1/1000, ≤3), VC Spectral Maidens (1/1000) | No | **DEFER** (own plan) |
| **Per-other-unit-count ratio cap** | Lizardmen (per Slann), VC (bats), High Elves (bolt throwers/shadow warriors), Dark Elves (bolt throwers) | No | **DEFER** (own plan) |
| **Conditional caps / waivers** | Chaos Harpies (unless Beastman Gen), HE Shadow Warriors (waived vs DE) | No | **DEFER** (conditional) |
| **Special-character dependencies** | DE, Undead, VC, Dwarfs, O&G, etc. | Text notes only | **DEFER** (conditional) |
| **Race-matching for characters** | Orcs & Goblins | Text notes | **DEFER** (conditional) |
| **Allies (foreign-list contingents)** | nearly all | No ally system at all | **OUT OF SCOPE** |

### Chosen `SelectionRules` field set (YAGNI)

Only **one** genuinely new rule type recurs with a clean, non-conditional, simple
shape across ≥2 armies: a **combined cap over a set of unit ids**. Everything else
is either an existing-field data fix or a complex/conditional rule that belongs in
its own follow-up plan.

```ts
interface SelectionRules {
  /**
   * Caps on the COMBINED count of several unit variants that the book treats as
   * a single 0-N slot (e.g. all Runesmith ranks together; either Battle Standard
   * variant). Per-unit `max` cannot express this. Validated as rule
   * `unit-group-max` (warning), mirroring the existing `unit-max` severity.
   */
  unitGroupCaps?: {
    ids: string[]
    max: number
    labelEn: string
    labelEs: string
  }[]
}
```

Populated for exactly two armies:
- **Dwarfs:** `{ ids: ['dw-runesmith','dw-master-runesmith','dw-rune-lord'], max: 1, labelEn: 'Runesmiths', labelEs: 'Herreros Rúnicos' }`
- **Vampire Counts:** `{ ids: ['vc-vampire-bsb','vc-wight-bsb'], max: 1, labelEn: 'Battle Standard Bearer', labelEs: 'Portaestandarte de Batalla' }`

Fields considered and **dropped** (no army needs them, YAGNI):
`maxWizardLevel` (already capped by option ladders), `maxCharacters` (no army caps
character *count*), `maxMagicStandards` (no army states an army-wide banner cap).

### Immediate enforcement scope (this pass)
1. **Composition data fixes:** Bretonnia (`maxCharactersPct:75`, `maxWarMachinesPct:0`), Dogs of War (`maxCharactersPct:35`, `minRegimentsPct:65`), Lizardmen (`maxWarMachinesPct:0`).
2. **`SelectionRules.unitGroupCaps`** model + `unit-group-max` validator block (+ tests), wired into Dwarfs and Vampire Counts.
3. **Single-value data fixes:** `cd-battle-standard` `max:1`; verify & (if wrong) trim `ud-necromancer` L4; add `de-hellebron` dependency note; add `cd-bull-centaurs` magic-standard option.

### Deferred to a follow-up plan (`2026-06-2x-army-ratio-rules.md`)
Per-points and per-unit-count **ratio caps** (Treeman, per-Slann, bolt-throwers,
shadow warriors, vampire bats, spectral maidens), **conditional caps/waivers**,
**special-character dependencies**, **race-matching**, and **allies**. These need a
richer model and per-rule UI affordances; bundling them here would violate YAGNI and
the single-shippable-increment principle.
