import type { Army, EquipmentOption, MountOption, ProfileBlock, StatLine, UnitProfile } from '../types'
import { STANDARD_5E_COMPOSITION } from '../types'
import { COMMON_MAGIC_ITEMS } from '../magicItems'

// The Empire — data transcribed from the official Empire army list
// (1995, Suplemento, ref. 3130 / ISBN 84-88879-30-X), the
// 4th/5th-edition army book. Points, profiles, equipment costs and 0-1 limits
// are taken directly from the book's army list ("LA LISTA DE EJÉRCITO",
// pp. 54-66) and special characters ("PERSONAJES ESPECIALES", pp. 67-74).
//
// NOTE: the book gives Movement in centimetres; values here are converted to
// the inches used elsewhere in the app (8cm→3", 10→4, 12→5, 15→6, 20→8).
// Stat columns in the book are M / HA(WS) / HP(BS) / F(S) / R(T) / H(W) / I / A / L(Ld).
// Cavalry profiles use the MOUNT's M value; rider stats otherwise.

const human = (over: Partial<StatLine> = {}): StatLine => ({
  M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7, ...over,
})

// --- Army-specific equipment options (per-model costs, from the "LISTA DE EQUIPO"
//     p.56 and the per-unit OPCIONES lines pp.59-64). ---
const ADD_HAND_WEAPON: EquipmentOption = { id: 'add-hand-weapon', name: 'Additional hand weapon', pointsPerModel: 1 }
const TWO_HAND_WEAPON: EquipmentOption = { id: 'two-hand', name: 'Two-handed weapon', pointsPerModel: 2 }
const HALBERD: EquipmentOption = { id: 'halberd', name: 'Halberd', pointsPerModel: 2 }
const SPEAR: EquipmentOption = { id: 'spear', name: 'Spear', pointsPerModel: 1 }
const BOW: EquipmentOption = { id: 'bow', name: 'Bow (Long bow)', pointsPerModel: 2 }
const CROSSBOW: EquipmentOption = { id: 'crossbow', name: 'Crossbow', pointsPerModel: 3 }
const SHIELD_1: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 1 }
const SHIELD_HALF: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 0.5 }
const LIGHT_ARMOUR_2: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 2 }
const LIGHT_ARMOUR_1: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 1 }

// Battle Wizard level upgrades (p.58). Costs: Hechicero 56 → Paladín Hechicero 118
// → Maestro Hechicero 190 → Gran Hechicero 287. Cumulative deltas: +62 / +72 / +97.
// Magic-item slots: 1 / 2 / 3 / 4.
const EMP_WIZARD_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Wizard Level 2 (Paladín Hechicero)', pointsPerModel: 62, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Wizard Level 3 (Maestro Hechicero)', pointsPerModel: 72, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Wizard Level 4 (Gran Hechicero)', pointsPerModel: 97, magicItemSlotsDelta: 3 },
]

// --- Character mounts. Empire characters "may ride a Warhorse (+3) or a Monster"
// (army list pp.54-58); special characters with armour ride a barded Warhorse
// (+7 "with metal barding"). Monster mounts reuse the bestiary statlines defined
// in the monster entries below; points are the "+N pts" values from the rules. ---
const WARHORSE_STATS: StatLine = { M: 8, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 }

const WARHORSE_MOUNT: MountOption = {
  id: 'mount-warhorse', name: 'Warhorse', nameEs: 'Caballo de Guerra',
  points: 3, statLine: WARHORSE_STATS,
}
const BARDED_WARHORSE_MOUNT: MountOption = {
  id: 'mount-barded-warhorse', name: 'Barded Warhorse', nameEs: 'Caballo de Guerra con Barda',
  points: 7, statLine: WARHORSE_STATS,
}
const PEGASUS_MOUNT: MountOption = {
  id: 'mount-pegasus', name: 'Pegasus', nameEs: 'Pegaso',
  points: 50, statLine: { M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 5 },
  specialRules: ['Flying'],
}
const GRIFFON_MOUNT: MountOption = {
  id: 'mount-griffon', name: 'Griffon', nameEs: 'Grifo',
  points: 150, statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 4, Ld: 8 },
  specialRules: ['Large target', 'Terror', 'Flying'],
}
const HIPPOGRIFF_MOUNT: MountOption = {
  id: 'mount-hippogriff', name: 'Hippogriff', nameEs: 'Hipogrifo',
  points: 145, statLine: { M: 8, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 6, A: 3, Ld: 8 },
  specialRules: ['Large target', 'Terror', 'Flying'],
}
const MANTICORE_MOUNT: MountOption = {
  id: 'mount-manticore', name: 'Manticore', nameEs: 'Manticora',
  points: 200, statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 },
  specialRules: ['Large target', 'Terror', 'Flying'],
}
const DRAGON_MOUNT: MountOption = {
  id: 'mount-dragon', name: 'Dragon', nameEs: 'Dragón',
  points: 450, statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 },
  specialRules: ['Large target', 'Terror', 'Flying', 'Breath weapon'],
}
const GREAT_DRAGON_MOUNT: MountOption = {
  id: 'mount-great-dragon', name: 'Great Dragon', nameEs: 'Gran Dragón',
  points: 600, statLine: { M: 6, WS: 7, BS: 0, S: 7, T: 7, W: 8, I: 8, A: 8, Ld: 8 },
  specialRules: ['Large target', 'Terror', 'Flying', 'Breath weapon'],
}
const EMPEROR_DRAGON_MOUNT: MountOption = {
  id: 'mount-emperor-dragon', name: 'Emperor Dragon', nameEs: 'Dragón Emperador',
  points: 750, statLine: { M: 6, WS: 8, BS: 0, S: 8, T: 8, W: 9, I: 6, A: 9, Ld: 9 },
  specialRules: ['Large target', 'Terror', 'Flying', 'Breath weapon'],
}

