import type { Army, EquipmentOption, UnitProfile } from '../types'
import { STANDARD_5E_COMPOSITION } from '../types'
import { COMMON_MAGIC_ITEMS } from '../magicItems'

// Orcs & Goblins — data transcribed from "Ejércitos Warhammer: Orcos y Goblins"
// (Games Workshop, 1997, by Rick Priestley), the 4th/5th-edition army book.
// Points, profiles, equipment costs and 0-1 limits are taken directly from the
// book's army list (pp. 76-93) and bestiary (pp. 57-75).
//
// NOTE: the book gives Movement in centimetres; values here are converted to the
// inches used elsewhere in the app (10cm→4", 12→5", 15→6", 18→7", 20→8", 22→9").
// Stat columns in the book are M / HA(WS) / HP(BS) / F(S) / R(T) / H(W) / I / A / L(Ld).
// All profiles here use the army-list stat lines (not the bestiary summaries).

// --- Army-specific equipment options (per-model costs from the per-unit OPCIONES
//     lines, pp.82-88; same `id` = mutually exclusive slot reused at the unit's price). ---
const SHIELD_HALF: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 0.5 }
const SHIELD_1: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 1 }
const LIGHT_ARMOUR_2: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 2 }
const SPEARS_1: EquipmentOption = { id: 'spears', name: 'Spears', pointsPerModel: 1 }
const SPEARS_HALF: EquipmentOption = { id: 'spears', name: 'Spears', pointsPerModel: 0.5 }
const TWO_HAND_2: EquipmentOption = { id: 'two-hand', name: 'Two-handed weapon', pointsPerModel: 2 }
const TWO_HAND_1: EquipmentOption = { id: 'two-hand', name: 'Two-handed weapon', pointsPerModel: 1 }
const HALBERD_2: EquipmentOption = { id: 'halberd', name: 'Halberds', pointsPerModel: 2 }
const HALBERD_1: EquipmentOption = { id: 'halberd', name: 'Halberds', pointsPerModel: 1 }
const ADD_HAND_WEAPON_1: EquipmentOption = { id: 'add-hand-weapon', name: 'Additional hand weapon', pointsPerModel: 1 }
const BOW_2: EquipmentOption = { id: 'bow', name: 'Bow', pointsPerModel: 2 }
const SHORTBOW_1: EquipmentOption = { id: 'short-bow', name: 'Short bow', pointsPerModel: 1 }
const SHORTBOW_HALF: EquipmentOption = { id: 'short-bow', name: 'Short bow', pointsPerModel: 0.5 }
const CROSSBOW_1: EquipmentOption = { id: 'crossbow', name: 'Crossbow (instead of Bow)', pointsPerModel: 1 }

// Shaman level upgrades — cumulative costs from the book (p.81).
// Orc Shaman:        57 → 118 → 211 → 287  (deltas: +61 / +154 / +230)
const ORC_SHAMAN_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Wizard Level 2 (Paladín Shaman)', pointsPerModel: 61, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Wizard Level 3 (Maestro Shaman)', pointsPerModel: 154, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Wizard Level 4 (Gran Shaman)', pointsPerModel: 230, magicItemSlotsDelta: 3 },
]
// Savage Orc Shaman: 59 → 122 → 219 → 303  (deltas: +63 / +160 / +244)
const SAVAGE_ORC_SHAMAN_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Wizard Level 2 (Paladín Shaman)', pointsPerModel: 63, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Wizard Level 3 (Maestro Shaman)', pointsPerModel: 160, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Wizard Level 4 (Gran Shaman)', pointsPerModel: 244, magicItemSlotsDelta: 3 },
]
// Goblin Shaman (all goblin types): 28 → 83 → 159 → 253  (deltas: +55 / +131 / +225)
const GOBLIN_SHAMAN_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Wizard Level 2 (Paladín Shaman)', pointsPerModel: 55, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Wizard Level 3 (Maestro Shaman)', pointsPerModel: 131, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Wizard Level 4 (Gran Shaman)', pointsPerModel: 225, magicItemSlotsDelta: 3 },
]

