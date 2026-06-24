import type { Army, EquipmentOption, MountOption, ProfileBlock, UnitProfile } from '../types'
import { STANDARD_5E_COMPOSITION } from '../types'
import { COMMON_MAGIC_ITEMS } from '../magicItems'

// Vampire Counts — data transcribed from "Ejércitos Warhammer: Condes Vampiro"
// (Games Workshop España, 1999, by Tuomas Pirinen & Alessio Cavatore), the
// 5th-edition army supplement. Points, profiles, equipment costs and 0-1 limits
// are taken directly from the army list ("El Ejército de los Condes Vampiro",
// printed pp.59-67; PDF pages offset +2 from printed folios) and the Liber
// Mortis bestiary (printed pp.49-58), plus the special characters section
// ("La Aristocracia de la Noche", printed pp.69-79).
//
// NOTE: the book gives Movement in centimetres; values here are converted to the
// inches used elsewhere in the app (10cm→4", 15→6", 20→8", 22→9").
// Stat columns in the book: M / HA(WS) / HP(BS) / F(S) / R(T) / H(W) / I / A / L(Ld).
// Cavalry profiles list rider and mount separately; M here uses the mount's M.
//
// Magic-item allowances (army list p.59): Señor de los Vampiros 3, Conde Vampiro 2,
// Vampiro Neonato 1; Gran Nigromante 4, Maestro Nigromante 3, Paladín Nigromante 2,
// Nigromante 1; Espectro / Señor Tumulario / Esqueleto Paladín 1 each.
//
// Wizard levels from the army list text (p.62–63):
//   Señor de los Vampiros — nivel 3 (3 spells)
//   Conde Vampiro        — nivel 2 (2 spells)
//   Gran Nigromante      — nivel 4 (4 spells)
//   Maestro Nigromante   — nivel 3 (3 spells)
//   Paladín Nigromante   — nivel 2 (2 spells)
//   Nigromante           — nivel 1 (1 spell)

// ── Army-specific equipment options ──────────────────────────────────────────
// Per-model costs printed in the regiment option lines (pp.62–66).
// Same `id` = a mutually-exclusive wargear slot reused across units.
const SHIELD_1: EquipmentOption = { id: 'shield', name: 'Shield', pointsPerModel: 1 }
const LIGHT_ARMOUR_2: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 2 }
const HEAVY_ARMOUR_2: EquipmentOption = { id: 'heavy-armour', name: 'Heavy armour', pointsPerModel: 2 }
const HEAVY_ARMOUR_3: EquipmentOption = { id: 'heavy-armour', name: 'Heavy armour', pointsPerModel: 3 }
const SPEARS_1: EquipmentOption = { id: 'spears', name: 'Spear', pointsPerModel: 1 }
const HALBERD_2: EquipmentOption = { id: 'halberd', name: 'Halberd', pointsPerModel: 2 }
const TWO_HAND_2: EquipmentOption = { id: 'two-hand', name: 'Two-handed weapon', pointsPerModel: 2 }
const CAV_LANCE_2: EquipmentOption = { id: 'cav-lance', name: 'Cavalry lance', pointsPerModel: 2 }
const BARDING_2: EquipmentOption = { id: 'nightmare-barding', name: 'Nightmare barding', pointsPerModel: 2 }
// Wight Cavalry: heavy armour +2, barding +8 (replaces light armour + barding)
const HEAVY_ARMOUR_CAV_2: EquipmentOption = { id: 'heavy-armour', name: 'Heavy armour', pointsPerModel: 2 }
const BARDING_8: EquipmentOption = { id: 'nightmare-barding', name: 'Nightmare barding', pointsPerModel: 8 }
// Great Spectral Wolf — flat upgrade, acts as unit champion (no magic items)
const GREAT_SPECTRAL_WOLF: EquipmentOption = {
  id: 'great-spectral-wolf',
  name: 'Great Spectral Wolf',
  pointsPerModel: 25,
  flat: true,
}

// ── Character mounts ─────────────────────────────────────────────────────────
// Replaces the old `nightmare-mount` (+2, flat) EquipmentOption used by several
// characters (army list pp.62–66). The Nightmare costs +2 pts; characters who
// could also pay for barding (+2) keep that as an EquipmentOption since it is a
// wargear upgrade, not a separate mount. Vampires (and Necrarchs) may instead
// ride a Hellsteed (Corcel Infernal — a winged Nightmare, Flying), a Winged
// Nightmare, or a Zombie Dragon; Necromancers ride only a Nightmare on foot.
// Nightmare statline per the bestiary as used in the app (M20→8").
const NIGHTMARE_STATS = { M: 8, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 4 } as const
const NIGHTMARE_MOUNT: MountOption = {
  id: 'mount-nightmare', name: 'Nightmare', nameEs: 'Pesadilla',
  points: 2, statLine: { ...NIGHTMARE_STATS },
}
const HELLSTEED_MOUNT: MountOption = {
  id: 'mount-hellsteed', name: 'Hellsteed', nameEs: 'Corcel Infernal',
  points: 12, statLine: { ...NIGHTMARE_STATS },
  specialRules: ['Flying'],
}
const WINGED_NIGHTMARE_MOUNT: MountOption = {
  id: 'mount-winged-nightmare', name: 'Winged Nightmare', nameEs: 'Pesadilla Alada',
  points: 100, statLine: { M: 8, WS: 3, BS: 0, S: 5, T: 5, W: 3, I: 2, A: 3, Ld: 5 },
  specialRules: [
    'Undead',
    'Flying',
    'Causes fear',
    'Charge — +2 Strength on the turn it charges (spikes and fangs)',
  ],
}
const ZOMBIE_DRAGON_MOUNT: MountOption = {
  id: 'mount-zombie-dragon', name: 'Zombie Dragon', nameEs: 'Dragón Zombi',
  points: 500, statLine: { M: 4, WS: 4, BS: 0, S: 7, T: 6, W: 7, I: 3, A: 6, Ld: 8 },
  specialRules: [
    'Undead',
    'Flying',
    'Terror',
    'Large target',
    'Breath weapon',
    'Scaly skin (5+ armour save, never reduced by Strength)',
    'Cloud of Flies — enemies in base contact suffer -1 to hit in close combat',
  ],
}