/** Full mount list for fighter lords/heroes ("a Warhorse or a Monster"). */
const FIGHTER_MOUNTS: MountOption[] = [
  WARHORSE_MOUNT, PEGASUS_MOUNT, GRIFFON_MOUNT, HIPPOGRIFF_MOUNT, MANTICORE_MOUNT,
  DRAGON_MOUNT, GREAT_DRAGON_MOUNT, EMPEROR_DRAGON_MOUNT,
]
/** Wizards may not wear barding; Warhorse + monsters only (same list as fighters). */
const WIZARD_MOUNTS: MountOption[] = FIGHTER_MOUNTS

// --- Fixed (non-selectable) mount profiles: the rider's second stat row on
// cavalry regiments, and special characters who always ride one. Cost is baked
// into the model's points, so these are display-only. ---
const WARHORSE_PROFILE: ProfileBlock = {
  name: 'Warhorse', nameEs: 'Caballo de Guerra', statLine: WARHORSE_STATS,
}
const BARDED_WARHORSE_PROFILE: ProfileBlock = {
  name: 'Barded Warhorse', nameEs: 'Caballo de Guerra con Barda', statLine: WARHORSE_STATS,
}
const GRIFFON_DEATHCLAW_PROFILE: ProfileBlock = {
  name: 'Griffon Deathclaw', nameEs: 'Grifo Garra de la Muerte',
  statLine: GRIFFON_MOUNT.statLine!, specialRules: GRIFFON_MOUNT.specialRules,
}

