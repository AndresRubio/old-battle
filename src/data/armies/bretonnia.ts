import type { Army, EquipmentOption, MountOption, ProfileBlock, StatLine, UnitProfile } from '../types'
import { COMMON_MAGIC_ITEMS } from '../magicItems'

// Bretonnia — data transcribed from the official Bretonnia army list
// (1996, by Nigel Stillman; reprinted with corrections 1999),
// the 5th-edition army book. Points, profiles, equipment costs and 0-1 limits
// are taken directly from the army list (pp. 56-78) and bestiary statlines.
//
// NOTE: this edition prints Movement already in INCHES (humans M4, warhorse M8),
// so no cm→inch conversion is required here. Stat columns in the book are
// M / WS / BS / S / T / W / I / A / Ld.
//
// Bretonnia has NO war machines (forbidden by the code of chivalry). Knights are
// 'regiment' (Knights 25%+; Commoners 0-50%). Pegasus/Hippogriff/Dragon etc. are
// monsters, taken as army monsters (0-25%) or as character mounts.

const human = (over: Partial<StatLine> = {}): StatLine => ({
  M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7, ...over,
})

// --- Character equipment list (p.59). Knightly characters & wizards. ---
// Per-model costs; the same `id` is reused so the UI treats it as one slot.
const LANCE: EquipmentOption = { id: 'lance', name: 'Lance (mounted Knight)', pointsPerModel: 2 }
const DOUBLE_HANDED: EquipmentOption = { id: 'great-weapon', name: 'Double-handed sword or axe', pointsPerModel: 2 }
const SHIELD_CHAR: EquipmentOption = { id: 'shield', name: 'Shield', pointsPerModel: 1 }
const LIGHT_ARMOUR_CHAR: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 2 }
const HEAVY_ARMOUR_CHAR: EquipmentOption = { id: 'heavy-armour', name: 'Heavy armour', pointsPerModel: 3 }
const BARDING: EquipmentOption = { id: 'barding', name: 'Barding for warhorse', pointsPerModel: 4 }

const KNIGHT_EQUIP: EquipmentOption[] = [
  BARDING,
  LANCE,
  DOUBLE_HANDED,
  SHIELD_CHAR,
  LIGHT_ARMOUR_CHAR,
  HEAVY_ARMOUR_CHAR,
]

