import type { Army, RuleViolation, UnitProfile } from '../data/types'

export type EquipSlot = 'melee' | 'missile' | 'armourBody' | 'shield' | 'mount' | 'barding'

// Fix 1: single authoritative lists for the two melee sub-families.
// Two-handed great weapons: strike last, cannot use a shield.
const MELEE_TWO_HANDED = ['great weapon', 'two-handed', 'weapons with two hands', 'two hands', 'a dos manos', 'double-handed']
// Other close-combat weapons (one-handed / dual-wield) that may combine with a shield.
const MELEE_OTHER = ['additional hand weapon', 'two hand weapons', 'halberd', 'spear', 'lance', 'flail', 'mangual', 'alabarda', 'lanza', 'arma de mano adicional']

// Substring match on the lowercased name (like findRule). Order: specific before
// generic, and barding before mount so "Barding (steeds)" → barding not mount.
const SLOT_KEYWORDS: ReadonlyArray<readonly [EquipSlot, readonly string[]]> = [
  // Spanish: "armadura" covers Armadura Ligera / Pesada / del Caos (all body armour)
  ['armourBody', ['light armour', 'heavy armour', 'armadura']],
  // Spanish: "escudo" covers Escudos
  ['shield', ['shield', 'escudo']],
  ['barding', ['barding']],
  // Spanish: "corcel" covers Corceles de Slaanesh
  ['mount', ['warhorse', 'elven steed', 'cold one', 'giant wolf', 'war boar',
             'giant spider', 'pegasus', 'dragon', 'nightmare mount', 'steed',
             'may ride', 'rides a', 'corcel']],
  ['missile', ['short bow', 'longbow', 'long bow', 'crossbow', 'bow', 'sling',
               'javelin', 'throwing star', 'pistol', 'blowpipe']],
  // Spanish: "alabarda" = halberd, "lanza" = spear,
  //          "arma de mano adicional" = additional hand weapon.
  // Two-handed keywords come from MELEE_TWO_HANDED; one-handed from MELEE_OTHER.
  // GREAT_WEAPON_KW is defined as MELEE_TWO_HANDED so they can never drift apart.
  ['melee', [...MELEE_TWO_HANDED, ...MELEE_OTHER]],
]

export function classifyOption(name: string): EquipSlot | undefined {
  const n = name.toLowerCase()
  for (const [slot, kws] of SLOT_KEYWORDS) {
    if (kws.some((k) => n.includes(k))) return slot
  }
  return undefined
}

// Option names intentionally NOT subject to the 4 equipment families
// (command group upgrades: Champion/Standard Bearer/Musician;
//  gunpowder & war-machine weapons: Handgun, Organ Gun, Cannon, etc.;
//  crew-only upgrades; misc non-equipment upgrades like wizard levels,
//  battle standard bearer, special mounts that are monsters/chariots).
// Filled from the first coverage run; each entry confirmed genuinely irrelevant.

// Exact option names to ignore.  Keep this list for names that do NOT share a
// common substring with any legitimate equipment option.
export const IGNORED_OPTION_NAMES: readonly string[] = [
  // ── Command group ──────────────────────────────────────────────────────────
  'Champion',
  'Standard Bearer',
  'Musician',

  // ── Chaos-specific non-equipment upgrades ──────────────────────────────────
  'Marca de Khorne',
  'Marca de Nurgle',
  'Marca de Slaanesh',
  'Marca de Tzeentch',

  // ── Misc weapons / upgrades outside the 4 equipment families ─────────────
  'Nets',               // skaven nets — no net family
  'Ruedas con Cuchillas', // scythed wheels — chariot upgrade (Chaos)
  'Scythed wheels',     // scythed wheels — chariot upgrade (Undead/High Elves)

  // ── Crew-only upgrades ────────────────────────────────────────────────────
  'Additional Skink crewman',       // lizardmen war-engine crew

  // ── Rune / magic-item upgrades ────────────────────────────────────────────
  'Rune of Stone (Paladin)',  // dwarf rune upgrade — magic item, not equipment

  // ── Unit-champion upgrades (not a mount; whole unit is already that creature) ─
  'Great Spectral Wolf',  // vampire counts: champion upgrade for Dire Wolves pack

  // ── Ammunition / weapon-modifier upgrades (not a distinct missile weapon) ────
  'Poisoned arrows / javelin tips (S4)',  // lizardmen skinks: poison modifier, not a weapon
  'Poisoned arrows / javelins (S4)',       // lizardmen terradons: poison modifier, not a weapon
]

