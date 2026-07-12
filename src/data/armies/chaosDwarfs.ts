import type { Army, EquipmentOption, MountOption, StatLine, UnitProfile } from '../types'
import { STANDARD_5E_COMPOSITION } from '../types'
import { COMMON_MAGIC_ITEMS } from '../magicItems'
import { SHIELD } from '../unitOptions'

// Chaos Dwarfs — data transcribed from the official Chaos Dwarfs army list
// (1995, by Rick Priestley & Grant Williams), the 4th/5th-edition
// army book. Points, profiles, equipment costs and 0-1 limits are taken directly
// from the book's army list (pp. 52-64) and bestiary (pp. 9-13).
//
// NOTE: the book gives Movement in centimetres; values here are converted to the
// inches used elsewhere in the app (8cm→3", 10→4, 12→5, 15→6, 20→8, 22→9).
// Stat columns in the book are M / HA(WS) / HP(BS) / F(S) / R(T) / H(W) / I / A / L(Ld).

const chaosDwarf = (over: Partial<StatLine> = {}): StatLine => ({
  M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9, ...over,
})
const bullCentaur = (over: Partial<StatLine> = {}): StatLine => ({
  M: 8, WS: 4, BS: 3, S: 4, T: 4, W: 2, I: 3, A: 2, Ld: 9, ...over,
})
const hobgoblin = (over: Partial<StatLine> = {}): StatLine => ({
  M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 6, ...over,
})

// --- Army-specific equipment options (per-model costs, from the equipment list
//     p.55 and the per-unit option lines pp.58-60). Same `id` = mutually exclusive
//     slot reused across units at the unit's own price (cf. Dark Elves). ---
const LIGHT_ARMOUR_1: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 1 }
const LIGHT_ARMOUR_2: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 2 }
const SHIELD_HALF: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 0.5 }
const BOWS_2: EquipmentOption = { id: 'bows', name: 'Bows', pointsPerModel: 2 }
const SHORTBOW_1: EquipmentOption = { id: 'short-bow', name: 'Short bows', pointsPerModel: 1 }
const SHORTBOW_HALF: EquipmentOption = { id: 'short-bow', name: 'Short bows', pointsPerModel: 0.5 }
const TWO_HAND_2: EquipmentOption = { id: 'two-hand', name: 'Two-handed weapons', pointsPerModel: 2 }
const TWO_HAND_1: EquipmentOption = { id: 'two-hand', name: 'Two-handed weapons', pointsPerModel: 1 }
const HALBERD_2: EquipmentOption = { id: 'halberd', name: 'Halberds', pointsPerModel: 2 }
const HALBERD_1: EquipmentOption = { id: 'halberd', name: 'Halberds', pointsPerModel: 1 }
const SPEARS_1: EquipmentOption = { id: 'spears', name: 'Spears', pointsPerModel: 1 }
const SPEARS_HALF: EquipmentOption = { id: 'spears', name: 'Spears', pointsPerModel: 0.5 }
const ADD_HAND_WEAPON: EquipmentOption = { id: 'add-hand-weapon', name: 'Additional hand weapon', pointsPerModel: 1 }

// Sorcerer level upgrades — Brujo 59 → Paladín Brujo (L2) 121 → Maestro de Brujos
// (L3) 219 → Gran Brujo (L4) 328. Deltas +62 / +160 / +269 (p.57).
const CD_WIZARD_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Wizard Level 2 (Sorcerer Paladin)', pointsPerModel: 62, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Wizard Level 3 (Master Sorcerer)', pointsPerModel: 160, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Wizard Level 4 (Great Sorcerer)', pointsPerModel: 269, magicItemSlotsDelta: 3 },
]

// --- Character mounts. Chaos Dwarf Lords/Heroes/Sorcerers are too heavy for
//     ordinary monsters: the book lets them ride only the Great Taurus or Lammasu
//     (army list pp.56-57). Statlines & special rules are reused verbatim from the
//     standalone bestiary entries (cd-great-taurus / cd-lammasu, below), which are
//     dual-use — they remain selectable as army monsters too. Hobgoblin characters
//     (Gorduz) may ride a Giant Wolf, the same mount as the Wolf Riders (M22→9").
const GREAT_TAURUS_MOUNT: MountOption = {
  id: 'mount-great-taurus', name: 'Great Taurus', nameEs: 'Gran Tauro',
  points: 225, statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 5, I: 7, A: 4, Ld: 8 },
  specialRules: ['Flying', 'Terror', 'Fiery body (4+ ward save)', 'Fire breath', 'Large target'],
}
const LAMMASU_MOUNT: MountOption = {
  id: 'mount-lammasu', name: 'Lammasu', nameEs: 'Lammasu',
  points: 200, statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 7, W: 5, I: 6, A: 3, Ld: 8 },
  specialRules: ['Flying', 'Terror', 'Sorcerous aura — dispels spells on 4+', 'Large target'],
}
const GIANT_WOLF_MOUNT: MountOption = {
  id: 'mount-giant-wolf', name: 'Giant Wolf', nameEs: 'Lobo Gigante',
  points: 4, statLine: { M: 9, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 3 },
}

