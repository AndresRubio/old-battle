import type { Army, EquipmentOption, MountOption, ProfileBlock, StatLine, UnitProfile } from '../types'
import { COMMON_MAGIC_ITEMS } from '../magicItems'

// Lizardmen — data transcribed from the official Lizardmen army list (Spanish ed.
// "Hombres Lagarto"), 1997, by Nigel
// Stillman, the 5th-edition army book. Points, profiles, equipment costs and
// 0-1/limit rules are taken directly from the book's army list (pp. 69-88) and
// the bestiary (pp. 56-66).
//
// NOTE: the book gives stats in the same columns used across all 5th-ed books
// (M / WS / BS / S / T / W / I / A / Ld). Movement values in the profiles are
// already in inches (e.g. Cold One M8, Stegadon M6, Skink M6). Any cm values
// referenced in the rules text are converted: 8cm→3", 10→4, 12→5, 15→6, 20→8.
// NOTE: a Lizardman army has NO war machines and NO allies (army list p.72).

const saurus = (over: Partial<StatLine> = {}): StatLine => ({
  M: 4, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 1, A: 2, Ld: 8, ...over,
})
const skink = (over: Partial<StatLine> = {}): StatLine => ({
  M: 6, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 6, ...over,
})

// --- Army-specific equipment options (per-model costs, from the Equipment List
//     p.72). ---
//   Hand weapon free / Additional hand weapon 1 / Double-handed weapon 2 /
//   Halberd 2 / Spear 1 / Short bow (Skinks only) 1 / Javelins (Skinks only) 1 /
//   Shield 1 / Light armour 2.
const SPEAR_1: EquipmentOption = { id: 'spears', name: 'Spears', pointsPerModel: 1 }
const SHIELD_1: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 1 }
const LIGHT_ARMOUR_2: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 2 }
// Skink missile options (Skink Warriors p.76):
//   short bows +½/model, javelins (Skinks only) +1/model, shields +1/model,
//   poisoned arrows / javelin tips +½/model (hits at S4).
const SHORT_BOW_HALF: EquipmentOption = { id: 'short-bow', name: 'Short bows', pointsPerModel: 0.5 }
const JAVELINS_1: EquipmentOption = { id: 'javelins', name: 'Javelins', pointsPerModel: 1 }
const POISON_TIPS_HALF: EquipmentOption = { id: 'poison-tips', name: 'Poisoned arrows / javelin tips (S4)', pointsPerModel: 0.5 }
// Terradon rider options (p.77): spears or javelins +1/model, shields +1/model,
//   poisoned arrows / javelins +½/model (hits at S4).
const TERRADON_SPEAR_1: EquipmentOption = { id: 'spears', name: 'Spears', pointsPerModel: 1 }
const TERRADON_JAVELINS_1: EquipmentOption = { id: 'javelins', name: 'Javelins', pointsPerModel: 1 }
const TERRADON_SHIELD_1: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 1 }
const TERRADON_POISON_HALF: EquipmentOption = { id: 'poison-tips', name: 'Poisoned arrows / javelins (S4)', pointsPerModel: 0.5 }

// Slann Mage-Priest level upgrades (army list p.73).
// Base = Mage-Priest & Palanquin 115 pts (level 1, 1 spell, 2 magic items).
// Champion = 240 (Δ+125; 2 spells, 3 items).
// Master   = 425 (Δ+185 over Champion; 3 spells, 4 items).
// Lord     = 550 (Δ+125 over Master; 4 spells, 5 items).
// magicItemSlotsDelta tracks the rising item allowance (book: 2→3→4→5).
const SLANN_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Mage-Priest Champion (Level 2)', pointsPerModel: 125, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Master Mage-Priest (Level 3)', pointsPerModel: 310, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Mage-Priest Lord (Level 4)', pointsPerModel: 435, magicItemSlotsDelta: 3 },
]