const units: UnitProfile[] = [
  // ===== Characters / PERSONAJES (0-50%) =====

  {
    id: 'emp-general',
    name: 'General of the Empire',
    nameEs: 'General del Imperio',
    role: 'character',
    pointsPerModel: 100,
    statLine: human({ WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 9 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    mounts: FIGHTER_MOUNTS,
    specialRules: [
      'Commander (up to 3 magic items)',
      'Sword',
      'May ride a Warhorse (+3 pts) or a Monster',
    ],
  },
  {
    id: 'emp-battle-standard',
    name: 'Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla',
    role: 'character',
    pointsPerModel: 80,
    statLine: human({ WS: 4, BS: 4, S: 4, T: 3, W: 1, I: 4, A: 2, Ld: 7 }),
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    isBSB: true,
    max: 1,
    mounts: FIGHTER_MOUNTS,
    specialRules: [
      '0-1 Army Battle Standard',
      'Sword & Battle Standard',
      'One magic item (may be a magic standard)',
      'May ride a Warhorse (+3 pts) or a Monster',
    ],
  },
  {
    id: 'emp-hero',
    name: 'Empire Hero',
    nameEs: 'Héroe',
    role: 'character',
    pointsPerModel: 65,
    statLine: human({ WS: 5, BS: 5, S: 4, T: 4, W: 2, I: 5, A: 3, Ld: 8 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: true,
    mounts: FIGHTER_MOUNTS,
    specialRules: [
      'Héroe (up to 2 magic items)',
      'Sword',
      'May ride a Warhorse (+3 pts) or a Monster',
    ],
  },
  {
    id: 'emp-paladin',
    name: 'Paladin (Regiment Champion)',
    nameEs: 'Paladín',
    role: 'character',
    pointsPerModel: 30,
    statLine: human({ WS: 4, BS: 4, S: 4, T: 3, W: 1, I: 4, A: 2, Ld: 7 }),
    isCharacter: true,
    characterRank: 'champion',
    specialRules: [
      'Leads a regiment; equipped identically to its troops',
      'One magic item',
    ],
  },
  {
    id: 'emp-wizard',
    name: 'Battle Wizard',
    nameEs: 'Hechicero de Batalla',
    role: 'character',
    pointsPerModel: 56,
    statLine: human({ T: 4, I: 4 }),
    isCharacter: true,
    characterRank: 'wizard1',
    lores: ['battle'],
    canBeGeneral: false,
    options: EMP_WIZARD_LEVELS,
    mounts: WIZARD_MOUNTS,
    specialRules: [
      'Wizard (any of the eight Colleges of Magic)',
      'Cannot cast spells if wearing armour',
      'May ride a Warhorse (+3 pts) or a Monster',
    ],
  },

  // ----- Special characters / PERSONAJES ESPECIALES (0-1 each) -----

  {
    id: 'emp-karl-franz',
    name: 'Emperor Karl Franz',
    nameEs: 'El Emperador Karl Franz',
    role: 'character',
    pointsPerModel: 110,
    statLine: human({ WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    profiles: [GRIFFON_DEATHCLAW_PROFILE],
    specialRules: [
      'Special character — becomes army General',
      'Heavy armour & sword',
      'Hammer of Sigmar (+100 pts) and Silver Seal (+75 pts) — fixed magic items',
      'One additional magic item',
      'Rides his Griffon Deathclaw (favourite mount; +150 pts, included)',
    ],
  },
  {
    id: 'emp-magnus',
    name: 'Magnus the Pious',
    nameEs: 'Magnus el Piadoso',
    role: 'character',
    pointsPerModel: 210,
    statLine: human({ WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    mounts: [BARDED_WARHORSE_MOUNT],
    specialRules: [
      'Special character — becomes army General',
      'Heavy armour, shield & sword',
      'Immune to psychology; never breaks',
      'Protected by Sigmar: re-roll one failed save per turn; auto-dispel spells on 4-6; Strength 10 Deadly Attack in close combat',
      'May ride a Barded Warhorse (+7 pts); may not ride a Monster',
      'No magic items',
    ],
  },
  {
    id: 'emp-ludwig',
    name: 'Ludwig Schwartzhelm',
    nameEs: 'Ludwig Schwartzhelm',
    role: 'character',
    pointsPerModel: 70,
    statLine: human({ WS: 5, BS: 4, S: 4, T: 4, W: 3, I: 5, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeBSB: true,
    max: 1,
    mounts: [BARDED_WARHORSE_MOUNT],
    specialRules: [
      'Special character — Paladin of the Emperor',
      'Heavy armour',
      '+50 pts to act as Battle Standard Bearer',
      'Sword of Justice (+50 pts) — fixed magic weapon',
      'May ride a Barded Warhorse (+7 pts)',
      'No other magic items',
    ],
  },
  {
    id: 'emp-volkmar',
    name: 'Grand Theogonist Volkmar',
    nameEs: 'Gran Teogonista Volkmar',
    role: 'character',
    pointsPerModel: 150,
    statLine: human({ WS: 5, BS: 3, S: 4, T: 4, W: 4, I: 3, A: 5, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard2',
    lores: ['battle'],
    max: 1,
    profiles: [
      {
        name: 'War Altar (chariot)', nameEs: 'Altar de Guerra (carro)',
        statLine: { T: 5, W: 4 },
        specialRules: ['War chariot', 'Drawn by two Barded Warhorses'],
      },
      BARDED_WARHORSE_PROFILE,
    ],
    specialRules: [
      'Special character',
      'Wizard level 2 — draws spells from the War Altar (Winds of Magic + 1D3+1 extra cards)',
      'Staff of Power (+80 pts), Jade Griffon (+75 pts), Horn of Sigismund (+35 pts) — fixed magic items',
      'Three additional magic items',
      'Rides the War Altar (war chariot drawn by Barded Warhorses)',
    ],
  },
  {
    id: 'emp-supreme-patriarch',
    name: 'Supreme Patriarch of the Colleges of Magic',
    nameEs: 'Patriarca Supremo de los Colegios de Magia',
    role: 'character',
    pointsPerModel: 290,
    statLine: human({ WS: 4, BS: 3, S: 4, T: 4, W: 4, I: 6, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'wizard4',
    lores: ['battle'],
    max: 1,
    mounts: [BARDED_WARHORSE_MOUNT, PEGASUS_MOUNT, GRIFFON_MOUNT, HIPPOGRIFF_MOUNT, MANTICORE_MOUNT, DRAGON_MOUNT, GREAT_DRAGON_MOUNT, EMPEROR_DRAGON_MOUNT],
    specialRules: [
      'Special character (Thyrus Gormann, Bright Wizard Level 4)',
      'Sword; no armour',
      'Staff of Volans (+75 pts) — must be chosen as one of his magic items',
      'Up to 4 magic items total',
      'May ride a Barded Warhorse (+7 pts) or a Monster',
    ],
  },
  {
    id: 'emp-kurt-helborg',
    name: 'Reiksmarshal Kurt Helborg',
    nameEs: 'Mariscal del Reik Kurt Helborg, Capitán de la Reiksgard',
    role: 'character',
    pointsPerModel: 110,
    statLine: human({ WS: 7, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 9 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    mounts: [BARDED_WARHORSE_MOUNT, PEGASUS_MOUNT, GRIFFON_MOUNT, HIPPOGRIFF_MOUNT, MANTICORE_MOUNT, DRAGON_MOUNT, GREAT_DRAGON_MOUNT, EMPEROR_DRAGON_MOUNT],
    specialRules: [
      'Special character — Captain of the Reiksgard',
      'Heavy armour & sword',
      'Runefang (+30 pts) — must be chosen as one of his magic items',
      'Up to 3 magic items total',
      'May ride a Barded Warhorse (+7 pts) or a Monster',
    ],
  },
  {
    id: 'emp-boris-todbringer',
    name: 'Boris Todbringer, Elector Count of Middenland',
    nameEs: 'Boris Todbringer, Conde Elector de Middenland',
    role: 'character',
    pointsPerModel: 90,
    statLine: human({ WS: 5, BS: 5, S: 4, T: 4, W: 3, I: 4, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    mounts: [BARDED_WARHORSE_MOUNT],
    specialRules: [
      'Special character',
      'Heavy armour & sword',
      'Runefang (+30 pts) and Talisman of Ulric (+25 pts) — fixed magic items',
      'May ride a Barded Warhorse (+7 pts)',
    ],
  },
  {
    id: 'emp-aldebrand-ludenhof',
    name: 'Aldebrand Ludenhof, Elector Count of Hochland',
    nameEs: 'Aldebrand Ludenhof, Conde Elector de Hochland',
    role: 'character',
    pointsPerModel: 90,
    statLine: human({ WS: 5, BS: 4, S: 4, T: 4, W: 3, I: 4, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    mounts: [BARDED_WARHORSE_MOUNT],
    specialRules: [
      'Special character',
      'Heavy armour & sword',
      'Runefang (+30 pts) — fixed magic item; Falcon (bonus attack at S3 before combat)',
      'May ride a Barded Warhorse (+7 pts)',
    ],
  },
  {
    id: 'emp-valmir-von-raukov',
    name: 'Valmir von Raukov, Elector Count of Ostland',
    nameEs: 'Valmir von Raukov, Conde Elector de Ostland',
    role: 'character',
    pointsPerModel: 90,
    statLine: human({ WS: 5, BS: 5, S: 4, T: 4, W: 3, I: 4, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    mounts: [BARDED_WARHORSE_MOUNT],
    specialRules: [
      'Special character',
      'Heavy armour & sword',
      'Runefang (+30 pts) and Dragon Bow (+40 pts) — fixed magic items',
      'May ride a Barded Warhorse (+7 pts)',
    ],
  },
  {
    id: 'emp-marius-leitdorf',
    name: 'Marius Leitdorf, Elector Count of Averland',
    nameEs: 'Marius Leitdorf, Conde Elector de Averland',
    role: 'character',
    pointsPerModel: 110,
    statLine: human({ WS: 5, BS: 4, S: 4, T: 4, W: 3, I: 4, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    mounts: [BARDED_WARHORSE_MOUNT],
    specialRules: [
      'Special character',
      'Heavy armour; two swords (Runefang +30 pts & long dagger)',
      'Frenzy — 6 attacks when frenzied plus 1 extra for dagger',
      'May ride a Barded Warhorse (+7 pts)',
    ],
  },
  {
    id: 'emp-zarina-katarin',
    name: 'Tzarina Katarin, Ice Queen of Kislev',
    nameEs: 'Zarina Katarin, Reina del Hielo de Kislev',
    role: 'character',
    pointsPerModel: 200,
    statLine: human({ WS: 4, BS: 3, S: 3, T: 3, W: 3, I: 5, A: 3, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard3',
    lores: ['ice'],
    canBeGeneral: false,
    max: 1,
    profiles: [WARHORSE_PROFILE],
    specialRules: [
      'Special character — requires at least one Kislev regiment',
      'Wizard Level 3 (Ice Magic only — own spell deck)',
      'Fearfrost magic sword (+100 pts) — fixed magic item',
      'Up to 3 magic items total',
      'Rides a Warhorse (included)',
    ],
  },

  // ===== Regiments / REGIMIENTOS (25%+) =====

  // ----- Knightly Orders (0-1 each) -----
  {
    id: 'emp-white-wolf-knights',
    name: 'Knights of the White Wolf',
    nameEs: 'Caballeros del Lobo Blanco',
    role: 'regiment',
    pointsPerModel: 37,
    statLine: human({ WS: 4, M: 8, I: 4, Ld: 7 }),
    mount: BARDED_WARHORSE_PROFILE,
    minSize: 5,
    max: 1,
    specialRules: [
      '0-1 Knightly Order',
      'Heavy armour & barded Warhorse (3+ save)',
      'Two-handed cavalry hammer',
      'May carry a magic standard',
    ],
  },
  {
    id: 'emp-panther-knights',
    name: 'Knights Panther',
    nameEs: 'Caballeros Pantera',
    role: 'regiment',
    pointsPerModel: 39,
    statLine: human({ WS: 4, M: 8, I: 4, Ld: 7 }),
    mount: BARDED_WARHORSE_PROFILE,
    minSize: 5,
    max: 1,
    specialRules: [
      '0-1 Knightly Order',
      'Heavy armour, shield & barded Warhorse (2+ save)',
      'Sword & cavalry lance',
      'May carry a magic standard',
    ],
  },
  {
    id: 'emp-blazing-sun-knights',
    name: 'Knights of the Blazing Sun',
    nameEs: 'Caballeros del Sol Llameante',
    role: 'regiment',
    pointsPerModel: 39,
    statLine: human({ WS: 4, M: 8, I: 4, Ld: 7 }),
    mount: BARDED_WARHORSE_PROFILE,
    minSize: 5,
    max: 1,
    specialRules: [
      '0-1 Knightly Order',
      'Heavy armour, shield & barded Warhorse (2+ save)',
      'Sword & cavalry lance',
      'May carry a magic standard',
    ],
  },
  {
    id: 'emp-reiksgard-knights',
    name: 'Reiksguard Knights',
    nameEs: 'Caballeros de la Reiksgard',
    role: 'regiment',
    pointsPerModel: 39,
    statLine: human({ WS: 4, M: 8, I: 4, Ld: 7 }),
    mount: BARDED_WARHORSE_PROFILE,
    minSize: 5,
    max: 1,
    specialRules: [
      '0-1 Knightly Order',
      'Heavy armour, shield & barded Warhorse (2+ save)',
      'Sword & cavalry lance',
      'May carry a magic standard',
    ],
  },

  // ----- Mounted state troops -----
  {
    id: 'emp-pistoliers',
    name: 'Pistoliers',
    nameEs: 'Pistoleros',
    role: 'regiment',
    pointsPerModel: 22,
    statLine: human({ M: 8, Ld: 7 }),
    mount: WARHORSE_PROFILE,
    minSize: 5,
    specialRules: [
      'Light armour & Warhorse (5+ save)',
      'Two pistols & sword',
    ],
  },
  {
    id: 'emp-engineer-scouts',
    name: 'Outriders (Mounted Engineers)',
    nameEs: 'Exploradores',
    role: 'regiment',
    pointsPerModel: 28,
    statLine: human({ M: 8, Ld: 7 }),
    mount: BARDED_WARHORSE_PROFILE,
    minSize: 5,
    max: 1,
    specialRules: [
      '0-1 regiment',
      'Light armour & barded Warhorse (4+ save)',
      'Repeater Handgun or Repeater Pistols (each model may carry either)',
      'Sword as secondary weapon',
    ],
  },

  // ----- Foot state troops -----
  {
    id: 'emp-halberdiers',
    name: 'Halberdiers',
    nameEs: 'Alabarderos',
    role: 'regiment',
    pointsPerModel: 7,
    statLine: human(),
    minSize: 5,
    options: [LIGHT_ARMOUR_2, SHIELD_1],
    specialRules: ['Halberd & hand weapon'],
  },
  {
    id: 'emp-reiksgard-foot',
    name: 'Reiksguard Foot Knights',
    nameEs: 'Caballeros a Pie de la Reiksgard',
    role: 'regiment',
    pointsPerModel: 12,
    statLine: human({ WS: 4, S: 4, I: 4, Ld: 7 }),
    minSize: 5,
    max: 1,
    specialRules: [
      '0-1 Reiksgard regiment',
      'Heavy armour & shield (4+ save)',
      'Sword',
    ],
  },
  {
    id: 'emp-spearmen',
    name: 'Spearmen',
    nameEs: 'Lanceros',
    role: 'regiment',
    pointsPerModel: 7,
    statLine: human(),
    minSize: 5,
    options: [LIGHT_ARMOUR_2],
    specialRules: ['Spear, hand weapon & shield'],
  },
  {
    id: 'emp-greatswords',
    name: 'Greatswords',
    nameEs: 'Grandes Espaderos',
    role: 'regiment',
    pointsPerModel: 7,
    statLine: human(),
    minSize: 5,
    options: [LIGHT_ARMOUR_2],
    specialRules: ['Great sword (two-handed) & hand weapon'],
  },
  {
    id: 'emp-swordsmen',
    name: 'Swordsmen',
    nameEs: 'Espaderos',
    role: 'regiment',
    pointsPerModel: 7,
    statLine: human({ WS: 4 }),
    minSize: 5,
    options: [LIGHT_ARMOUR_2],
    specialRules: ['Sword & shield (6+ save)'],
  },
  {
    id: 'emp-handgunners',
    name: 'Handgunners',
    nameEs: 'Fusileros',
    role: 'regiment',
    pointsPerModel: 8,
    statLine: human(),
    minSize: 5,
    options: [LIGHT_ARMOUR_2],
    specialRules: ['Handgun & hand weapon'],
  },
  {
    id: 'emp-archers',
    name: 'Archers',
    nameEs: 'Arqueros',
    role: 'regiment',
    pointsPerModel: 8,
    statLine: human(),
    minSize: 5,
    options: [LIGHT_ARMOUR_2, SHIELD_1],
    specialRules: ['Long bow & hand weapon', 'May skirmish (Skirmishers rule)'],
  },
  {
    id: 'emp-crossbowmen',
    name: 'Crossbowmen',
    nameEs: 'Ballesteros',
    role: 'regiment',
    pointsPerModel: 8,
    statLine: human(),
    minSize: 5,
    options: [LIGHT_ARMOUR_2, SHIELD_1],
    specialRules: ['Crossbow & hand weapon'],
  },

  // ----- Allied / auxiliary troops -----
  {
    id: 'emp-kislev-winged-lancers',
    name: 'Kislev Winged Lancers',
    nameEs: 'Lanceros Alados de Kislev',
    role: 'regiment',
    pointsPerModel: 25,
    statLine: human({ WS: 4, M: 8, Ld: 7 }),
    mount: WARHORSE_PROFILE,
    minSize: 5,
    specialRules: [
      'Light armour, shield & Warhorse (no armour save)',
      'Sword & cavalry lance',
      'May carry a magic standard',
    ],
  },
  {
    id: 'emp-kislev-horse-archers',
    name: 'Kislev Horse Archers',
    nameEs: 'Arqueros a Caballo de Kislev',
    role: 'regiment',
    pointsPerModel: 16,
    statLine: human({ M: 8, Ld: 7 }),
    mount: WARHORSE_PROFILE,
    minSize: 5,
    specialRules: [
      'Shield, bow & hand weapon (5+ save on horse)',
      'May skirmish (fast cavalry)',
    ],
  },
  {
    id: 'emp-flagellants',
    name: 'Flagellants',
    nameEs: 'Flagelantes',
    role: 'regiment',
    pointsPerModel: 10,
    statLine: human({ S: 4, T: 4, A: 2, Ld: 10 }),
    minSize: 5,
    max: 1,
    specialRules: [
      '0-1 unit',
      'Flail',
      'Unbreakable fanatics (see the rulebook)',
    ],
  },
  {
    id: 'emp-dwarfs',
    name: 'Dwarf Warriors (allies)',
    nameEs: 'Enanos',
    role: 'regiment',
    pointsPerModel: 10,
    statLine: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
    minSize: 5,
    options: [SPEAR, CROSSBOW, SHIELD_1],
    specialRules: ['Hand weapon & light armour (6+ save)'],
  },
  {
    id: 'emp-halflings',
    name: 'Halflings',
    nameEs: 'Halflings',
    role: 'regiment',
    pointsPerModel: 3.5,
    statLine: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
    minSize: 5,
    options: [BOW, SPEAR, LIGHT_ARMOUR_1, SHIELD_HALF],
    specialRules: ['Hand weapon'],
  },
  {
    id: 'emp-ogres',
    name: 'Ogres',
    nameEs: 'Ogros',
    role: 'regiment',
    pointsPerModel: 40,
    statLine: { M: 6, WS: 3, BS: 2, S: 4, T: 5, W: 3, I: 3, A: 2, Ld: 7 },
    minSize: 5,
    options: [ADD_HAND_WEAPON, TWO_HAND_WEAPON, HALBERD, LIGHT_ARMOUR_2],
    specialRules: ['Hand weapon'],
  },

  // ===== War machines / MÁQUINAS DE GUERRA (0-25%) =====

  {
    id: 'emp-mortar',
    name: 'Mortar',
    nameEs: 'Mortero',
    role: 'warmachine',
    pointsPerModel: 100,
    statLine: human(),
    specialRules: [
      'War machine',
      'Range 30-120 cm (12-48"), S7, save -4, D3 wounds',
      '3 crew (hand weapons)',
    ],
  },
  {
    id: 'emp-great-cannon',
    name: 'Great Cannon',
    nameEs: 'Gran Cañón',
    role: 'warmachine',
    pointsPerModel: 100,
    statLine: human(),
    specialRules: [
      'War machine',
      'Range 150 cm (60"), S10, D6 wounds',
      '3 crew (hand weapons)',
    ],
  },
  {
    id: 'emp-steam-tank',
    name: 'Steam Tank',
    nameEs: 'Tanque a Vapor',
    role: 'warmachine',
    pointsPerModel: 200,
    statLine: { M: 0, WS: 3, BS: 3, S: 7, T: 10, W: 5, I: 0, A: 0, Ld: 10 },
    max: 8,
    specialRules: ['0-8', 'Steam-powered (see special rules chapter)'],
  },
  {
    id: 'emp-war-wagon',
    name: 'Imperial War Wagon',
    nameEs: 'Carro de Guerra Imperial',
    role: 'chariot',
    pointsPerModel: 150,
    statLine: { M: 8, WS: 3, BS: 3, S: 7, T: 5, W: 4, I: 3, A: 1, Ld: 7 },
    profiles: [
      {
        name: 'Chassis', nameEs: 'Chasis',
        statLine: { T: 5, W: 4 },
        specialRules: ['Chariot has no armour save'],
      },
      {
        name: 'Crew', nameEs: 'Tripulación',
        statLine: human({ Ld: 7 }),
        specialRules: ['6+ armour save'],
      },
      {
        name: 'Draught Warhorses', nameEs: 'Caballos de Tiro',
        statLine: WARHORSE_STATS,
      },
    ],
    specialRules: [
      'War chariot',
      'Crew 6+ save; chariot has no armour save',
      'Drawn by Warhorses (6+ save)',
    ],
  },
  {
    id: 'emp-helblaster',
    name: 'Helblaster Volley Gun',
    nameEs: 'Cañón de Salvas Helblaster',
    role: 'warmachine',
    pointsPerModel: 100,
    statLine: human(),
    specialRules: [
      'War machine',
      '0-30 cm: Artillery dice hits at S5; 30-60 cm: Artillery dice ÷2 hits at S4',
      '3 crew (hand weapons)',
    ],
  },
  {
    id: 'emp-halfling-hot-pot',
    name: 'Halfling Hot Pot',
    nameEs: 'Olla Caliente Halfling',
    role: 'warmachine',
    pointsPerModel: 50,
    statLine: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
    max: 1,
    specialRules: [
      '0-1 (requires at least one Halfling regiment)',
      'Range 90 cm (36"), S5 direct hit / S3 elsewhere, 1 wound, no save',
      'Halfling crew (hand weapons)',
    ],
  },

  // ===== Monsters / LISTA DE MONSTRUOS (0-25%) =====

  {
    id: 'emp-chimera',
    name: 'Chimera',
    nameEs: 'Quimera',
    role: 'monster',
    pointsPerModel: 250,
    statLine: { M: 6, WS: 4, BS: 0, S: 7, T: 6, W: 6, I: 4, A: 6, Ld: 8 },
    specialRules: ['Large target', 'Terror', 'Flying'],
  },
  {
    id: 'emp-basilisk',
    name: 'Basilisk',
    nameEs: 'Basilisco',
    role: 'monster',
    pointsPerModel: 150,
    statLine: { M: 4, WS: 3, BS: 0, S: 4, T: 4, W: 2, I: 4, A: 3, Ld: 6 },
    specialRules: ['Large target', 'Terror', 'Petrifying gaze'],
  },
  {
    id: 'emp-dragon',
    name: 'Dragon',
    nameEs: 'Dragón',
    role: 'monster',
    pointsPerModel: 450,
    statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 },
    specialRules: ['Large target', 'Terror', 'Flying', 'Breath weapon'],
  },
  {
    id: 'emp-great-dragon',
    name: 'Great Dragon',
    nameEs: 'Gran Dragón',
    role: 'monster',
    pointsPerModel: 600,
    statLine: { M: 6, WS: 7, BS: 0, S: 7, T: 7, W: 8, I: 8, A: 8, Ld: 8 },
    specialRules: ['Large target', 'Terror', 'Flying', 'Breath weapon'],
  },
  {
    id: 'emp-emperor-dragon',
    name: 'Emperor Dragon',
    nameEs: 'Dragón Emperador',
    role: 'monster',
    pointsPerModel: 750,
    statLine: { M: 6, WS: 8, BS: 0, S: 8, T: 8, W: 9, I: 6, A: 9, Ld: 9 },
    specialRules: ['Large target', 'Terror', 'Flying', 'Breath weapon'],
  },
  {
    id: 'emp-griffon',
    name: 'Griffon',
    nameEs: 'Grifo',
    role: 'monster',
    pointsPerModel: 150,
    statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 4, Ld: 8 },
    specialRules: ['Large target', 'Terror', 'Flying'],
  },
  {
    id: 'emp-hippogriff',
    name: 'Hippogriff',
    nameEs: 'Hipogrifo',
    role: 'monster',
    pointsPerModel: 145,
    statLine: { M: 8, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 6, A: 3, Ld: 8 },
    specialRules: ['Large target', 'Terror', 'Flying'],
  },
  {
    id: 'emp-hydra',
    name: 'Hydra',
    nameEs: 'Hidra',
    role: 'monster',
    pointsPerModel: 225,
    statLine: { M: 6, WS: 3, BS: 0, S: 5, T: 6, W: 7, I: 3, A: 5, Ld: 6 },
    specialRules: ['Large target'],
  },
  {
    id: 'emp-giant-spider',
    name: 'Giant Spider',
    nameEs: 'Araña Gigantesca',
    role: 'monster',
    pointsPerModel: 50,
    statLine: { M: 5, WS: 3, BS: 0, S: 5, T: 4, W: 4, I: 1, A: 2, Ld: 7 },
    specialRules: ['Large target'],
  },
  {
    id: 'emp-manticore',
    name: 'Manticore',
    nameEs: 'Manticora',
    role: 'monster',
    pointsPerModel: 200,
    statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 },
    specialRules: ['Large target', 'Terror', 'Flying'],
  },
  {
    id: 'emp-winged-serpent',
    name: 'Winged Serpent',
    nameEs: 'Serpiente Alada',
    role: 'monster',
    pointsPerModel: 180,
    statLine: { M: 6, WS: 5, BS: 0, S: 5, T: 6, W: 4, I: 4, A: 3, Ld: 5 },
    specialRules: ['Large target', 'Flying'],
  },
  {
    id: 'emp-giant-scorpion',
    name: 'Giant Scorpion',
    nameEs: 'Escorpión Gigante',
    role: 'monster',
    pointsPerModel: 50,
    statLine: { M: 5, WS: 3, BS: 0, S: 5, T: 4, W: 4, I: 1, A: 2, Ld: 7 },
    specialRules: ['Large target', 'Poisoned attacks'],
  },
  {
    id: 'emp-swarms',
    name: 'Swarms',
    nameEs: 'Enjambres',
    role: 'monster',
    pointsPerModel: 100,
    statLine: { M: 6, WS: 3, BS: 0, S: 3, T: 2, W: 5, I: 1, A: 5, Ld: 10 },
    specialRules: [
      'Swarm (rats/frogs/lizards/bats/snakes/insects/scorpions)',
      'Multiple wounds base',
      'Immune to psychology',
    ],
  },
]

export const EMPIRE: Army = {
  id: 'empire',
  name: 'The Empire',
  nameEs: 'El Imperio',
  composition: STANDARD_5E_COMPOSITION,
  units,
  magicItems: COMMON_MAGIC_ITEMS,
  selectionRules: {
    dependencies: [
      { unitId: 'emp-zarina-katarin', requiresAnyOf: ['emp-kislev-winged-lancers', 'emp-kislev-horse-archers'], labelEn: 'Tzarina Katarin, Ice Queen of Kislev', labelEs: 'Zarina Katarin, Reina del Hielo de Kislev' },
      { unitId: 'emp-halfling-hot-pot', requiresAnyOf: ['emp-halflings'], labelEn: 'Halfling Hot Pot', labelEs: 'Olla Caliente Halfling' },
    ],
  },
}