/** Mounts available to Chaos Dwarf characters (Great Taurus or Lammasu). */
const CD_MONSTER_MOUNTS: MountOption[] = [LAMMASU_MOUNT, GREAT_TAURUS_MOUNT]

const units: UnitProfile[] = [
  // ===== Characters (0-50%) =====
  {
    id: 'cd-general',
    name: 'Chaos Dwarf General',
    nameEs: 'General Enano del Caos',
    role: 'character',
    pointsPerModel: 160,
    statLine: chaosDwarf({ WS: 7, BS: 6, S: 4, T: 5, W: 3, I: 5, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    mounts: CD_MONSTER_MOUNTS,
    specialRules: ['Commander', 'Up to 3 magic items', 'May ride a Lammasu (+200) or Great Taurus (+225)'],
  },
  {
    id: 'cd-sorcerer',
    name: 'Chaos Dwarf Sorcerer',
    nameEs: 'Brujo Enano del Caos',
    role: 'character',
    pointsPerModel: 59,
    statLine: chaosDwarf({ WS: 4, BS: 3, S: 3, T: 5, W: 1, I: 3, A: 1, Ld: 9 }),
    isCharacter: true,
    characterRank: 'wizard1',
    canBeGeneral: true,
    options: CD_WIZARD_LEVELS,
    mounts: CD_MONSTER_MOUNTS,
    specialRules: ['Wizard', 'Uses the Chaos Dwarf spell deck', 'May ride a Lammasu (+200) or Great Taurus (+225)'],
  },
  {
    id: 'cd-battle-standard',
    name: 'Battle Standard Bearer',
    nameEs: 'Estandarte de Batalla',
    role: 'character',
    pointsPerModel: 98,
    statLine: chaosDwarf({ WS: 5, BS: 4, S: 4, T: 4, W: 1, I: 3, A: 2, Ld: 9 }),
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    isBSB: true,
    max: 1, // book p.56 "0-1 ESTANDARTE DE BATALLA"
    specialRules: ['0-1', 'Army Battle Standard', 'May carry one magic standard'],
  },
  {
    id: 'cd-hero',
    name: 'Chaos Dwarf Hero',
    nameEs: 'Héroe Enano del Caos',
    role: 'character',
    pointsPerModel: 104,
    statLine: chaosDwarf({ WS: 6, BS: 5, S: 4, T: 5, W: 2, I: 4, A: 3, Ld: 10 }),
    isCharacter: true,
    characterRank: 'hero',
    mounts: CD_MONSTER_MOUNTS,
    specialRules: ['Up to 2 magic items', 'May ride a Lammasu (+200) or Great Taurus (+225)'],
  },
  {
    id: 'cd-bull-centaur-commander',
    name: 'Bull Centaur Commander',
    nameEs: 'Comandante Centauro Enano del Caos',
    role: 'character',
    pointsPerModel: 368,
    statLine: bullCentaur({ WS: 7, BS: 6, S: 5, T: 5, W: 4, I: 6, A: 5, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: false,
    max: 1,
    specialRules: ['0-1 choice', 'Up to 3 magic items', 'Cannot be the army General'],
  },
  {
    id: 'cd-bull-centaur-hero',
    name: 'Bull Centaur Hero',
    nameEs: 'Héroe Centauro Enano del Caos',
    role: 'character',
    pointsPerModel: 232,
    statLine: bullCentaur({ WS: 6, BS: 5, S: 5, T: 5, W: 3, I: 5, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: false,
    specialRules: ['Up to 2 magic items'],
  },
  {
    id: 'cd-hobgoblin-hero',
    name: 'Hobgoblin Hero',
    nameEs: 'Jefe Hobgoblin',
    role: 'character',
    pointsPerModel: 59,
    statLine: hobgoblin({ WS: 5, BS: 5, S: 4, T: 4, W: 2, I: 4, A: 3, Ld: 7 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: false,
    specialRules: ['Up to 2 magic items', 'Animosity'],
  },

  // ===== Special characters (0-1 each) =====
  {
    id: 'cd-zhatan',
    name: 'Zhatan the Black, Lord of the Tower of Zharr',
    nameEs: 'Zhatan el Negro, Señor de la Torre de Zharr',
    role: 'character',
    pointsPerModel: 172,
    statLine: chaosDwarf({ WS: 8, BS: 6, S: 4, T: 5, W: 4, I: 6, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    mounts: CD_MONSTER_MOUNTS,
    specialRules: [
      'Special character',
      'Hatred (all enemies)',
      'Heavy armour, shield & the Hammer of Hashut',
      'May ride a Lammasu (+200) or Great Taurus (+225)',
      'Up to 3 magic items',
    ],
  },
  {
    id: 'cd-astragoth',
    name: 'Astragoth, High Priest of Hashut',
    nameEs: 'Astragoth, Sumo Sacerdote de Hashut',
    role: 'character',
    pointsPerModel: 358,
    statLine: chaosDwarf({ WS: 6, BS: 3, S: 4, T: 5, W: 3, I: 2, A: 3, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character',
      'Wizard Level 4 (Great Sorcerer)',
      '3+ armour save (mechanical body)',
      'Deadly Attack (re-roll all attacks on a hit)',
      'Charges only 6"; cannot ride a mount',
      'Up to 4 magic items',
    ],
  },
  {
    id: 'cd-gorduz',
    name: 'Gorduz Backstabber, Hobgoblin Khan',
    nameEs: 'Gorduz el Traicionero, Caudillo Hobgoblin',
    role: 'character',
    pointsPerModel: 93,
    statLine: hobgoblin({ WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 5, A: 4, Ld: 8 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: false,
    max: 1,
    mounts: [GIANT_WOLF_MOUNT],
    specialRules: [
      'Special character (subordinate)',
      'Light armour, shield & hand weapon',
      'Predestined — survives his final wound on a 4+',
      'May ride a Giant Wolf (+4)',
      'Up to 3 magic items',
    ],
  },

  // ===== Regiments (25%+) =====
  {
    id: 'cd-warriors',
    name: 'Chaos Dwarf Warriors',
    nameEs: 'Guerreros Enanos del Caos',
    role: 'regiment',
    pointsPerModel: 14,
    statLine: chaosDwarf(),
    minSize: 5,
    specialRules: ['Heavy armour & shield (5+, 4+ vs shooting)', 'Great weapons', 'May carry a magic standard'],
  },
  {
    id: 'cd-blunderbusses',
    name: 'Chaos Dwarfs with Blunderbusses',
    nameEs: 'Enanos del Caos con Trabuco',
    role: 'regiment',
    pointsPerModel: 14,
    statLine: chaosDwarf(),
    minSize: 5,
    options: [SHIELD],
    specialRules: ['Heavy armour (5+)', 'Blunderbuss volley (fires across the whole front rank)'],
  },
  {
    id: 'cd-bull-centaurs',
    name: 'Bull Centaurs',
    nameEs: 'Centauros Enanos del Caos',
    role: 'regiment',
    pointsPerModel: 41,
    statLine: bullCentaur(),
    minSize: 5,
    specialRules: ['Light armour & shield (5+)', 'Great weapons', 'May carry a magic standard'],
  },
  {
    id: 'cd-hobgoblins',
    name: 'Hobgoblin Warriors',
    nameEs: 'Guerreros Hobgoblin',
    role: 'regiment',
    pointsPerModel: 5,
    statLine: hobgoblin(),
    minSize: 5,
    options: [LIGHT_ARMOUR_1],
    specialRules: ['Hand weapon & shield (6+)', 'Animosity'],
  },
  {
    id: 'cd-sneaky-gitz',
    name: 'Hobgoblin Sneaky Gitz',
    nameEs: 'Hobgoblins Escurridizos',
    role: 'regiment',
    pointsPerModel: 6,
    statLine: hobgoblin(),
    minSize: 5,
    specialRules: [
      'Two poisoned daggers (extra attack, save modifier -1)',
      'Envelop the flank with any number of models',
      'Animosity & panic',
    ],
  },
  {
    id: 'cd-hobgoblin-archers',
    name: 'Hobgoblin Archers',
    nameEs: 'Arqueros Hobgoblin',
    role: 'regiment',
    pointsPerModel: 5.5,
    statLine: hobgoblin(),
    minSize: 5,
    options: [BOWS_2, LIGHT_ARMOUR_1, SHIELD_HALF],
    specialRules: ['Hand weapon & bow', 'Animosity'],
  },
  {
    id: 'cd-wolf-riders',
    name: 'Hobgoblin Wolf Riders',
    nameEs: 'Jinetes de Lobo Hobgoblin',
    role: 'regiment',
    pointsPerModel: 14,
    statLine: hobgoblin({ M: 9 }),
    minSize: 5,
    options: [LIGHT_ARMOUR_2, SHORTBOW_1],
    specialRules: ['Hand weapon & shield (5+)', 'Fast cavalry (skirmish)', 'Animosity'],
  },
  {
    id: 'cd-black-orcs',
    name: 'Black Orcs',
    nameEs: 'Orcos Negros',
    role: 'regiment',
    pointsPerModel: 9,
    statLine: hobgoblin({ WS: 4, S: 4, T: 4, Ld: 8 }),
    minSize: 5,
    max: 1,
    options: [SHIELD, TWO_HAND_2, HALBERD_2, SPEARS_1, ADD_HAND_WEAPON],
    specialRules: ['0-1 choice', 'Light armour & shield (6+)', 'Immune to Animosity & panic from other greenskins'],
  },
  {
    id: 'cd-orcs',
    name: 'Orcs',
    nameEs: 'Orcos',
    role: 'regiment',
    pointsPerModel: 5.5,
    statLine: hobgoblin({ WS: 3, S: 4, T: 4, Ld: 7 }),
    minSize: 5,
    options: [LIGHT_ARMOUR_2, SHIELD, TWO_HAND_2, HALBERD_2, SPEARS_1, ADD_HAND_WEAPON, BOWS_2],
    specialRules: ['Hand weapon', 'Animosity'],
  },
  {
    id: 'cd-goblins',
    name: 'Goblins',
    nameEs: 'Goblins',
    role: 'regiment',
    pointsPerModel: 2.5,
    statLine: hobgoblin({ WS: 2, S: 3, T: 3, Ld: 5 }),
    minSize: 5,
    options: [SHIELD_HALF, LIGHT_ARMOUR_1, TWO_HAND_1, HALBERD_1, SPEARS_HALF, SHORTBOW_HALF],
    specialRules: ['Hand weapon', 'Animosity', 'Fear Elves'],
  },

  // ===== War machines (0-25%) =====
  {
    id: 'cd-bolt-thrower',
    name: 'Hobgoblin Bolt Thrower',
    nameEs: 'Lanzavirotes Hobgoblin',
    role: 'warmachine',
    pointsPerModel: 42,
    statLine: hobgoblin(),
    specialRules: ['War machine', 'Bolt thrower — 48", S5 (-1 per rank passed), D4 wounds', '2 Hobgoblin crew'],
  },
  {
    id: 'cd-death-rocket',
    name: 'Death Rocket',
    nameEs: 'Lanzacohetes de Muerte',
    role: 'warmachine',
    pointsPerModel: 75,
    statLine: chaosDwarf(),
    specialRules: ['War machine', 'Death Rocket — 48", S5, D3 wounds, save -2', 'Unreliable (misfire table)', '2 Chaos Dwarf crew'],
  },
  {
    id: 'cd-earthshaker',
    name: 'Earthshaker Cannon',
    nameEs: 'Cañón Estremecedor',
    role: 'warmachine',
    pointsPerModel: 140,
    statLine: chaosDwarf(),
    specialRules: ['War machine', 'Earthshaker shell — 12-48", S7, D3 wounds, save -4', 'Shockwave disorders survivors', '3 Chaos Dwarf crew'],
  },

  // ===== Monsters (0-25%) =====
  {
    id: 'cd-great-taurus',
    name: 'Great Taurus',
    nameEs: 'Gran Tauro',
    role: 'monster',
    pointsPerModel: 225,
    statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 5, I: 7, A: 4, Ld: 8 },
    specialRules: ['Flying', 'Terror', 'Fiery body (4+ ward save)', 'Fire breath', 'Large target'],
  },
  {
    id: 'cd-lammasu',
    name: 'Lammasu',
    nameEs: 'Lammasu',
    role: 'monster',
    pointsPerModel: 200,
    statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 7, W: 5, I: 6, A: 3, Ld: 8 },
    specialRules: ['Flying', 'Terror', 'Sorcerous aura — dispels spells on 4+', 'Large target'],
  },
  {
    id: 'cd-hydra',
    name: 'Hydra',
    nameEs: 'Hidra',
    role: 'monster',
    pointsPerModel: 225,
    statLine: { M: 6, WS: 3, BS: 0, S: 5, T: 6, W: 7, I: 3, A: 5, Ld: 6 },
    specialRules: ['Large target'],
  },
  {
    id: 'cd-manticore',
    name: 'Manticore',
    nameEs: 'Mantícora',
    role: 'monster',
    pointsPerModel: 200,
    statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 5, W: 5, I: 4, A: 4, Ld: 8 },
    specialRules: ['Flying', 'Large target'],
  },
  {
    id: 'cd-chimera',
    name: 'Chimera',
    nameEs: 'Quimera',
    role: 'monster',
    pointsPerModel: 250,
    statLine: { M: 6, WS: 4, BS: 0, S: 6, T: 6, W: 6, I: 4, A: 6, Ld: 8 },
    specialRules: ['Flying', 'Large target'],
  },
  {
    id: 'cd-griffon',
    name: 'Griffon',
    nameEs: 'Grifo',
    role: 'monster',
    pointsPerModel: 150,
    statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 4, Ld: 8 },
    specialRules: ['Flying', 'Large target'],
  },
  {
    id: 'cd-hippogriff',
    name: 'Hippogriff',
    nameEs: 'Hipogrifo',
    role: 'monster',
    pointsPerModel: 145,
    statLine: { M: 8, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 6, A: 3, Ld: 8 },
    specialRules: ['Flying', 'Large target'],
  },
  {
    id: 'cd-winged-serpent',
    name: 'Winged Serpent',
    nameEs: 'Serpiente Alada',
    role: 'monster',
    pointsPerModel: 180,
    statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 4, W: 4, I: 4, A: 3, Ld: 5 },
    specialRules: ['Flying', 'Large target'],
  },
  {
    id: 'cd-basilisk',
    name: 'Basilisk',
    nameEs: 'Basilisco',
    role: 'monster',
    pointsPerModel: 150,
    statLine: { M: 4, WS: 3, BS: 0, S: 4, T: 4, W: 2, I: 4, A: 3, Ld: 6 },
    specialRules: ['Large target'],
  },
  {
    id: 'cd-giant-spider',
    name: 'Giant Spider',
    nameEs: 'Araña Gigantesca',
    role: 'monster',
    pointsPerModel: 50,
    statLine: { M: 5, WS: 3, BS: 0, S: 5, T: 4, W: 4, I: 1, A: 2, Ld: 7 },
    specialRules: ['Large target'],
  },
  {
    id: 'cd-giant-scorpion',
    name: 'Giant Scorpion',
    nameEs: 'Escorpión Gigante',
    role: 'monster',
    pointsPerModel: 50,
    statLine: { M: 5, WS: 3, BS: 0, S: 5, T: 4, W: 4, I: 1, A: 2, Ld: 7 },
    specialRules: ['Large target'],
  },
  {
    id: 'cd-dragon',
    name: 'Dragon',
    nameEs: 'Dragón',
    role: 'monster',
    pointsPerModel: 450,
    statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 },
    specialRules: ['Flying', 'Terror', 'Large target'],
  },
  {
    id: 'cd-great-dragon',
    name: 'Great Dragon',
    nameEs: 'Gran Dragón',
    role: 'monster',
    pointsPerModel: 600,
    statLine: { M: 6, WS: 7, BS: 0, S: 7, T: 7, W: 8, I: 8, A: 8, Ld: 8 },
    specialRules: ['Flying', 'Terror', 'Large target'],
  },
  {
    id: 'cd-emperor-dragon',
    name: 'Emperor Dragon',
    nameEs: 'Dragón Emperador',
    role: 'monster',
    pointsPerModel: 750,
    statLine: { M: 6, WS: 8, BS: 0, S: 8, T: 8, W: 9, I: 9, A: 9, Ld: 9 },
    specialRules: ['Flying', 'Terror', 'Large target'],
  },
]

export const CHAOS_DWARFS: Army = {
  id: 'chaos-dwarfs',
  name: 'Chaos Dwarfs',
  nameEs: 'Enanos del Caos',
  composition: STANDARD_5E_COMPOSITION,
  units,
  magicItems: COMMON_MAGIC_ITEMS,
}