// --- Character mounts (army list p.74). Saurus & Skink characters may ride a
//     Cold One (+10) or a Terradon (+35); statlines reuse the bestiary profiles
//     given in the Cold One Riders (p.76) and Terradons (p.77) entries below. ---
const COLD_ONE_MOUNT: MountOption = {
  id: 'mount-cold-one', name: 'Cold One', nameEs: 'Saurio Frío',
  points: 10, statLine: { M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 1, A: 2, Ld: 3 },
  specialRules: ['Cold Ones cause fear and are subject to stupidity'],
}
const TERRADON_MOUNT: MountOption = {
  id: 'mount-terradon', name: 'Terradon (with 2nd Skink rider)', nameEs: 'Terradón (con 2º jinete Skink)',
  points: 35, statLine: { M: 2, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 2, A: 1, Ld: 3 },
  specialRules: ['Flying'],
}

// Stegadon howdah — Skink characters may ride one (army-list +225). Reuses the
// Stegadon bestiary statline.
const STEGADON_MOUNT: MountOption = {
  id: 'mount-stegadon', name: 'Stegadon howdah', nameEs: 'Howdah de Estegadón',
  points: 225, statLine: { M: 6, WS: 2, BS: 0, S: 7, T: 6, W: 6, I: 2, A: 5, Ld: 6 },
  specialRules: ['Impact Hits — D6 Strength 5 hits automatically on the charge', 'Causes fear'],
}

const SAURUS_HERO_MOUNTS: MountOption[] = [COLD_ONE_MOUNT, TERRADON_MOUNT]
const SKINK_MOUNTS: MountOption[] = [COLD_ONE_MOUNT, TERRADON_MOUNT, STEGADON_MOUNT]

// --- Fixed (non-selectable) mounts parsed from the character rule text. Cost is
//     already baked into the model's points, so these are display-only profiles. ---
const HORNED_ONE_PROFILE: ProfileBlock = {
  name: 'Horned One', nameEs: 'Saurio Cornudo',
  statLine: { M: 8, WS: 4, BS: 0, S: 4, T: 4, W: 1, I: 1, A: 3, Ld: 3 },
  specialRules: ['Rare breed of Cold One — causes fear; immune to stupidity while with its rider'],
}
const STEGADON_PROFILE: ProfileBlock = {
  name: 'Stegadon', nameEs: 'Estegadón',
  statLine: { M: 6, WS: 2, BS: 0, S: 7, T: 6, W: 6, I: 2, A: 5, Ld: 6 },
  specialRules: ['Impact Hits — D6 Strength 5 hits automatically on the charge', 'Causes fear'],
}

