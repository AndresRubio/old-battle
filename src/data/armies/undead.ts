import type { Army, EquipmentOption, MountOption, ProfileBlock, StatLine, UnitProfile } from '../types'
import { STANDARD_5E_COMPOSITION } from '../types'
import { COMMON_MAGIC_ITEMS } from '../magicItems'

// Undead ("No Muertos") — data transcribed from the official Undead army list
// (1995/1997 Spanish edition, by Jervis Johnson & Bill King), the
// combined 4th/5th-edition Undead army book (before the Vampire Counts / Tomb
// Kings split). Points, profiles, equipment costs and 0-1 limits are taken
// directly from the book's army list (pp. 76-95) and bestiary (pp. 56-69).
//
// NOTE: the book gives Movement in centimetres; values here are converted to the
// inches used elsewhere in the app (8cm→3", 10→4, 12→5, 15→6, 20→8, 22→9;
// the Skull Catapult's 120cm range → 48"). Stat columns in the book are
// M / HA(WS) / HP(BS) / F(S) / R(T) / H(W) / I / A / L(Ld).
//
// UNDEAD SPECIAL RULES: nearly all entries Cause fear (Mummies/Wraiths cause
// terror), are Immune to psychology, take additional casualties if beaten in
// combat (crumble), and the whole army turns to dust if the Necromancer General
// is slain — captured below as specialRules strings.

const statLine = (over: Partial<StatLine> = {}): StatLine => ({
  M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5, ...over,
})

// --- Army-specific equipment options (per-model costs from the Equipment List
//     p.78 and the per-unit option lines pp.81-84). Same `id` = a reused wargear
//     slot priced at the unit's own cost (cf. Dark Elves / Chaos Dwarfs). ---
const LIGHT_ARMOUR_1: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 1 }
const LIGHT_ARMOUR_2: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 2 }
const LIGHT_ARMOUR_4: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 4 }
const SHIELD_1: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 1 }
const SHIELD_2: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 2 }
const SHIELD_HALF: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 0.5 }
const HEAVY_ARMOUR_3: EquipmentOption = { id: 'heavy-armour', name: 'Heavy armour', pointsPerModel: 3 }
const TWO_HAND_1: EquipmentOption = { id: 'two-hand', name: 'Two-handed weapon', pointsPerModel: 1 }
const TWO_HAND_2: EquipmentOption = { id: 'two-hand', name: 'Two-handed weapon', pointsPerModel: 2 }
const HALBERD_2: EquipmentOption = { id: 'halberd', name: 'Halberd', pointsPerModel: 2 }
const SPEAR_1: EquipmentOption = { id: 'spear', name: 'Spear', pointsPerModel: 1 }
const CROSSBOW_3: EquipmentOption = { id: 'crossbow', name: 'Crossbow', pointsPerModel: 3 }
const BOW_2: EquipmentOption = { id: 'bow', name: 'Bow', pointsPerModel: 2 }
const BOW_4: EquipmentOption = { id: 'bow', name: 'Bow', pointsPerModel: 4 }
const CAV_LANCE_4: EquipmentOption = { id: 'cav-lance', name: 'Cavalry lance', pointsPerModel: 4 }
const LANCE_1: EquipmentOption = { id: 'lance', name: 'Lance', pointsPerModel: 1 }
const LANCE_2: EquipmentOption = { id: 'lance', name: 'Lance', pointsPerModel: 2 }
const SCYTHE_BLADES: EquipmentOption = { id: 'scythe-wheels', name: 'Scythed wheels', pointsPerModel: 20, flat: true }

// Necromancer level upgrades for the base Necromancer (68pts, level 1). The book
// instead lists each level as its own entry: Necromancer 68 → Necromancer Paladin
// (L2) 163 → Master Necromancer (L3) 278 → Great Necromancer (L4) 410 [General].
// Cumulative deltas: +95 / +210 / +342. Magic-item allowance 1/2/3/4 (p.76).
const UD_WIZARD_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Wizard Level 2 (Necromancer Paladin)', pointsPerModel: 95, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Wizard Level 3 (Master Necromancer)', pointsPerModel: 210, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Wizard Level 4 (Great Necromancer)', pointsPerModel: 342, magicItemSlotsDelta: 3 },
]

