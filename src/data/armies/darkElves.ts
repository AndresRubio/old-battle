import type { Army, EquipmentOption, MountOption, ProfileBlock, StatLine, UnitProfile } from '../types'
import { STANDARD_5E_COMPOSITION } from '../types'
import { COMMON_MAGIC_ITEMS } from '../magicItems'
import { SHIELD } from '../unitOptions'

// Dark Elves — data transcribed from the official Dark Elves army list
// (1995, by Jervis Johnson), the 4th/5th-edition army book.
// Points, profiles, equipment costs and 0-1 limits are taken directly from
// the book's army list (pp. 46-68) and bestiary (pp. 33-45).
//
// NOTE: the book gives Movement in centimetres; values here are converted to
// the inches used elsewhere in the app (12cm→5", 22→9, 20→7, 15→6, 10→4).
// Stat columns in the book are M / HA(WS) / HP(BS) / F(S) / R(T) / H(W) / I / A / L(Ld).

const elf = (over: Partial<StatLine> = {}): StatLine => ({
  M: 5, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 8, ...over,
})

// --- Army-specific equipment options (per-model costs, from the equipment list p.48
//     and the per-unit option lines pp.51-54). ---
const SHIELD_DE = SHIELD // shields +1/model
const LIGHT_ARMOUR_DE: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 2 }
const ADD_HAND_WEAPON: EquipmentOption = { id: 'add-hand-weapon', name: 'Additional hand weapon', pointsPerModel: 1 }
const RXBOW_2: EquipmentOption = { id: 'rxbow', name: 'Repeater Crossbows', pointsPerModel: 2 }
const RXBOW_3: EquipmentOption = { id: 'rxbow', name: 'Repeater Crossbows', pointsPerModel: 3 }
const RXBOW_6: EquipmentOption = { id: 'rxbow', name: 'Repeater Crossbows', pointsPerModel: 6 }
const CAV_LANCE_2: EquipmentOption = { id: 'cav-lance', name: 'Cavalry lances', pointsPerModel: 2 }
const CAV_LANCE_4: EquipmentOption = { id: 'cav-lance', name: 'Cavalry lances', pointsPerModel: 4 }

// Sorceress level upgrades — Dark-Elf-specific costs (Sorceress 59 → L2 121 → L3 219 → L4 328).
const DE_WIZARD_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Wizard Level 2 (Master Paladin)', pointsPerModel: 62, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Wizard Level 3 (Master Sorcerer)', pointsPerModel: 160, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Wizard Level 4 (Supreme Sorcerer)', pointsPerModel: 269, magicItemSlotsDelta: 3 },
]

// --- Character mounts (army list: "may ride a Cold One, a Dark Steed or a
//     monster"). Monster mounts reuse the bestiary statlines/rule-tags defined
//     in the units list below. The generic Cold One / Dark Steed are the same
//     beasts ridden by the Cold One Knights / Dark Riders cavalry regiments
//     (whose own statLines in this file are the elf rider, not the mount), so
//     their profiles are given here. Costs from the riding text (+N pts). ---
// Cold One profile (same beast as the Cold One Knights mount; cf. Lizardmen
// bestiary): M8 WS3 BS0 S4 T4 W1 I1 A2 Ld3. Causes fear + stupidity.
const COLD_ONE_MOUNT: MountOption = {
  id: 'mount-cold-one', name: 'Cold One', nameEs: 'Caballo Frío',
  points: 10, statLine: { M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 1, A: 2, Ld: 3 },
  specialRules: ['Causes fear', 'Stupidity', 'Scaly skin (5+ save)'],
}
// Dark Steed — the fast horse ridden by the Dark Riders (5+ save base).
const DARK_STEED_MOUNT: MountOption = {
  id: 'mount-dark-steed', name: 'Dark Steed', nameEs: 'Corcel Oscuro',
  points: 3, statLine: { M: 9, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 },
}
// Monster mounts — statLines/rule-tags reused from the bestiary entries below.
const DARK_PEGASUS_MOUNT: MountOption = {
  id: 'mount-dark-pegasus', name: 'Dark Pegasus', nameEs: 'Pegaso Oscuro',
  points: 50, statLine: { M: 7, WS: 3, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 5 },
  specialRules: ['Flying'],
}
const MANTICORE_MOUNT: MountOption = {
  id: 'mount-manticore', name: 'Manticore', nameEs: 'Mantícora',
  points: 200, statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 },
  specialRules: ['Large target', 'Terror', 'Flying'],
}
const HYDRA_MOUNT: MountOption = {
  id: 'mount-war-hydra', name: 'War Hydra', nameEs: 'Hidra de Guerra',
  points: 225, statLine: { M: 6, WS: 4, BS: 0, S: 5, T: 6, W: 7, I: 3, A: 5, Ld: 8 },
  specialRules: ['Large target', 'Terror', 'Breathe fire', 'Scaly skin (5+ save)'],
}
const BLACK_DRAGON_MOUNT: MountOption = {
  id: 'mount-black-dragon', name: 'Black Dragon', nameEs: 'Dragón Negro',
  points: 450, statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 },
  specialRules: ['Large target', 'Terror', 'Flying', 'Breath weapon'],
}