// Lowercase substring patterns for wizard / mage-level upgrade options.
// Applied to the lowercased option name via .includes().  Each pattern was
// verified against all 14 army files: zero false positives against real
// equipment option names.
//   'nivel'           — Spanish level upgrades (Nivel 2/3/4 …)
//   'wizard level'    — English level upgrades across all armies
//   'wizard champion' — Bretonnia / Dogs of War level 2
//   'wizard lord'     — Bretonnia / Dogs of War level 4
//   'master wizard'   — Bretonnia / Dogs of War level 3
//   'mage-priest'     — Lizardmen Slann level upgrades
export const IGNORED_OPTION_PATTERNS: readonly string[] = [
  'nivel',
  'wizard level',
  'wizard champion',
  'wizard lord',
  'master wizard',
  'mage-priest',
]

// Two-handed great weapons (always-strike-last, no shield).
// Defined as MELEE_TWO_HANDED so it can never drift from the melee classification.
const GREAT_WEAPON_KW = MELEE_TWO_HANDED

/** True if an option name is intentionally outside the equipment families
 *  (command, wizard levels, marks, crew, additive "extra N …" quantity upgrades, etc.). */
export function isIgnoredOption(name: string): boolean {
  const n = name.toLowerCase()
  return n.startsWith('extra ')
    || IGNORED_OPTION_NAMES.includes(name)
    || IGNORED_OPTION_PATTERNS.some((p) => n.includes(p))
}

export function checkEquipmentCombo(optionIds: string[], unit: UnitProfile): RuleViolation[] {
  const v: RuleViolation[] = []

  // Classify each chosen option once, then derive per-slot views.
  // Ignored options (command, wizard levels, marks, "extra N …" etc.) are excluded
  // from all slot counts — they must not count in ANY slot.
  const chosen = (unit.options ?? []).filter((o) => optionIds.includes(o.id))
  const tagged = chosen.map((o) => ({
    o,
    slot: isIgnoredOption(o.name) ? undefined : classifyOption(o.name),
  }))
  const inSlot = (s: EquipSlot) => tagged.filter((t) => t.slot === s).map((t) => t.o)

  const melee = inSlot('melee'), missile = inSlot('missile')
  const armour = inSlot('armourBody'), shields = inSlot('shield')
  const mounts = inSlot('mount'), bardings = inSlot('barding')
  const add = (rule: string, message: string) => v.push({ severity: 'warning', rule, message })

  if (melee.length > 1) add('equip-melee-multiple', `Multiple melee weapons: ${melee.map((o) => o.name).join(', ')}`)
  if (missile.length > 1) add('equip-missile-multiple', `Multiple missile weapons: ${missile.map((o) => o.name).join(', ')}`)
  if (armour.length > 1) add('equip-armour-multiple', `Multiple body armours: ${armour.map((o) => o.name).join(', ')}`)
  const hasGreatWeapon = melee.some((o) => GREAT_WEAPON_KW.some((k) => o.name.toLowerCase().includes(k)))
  if (hasGreatWeapon && shields.length > 0) add('equip-greatweapon-shield', 'Great weapon cannot be combined with a shield')
  if (mounts.length > 1) add('equip-mount-multiple', `Multiple mounts: ${mounts.map((o) => o.name).join(', ')}`)
  // Only flag barding-without-mount when the unit actually offers a mount as an option.
  // If the unit has barding options but NO mount option, it is a base-mounted cavalry
  // regiment (e.g. Wight Cavalry, Wood Elf Knights, Tiranoc Chariot) that adds barding
  // to its existing mounts — not a violation.  Characters that offer both a mount option
  // AND a barding option are correctly checked: barding without selecting the mount is illegal.
  // "Extra N <steed>" options (e.g. "Extra 2 Elven Steeds" on the Tiranoc Chariot) are
  // additive quantity upgrades, not primary mount-purchase options; exclude them via isIgnoredOption.
  const unitHasMountOption = (unit.options ?? []).some(
    (o) => !isIgnoredOption(o.name) && classifyOption(o.name) === 'mount',
  )
  if (bardings.length > 0 && mounts.length === 0 && unitHasMountOption)
    add('equip-barding-no-mount', 'Barding requires a mount')
  return v
}

export function unclassifiedOptions(army: Army): string[] {
  const out = new Set<string>()
  for (const u of army.units)
    for (const o of u.options ?? []) {
      if (classifyOption(o.name) !== undefined) continue
      if (isIgnoredOption(o.name)) continue
      out.add(o.name)
    }
  return [...out]
}
