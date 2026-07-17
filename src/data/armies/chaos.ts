import type { Army, EquipmentOption, MountOption, ProfileBlock, StatLine, UnitProfile } from '../types'
import { STANDARD_5E_COMPOSITION } from '../types'
import { COMMON_MAGIC_ITEMS } from '../magicItems'

// Chaos — data transcribed from TWO 1998 Spanish army books, combined
// into one cohesive Chaos army for Fantasy Battle 5th edition:
//   • the official "Reino del Caos" army book (Tuomas Pirinen & Rick Priestley,
//     1998) — Bestiary "Bestiario Mortal" / "Grimorius Daemonicus" (pp.74-90)
//     and the three army lists "El Ejército del Caos": Hordas de Guerreros del
//     Caos (pp.100-105), Hordas de Hombres Bestia (pp.106-110), Legiones
//     Demoníacas (pp.112-117) and Grey Infernal (pp.118-120).
//   • the official "Paladines del Caos" book (Tuomas Pirinen, 1998) — Señores del
//     Caos special characters (Arbaal el Invencible p.28, Dechala la Renegada
//     p.26).
//
// All points, profiles, equipment costs and 0-1 limits are taken directly from
// the printed pages of those books.
//
// NOTE: the books give Movement in centimetres; values here are converted to
// the inches used elsewhere in the app (8cm→3", 10→4, 12→5, 15→6, 18→7, 20→8,
// 22→9, 25→10, 30→12; ≈cm÷2.5). Stat columns in the books are
// M / HA(WS) / HP(BS) / F(S) / R(T) / H(W) / I / A / L(Ld).

const statline = (over: Partial<StatLine> = {}): StatLine => ({
  M: 4, WS: 6, BS: 6, S: 4, T: 4, W: 1, I: 6, A: 2, Ld: 9, ...over,
})

// --- Army-specific equipment options (per-model costs from the army lists).
//     Same `id` = mutually exclusive slot reused across units at the unit's own
//     price (cf. Dark Elves / Chaos Dwarfs). ---
const SHIELD_1: EquipmentOption = { id: 'shield', name: 'Escudos', pointsPerModel: 1 }
const SHIELD_2: EquipmentOption = { id: 'shield', name: 'Escudos', pointsPerModel: 2 }
const SHIELD_HALF: EquipmentOption = { id: 'shield', name: 'Escudos', pointsPerModel: 0.5 }
const LIGHT_ARMOUR_2: EquipmentOption = { id: 'light-armour', name: 'Armadura Ligera', pointsPerModel: 2 }
// Chaos Armour for regiments: Warriors +7/model (p.103), Knights +14/model (p.103)
const CHAOS_ARMOUR_7: EquipmentOption = { id: 'chaos-armour', name: 'Armadura del Caos', pointsPerModel: 7 }
const CHAOS_ARMOUR_14: EquipmentOption = { id: 'chaos-armour', name: 'Armadura del Caos', pointsPerModel: 14 }
// Chaos Armour for characters: +10 pts flat (Reino del Caos p.100)
const CHAOS_ARMOUR_10: EquipmentOption = { id: 'chaos-armour', name: 'Armadura del Caos', pointsPerModel: 10 }
const HEAVY_ARMOUR_3: EquipmentOption = { id: 'heavy-armour', name: 'Armadura Pesada', pointsPerModel: 3 }
const ADD_HAND_WEAPON_1: EquipmentOption = { id: 'add-hand-weapon', name: 'Arma de Mano Adicional', pointsPerModel: 1 }
const TWO_HAND_2: EquipmentOption = { id: 'two-hand', name: 'Armas a Dos Manos', pointsPerModel: 2 }
const HALBERD_2: EquipmentOption = { id: 'halberd', name: 'Alabarda', pointsPerModel: 2 }
const FLAIL_1: EquipmentOption = { id: 'flail', name: 'Mangual', pointsPerModel: 1 }
const FLAIL_2: EquipmentOption = { id: 'flail', name: 'Mangual', pointsPerModel: 2 }
const SPEAR_1: EquipmentOption = { id: 'spear', name: 'Lanza', pointsPerModel: 1 }
const SPEAR_HALF: EquipmentOption = { id: 'spear', name: 'Lanza', pointsPerModel: 0.5 }
const SCYTHED_WHEELS: EquipmentOption = { id: 'scythed-wheels', name: 'Ruedas con Cuchillas', pointsPerModel: 20, flat: true }

// --- Character mounts (Reino del Caos pp.100-102; mount profiles from the
//     bestiary pp.74-90 / 114-117). In 5th ed a character's mount cost is added
//     to the model and the pair counts under the Characters % allowance.
//     Per pp.100-102 a character may always take a Chaos Steed (+4); a daemonic
//     mount (Juggernaut/Disc/Steed of Slaanesh/Beast of Nurgle) requires the
//     matching Mark of Chaos — enforced via `requiresOption`. (A character may
//     also ride a Grey Infernal monster, but the book treats that monster as an
//     ALLY against the 25% allowance, not a folded mount, so it is NOT offered
//     here — field the standalone monster entry instead.) ---
const CHAOS_STEED_STATS: StatLine = { M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 3, A: 1, Ld: 5 }
const JUGGERNAUT_STATS: StatLine = { M: 7, WS: 5, BS: 0, S: 5, T: 5, W: 3, I: 1, A: 3, Ld: 5 }
const DISC_STATS: StatLine = { M: 9, WS: 0, BS: 0, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 }
// Corcel de Slaanesh (p.117): M30→12", WS3 S4 T5 W1 I6 A1 Ld10.
const STEED_OF_SLAANESH_STATS: StatLine = { M: 12, WS: 3, BS: 0, S: 4, T: 5, W: 1, I: 6, A: 1, Ld: 10 }
// Bestia de Nurgle (p.115): M8→3", WS3 S3 T5 W3 I3 A1D6 Ld6.
const BEAST_OF_NURGLE_STATS: StatLine = { M: 3, WS: 3, BS: 0, S: 3, T: 5, W: 3, I: 3, A: 1, Ld: 6 }

const CHAOS_STEED_MOUNT: MountOption = {
  id: 'mount-chaos-steed', name: 'Chaos Steed', nameEs: 'Corcel del Caos',
  points: 4, statLine: CHAOS_STEED_STATS,
}
const JUGGERNAUT_MOUNT: MountOption = {
  id: 'mount-juggernaut', name: 'Juggernaut of Khorne', nameEs: 'Devastador de Khorne',
  points: 70, statLine: JUGGERNAUT_STATS, requiresOption: 'mark-khorne',
  specialRules: ['Daemonic mount of Khorne (requires the Mark of Khorne)', 'Impact hits'],
}
const DISC_OF_TZEENTCH_MOUNT: MountOption = {
  id: 'mount-disc', name: 'Disc of Tzeentch', nameEs: 'Disco de Tzeentch',
  points: 15, statLine: DISC_STATS, requiresOption: 'mark-tzeentch',
  specialRules: ['Daemonic mount of Tzeentch (requires the Mark of Tzeentch)', 'Flying'],
}
const STEED_OF_SLAANESH_MOUNT: MountOption = {
  id: 'mount-steed-of-slaanesh', name: 'Steed of Slaanesh', nameEs: 'Corcel de Slaanesh',
  points: 15, statLine: STEED_OF_SLAANESH_STATS, requiresOption: 'mark-slaanesh',
  specialRules: ['Daemonic mount of Slaanesh (requires the Mark of Slaanesh)'],
}
const BEAST_OF_NURGLE_MOUNT: MountOption = {
  id: 'mount-beast-of-nurgle', name: 'Beast of Nurgle', nameEs: 'Bestia de Nurgle',
  points: 75, statLine: BEAST_OF_NURGLE_STATS, requiresOption: 'mark-nurgle',
  specialRules: ['Daemonic mount of Nurgle (requires the Mark of Nurgle)'],
}

/** Mounts a generic Chaos lord/hero/champion (and the BSB) may ride: the Chaos
 *  Steed plus every daemonic mount (each gated to its Mark via requiresOption). */
const CHAOS_CHARACTER_MOUNTS: MountOption[] = [
  CHAOS_STEED_MOUNT, JUGGERNAUT_MOUNT, DISC_OF_TZEENTCH_MOUNT, STEED_OF_SLAANESH_MOUNT, BEAST_OF_NURGLE_MOUNT,
]
/** Sorcerer mounts: as above but no Juggernaut — Khorne has no sorcerers (p.101). */
const CHAOS_SORCERER_MOUNTS: MountOption[] = [
  CHAOS_STEED_MOUNT, DISC_OF_TZEENTCH_MOUNT, STEED_OF_SLAANESH_MOUNT, BEAST_OF_NURGLE_MOUNT,
]