// --- Character mounts (p.59: "may ride a Bretonnian Warhorse or a monster";
// monster mounts use the bestiary statlines below; costs from the army list). ---
const WARHORSE_MOUNT: MountOption = {
  id: 'mount-warhorse', name: 'Bretonnian Warhorse', nameEs: 'Caballo de Guerra Bretoniano',
  points: 3, statLine: { M: 8, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
}
const PEGASUS_MOUNT: MountOption = {
  id: 'mount-pegasus', name: 'Pegasus', nameEs: 'Pegaso',
  points: 50, statLine: { M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 5 },
  specialRules: ['Flying'],
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
const WYVERN_MOUNT: MountOption = {
  id: 'mount-wyvern', name: 'Wyvern', nameEs: 'Wyvern',
  points: 180, statLine: { M: 6, WS: 5, BS: 0, S: 5, T: 6, W: 4, I: 4, A: 3, Ld: 5 },
  specialRules: ['Flying', 'Large target'],
}
const DRAGON_MOUNT: MountOption = {
  id: 'mount-dragon', name: 'Dragon', nameEs: 'Dragón',
  points: 450, statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 },
  specialRules: ['Flying', 'Terror', 'Large target', 'Breath weapon'],
}
const GREAT_DRAGON_MOUNT: MountOption = {
  id: 'mount-great-dragon', name: 'Great Dragon', nameEs: 'Gran Dragón',
  points: 600, statLine: { M: 6, WS: 7, BS: 0, S: 7, T: 7, W: 8, I: 8, A: 8, Ld: 8 },
  specialRules: ['Flying', 'Terror', 'Large target', 'Breath weapon'],
}
const EMPEROR_DRAGON_MOUNT: MountOption = {
  id: 'mount-emperor-dragon', name: 'Emperor Dragon', nameEs: 'Dragón Emperador',
  points: 750, statLine: { M: 6, WS: 8, BS: 0, S: 8, T: 8, W: 9, I: 6, A: 9, Ld: 9 },
  specialRules: ['Flying', 'Terror', 'Large target', 'Breath weapon'],
}

/** Full mount list for knightly lords/heroes ("a warhorse or a monster"). */
const KNIGHT_MOUNTS: MountOption[] = [
  WARHORSE_MOUNT, PEGASUS_MOUNT, GRIFFON_MOUNT, HIPPOGRIFF_MOUNT, MANTICORE_MOUNT,
  WYVERN_MOUNT, DRAGON_MOUNT, GREAT_DRAGON_MOUNT, EMPEROR_DRAGON_MOUNT,
]

// --- Fixed (non-selectable) mounts for characters who always ride one. Cost is
// already included in the model's points, so these are display-only profiles. ---
const WARHORSE_PROFILE: ProfileBlock = {
  name: 'Bretonnian Warhorse', nameEs: 'Caballo de Guerra Bretoniano', statLine: WARHORSE_MOUNT.statLine!,
}
const HIPPOGRIFF_PROFILE: ProfileBlock = {
  name: 'Hippogriff', nameEs: 'Hipogrifo', statLine: HIPPOGRIFF_MOUNT.statLine!, specialRules: HIPPOGRIFF_MOUNT.specialRules,
}
const PEGASUS_PROFILE: ProfileBlock = {
  name: 'Pegasus', nameEs: 'Pegaso', statLine: PEGASUS_MOUNT.statLine!, specialRules: PEGASUS_MOUNT.specialRules,
}
const UNICORN_PROFILE: ProfileBlock = {
  name: 'Unicorn', nameEs: 'Unicornio',
  statLine: { M: 9, WS: 5, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 9 },
  specialRules: ['Horn attack (S6 charge)', 'Natural dispel (4+)'],
}

// --- Commoner regiment equipment (p.59 commoner list + per-unit option lines). ---
// Mounted Squires (p.64): spear +2, bow +4, shield +2, light armour +4.
const MS_SPEAR: EquipmentOption = { id: 'spears', name: 'Spears', pointsPerModel: 2 }
const MS_BOW: EquipmentOption = { id: 'bow', name: 'Bows', pointsPerModel: 4 }
const MS_SHIELD: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 2 }
const MS_LIGHT_ARMOUR: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 4 }
// Squires (p.64): spear +1, longbow +3.
const SQ_SPEAR: EquipmentOption = { id: 'spears', name: 'Spears', pointsPerModel: 1 }
const SQ_LONGBOW: EquipmentOption = { id: 'longbow', name: 'Longbows', pointsPerModel: 3 }
// Men-at-arms (p.64): spear +1, halberd +2, shield +1, light armour +2.
const MAA_SPEAR: EquipmentOption = { id: 'spears', name: 'Spears', pointsPerModel: 1 }
const MAA_HALBERD: EquipmentOption = { id: 'halberd', name: 'Halberds', pointsPerModel: 2 }
const MAA_SHIELD: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 1 }
const MAA_LIGHT_ARMOUR: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 2 }
// Bowmen (p.65): light armour +2.
const BOW_LIGHT_ARMOUR: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 2 }

// Wizard level upgrades (p.61). Wizard 56 → Champion (L2) 118 → Master (L3) 190 →
// Lord (L4) 287. Cumulative deltas +62 / +134 / +231. Damsels/Prophetesses of the
// Lady are the Bretonnian wizards.
const BR_WIZARD_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Wizard Champion (level 2)', pointsPerModel: 62, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Master Wizard (level 3)', pointsPerModel: 134, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Wizard Lord (level 4)', pointsPerModel: 231, magicItemSlotsDelta: 3 },
]