/** Vampires & Necrarchs: a Nightmare, a Hellsteed, a Winged Nightmare or a Zombie Dragon. */
const VAMPIRE_MOUNTS: MountOption[] = [
  NIGHTMARE_MOUNT, HELLSTEED_MOUNT, WINGED_NIGHTMARE_MOUNT, ZOMBIE_DRAGON_MOUNT,
]
/** Necromancers (living): a Nightmare only. */
const NECROMANCER_MOUNTS: MountOption[] = [NIGHTMARE_MOUNT]
/** Wraith / Wight Lord: a Nightmare only (when leading Wight Cavalry). */
const NIGHTMARE_ONLY_MOUNTS: MountOption[] = [NIGHTMARE_MOUNT]

// ── Fixed (non-selectable) mount profiles for special characters ─────────────
// Display-only: cost already baked into the model's points.
const MANTICORE_PROFILE: ProfileBlock = {
  name: 'Manticore', nameEs: 'Mantícora',
  statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 },
  specialRules: ['Flying', 'Terror', 'Large target'],
}
const MANFRED_NIGHTMARE_PROFILE: ProfileBlock = {
  name: 'Nightmare', nameEs: 'Pesadilla',
  statLine: { M: 8, WS: 2, BS: 0, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 4 },
}
const MELKHIOR_NIGHTMARE_PROFILE: ProfileBlock = {
  name: 'Winged Nightmare', nameEs: 'Pesadilla Alada',
  statLine: { M: 8, WS: 3, BS: 0, S: 5, T: 5, W: 3, I: 2, A: 3, Ld: 5 },
  specialRules: ['Flying'],
}
const WALACH_NIGHTMARE_PROFILE: ProfileBlock = {
  name: 'Nightmare (with barding)', nameEs: 'Pesadilla (con barda)',
  statLine: { M: 8, WS: 2, BS: 0, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
}

const units: UnitProfile[] = [
  // ═══════════════════════════════════════════════════════
  // PERSONAJES — Characters (0–50%)
  // ═══════════════════════════════════════════════════════

  // ── 1 General Vampiro (mandatory; either Señor or Conde) ──────────────────
  {
    id: 'vc-vampire-lord',
    name: 'Vampire Lord',
    nameEs: 'Señor de los Vampiros',
    role: 'character',
    pointsPerModel: 350,
    statLine: { M: 6, WS: 8, BS: 6, S: 7, T: 6, W: 4, I: 9, A: 4, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard3',
    canBeGeneral: true,
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'May march and react to charges',
      'Level 3 wizard (Necromancy, Battle Magic or Dark Magic)',
      'Chooses vampiric powers from its Clan',
      'May ride a Nightmare, Hellsteed, Winged Nightmare or Zombie Dragon',
    ],
    options: [
      { id: 'great-weapon', name: 'Great weapon', pointsPerModel: 2 },
      { id: 'halberd-char', name: 'Halberd', pointsPerModel: 2 },
      { id: 'spear-char', name: 'Spear', pointsPerModel: 1 },
      { id: 'cav-lance-char', name: 'Cavalry lance', pointsPerModel: 2 },
      SHIELD_1,
      LIGHT_ARMOUR_2,
      { id: 'heavy-armour-char', name: 'Heavy armour', pointsPerModel: 3 },
      BARDING_2,
    ],
    mounts: VAMPIRE_MOUNTS,
  },
  {
    id: 'vc-vampire-count',
    name: 'Vampire Count',
    nameEs: 'Conde Vampiro',
    role: 'character',
    pointsPerModel: 185,
    statLine: { M: 6, WS: 7, BS: 5, S: 6, T: 5, W: 3, I: 8, A: 3, Ld: 9 },
    isCharacter: true,
    characterRank: 'wizard2',
    canBeGeneral: true,
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'May march and react to charges',
      'Level 2 wizard (Necromancy, Battle Magic or Dark Magic)',
      'Chooses two vampiric powers from its Clan',
      'May ride a Nightmare, Hellsteed, Winged Nightmare or Zombie Dragon',
    ],
    options: [
      { id: 'great-weapon', name: 'Great weapon', pointsPerModel: 2 },
      { id: 'halberd-char', name: 'Halberd', pointsPerModel: 2 },
      { id: 'spear-char', name: 'Spear', pointsPerModel: 1 },
      { id: 'cav-lance-char', name: 'Cavalry lance', pointsPerModel: 2 },
      SHIELD_1,
      LIGHT_ARMOUR_2,
      { id: 'heavy-armour-char', name: 'Heavy armour', pointsPerModel: 3 },
      BARDING_2,
    ],
    mounts: VAMPIRE_MOUNTS,
  },

  // ── Additional Vampiros (non-General) ────────────────────────────────────
  {
    id: 'vc-vampire-neonate',
    name: 'Vampire Neonate',
    nameEs: 'Vampiro Neonato',
    role: 'character',
    pointsPerModel: 70,
    statLine: { M: 6, WS: 6, BS: 4, S: 5, T: 5, W: 2, I: 7, A: 2, Ld: 8 },
    isCharacter: true,
    characterRank: 'champion',
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'May march and react to charges',
      'Chooses one vampiric power from its Clan',
      'May ride a Nightmare, Hellsteed, Winged Nightmare or Zombie Dragon',
    ],
    options: [
      { id: 'great-weapon', name: 'Great weapon', pointsPerModel: 2 },
      { id: 'halberd-char', name: 'Halberd', pointsPerModel: 2 },
      { id: 'spear-char', name: 'Spear', pointsPerModel: 1 },
      { id: 'cav-lance-char', name: 'Cavalry lance', pointsPerModel: 2 },
      SHIELD_1,
      LIGHT_ARMOUR_2,
      { id: 'heavy-armour-char', name: 'Heavy armour', pointsPerModel: 3 },
      BARDING_2,
    ],
    mounts: VAMPIRE_MOUNTS,
  },

  // ── Nigromantes (Necromancers) — living wizards; not Undead ──────────────
  {
    id: 'vc-great-necromancer',
    name: 'Great Necromancer',
    nameEs: 'Gran Nigromante',
    role: 'character',
    pointsPerModel: 310,
    statLine: { M: 4, WS: 4, BS: 4, S: 4, T: 4, W: 4, I: 6, A: 3, Ld: 9 },
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    specialRules: [
      'Living — not Undead; does not cause fear',
      'May march and react to charges',
      'Level 4 wizard (Necromancy, Battle Magic or Dark Magic)',
      'May ride a Nightmare',
    ],
    options: [
      { id: 'great-weapon', name: 'Great weapon', pointsPerModel: 2 },
      { id: 'halberd-char', name: 'Halberd', pointsPerModel: 2 },
      BARDING_2,
    ],
    mounts: NECROMANCER_MOUNTS,
  },
  {
    id: 'vc-master-necromancer',
    name: 'Master Necromancer',
    nameEs: 'Maestro Nigromante',
    role: 'character',
    pointsPerModel: 208,
    statLine: { M: 4, WS: 3, BS: 3, S: 4, T: 4, W: 3, I: 5, A: 2, Ld: 8 },
    isCharacter: true,
    characterRank: 'wizard3',
    canBeGeneral: true,
    specialRules: [
      'Living — not Undead; does not cause fear',
      'May march and react to charges',
      'Level 3 wizard (Necromancy, Battle Magic or Dark Magic)',
      'May ride a Nightmare',
    ],
    options: [
      { id: 'great-weapon', name: 'Great weapon', pointsPerModel: 2 },
      { id: 'halberd-char', name: 'Halberd', pointsPerModel: 2 },
      BARDING_2,
    ],
    mounts: NECROMANCER_MOUNTS,
  },
  {
    id: 'vc-necromancer-paladin',
    name: 'Necromancer Paladin',
    nameEs: 'Paladín Nigromante',
    role: 'character',
    pointsPerModel: 129,
    statLine: { M: 4, WS: 3, BS: 3, S: 4, T: 4, W: 2, I: 4, A: 1, Ld: 8 },
    isCharacter: true,
    characterRank: 'wizard2',
    canBeGeneral: true,
    specialRules: [
      'Living — not Undead; does not cause fear',
      'May march and react to charges',
      'Level 2 wizard (Necromancy, Battle Magic or Dark Magic)',
      'May ride a Nightmare',
    ],
    options: [
      { id: 'great-weapon', name: 'Great weapon', pointsPerModel: 2 },
      { id: 'halberd-char', name: 'Halberd', pointsPerModel: 2 },
      BARDING_2,
    ],
    mounts: NECROMANCER_MOUNTS,
  },
  {
    id: 'vc-necromancer',
    name: 'Necromancer',
    nameEs: 'Nigromante',
    role: 'character',
    pointsPerModel: 61,
    statLine: { M: 4, WS: 3, BS: 3, S: 3, T: 4, W: 1, I: 4, A: 1, Ld: 7 },
    isCharacter: true,
    characterRank: 'wizard1',
    canBeGeneral: true,
    specialRules: [
      'Living — not Undead; does not cause fear',
      'May march and react to charges',
      'Level 1 wizard (Necromancy, Battle Magic or Dark Magic)',
      'May ride a Nightmare',
    ],
    options: [
      { id: 'great-weapon', name: 'Great weapon', pointsPerModel: 2 },
      { id: 'halberd-char', name: 'Halberd', pointsPerModel: 2 },
      BARDING_2,
    ],
    mounts: NECROMANCER_MOUNTS,
  },

  // ── 0-1 Portaestandartes de Batalla (Battle Standard Bearers) ────────────
  {
    id: 'vc-vampire-bsb',
    name: 'Vampire Battle Standard Bearer',
    nameEs: 'Vampiro Portaestandarte de Batalla',
    role: 'character',
    pointsPerModel: 100,
    statLine: { M: 6, WS: 6, BS: 4, S: 5, T: 5, W: 2, I: 7, A: 2, Ld: 8 },
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    isBSB: true,
    max: 1,
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'May march and react to charges',
      'Carries the Army Battle Standard; may carry one magic standard',
      'Chooses one vampiric power from its Clan',
      'May ride a Nightmare, Hellsteed, Winged Nightmare or Zombie Dragon',
    ],
    options: [
      { id: 'great-weapon', name: 'Great weapon', pointsPerModel: 2 },
      { id: 'halberd-char', name: 'Halberd', pointsPerModel: 2 },
      { id: 'spear-char', name: 'Spear', pointsPerModel: 1 },
      { id: 'cav-lance-char', name: 'Cavalry lance', pointsPerModel: 2 },
      SHIELD_1,
      LIGHT_ARMOUR_2,
      { id: 'heavy-armour-char', name: 'Heavy armour', pointsPerModel: 3 },
      BARDING_2,
    ],
    mounts: VAMPIRE_MOUNTS,
  },
  {
    id: 'vc-wight-bsb',
    name: 'Wight Battle Standard Bearer',
    nameEs: 'Tumulario Portaestandarte de Batalla',
    role: 'character',
    pointsPerModel: 66,
    statLine: { M: 4, WS: 4, BS: 0, S: 4, T: 4, W: 2, I: 4, A: 2, Ld: 9 },
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    isBSB: true,
    max: 1,
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Cannot march',
      'Funerary weapons cause 1D3 wounds',
      'Carries the Army Battle Standard; may carry one magic standard',
      'May ride a Nightmare',
    ],
    options: [
      { id: 'great-weapon', name: 'Great weapon', pointsPerModel: 2 },
      { id: 'halberd-char', name: 'Halberd', pointsPerModel: 2 },
      { id: 'spear-char', name: 'Spear', pointsPerModel: 1 },
      { id: 'cav-lance-char', name: 'Cavalry lance', pointsPerModel: 2 },
      SHIELD_1,
      LIGHT_ARMOUR_2,
      { id: 'heavy-armour-char', name: 'Heavy armour', pointsPerModel: 3 },
      BARDING_2,
    ],
    mounts: NIGHTMARE_ONLY_MOUNTS,
  },

  // ── Paladines No Muertos (Undead Paladins — regiment champions) ──────────
  {
    id: 'vc-wraith',
    name: 'Wraith',
    nameEs: 'Espectro',
    role: 'character',
    pointsPerModel: 70,
    statLine: { M: 4, WS: 3, BS: 0, S: 3, T: 4, W: 3, I: 3, A: 2, Ld: 5 },
    isCharacter: true,
    characterRank: 'champion',
    specialRules: [
      'Undead',
      'Causes terror',
      'Immune to psychology',
      'Immune to poison',
      'Cannot march',
      'Ethereal — only harmed by magic weapons or daemons',
      'Chilling attack — no armour save allowed',
      'Armed with great scythe (counts as great weapon)',
      'Leads a Wight Cavalry, Zombie, Skeleton or Grave Guard unit',
      'May ride a Nightmare when leading Wight Cavalry',
    ],
    mounts: NIGHTMARE_ONLY_MOUNTS,
  },
  {
    id: 'vc-wight-lord',
    name: 'Wight Lord',
    nameEs: 'Señor Tumulario',
    role: 'character',
    pointsPerModel: 36,
    statLine: { M: 4, WS: 4, BS: 0, S: 4, T: 4, W: 2, I: 4, A: 2, Ld: 9 },
    isCharacter: true,
    characterRank: 'champion',
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Cannot march',
      'Funerary weapons cause 1D3 wounds',
      'Leads a Wight Cavalry, Zombie, Skeleton or Grave Guard unit',
      'May ride a Nightmare when leading Wight Cavalry',
    ],
    options: [
      { id: 'great-weapon', name: 'Great weapon', pointsPerModel: 2 },
      { id: 'halberd-char', name: 'Halberd', pointsPerModel: 2 },
      { id: 'spear-char', name: 'Spear', pointsPerModel: 1 },
      { id: 'cav-lance-char', name: 'Cavalry lance', pointsPerModel: 2 },
      SHIELD_1,
      LIGHT_ARMOUR_2,
      { id: 'heavy-armour-char', name: 'Heavy armour', pointsPerModel: 3 },
    ],
    mounts: NIGHTMARE_ONLY_MOUNTS,
  },
  {
    id: 'vc-skeleton-paladin',
    name: 'Skeleton Paladin',
    nameEs: 'Esqueleto Paladín',
    role: 'character',
    pointsPerModel: 20,
    statLine: { M: 4, WS: 3, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 2, Ld: 5 },
    isCharacter: true,
    characterRank: 'champion',
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Cannot march',
      'Equipped as the Skeleton unit it leads',
      'Leads a Skeleton unit only',
    ],
  },

  // ═══════════════════════════════════════════════════════
  // PERSONAJES ESPECIALES — Special Characters (0-1 each)
  // ═══════════════════════════════════════════════════════
  {
    id: 'vc-dieter-helsnicht',
    name: 'Dieter Helsnicht, the Doomlord',
    nameEs: 'Dieter Helsnicht, Señor de la Muerte',
    role: 'character',
    pointsPerModel: 690,
    statLine: { M: 4, WS: 4, BS: 4, S: 4, T: 4, W: 4, I: 6, A: 3, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    profiles: [MANTICORE_PROFILE],
    specialRules: [
      'Special character — replaces the army General',
      'Level 4 wizard; may freely mix Necromancy and Dark Magic spells',
      'Lord of Death — his Manticore never rolls on the Magically Dominated Monster table',
      'Rides a Manticore',
      'Fixed magic items: Skull Staff, Chaos Runic Sword, Power Scroll',
    ],
  },
  {
    id: 'vc-heinrich-kemmler',
    name: 'Heinrich Kemmler, the Lichemaster',
    nameEs: 'Heinrich Kemmler, el Señor de los Nigromantes',
    role: 'character',
    pointsPerModel: 450,
    statLine: { M: 4, WS: 4, BS: 4, S: 4, T: 4, W: 4, I: 6, A: 3, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character — replaces the army General; army may also include Krell',
      'Level 4 wizard; necromantic spells are automatically empowered',
      'Fights on foot',
      'Fixed magic items: Chaos Funerary Sword, Skull Staff, Cloak of the Lord of Necromancers',
    ],
  },
  {
    id: 'vc-krell',
    name: 'Krell, Lord of Undeath',
    nameEs: 'Krell, Señor de la No Muerte',
    role: 'character',
    pointsPerModel: 280,
    statLine: { M: 4, WS: 5, BS: 0, S: 4, T: 5, W: 3, I: 3, A: 3, Ld: 10 },
    isCharacter: true,
    characterRank: 'champion',
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character — only included when Kemmler is the General',
      'Undead',
      'Causes terror',
      'Immune to psychology',
      'Immune to poison',
      'Cannot march',
      'Fights on foot',
      'Fixed magic items: Armour of the Defender (5+ save, re-roll a failed save on 4+), Black Axe of Krell',
    ],
  },
  {
    id: 'vc-manfred-von-carstein',
    name: 'Manfred von Carstein',
    nameEs: 'Manfred von Carstein',
    role: 'character',
    pointsPerModel: 600,
    statLine: { M: 6, WS: 7, BS: 5, S: 6, T: 5, W: 3, I: 8, A: 3, Ld: 9 },
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    profiles: [MANFRED_NIGHTMARE_PROFILE],
    specialRules: [
      'Special character — may be the army General (not mandatory)',
      'Vampire — Level 4 wizard; may automatically re-cast any spell',
      'Vampiric powers: Iron Will, Raise the Tempest',
      'Rides a Nightmare',
      'Fixed magic items: Ebon Staff, Accursed Scroll',
    ],
  },
  {
    id: 'vc-melkhior',
    name: 'Melkhior, Elder of the Necrarch Clan',
    nameEs: 'Melkhior, Anciano del Clan Necrarca',
    role: 'character',
    pointsPerModel: 660,
    statLine: { M: 8, WS: 6, BS: 4, S: 6, T: 6, W: 4, I: 7, A: 4, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    profiles: [MELKHIOR_NIGHTMARE_PROFILE],
    specialRules: [
      'Special character — is the army General if included',
      'Vampire — Level 4 wizard; may re-cast any spell on a 3+',
      'Immune to psychology except Stupidity',
      'Causes terror (Supernatural Horror)',
      'Incarnation of Death — living creatures within 15cm suffer -1 Ld',
      'Rides a Winged Nightmare',
      'Fixed magic items: Bearer of Pain, Grimorium Necronium, Black Cloak of Lahmia',
    ],
  },
  {
    id: 'vc-neferata',
    name: 'Neferata, Queen of Shadows',
    nameEs: 'Neferata, Reina de las Sombras',
    role: 'character',
    pointsPerModel: 700,
    statLine: { M: 6, WS: 8, BS: 6, S: 7, T: 6, W: 4, I: 9, A: 4, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard3',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character — replaces the army General',
      'Vampire — Level 3 wizard (2 spells) plus unique Dark Blood spell',
      'Vampiric powers: Creature of the Night, Lost Innocence, Seduction, Blood Kiss',
      'Fights on foot',
      'Fixed magic items: Jade Dagger, Ruby of Lahmia, Bastet (familiar)',
    ],
  },
  {
    id: 'vc-vlad-von-carstein',
    name: 'Vlad von Carstein',
    nameEs: 'Vlad von Carstein',
    role: 'character',
    pointsPerModel: 680,
    statLine: { M: 6, WS: 8, BS: 6, S: 7, T: 6, W: 4, I: 9, A: 4, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard3',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character — replaces the army General; army may also include Isabela',
      'Vampire Lord (von Carstein Clan) — Level 3 wizard; possesses all von Carstein vampiric powers',
      'Eternal Love — enters murderous frenzy and hates the killer if Isabela is slain',
      'Fights on foot',
      'Fixed magic items: Ring of the von Carsteins, Thirsting Sword',
    ],
  },
  {
    id: 'vc-isabela-von-carstein',
    name: 'Isabela von Carstein',
    nameEs: 'Isabela von Carstein',
    role: 'character',
    pointsPerModel: 110,
    statLine: { M: 6, WS: 6, BS: 5, S: 6, T: 5, W: 2, I: 7, A: 2, Ld: 8 },
    isCharacter: true,
    characterRank: 'champion',
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character — only included when Vlad von Carstein is the General',
      'Vampire — vampiric powers: Hypnotism, Bat Form',
      'Eternal Love — enters murderous frenzy and hates the killer if Vlad is slain',
      'Fights on foot',
    ],
  },
  {
    id: 'vc-walach',
    name: 'Walach Harkon, the Black Star',
    nameEs: 'Walach la Estrella Negra',
    role: 'character',
    pointsPerModel: 550,
    statLine: { M: 8, WS: 9, BS: 6, S: 7, T: 6, W: 4, I: 9, A: 5, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard3',
    canBeGeneral: true,
    canBeBSB: true,
    max: 1,
    profiles: [WALACH_NIGHTMARE_PROFILE],
    specialRules: [
      'Special character — replaces both the army General AND the Battle Standard Bearer',
      'Vampire Lord (Blood Dragon Clan) — Level 3 wizard (2 spells)',
      'Vampiric powers: Rider of Death, Armour of the Knight, Master at Arms, Blood Fury (reflected in profile)',
      'Rides a Nightmare with barding',
      'Fixed magic items: Crimson Sword, Chalice of Blood, Blood Dragon Standard',
    ],
  },

  // ═══════════════════════════════════════════════════════
  // REGIMIENTOS — Regiments (25%+)
  // ═══════════════════════════════════════════════════════

  // Cavalry uses the mount's M value (Nightmare: 20cm → 8")
  {
    id: 'vc-wight-cavalry',
    name: 'Wight Cavalry',
    nameEs: 'Caballería Tumularia',
    role: 'regiment',
    pointsPerModel: 26,
    // Rider profile: M10→4" WS3 BS0 S3 T4 W1 I3 A1 Ld8
    // Mount (Nightmare): M20→8" WS2 BS0 S3 T3 W1 I2 A1 Ld5
    // Cavalry unit uses mount's M
    statLine: { M: 8, WS: 3, BS: 0, S: 3, T: 4, W: 1, I: 3, A: 1, Ld: 8 },
    minSize: 5,
    options: [CAV_LANCE_2, HEAVY_ARMOUR_CAV_2, BARDING_8],
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Cannot march',
      'Mounted on Nightmares; equipped with spear, hand weapon and light armour (5+ save)',
      'Funerary weapons cause 1D3 wounds',
      'May carry a magic standard',
    ],
  },
  {
    id: 'vc-grave-guard',
    name: 'Grave Guard',
    nameEs: 'Guardia de los Túmulos',
    role: 'regiment',
    pointsPerModel: 12,
    statLine: { M: 4, WS: 3, BS: 0, S: 3, T: 4, W: 1, I: 3, A: 1, Ld: 8 },
    minSize: 5,
    options: [HEAVY_ARMOUR_2, SPEARS_1, HALBERD_2, TWO_HAND_2],
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Cannot march',
      'Equipped with hand weapon, light armour and shield (5+ save)',
      'Funerary weapons cause 1D3 wounds',
      'May carry a magic standard',
    ],
  },
  {
    id: 'vc-skeletons',
    name: 'Skeletons',
    nameEs: 'Esqueletos',
    role: 'regiment',
    pointsPerModel: 8,
    statLine: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
    minSize: 5,
    options: [LIGHT_ARMOUR_2, HEAVY_ARMOUR_3, SHIELD_1, SPEARS_1, HALBERD_2, TWO_HAND_2],
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Cannot march',
      'Equipped with hand weapon',
      'May carry a magic standard',
    ],
  },
  {
    id: 'vc-zombies',
    name: 'Zombies',
    nameEs: 'Zombis',
    role: 'regiment',
    pointsPerModel: 5,
    statLine: { M: 4, WS: 2, BS: 0, S: 3, T: 3, W: 1, I: 1, A: 1, Ld: 5 },
    minSize: 5,
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Cannot march',
      'Horde — enemy may never envelop Zombies; Zombies always envelop the enemy flank',
    ],
  },
  {
    id: 'vc-spectral-host',
    name: 'Spectral Host',
    nameEs: 'Hueste Espectral',
    role: 'regiment',
    pointsPerModel: 75,
    // Each 40x40mm base: M10→4" WS2 BS0 S3 T3 W4 I1 A4 Ld5
    statLine: { M: 4, WS: 2, BS: 0, S: 3, T: 3, W: 4, I: 1, A: 4, Ld: 5 },
    minSize: 1,
    max: 1,
    noCommand: true,
    specialRules: [
      '0-1; 75 pts per 40×40mm base; all bases form a single unit',
      'Each base fights as a single large model with 4 Wounds and 4 Attacks',
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Cannot march',
      'Ethereal — only harmed by magic weapons or daemons',
    ],
  },
  {
    id: 'vc-ghouls',
    name: 'Ghouls',
    nameEs: 'Necrófagos',
    role: 'regiment',
    pointsPerModel: 6,
    statLine: { M: 4, WS: 2, BS: 0, S: 3, T: 4, W: 1, I: 3, A: 2, Ld: 5 },
    minSize: 5,
    noCommand: true,
    specialRules: [
      'Living — not Undead; subject to psychology',
      'Causes fear',
      'May march and flee voluntarily',
      'No command group; no character may join or lead them',
      'No break test while outnumbering the enemy',
      'Claws (no armour needed)',
    ],
  },
  {
    id: 'vc-spectral-wolves',
    name: 'Spectral Wolves',
    nameEs: 'Lobos Espectrales',
    role: 'regiment',
    pointsPerModel: 10,
    // Lobo Espectral: M22→9" WS3 BS0 S4 T3 W1 I2 A1 Ld4
    statLine: { M: 9, WS: 3, BS: 0, S: 4, T: 3, W: 1, I: 2, A: 1, Ld: 4 },
    minSize: 5,
    noCommand: true,
    options: [GREAT_SPECTRAL_WOLF],
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Cannot march',
      'No standard or musician',
      '+1 Attack on the turn they charge (2 Attacks on charge)',
      'Great Spectral Wolf (+25 pts, flat): WS4 S5 A2 (3 on charge); acts as unit Paladin (no magic items)',
    ],
  },
  {
    id: 'vc-vampire-bats',
    name: 'Vampire Bats',
    nameEs: 'Murciélagos Vampiro',
    role: 'regiment',
    pointsPerModel: 25,
    // Murciélago Vampiro: M5→2" (walking); Flying — use ground M as printed (5cm→2")
    statLine: { M: 2, WS: 3, BS: 0, S: 3, T: 3, W: 2, I: 3, A: 2, Ld: 5 },
    minSize: 1,
    noCommand: true,
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Flying — not driven off when beaten in combat',
      'Always skirmish',
      'No standard or musician',
      'Number of Vampire Bat units may not exceed the number of Zombie, Skeleton, Grave Guard, Ghoul and Wight Cavalry units combined',
    ],
  },
  {
    id: 'vc-spectral-maidens',
    name: 'Spectral Maidens',
    nameEs: 'Doncellas Espectrales',
    role: 'regiment',
    pointsPerModel: 100,
    // Doncella Espectral: M20→8" WS3 BS0 S3 T4 W2 I3 A2 Ld8
    statLine: { M: 8, WS: 3, BS: 0, S: 3, T: 4, W: 2, I: 3, A: 2, Ld: 8 },
    minSize: 1,
    maxSize: 1,
    noCommand: true,
    specialRules: [
      'Up to one Spectral Maiden per 1,000 full pts of army; always fight as individual models',
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Cannot march',
      'Ethereal — only harmed by magic weapons or daemons',
      'Spectral Lament — shooting attack 20cm range; target suffers 2D6+2 minus Ld wounds (no save)',
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 0-1 CARRUAJE NEGRO — Black Coach (chariot; counts in Regiments %)
  // ═══════════════════════════════════════════════════════
  {
    id: 'vc-black-coach',
    name: 'Black Coach',
    nameEs: 'Carruaje Negro',
    role: 'chariot',
    pointsPerModel: 200,
    // Carruaje Negro: M15→6" WS0 BS0 S7 T7 W5 I1 A0 Ld5
    // Conductor Espectral: M10→4" WS3 BS0 S3 T4 W3 I3 A2 Ld5
    // Pesadilla (×2): M20→8" WS2 BS0 S3 T3 W1 I2 A1 Ld5
    statLine: { M: 6, WS: 0, BS: 0, S: 7, T: 7, W: 5, I: 1, A: 0, Ld: 5 },
    max: 1,
    profiles: [
      { name: 'Coach (chassis)', nameEs: 'Carruaje (chasis)', statLine: { T: 7, W: 5 } },
      {
        name: 'Spectral Driver', nameEs: 'Conductor Espectral',
        statLine: { M: 4, WS: 3, BS: 0, S: 3, T: 4, W: 3, I: 3, A: 2, Ld: 5 },
        specialRules: ['Ethereal', 'Terror', 'Chilling attack — no armour save allowed'],
      },
      {
        name: 'Nightmares (×2)', nameEs: 'Pesadillas (×2)',
        statLine: { M: 8, WS: 2, BS: 0, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
      },
    ],
    specialRules: [
      '0-1; Undead chariot driven by a Spectral Wraith and pulled by 2 Nightmares',
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Conductor Espectral is ethereal, causes terror, and has chilling attack (no armour save)',
      'Causes 1D6 S7 impact hits on the charge',
      'Incarnation of Death — grows in power as it kills (see Liber Mortis table)',
      'Automatically destroyed if the General is slain',
      'May carry a magic standard (does not affect combat resolution)',
    ],
  },

  // ═══════════════════════════════════════════════════════
  // CRIATURAS DE LA NOCHE — Monsters (0–25%)
  // ═══════════════════════════════════════════════════════
  {
    id: 'vc-zombie-dragon',
    name: 'Zombie Dragon',
    nameEs: 'Dragón Zombi',
    role: 'monster',
    pointsPerModel: 500,
    // Dragón Zombi: M10→4" WS4 BS0 S7 T6 W7 I3 A6 Ld8
    statLine: { M: 4, WS: 4, BS: 0, S: 7, T: 6, W: 7, I: 3, A: 6, Ld: 8 },
    specialRules: [
      'Undead',
      'Causes terror',
      'Immune to psychology',
      'Immune to poison',
      'Flying — not driven off when beaten in combat',
      'Scaly skin (5+ armour save, never reduced by Strength)',
      'Pestilent Breath — wounds on 4+; only magic armour saves allowed',
      'Cloud of Flies — enemies in base contact suffer -1 to hit in close combat',
    ],
  },
  {
    id: 'vc-bat-swarm',
    name: 'Bat Swarm',
    nameEs: 'Enjambre de Murciélagos',
    role: 'monster',
    pointsPerModel: 100,
    // Murciélagos swarm: M20→8" WS3 BS0 S3 T2 W5 I1 A5 Ld10
    statLine: { M: 8, WS: 3, BS: 0, S: 3, T: 2, W: 5, I: 1, A: 5, Ld: 10 },
    specialRules: [
      '50 pts/base if number of bases does not exceed number of Vampires in army; 100 pts/base otherwise',
      'All Bat Swarm bases form a single unit',
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Flying swarm',
    ],
  },
  {
    id: 'vc-swarm',
    name: 'Swarms (Rats / Insects-Spiders)',
    nameEs: 'Enjambres (Ratas / Insectos-Arañas)',
    role: 'monster',
    pointsPerModel: 100,
    // Ratas: M15→6" WS3 BS0 S3 T2 W5 I1 A5 Ld10
    // Insectos/Arañas: M10→4" WS3 BS0 S3 T2 W5 I1 A5 Ld10  (same profile, different M)
    statLine: { M: 6, WS: 3, BS: 0, S: 3, T: 2, W: 5, I: 1, A: 5, Ld: 10 },
    specialRules: [
      '100 pts per base; 100 pts/base',
      'Rats: M6" WS3 S3 T2 W5 I1 A5 Ld10',
      'Insects/Spiders: M4" WS3 S3 T2 W5 I1 A5 Ld10',
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
    ],
  },
  {
    id: 'vc-winged-nightmare',
    name: 'Winged Nightmare',
    nameEs: 'Pesadilla Alada',
    role: 'monster',
    pointsPerModel: 100,
    // Pesadilla Alada: M20→8" WS3 BS0 S5 T5 W3 I2 A3 Ld5
    statLine: { M: 8, WS: 3, BS: 0, S: 5, T: 5, W: 3, I: 2, A: 3, Ld: 5 },
    specialRules: [
      'Undead',
      'Causes fear',
      'Immune to psychology',
      'Immune to poison',
      'Flying — not driven off when beaten in combat',
      'Charge — +2 Strength on the turn it charges (spikes and fangs)',
    ],
  },
  {
    id: 'vc-manticore',
    name: 'Manticore',
    nameEs: 'Mantícora',
    role: 'monster',
    pointsPerModel: 200,
    // Mantícora: M15→6" WS6 BS0 S7 T7 W5 I4 A4 Ld8
    statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 },
    specialRules: [
      'Flying',
      'Causes terror',
      'Large target',
    ],
  },
]

export const VAMPIRE_COUNTS: Army = {
  id: 'vampire-counts',
  name: 'Vampire Counts',
  nameEs: 'Condes Vampiro',
  composition: STANDARD_5E_COMPOSITION,
  units,
  magicItems: COMMON_MAGIC_ITEMS,
  selectionRules: {
    unitGroupCaps: [
      { ids: ['vc-vampire-bsb', 'vc-wight-bsb'], max: 1, labelEn: 'Battle Standard Bearer', labelEs: 'Portaestandarte de Batalla' },
    ],
    ratioCaps: [
      { unitId: 'vc-spectral-maidens', perPoints: 1000, labelEn: 'Spectral Maidens', labelEs: 'Doncellas Espectrales' },
      { unitId: 'vc-vampire-bats', perUnit: { ids: ['vc-zombies', 'vc-skeletons', 'vc-grave-guard', 'vc-ghouls', 'vc-wight-cavalry'] }, labelEn: 'Vampire Bats', labelEs: 'Murciélagos Vampiro' },
    ],
  },
}