// --- Fixed (non-selectable) named mounts baked into a special character's points.
//     Display-only profiles parsed from the "(M.. WS.. S.. T.. I.. A..)" rule text. ---
const HOUND_OF_KHORNE_PROFILE: ProfileBlock = {
  name: 'Hound of Khorne', nameEs: 'Mastín de Khorne',
  statLine: { M: 8, WS: 6, S: 6, T: 5, I: 10, A: 4 },
  specialRules: ['Daemonic mount of Khorne'],
}
const WSORAYCH_PROFILE: ProfileBlock = {
  name: "W'Soraych, the Apocalypse Steed", nameEs: 'W\'Soraych, el Corcel del Apocalipsis',
  statLine: { M: 12, WS: 6, S: 5, T: 4, I: 6, A: 3 },
  specialRules: ['Barded'],
}
const MORDREK_STEED_PROFILE: ProfileBlock = {
  name: 'Barded Chaos Steed', nameEs: 'Corcel del Caos con Barda',
  statLine: { M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 3, A: 1, Ld: 5 },
  specialRules: ['Barded (1+ armour save)'],
}
const BLOODGREED_PROFILE: ProfileBlock = {
  name: 'Bloodgreed, Chaos Hound', nameEs: 'Fauces Sangrientas, Mastín del Caos',
  statLine: { M: 6, WS: 6, S: 6, T: 5, W: 3, A: 3 },
}

// Mark of Chaos upgrades for characters (Reino del Caos pp.56-57 for the
// effects, p.100/104 for the per-model points). A model may bear only ONE Mark
// (p.56), so all four share `exclusiveGroup: 'mark'`. Sorcerer-specific variants
// of the effects are noted in each description (p.103).
const MARK_KHORNE: EquipmentOption = {
  id: 'mark-khorne', name: 'Marca de Khorne', pointsPerModel: 45, exclusiveGroup: 'mark',
  description:
    'Frenzy, plus free Chaos Armour (4+ save; combines with shield and mount, does not count against the magic-item limit, and does not reduce movement). Khorne has no sorcerers — a wizard may not take this Mark.',
  descEs:
    'Furia Asesina y Armadura del Caos gratuita (salvación 4+; se combina con escudo y montura, no cuenta para el límite de objetos mágicos ni reduce el movimiento). Khorne no tiene hechiceros — un mago no puede llevar esta Marca.',
}
const MARK_NURGLE: EquipmentOption = {
  id: 'mark-nurgle', name: 'Marca de Nurgle', pointsPerModel: 40, exclusiveGroup: 'mark',
  description:
    '+1 Toughness (Champion → T5; Hero/Lord → T6). On a Sorcerer instead: no lower-level wizard within 15cm of him may cast spells.',
  descEs:
    '+1 a la Resistencia (Paladín → R5; Héroe/Comandante → R6). En un Hechicero, en cambio: ningún hechicero de nivel inferior situado a 15 cm o menos puede lanzar hechizos.',
}
const MARK_SLAANESH: EquipmentOption = {
  id: 'mark-slaanesh', name: 'Marca de Slaanesh', pointsPerModel: 35, exclusiveGroup: 'mark',
  description:
    'Immune to psychology and never flees close combat — peels off from a fleeing unit to keep fighting. On a Sorcerer instead: no enemy within 30cm may shoot at or cast spells on him.',
  descEs:
    'Inmune a la psicología y nunca huye del combate cuerpo a cuerpo — se separa de una unidad que huya para seguir luchando. En un Hechicero, en cambio: ningún enemigo situado a 30 cm o menos puede dispararle ni lanzarle hechizos.',
}
const MARK_TZEENTCH: EquipmentOption = {
  id: 'mark-tzeentch', name: 'Marca de Tzeentch', pointsPerModel: 10, exclusiveGroup: 'mark',
  description:
    'Once per battle, re-roll one dice that affects him directly (armour save, to-hit, or a characteristic test), adding or subtracting 1 from the result. A re-roll may not itself be re-rolled.',
  descEs:
    'Una vez por batalla, repite una tirada que le afecte directamente (salvación por armadura, impactar o un chequeo de atributo), sumando o restando 1 al resultado. Una tirada repetida no puede volver a repetirse.',
}

// Chaos Sorcerer level upgrades — Hechicero (L1) 84 → Paladín Hechicero (L2) 166 →
// Maestro Hechicero (L3) 240 → Gran Hechicero (L4) 356.
// Deltas from L1: +82 / +156 / +272 (Reino del Caos p.101).
const CHAOS_WIZARD_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Nivel 2 (Paladín Hechicero)', pointsPerModel: 82, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Nivel 3 (Maestro Hechicero)', pointsPerModel: 156, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Nivel 4 (Gran Hechicero)', pointsPerModel: 272, magicItemSlotsDelta: 3 },
]

// Beast Shaman level upgrades — Shaman (L1) 68 → Paladín (L2) 134 →
// Maestro (L3) 225 → Gran Shaman (L4) 336.
// Deltas from L1: +66 / +157 / +268 (Reino del Caos pp.106-107).
const BEAST_SHAMAN_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Nivel 2 (Paladín Shaman)', pointsPerModel: 66, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Nivel 3 (Maestro Shaman)', pointsPerModel: 157, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Nivel 4 (Gran Shaman)', pointsPerModel: 268, magicItemSlotsDelta: 3 },
]