const units: UnitProfile[] = [
  // ===== Characters (0-75%) =====
  {
    id: 'br-general',
    name: 'General of Bretonnia',
    nameEs: 'General de Bretonia',
    role: 'character',
    pointsPerModel: 100,
    statLine: human({ WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 9 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    options: KNIGHT_EQUIP,
    mounts: KNIGHT_MOUNTS,
    specialRules: [
      'Knight',
      'Sword (free)',
      'May ride a Bretonnian Warhorse (+3) or a monster',
      "Knight's Virtue (always); may take a second virtue",
    ],
  },
  {
    id: 'br-battle-standard',
    name: 'Battle Standard of Bretonnia',
    nameEs: 'Portaestandarte de Batalla de Bretonia',
    role: 'character',
    pointsPerModel: 80,
    statLine: human({ WS: 4, BS: 4, S: 4, T: 3, W: 1, I: 4, A: 2, Ld: 7 }),
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    isBSB: true,
    max: 1,
    options: KNIGHT_EQUIP,
    mounts: KNIGHT_MOUNTS,
    specialRules: [
      '0-1',
      'Knight',
      'Sword and Battle Standard',
      'May carry one magic item (a magic standard makes it the army battle standard)',
      'May ride a Bretonnian Warhorse (+3) or a monster',
    ],
  },
  {
    id: 'br-hero',
    name: 'Hero',
    nameEs: 'Héroe',
    role: 'character',
    pointsPerModel: 65,
    statLine: human({ WS: 5, BS: 5, S: 4, T: 4, W: 2, I: 5, A: 3, Ld: 8 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: true,
    options: KNIGHT_EQUIP,
    mounts: KNIGHT_MOUNTS,
    specialRules: [
      'Knight',
      'Sword (free)',
      'May ride a Bretonnian Warhorse (+3) or a monster',
      "Knight's Virtue (always); may take a second virtue",
    ],
  },
  {
    id: 'br-commoner-champion',
    name: 'Commoner Champion',
    nameEs: 'Campeón Plebeyo',
    role: 'character',
    pointsPerModel: 30,
    statLine: human({ WS: 4, BS: 4, I: 4, A: 2 }),
    isCharacter: true,
    characterRank: 'champion',
    specialRules: ['Leads a Commoner regiment', 'Equipped as his unit', 'No knightly virtue'],
  },
  {
    id: 'br-knightly-champion',
    name: 'Knightly Champion',
    nameEs: 'Campeón Caballero',
    role: 'character',
    pointsPerModel: 35,
    statLine: human({ WS: 4, BS: 4, S: 4, T: 3, I: 4, A: 2 }),
    isCharacter: true,
    characterRank: 'champion',
    profiles: [WARHORSE_PROFILE],
    specialRules: ['Leads a Knight regiment', 'Always rides a Bretonnian Warhorse (+3)', "Knight's Virtue"],
  },
  {
    id: 'br-questing-champion',
    name: 'Questing Knight Champion',
    nameEs: 'Campeón Caballero del Periplo',
    role: 'character',
    pointsPerModel: 40,
    statLine: human({ WS: 4, BS: 4, S: 4, T: 3, I: 4, A: 2, Ld: 8 }),
    isCharacter: true,
    characterRank: 'champion',
    profiles: [WARHORSE_PROFILE],
    specialRules: ['Leads a Questing Knight regiment', 'Always rides a Bretonnian Warhorse (+3)', 'Questing Virtue'],
  },
  {
    id: 'br-grail-champion',
    name: 'Grail Knight Champion',
    nameEs: 'Campeón Caballero del Grial',
    role: 'character',
    pointsPerModel: 50,
    statLine: human({ WS: 5, BS: 4, S: 4, T: 3, I: 4, A: 2, Ld: 9 }),
    isCharacter: true,
    characterRank: 'champion',
    profiles: [WARHORSE_PROFILE],
    specialRules: ['Leads a Grail Knight regiment', 'Always rides a Bretonnian Warhorse (+3)', 'Grail Virtue — immune to psychology'],
  },
  {
    id: 'br-wizard',
    name: 'Damsel of the Lady',
    nameEs: 'Damisela de la Dama',
    role: 'character',
    pointsPerModel: 56,
    statLine: human({ WS: 3, BS: 3, I: 4 }),
    isCharacter: true,
    characterRank: 'wizard1',
    lores: ['battle'],
    options: [...BR_WIZARD_LEVELS],
    mounts: [WARHORSE_MOUNT, PEGASUS_MOUNT],
    specialRules: [
      'Wizard (one Battle Magic spell per level)',
      'Sword (free)',
      'Cannot cast spells if wearing armour',
      'May ride a Bretonnian Warhorse (+3) or a Pegasus',
    ],
  },

  // ===== Knights (25%+ — regiments) =====
  {
    id: 'br-grail-knights',
    name: 'Grail Knights',
    nameEs: 'Caballeros del Grial',
    role: 'regiment',
    pointsPerModel: 45,
    statLine: human({ WS: 5, BS: 3, S: 4, I: 4, Ld: 9 }),
    mount: WARHORSE_PROFILE,
    minSize: 5,
    max: 1,
    specialRules: [
      '0-1 unit (all Grail Knights form one unit)',
      'Heavy armour, shield, sword and lance (2+ save)',
      'Barded Bretonnian Warhorse',
      'Lance formation',
      'Grail Virtue — immune to psychology',
      'May carry a magic standard',
    ],
  },
  {
    id: 'br-questing-knights',
    name: 'Questing Knights',
    nameEs: 'Caballeros del Periplo',
    role: 'regiment',
    pointsPerModel: 41,
    statLine: human({ WS: 4, BS: 3, S: 4, I: 4, Ld: 8 }),
    mount: WARHORSE_PROFILE,
    minSize: 5,
    max: 1,
    specialRules: [
      '0-1 unit (all Questing Knights form one unit)',
      'Heavy armour, shield, sword and lance (2+ save)',
      'Barded Bretonnian Warhorse',
      'Lance formation',
      'Questing Virtue — immune to panic',
      'May carry a magic standard',
    ],
  },
  {
    id: 'br-knights-of-the-realm',
    name: 'Knights of the Realm',
    nameEs: 'Caballeros del Reino',
    role: 'regiment',
    pointsPerModel: 39,
    statLine: human({ WS: 4, S: 4 }),
    mount: WARHORSE_PROFILE,
    minSize: 5,
    specialRules: [
      'Heavy armour, shield, sword and lance (2+ save)',
      'Barded Bretonnian Warhorse',
      'Lance formation',
      "Knight's Virtue — ignore panic from fleeing non-Knights",
      'May carry a magic standard',
    ],
  },
  {
    id: 'br-knights-errant',
    name: 'Knights Errant',
    nameEs: 'Caballeros Andantes',
    role: 'regiment',
    pointsPerModel: 32,
    statLine: human(),
    mount: WARHORSE_PROFILE,
    minSize: 5,
    specialRules: [
      'Heavy armour, shield, sword and lance (2+ save)',
      'Barded Bretonnian Warhorse',
      'Lance formation',
      "Knight's Virtue — ignore panic from fleeing commoners or allies",
      'One unit may carry a magic standard',
    ],
  },

  // ===== Commoners (0-50% — regiments) =====
  {
    id: 'br-mounted-squires',
    name: 'Mounted Squires',
    nameEs: 'Escuderos Montados',
    role: 'regiment',
    pointsPerModel: 10,
    statLine: human(),
    mount: WARHORSE_PROFILE,
    minSize: 5,
    options: [MS_SPEAR, MS_BOW, MS_SHIELD, MS_LIGHT_ARMOUR],
    specialRules: ['Ride horses (6+ save)', 'Swords', 'Light cavalry — may skirmish'],
  },
  {
    id: 'br-squires',
    name: 'Squires',
    nameEs: 'Escuderos',
    role: 'regiment',
    pointsPerModel: 5,
    statLine: human(),
    minSize: 5,
    options: [SQ_SPEAR, SQ_LONGBOW],
    specialRules: ['Swords', 'Skirmish'],
  },
  {
    id: 'br-men-at-arms',
    name: 'Men-at-Arms',
    nameEs: 'Hombres de Armas',
    role: 'regiment',
    pointsPerModel: 5,
    statLine: human(),
    minSize: 5,
    options: [MAA_SPEAR, MAA_HALBERD, MAA_SHIELD, MAA_LIGHT_ARMOUR],
    specialRules: ['Sword and additional hand weapon'],
  },
  {
    id: 'br-bowmen',
    name: 'Bowmen',
    nameEs: 'Arqueros',
    role: 'regiment',
    pointsPerModel: 8,
    statLine: human(),
    minSize: 5,
    options: [BOW_LIGHT_ARMOUR],
    specialRules: ['Sword and longbow', 'Arrowhead formation'],
  },

  // ===== Monsters (0-25%; also character mounts) =====
  {
    id: 'br-dragon',
    name: 'Dragon',
    nameEs: 'Dragón',
    role: 'monster',
    pointsPerModel: 450,
    statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 },
    specialRules: ['Flying', 'Terror', 'Large target', 'Breath weapon'],
  },
  {
    id: 'br-great-dragon',
    name: 'Great Dragon',
    nameEs: 'Gran Dragón',
    role: 'monster',
    pointsPerModel: 600,
    statLine: { M: 6, WS: 7, BS: 0, S: 7, T: 7, W: 8, I: 8, A: 8, Ld: 8 },
    specialRules: ['Flying', 'Terror', 'Large target', 'Breath weapon'],
  },
  {
    id: 'br-emperor-dragon',
    name: 'Emperor Dragon',
    nameEs: 'Dragón Emperador',
    role: 'monster',
    pointsPerModel: 750,
    statLine: { M: 6, WS: 8, BS: 0, S: 8, T: 8, W: 9, I: 6, A: 9, Ld: 9 },
    specialRules: ['Flying', 'Terror', 'Large target', 'Breath weapon'],
  },
  {
    id: 'br-griffon',
    name: 'Griffon',
    nameEs: 'Grifo',
    role: 'monster',
    pointsPerModel: 150,
    statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 4, Ld: 8 },
    specialRules: ['Flying', 'Large target'],
  },
  {
    id: 'br-hippogriff',
    name: 'Hippogriff',
    nameEs: 'Hipogrifo',
    role: 'monster',
    pointsPerModel: 145,
    statLine: { M: 8, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 6, A: 3, Ld: 8 },
    specialRules: ['Flying', 'Large target'],
  },
  {
    id: 'br-manticore',
    name: 'Manticore',
    nameEs: 'Mantícora',
    role: 'monster',
    pointsPerModel: 200,
    statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 },
    specialRules: ['Flying', 'Large target'],
  },
  {
    id: 'br-wyvern',
    name: 'Wyvern',
    nameEs: 'Wyvern',
    role: 'monster',
    pointsPerModel: 180,
    statLine: { M: 6, WS: 5, BS: 0, S: 5, T: 6, W: 4, I: 4, A: 3, Ld: 5 },
    specialRules: ['Flying', 'Large target'],
  },
  {
    id: 'br-swarm',
    name: 'Swarm',
    nameEs: 'Enjambre',
    role: 'monster',
    pointsPerModel: 100,
    statLine: { M: 6, WS: 3, BS: 0, S: 3, T: 2, W: 5, I: 1, A: 5, Ld: 10 },
    specialRules: ['Rats/Frogs/Lizards/Bats/Serpents/Insects/Spiders/Scorpions', 'Bats are M8; profile shown for ground swarms'],
  },

  // ===== Special characters (0-1 each) =====
  {
    id: 'br-louen-leoncoeur',
    name: 'Louen Leoncoeur, the Lionhearted (King of Bretonnia)',
    nameEs: 'Louen Corazón de León (Rey de Bretonia)',
    role: 'character',
    pointsPerModel: 505,
    statLine: human({ WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    profiles: [HIPPOGRIFF_PROFILE],
    specialRules: [
      'Special character',
      'Rides a Hippogriff',
      'Grail Virtue & Virtue of the Lionheart',
      'Fixed magic items: Crown of Bretonnia, Armour of Brilliance (3+ save, -2 to hit), Lion Lance, Tabard of Kings',
    ],
  },
  {
    id: 'br-repanse',
    name: 'Repanse de Lyonesse',
    nameEs: 'Repanse de Lyonesse',
    role: 'character',
    pointsPerModel: 310,
    statLine: human({ WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 9 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    canBeBSB: true,
    max: 1,
    profiles: [WARHORSE_PROFILE],
    specialRules: [
      'Special character',
      'May be General and Battle Standard Bearer (fulfils both roles)',
      'Rides a barded Bretonnian Warhorse',
      "Knight's Virtue & Virtue of Devotion",
      'Causes fear (Halo of Maidenly Wrath)',
      'Fixed magic items: Sword of Lyonesse, Fleur de Lys Banner',
    ],
  },
  {
    id: 'br-odo',
    name: "Baron Odo d'Outremer (with Suliman le Saracen)",
    nameEs: "Barón Odo d'Outremer (con Suliman el Sarraceno)",
    role: 'character',
    pointsPerModel: 110,
    statLine: human({ WS: 4, BS: 4, S: 4, T: 3, W: 1, I: 4, A: 2, Ld: 8 }),
    isCharacter: true,
    characterRank: 'champion',
    max: 1,
    specialRules: [
      'Special character',
      'Champion of a unit of Knights of the Realm or Knights Errant',
      'Questing Knight Champion (Questing Virtue)',
      'Heavy armour & shield; rides a barded Bretonnian Warhorse',
      'Accompanied by Suliman le Saracen (WS4 BS4 S4 T4 W1 I4 A2 Ld7)',
      'Fixed magic item: Morning Star of Fracasse',
    ],
  },
  {
    id: 'br-roland',
    name: 'Roland le Marechal',
    nameEs: 'Roland le Marechal',
    role: 'character',
    pointsPerModel: 78,
    statLine: human({ WS: 4, BS: 4, S: 4, T: 3, W: 1, I: 4, A: 2, Ld: 7 }),
    isCharacter: true,
    characterRank: 'champion',
    max: 1,
    specialRules: [
      'Special character',
      'Champion of a unit of Knights Errant or Knights of the Realm',
      'Sword, lance, heavy armour; rides a barded Bretonnian Warhorse',
      "Knight's Virtue",
      "Fixed magic item: Roland's Warhorn (bound spell)",
    ],
  },
  {
    id: 'br-tancred',
    name: 'Tancred, Duc de Quenelles',
    nameEs: 'Tancred, Duque de Quenelles',
    role: 'character',
    pointsPerModel: 265,
    statLine: human({ WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character',
      'Independent character or General',
      'Grail Virtue (immune to psychology) & Virtue of Purity',
      'Lance, heavy armour; may ride a barded Bretonnian Warhorse (+3) or a monster',
      'Fixed magic items: Blade of Couronne, Grail Shield, Blessed Draught',
    ],
  },
  {
    id: 'br-bertrand',
    name: 'Bertrand the Brigand (and the Bowmen of Bergerac)',
    nameEs: 'Bertrand el Bandido (y los Arqueros de Bergerac)',
    role: 'character',
    pointsPerModel: 83,
    statLine: human({ WS: 4, BS: 5, S: 4, I: 4, A: 2, Ld: 8 }),
    isCharacter: true,
    characterRank: 'champion',
    max: 1,
    specialRules: [
      'Special character (+1 point per Bowman in the regiment)',
      'Commoner Champion of a unit of Bowmen',
      'Sword and longbow; re-roll to hit once per turn shooting',
      'Accompanied by Hugo le Petit (longbow hits at S5) and Gui le Gros',
      'Bowmen of Bergerac may skirmish',
      'Fixed magic item: The Black Arrow',
    ],
  },
  {
    id: 'br-knight-perilous-lance',
    name: 'The Knight of the Perilous Lance',
    nameEs: 'El Caballero de la Lanza Peligrosa',
    role: 'character',
    pointsPerModel: 121,
    statLine: human({ WS: 5, BS: 5, S: 4, T: 4, W: 2, I: 5, A: 3, Ld: 8 }),
    isCharacter: true,
    characterRank: 'hero',
    max: 1,
    specialRules: [
      'Special character',
      'Independent character',
      'Lance, heavy armour & shield; rides a barded Bretonnian Warhorse',
      "Knight's Virtue & Virtue of the Joust",
      'Special battle skills: the Perilous Lance (-1 to enemy save on charge) & the Parrying Shield',
      'No magic items',
    ],
  },
  {
    id: 'br-tristan',
    name: 'Tristran le Troubadour (with Jules le Jongleur)',
    nameEs: 'Tristran le Troubadour (con Jules le Jongleur)',
    role: 'character',
    pointsPerModel: 205,
    statLine: human({ WS: 5, BS: 5, S: 4, T: 4, W: 2, I: 5, A: 3, Ld: 8 }),
    isCharacter: true,
    characterRank: 'hero',
    max: 1,
    specialRules: [
      'Special character',
      'Independent character',
      'Sword, lance, heavy armour & shield; rides a barded Bretonnian Warhorse',
      'Questing Virtue (immune to panic) & Virtue of Noble Disdain',
      'Accompanied by Jules le Jongleur (WS4 BS3 S3 T3 W1 I4 A1 Ld7)',
      'Songs of Noble Valour (chansons) instead of magic items',
    ],
  },
  {
    id: 'br-reynard',
    name: 'Reynard le Chasseur (with Groffe et Griffe)',
    nameEs: 'Reynard le Chasseur (con Groffe et Griffe)',
    role: 'character',
    pointsPerModel: 90,
    statLine: human({ WS: 4, BS: 4, S: 4, T: 3, W: 1, I: 4, A: 3, Ld: 7 }),
    isCharacter: true,
    characterRank: 'champion',
    max: 1,
    specialRules: [
      'Special character',
      'Champion of a unit of Knights Errant, Knights of the Realm or Mounted Squires',
      "Knight's Virtue",
      'Boar spear (+1 S, holds at bay), heavy armour & shield; rides a barded Bretonnian Warhorse',
      'Hawk gives +1 attack (in profile)',
      'Accompanied by wolf-hounds Groffe & Griffe (M8 WS4 BS0 S4 T3 W1 I4 A1 Ld6)',
      'No magic items',
    ],
  },
  {
    id: 'br-armand',
    name: "Armand d'Aquitaine (Battle Standard Bearer)",
    nameEs: "Armand d'Aquitaine (Portaestandarte de Batalla)",
    role: 'character',
    pointsPerModel: 235,
    statLine: human({ WS: 5, BS: 4, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 9 }),
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    max: 1,
    specialRules: [
      'Special character',
      'Army Battle Standard Bearer (replaces the standard BSB)',
      'Sword, heavy armour & shield; rides a barded Bretonnian Warhorse',
      'Grail Virtue (immune to psychology) & Virtue of Knightly Ardour',
      'Fixed magic item: Banner of the Lady of the Lake',
    ],
  },
  {
    id: 'br-jasperre',
    name: 'Jasperre le Beau, Dragonslayer',
    nameEs: 'Jasperre le Beau, Matadragones',
    role: 'character',
    pointsPerModel: 234,
    statLine: human({ WS: 5, BS: 5, S: 4, T: 4, W: 2, I: 5, A: 3, Ld: 8 }),
    isCharacter: true,
    characterRank: 'hero',
    max: 1,
    profiles: [PEGASUS_PROFILE],
    specialRules: [
      'Special character',
      'Independent character',
      'Rides a Pegasus',
      'Sword, heavy armour & shield',
      'Questing Virtue (immune to panic, may lead Questing Knights) & Virtue of Valour',
      'Fixed magic items: Virtuous Lance, Helm of the Dragon Slayer, Claw of Malgrimace',
    ],
  },
  {
    id: 'br-bohemond',
    name: "Bohemond 'Beastslayer', Duke of Bastonne",
    nameEs: "Bohemond 'Matabestias', Duque de Bastonne",
    role: 'character',
    pointsPerModel: 200,
    statLine: human({ WS: 5, BS: 5, S: 4, T: 4, W: 3, I: 5, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character',
      'Independent character',
      'Heavy armour & barding; rides a barded Bretonnian Warhorse',
      'Grail Virtue (immune to psychology) & Virtue of the Impetuous Knight',
      "Fixed magic items: Beast Mace of Bastonne, Bohemond's Shield",
    ],
  },
  {
    id: 'br-green-knight',
    name: 'The Green Knight',
    nameEs: 'El Caballero Verde',
    role: 'character',
    pointsPerModel: 170,
    statLine: human({ WS: 6, BS: 3, S: 5, T: 5, W: 1, I: 6, A: 1, Ld: 10 }),
    isCharacter: true,
    characterRank: 'hero',
    max: 1,
    specialRules: [
      'Special character',
      'Hermit Knight — never joins a unit; guards a sacred terrain feature',
      'Heavy armour & shield; rides a barded Bretonnian Warhorse (2+ save)',
      'Causes fear',
      'Regeneration (regenerates wounds on 2+)',
      'Immune to psychology',
      'Natural dispel 2+',
      'Fixed magic item: the Dolorous Blade',
    ],
  },
  {
    id: 'br-morgiana',
    name: 'Morgiana le Fay, Fay Enchantress of Bretonnia',
    nameEs: 'Morgiana le Fay, Hada Encantadora de Bretonia',
    role: 'character',
    pointsPerModel: 429,
    statLine: human({ WS: 3, BS: 3, S: 3, T: 3, W: 3, I: 6, A: 1, Ld: 9 }),
    isCharacter: true,
    characterRank: 'wizard4',
    lores: ['battle'],
    max: 1,
    profiles: [UNICORN_PROFILE],
    specialRules: [
      'Special character',
      'Prophetess of the Lady of the Lake (wizard)',
      'Rides a Unicorn',
      'Sword',
      'Favours of the Fay',
    ],
  },
]

export const BRETONNIA: Army = {
  id: 'bretonnia',
  name: 'Bretonnia',
  nameEs: 'Bretonia',
  // book p.59: characters 0-75%, no war machines
  composition: { maxCharactersPct: 75, minRegimentsPct: 25, maxWarMachinesPct: 0, maxMonstersPct: 25, requiresGeneral: true },
  units,
  magicItems: COMMON_MAGIC_ITEMS,
}