const units: UnitProfile[] = [
  // ===== Characters (0-50%) =====

  // 1 SLANN GENERAL (p.73) — army must include exactly one; is always the highest
  //   level Mage-Priest in the army. Base entry is Mage-Priest (level 1, 2 items).
  {
    id: 'lz-slann',
    name: 'Slann Mage-Priest (General)',
    nameEs: 'Mago-Sacerdote Slann (General)',
    role: 'character',
    pointsPerModel: 115,
    // Profile: Mage-Priest & Palanquin (p.58 bestiary / p.73 army list).
    statLine: { M: 4, WS: 3, BS: 2, S: 4, T: 4, W: 3, I: 2, A: 3, Ld: 8 },
    isCharacter: true,
    characterRank: 'wizard2', // 2 magic items at base level (p.73)
    lores: ['battle', 'high'],
    canBeGeneral: true,
    options: SLANN_LEVELS,
    specialRules: [
      'Army must include 1 Slann Mage-Priest as General',
      'Ceremonial mace (counts as hand weapon)',
      'May carry Battle Standard (+50 pts; not a magic item)',
      'Wizard — Battle Magic or High Magic (1 spell at level 1; +1 per level)',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
      'Slann Mage-Priest Telepathy — swap one spell with another Mage-Priest at start of magic phase',
      'Shield of the Old Ones — 4+ special save against each wound (whole palanquin model)',
      'Palanquin & Bodyguard — Slann, palanquin and 4 Temple Bodyguards are a single model',
    ],
  },

  // HEROES (p.74) — may include as many as points allow.
  {
    id: 'lz-saurus-hero',
    name: 'Saurus Hero',
    nameEs: 'Héroe Saurus',
    role: 'character',
    pointsPerModel: 82,
    // Profile p.74: M4 WS5 BS0 S5 T5 W2 I3 A4 Ld9.
    statLine: saurus({ WS: 5, S: 5, T: 5, W: 2, I: 3, A: 4, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: false,
    mounts: SAURUS_HERO_MOUNTS,
    specialRules: [
      'Scaly skin save (5+)',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
      'One attack is a bite attack (at basic Saurus Strength, no weapon bonus)',
      'May ride a Cold One (+10 pts) or a Terradon (+35 pts, including 2nd Skink rider)',
    ],
  },
  {
    id: 'lz-skink-hero',
    name: 'Skink Hero',
    nameEs: 'Héroe Skink',
    role: 'character',
    pointsPerModel: 52,
    // Profile p.74: M6 WS4 BS5 S4 T3 W2 I6 A3 Ld7.
    statLine: skink({ WS: 4, BS: 5, S: 4, W: 2, I: 6, A: 3, Ld: 7 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: false,
    mounts: SKINK_MOUNTS,
    specialRules: [
      'Scaly skin save (6+)',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
      'Aquatic',
      'Bow or javelin poison tips +1 pt (hits at +1 Strength)',
      'May ride a Cold One (+10 pts), a Terradon (+35 pts) or a Stegadon howdah (225 pts)',
    ],
  },

  // SKINK SHAMAN (p.74) — may include as many as points allow; level 1, 2 items.
  {
    id: 'lz-skink-shaman',
    name: 'Skink Shaman',
    nameEs: 'Chamán Skink',
    role: 'character',
    pointsPerModel: 56,
    // Profile p.74: M6 WS2 BS3 S3 T3 W1 I5 A1 Ld6.
    statLine: skink({ I: 5 }),
    isCharacter: true,
    characterRank: 'wizard2', // level 1 wizard but allowed 2 magic items (p.73/74)
    lores: ['battle'],
    canBeGeneral: false,
    mounts: SKINK_MOUNTS,
    specialRules: [
      'Wizard level 1 — 1 spell from Battle Magic (Skinks do not use High Magic)',
      'May carry 2 magic items (one more than a standard level-1 wizard)',
      'Scaly skin save (6+)',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
      'Bow or javelin poison tips +1 pt (hits at +1 Strength)',
      'May ride a Cold One (+10 pts), a Terradon (+35 pts) or a Stegadon howdah (225 pts)',
    ],
  },

  // CHAMPIONS (p.74) — bought from the Characters allowance; lead a regiment.
  {
    id: 'lz-saurus-champion',
    name: 'Saurus Champion',
    nameEs: 'Campeón Saurus',
    role: 'character',
    pointsPerModel: 32,
    // Profile p.74: M4 WS4 BS0 S5 T4 W1 I2 A3 Ld8.
    statLine: saurus({ WS: 4, S: 5, A: 3 }),
    isCharacter: true,
    characterRank: 'champion',
    canBeGeneral: false,
    mounts: [COLD_ONE_MOUNT],
    specialRules: [
      'Leads a Saurus regiment',
      'Scaly skin save (5+)',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
      'One attack is a bite attack (at basic Saurus Strength, no weapon bonus)',
      'May ride a Cold One (+10 pts)',
    ],
  },
  {
    id: 'lz-skink-champion',
    name: 'Skink Champion',
    nameEs: 'Campeón Skink',
    role: 'character',
    pointsPerModel: 20,
    // Profile p.74: M6 WS3 BS4 S4 T2 W1 I5 A2 Ld6.
    statLine: skink({ WS: 3, BS: 4, S: 4, T: 2, I: 5, A: 2 }),
    isCharacter: true,
    characterRank: 'champion',
    canBeGeneral: false,
    mounts: SKINK_MOUNTS,
    specialRules: [
      'Leads a Skink regiment',
      'Scaly skin save (6+)',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
      'Aquatic',
      'A poison-armed unit champion must also have poison tips (+1 pt)',
      'May ride a Cold One (+10 pts) or a Terradon (+35 pts, including 2nd Skink rider)',
    ],
  },

  // ===== Regiments (25%+) =====

  // SAURUS TEMPLE GUARDS (p.75) — 0-1 per Slann Mage-Priest in the army.
  {
    id: 'lz-temple-guard',
    name: 'Saurus Temple Guards',
    nameEs: 'Guardianes del Templo Saurus',
    role: 'regiment',
    pointsPerModel: 18,
    // Profile p.75: M4 WS4 BS0 S4 T4 W1 I2 A2 Ld8.
    statLine: saurus({ WS: 4, I: 2, A: 2 }),
    minSize: 5,
    options: [LIGHT_ARMOUR_2, SHIELD_1],
    specialRules: [
      '0-1 unit per Slann Mage-Priest included in the army',
      'Armed with halberds',
      'Scaly skin save (5+, counts as heavy armour)',
      'Regiment may carry a magic standard',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
      'One attack is a bite attack (at basic Saurus Strength, no weapon bonus)',
    ],
  },

  // SAURUS WARRIORS (p.75) — any number of regiments.
  {
    id: 'lz-saurus-warriors',
    name: 'Saurus Warriors',
    nameEs: 'Guerreros Saurus',
    role: 'regiment',
    pointsPerModel: 15,
    // Profile p.75: M4 WS3 BS0 S4 T4 W1 I1 A2 Ld8.
    statLine: saurus(),
    minSize: 5,
    options: [SPEAR_1],
    specialRules: [
      'Armed with hand weapons and shields',
      'Scaly skin save (5+, counts as heavy armour)',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
      'One attack is a bite attack (at basic Saurus Strength, no weapon bonus)',
    ],
  },

  // SKINK WARRIORS (p.76) — any number of regiments; units may include Kroxigor.
  {
    id: 'lz-skink-warriors',
    name: 'Skink Warriors',
    nameEs: 'Guerreros Skink',
    role: 'regiment',
    pointsPerModel: 4.5,
    // Profile p.76: M6 WS2 BS3 S3 T2 W1 I4 A1 Ld6.
    statLine: skink({ T: 2 }),
    minSize: 5,
    options: [SHORT_BOW_HALF, JAVELINS_1, SHIELD_1, POISON_TIPS_HALF],
    specialRules: [
      'Armed with hand weapons',
      'Scaly skin save (6+)',
      'Skirmishers',
      'Aquatic',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
      'May include up to 1 Kroxigor per 8 Skinks in the unit',
    ],
  },

  // COLD ONE RIDERS (p.76) — any number of regiments.
  {
    id: 'lz-cold-one-riders',
    name: 'Cold One Riders',
    nameEs: 'Jinetes de Saurio Frío',
    role: 'regiment',
    pointsPerModel: 25,
    // Profile p.76: Grt Crested Skink M6 WS2 BS3 S4 T2 W1 I4 A1 Ld6;
    //               Cold One M8 WS3 BS0 S4 T4 W1 I1 A2 Ld3. Combined save 3+.
    statLine: { M: 8, WS: 2, BS: 3, S: 4, T: 2, W: 1, I: 4, A: 1, Ld: 6 },
    mount: { name: 'Cold One', nameEs: 'Saurio Frío', statLine: COLD_ONE_MOUNT.statLine!, specialRules: ['Causes fear', 'Stupidity'] },
    minSize: 5,
    specialRules: [
      'Great Crested Skinks riding Cold Ones',
      'Armed with hand weapon, spear and shield',
      'Save 3+ (cavalry bonus from Cold One scaly skin)',
      'Cold Ones cause fear and are subject to stupidity',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
    ],
  },

  // KROXIGOR (p.77) — any number of units; minimum 5 models (or fewer if <5 exist).
  {
    id: 'lz-kroxigor',
    name: 'Kroxigor',
    nameEs: 'Kroxigor',
    role: 'regiment',
    pointsPerModel: 45,
    // Profile p.77: M6 WS3 BS0 S5 T4 W3 I1 A3 Ld9.
    statLine: { M: 6, WS: 3, BS: 0, S: 5, T: 4, W: 3, I: 1, A: 3, Ld: 9 },
    minSize: 1, // unit may be fewer than 5 models (p.77)
    specialRules: [
      'Armed with double-handed weapons',
      'Scaly skin save (4+)',
      'Causes fear',
      'Aquatic',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
      'May be included in Skink units (up to 1 Kroxigor per 8 Skinks)',
    ],
  },

  // TERRADONS (p.77) — 0-1 unit per Slann Mage-Priest; army always entitled to at least one unit.
  {
    id: 'lz-terradons',
    name: 'Terradons',
    nameEs: 'Terradones',
    role: 'regiment',
    pointsPerModel: 40,
    // Profile p.77: Skink Rider M6 WS2 BS3 S3 T2 W1 I4 A1 Ld6;
    //               Terradon M2 WS3 BS0 S4 T4 W1 I2 A1 Ld3.
    // Each Terradon model has two Skink riders; rider profile shown.
    statLine: { M: 6, WS: 2, BS: 3, S: 3, T: 2, W: 1, I: 4, A: 1, Ld: 6 },
    mount: { name: 'Terradon', nameEs: 'Terradón', statLine: TERRADON_MOUNT.statLine!, specialRules: ['Flying'] },
    minSize: 1,
    options: [TERRADON_SPEAR_1, TERRADON_JAVELINS_1, TERRADON_SHIELD_1, TERRADON_POISON_HALF],
    specialRules: [
      '0-1 unit per Slann Mage-Priest (army always entitled to at least 1 unit)',
      'Each model has two Skink riders armed with hand weapons and short bows',
      'Save 5+ (scaly skin, +1 for being mounted)',
      'Flying',
      'Skirmishers',
      'Drop Rocks — 1 Strength 6 automatic hit on first charge',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
    ],
  },

  // STEGADON & 4 SKINKS (p.77) — as many as eligible regiments (see specialRules).
  {
    id: 'lz-stegadon',
    name: 'Stegadon & 4 Skinks',
    nameEs: 'Estegadón y 4 Skinks',
    role: 'monster',
    pointsPerModel: 225,
    // Profile p.64/77: Stegadon M6 WS2 BS0 S7 T6 W6 I2 A5 Ld6.
    //                  Skink crew M6 WS2 BS3 S3 T2 W1 I4 A1 Ld6.
    statLine: { M: 6, WS: 2, BS: 0, S: 7, T: 6, W: 6, I: 2, A: 5, Ld: 6 },
    options: [
      { id: 'extra-skink-crew', name: 'Additional Skink crewman', pointsPerModel: 6 },
      { id: 'giant-bow', name: 'Giant bow (range 36", S5, crewed by 2 Skinks)', pointsPerModel: 20, flat: true },
    ],
    specialRules: [
      'May include as many Stegadons as there are units of Saurus Temple Guards, Saurus Warriors, Skink Warriors or Cold One Riders',
      'Crew armed with hand weapons, spears, short bows, poisoned javelins, poisoned arrows and shields',
      'Poisoned arrows and javelins strike at Strength 4',
      'Save: Stegadon 4+ (horny hide), Skink crew 5+ (scaly skin as light armour)',
      'Impact Hits — D6 Strength 5 hits automatically on the charge',
      'Causes fear',
      'Any Stegadon may carry a magic standard on its howdah',
      'Stegadons may be grouped into units of two or more',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
    ],
  },

  // SALAMANDER HUNTING PACK (p.78) — as many as eligible regiments (see specialRules).
  {
    id: 'lz-salamander',
    name: 'Salamander Hunting Pack',
    nameEs: 'Manada de Salamandras',
    role: 'monster',
    pointsPerModel: 90,
    // Profile p.63/78: Salamander M6 WS3 BS3 S4 T4 W3 I2 A3 Ld6;
    //                  Skink Runners M6 WS2 BS3 S3 T2 W1 I4 A1 Ld6.
    statLine: { M: 6, WS: 3, BS: 3, S: 4, T: 4, W: 3, I: 2, A: 3, Ld: 6 },
    specialRules: [
      'May include as many Salamanders as there are units of Saurus or Skinks in the army',
      'Accompanied by 4 Skink Runners (armed with hand weapons and spears)',
      'Spits venom — 24" template, S4 hit on each model under template, no armour save; D3 wounds per model hit',
      'Save 6+ (scaly skin as light armour)',
      'Aquatic',
      'Multiple Salamanders may be grouped into a battery like artillery',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
    ],
  },

  // ===== Monsters (0-25%) =====

  // LIZARD SWARMS (p.78) — 50 pts/base at half cost; max = number of eligible regiments.
  {
    id: 'lz-lizard-swarms',
    name: 'Lizard Swarms',
    nameEs: 'Enjambres de Lagartos',
    role: 'monster',
    pointsPerModel: 50, // 50 pts/base (half cost) up to as many as eligible regiments; 100 pts/base beyond
    // Profile p.78: M4 WS3 BS0 S3 T2 W5 I1 A5 Ld10.
    statLine: { M: 4, WS: 3, BS: 0, S: 3, T: 2, W: 5, I: 1, A: 5, Ld: 10 },
    specialRules: [
      '50 pts/base (half cost) up to as many as eligible regiments; 100 pts/base beyond that',
      'No armour save',
      'Immune to psychology and break tests',
      'All Lizard Swarms in the army must be massed into a single unit',
    ],
  },

  // SERPENT SWARMS (p.78) — 50 pts/base at half cost; max = number of eligible regiments.
  {
    id: 'lz-serpent-swarms',
    name: 'Serpent Swarms',
    nameEs: 'Enjambres de Serpientes',
    role: 'monster',
    pointsPerModel: 50,
    // Profile p.78: M3 WS3 BS0 S4 T2 W5 I1 A5 Ld10.
    statLine: { M: 3, WS: 3, BS: 0, S: 4, T: 2, W: 5, I: 1, A: 5, Ld: 10 },
    specialRules: [
      '50 pts/base (half cost) up to as many as eligible regiments; 100 pts/base beyond that',
      'No armour save',
      'Immune to psychology and break tests',
      'All Serpent Swarms in the army must be massed into a single unit',
    ],
  },

  // GIGANTIC SPIDER (p.78) — 50 pts each.
  {
    id: 'lz-gigantic-spider',
    name: 'Gigantic Spider',
    nameEs: 'Araña Gigante',
    role: 'monster',
    pointsPerModel: 50,
    // Profile p.78: M5 WS3 BS0 S5 T4 W4 I1 A2 Ld7.
    statLine: { M: 5, WS: 3, BS: 0, S: 5, T: 4, W: 4, I: 1, A: 2, Ld: 7 },
    specialRules: [],
  },

  // GIANT SCORPIONS (p.78) — 50 pts each.
  {
    id: 'lz-giant-scorpions',
    name: 'Giant Scorpions',
    nameEs: 'Escorpiones Gigantes',
    role: 'monster',
    pointsPerModel: 50,
    // Profile p.78: M5 WS3 BS0 S5 T4 W4 I1 A2 Ld7.
    statLine: { M: 5, WS: 3, BS: 0, S: 5, T: 4, W: 4, I: 1, A: 2, Ld: 7 },
    specialRules: [],
  },

  // SWARMS — Frogs / Insects-Spiders / Scorpions (p.78) — 100 pts/base.
  {
    id: 'lz-swarms',
    name: 'Swarms (Frogs / Insects-Spiders / Scorpions)',
    nameEs: 'Enjambres (Ranas / Insectos-Arañas / Escorpiones)',
    role: 'monster',
    pointsPerModel: 100,
    // Profiles p.78: Frogs M4 S3; Insects/Spiders M4 S2; Scorpions M4 S4.
    // All share WS3 BS0 T2 W5 I1 A5 Ld10.
    statLine: { M: 4, WS: 3, BS: 0, S: 3, T: 2, W: 5, I: 1, A: 5, Ld: 10 },
    specialRules: [
      'Frogs S3 / Insects-Spiders S2 / Scorpions S4 (choose profile when fielded)',
      'Immune to psychology and break tests',
    ],
  },

  // ===== Special characters (0-1 each; fixed equipment & magic items) =====

  // VENERABLE LORD KROAK (p.79-80) — 620 pts; added in addition to the General.
  {
    id: 'lz-venerable-lord-kroak',
    name: 'Venerable Lord Kroak',
    nameEs: 'El Venerable Lord Kroak',
    role: 'character',
    pointsPerModel: 620,
    // Profile p.79: M4 WS6 BS5 S6 T5 W8 I6 A8 Ld10.
    statLine: { M: 4, WS: 6, BS: 5, S: 6, T: 5, W: 8, I: 6, A: 8, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard4',
    lores: ['battle', 'high'],
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character — added in addition to the General; army must also include a living Slann Mage-Priest as General',
      'Cannot lead the army himself',
      'Mummified Mage-Lord — 4 spells (Battle or High Magic); spells can only be used via other Mage-Priests by telepathy',
      'Mighty Shield of the Old Ones — 3+ special save against each wound',
      'Standard of the Sacred Serpent (25 pts magic banner), Ceremonial Mace of Malachite (50 pts magic weapon), Gold Death Mask (50 pts enchanted item — can only be hit in close combat on a roll of 6), Amulet of Itza (25 pts wizards arcane), Glyph of Potec (20 pts enchanted item)',
      'Palanquin & Bodyguard — single model with one profile; all attacks aimed at the whole model',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
    ],
  },

  // LOTL-BOTL (p.82) — 100 pts; Saurus Hero.
  {
    id: 'lz-lotl-botl',
    name: 'Lotl-Botl',
    nameEs: 'Lotl-Botl',
    role: 'character',
    pointsPerModel: 100,
    // Profile p.82: M4 WS5 BS0 S5 T5 W2 I3 A4 Ld9.
    statLine: saurus({ WS: 5, S: 5, T: 5, W: 2, I: 3, A: 4, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character — Saurus Hero (no magic items)',
      'Armed with hand weapon, light armour and shield',
      'Save 3+ (scaly skin acts as heavy armour; save can never be worse than 6+)',
      'Blood-Curdling Roar — causes fear',
      'Cold-Blooded Determination — any Saurus unit accompanied by Lotl-Botl gains +1 to combat result',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
    ],
  },

  // KROQ (p.82) — 113 pts; Saurus Hero.
  {
    id: 'lz-kroq',
    name: 'Kroq',
    nameEs: 'Kroq',
    role: 'character',
    pointsPerModel: 113,
    // Profile p.82: M4 WS5 BS0 S5 T5 W2 I3 A4 Ld9.
    statLine: saurus({ WS: 5, S: 5, T: 5, W: 2, I: 3, A: 4, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character — Saurus Hero (no magic items)',
      'Armed with hand weapon and shield',
      'Save 4+ (scaly skin acts as heavy armour; save can never be worse than 6+)',
      'Massive Jaws — bite attack inflicts D3 wounds; no armour save allowed against this bite',
      'Bony Plates — may re-roll one failed armour saving throw',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
    ],
  },

  // OXAYOTL (p.83) — 102 pts; Chameleon Skink (treated as hero-rank).
  {
    id: 'lz-oxayotl',
    name: 'Oxayotl',
    nameEs: 'Oxayotl',
    role: 'character',
    pointsPerModel: 102,
    // Profile p.83: M6 WS4 BS5 S4 T3 W3 I7 A3 Ld7.
    statLine: skink({ WS: 4, BS: 5, S: 4, T: 3, W: 3, I: 7, A: 3, Ld: 7 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character — Chameleon Skink (no magic items)',
      'Armed with hand weapon, blowpipe and poisoned darts',
      'Save 5+ (scaly skin; never worse than 6+)',
      'Poison Dart Blowpipe — range 12", 3 shots per turn at same target, no half-range penalty, poisoned (Strength 5)',
      'Chameleon Skin — enemy shooting at Oxayotl suffers -2 to hit',
      'Amazing Stealth — may be deployed anywhere on the battlefield after all other deployment, but not within 8" of any enemy',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
    ],
  },

  // INXI-HUINZI (p.84) — 85 pts; Skink Hero riding a Horned One.
  {
    id: 'lz-inxi-huinzi',
    name: 'Inxi-Huinzi',
    nameEs: 'Inxi-Huinzi',
    role: 'character',
    pointsPerModel: 85,
    // Profile p.84: Inxi-Huinzi M6 WS4 BS5 S4 T3 W2 I6 A3 Ld7;
    //               Horned One M8 WS4 BS0 S4 T4 W1 I1 A3 Ld3.
    statLine: { M: 8, WS: 4, BS: 5, S: 4, T: 3, W: 2, I: 6, A: 3, Ld: 7 },
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: false,
    max: 1,
    profiles: [HORNED_ONE_PROFILE],
    specialRules: [
      'Special character — Skink Hero (no magic items)',
      'Armed with hand weapon, spear, poisoned darts, light armour and shield',
      'Save 2+ (scaly skin; never worse than 6+)',
      'Rides a Horned One (rare breed of Cold One) — causes fear; immune to stupidity while with Inxi-Huinzi',
      'Hail of Darts — throws 1 poisoned dart per full 4" of charge distance (always wound on 4+); counted as close combat wounds for result',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
    ],
  },

  // ITZI-BITZI (p.85) — 105 pts; Skink Hero.
  {
    id: 'lz-itzi-bitzi',
    name: 'Itzi-Bitzi',
    nameEs: 'Itzi-Bitzi',
    role: 'character',
    pointsPerModel: 105,
    // Profile p.85: M6 WS4 BS5 S4 T3 W2 I6 A3 Ld7.
    statLine: skink({ WS: 4, BS: 5, S: 4, W: 2, I: 6, A: 3, Ld: 7 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character — Skink Hero (no magic items)',
      'Armed with the Piranha Blade (35 pts magic weapon — each wound inflicts D3 wounds), light armour and shield',
      'Save 4+ (scaly skin; never worse than 6+)',
      'Skink — Aquatic',
      'Incantation of Xetlipocutzl — once per game, all enemy units within 8" must immediately take a Panic test on 3D6 (choose highest two); cannot be dispelled',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
    ],
  },

  // TENEHUINI, PROPHET OF SOTEK (p.86) — 120 pts; Skink Shaman.
  {
    id: 'lz-tenehuini',
    name: 'Tenehuini, Prophet of Sotek',
    nameEs: 'Tenehuini, Profeta de Sotek',
    role: 'character',
    pointsPerModel: 120,
    // Profile p.86: M6 WS2 BS3 S3 T3 W1 I5 A1 Ld6.
    statLine: skink({ I: 5 }),
    isCharacter: true,
    characterRank: 'wizard2', // Skink Shaman: level 1 wizard with 2 magic items
    lores: ['battle'],
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character — Skink Shaman, level 1 (1 spell from Battle Magic)',
      'Armed with the Dagger of Sotek (50 pts magic weapon) and carries Totem of Sotek (10 pts magic standard)',
      'Shield of Sotek — 4+ special save against each wound (cannot be reduced by Strength); wounds from armour-ignoring attacks can still be saved',
      'Skink — Aquatic',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
    ],
  },

  // LORD MAZDAMUNDI (p.87-89) — 900 pts; replaces the General.
  {
    id: 'lz-lord-mazdamundi',
    name: 'Lord Mazdamundi',
    nameEs: 'Lord Mazdamundi',
    role: 'character',
    pointsPerModel: 900,
    // Profile p.87: Lord Mazdamundi & Stegadon M6 WS6 BS5 S7 T6 W8 I6 A8 Ld10.
    statLine: { M: 6, WS: 6, BS: 5, S: 7, T: 6, W: 8, I: 6, A: 8, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard4',
    lores: ['battle', 'high'],
    canBeGeneral: true,
    max: 1,
    profiles: [STEGADON_PROFILE],
    specialRules: [
      'Special character — replaces the Slann General if taken',
      'Mage-Priest Lord with 4 unique Slann geomancy spells (Move the Mountains, Ruination of Cities, Earth Line, Part the Waters)',
      'Cobra Mace of Mazdamundi (15 pts magic weapon), Plaque of Tepec (50 pts wizards arcane), Plaque of Xoloc (50 pts wizards arcane), Itxi Grubs (50 pts wizards arcane), Egg of the Quango (10 pts enchanted item)',
      'If General, the Sunburst Standard of Hexoatl (50 pts) is the army battle standard',
      'Shield of the Old Ones — 4+ special save against each wound',
      'Rides a Stegadon — single model; Impact Hits D6 S5 on charge; Causes fear; Bony Shield deflects hits on a roll of 1',
      'Slann Mage-Priest Telepathy — may borrow one spell from any other Mage-Priest each magic phase',
      'Cold-blooded — roll 3D6 for Leadership tests, discard highest',
    ],
  },
]

export const LIZARDMEN: Army = {
  id: 'lizardmen',
  name: 'Lizardmen',
  nameEs: 'Hombres Lagarto',
  // book p.72: no war machines
  composition: { maxCharactersPct: 50, minRegimentsPct: 25, maxWarMachinesPct: 0, maxMonstersPct: 25, requiresGeneral: true },
  units,
  magicItems: COMMON_MAGIC_ITEMS,
  selectionRules: {
    ratioCaps: [
      { unitId: 'lz-temple-guard', perUnit: { ids: ['lz-slann'] }, labelEn: 'Temple Guard', labelEs: 'Guardianes del Templo Saurus' },
      { unitId: 'lz-terradons', perUnit: { ids: ['lz-slann'] }, floor: 1, labelEn: 'Terradons', labelEs: 'Terradones' },
    ],
  },
}