const units: UnitProfile[] = [
  // ===================================================================
  // CHARACTERS (0-50%)
  // ===================================================================

  // ----- Warriors of Chaos (Reino del Caos pp.74, 100-102) -----
  {
    id: 'ch-lord',
    name: 'Chaos Lord',
    nameEs: 'Comandante del Caos',
    role: 'character',
    pointsPerModel: 255,
    statLine: statline({ WS: 9, BS: 9, S: 5, T: 5, W: 3, I: 9, A: 5, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    options: [
      ADD_HAND_WEAPON_1, TWO_HAND_2, HALBERD_2, SPEAR_1, FLAIL_1,
      SHIELD_1, HEAVY_ARMOUR_3, CHAOS_ARMOUR_10,
      MARK_KHORNE, MARK_NURGLE, MARK_SLAANESH, MARK_TZEENTCH,
    ],
    mounts: CHAOS_CHARACTER_MOUNTS,
    specialRules: ['Chaos armour', 'May ride a Chaos Steed or a daemonic mount matching its Mark'],
  },
  {
    id: 'ch-hero',
    name: 'Chaos Hero',
    nameEs: 'Héroe del Caos',
    role: 'character',
    pointsPerModel: 163,
    statLine: statline({ WS: 8, BS: 8, S: 5, T: 5, W: 2, I: 8, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: true,
    options: [
      ADD_HAND_WEAPON_1, TWO_HAND_2, HALBERD_2, SPEAR_1, FLAIL_1,
      SHIELD_1, HEAVY_ARMOUR_3, CHAOS_ARMOUR_10,
      MARK_KHORNE, MARK_NURGLE, MARK_SLAANESH, MARK_TZEENTCH,
    ],
    mounts: CHAOS_CHARACTER_MOUNTS,
    specialRules: ['Chaos armour', 'May ride a Chaos Steed or a daemonic mount matching its Mark'],
  },
  {
    id: 'ch-champion',
    name: 'Chaos Champion',
    nameEs: 'Paladín del Caos',
    role: 'character',
    pointsPerModel: 61,
    statLine: statline({ WS: 7, BS: 7, S: 5, T: 4, W: 1, I: 7, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'champion',
    options: [
      ADD_HAND_WEAPON_1, TWO_HAND_2, HALBERD_2, SPEAR_1, FLAIL_1,
      SHIELD_1, HEAVY_ARMOUR_3, CHAOS_ARMOUR_10,
      MARK_KHORNE, MARK_NURGLE, MARK_SLAANESH, MARK_TZEENTCH,
    ],
    mounts: CHAOS_CHARACTER_MOUNTS,
    specialRules: ['Chaos armour', 'May lead a regiment; may ride a Chaos Steed or a daemonic mount matching its Mark'],
  },
  {
    id: 'ch-battle-standard',
    name: 'Chaos Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla del Caos',
    role: 'character',
    pointsPerModel: 170,
    statLine: statline({ WS: 8, BS: 7, S: 5, T: 4, W: 2, I: 7, A: 4, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeBSB: true,
    isBSB: true,
    max: 1,
    options: [
      SHIELD_1, HEAVY_ARMOUR_3, CHAOS_ARMOUR_10,
      MARK_KHORNE, MARK_NURGLE, MARK_SLAANESH, MARK_TZEENTCH,
    ],
    mounts: CHAOS_CHARACTER_MOUNTS,
    specialRules: ['0-1 Army Battle Standard', 'May carry one magic standard', 'Chaos armour', 'May ride a Chaos Steed or a daemonic mount matching its Mark'],
  },

  // ----- Chaos Sorcerer (Hechiceros del Caos, Reino del Caos pp.75, 101) -----
  {
    id: 'ch-sorcerer',
    name: 'Chaos Sorcerer',
    nameEs: 'Hechicero del Caos',
    role: 'character',
    pointsPerModel: 84,
    statLine: statline({ WS: 6, BS: 6, S: 4, T: 5, W: 1, I: 7, A: 2, Ld: 9 }),
    isCharacter: true,
    characterRank: 'wizard1',
    lores: ['tzeentch', 'nurgle', 'slaanesh', 'dark'],
    canBeGeneral: true,
    options: [
      ...CHAOS_WIZARD_LEVELS,
      CHAOS_ARMOUR_10,
      MARK_NURGLE, MARK_SLAANESH, MARK_TZEENTCH,
    ],
    mounts: CHAOS_SORCERER_MOUNTS,
    specialRules: ['Wizard', 'Chaos Magic or Dark Magic', 'Khorne has no sorcerers', 'May ride a Chaos Steed or a daemonic mount matching its Mark'],
  },

  // ----- Beastman Lords & Shamans (Hombres Bestia, Reino del Caos pp.77, 106-107) -----
  {
    id: 'ch-beastlord',
    name: 'Beastlord',
    nameEs: 'Señor de los Hombres Bestia',
    role: 'character',
    pointsPerModel: 200,
    statLine: statline({ M: 4, WS: 7, BS: 6, S: 4, T: 5, W: 4, I: 6, A: 4, Ld: 9 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    options: [ADD_HAND_WEAPON_1, TWO_HAND_2, HALBERD_2, SPEAR_1, FLAIL_1, SHIELD_1, LIGHT_ARMOUR_2],
    specialRules: ['Beast'],
  },
  {
    id: 'ch-beast-chieftain',
    name: 'Beastman Chieftain',
    nameEs: 'Héroe Hombre Bestia',
    role: 'character',
    pointsPerModel: 130,
    statLine: statline({ M: 4, WS: 6, BS: 5, S: 4, T: 5, W: 3, I: 5, A: 3, Ld: 8 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: true,
    options: [ADD_HAND_WEAPON_1, TWO_HAND_2, HALBERD_2, SPEAR_1, FLAIL_1, SHIELD_1, LIGHT_ARMOUR_2],
    specialRules: ['Beast'],
  },
  {
    id: 'ch-beast-shaman',
    name: 'Beastman Shaman',
    nameEs: 'Shaman Hombre Bestia',
    role: 'character',
    pointsPerModel: 68,
    statLine: statline({ M: 4, WS: 4, BS: 3, S: 3, T: 5, W: 2, I: 4, A: 1, Ld: 7 }),
    isCharacter: true,
    characterRank: 'wizard1',
    lores: ['tzeentch', 'nurgle', 'slaanesh', 'dark'],
    options: BEAST_SHAMAN_LEVELS,
    specialRules: ['Wizard', 'Uses the three Chaos spell decks or Dark Magic', 'Beast'],
  },
  {
    id: 'ch-beast-battle-standard',
    name: 'Beastman Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla Hombre Bestia',
    role: 'character',
    pointsPerModel: 125,
    statLine: statline({ M: 4, WS: 6, BS: 4, S: 4, T: 4, W: 2, I: 4, A: 3, Ld: 7 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeBSB: true,
    isBSB: true,
    max: 1,
    options: [SHIELD_1, LIGHT_ARMOUR_2],
    specialRules: ['0-1 Army Battle Standard', 'Beast', 'May carry one magic standard'],
  },

  // ===================================================================
  // SPECIAL CHARACTERS (0-1 each — Paladines del Caos)
  // ===================================================================
  {
    // Paladines del Caos p.28: M10→4", on Mastín de Khorne M20→8"
    // 570 pts total. Mounted on Hound of Khorne (daemonic mount).
    // Cavalry movement = mount's M = 8.
    id: 'ch-arbaal',
    name: 'Arbaal the Invincible',
    nameEs: 'Arbaal el Invencible',
    role: 'character',
    pointsPerModel: 570,
    statLine: statline({ M: 8, WS: 9, BS: 8, S: 6, T: 5, W: 3, I: 8, A: 2, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: false,
    max: 1,
    profiles: [HOUND_OF_KHORNE_PROFILE],
    specialRules: [
      'Special character',
      'Mark of Khorne — frenzy replaced by Destructor reward',
      'Chaos armour (4+ save)',
      'Destroyer of Khorne — 2D6 Attacks',
      'Rides the Hound of Khorne (Mastín de Khorne: M8, WS6, S6, T5, I10, A4)',
      'Cannot be the army General',
      'Fixed magic items (Hound of Khorne, Destroyer of Khorne)',
    ],
  },
  {
    // Paladines del Caos p.26: M20→8", A5(6 with Many Arms reward)
    id: 'ch-dechala',
    name: 'Dechala, the Denied One',
    nameEs: 'Dechala, la Renegada',
    role: 'character',
    pointsPerModel: 355,
    statLine: statline({ M: 8, WS: 8, BS: 7, S: 5, T: 5, W: 2, I: 10, A: 5, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character',
      'Mark of Slaanesh — immune to psychology and rout tests',
      'Chaos armour (4+ save)',
      'Dances of Slaanesh (choose one each turn)',
      'Hatred of Khorne and all Khorne-marked units',
      'A=6 with Many Arms (Muchos Brazos) reward included',
      'Fixed magic items (Elixir of Damnation, Many Arms reward)',
    ],
  },
  {
    // Paladines del Caos p.16: Archaon M10→4" on foot, rides W'Soraych the
    // Apocalypse Steed (Corcel del Apocalipsis) M30→12". Mounted M = 12.
    // 630 pts incl. the steed and his three magic items. Must be the General.
    id: 'ch-archaon',
    name: 'Archaon, Lord of the End Times',
    nameEs: 'Archaon, Señor del Caos',
    role: 'character',
    pointsPerModel: 630,
    statLine: statline({ M: 12, WS: 9, BS: 9, S: 5, T: 5, W: 4, I: 9, A: 5, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    profiles: [WSORAYCH_PROFILE],
    specialRules: [
      'Special character',
      'Must be the army General; needs a host of 630+ pts (Warriors/Beastmen/Daemons)',
      'Mark of the Chosen (Marca del Elegido) — steals one Dark Magic spell each magic phase',
      'Rides W\'Soraych, the Apocalypse Steed (M30→12", WS6, S5, T4, I6, A3) with barding',
      'Armour of Morkar + shield → 1+ armour save',
      'Immune to psychology, cannot be broken; hates the Grand Theogonist',
      'Fixed magic items: Slayer of Kings/Matareyes (100), Armour of Morkar (70), Eye of Sheerian (60)',
    ],
  },
  {
    // Paladines del Caos p.18: M10→4". 248 pts. Cannot be the General.
    id: 'ch-aekold',
    name: 'Aekold Helbrass',
    nameEs: 'Aekold Helbrass',
    role: 'character',
    pointsPerModel: 248,
    statLine: statline({ M: 4, WS: 8, BS: 8, S: 5, T: 5, W: 2, I: 8, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character',
      'Cannot be the General; needs a host of 248+ pts from the Warrior hosts',
      'Mark of Tzeentch — may re-roll one dice each battle, ±1 to the result',
      'Chaos armour → 4+ save',
      'Breath of Life — regains a wound on 4+ each Chaos turn; can even reincarnate',
      'Fixed magic items: Great Sword of the Wind (50, great weapon, erratic), Breath of Life reward (25)',
    ],
  },
  {
    // Paladines del Caos p.20: M10→4" on foot, rides a barded Chaos Steed
    // (M20→8"). Mounted M = 8. 398 pts. Fights alone; deduct from 25% allies.
    id: 'ch-mordrek',
    name: 'Count Mordrek the Damned',
    nameEs: 'Conde Mordrek el Condenado',
    role: 'character',
    pointsPerModel: 398,
    // Eternal Damnation randomises WS/S/T/A each turn — representative values shown.
    statLine: statline({ M: 8, WS: 7, BS: 9, S: 5, T: 5, W: 3, I: 9, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: false,
    max: 1,
    profiles: [MORDREK_STEED_PROFILE],
    specialRules: [
      'Special character',
      'Cannot be the General; fights alone (independent, may not lead a unit). Deduct from the 25% allies allowance',
      'Eternal Damnation — random profile: WS 1D6+4, S 1D3+3, T 1D3+3, A 1D6+1 (re-roll one each Chaos turn)',
      'Rides a barded Chaos Steed (M20→8") → 1+ armour save',
      'No Mark of Chaos',
      'Fixed magic items: Sword of Change (50), Chaos Runeshield (50), Eternal Damnation reward (15)',
    ],
  },
  {
    // Paladines del Caos p.24: M10→4". 340 pts. Mark of Nurgle raises T 5→6.
    // Can be the General only if the host is all Chaos Barbarians.
    id: 'ch-valnir',
    name: 'Valnir the Reaper',
    nameEs: 'Valnir el Segador',
    role: 'character',
    pointsPerModel: 340,
    statLine: statline({ M: 4, WS: 8, BS: 8, S: 5, T: 6, W: 2, I: 8, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character',
      'Needs a host of 340+ pts from the Warrior hosts; may be General only if the host is all Chaos Barbarians',
      'Mark of Nurgle — Toughness raised to 6 (already in profile)',
      'Chaos armour → 4+ save',
      'Immune to fear, terror and panic; he causes fear; hates all living enemies (not Undead/Daemons)',
      'Wind of Pestilence — infect one enemy unit at the start of battle (1D6 effect)',
      'Fixed magic items: Soul Reaper great flail (50, +2 S, grows in combat), Regeneration reward (50)',
    ],
  },
  {
    // Paladines del Caos p.32: Egrimm M10→4" on foot. 521 pts. Level 4 wizard.
    // May ride the two-headed Chaos Dragon Baudros (M15→6") for +625.
    id: 'ch-egrimm',
    name: 'Egrimm van Horstmann',
    nameEs: 'Egrimm van Horstmann',
    role: 'character',
    pointsPerModel: 521,
    statLine: statline({ M: 4, WS: 6, BS: 6, S: 5, T: 5, W: 4, I: 9, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard4',
    lores: ['tzeentch', 'battle', 'dark'],
    canBeGeneral: true,
    max: 1,
    mounts: [
      {
        id: 'mount-baudros', name: 'Baudros, the Two-Headed Chaos Dragon',
        nameEs: 'Baudros, el Dragón del Caos de Dos Cabezas',
        points: 625,
        statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 7, I: 6, A: 8, Ld: 8 },
        specialRules: ['Large target', 'Causes terror', 'Flying', 'Two heads', 'Breath weapon'],
      },
    ],
    specialRules: [
      'Special character',
      'May be the General; needs a host of 521+ pts from the Chaos Warrior hosts',
      'Great Wizard (Level 4) — 4 spells from Tzeentch, Battle Magic or Dark Magic',
      'Mark of Tzeentch — re-roll one dice each battle, ±1',
      'Chaos armour → 4+ save',
      'May ride the two-headed Chaos Dragon Baudros (+625 pts; M15→6", WS6 S7 T7 W7 I6 A8, breath weapon; deduct from 25% allies)',
      'Strong-Minded — takes Ld tests on 3D6, keep the two lowest',
      'Fixed magic items: Chaos Runesword (45), Chaos Familiar (50), Skull of Katam (35), Cunning of Tzeentch reward (20)',
    ],
  },
  {
    // Paladines del Caos p.34: fielded as a MONSTER. M15→6". 320 pts.
    // Part of the Grey Infernal — deduct from the 25% allies allowance.
    id: 'ch-scyla',
    name: 'Scyla Anfinngrim',
    nameEs: 'Scyla Anfinngrim',
    role: 'monster',
    pointsPerModel: 320,
    statLine: statline({ M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 4, I: 3, A: 6, Ld: 8 }),
    isSpecialCharacter: true,
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character — Chaos Spawn (Engendro del Caos), fielded as a monster',
      'Cannot be the General; deduct from the 25% allies allowance (Grey Infernal)',
      'Iron-Hard Skin — unmodifiable 4+ armour save (no Strength modifier)',
      'Causes fear',
      'Collar of Khorne — destroys magic weapons and dispels spells that strike him (4+)',
      'Lord of Scyla — deploy within 15cm of a Khorne champion; if the master dies he becomes a normal Chaos Spawn',
    ],
  },
  {
    // Paladines del Caos p.36: Greater Daemon of Tzeentch. M20→8". 855 pts.
    id: 'ch-amon-chakai',
    name: "Amon 'Chakai, Lord of Change",
    nameEs: "Amon 'Chakai, Señor de la Transformación",
    role: 'character',
    pointsPerModel: 855,
    statLine: statline({ M: 8, WS: 9, BS: 9, S: 7, T: 7, W: 8, I: 9, A: 6, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard4',
    lores: ['tzeentch', 'dark', 'battle'],
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character — Greater Daemon of Tzeentch',
      'May be the General; needs a Tzeentch daemonic host of 855+ pts',
      'Flies; causes terror; daemonic aura ward save',
      'Master of Sorcery (Level 5) — steals 5 spells from Tzeentch, Dark Magic or Battle Magic',
      'Hatred of Nurgle (daemons, Marked models and Nurgle-led units)',
      'Fixed rewards: All-Seeing Eye (50), Hand of Destiny (30), Master of Sorcery (250)',
    ],
  },
  {
    // Paladines del Caos p.40: Daemon Prince of Slaanesh. M15→6". 570 pts.
    id: 'ch-azazel',
    name: 'Azazel, Prince of Damnation',
    nameEs: 'Azazel, Príncipe de la Condenación',
    role: 'character',
    pointsPerModel: 570,
    // A6 base, 7 with the Giant Claw extra attack.
    statLine: statline({ M: 6, WS: 7, BS: 7, S: 6, T: 5, W: 5, I: 9, A: 6, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard2',
    lores: ['slaanesh'],
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character — Daemon Prince of Slaanesh',
      'May be the General; needs a Slaanesh daemonic host of 570+ pts',
      'Flies; causes terror; Mark of Slaanesh (immune to psychology, but can be made to flee by his wings)',
      'Giant Claw — +1 Attack at S8 causing 1D3 wounds (A 6→7)',
      'Dark Halo — unmodifiable 4+ ward save',
      'Forked Tail — negate one enemy attack each combat',
      'Master of Sorcery (Level 2) — Slaanesh spells',
      'Fixed rewards: Tempter (50), Master of Sorcery (100), Infernal Sword (50)',
    ],
  },
  {
    // Paladines del Caos p.42: Beastman Chieftain. M10→4". 165 + Bloodgreed
    // hound 75 = 240 pts. May be the General.
    id: 'ch-khazrak',
    name: 'Khazrak the One-Eye',
    nameEs: 'Khazrak el Tuerto',
    role: 'character',
    pointsPerModel: 240,
    statLine: statline({ M: 4, WS: 6, BS: 5, S: 5, T: 5, W: 3, I: 5, A: 3, Ld: 8 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    profiles: [BLOODGREED_PROFILE],
    specialRules: [
      'Special character — Beastman Warlord',
      'May be the General; needs a Beastmen host of 240+ pts incl. a unit of Chaos Hounds',
      'Heavy armour + sword → 5+ save',
      'Accompanied by his Chaos Hound Bloodgreed (Fauces Sangrientas, 75 pts: M15→6", WS6 S6 T5 W3 A3)',
      'Fixed magic item: Azote (whip, 25) — extra −1 to enemy armour saves; may strike any model in the enemy unit',
    ],
  },
  {
    // Paladines del Caos p.44: Beastman Warlord on a Tuskgor chariot. Gorthor
    // M10→4", chariot drawn by two Tuskgors (M18→7"). 510 + chariot 110 = 620.
    // Always the General. Also a Level 3 Shaman.
    id: 'ch-gorthor',
    name: 'Gorthor the Beastlord',
    nameEs: 'Gorthor el Cruel',
    role: 'character',
    pointsPerModel: 620,
    statLine: statline({ M: 7, WS: 6, BS: 4, S: 4, T: 5, W: 4, I: 5, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard3',
    lores: ['tzeentch', 'nurgle', 'slaanesh', 'dark'],
    canBeGeneral: true,
    max: 1,
    profiles: [
      { name: 'Tuskgor Chariot', nameEs: 'Carro de Tuskgors', statLine: { S: 7, T: 7, W: 3 }, specialRules: ['Scythed', 'Impact hits'] },
      { name: '2 Tuskgors', nameEs: '2 Tuskgors', statLine: { M: 7, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 3, A: 1, Ld: 7 }, specialRules: ['4+ armour save'] },
    ],
    specialRules: [
      'Special character — Beastman Warlord; always the army General',
      'Needs a Beastmen host of 400+ pts',
      'Rides a scythed Tuskgor chariot (110 pts: S7 T7 W3; drawn by two Tuskgors M18→7", driven by Bagrar)',
      'Master Shaman (Level 3) — 3 spells from the Chaos decks or Dark Magic',
      'Beastlord — Beastmen regiments within 30cm are immune to the effects of animosity/indiscipline',
      'Fixed magic items: Impaler great lance (60, +2 S on the charge, slays on 4+), Skull of Mugrar (50), Mantle of the Beastlord (50)',
    ],
  },

  // ===================================================================
  // REGIMENTS (25%+)
  // ===================================================================

  // ----- Warriors of Chaos host (Reino del Caos pp.103-104) -----
  {
    id: 'ch-warriors',
    name: 'Chaos Warriors',
    nameEs: 'Guerreros del Caos',
    role: 'regiment',
    pointsPerModel: 24,
    statLine: statline(),
    minSize: 5,
    options: [CHAOS_ARMOUR_7, TWO_HAND_2, HALBERD_2, ADD_HAND_WEAPON_1, SHIELD_1],
    specialRules: ['Heavy armour & hand weapon (5+ save)', 'May carry a magic standard', 'May take a Mark of Chaos'],
  },
  {
    // Cavalry: use mount M. Corcel del Caos M20cm → 8".
    // +14pts/model Chaos Armour (p.103). 66 pts base.
    id: 'ch-knights',
    name: 'Chaos Knights',
    nameEs: 'Caballeros del Caos',
    role: 'regiment',
    pointsPerModel: 66,
    statLine: statline({ M: 8, A: 2 }),
    mount: { name: 'Barded Chaos Steed', nameEs: 'Corcel del Caos con Barda', statLine: CHAOS_STEED_STATS },
    minSize: 5,
    options: [CHAOS_ARMOUR_14],
    specialRules: [
      'Heavy armour, shield, cavalry lance & sword (2+ save)',
      'Barded Chaos Steed (Corcel del Caos, M8)',
      'May carry a magic standard',
      'May take a Mark of Chaos',
    ],
  },
  {
    id: 'ch-marauders',
    name: 'Chaos Marauders',
    nameEs: 'Bárbaros del Caos',
    role: 'regiment',
    pointsPerModel: 12,
    statLine: statline({ WS: 4, BS: 3, S: 4, T: 3, I: 4, A: 2, Ld: 7 }),
    minSize: 5,
    options: [TWO_HAND_2, FLAIL_1, ADD_HAND_WEAPON_1, SHIELD_1, LIGHT_ARMOUR_2],
    specialRules: ['Hand weapon', 'May carry a magic standard'],
  },
  {
    // Cavalry: Caballo de Guerra M20cm → 8".
    // Shield +2/model, Flail +2/model (Reino del Caos p.105).
    id: 'ch-marauder-horsemen',
    name: 'Marauder Horsemen',
    nameEs: 'Jinetes Bárbaros del Caos',
    role: 'regiment',
    pointsPerModel: 31,
    statLine: statline({ M: 8, WS: 4, BS: 4, S: 4, T: 4, I: 4, A: 2, Ld: 7 }),
    mount: { name: 'Warhorse', nameEs: 'Caballo de Guerra', statLine: { M: 8, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 } },
    minSize: 5,
    options: [FLAIL_2, SHIELD_2],
    specialRules: ['Light armour & hand weapon (5+ save)', 'War Horse mount (Caballo de Guerra, M8)', 'Fast cavalry', 'May carry a magic standard'],
  },
  {
    id: 'ch-hounds',
    name: 'Chaos Hounds',
    nameEs: 'Mastines del Caos',
    role: 'regiment',
    pointsPerModel: 12,
    statLine: statline({ M: 6, WS: 4, BS: 0, S: 4, T: 4, W: 1, I: 4, A: 2, Ld: 6 }),
    minSize: 5,
    noCommand: true,
    specialRules: ['Run in packs', 'No champion, standard or musician (may have a Chaos Warrior keeper, +24)'],
  },
  {
    id: 'ch-ogres',
    name: 'Chaos Ogres',
    nameEs: 'Ogros del Caos',
    role: 'regiment',
    pointsPerModel: 40,
    statLine: statline({ M: 6, WS: 3, BS: 2, S: 4, T: 5, W: 3, I: 3, A: 2, Ld: 7 }),
    minSize: 2,
    options: [ADD_HAND_WEAPON_1, TWO_HAND_2, HALBERD_2, SHIELD_1, LIGHT_ARMOUR_2],
    specialRules: ['Causes fear'],
  },

  // ----- Beastman host (Reino del Caos pp.108-110) -----
  {
    id: 'ch-gors',
    name: 'Gor Beastmen',
    nameEs: 'Gors Hombres Bestia',
    role: 'regiment',
    pointsPerModel: 10,
    statLine: statline({ M: 4, WS: 4, BS: 3, S: 3, T: 4, W: 2, I: 3, A: 1, Ld: 7 }),
    minSize: 5,
    options: [HALBERD_2, TWO_HAND_2, ADD_HAND_WEAPON_1, SHIELD_1, LIGHT_ARMOUR_2],
    specialRules: ['Beast — Animosity', 'May carry a magic standard'],
  },
  {
    id: 'ch-ungors',
    name: 'Ungor Beastmen',
    nameEs: 'Ungors Hombres Bestia',
    role: 'regiment',
    pointsPerModel: 4.5,
    statLine: statline({ M: 4, WS: 3, BS: 2, S: 3, T: 4, W: 1, I: 3, A: 1, Ld: 6 }),
    minSize: 5,
    options: [SPEAR_HALF, SHIELD_HALF],
    specialRules: ['Beast — Animosity', 'May skirmish'],
  },
  {
    id: 'ch-bestigors',
    name: 'Bestigors',
    nameEs: 'Bestigors',
    role: 'regiment',
    pointsPerModel: 18,
    statLine: statline({ M: 4, WS: 5, BS: 3, S: 4, T: 4, W: 2, I: 3, A: 1, Ld: 7 }),
    minSize: 5,
    max: 1,
    options: [SHIELD_1],
    specialRules: [
      '0-1 regiment',
      'Halberd & heavy armour (5+ save)',
      'Immune to Animosity and to panic from Ungors',
      'May carry a magic standard',
    ],
  },
  {
    id: 'ch-minotaurs',
    name: 'Minotaurs',
    nameEs: 'Minotauros',
    role: 'regiment',
    pointsPerModel: 42,
    statLine: statline({ M: 6, WS: 4, BS: 3, S: 4, T: 4, W: 3, I: 3, A: 2, Ld: 9 }),
    minSize: 2,
    options: [TWO_HAND_2, ADD_HAND_WEAPON_1, LIGHT_ARMOUR_2],
    specialRules: ['Causes fear', 'Blood Greed (frenzy after breaking a foe)', 'May carry a magic standard'],
  },
  {
    id: 'ch-beast-hounds',
    name: 'Chaos Hounds (Beastman host)',
    nameEs: 'Mastines del Caos (Hombres Bestia)',
    role: 'regiment',
    pointsPerModel: 12,
    statLine: statline({ M: 6, WS: 4, BS: 0, S: 4, T: 4, W: 1, I: 4, A: 2, Ld: 6 }),
    minSize: 5,
    noCommand: true,
    specialRules: ['Run in packs', 'No champion, standard or musician (may have a Beastman keeper)'],
  },

  // ===================================================================
  // CHARIOTS (counted with War Machines, 0-25%)
  // ===================================================================
  {
    id: 'ch-chariot',
    name: 'Chaos Chariot',
    nameEs: 'Carruaje del Caos',
    role: 'chariot',
    pointsPerModel: 122,
    statLine: statline({ S: 7, T: 7, W: 3, A: 0 }),
    profiles: [
      { name: 'Chariot', nameEs: 'Carro', statLine: { T: 7, W: 3 } },
      { name: '2 Chaos Warriors (crew)', nameEs: '2 Guerreros del Caos (tripulación)', statLine: statline() },
      { name: '2 Chaos Steeds', nameEs: '2 Corceles del Caos', statLine: CHAOS_STEED_STATS },
    ],
    options: [SCYTHED_WHEELS, TWO_HAND_2, HALBERD_2, FLAIL_1, SHIELD_1, CHAOS_ARMOUR_7],
    specialRules: [
      'Chariot (T7 W3) — drawn by 2 Chaos Steeds, crew of 2 Chaos Warriors',
      'Crew: heavy armour & hand weapon',
      'May take a Mark of Chaos via its general',
      'May carry a magic standard',
    ],
  },
  {
    // Reino del Caos p.104: Carruaje Bárbaro 80 pts, crew of Bárbaros on Caballos de Guerra
    id: 'ch-marauder-chariot',
    name: 'Marauder Chariot',
    nameEs: 'Carruaje Bárbaro',
    role: 'chariot',
    pointsPerModel: 80,
    statLine: statline({ S: 5, T: 5, W: 3, A: 0 }),
    profiles: [
      { name: 'Chariot', nameEs: 'Carro', statLine: { T: 5, W: 3 } },
      { name: '2 Chaos Marauders (crew)', nameEs: '2 Bárbaros del Caos (tripulación)', statLine: statline({ WS: 4, BS: 3, S: 4, T: 3, I: 4, A: 2, Ld: 7 }) },
      { name: '2 War Horses', nameEs: '2 Caballos de Guerra', statLine: { M: 8, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 } },
    ],
    options: [SCYTHED_WHEELS],
    specialRules: [
      'Chariot (T5 W3) — drawn by 2 War Horses, crew of 2 Chaos Marauders',
      'Crew: hand weapon & light armour',
      'May carry a magic standard',
    ],
  },
  {
    id: 'ch-beast-chariot',
    name: 'Beastman Chariot',
    nameEs: 'Carruaje de los Hombres Bestia',
    role: 'chariot',
    pointsPerModel: 88,
    statLine: statline({ S: 7, T: 7, W: 3, A: 0 }),
    profiles: [
      { name: 'Chariot', nameEs: 'Carro', statLine: { T: 7, W: 3 } },
      { name: '2 Gor Beastmen (crew)', nameEs: '2 Gors Hombres Bestia (tripulación)', statLine: statline({ M: 4, WS: 4, BS: 3, S: 3, T: 4, W: 2, I: 3, A: 1, Ld: 7 }) },
      { name: '2 Tuskgors', nameEs: '2 Tuskgors', statLine: { M: 7, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 3, A: 1, Ld: 7 }, specialRules: ['4+ armour save'] },
    ],
    options: [SCYTHED_WHEELS, TWO_HAND_2, HALBERD_2, LIGHT_ARMOUR_2, SHIELD_1],
    specialRules: [
      'Chariot (T7 W3) — drawn by 2 Tuskgors, crew of 2 Gor Beastmen',
      'Tuskgors: 4+ armour save',
      'Beast',
      'May carry a magic standard',
    ],
  },

  // ===================================================================
  // DAEMONS — Daemonic Legions (Reino del Caos pp.112-117)
  // ===================================================================

  // ----- Greater Daemons -----
  {
    // p.112: M15→6", WS10, BS10, S8, T7, W10, I8, A10, Ld10. 750 pts.
    id: 'ch-bloodthirster',
    name: 'Bloodthirster',
    nameEs: 'Devorador de Almas de Khorne',
    role: 'monster',
    pointsPerModel: 750,
    statLine: statline({ M: 6, WS: 10, BS: 10, S: 8, T: 7, W: 10, I: 8, A: 10, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Greater Daemon of Khorne',
      'Daemonic (4+ daemonic aura save)',
      'Causes terror',
      'Flying',
      'Up to 2 Daemonic Rewards',
    ],
  },
  {
    // p.112: M20→8", WS9, BS10, S7, T7, W7, I10, A6, Ld10. 525 pts.
    id: 'ch-lord-of-change',
    name: 'Lord of Change',
    nameEs: 'Señor de la Transformación de Tzeentch',
    role: 'monster',
    pointsPerModel: 525,
    statLine: statline({ M: 8, WS: 9, BS: 10, S: 7, T: 7, W: 7, I: 10, A: 6, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard4',
    lores: ['tzeentch'],
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Greater Daemon of Tzeentch',
      'Wizard Level 4',
      'Daemonic (4+ daemonic aura save)',
      'Causes terror',
      'Flying',
      'Up to 2 Daemonic Rewards',
    ],
  },
  {
    // p.112: M10→4", WS7, BS7, S7, T8, W10, I4, A7, Ld10. 525 pts.
    id: 'ch-great-unclean-one',
    name: 'Great Unclean One',
    nameEs: 'Gran Inmundicia de Nurgle',
    role: 'monster',
    pointsPerModel: 525,
    statLine: statline({ M: 4, WS: 7, BS: 7, S: 7, T: 8, W: 10, I: 4, A: 7, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Greater Daemon of Nurgle',
      'Daemonic (4+ daemonic aura save)',
      'Causes terror',
      'Up to 2 Daemonic Rewards',
    ],
  },
  {
    // p.112: M15→6", WS9, BS10, S7, T7, W8, I7, A6, Ld10. 525 pts.
    id: 'ch-keeper-of-secrets',
    name: 'Keeper of Secrets',
    nameEs: 'Guardián de los Secretos de Slaanesh',
    role: 'monster',
    pointsPerModel: 525,
    statLine: statline({ M: 6, WS: 9, BS: 10, S: 7, T: 7, W: 8, I: 7, A: 6, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Greater Daemon of Slaanesh',
      'Daemonic (4+ daemonic aura save)',
      'Causes terror',
      'Up to 2 Daemonic Rewards',
    ],
  },
  {
    // p.112: M15→6", WS7, BS7, S6, T5, W4, I8, A5, Ld10. 275 pts.
    id: 'ch-daemon-prince',
    name: 'Daemon Prince',
    nameEs: 'Príncipe Demonio',
    role: 'character',
    pointsPerModel: 275,
    statLine: statline({ M: 6, WS: 7, BS: 7, S: 6, T: 5, W: 4, I: 8, A: 5, Ld: 10 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: true,
    options: [MARK_KHORNE, MARK_NURGLE, MARK_SLAANESH, MARK_TZEENTCH],
    specialRules: [
      'Daemonic (4+ daemonic aura save)',
      'Causes terror',
      'Flying',
      'Up to 2 Daemonic Rewards',
      'May take a Mark of Chaos (Khorne +45, Nurgle +40, Tzeentch +10, Slaanesh +35)',
    ],
  },

  // ----- Daemonic Legion BSB (0-1 per Daemon lord host) -----
  {
    // p.113: Desangrador Paladín 110 pts (Khorne), Portador de Plaga Paladín 120 pts (Nurgle),
    // Horror Rosa Paladín 125 pts (Tzeentch), Diablilla Paladín 125 pts (Slaanesh).
    // Using a single entry representing the cheapest (Bloodletter Champion, 110 pts).
    id: 'ch-daemon-bsb',
    name: 'Daemonic Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla Demoníaco',
    role: 'character',
    pointsPerModel: 110,
    statLine: statline({ M: 4, WS: 6, BS: 6, S: 5, T: 3, W: 1, I: 7, A: 3, Ld: 10 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeBSB: true,
    isBSB: true,
    max: 1,
    specialRules: [
      '0-1 per Daemon lord host',
      'Daemonic (4+ aura save)',
      'Must be in a unit of same daemon type',
      'May carry the war standard of its god',
      'Cannot hold magic items (Daemonic champions cannot hold magic items)',
    ],
  },

  // ----- Daemon units -----
  {
    // p.114: M10→4", WS5, BS5, S4, T3, W1, I6, A2, Ld10. 20 pts/model.
    id: 'ch-bloodletters',
    name: 'Bloodletters of Khorne',
    nameEs: 'Desangradores de Khorne',
    role: 'regiment',
    pointsPerModel: 20,
    statLine: statline({ M: 4, WS: 5, BS: 5, S: 4, T: 3, W: 1, I: 6, A: 2, Ld: 10 }),
    minSize: 5,
    specialRules: ['Daemon of Khorne', 'Daemonic (4+ aura save)', 'Causes fear', 'Hellblade (D3 wounds)', 'May carry a magic standard'],
  },
  {
    // p.114: Juggernaut M18→7". Bloodletter on Juggernaut 90 pts/model (20+70).
    // Cavalry M = mount M = 7.
    id: 'ch-bloodletters-juggernaut',
    name: 'Bloodletters on Juggernauts',
    nameEs: 'Compañía Infernal de Khorne',
    role: 'regiment',
    pointsPerModel: 90,
    statLine: statline({ M: 7, WS: 5, BS: 5, S: 4, T: 3, W: 1, I: 6, A: 2, Ld: 10 }),
    mount: { name: 'Juggernaut of Khorne', nameEs: 'Devastador de Khorne', statLine: JUGGERNAUT_STATS, specialRules: ['Impact hits'] },
    minSize: 1,
    specialRules: [
      'Daemon of Khorne',
      'Daemonic (4+ aura save)',
      'Causes fear',
      'Hellblade (D3 wounds)',
      'Mounted on Juggernauts (M7, S5, T5, Impact hits)',
      'No minimum unit size',
      'May carry a magic standard',
    ],
  },
  {
    // p.114: M25→10", WS5, BS0, S5, T4, W2, I6, A1, Ld10. 35 pts/model.
    // S corrected to 5 from PDF (current file had S4).
    id: 'ch-khorne-hounds',
    name: 'Flesh Hounds of Khorne',
    nameEs: 'Mastines de Khorne',
    role: 'regiment',
    pointsPerModel: 35,
    statLine: statline({ M: 10, WS: 5, BS: 0, S: 5, T: 4, W: 2, I: 6, A: 1, Ld: 10 }),
    minSize: 5,
    noCommand: true,
    specialRules: ['Daemon of Khorne', 'Daemonic (4+ aura save)', 'Causes fear', 'Collar of Khorne (immune to magic)'],
  },
  {
    // p.115: M10→4", WS5, BS5, S4, T3, W1, I6, A2, Ld10. 30 pts/model.
    id: 'ch-plaguebearers',
    name: 'Plaguebearers of Nurgle',
    nameEs: 'Portadores de Plaga de Nurgle',
    role: 'regiment',
    pointsPerModel: 30,
    statLine: statline({ M: 4, WS: 5, BS: 5, S: 4, T: 3, W: 1, I: 6, A: 2, Ld: 10 }),
    minSize: 5,
    specialRules: [
      'Daemon of Nurgle',
      'Daemonic (4+ aura save)',
      'Causes fear',
      'Plague Sword (slays mortals on 4+)',
      'Cloud of Flies (-1 to hit them)',
      'May carry a magic standard',
    ],
  },
  {
    // p.114: M10→4", WS3, BS3, S3, T3, W3, I4, A3, Ld7. 30 pts/base.
    id: 'ch-nurglings',
    name: 'Nurglings',
    nameEs: 'Nurgletes',
    role: 'regiment',
    pointsPerModel: 30,
    statLine: statline({ M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 3, I: 4, A: 3, Ld: 7 }),
    minSize: 1,
    noCommand: true,
    specialRules: [
      'Daemon of Nurgle',
      'Daemonic (4+ aura save)',
      'Causes fear',
      'Each base = one multi-wound model; cannot be flanked',
    ],
  },
  {
    // p.115: M8→3", WS3, BS0, S3, T5, W3, I3, A1D6, Ld6. 75 pts/model.
    id: 'ch-beasts-of-nurgle',
    name: 'Beasts of Nurgle',
    nameEs: 'Bestias de Nurgle',
    role: 'monster',
    pointsPerModel: 75,
    statLine: statline({ M: 3, WS: 3, BS: 0, S: 3, T: 5, W: 3, I: 3, A: 1, Ld: 6 }),
    minSize: 1,
    noCommand: true,
    specialRules: [
      'Daemon of Nurgle',
      'Daemonic (4+ aura save)',
      'Causes fear',
      'Random extra movement (additional random move toward enemy)',
      'D6 attacks ignoring armour',
      'Slime trail (S3 hit on attackers from flank/rear)',
    ],
  },
  {
    // p.116: M10→4", WS5, BS5, S4, T3, W1, I6, A2, Ld10. 35 pts/model.
    id: 'ch-pink-horrors',
    lores: ['tzeentch'],
    name: 'Pink Horrors of Tzeentch',
    nameEs: 'Horrores Rosa de Tzeentch',
    role: 'regiment',
    pointsPerModel: 35,
    statLine: statline({ M: 4, WS: 5, BS: 5, S: 4, T: 3, W: 1, I: 6, A: 2, Ld: 10 }),
    minSize: 5,
    specialRules: [
      'Daemon of Tzeentch',
      'Causes fear',
      'No daemonic aura save',
      'Unit casts as a wizard (level by unit size: 1-5=L1, 6-10=L2, 11-15=L3, 16+=L4)',
      'Division — splits into 2 Blue Horrors when wounded',
      'May carry a magic standard',
    ],
  },
  {
    // p.116: M22→9", WS3, BS5, S5, T4, W2, I4, A2, Ld10. 50 pts/model.
    id: 'ch-flamers',
    name: 'Flamers of Tzeentch',
    nameEs: 'Incineradores de Tzeentch',
    role: 'monster',
    pointsPerModel: 50,
    statLine: statline({ M: 9, WS: 3, BS: 5, S: 5, T: 4, W: 2, I: 4, A: 2, Ld: 10 }),
    minSize: 1,
    noCommand: true,
    specialRules: [
      'Daemon of Tzeentch',
      'Daemonic (4+ aura save)',
      'Causes fear',
      'Flame attack — 15cm range, D6 hits at S3',
      'Flamer attack in combat (D3 wounds)',
      'Bounding move (ignores obstacles)',
    ],
  },
  {
    // p.117: Diablilla M10→4", WS6, BS5, S4, T3, W1, I6, A3, Ld10. 35 pts/model.
    // Steed of Slaanesh (Corcel de Slaanesh) M30→12", +25 pts/model.
    id: 'ch-daemonettes',
    lores: ['slaanesh'],
    name: 'Daemonettes of Slaanesh',
    nameEs: 'Diablillas de Slaanesh',
    role: 'regiment',
    pointsPerModel: 35,
    statLine: statline({ M: 4, WS: 6, BS: 5, S: 4, T: 3, W: 1, I: 6, A: 3, Ld: 10 }),
    minSize: 5,
    options: [{ id: 'steed-of-slaanesh', name: 'Corceles de Slaanesh', pointsPerModel: 25 }],
    specialRules: [
      'Daemon of Slaanesh',
      'Daemonic (4+ aura save)',
      'Causes fear',
      'Unit casts as a wizard (level by unit size: 1-5=L1, 6-10=L2, 11-15=L3, 16+=L4)',
      'May be mounted on Steeds of Slaanesh (M12, +25 pts/model)',
      'May carry a magic standard',
    ],
  },
  {
    // p.117: Diablo M15→6", WS3, BS0, S3, T3, W1, I3, A3, Ld8. 30 pts/model.
    id: 'ch-fiends-of-slaanesh',
    name: 'Fiends of Slaanesh',
    nameEs: 'Diablos de Slaanesh',
    role: 'monster',
    pointsPerModel: 30,
    statLine: statline({ M: 6, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 3, A: 3, Ld: 8 }),
    minSize: 1,
    noCommand: true,
    specialRules: [
      'Daemon of Slaanesh',
      'Daemonic (4+ aura save)',
      'Causes fear',
      'Scorpion tail (auto-wound on a hit that beats armour)',
      'Soporific musk (-1 to hit them)',
    ],
  },

  // ===================================================================
  // MONSTERS & REGIMENTS — Grey Infernal (Reino del Caos pp.118-120)
  // ===================================================================
  {
    // p.120: M5D6 (random), WS3, BS0, S4, T5, W3, I3, A1D6, Ld10. 70 pts/model.
    // M and A are random — stored as base values, noted in specialRules.
    id: 'ch-chaos-spawn',
    name: 'Chaos Spawn',
    nameEs: 'Engendro del Caos',
    role: 'monster',
    pointsPerModel: 70,
    statLine: statline({ M: 4, WS: 3, BS: 0, S: 4, T: 5, W: 3, I: 3, A: 1, Ld: 10 }),
    minSize: 1,
    noCommand: true,
    specialRules: [
      'Random movement 5D6cm toward the enemy (M varies)',
      '1D6 attacks (A varies)',
      'Causes fear',
      'Immune to psychology',
    ],
  },
  {
    // p.118: M10→4", WS4, BS0, S4, T4, W2, I2, A1, Ld6. 15 pts/model.
    id: 'ch-harpies',
    name: 'Harpies',
    nameEs: 'Arpías',
    role: 'regiment',
    pointsPerModel: 15,
    statLine: statline({ M: 4, WS: 4, BS: 0, S: 4, T: 4, W: 2, I: 2, A: 1, Ld: 6 }),
    minSize: 5,
    noCommand: true,
    specialRules: ['Flying', 'No champions, standards or musicians', 'Cannot be led by characters'],
  },
  {
    // p.118: M15→6", WS3, BS1, S5, T4, W3, I1, A4, Ld7. 65 pts/model.
    id: 'ch-chaos-trolls',
    name: 'Chaos Trolls',
    nameEs: 'Trolls del Caos',
    role: 'monster',
    pointsPerModel: 65,
    statLine: statline({ M: 6, WS: 3, BS: 1, S: 5, T: 4, W: 3, I: 1, A: 4, Ld: 7 }),
    minSize: 1,
    options: [TWO_HAND_2],
    specialRules: ['Causes fear', 'Stupidity', 'Regeneration', 'Vomit attack (S5, no armour save)'],
  },
  {
    // p.119: M15→6", WS4, BS2, S5, T5, W4, I2, A3, Ld7. 87 pts/model.
    // Options: +2pts two-handed weapon, +1pt extra hand weapon, +2pts light armour.
    id: 'ch-dragon-ogres',
    name: 'Dragon Ogres',
    nameEs: 'Ogros Dragón',
    role: 'monster',
    pointsPerModel: 87,
    statLine: statline({ M: 6, WS: 4, BS: 2, S: 5, T: 5, W: 4, I: 2, A: 3, Ld: 7 }),
    minSize: 1,
    options: [TWO_HAND_2, ADD_HAND_WEAPON_1, LIGHT_ARMOUR_2],
    specialRules: [
      'Causes fear',
      'Scaly skin (5+ save)',
      'Immune to lightning — frenzy if struck by it',
    ],
  },
  {
    // p.119: Ratas M15→6", Sapos M10→4", Lagartos M10→4", Murciélagos M10→4",
    // Serpientes M8→3", Insectos M10→4", Escorpiones M10→4". 100 pts/swarm base.
    // Use the Rats profile as representative; M6 is the fastest (Rats).
    id: 'ch-swarms',
    name: 'Swarms',
    nameEs: 'Enjambres',
    role: 'regiment',
    pointsPerModel: 100,
    statLine: statline({ M: 6, WS: 3, BS: 0, S: 3, T: 2, W: 5, I: 1, A: 5, Ld: 10 }),
    minSize: 1,
    noCommand: true,
    specialRules: [
      '100 pts per swarm base (each base = 1 unit of mixed creatures)',
      'All bases in a unit must be same creature type',
      'Immune to psychology',
      'Cannot be flanked',
    ],
  },
  {
    // p.120: Dragón del Caos M15→6", WS6, BS0, S7, T7, W7, I6, A8, Ld8. 625 pts.
    id: 'ch-chaos-dragon',
    name: 'Chaos Dragon',
    nameEs: 'Dragón del Caos',
    role: 'monster',
    pointsPerModel: 625,
    statLine: statline({ M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 7, I: 6, A: 8, Ld: 8 }),
    specialRules: [
      'Large target',
      'Causes terror',
      'Flying',
      'Scaly skin (4+ save)',
      'Two breath attacks — Dark Fire (S4 template) & Contagious Vapours (S4, no save)',
    ],
  },
  {
    // p.120: Quimera M15→6", WS4, BS0, S7, T6, W6, I4, A6, Ld8. 250 pts.
    id: 'ch-chimera',
    name: 'Chimera',
    nameEs: 'Quimera',
    role: 'monster',
    pointsPerModel: 250,
    statLine: statline({ M: 6, WS: 4, BS: 0, S: 7, T: 6, W: 6, I: 4, A: 6, Ld: 8 }),
    specialRules: ['Large target', 'Causes terror'],
  },
  {
    // p.120: Basilisco M10→4", WS3, BS0, S4, T4, W2, I4, A3, Ld6. 150 pts.
    id: 'ch-basilisk',
    name: 'Basilisk',
    nameEs: 'Basilisco',
    role: 'monster',
    pointsPerModel: 150,
    statLine: statline({ M: 4, WS: 3, BS: 0, S: 4, T: 4, W: 2, I: 4, A: 3, Ld: 6 }),
    specialRules: ['Causes fear', 'Petrifying gaze'],
  },
  {
    // p.120: Dragón M15→6", WS6, BS0, S6, T6, W7, I8, A7, Ld7. 450 pts.
    id: 'ch-dragon',
    name: 'Dragon',
    nameEs: 'Dragón',
    role: 'monster',
    pointsPerModel: 450,
    statLine: statline({ M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 }),
    specialRules: ['Large target', 'Causes terror', 'Flying', 'Breath weapon'],
  },
  {
    // p.120: Gran Dragón M15→6", WS7, BS0, S7, T8, W8, I7, A8, Ld8. 600 pts.
    id: 'ch-great-dragon',
    name: 'Great Dragon',
    nameEs: 'Gran Dragón',
    role: 'monster',
    pointsPerModel: 600,
    statLine: statline({ M: 6, WS: 7, BS: 0, S: 7, T: 8, W: 8, I: 7, A: 8, Ld: 8 }),
    specialRules: ['Large target', 'Causes terror', 'Flying', 'Breath weapon'],
  },
  {
    // p.120: Dragón Emperador M15→6", WS8, BS0, S8, T8, W9, I6, A9, Ld9. 750 pts.
    id: 'ch-emperor-dragon',
    name: 'Emperor Dragon',
    nameEs: 'Dragón Emperador',
    role: 'monster',
    pointsPerModel: 750,
    statLine: statline({ M: 6, WS: 8, BS: 0, S: 8, T: 8, W: 9, I: 6, A: 9, Ld: 9 }),
    specialRules: ['Large target', 'Causes terror', 'Flying', 'Breath weapon'],
  },
  {
    // p.120: Grifo M15→6", WS5, BS0, S6, T5, W5, I7, A4, Ld8. 150 pts.
    id: 'ch-griffon',
    name: 'Griffon',
    nameEs: 'Grifo',
    role: 'monster',
    pointsPerModel: 150,
    statLine: statline({ M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 4, Ld: 8 }),
    specialRules: ['Large target', 'Causes fear', 'Flying'],
  },
  {
    // p.120: Hipogrifo M20→8", WS5, BS0, S5, T5, W6, I5, A3, Ld8. 145 pts.
    id: 'ch-hippogriff',
    name: 'Hippogriff',
    nameEs: 'Hipogrifo',
    role: 'monster',
    pointsPerModel: 145,
    statLine: statline({ M: 8, WS: 5, BS: 0, S: 5, T: 5, W: 6, I: 5, A: 3, Ld: 8 }),
    specialRules: ['Large target', 'Causes fear', 'Flying'],
  },
  {
    // p.120: Hidra M15→6", WS3, BS0, S5, T6, W7, I3, A5, Ld6. 225 pts.
    id: 'ch-hydra',
    name: 'Hydra',
    nameEs: 'Hidra',
    role: 'monster',
    pointsPerModel: 225,
    statLine: statline({ M: 6, WS: 3, BS: 0, S: 5, T: 6, W: 7, I: 3, A: 5, Ld: 6 }),
    specialRules: ['Causes terror', 'Regeneration', 'Multiple heads'],
  },
  {
    // p.120: Mantícora M15→6", WS6, BS0, S7, T7, W5, I5, A4, Ld8. 200 pts.
    id: 'ch-manticore',
    name: 'Manticore',
    nameEs: 'Mantícora',
    role: 'monster',
    pointsPerModel: 200,
    statLine: statline({ M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 5, A: 4, Ld: 8 }),
    specialRules: ['Large target', 'Causes terror', 'Flying'],
  },
  {
    // p.120: Serpiente Alada M15→6", WS3, BS0, S4, T2, W3, I4, A3, Ld5. 180 pts.
    id: 'ch-winged-serpent',
    name: 'Winged Serpent',
    nameEs: 'Serpiente Alada',
    role: 'monster',
    pointsPerModel: 180,
    statLine: statline({ M: 6, WS: 3, BS: 0, S: 4, T: 2, W: 3, I: 4, A: 3, Ld: 5 }),
    specialRules: ['Flying', 'Causes fear'],
  },
]

// FAQ v2.20 §31.4/§31.7: a unit of daemons of a given Chaos god requires a champion-rank-or-higher
// character of that SAME god — either a fixed-god character (greater daemon / special character)
// or a generic Chaos character bearing that god's Mark (a selectable option). The generic
// ch-daemon-bsb (one merged entry for all four gods) is intentionally NOT a satisfier.
const KHORNE_CHARS = ['ch-bloodthirster', 'ch-arbaal']
const TZEENTCH_CHARS = ['ch-lord-of-change', 'ch-amon-chakai', 'ch-aekold', 'ch-egrimm']
const NURGLE_CHARS = ['ch-great-unclean-one', 'ch-valnir']
const SLAANESH_CHARS = ['ch-keeper-of-secrets', 'ch-azazel', 'ch-dechala']

const KHORNE = { mark: 'mark-khorne', gods: KHORNE_CHARS, reqEn: 'a Khorne character (champion rank or higher)', reqEs: 'un personaje de Khorne (rango paladín o superior)' }
const TZEENTCH = { mark: 'mark-tzeentch', gods: TZEENTCH_CHARS, reqEn: 'a Tzeentch character (champion rank or higher)', reqEs: 'un personaje de Tzeentch (rango paladín o superior)' }
const NURGLE = { mark: 'mark-nurgle', gods: NURGLE_CHARS, reqEn: 'a Nurgle character (champion rank or higher)', reqEs: 'un personaje de Nurgle (rango paladín o superior)' }
const SLAANESH = { mark: 'mark-slaanesh', gods: SLAANESH_CHARS, reqEn: 'a Slaanesh character (champion rank or higher)', reqEs: 'un personaje de Slaanesh (rango paladín o superior)' }

const DAEMON_DEPS = [
  { unitId: 'ch-bloodthirster', g: KHORNE, labelEn: 'Bloodthirster', labelEs: 'Devorador de Almas de Khorne' },
  { unitId: 'ch-bloodletters', g: KHORNE, labelEn: 'Bloodletters of Khorne', labelEs: 'Desangradores de Khorne' },
  { unitId: 'ch-bloodletters-juggernaut', g: KHORNE, labelEn: 'Bloodletters on Juggernauts', labelEs: 'Compañía Infernal de Khorne' },
  { unitId: 'ch-khorne-hounds', g: KHORNE, labelEn: 'Flesh Hounds of Khorne', labelEs: 'Mastines de Khorne' },
  { unitId: 'ch-lord-of-change', g: TZEENTCH, labelEn: 'Lord of Change', labelEs: 'Señor de la Transformación de Tzeentch' },
  { unitId: 'ch-pink-horrors', g: TZEENTCH, labelEn: 'Pink Horrors of Tzeentch', labelEs: 'Horrores Rosa de Tzeentch' },
  { unitId: 'ch-flamers', g: TZEENTCH, labelEn: 'Flamers of Tzeentch', labelEs: 'Incineradores de Tzeentch' },
  { unitId: 'ch-great-unclean-one', g: NURGLE, labelEn: 'Great Unclean One', labelEs: 'Gran Inmundicia de Nurgle' },
  { unitId: 'ch-plaguebearers', g: NURGLE, labelEn: 'Plaguebearers of Nurgle', labelEs: 'Portadores de Plaga de Nurgle' },
  { unitId: 'ch-nurglings', g: NURGLE, labelEn: 'Nurglings', labelEs: 'Nurgletes' },
  { unitId: 'ch-beasts-of-nurgle', g: NURGLE, labelEn: 'Beasts of Nurgle', labelEs: 'Bestias de Nurgle' },
  { unitId: 'ch-keeper-of-secrets', g: SLAANESH, labelEn: 'Keeper of Secrets', labelEs: 'Guardián de los Secretos de Slaanesh' },
  { unitId: 'ch-daemonettes', g: SLAANESH, labelEn: 'Daemonettes of Slaanesh', labelEs: 'Diablillas de Slaanesh' },
  { unitId: 'ch-fiends-of-slaanesh', g: SLAANESH, labelEn: 'Fiends of Slaanesh', labelEs: 'Diablos de Slaanesh' },
]

export const CHAOS: Army = {
  id: 'chaos',
  name: 'Chaos',
  nameEs: 'Reino del Caos',
  composition: STANDARD_5E_COMPOSITION,
  units,
  magicItems: COMMON_MAGIC_ITEMS,
  selectionRules: {
    dependencies: DAEMON_DEPS.map((d) => ({
      unitId: d.unitId,
      requiresAnyOf: d.g.gods,
      requiresOption: d.g.mark,
      labelEn: d.labelEn,
      labelEs: d.labelEs,
      requiresLabelEn: d.g.reqEn,
      requiresLabelEs: d.g.reqEs,
    })),
  },
}