/** Mount list for Dark Elf lords/heroes ("a Cold One, a Dark Steed or a monster"). */
const LORD_MOUNTS: MountOption[] = [
  COLD_ONE_MOUNT, DARK_STEED_MOUNT, DARK_PEGASUS_MOUNT, MANTICORE_MOUNT, HYDRA_MOUNT, BLACK_DRAGON_MOUNT,
]

// --- Fixed (non-selectable) mounts for special characters who always ride one.
//     Display-only: the cost is already baked into the model's points. ---
const MANTICORE_PROFILE: ProfileBlock = {
  name: 'Manticore', nameEs: 'Mantícora', statLine: MANTICORE_MOUNT.statLine!, specialRules: MANTICORE_MOUNT.specialRules,
}
const BLACK_DRAGON_PROFILE: ProfileBlock = {
  name: 'Black Dragon (Bracchus)', nameEs: 'Dragón Negro (Bracchus)',
  statLine: BLACK_DRAGON_MOUNT.statLine!, specialRules: BLACK_DRAGON_MOUNT.specialRules,
}
const BLACK_PEGASUS_PROFILE: ProfileBlock = {
  name: 'Black Pegasus (Sulephet)', nameEs: 'Pegaso Negro (Sulephet)',
  statLine: { M: 7, WS: 3, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 5 },
  specialRules: ['Flying'],
}