// --- Character mounts (army list pp.76-84: a character "may ride a Skeletal
//     Steed, a monster or a Skeleton Chariot"). Monster mounts reuse the bestiary
//     statlines defined in the units list below; costs from the monster points.
//     The Skeletal Steed (a.k.a. Nightmare for Vampires) is the generic mount. ---
const SKELETAL_STEED_MOUNT: MountOption = {
  id: 'mount-skeletal-steed', name: 'Skeletal Steed', nameEs: 'Corcel Esquelético',
  points: 2, statLine: { M: 8, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 4 },
}
// Vampires ride a Nightmare — same profile as the Skeletal Steed but causes fear.
const NIGHTMARE_MOUNT: MountOption = {
  id: 'mount-nightmare', name: 'Nightmare', nameEs: 'Pesadilla',
  points: 2, statLine: { M: 8, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 4 },
  specialRules: ['Causes fear'],
}
const ZOMBIE_DRAGON_MOUNT: MountOption = {
  id: 'mount-zombie-dragon', name: 'Zombie Dragon', nameEs: 'Dragón Zombi',
  points: 500, statLine: { M: 4, WS: 4, BS: 0, S: 7, T: 6, W: 7, I: 3, A: 6, Ld: 8 },
  specialRules: ['Flying', 'Terror', 'Large target', 'Causes fear', 'Immune to psychology'],
}
const DRAGON_MOUNT: MountOption = {
  id: 'mount-dragon', name: 'Dragon', nameEs: 'Dragón',
  points: 450, statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 },
  specialRules: ['Flying', 'Terror', 'Large target', 'Breath weapon'],
}
const GREAT_DRAGON_MOUNT: MountOption = {
  id: 'mount-great-dragon', name: 'Great Dragon', nameEs: 'Gran Dragón',
  points: 600, statLine: { M: 6, WS: 7, BS: 0, S: 7, T: 7, W: 8, I: 7, A: 8, Ld: 8 },
  specialRules: ['Flying', 'Terror', 'Large target', 'Breath weapon'],
}
const EMPEROR_DRAGON_MOUNT: MountOption = {
  id: 'mount-emperor-dragon', name: 'Emperor Dragon', nameEs: 'Dragón Emperador',
  points: 750, statLine: { M: 6, WS: 8, BS: 0, S: 8, T: 8, W: 9, I: 6, A: 9, Ld: 9 },
  specialRules: ['Flying', 'Terror', 'Large target', 'Breath weapon'],
}
const GRIFFON_MOUNT: MountOption = {
  id: 'mount-griffon', name: 'Griffon', nameEs: 'Grifo',
  points: 150, statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 4, Ld: 8 },
  specialRules: ['Flying', 'Large target'],
}
const HIPPOGRIFF_MOUNT: MountOption = {
  id: 'mount-hippogriff', name: 'Hippogriff', nameEs: 'Hipogrifo',
  points: 145, statLine: { M: 8, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 6, A: 3, Ld: 8 },
  specialRules: ['Flying', 'Large target'],
}
const MANTICORE_MOUNT: MountOption = {
  id: 'mount-manticore', name: 'Manticore', nameEs: 'Mantícora',
  points: 200, statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 },
  specialRules: ['Flying', 'Large target'],
}
const WINGED_SERPENT_MOUNT: MountOption = {
  id: 'mount-winged-serpent', name: 'Winged Serpent', nameEs: 'Serpiente Alada',
  points: 180, statLine: { M: 6, WS: 5, BS: 0, S: 5, T: 6, W: 4, I: 4, A: 3, Ld: 5 },
  specialRules: ['Flying', 'Large target'],
}

/** Full mount list for the Undead lords/heroes ("a Skeletal Steed or a monster").
 *  Vampires use the Nightmare variant via VAMPIRE_MOUNTS below. */
const UNDEAD_MOUNTS: MountOption[] = [
  SKELETAL_STEED_MOUNT, ZOMBIE_DRAGON_MOUNT, DRAGON_MOUNT, GREAT_DRAGON_MOUNT,
  EMPEROR_DRAGON_MOUNT, GRIFFON_MOUNT, HIPPOGRIFF_MOUNT, MANTICORE_MOUNT, WINGED_SERPENT_MOUNT,
]

/** Vampire characters ride a Nightmare instead of a plain Skeletal Steed. */
const VAMPIRE_MOUNTS: MountOption[] = [
  NIGHTMARE_MOUNT, ZOMBIE_DRAGON_MOUNT, DRAGON_MOUNT, GREAT_DRAGON_MOUNT,
  EMPEROR_DRAGON_MOUNT, GRIFFON_MOUNT, HIPPOGRIFF_MOUNT, MANTICORE_MOUNT, WINGED_SERPENT_MOUNT,
]

/** Only a steed — for special characters limited to a single mount.
 *  Vampire characters take the Nightmare; others the plain Skeletal Steed. */
const NIGHTMARE_ONLY_MOUNTS: MountOption[] = [NIGHTMARE_MOUNT]
const SKELETAL_STEED_ONLY_MOUNTS: MountOption[] = [SKELETAL_STEED_MOUNT]