const units: UnitProfile[] = [
  // ===== PERSONAJES — Characters (0-50%) =====

  // ----- Señores de la Guerra (Warbosses) — lord -----
  {
    id: 'og-warboss-black-orc',
    name: 'Black Orc Warboss',
    nameEs: 'Señor de la Guerra Orco Negro',
    role: 'character',
    pointsPerModel: 140,
    // PDF p.79: M10 HA7 HP6 F5 R5 I3 A5 L10
    statLine: { M: 4, WS: 7, BS: 6, S: 5, T: 5, W: 3, I: 5, A: 4, Ld: 10 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    specialRules: ['Immune to Animosity', 'May ride War Boar (+8 pts) or a monster/chariot'],
  },
  {
    id: 'og-warboss-orc',
    name: 'Orc Warboss',
    nameEs: 'Señor de la Guerra Orco',
    role: 'character',
    pointsPerModel: 110,
    // PDF p.79: M10 HA6 HP6 F4 R5 I3 A5 L9
    statLine: { M: 4, WS: 6, BS: 6, S: 4, T: 5, W: 3, I: 3, A: 5, Ld: 9 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    specialRules: ['Animosity', 'May ride War Boar (+8 pts) or a monster/chariot'],
  },
  {
    id: 'og-warboss-savage-orc',
    name: 'Savage Orc Warboss',
    nameEs: 'Señor de la Guerra Orco Salvaje',
    role: 'character',
    pointsPerModel: 150,
    // PDF p.79: M10 HA6 HP6 F4 R5 I3 A5 L9
    statLine: { M: 4, WS: 6, BS: 6, S: 4, T: 5, W: 3, I: 3, A: 5, Ld: 9 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    specialRules: ['Animosity', 'Frenzy (Savage Orcs)', '6+ ward save (war paint)', 'May ride War Boar (+8 pts) or a monster/chariot'],
  },
  {
    id: 'og-warboss-goblin',
    name: 'Goblin Warboss',
    nameEs: 'Señor de la Guerra Goblin',
    role: 'character',
    pointsPerModel: 50,
    // PDF p.79: M10 HA5 HP6 F4 R4 I3 A5 L7
    statLine: { M: 4, WS: 5, BS: 6, S: 4, T: 4, W: 3, I: 3, A: 5, Ld: 7 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    specialRules: ['Animosity', 'Fear Elves', 'May ride Giant Wolf (+4 pts) or a monster/chariot'],
  },
  {
    id: 'og-warboss-forest-goblin',
    name: 'Forest Goblin Warboss',
    nameEs: 'Señor de la Guerra Goblin Silvano',
    role: 'character',
    pointsPerModel: 50,
    // PDF p.79: M10 HA5 HP6 F4 R4 I3 A5 L7
    statLine: { M: 4, WS: 5, BS: 6, S: 4, T: 4, W: 3, I: 3, A: 5, Ld: 7 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    specialRules: ['Animosity', 'Fear Elves', 'May ride Giant Spider (+4 pts) or a monster/chariot'],
  },
  {
    id: 'og-warboss-night-goblin',
    name: 'Night Goblin Warboss',
    nameEs: 'Señor de la Guerra Goblin Nocturno',
    role: 'character',
    pointsPerModel: 50,
    // PDF p.79: M10 HA5 HP6 F4 R4 I3 A5 L7
    statLine: { M: 4, WS: 5, BS: 6, S: 4, T: 4, W: 3, I: 3, A: 5, Ld: 7 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    specialRules: ['Animosity', 'Fear Elves', 'Hatred of Dwarfs', 'May ride a monster or chariot only'],
  },

  // ----- 0-1 Portaestandarte de Batalla (BSB) — champion -----
  {
    id: 'og-bsb-black-orc',
    name: 'Black Orc Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla Orco Negro',
    role: 'character',
    pointsPerModel: 92,
    // PDF p.79: M10 HA5 HP4 F5 R4 I1 A3 L8
    statLine: { M: 4, WS: 5, BS: 4, S: 5, T: 4, W: 1, I: 1, A: 3, Ld: 8 },
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    max: 1,
    specialRules: ['Army Battle Standard', 'Immune to Animosity', 'One magic item (may be a magic standard)'],
  },
  {
    id: 'og-bsb-orc',
    name: 'Orc Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla Orco',
    role: 'character',
    pointsPerModel: 83,
    // PDF p.79: M10 HA4 HP4 F4 R4 I1 A3 L7
    statLine: { M: 4, WS: 4, BS: 4, S: 4, T: 4, W: 1, I: 1, A: 3, Ld: 7 },
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    max: 1,
    specialRules: ['Army Battle Standard', 'Animosity', 'One magic item (may be a magic standard)'],
  },
  {
    id: 'og-bsb-savage-orc',
    name: 'Savage Orc Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla Orco Salvaje',
    role: 'character',
    pointsPerModel: 95,
    // PDF p.79: M10 HA4 HP4 F4 R4 I1 A3 L7
    statLine: { M: 4, WS: 4, BS: 4, S: 4, T: 4, W: 1, I: 1, A: 3, Ld: 7 },
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    max: 1,
    specialRules: ['Army Battle Standard', 'Animosity', 'Frenzy (Savage Orcs)', 'One magic item (may be a magic standard)'],
  },
  {
    id: 'og-bsb-goblin',
    name: 'Goblin Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla Goblin',
    role: 'character',
    pointsPerModel: 65,
    // PDF p.79: M10 HA3 HP4 F4 R3 I1 A3 L5
    statLine: { M: 4, WS: 3, BS: 4, S: 4, T: 3, W: 1, I: 1, A: 3, Ld: 5 },
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    max: 1,
    specialRules: ['Army Battle Standard', 'Animosity', 'Fear Elves', 'One magic item (may be a magic standard)'],
  },
  {
    id: 'og-bsb-forest-goblin',
    name: 'Forest Goblin Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla Goblin Silvano',
    role: 'character',
    pointsPerModel: 65,
    // PDF p.79: M10 HA3 HP4 F4 R3 I1 A3 L5
    statLine: { M: 4, WS: 3, BS: 4, S: 4, T: 3, W: 1, I: 1, A: 3, Ld: 5 },
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    max: 1,
    specialRules: ['Army Battle Standard', 'Animosity', 'Fear Elves', 'One magic item (may be a magic standard)'],
  },
  {
    id: 'og-bsb-night-goblin',
    name: 'Night Goblin Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla Goblin Nocturno',
    role: 'character',
    pointsPerModel: 65,
    // PDF p.79: M10 HA3 HP4 F4 R3 I1 A3 L5
    statLine: { M: 4, WS: 3, BS: 4, S: 4, T: 3, W: 1, I: 1, A: 3, Ld: 5 },
    isCharacter: true,
    characterRank: 'champion',
    canBeBSB: true,
    max: 1,
    specialRules: ['Army Battle Standard', 'Animosity', 'Fear Elves', 'Hatred of Dwarfs', 'One magic item (may be a magic standard)'],
  },

  // ----- Grandes Jefes (Big Bosses) — hero -----
  {
    id: 'og-bigboss-black-orc',
    name: 'Black Orc Big Boss',
    nameEs: 'Gran Jefe Orco Negro',
    role: 'character',
    pointsPerModel: 91,
    // PDF p.80: M10 HA6 HP5 F5 R5 I2 A4 L9
    statLine: { M: 4, WS: 6, BS: 5, S: 5, T: 5, W: 2, I: 2, A: 4, Ld: 9 },
    isCharacter: true,
    characterRank: 'hero',
    specialRules: ['Immune to Animosity', 'May ride War Boar (+8 pts) or a monster/chariot'],
  },
  {
    id: 'og-bigboss-orc',
    name: 'Orc Big Boss',
    nameEs: 'Gran Jefe Orco',
    role: 'character',
    pointsPerModel: 72,
    // PDF p.80: M10 HA5 HP5 F4 R5 I2 A4 L8
    statLine: { M: 4, WS: 5, BS: 5, S: 4, T: 5, W: 2, I: 2, A: 4, Ld: 8 },
    isCharacter: true,
    characterRank: 'hero',
    specialRules: ['Animosity', 'May ride War Boar (+8 pts) or a monster/chariot'],
  },
  {
    id: 'og-bigboss-savage-orc',
    name: 'Savage Orc Big Boss',
    nameEs: 'Gran Jefe Orco Salvaje',
    role: 'character',
    pointsPerModel: 98,
    // PDF p.80: M10 HA5 HP5 F4 R5 I2 A4 L8
    statLine: { M: 4, WS: 5, BS: 5, S: 4, T: 5, W: 2, I: 2, A: 4, Ld: 8 },
    isCharacter: true,
    characterRank: 'hero',
    specialRules: ['Animosity', 'Frenzy (Savage Orcs)', '6+ ward save (war paint)', 'May ride War Boar (+8 pts) or a monster/chariot'],
  },
  {
    id: 'og-bigboss-goblin',
    name: 'Goblin Big Boss',
    nameEs: 'Gran Jefe Goblin',
    role: 'character',
    pointsPerModel: 33,
    // PDF p.80: M10 HA4 HP5 F4 R4 I2 A4 L6
    statLine: { M: 4, WS: 4, BS: 5, S: 4, T: 4, W: 2, I: 2, A: 4, Ld: 6 },
    isCharacter: true,
    characterRank: 'hero',
    specialRules: ['Animosity', 'Fear Elves', 'May ride Giant Wolf (+4 pts) or a monster/chariot'],
  },
  {
    id: 'og-bigboss-forest-goblin',
    name: 'Forest Goblin Big Boss',
    nameEs: 'Gran Jefe Goblin Silvano',
    role: 'character',
    pointsPerModel: 33,
    // PDF p.80: M10 HA4 HP5 F4 R4 I2 A4 L6
    statLine: { M: 4, WS: 4, BS: 5, S: 4, T: 4, W: 2, I: 2, A: 4, Ld: 6 },
    isCharacter: true,
    characterRank: 'hero',
    specialRules: ['Animosity', 'Fear Elves', 'May ride Giant Spider (+4 pts) or a monster/chariot'],
  },
  {
    id: 'og-bigboss-night-goblin',
    name: 'Night Goblin Big Boss',
    nameEs: 'Gran Jefe Goblin Nocturno',
    role: 'character',
    pointsPerModel: 33,
    // PDF p.80: M10 HA4 HP5 F4 R4 I2 A4 L6
    statLine: { M: 4, WS: 4, BS: 5, S: 4, T: 4, W: 2, I: 2, A: 4, Ld: 6 },
    isCharacter: true,
    characterRank: 'hero',
    specialRules: ['Animosity', 'Fear Elves', 'Hatred of Dwarfs', 'May ride a monster or chariot only'],
  },

  // ----- Jefes (Bosses / regiment champions) — champion -----
  {
    id: 'og-boss-black-orc',
    name: 'Black Orc Boss',
    nameEs: 'Jefe Orco Negro',
    role: 'character',
    pointsPerModel: 42,
    // PDF p.80: M10 HA5 HP4 F5 R4 I1 A3 L8
    statLine: { M: 4, WS: 5, BS: 4, S: 5, T: 4, W: 1, I: 1, A: 3, Ld: 8 },
    isCharacter: true,
    characterRank: 'champion',
    specialRules: ['Leads a Black Orc regiment', 'Immune to Animosity'],
  },
  {
    id: 'og-boss-orc',
    name: 'Orc Boss',
    nameEs: 'Jefe Orco',
    role: 'character',
    pointsPerModel: 33,
    // PDF p.80: M10 HA4 HP3 F3 R4 I1 A2 L7
    statLine: { M: 4, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 1, A: 2, Ld: 7 },
    isCharacter: true,
    characterRank: 'champion',
    specialRules: ['Leads an Orc regiment', 'Animosity'],
  },
  {
    id: 'og-boss-savage-orc',
    name: 'Savage Orc Boss',
    nameEs: 'Jefe Orco Salvaje',
    role: 'character',
    pointsPerModel: 45,
    // PDF p.80: M10 HA4 HP3 F3 R4 I1 A2 L7
    statLine: { M: 4, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 1, A: 2, Ld: 7 },
    isCharacter: true,
    characterRank: 'champion',
    specialRules: ['Leads a Savage Orc regiment', 'Animosity', 'Frenzy (Savage Orcs)'],
  },
  {
    id: 'og-boss-goblin',
    name: 'Goblin Boss',
    nameEs: 'Jefe Goblin',
    role: 'character',
    pointsPerModel: 15,
    // PDF p.80: M10 HA3 HP2 F3 R3 I1 A2 L5
    statLine: { M: 4, WS: 3, BS: 2, S: 3, T: 3, W: 1, I: 1, A: 2, Ld: 5 },
    isCharacter: true,
    characterRank: 'champion',
    specialRules: ['Leads a Goblin regiment', 'Animosity', 'Fear Elves'],
  },
  {
    id: 'og-boss-forest-goblin',
    name: 'Forest Goblin Boss',
    nameEs: 'Jefe Goblin Silvano',
    role: 'character',
    pointsPerModel: 15,
    // PDF p.80: M10 HA3 HP2 F3 R3 I1 A2 L5
    statLine: { M: 4, WS: 3, BS: 2, S: 3, T: 3, W: 1, I: 1, A: 2, Ld: 5 },
    isCharacter: true,
    characterRank: 'champion',
    specialRules: ['Leads a Forest Goblin regiment', 'Animosity', 'Fear Elves'],
  },
  {
    id: 'og-boss-night-goblin',
    name: 'Night Goblin Boss',
    nameEs: 'Jefe Goblin Nocturno',
    role: 'character',
    pointsPerModel: 15,
    // PDF p.80: M10 HA3 HP2 F3 R3 I1 A2 L5
    statLine: { M: 4, WS: 3, BS: 2, S: 3, T: 3, W: 1, I: 1, A: 2, Ld: 5 },
    isCharacter: true,
    characterRank: 'champion',
    specialRules: ['Leads a Night Goblin regiment', 'Animosity', 'Fear Elves', 'Hatred of Dwarfs'],
  },

  // ----- Shamanes (Wizards) — wizard1 -----
  {
    id: 'og-shaman-orc',
    name: 'Orc Shaman',
    nameEs: 'Shaman Orco',
    role: 'character',
    pointsPerModel: 57,
    // PDF p.81: M10 HA3 HP3 F3 R5 I1 A3 L7 (actually 3 attacks from bestiary p.58 Shaman row)
    // Army list p.81 Orc Shaman: M10 HA3 HP3 F3 R5 I1 A3 L7 — but bestiary shows I=3 not I=1
    // Using bestiary p.58 Shaman row: M10 HA3 HP3 F3 R5 I1 A3 L7 (confirmed in list p.81)
    statLine: { M: 4, WS: 3, BS: 3, S: 3, T: 5, W: 1, I: 3, A: 1, Ld: 7 },
    isCharacter: true,
    characterRank: 'wizard1',
    options: ORC_SHAMAN_LEVELS,
    specialRules: ['Wizard (Waaagh! Magic)', 'Animosity', 'May ride War Boar (+8 pts), Giant Wolf or a monster/chariot'],
  },
  {
    id: 'og-shaman-savage-orc',
    name: 'Savage Orc Shaman',
    nameEs: 'Shaman Orco Salvaje',
    role: 'character',
    pointsPerModel: 59,
    // PDF p.81 Savage Orc Shaman row: M10 HA3 HP3 F4 R5 I2 A3 L7 (W=2 from bestiary p.59 Shaman row)
    statLine: { M: 4, WS: 3, BS: 3, S: 4, T: 5, W: 2, I: 3, A: 1, Ld: 7 },
    isCharacter: true,
    characterRank: 'wizard1',
    options: SAVAGE_ORC_SHAMAN_LEVELS,
    specialRules: ['Wizard (Waaagh! Magic)', 'Animosity', 'Frenzy (Savage Orcs)', '6+ ward save (war paint)', 'May ride War Boar (+8 pts) or a monster/chariot'],
  },
  {
    id: 'og-shaman-goblin',
    name: 'Goblin Shaman',
    nameEs: 'Shaman Goblin',
    role: 'character',
    pointsPerModel: 28,
    // PDF p.81 Goblin Shaman row: M10 HA2 HP3 F3 R4 I1 A3 L5 (from Goblins bestiary p.63)
    statLine: { M: 4, WS: 2, BS: 3, S: 3, T: 4, W: 1, I: 3, A: 1, Ld: 5 },
    isCharacter: true,
    characterRank: 'wizard1',
    options: GOBLIN_SHAMAN_LEVELS,
    specialRules: ['Wizard (Waaagh! Magic)', 'Animosity', 'Fear Elves', 'May ride Giant Wolf (+4 pts) or a monster/chariot'],
  },
  {
    id: 'og-shaman-forest-goblin',
    name: 'Forest Goblin Shaman',
    nameEs: 'Shaman Goblin Silvano',
    role: 'character',
    pointsPerModel: 28,
    // PDF p.81: same Goblin Shaman profile
    statLine: { M: 4, WS: 2, BS: 3, S: 3, T: 4, W: 1, I: 3, A: 1, Ld: 5 },
    isCharacter: true,
    characterRank: 'wizard1',
    options: GOBLIN_SHAMAN_LEVELS,
    specialRules: ['Wizard (Waaagh! Magic)', 'Animosity', 'Fear Elves', 'May ride Giant Spider (+4 pts) or a monster/chariot'],
  },
  {
    id: 'og-shaman-night-goblin',
    name: 'Night Goblin Shaman',
    nameEs: 'Shaman Goblin Nocturno',
    role: 'character',
    pointsPerModel: 28,
    // PDF p.81: same Goblin Shaman profile (Night Goblin Shaman row)
    statLine: { M: 4, WS: 2, BS: 3, S: 3, T: 4, W: 1, I: 3, A: 1, Ld: 5 },
    isCharacter: true,
    characterRank: 'wizard1',
    options: GOBLIN_SHAMAN_LEVELS,
    specialRules: ['Wizard (Waaagh! Magic)', 'Animosity', 'Fear Elves', 'Hatred of Dwarfs', 'Eats magic mushrooms (extra power dice)', 'May ride a monster or chariot only'],
  },

  // ----- Personajes Especiales (0-1 each) -----
  {
    id: 'og-azhag',
    name: 'Azhag the Slaughterer',
    nameEs: 'Azhag el Carnicero',
    role: 'character',
    pointsPerModel: 130,
    // PDF p.90: M10 HA6 HP6 F4 R5 I3 A5 L10
    statLine: { M: 4, WS: 6, BS: 6, S: 4, T: 5, W: 3, I: 3, A: 5, Ld: 10 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character (Orc Warboss)',
      'Light armour & shield',
      'Crown of Sorcery (+125 pts, mandatory): Wizard Level — Animosity aura within 12"',
      'Rides Winged Serpent (+180 pts)',
      'Up to 3 magic items',
    ],
  },
  {
    id: 'og-oglok',
    name: "Oglok the 'Orrible",
    nameEs: 'Oglok el Horrible',
    role: 'character',
    pointsPerModel: 90,
    // PDF p.90: M10 HA6 HP5 F4 R5 I2 A4 L9
    statLine: { M: 4, WS: 6, BS: 5, S: 4, T: 5, W: 2, I: 2, A: 4, Ld: 9 },
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character (Orc Big Boss)',
      'Light armour & shield',
      'May ride War Boar (+8 pts), a monster or a chariot',
      'Up to 2 magic items',
    ],
  },
  {
    id: 'og-grom',
    name: 'Grom the Paunch of Misty Mountain',
    nameEs: 'Grom el Panzudo de la Montaña de la Niebla',
    role: 'character',
    pointsPerModel: 80,
    // PDF p.91: M10 HA5 HP6 F4 R4 I3 A5 L7
    statLine: { M: 4, WS: 5, BS: 6, S: 4, T: 4, W: 3, I: 3, A: 5, Ld: 7 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character (Goblin Warboss)',
      'Light armour & Hacha de Grom (great axe, +50 pts, mandatory)',
      'Regeneration (as a Troll)',
      'Niblit, standard-bearer (+65 pts, mandatory companion)',
      'Rides Wolf Chariot (+62 pts)',
      'Up to 3 magic items',
    ],
  },
  {
    id: 'og-gorbad',
    name: 'Gorbad Ironclaw',
    nameEs: 'Gorbad Garra de Hierro',
    role: 'character',
    pointsPerModel: 120,
    // PDF p.91: M10 HA6 HP6 F4 R5 I3 A5 L10 (on boar: use Boar M)
    statLine: { M: 4, WS: 6, BS: 6, S: 4, T: 5, W: 3, I: 3, A: 5, Ld: 10 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character (Orc Warboss)',
      'Light armour & Morgor la Mutiladora (great axe, +125 pts, mandatory)',
      'Rides War Boar',
      'Up to 3 magic items',
    ],
  },
  {
    id: 'og-gorfang',
    name: 'Gorfang Rotgut',
    nameEs: 'Gorfang Rotgut',
    role: 'character',
    pointsPerModel: 90,
    // PDF p.92: M10 HA5 HP5 F5 R5 I3 A4 L8
    statLine: { M: 4, WS: 5, BS: 5, S: 5, T: 5, W: 3, I: 3, A: 4, Ld: 8 },
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character (Orc Big Boss)',
      'Light armour, shield & magic sword',
      'Hatred of Dwarfs',
      'May ride War Boar (+8 pts), a monster or a chariot',
      'Up to 2 magic items',
    ],
  },
  {
    id: 'og-morglum',
    name: 'Morglum Necksnapper',
    nameEs: 'Morglum Quiebracuellos',
    role: 'character',
    pointsPerModel: 150,
    // PDF p.92: M10 HA7 HP6 F5 R5 I3 A5 L10
    statLine: { M: 4, WS: 7, BS: 6, S: 5, T: 5, W: 3, I: 3, A: 5, Ld: 10 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character (Black Orc Warboss)',
      'Light armour & an axe in each hand',
      'Immune to psychology',
      'May ride War Boar (+8 pts), a monster or a chariot',
      'Up to 3 magic items',
    ],
  },
  {
    id: 'og-skarsnik',
    name: 'Skarsnik, Warlord of the Eight Peaks',
    nameEs: 'Skarsnik, Señor de la Guerra de los Ocho Picos',
    role: 'character',
    pointsPerModel: 80,
    // PDF p.93: M10 HA5 HP6 F4 R4 I3 A6 L9
    statLine: { M: 4, WS: 5, BS: 6, S: 4, T: 4, W: 3, I: 3, A: 6, Ld: 9 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character (Night Goblin Warboss)',
      'Light armour',
      "Skarsnik's Prodder (+75 pts, mandatory magic item)",
      'Accompanied by Gobbla, giant cave squig (+50 pts)',
      'May ride a chariot',
      'Up to 3 magic items',
    ],
  },

  // ===== PEÑAS — Regiments (25%+) =====

  // --- Cavalry / Mounted ---
  {
    id: 'og-savage-boar-boyz',
    name: 'Savage Orc Boar Boyz',
    nameEs: 'Orcos Salvajes Jinetes de Jabalí',
    role: 'regiment',
    pointsPerModel: 25,
    // PDF p.82: rider M10 HA3 HP3 F3 R4 H1 I2 A1 L7; Boar M18 HA4 HP0 F3 R4 H1 I3 A1 L3
    // Regiment cavalry: use mount M (18cm = 7")
    statLine: { M: 7, WS: 3, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 7 },
    minSize: 5,
    options: [SPEARS_1, BOW_2],
    specialRules: ['Animosity', 'Frenzy (Savage Orcs)', 'War Boar mount (save 3+)', '6+ ward save (war paint)'],
  },
  {
    id: 'og-orc-boar-boyz',
    name: 'Orc Boar Boyz',
    nameEs: 'Orcos Jinetes de Jabalí',
    role: 'regiment',
    pointsPerModel: 27,
    // PDF p.82: rider M10 HA4 HP3 F3 R4 H1 I2 A1 L7; Boar M18 — cavalry M=7"
    statLine: { M: 7, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 7 },
    minSize: 5,
    options: [SPEARS_1],
    specialRules: ['Animosity', 'War Boar mount (save 3+)', 'Light armour & shield'],
  },
  {
    id: 'og-goblin-wolf-riders',
    name: 'Goblin Wolf Riders',
    nameEs: 'Goblins Jinetes de Lobo',
    role: 'regiment',
    pointsPerModel: 9,
    // PDF p.82: rider M10 HA2 HP3 F3 R3 H1 I2 A1 L5; Wolf M22 — cavalry M=9"
    statLine: { M: 9, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
    minSize: 5,
    options: [SPEARS_1, SHORTBOW_1, LIGHT_ARMOUR_2, SHIELD_1],
    specialRules: ['Animosity', 'Fear Elves', 'Giant Wolf mount (save 6+)', 'Fast cavalry'],
  },
  {
    id: 'og-forest-goblin-spider-riders',
    name: 'Forest Goblin Spider Riders',
    nameEs: 'Goblins Silvanos Jinetes de Araña',
    role: 'regiment',
    pointsPerModel: 9,
    // PDF p.83: rider M10 HA2 HP3 F3 R3 H1 I2 A1 L5; Spider M18 — cavalry M=7"
    statLine: { M: 7, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
    minSize: 5,
    options: [SHIELD_1, SPEARS_1, SHORTBOW_1],
    specialRules: ['Animosity', 'Fear Elves', 'Giant Spider mount (save 6+)', 'Move through woods/terrain freely'],
  },

  // --- Infantry ---
  {
    id: 'og-big-uns',
    name: "Orc Big 'Uns",
    nameEs: 'Orcos Grandotes',
    role: 'regiment',
    pointsPerModel: 6.5,
    // PDF p.83: M10 HA4 HP3 F4 R4 H1 I3 A1 L7
    statLine: { M: 4, WS: 4, BS: 3, S: 4, T: 4, W: 1, I: 3, A: 1, Ld: 7 },
    minSize: 5,
    max: 1,
    options: [SHIELD_1, LIGHT_ARMOUR_2, TWO_HAND_2, ADD_HAND_WEAPON_1, BOW_2],
    specialRules: ['0-1 unit', 'Animosity', 'Hand weapon'],
  },
  {
    id: 'og-orc-boyz',
    name: 'Orc Warriors',
    nameEs: 'Guerreros Orcos',
    role: 'regiment',
    pointsPerModel: 5.5,
    // PDF p.83: M10 HA3 HP3 F3 R4 H1 I2 A1 L7
    statLine: { M: 4, WS: 3, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 7 },
    minSize: 5,
    options: [LIGHT_ARMOUR_2, SHIELD_1, TWO_HAND_2, HALBERD_2, SPEARS_1, ADD_HAND_WEAPON_1],
    specialRules: ['Animosity', 'Hand weapon'],
  },
  {
    id: 'og-arrer-boyz',
    name: 'Orc Archers',
    nameEs: 'Arqueros Orcos',
    role: 'regiment',
    pointsPerModel: 7.5,
    // PDF p.83: M10 HA3 HP3 F3 R4 H1 I2 A1 L7
    statLine: { M: 4, WS: 3, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 7 },
    minSize: 5,
    options: [LIGHT_ARMOUR_2, SHIELD_1, CROSSBOW_1],
    specialRules: ['Animosity', 'Hand weapon & bow'],
  },
  {
    id: 'og-black-orcs',
    name: 'Black Orcs',
    nameEs: 'Orcos Negros',
    role: 'regiment',
    pointsPerModel: 9,
    // PDF p.84: M10 HA4 HP3 F4 R4 H1 I2 A1 L8
    statLine: { M: 4, WS: 4, BS: 3, S: 4, T: 4, W: 1, I: 2, A: 1, Ld: 8 },
    minSize: 5,
    max: 1,
    options: [TWO_HAND_2, HALBERD_2, SPEARS_1, ADD_HAND_WEAPON_1, SHIELD_1],
    specialRules: ['0-1 unit', 'Immune to Animosity', 'Light armour & hand weapon'],
  },
  {
    id: 'og-savage-orcs',
    name: 'Savage Orcs',
    nameEs: 'Orcos Salvajes',
    role: 'regiment',
    pointsPerModel: 7.5,
    // PDF p.84: M10 HA3 HP3 F3 R4 H1 I2 A1 L7
    statLine: { M: 4, WS: 3, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 7 },
    minSize: 5,
    options: [SHIELD_1, TWO_HAND_2, ADD_HAND_WEAPON_1, BOW_2],
    specialRules: ['Animosity', 'Frenzy (Savage Orcs)', '6+ ward save (war paint)', 'Primitive weapon (no armour)'],
  },
  {
    id: 'og-goblins',
    name: 'Goblins',
    nameEs: 'Goblins',
    role: 'regiment',
    pointsPerModel: 2.5,
    // PDF p.84: M10 HA2 HP3 F3 R3 H1 I2 A1 L5
    statLine: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
    minSize: 5,
    options: [SHIELD_HALF, LIGHT_ARMOUR_2, TWO_HAND_1, HALBERD_1, SPEARS_HALF, SHORTBOW_HALF],
    specialRules: ['Animosity', 'Fear Elves', 'Hand weapon'],
  },
  {
    id: 'og-forest-goblins',
    name: 'Forest Goblins',
    nameEs: 'Goblins Silvanos',
    role: 'regiment',
    pointsPerModel: 2.5,
    // PDF p.84: M10 HA2 HP3 F3 R3 H1 I2 A1 L5
    statLine: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
    minSize: 5,
    options: [SHIELD_HALF, TWO_HAND_1, SPEARS_HALF, SHORTBOW_HALF],
    specialRules: ['Animosity', 'Fear Elves', 'Hand weapon (war axe or club)'],
  },
  {
    id: 'og-night-goblins',
    name: 'Night Goblins',
    nameEs: 'Goblins Nocturnos',
    role: 'regiment',
    pointsPerModel: 2.5,
    // PDF p.85: M10 HA2 HP3 F3 R3 H1 I2 A1 L5
    statLine: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
    minSize: 5,
    options: [SHIELD_HALF, TWO_HAND_1, HALBERD_1, SPEARS_HALF, SHORTBOW_HALF],
    specialRules: ['Animosity', 'Fear Elves', 'Hatred of Dwarfs', 'Hand weapon', 'May hide up to 3 Fanatics in unit'],
  },
  {
    id: 'og-squig-hunters',
    name: 'Night Goblin Squig Hunters',
    nameEs: 'Cazadores de Garrapatos Goblins Nocturnos',
    role: 'regiment',
    pointsPerModel: 8,
    // PDF p.85: 8 pts per pair of Hunters / 20 pts per Cave Squig
    // Goblin Nocturno: M10 HA2 HP3 F3 R3 H1 I2 A1 L5; Squig: M5D6 HA4 HP0 F5 R3 H1 I5 A2 L2
    statLine: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
    minSize: 5,
    max: 1,
    noCommand: true,
    specialRules: [
      '0-1 unit; requires at least one Night Goblin unit',
      '8 pts per pair of Night Goblin Hunters / 20 pts per Cave Squig',
      'Cave Squig: M5D6 WS4 BS0 S5 T3 W1 I5 A2 Ld2',
      'Fear Elves',
      'Hatred of Dwarfs',
      'Squig prods',
    ],
  },
  {
    id: 'og-night-goblin-nets-clubs',
    name: 'Night Goblins with Nets & Clubs',
    nameEs: 'Goblins Nocturnos con Redes y Garrotes',
    role: 'regiment',
    pointsPerModel: 3.5,
    // PDF p.85: M10 HA2 HP3 F3 R3 H1 I2 A1 L5
    statLine: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
    minSize: 5,
    max: 1,
    specialRules: [
      '0-1 unit; requires at least one Night Goblin unit',
      'Equipped with Nets (initiative bonus, immobilise) and/or Clubs (+1 S)',
      'Fear Elves',
      'Hatred of Dwarfs',
    ],
  },
  {
    id: 'og-night-goblin-fanatics',
    name: 'Night Goblin Fanatics',
    nameEs: 'Goblins Nocturnos Fanáticos',
    role: 'regiment',
    pointsPerModel: 30,
    // PDF p.85: M5D6 Especial F5 R3 H1 I1D6 A- L-
    statLine: { M: 4, WS: 0, BS: 0, S: 5, T: 3, W: 1, I: 1, A: 1, Ld: 5 },
    minSize: 1,
    noCommand: true,
    specialRules: [
      'Up to 3 hidden in each Night Goblin unit',
      'Move 5D6" (random each turn); S5 ball & chain; D6 wounds per model hit',
      'Released automatically when enemy comes within 8"',
      'Cannot be in Squig Hunter or Nets & Clubs units',
    ],
  },
  {
    id: 'og-squig-hoppers',
    name: 'Night Goblin Squig Hoppers',
    nameEs: 'Jinetes de Garrapatos Saltarines Goblins Nocturnos',
    role: 'regiment',
    pointsPerModel: 25,
    // PDF p.86: Goblin Nocturno M10 HA2 HP3 F3 R3 H1 I2 A1 L5; Squig Saltarín M5D6 HA4 HP0 F5 R3 H1 I5 A2 L2
    statLine: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
    minSize: 1,
    noCommand: true,
    specialRules: [
      'Up to 5 per Night Goblin unit in the army',
      'Individual models — no command; move randomly like Fanatics',
      'Cave Squig: M5D6 WS4 BS0 S5 T3 W1 I5 A2 Ld2',
      'Fear Elves',
      'Hatred of Dwarfs',
    ],
  },

  // ===== MÁQUINAS DE GUERRA — War machines (0-25%) =====
  {
    id: 'og-rock-lobber-small',
    name: 'Rock Lobber (Small)',
    nameEs: 'Lanzador de Rocas Pequeño',
    role: 'warmachine',
    pointsPerModel: 66.5,
    // PDF p.87: Lanzador de Rocas (machine stats: S7, 3 Orc crew); crew M10 HA3 HP3 F3 R4 H1 I2 A1 L7
    statLine: { M: 4, WS: 3, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 7 },
    specialRules: ['War machine; requires an Orc unit', 'Stone thrower 120cm, S7, D3 wounds per hit', '3 Orc crew', 'Crew may take light armour (+2 pts/model)'],
  },
  {
    id: 'og-rock-lobber-large',
    name: 'Rock Lobber (Large)',
    nameEs: 'Lanzador de Rocas Grande',
    role: 'warmachine',
    pointsPerModel: 96.5,
    statLine: { M: 4, WS: 3, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 7 },
    specialRules: ['War machine; requires an Orc unit', 'Stone thrower 150cm, S10, D6 wounds per hit', '3 Orc crew', 'Crew may take light armour (+2 pts/model)'],
  },
  {
    id: 'og-spear-chukka',
    name: 'Spear Chukka',
    nameEs: 'Lanzavirotes',
    role: 'warmachine',
    pointsPerModel: 46.5,
    // PDF p.87: machine S7; crew M10 HA3 HP3 F3 R4 H1 I2 A1 L7
    statLine: { M: 4, WS: 3, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 7 },
    specialRules: ['War machine; requires an Orc unit', 'Bolt thrower 120cm, S5-1 per rank, D4 wounds', '3 Orc crew', 'Crew may take light armour (+2 pts/model)'],
  },
  {
    id: 'og-snotling-pump-wagon',
    name: 'Snotling Pump Wagon',
    nameEs: 'Vagoneta de Ataque Snotling',
    role: 'warmachine',
    pointsPerModel: 40,
    // PDF p.87: Vagoneta M5D6 S7 R7 H3; Snotling crew M10 HA2 HP2 F1 R1 I3 A3 L4
    statLine: { M: 4, WS: 2, BS: 2, S: 1, T: 1, W: 3, I: 3, A: 3, Ld: 4 },
    specialRules: ['War machine; requires a Goblin unit', 'Moves 5D6"', 'D4 impact hits S7; no save', 'Crewed by Snotlings (immune to Animosity)'],
  },
  {
    id: 'og-doom-diver',
    name: 'Doom Diver Catapult',
    nameEs: 'Catapulta de Goblins Voladores',
    role: 'warmachine',
    pointsPerModel: 100,
    // PDF p.88: Catapulta stats: Direct hit S10 D6 wounds; other hits S5 1 wound save -2
    // Goblin Volador (crew): M10 HA2 HP3 F3 R3 H1 I2 A1 L5
    statLine: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
    specialRules: ['War machine; requires a (non-Night/Forest) Goblin unit', 'Direct hit S10 / D6 wounds; other hits S5 / 1 wound, save -2', 'Guided flight (Goblin Volador)'],
  },

  // --- Chariots (role: 'chariot', counts against 0-25% war machines) ---
  {
    id: 'og-orc-boar-chariot',
    name: 'Orc Boar Chariot',
    nameEs: 'Carruaje de Jabalíes Orco',
    role: 'chariot',
    pointsPerModel: 81,
    // PDF p.88: Orc crew M10 HA3 HP3 F3 R4 H1 I2 A1 L7; Boar M18; Chariot S7 R7 —
    statLine: { M: 4, WS: 3, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 7 },
    specialRules: [
      'Requires an Orc unit',
      'Chariot T7 W3; pulled by 2 War Boars; 2 Orc crew (swords & light armour)',
      'Extra crew member +7.5 pts; crew shields +1 pt; short bows +1 pt',
      'Scythed wheels +20 pts',
      'May carry a magic standard',
    ],
  },
  {
    id: 'og-goblin-wolf-chariot',
    name: 'Goblin Wolf Chariot',
    nameEs: 'Carruaje de Lobos Goblin',
    role: 'chariot',
    pointsPerModel: 65,
    // PDF p.88: Goblin crew M10 HA2 HP3 F3 R3 H1 I2 A1 L5; Wolf M22; Chariot S7 R7
    statLine: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 },
    specialRules: [
      'Requires a Goblin unit',
      'Chariot T7 W3; pulled by 2 Giant Wolves; 2 Goblin crew (swords & light armour)',
      'Extra crew member +3.5 pts; 3rd Giant Wolf +4 pts; crew shields +0.5 pt; short bows +0.5 pt',
      'Scythed wheels +20 pts',
      'May carry a magic standard',
    ],
  },

  // ===== MONSTRUOS — Monsters (0-25%) =====
  {
    id: 'og-giant',
    name: 'Giant',
    nameEs: 'Gigante',
    role: 'monster',
    pointsPerModel: 200,
    // PDF p.86: M15 HA3 HP3 F7 R6 H6 I3 A– L6 (special attacks)
    statLine: { M: 6, WS: 3, BS: 3, S: 7, T: 6, W: 6, I: 3, A: 1, Ld: 6 },
    specialRules: ['Large target', 'Causes terror', 'Special attacks (club, jump, etc.)', 'May form units of fewer than 5'],
  },
  {
    id: 'og-ogres',
    name: 'Ogres',
    nameEs: 'Ogros',
    role: 'monster',
    pointsPerModel: 40,
    // PDF p.86: M15 HA3 HP2 F4 R5 H3 I3 A2 L7
    statLine: { M: 6, WS: 3, BS: 2, S: 4, T: 5, W: 3, I: 3, A: 2, Ld: 7 },
    minSize: 1,
    options: [ADD_HAND_WEAPON_1, TWO_HAND_2, HALBERD_2, LIGHT_ARMOUR_2],
    specialRules: ['Causes fear', 'Hand weapon'],
  },
  {
    id: 'og-trolls',
    name: 'Trolls',
    nameEs: 'Trolls',
    role: 'monster',
    pointsPerModel: 65,
    // PDF p.86: M15 HA3 HP1 F5 R4 H3 I1 A3 L4
    statLine: { M: 6, WS: 3, BS: 1, S: 5, T: 4, W: 3, I: 1, A: 3, Ld: 4 },
    minSize: 1,
    specialRules: ['Causes fear', 'Stupidity', 'Regeneration', 'Vomit attack', 'Common / River / Stone Troll variants'],
  },
  {
    id: 'og-snotlings',
    name: 'Snotlings',
    nameEs: 'Snotlings',
    role: 'monster',
    pointsPerModel: 15,
    // PDF p.86: M10 HA2 HP2 F1 R1 H3 I3 A3 L4 (per base)
    statLine: { M: 4, WS: 2, BS: 2, S: 1, T: 1, W: 3, I: 3, A: 3, Ld: 4 },
    minSize: 1,
    specialRules: ['Cost is per Snotling base (9 models per base)', 'W3 per base; immune to Animosity'],
  },
  {
    id: 'og-giant-spiders',
    name: 'Giant Spiders',
    nameEs: 'Arañas Gigantescas',
    role: 'monster',
    pointsPerModel: 50,
    // PDF p.89: M12 HA3 HP0 F5 R4 H4 I1 A2 L— (Ld5 from army list context)
    // Bestiary p.73: M18 HA3 HP0 F4 R3 H1 I1 A1 L5 (that's the mount profile)
    // Army list p.89: Arañas Gigantescas M12 HA3 HP0 F5 R4 H4 I1 A2 L7
    statLine: { M: 5, WS: 3, BS: 0, S: 5, T: 4, W: 4, I: 1, A: 2, Ld: 7 },
    specialRules: ['Causes fear', 'Move through woods/terrain freely'],
  },
  {
    id: 'og-basilisk',
    name: 'Basilisk',
    nameEs: 'Basilisco',
    role: 'monster',
    pointsPerModel: 150,
    // PDF p.89: M10 HA3 HP0 F4 R4 H2 I4 A3 L6
    statLine: { M: 4, WS: 3, BS: 0, S: 4, T: 4, W: 2, I: 4, A: 3, Ld: 6 },
    specialRules: ['Petrifying gaze'],
  },
  {
    id: 'og-giant-scorpion',
    name: 'Giant Scorpion',
    nameEs: 'Escorpión Gigante',
    role: 'monster',
    pointsPerModel: 50,
    // PDF p.89: M12 HA3 HP0 F5 R4 H4 I1 A2 L7
    statLine: { M: 5, WS: 3, BS: 0, S: 5, T: 4, W: 4, I: 1, A: 2, Ld: 7 },
    specialRules: ['Poisoned attacks'],
  },
  {
    id: 'og-swarms',
    name: 'Swarms',
    nameEs: 'Enjambres',
    role: 'monster',
    pointsPerModel: 100,
    // PDF p.89: Ratas M15 HA3 HP0 F3 R2 H5 I1 A5 L10 (representative)
    statLine: { M: 6, WS: 3, BS: 0, S: 3, T: 2, W: 5, I: 1, A: 5, Ld: 10 },
    specialRules: ['Rats/Toads/Lizards/Bats/Snakes/Insects/Scorpions variants', 'Immune to psychology'],
  },
  {
    id: 'og-griffon',
    name: 'Griffon',
    nameEs: 'Grifo',
    role: 'monster',
    pointsPerModel: 150,
    // PDF p.89: M15 HA5 HP0 F6 R5 H5 I7 A4 L8
    statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 4, Ld: 8 },
    specialRules: ['Flying', 'Large target', 'Causes terror'],
  },
  {
    id: 'og-hydra',
    name: 'Hydra',
    nameEs: 'Hidra',
    role: 'monster',
    pointsPerModel: 225,
    // PDF p.89: M15 HA3 HP0 F5 R6 H7 I3 A5 L6
    statLine: { M: 6, WS: 3, BS: 0, S: 5, T: 6, W: 7, I: 3, A: 5, Ld: 6 },
    specialRules: ['Large target', 'Causes terror'],
  },
  {
    id: 'og-hippogriff',
    name: 'Hippogriff',
    nameEs: 'Hipogrifo',
    role: 'monster',
    pointsPerModel: 145,
    // PDF p.89: M20 HA5 HP0 F6 R5 H5 I6 A3 L8
    statLine: { M: 8, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 6, A: 3, Ld: 8 },
    specialRules: ['Flying', 'Large target'],
  },
  {
    id: 'og-manticore',
    name: 'Manticore',
    nameEs: 'Mantícora',
    role: 'monster',
    pointsPerModel: 200,
    // PDF p.89: M15 HA6 HP0 F7 R7 H5 I4 A4 L8
    statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 },
    specialRules: ['Flying', 'Large target', 'Causes terror'],
  },
  {
    id: 'og-chimera',
    name: 'Chimera',
    nameEs: 'Quimera',
    role: 'monster',
    pointsPerModel: 250,
    // PDF p.89: M15 HA4 HP0 F7 R6 H6 I4 A6 L8
    statLine: { M: 6, WS: 4, BS: 0, S: 7, T: 6, W: 6, I: 4, A: 6, Ld: 8 },
    specialRules: ['Flying', 'Large target', 'Causes terror'],
  },
  {
    id: 'og-winged-serpent',
    name: 'Winged Serpent',
    nameEs: 'Serpiente Alada',
    role: 'monster',
    pointsPerModel: 180,
    // PDF p.89: M15 HA5 HP0 F5 R6 H4 I4 A3 L5
    statLine: { M: 6, WS: 5, BS: 0, S: 5, T: 6, W: 4, I: 4, A: 3, Ld: 5 },
    specialRules: ['Flying', 'Large target'],
  },
  {
    id: 'og-dragon',
    name: 'Dragon',
    nameEs: 'Dragón',
    role: 'monster',
    pointsPerModel: 450,
    // PDF p.89: M15 HA6 HP0 F6 R6 H7 I8 A7 L7
    statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 },
    specialRules: ['Flying', 'Causes terror', 'Large target', 'Breath weapon'],
  },
  {
    id: 'og-great-dragon',
    name: 'Great Dragon',
    nameEs: 'Gran Dragón',
    role: 'monster',
    pointsPerModel: 600,
    // PDF p.89: M15 HA7 HP0 F7 R7 H8 I8 A8 L8
    statLine: { M: 6, WS: 7, BS: 0, S: 7, T: 7, W: 8, I: 8, A: 8, Ld: 8 },
    specialRules: ['Flying', 'Causes terror', 'Large target', 'Breath weapon'],
  },
  {
    id: 'og-emperor-dragon',
    name: 'Emperor Dragon',
    nameEs: 'Dragón Emperador',
    role: 'monster',
    pointsPerModel: 750,
    // PDF p.89: M15 HA8 HP0 F8 R8 H9 I6 A9 L9
    statLine: { M: 6, WS: 8, BS: 0, S: 8, T: 8, W: 9, I: 6, A: 9, Ld: 9 },
    specialRules: ['Flying', 'Causes terror', 'Large target', 'Breath weapon'],
  },
]

// --- Unit id sets used by war-machine / chariot selection requirements ---
const ORC_UNITS = [
  'og-orc-boyz', 'og-arrer-boyz', 'og-black-orcs', 'og-savage-orcs', 'og-big-uns',
  'og-orc-boar-boyz', 'og-savage-boar-boyz',
]
const GOBLIN_UNITS = [
  'og-goblins', 'og-forest-goblins', 'og-night-goblins', 'og-goblin-wolf-riders',
  'og-forest-goblin-spider-riders', 'og-night-goblin-nets-clubs',
]
const COMMON_GOBLIN_UNITS = ['og-goblins', 'og-goblin-wolf-riders']
const NIGHT_GOBLIN_UNITS = ['og-night-goblins']

export const ORCS_AND_GOBLINS: Army = {
  id: 'orcs-and-goblins',
  name: 'Orcs & Goblins',
  nameEs: 'Orcos y Goblins',
  composition: STANDARD_5E_COMPOSITION,
  units,
  magicItems: COMMON_MAGIC_ITEMS,
  selectionRules: {
    ratioCaps: [
      {
        unitId: 'og-squig-hoppers',
        countModels: true,
        perUnit: { ids: ['og-night-goblins', 'og-night-goblin-nets-clubs'], multiplier: 5 },
        labelEn: 'Night Goblin Squig Hoppers',
        labelEs: 'Jinetes de Garrapatos Saltarines Goblins Nocturnos',
      },
      {
        unitId: 'og-night-goblin-fanatics',
        countModels: true,
        perUnit: { ids: ['og-night-goblins'], multiplier: 3 },
        labelEn: 'Night Goblin Fanatics',
        labelEs: 'Goblins Nocturnos Fanáticos',
      },
    ],
    dependencies: [
      { unitId: 'og-rock-lobber-small', requiresAnyOf: ORC_UNITS, labelEn: 'Rock Lobber (Small)', labelEs: 'Lanzador de Rocas Pequeño' },
      { unitId: 'og-rock-lobber-large', requiresAnyOf: ORC_UNITS, labelEn: 'Rock Lobber (Large)', labelEs: 'Lanzador de Rocas Grande' },
      { unitId: 'og-spear-chukka', requiresAnyOf: ORC_UNITS, labelEn: 'Spear Chukka', labelEs: 'Lanzavirotes' },
      { unitId: 'og-orc-boar-chariot', requiresAnyOf: ORC_UNITS, labelEn: 'Orc Boar Chariot', labelEs: 'Carruaje de Jabalíes Orco' },
      { unitId: 'og-snotling-pump-wagon', requiresAnyOf: GOBLIN_UNITS, labelEn: 'Snotling Pump Wagon', labelEs: 'Vagoneta de Ataque Snotling' },
      { unitId: 'og-goblin-wolf-chariot', requiresAnyOf: GOBLIN_UNITS, labelEn: 'Goblin Wolf Chariot', labelEs: 'Carruaje de Lobos Goblin' },
      { unitId: 'og-doom-diver', requiresAnyOf: COMMON_GOBLIN_UNITS, labelEn: 'Doom Diver Catapult', labelEs: 'Catapulta de Goblins Voladores' },
      { unitId: 'og-squig-hunters', requiresAnyOf: NIGHT_GOBLIN_UNITS, labelEn: 'Night Goblin Squig Hunters', labelEs: 'Cazadores de Garrapatos Goblins Nocturnos' },
      { unitId: 'og-night-goblin-nets-clubs', requiresAnyOf: NIGHT_GOBLIN_UNITS, labelEn: 'Night Goblins with Nets & Clubs', labelEs: 'Goblins Nocturnos con Redes y Garrotes' },
    ],
  },
}