const units: UnitProfile[] = [
  // ===== Characters (0-50%) =====
  {
    id: 'de-general',
    name: 'Dark Elf General',
    nameEs: 'General Elfo Oscuro',
    role: 'character',
    pointsPerModel: 160,
    statLine: elf({ WS: 7, BS: 7, S: 4, T: 4, W: 3, I: 9, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    mounts: LORD_MOUNTS,
    specialRules: ['Sword', 'May ride Cold One (+10), Dark Steed (+3) or a monster'],
  },
  {
    id: 'de-battle-standard',
    name: 'Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla',
    role: 'character',
    pointsPerModel: 98,
    statLine: elf({ WS: 5, BS: 5, S: 4, T: 3, W: 1, I: 7, A: 2, Ld: 8 }),
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    isBSB: true,
    specialRules: ['Army Battle Standard', 'Re-roll break tests within 12"'],
  },
  {
    id: 'de-hero',
    name: 'Dark Elf Hero',
    nameEs: 'Héroe Elfo Oscuro',
    role: 'character',
    pointsPerModel: 104,
    statLine: elf({ WS: 6, BS: 6, S: 4, T: 4, W: 2, I: 8, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    mounts: LORD_MOUNTS,
    specialRules: ['May ride a Cold One (+10), Dark Steed (+3) or a monster'],
  },
  {
    id: 'de-witch-hero',
    name: 'Witch Elf Hero',
    nameEs: 'Heroína Bruja',
    role: 'character',
    pointsPerModel: 132,
    statLine: elf({ WS: 6, BS: 6, S: 4, T: 4, W: 2, I: 8, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    specialRules: ['Frenzy', 'Poisoned attacks'],
  },
  {
    id: 'de-master',
    name: 'Master',
    nameEs: 'Maestro',
    role: 'character',
    pointsPerModel: 48,
    statLine: elf({ WS: 5, BS: 5, S: 4, T: 3, W: 1, I: 7, A: 2, Ld: 8 }),
    isCharacter: true,
    characterRank: 'champion',
    specialRules: ['Leads a Dark Elf regiment'],
  },
  {
    id: 'de-hag',
    name: 'Hag',
    nameEs: 'Bruja Anciana',
    role: 'character',
    pointsPerModel: 62,
    statLine: elf({ WS: 5, BS: 5, S: 4, T: 3, W: 1, I: 7, A: 2, Ld: 8 }),
    isCharacter: true,
    characterRank: 'champion',
    specialRules: ['Leads a Witch Elf regiment', 'Frenzy'],
  },
  {
    id: 'de-sorceress',
    name: 'Sorceress',
    nameEs: 'Hechicera',
    role: 'character',
    pointsPerModel: 59,
    statLine: elf({ T: 4, I: 7 }),
    isCharacter: true,
    characterRank: 'wizard1',
    options: DE_WIZARD_LEVELS,
    mounts: LORD_MOUNTS,
    specialRules: ['Wizard (Dark Magic)', 'Cannot cast if wearing armour', 'May ride a Cold One (+10), Dark Steed (+3) or a monster'],
  },
  {
    id: 'de-assassin',
    name: 'Assassin',
    nameEs: 'Asesino',
    role: 'character',
    pointsPerModel: 56,
    statLine: elf({ WS: 9, BS: 9, S: 4, T: 4, W: 1, I: 10, A: 2, Ld: 10 }),
    isCharacter: true,
    characterRank: 'champion',
    specialRules: ['Hidden in a regiment', 'Black Lotus poison (D3 wounds)'],
  },

  // ----- Special characters (0-1 each; fixed equipment & magic items) -----
  {
    id: 'de-witch-king',
    name: 'The Witch King of Naggaroth (Malekith)',
    nameEs: 'El Rey Brujo de Naggaroth (Malekith)',
    role: 'character',
    pointsPerModel: 350,
    statLine: elf({ WS: 7, BS: 7, S: 5, T: 5, W: 4, I: 9, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    specialRules: ['Special character', 'Wizard Level 4', 'Immune to psychology', 'Causes fear', 'Rides the Black Chariot', 'Fixed magic items'],
  },
  {
    id: 'de-morathi',
    name: 'Morathi the Hag Sorceress',
    nameEs: 'Morathi, la Hechicera Bruja',
    role: 'character',
    pointsPerModel: 327,
    statLine: elf({ WS: 4, BS: 4, S: 4, T: 4, W: 3, I: 9, A: 2, Ld: 9 }),
    isCharacter: true,
    characterRank: 'wizard4',
    max: 1,
    profiles: [BLACK_PEGASUS_PROFILE],
    specialRules: ['Special character', 'Great Sorceress (Level 4)', 'Rides the Black Pegasus Sulephet', 'Fixed magic items'],
  },
  {
    id: 'de-hellebron',
    name: 'Crone Hellebron, the Hag Queen',
    nameEs: 'Hellebron, la Reina Bruja',
    role: 'character',
    pointsPerModel: 207,
    statLine: elf({ WS: 7, BS: 7, S: 4, T: 4, W: 3, I: 9, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    profiles: [MANTICORE_PROFILE],
    specialRules: ['Special character', 'Requires a Witch Elf regiment', 'Frenzy', 'Rides a Manticore', 'Fixed magic items'],
  },
  {
    id: 'de-rakarth',
    name: 'Rakarth, Lord of the Beasts',
    nameEs: 'Rakarth, Señor de las Bestias',
    role: 'character',
    pointsPerModel: 134,
    statLine: elf({ WS: 6, BS: 6, S: 4, T: 4, W: 2, I: 8, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    max: 1,
    profiles: [BLACK_DRAGON_PROFILE],
    specialRules: ['Special character', 'Beastmaster', 'Rides the Black Dragon Bracchus', 'Fixed magic items'],
  },
  {
    id: 'de-kouran',
    name: 'Kouran, Captain of the Black Guard',
    nameEs: 'Kouran, Capitán de la Guardia Negra',
    role: 'character',
    pointsPerModel: 105,
    statLine: elf({ WS: 6, BS: 6, S: 4, T: 4, W: 2, I: 8, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    max: 1,
    specialRules: ['Special character', 'Requires a Black Guard regiment', 'Fixed magic items'],
  },
  {
    id: 'de-tullaris',
    name: 'Tullaris of Har Ganeth',
    nameEs: 'Tullaris de Har Ganeth',
    role: 'character',
    pointsPerModel: 123,
    statLine: elf({ WS: 6, BS: 6, S: 5, T: 5, W: 2, I: 6, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    max: 1,
    specialRules: ['Special character', 'Requires an Executioner regiment', 'Fixed magic items'],
  },
  {
    id: 'de-shadowblade',
    name: 'Shadowblade, Master Assassin',
    nameEs: 'Filo Sombrío, Maestro Asesino',
    role: 'character',
    pointsPerModel: 115,
    statLine: elf({ WS: 10, BS: 10, S: 4, T: 4, W: 2, I: 10, A: 3, Ld: 10 }),
    isCharacter: true,
    characterRank: 'champion',
    max: 1,
    specialRules: ['Special character', 'Master of Disguise', 'Hidden', 'Fixed magic items'],
  },

  // ===== Regiments (25%+) =====
  {
    id: 'de-warriors',
    name: 'Dark Elf Warriors',
    nameEs: 'Guerreros Elfos Oscuros',
    role: 'regiment',
    pointsPerModel: 10,
    statLine: elf(),
    minSize: 5,
    options: [SHIELD_DE],
    specialRules: ['Sword', 'Light armour (6+ save)', 'Hatred of High Elves'],
  },
  {
    id: 'de-spearmen',
    name: 'Dark Elf Spearmen',
    nameEs: 'Lanceros Elfos Oscuros',
    role: 'regiment',
    pointsPerModel: 11,
    statLine: elf(),
    minSize: 5,
    options: [SHIELD_DE],
    specialRules: ['Spears', 'Light armour (6+ save)'],
  },
  {
    id: 'de-crossbowmen',
    name: 'Dark Elf Crossbowmen',
    nameEs: 'Ballesteros Elfos Oscuros',
    role: 'regiment',
    pointsPerModel: 13,
    statLine: elf(),
    minSize: 5,
    options: [SHIELD_DE],
    specialRules: ['Repeater Crossbow', 'Light armour (6+ save)'],
  },
  {
    id: 'de-corsairs',
    name: 'Corsairs',
    nameEs: 'Corsarios',
    role: 'regiment',
    pointsPerModel: 12,
    statLine: elf(),
    minSize: 5,
    options: [ADD_HAND_WEAPON, RXBOW_3],
    specialRules: ['Sea Dragon Cloak (6+ save, ignores Strength modifiers)'],
  },
  {
    id: 'de-city-guard',
    name: 'City Guard',
    nameEs: 'Guardia de la Ciudad',
    role: 'regiment',
    pointsPerModel: 11,
    statLine: elf(),
    minSize: 5,
    options: [RXBOW_2, SHIELD_DE],
    specialRules: ['Spears (or Repeater Crossbow)', 'Mixed formation', 'Light armour (6+ save)'],
  },
  {
    id: 'de-witch-elves',
    name: 'Witch Elves',
    nameEs: 'Elfas Brujas',
    role: 'regiment',
    pointsPerModel: 12,
    statLine: elf(),
    minSize: 5,
    options: [LIGHT_ARMOUR_DE],
    specialRules: ['Two hand weapons', 'Poisoned attacks (+1 S)', 'Frenzy'],
  },
  {
    id: 'de-scouts',
    name: 'Scouts',
    nameEs: 'Exploradores',
    role: 'regiment',
    pointsPerModel: 13,
    statLine: elf({ BS: 5 }),
    minSize: 5,
    options: [LIGHT_ARMOUR_DE],
    specialRules: ['Repeater Crossbow', 'Scouts', 'Skirmish', 'No movement penalty in rough terrain'],
  },
  {
    id: 'de-cold-one-knights',
    name: 'Cold One Knights',
    nameEs: 'Jinetes de Sangre Fría',
    role: 'regiment',
    pointsPerModel: 38,
    statLine: elf({ WS: 5, I: 7 }),
    minSize: 5,
    options: [CAV_LANCE_4, RXBOW_6],
    specialRules: ['Cold One mount (2+ save)', 'Causes fear', 'Stupidity', 'Sword, heavy armour & shield'],
  },
  {
    id: 'de-dark-riders',
    name: 'Dark Riders',
    nameEs: 'Jinetes Oscuros',
    role: 'regiment',
    pointsPerModel: 25,
    statLine: elf(),
    minSize: 5,
    options: [CAV_LANCE_2, RXBOW_6],
    specialRules: ['Dark Steed (5+ save)', 'Fast cavalry', 'Skirmish', 'Fire & flee', 'Light armour'],
  },
  {
    id: 'de-executioners',
    name: 'Executioners of Har Ganeth',
    nameEs: 'Verdugos de Har Ganeth',
    role: 'regiment',
    pointsPerModel: 16,
    statLine: elf({ WS: 5 }),
    minSize: 5,
    max: 1,
    specialRules: ['0-1 regiment', 'Two-handed draich (D3 wounds per hit)', 'Heavy armour (5+ save)'],
  },
  {
    id: 'de-black-guard',
    name: 'Black Guard of Naggaroth',
    nameEs: 'Guardia Negra de Naggaroth',
    role: 'regiment',
    pointsPerModel: 15,
    statLine: elf({ WS: 5, I: 7 }),
    minSize: 5,
    max: 1,
    specialRules: ['0-1 regiment', 'Halberds', 'Heavy armour (5+ save)'],
  },
  {
    id: 'de-harpies',
    name: 'Harpies',
    nameEs: 'Arpías',
    role: 'regiment',
    pointsPerModel: 15,
    statLine: { M: 4, WS: 4, BS: 0, S: 4, T: 4, W: 2, I: 2, A: 1, Ld: 6 },
    minSize: 5,
    max: 1,
    noCommand: true,
    specialRules: ['0-1 unit', 'Flying', 'May not take command or characters', 'Do not hate High Elves'],
  },

  // ===== War machines (0-25%) =====
  {
    id: 'de-bolt-thrower',
    name: 'Repeater Bolt Thrower',
    nameEs: 'Lanzavirotes de Repetición',
    role: 'warmachine',
    pointsPerModel: 100,
    specialRules: ['Crew of 2', 'Up to 2 per regiment of 10+ Warriors/Spearmen/Crossbowmen/City Guard/Corsairs', 'Single shot 1D4 wounds or volley of 4 bolts'],
  },
  {
    id: 'de-cauldron-of-blood',
    name: 'Cauldron of Blood',
    nameEs: 'Caldero de Sangre',
    role: 'warmachine',
    pointsPerModel: 125,
    max: 1,
    specialRules: ['0-1', 'Frenzy aura for nearby Witch Elves', 'Magical protection', 'Guardian + 2 Witch Elf escort'],
  },

  // ===== Monsters (0-25%) =====
  {
    id: 'de-war-hydra',
    name: 'War Hydra',
    nameEs: 'Hidra de Guerra',
    role: 'monster',
    pointsPerModel: 225,
    statLine: { M: 6, WS: 4, BS: 0, S: 5, T: 6, W: 7, I: 3, A: 5, Ld: 8 },
    specialRules: ['Large target', 'Terror', 'Breathe fire', 'Scaly skin (5+ save)'],
  },
  {
    id: 'de-manticore',
    name: 'Manticore',
    nameEs: 'Mantícora',
    role: 'monster',
    pointsPerModel: 200,
    statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 },
    specialRules: ['Large target', 'Terror', 'Flying'],
  },
  {
    id: 'de-chimera',
    name: 'Chimera',
    nameEs: 'Quimera',
    role: 'monster',
    pointsPerModel: 250,
    statLine: { M: 6, WS: 4, BS: 0, S: 7, T: 6, W: 6, I: 4, A: 6, Ld: 8 },
    specialRules: ['Large target', 'Terror'],
  },
  {
    id: 'de-dragon',
    name: 'Dragon',
    nameEs: 'Dragón',
    role: 'monster',
    pointsPerModel: 450,
    statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 },
    specialRules: ['Large target', 'Terror', 'Flying', 'Breath weapon', 'Great Dragon 600 / Emperor Dragon 750'],
  },
  {
    id: 'de-griffon',
    name: 'Griffon',
    nameEs: 'Grifo',
    role: 'monster',
    pointsPerModel: 150,
    statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 4, Ld: 8 },
    specialRules: ['Large target', 'Terror', 'Flying'],
  },
  {
    id: 'de-hippogriff',
    name: 'Hippogriff',
    nameEs: 'Hipogrifo',
    role: 'monster',
    pointsPerModel: 145,
    statLine: { M: 7, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 6, A: 3, Ld: 8 },
    specialRules: ['Large target', 'Flying'],
  },
  {
    id: 'de-winged-serpent',
    name: 'Winged Serpent',
    nameEs: 'Serpiente Alada',
    role: 'monster',
    pointsPerModel: 180,
    statLine: { M: 6, WS: 5, BS: 0, S: 5, T: 6, W: 4, I: 4, A: 3, Ld: 5 },
    specialRules: ['Large target', 'Flying'],
  },
  {
    id: 'de-basilisk',
    name: 'Basilisk',
    nameEs: 'Basilisco',
    role: 'monster',
    pointsPerModel: 150,
    statLine: { M: 4, WS: 3, BS: 0, S: 4, T: 4, W: 2, I: 4, A: 3, Ld: 6 },
    specialRules: ['Terror', 'Petrifying gaze'],
  },
  {
    id: 'de-giant-scorpion',
    name: 'Giant Scorpion',
    nameEs: 'Escorpión Gigante',
    role: 'monster',
    pointsPerModel: 50,
    statLine: { M: 5, WS: 3, BS: 0, S: 5, T: 4, W: 4, I: 1, A: 2, Ld: 7 },
    specialRules: ['Poisoned attacks'],
  },
]

export const DARK_ELVES: Army = {
  id: 'dark-elves',
  name: 'Dark Elves',
  nameEs: 'Elfos Oscuros',
  composition: STANDARD_5E_COMPOSITION,
  units,
  magicItems: COMMON_MAGIC_ITEMS,
  selectionRules: {
    ratioCaps: [
      { unitId: 'de-bolt-thrower', perUnit: { ids: ['de-warriors', 'de-spearmen', 'de-crossbowmen', 'de-city-guard', 'de-corsairs'], multiplier: 2, minSize: 10 }, labelEn: 'Repeater Bolt Throwers', labelEs: 'Lanzavirotes de Repetición' },
    ],
    dependencies: [
      { unitId: 'de-hellebron', requiresAnyOf: ['de-witch-elves'], labelEn: 'Crone Hellebron', labelEs: 'Hellebron' },
      { unitId: 'de-kouran', requiresAnyOf: ['de-black-guard'], labelEn: 'Kouran, Captain of the Black Guard', labelEs: 'Kouran, Capitán de la Guardia Negra' },
      { unitId: 'de-tullaris', requiresAnyOf: ['de-executioners'], labelEn: 'Tullaris of Har Ganeth', labelEs: 'Tullaris de Har Ganeth' },
      // FAQ v2.20 §33.5: Assassins may only be fielded hidden in one of these units.
      { unitId: 'de-assassin', requiresAnyOf: ['de-executioners', 'de-black-guard', 'de-scouts', 'de-corsairs', 'de-warriors', 'de-spearmen', 'de-city-guard', 'de-crossbowmen'], labelEn: 'Assassin', labelEs: 'Asesino' },
    ],
  },
}