// --- Fixed (non-selectable) mounts for special characters who always ride one.
//     Display-only: the cost is already included in the model's points. ---
const MANTICORE_PROFILE: ProfileBlock = {
  name: 'Manticore', nameEs: 'Mantícora', statLine: MANTICORE_MOUNT.statLine!,
  specialRules: ['Flying', 'Large target', 'Terror'],
}

const units: UnitProfile[] = [
  // ===== Characters (0-50%) =====

  // ----- 1 Undead General (choose ONE profile; must include a General) -----
  {
    id: 'ud-general-great-necromancer',
    name: 'Undead General — Great Necromancer',
    nameEs: 'General No Muerto — Gran Nigromante',
    role: 'character',
    pointsPerModel: 410,
    statLine: statLine({ M: 4, WS: 7, BS: 7, S: 5, T: 4, W: 4, I: 6, A: 5, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    options: UD_WIZARD_LEVELS.slice(2), // already a level-4 wizard
    mounts: UNDEAD_MOUNTS,
    specialRules: [
      'Army General (choose one General profile)',
      'Wizard Level 4 (Necromancy)',
      'Up to 4 magic items',
      'Cannot cast spells while wearing armour',
      'Army crumbles to dust if the General is slain',
      'Immune to psychology',
      'May ride a Skeletal Steed (+2), a monster or a Skeleton Chariot (+60 scythed / +40 plain)',
    ],
  },
  {
    id: 'ud-general-vampire-lord',
    name: 'Undead General — Vampire Lord',
    nameEs: 'General No Muerto — Señor Vampiro',
    role: 'character',
    pointsPerModel: 375,
    statLine: statLine({ M: 6, WS: 8, BS: 6, S: 7, T: 6, W: 4, I: 9, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    mounts: VAMPIRE_MOUNTS,
    specialRules: [
      'Army General (choose one General profile)',
      'Up to 4 magic items',
      'Causes fear',
      'Immune to psychology',
      'Army crumbles to dust if the General is slain',
      'May ride a Nightmare (+2), a monster or a Skeleton Chariot (+60 scythed / +40 plain)',
    ],
  },
  {
    id: 'ud-general-undead-necromancer',
    name: 'Undead General — Necromancer (Liche)',
    nameEs: 'General No Muerto — Nigromante (Liche)',
    role: 'character',
    pointsPerModel: 350,
    statLine: statLine({ M: 4, WS: 7, BS: 7, S: 5, T: 4, W: 4, I: 6, A: 5, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    mounts: UNDEAD_MOUNTS,
    specialRules: [
      'Army General (choose one General profile)',
      'Wizard Level 4 (Necromancy)',
      'Up to 4 magic items',
      'Causes fear',
      'Immune to psychology',
      'Army crumbles to dust if the General is slain',
      'May ride a Skeletal Steed (+2), a monster or a Skeleton Chariot (+60 scythed / +40 plain)',
    ],
  },

  // ----- Battle Standard Bearer (0-1) -----
  {
    id: 'ud-battle-standard',
    name: 'Undead Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla No Muerto',
    role: 'character',
    pointsPerModel: 87,
    statLine: statLine({ M: 4, WS: 3, BS: 0, S: 3, T: 4, W: 3, I: 3, A: 1, Ld: 8 }),
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    isBSB: true,
    max: 1,
    mounts: UNDEAD_MOUNTS,
    specialRules: [
      'Army Battle Standard (an Undead Knight)',
      'Wight Blade (Espada Funeraria)',
      'May carry one magic standard',
      'Causes fear',
      'Immune to psychology',
      'May ride a Skeletal Steed (+2), a monster or a Skeleton Chariot (+60 scythed / +40 plain)',
    ],
  },

  // ----- Heroes -----
  {
    id: 'ud-vampire',
    name: 'Vampire Count',
    nameEs: 'Conde Vampiro',
    role: 'character',
    pointsPerModel: 200,
    statLine: statLine({ M: 6, WS: 7, BS: 5, S: 7, T: 6, W: 3, I: 8, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'wizard2',
    canBeGeneral: true,
    mounts: VAMPIRE_MOUNTS,
    specialRules: [
      'Up to 2 magic items',
      'Causes fear',
      'Immune to psychology',
      'May ride a Nightmare (+2), a monster or a Skeleton Chariot (+60 scythed / +40 plain)',
    ],
  },
  {
    id: 'ud-mummy-tomb-king',
    name: 'Mummy Tomb King',
    nameEs: 'Rey Funerario Momia',
    role: 'character',
    pointsPerModel: 100,
    statLine: statLine({ M: 3, WS: 4, BS: 0, S: 5, T: 5, W: 4, I: 3, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: true,
    mounts: UNDEAD_MOUNTS,
    specialRules: [
      'Up to 2 magic items',
      'Causes fear',
      'Immune to psychology',
      'Double wounds from fire/flaming weapons and spells',
      'May ride a Skeletal Steed (+2), a monster or a Skeleton Chariot (+60 scythed / +40 plain)',
    ],
  },
  {
    id: 'ud-undead-knight-lord',
    name: 'Lord of Undead Knights',
    nameEs: 'Señor de los Caballeros No Muertos',
    role: 'character',
    pointsPerModel: 65,
    statLine: statLine({ M: 4, WS: 4, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: true,
    mounts: UNDEAD_MOUNTS,
    specialRules: [
      'Up to 2 magic items',
      'Wight Blade (Espada Funeraria)',
      'Causes fear',
      'Immune to psychology',
      'May ride a Skeletal Steed (+2), a monster or a Skeleton Chariot (+60 scythed / +40 plain)',
    ],
  },

  // ----- Necromancers (Wizards) -----
  {
    id: 'ud-necromancer',
    name: 'Necromancer',
    nameEs: 'Nigromante',
    role: 'character',
    pointsPerModel: 68,
    statLine: statLine({ M: 4, WS: 4, BS: 4, S: 4, T: 3, W: 1, I: 3, A: 2, Ld: 8 }),
    isCharacter: true,
    characterRank: 'wizard1',
    canBeGeneral: false,
    options: UD_WIZARD_LEVELS.slice(0, 2), // book p.80: a non-general Necromancer caps at Level 3; only the General is L4
    mounts: UNDEAD_MOUNTS,
    specialRules: [
      'Wizard (Necromancy)',
      'Cannot cast spells while wearing armour',
      'May ride a Skeletal Steed (+2), a monster or a Skeleton Chariot (+60 scythed / +40 plain)',
    ],
  },

  // ----- Undead Paladins (regiment champions; cost charged vs character allowance) -----
  {
    id: 'ud-wraith-paladin',
    name: 'Wraith',
    nameEs: 'Aparición',
    role: 'character',
    pointsPerModel: 75,
    statLine: statLine({ M: 4, WS: 3, BS: 0, S: 3, T: 4, W: 3, I: 3, A: 2, Ld: 5 }),
    isCharacter: true,
    characterRank: 'champion',
    canBeGeneral: false,
    specialRules: [
      'Undead Paladin — leads a Skeleton, Zombie or Ghoul regiment',
      'Up to 1 magic item',
      'Causes fear',
      'Ethereal — only harmed by magic weapons or spells',
      'Immune to psychology',
      'Two-handed weapon (scythe)',
    ],
  },
  {
    id: 'ud-undead-knight-paladin',
    name: 'Undead Knight',
    nameEs: 'Caballero No Muerto',
    role: 'character',
    pointsPerModel: 37,
    statLine: statLine({ M: 4, WS: 3, BS: 0, S: 3, T: 4, W: 3, I: 3, A: 1, Ld: 8 }),
    isCharacter: true,
    characterRank: 'champion',
    canBeGeneral: false,
    specialRules: [
      'Undead Paladin — leads a Skeleton, Zombie, Ghoul, Skeletal Cavalry or Chariot regiment',
      'Up to 1 magic item',
      'Wight Blade (Espada Funeraria) & light armour',
      'Causes fear',
      'Immune to psychology',
    ],
  },

  // ===== Regiments (25%+) =====
  {
    id: 'ud-skeletal-cavalry',
    name: 'Skeletal Cavalry',
    nameEs: 'Caballería Esquelética',
    role: 'regiment',
    pointsPerModel: 18,
    statLine: statLine({ M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 }),
    minSize: 5,
    options: [LIGHT_ARMOUR_4, SHIELD_2, CAV_LANCE_4, LANCE_2, BOW_4],
    specialRules: [
      'Mounted on Skeletal Steeds (6+ save)',
      'Sword',
      'May become ethereal to move through walls/solid objects',
      'Causes fear',
      'Immune to psychology',
      'Additional casualties if beaten in combat (crumble)',
      'May carry a magic standard',
    ],
  },
  {
    id: 'ud-skeleton-warriors',
    name: 'Skeleton Warriors',
    nameEs: 'Guerreros Esqueleto',
    role: 'regiment',
    pointsPerModel: 8,
    statLine: statLine({ M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 }),
    minSize: 5,
    options: [LIGHT_ARMOUR_2, SHIELD_1, HEAVY_ARMOUR_3, TWO_HAND_2, HALBERD_2, SPEAR_1, CROSSBOW_3, BOW_2],
    specialRules: [
      'Sword',
      'Causes fear',
      'Immune to psychology',
      'Additional casualties if beaten in combat (crumble)',
      'May carry a magic standard',
    ],
  },
  {
    id: 'ud-zombies',
    name: 'Zombies',
    nameEs: 'Zombis',
    role: 'regiment',
    pointsPerModel: 4,
    statLine: statLine({ M: 4, WS: 2, BS: 0, S: 3, T: 3, W: 1, I: 1, A: 1, Ld: 5 }),
    minSize: 5,
    options: [LIGHT_ARMOUR_1, SHIELD_HALF, TWO_HAND_1],
    specialRules: [
      'Sword, club or other hand weapon',
      'Causes fear',
      'Immune to psychology',
      'Destroyed if they fail a break test (crumble)',
    ],
  },
  {
    id: 'ud-ghouls',
    name: 'Ghouls',
    nameEs: 'Necrófagos',
    role: 'regiment',
    pointsPerModel: 8,
    statLine: statLine({ M: 4, WS: 2, BS: 0, S: 3, T: 4, W: 1, I: 3, A: 2, Ld: 5 }),
    minSize: 5,
    specialRules: [
      'Sword, garrotte or other hand weapon',
      'Causes fear',
      'Immune to psychology',
      'Additional casualties if beaten in combat (crumble)',
    ],
  },
  {
    id: 'ud-spirits',
    name: 'Spirits',
    nameEs: 'Espíritus',
    role: 'regiment',
    pointsPerModel: 35,
    statLine: statLine({ M: 4, WS: 2, BS: 0, S: 3, T: 3, W: 3, I: 3, A: 1, Ld: 5 }),
    minSize: 5,
    specialRules: [
      'Causes fear',
      'Ignore terrain when moving',
      'Only harmed by magic weapons or spells',
      'Immune to psychology',
      'Destroyed if they fail a break test (crumble)',
      'A Necromancer may enslave Spirits',
    ],
  },
  {
    id: 'ud-undead-knights',
    name: 'Undead Knights',
    nameEs: 'Caballeros No Muertos',
    role: 'regiment',
    pointsPerModel: 37,
    statLine: statLine({ M: 4, WS: 3, BS: 0, S: 3, T: 4, W: 3, I: 3, A: 1, Ld: 8 }),
    minSize: 5,
    options: [SHIELD_1, LANCE_1, HEAVY_ARMOUR_3],
    specialRules: [
      'Wight Blade (Espada Funeraria) & light armour (6+ save)',
      'May be mounted on Skeletal Steeds',
      'Causes fear',
      'Immune to psychology',
      'Destroyed if they fail a break test (crumble)',
    ],
  },
  {
    id: 'ud-mummies',
    name: 'Mummies',
    nameEs: 'Momias',
    role: 'regiment',
    pointsPerModel: 45,
    statLine: statLine({ M: 3, WS: 3, BS: 0, S: 4, T: 5, W: 4, I: 3, A: 2, Ld: 8 }),
    minSize: 5,
    options: [LIGHT_ARMOUR_2, TWO_HAND_2],
    specialRules: [
      'Sword, mace or other hand weapon',
      'Causes fear',
      'Immune to psychology',
      'Double wounds from fire/flaming weapons and spells',
      'Additional casualties if beaten in combat (crumble)',
    ],
  },
  {
    id: 'ud-carrion',
    name: 'Carrion',
    nameEs: 'Carroñeros',
    role: 'regiment',
    pointsPerModel: 45,
    statLine: statLine({ M: 4, WS: 3, BS: 0, S: 3, T: 3, W: 2, I: 4, A: 3, Ld: 7 }),
    minSize: 1,
    specialRules: [
      'Flying',
      'Sword or other hand weapon',
      'Causes fear',
      'Immune to psychology',
      'Extra attack for each wound they cause',
      'Additional casualties if beaten in combat (crumble)',
      'Form one unit per 5 models',
    ],
  },
  {
    id: 'ud-spectres',
    name: 'Spectres',
    nameEs: 'Espectros',
    role: 'regiment',
    pointsPerModel: 75,
    statLine: statLine({ M: 4, WS: 3, BS: 0, S: 3, T: 4, W: 3, I: 3, A: 2, Ld: 5 }),
    minSize: 1,
    specialRules: [
      'Two-handed weapon (a scythe)',
      'Causes terror',
      'Ignore terrain when moving',
      'Only harmed by magic weapons or spells',
      'Immune to psychology',
      'Chilling Attack (special)',
      'Destroyed if they fail a break test (crumble)',
      'May be used as Undead Paladins; form one unit per 5 models',
    ],
  },

  // ===== War machines (0-25%) =====
  {
    id: 'ud-skull-catapult',
    name: 'Screaming Skull Catapult',
    nameEs: 'Catapulta de Cráneos Aullantes',
    role: 'warmachine',
    pointsPerModel: 74,
    statLine: statLine({ M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 }),
    specialRules: [
      'Crew of 3 Skeletons',
      'Flaming skulls — 48" range, S7, D3 wounds',
      'Any regiment that takes casualties must test for panic',
      'Causes fear',
      'Immune to psychology',
      'Additional casualties if beaten in combat (crumble)',
    ],
  },
  {
    id: 'ud-undead-chariot',
    name: 'Undead Chariot',
    nameEs: 'Carruaje No Muerto',
    role: 'chariot',
    pointsPerModel: 56,
    statLine: statLine({ M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 }),
    profiles: [
      { name: 'Chariot', nameEs: 'Carro', statLine: { T: 5, W: 3 } },
      {
        name: '2 Skeleton Warriors (crew)', nameEs: '2 Guerreros Esqueleto (tripulación)',
        statLine: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
      },
      {
        name: '2 Skeletal Steeds', nameEs: '2 Corceles Esqueléticos',
        statLine: SKELETAL_STEED_MOUNT.statLine!,
      },
    ],
    options: [LIGHT_ARMOUR_2, SHIELD_1, BOW_2, SCYTHE_BLADES],
    specialRules: [
      'Chariot — drawn by 2 Skeletal Steeds, crewed by 2 Skeleton Warriors',
      'Chariot: T5 W3, D6 impact hits',
      'Causes fear',
      'Immune to psychology',
      'Additional casualties if beaten in combat (crumble)',
      'May carry a magic standard',
    ],
  },

  // ===== Monsters (0-25%) =====
  {
    id: 'ud-zombie-dragon',
    name: 'Zombie Dragon',
    nameEs: 'Dragón Zombi',
    role: 'monster',
    pointsPerModel: 500,
    statLine: { M: 4, WS: 4, BS: 0, S: 7, T: 6, W: 7, I: 3, A: 6, Ld: 8 },
    specialRules: ['Large target', 'Terror', 'Flying', 'Causes fear', 'Immune to psychology'],
  },
  {
    id: 'ud-dragon',
    name: 'Dragon',
    nameEs: 'Dragón',
    role: 'monster',
    pointsPerModel: 450,
    statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 },
    specialRules: ['Large target', 'Terror', 'Flying', 'Breath weapon'],
  },
  {
    id: 'ud-great-dragon',
    name: 'Great Dragon',
    nameEs: 'Gran Dragón',
    role: 'monster',
    pointsPerModel: 600,
    statLine: { M: 6, WS: 7, BS: 0, S: 7, T: 7, W: 8, I: 7, A: 8, Ld: 8 },
    specialRules: ['Large target', 'Terror', 'Flying', 'Breath weapon'],
  },
  {
    id: 'ud-emperor-dragon',
    name: 'Emperor Dragon',
    nameEs: 'Dragón Emperador',
    role: 'monster',
    pointsPerModel: 750,
    statLine: { M: 6, WS: 8, BS: 0, S: 8, T: 8, W: 9, I: 6, A: 9, Ld: 9 },
    specialRules: ['Large target', 'Terror', 'Flying', 'Breath weapon'],
  },
  {
    id: 'ud-giant-spider',
    name: 'Giant Spider',
    nameEs: 'Araña Gigantesca',
    role: 'monster',
    pointsPerModel: 50,
    statLine: { M: 5, WS: 3, BS: 0, S: 5, T: 4, W: 4, I: 1, A: 2, Ld: 7 },
    specialRules: ['Large target'],
  },
  {
    id: 'ud-basilisk',
    name: 'Basilisk',
    nameEs: 'Basilisco',
    role: 'monster',
    pointsPerModel: 150,
    statLine: { M: 4, WS: 3, BS: 0, S: 4, T: 4, W: 2, I: 4, A: 3, Ld: 6 },
    specialRules: ['Petrifying gaze'],
  },
  {
    id: 'ud-swarms',
    name: 'Swarms',
    nameEs: 'Enjambres',
    role: 'monster',
    pointsPerModel: 100,
    // Profile shown for Bats; Rats/Toads/Lizards/Snakes/Insects-Spiders/Scorpions
    // share the same line bar Movement (20/15/10/10/8/10/10 cm) and S (mostly 3).
    statLine: { M: 8, WS: 3, BS: 0, S: 3, T: 2, W: 5, I: 1, A: 5, Ld: 10 },
    specialRules: ['Swarm', 'Multiple swarm types (Bats/Rats/Toads/Lizards/Snakes/Insects/Scorpions)'],
  },
  {
    id: 'ud-giant-scorpion',
    name: 'Giant Scorpion',
    nameEs: 'Escorpión Gigante',
    role: 'monster',
    pointsPerModel: 50,
    statLine: { M: 5, WS: 3, BS: 0, S: 5, T: 4, W: 4, I: 1, A: 2, Ld: 7 },
    specialRules: ['Large target'],
  },
  {
    id: 'ud-griffon',
    name: 'Griffon',
    nameEs: 'Grifo',
    role: 'monster',
    pointsPerModel: 150,
    statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 4, Ld: 8 },
    specialRules: ['Large target', 'Flying'],
  },
  {
    id: 'ud-hydra',
    name: 'Hydra',
    nameEs: 'Hidra',
    role: 'monster',
    pointsPerModel: 225,
    statLine: { M: 6, WS: 3, BS: 0, S: 5, T: 6, W: 7, I: 3, A: 5, Ld: 6 },
    specialRules: ['Large target'],
  },
  {
    id: 'ud-hippogriff',
    name: 'Hippogriff',
    nameEs: 'Hipogrifo',
    role: 'monster',
    pointsPerModel: 145,
    statLine: { M: 8, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 6, A: 3, Ld: 8 },
    specialRules: ['Large target', 'Flying'],
  },
  {
    id: 'ud-manticore',
    name: 'Manticore',
    nameEs: 'Mantícora',
    role: 'monster',
    pointsPerModel: 200,
    statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 },
    specialRules: ['Large target', 'Flying'],
  },
  {
    id: 'ud-chimera',
    name: 'Chimera',
    nameEs: 'Quimera',
    role: 'monster',
    pointsPerModel: 250,
    statLine: { M: 6, WS: 4, BS: 0, S: 7, T: 6, W: 6, I: 4, A: 6, Ld: 8 },
    specialRules: ['Large target'],
  },
  {
    id: 'ud-winged-serpent',
    name: 'Winged Serpent',
    nameEs: 'Serpiente Alada',
    role: 'monster',
    pointsPerModel: 180,
    statLine: { M: 6, WS: 5, BS: 0, S: 5, T: 6, W: 4, I: 4, A: 3, Ld: 5 },
    specialRules: ['Large target', 'Flying'],
  },

  // ===== Special characters (0-1 each; fixed profiles, magic items priced separately) =====
  {
    id: 'ud-nagash',
    name: 'Nagash, Supreme Lord of the Undead',
    nameEs: 'Nagash, Señor Supremo de los No Muertos',
    role: 'character',
    pointsPerModel: 475,
    statLine: { M: 6, WS: 7, BS: 7, S: 7, T: 7, W: 7, I: 6, A: 6, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character',
      'Great Necromancer (Wizard Level 4); auto-recovers Necromantic spells',
      '+1 modifier from magic items (profile)',
      'Immune to psychology',
      'Terror',
      'Fixed magic items: Mortis +35, Black Armour of Nagash +100, Book of Nagash +100, Staff of Power +40',
    ],
  },
  {
    id: 'ud-vlad-von-carstein',
    name: 'Vlad von Carstein, Vampire Lord',
    nameEs: 'Vlad von Carstein, Señor Vampiro',
    role: 'character',
    pointsPerModel: 375,
    statLine: { M: 6, WS: 7, BS: 5, S: 6, T: 5, W: 3, I: 8, A: 4, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    mounts: NIGHTMARE_ONLY_MOUNTS,
    specialRules: [
      'Special character',
      'Up to 4 magic items',
      'Causes fear',
      'Immune to psychology',
      'May ride a Nightmare (+2)',
      'Magic items: Carstein Ring +50, Sword of Cursed Energy +75',
    ],
  },
  {
    id: 'ud-isabella-von-carstein',
    name: 'Isabella von Carstein, Vampire Countess',
    nameEs: 'Isabella von Carstein, Condesa Vampiro',
    role: 'character',
    pointsPerModel: 175,
    statLine: { M: 6, WS: 7, BS: 5, S: 6, T: 5, W: 3, I: 8, A: 4, Ld: 9 },
    isCharacter: true,
    characterRank: 'wizard2',
    canBeGeneral: false,
    max: 1,
    mounts: NIGHTMARE_ONLY_MOUNTS,
    specialRules: [
      'Special character — may only be included if the army also includes Vlad',
      'Up to 2 magic items',
      'Causes fear',
      'Immune to psychology',
      'May ride a Nightmare (+2)',
    ],
  },
  {
    id: 'ud-manfred-von-carstein',
    name: 'Manfred von Carstein, Vampire & Great Necromancer',
    nameEs: 'Manfred von Carstein, Vampiro y Gran Nigromante',
    role: 'character',
    pointsPerModel: 475,
    statLine: { M: 6, WS: 7, BS: 5, S: 6, T: 5, W: 3, I: 8, A: 3, Ld: 9 },
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    mounts: NIGHTMARE_ONLY_MOUNTS,
    specialRules: [
      'Special character',
      'Great Necromancer (Wizard Level 4); auto-recovers spells',
      'Up to 4 magic items',
      'Causes fear',
      'Immune to psychology',
      'May ride a Nightmare (+2)',
    ],
  },
  {
    id: 'ud-heinrich-kemmler',
    name: 'Heinrich Kemmler, Lord of Necromancers',
    nameEs: 'Heinrich Kemmler, Señor de los Nigromantes',
    role: 'character',
    pointsPerModel: 350,
    statLine: { M: 4, WS: 7, BS: 7, S: 5, T: 4, W: 4, I: 6, A: 5, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    mounts: SKELETAL_STEED_ONLY_MOUNTS,
    specialRules: [
      'Special character',
      'Great Necromancer (Wizard Level 4)',
      'Up to 4 magic items',
      'May ride a Skeletal Steed (+2)',
      'Magic items: Chaos Wight Blade +75, Skull Staff +35, Cloak of Mist & Shadows +50',
    ],
  },
  {
    id: 'ud-arkhan-the-black',
    name: 'Arkhan the Black, King of Necromancers',
    nameEs: 'Arkhan el Negro, Rey de los Nigromantes',
    role: 'character',
    pointsPerModel: 350,
    statLine: { M: 4, WS: 7, BS: 7, S: 5, T: 4, W: 4, I: 6, A: 5, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard3',
    canBeGeneral: true,
    max: 1,
    profiles: [
      {
        name: 'Chariot of Arkhan', nameEs: 'Carro de Arkhan',
        statLine: { T: 5, W: 4 },
        specialRules: ['Flying', 'Built on a dead Manticore'],
      },
    ],
    specialRules: [
      'Special character',
      'Undead Necromancer',
      'Up to 3 magic items',
      'Immune to psychology',
      'Terror',
      'Rides the Chariot of Arkhan (flies; built on a dead Manticore)',
      'Magic items: Staff of Condemnation +50, Wight Blade of Arkhan +50, Book of the Damned +25, Chariot of Arkhan +50',
    ],
  },
  {
    id: 'ud-krell',
    name: 'Krell, Lord of the Undead',
    nameEs: 'Krell, Señor de los No Muertos',
    role: 'character',
    pointsPerModel: 160,
    statLine: { M: 4, WS: 5, BS: 0, S: 4, T: 5, W: 4, I: 5, A: 3, Ld: 8 },
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: true,
    max: 1,
    mounts: SKELETAL_STEED_ONLY_MOUNTS,
    specialRules: [
      'Special character (independent — need not join a unit)',
      'Up to 2 magic items',
      'Heavy armour & great weapon',
      'Immune to psychology',
      'Terror',
      'May ride a Skeletal Steed (+2)',
      'Magic items: Armour of the Defender +50, Black Axe of Krell +125',
    ],
  },
  {
    id: 'ud-settra',
    name: 'Settra, the Tomb King of Khemri',
    nameEs: 'Settra, el Rey Funerario de Khemri',
    role: 'character',
    pointsPerModel: 210,
    statLine: { M: 3, WS: 5, BS: 0, S: 5, T: 6, W: 5, I: 5, A: 4, Ld: 9 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    mounts: SKELETAL_STEED_ONLY_MOUNTS,
    specialRules: [
      'Special character (independent — need not join a unit)',
      'Up to 3 magic items (more than a normal Tomb King Mummy)',
      'Immune to psychology',
      'Terror',
      'Double wounds from fire/flaming attacks and spells',
      'May ride a Skeletal Steed (+2)',
      'Magic items: Staff of Osiris +50, Crown of the Tomb King +75, Skull Flail +30',
    ],
  },
  {
    id: 'ud-dieter-helsnicht',
    name: 'Dieter Helsnicht, Doom Lord of Middenheim',
    nameEs: 'Dieter Helsnicht, Señor de la Perdición de Middenheim',
    role: 'character',
    pointsPerModel: 410,
    statLine: { M: 4, WS: 7, BS: 7, S: 5, T: 4, W: 4, I: 6, A: 5, Ld: 10 },
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    profiles: [MANTICORE_PROFILE],
    specialRules: [
      'Special character',
      'Great Necromancer (Wizard Level 4)',
      'Up to 4 magic items',
      'Rides a Manticore (flies; causes terror)',
      'Magic items: Chaos Runic Sword +65, Death-Calling Staff +50, Manticore +200',
    ],
  },
]

export const UNDEAD: Army = {
  id: 'undead',
  name: 'Undead',
  nameEs: 'No Muertos',
  composition: STANDARD_5E_COMPOSITION,
  units,
  magicItems: COMMON_MAGIC_ITEMS,
  selectionRules: {
    dependencies: [
      { unitId: 'ud-isabella-von-carstein', requiresAnyOf: ['ud-vlad-von-carstein'], labelEn: 'Isabella von Carstein', labelEs: 'Isabella von Carstein' },
    ],
  },
}
