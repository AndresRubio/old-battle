import type { Army, EquipmentOption, StatLine, UnitProfile } from '../types'
import { STANDARD_5E_COMPOSITION } from '../types'
import { COMMON_MAGIC_ITEMS } from '../magicItems'

// High Elves — data transcribed from "Ejércitos Warhammer: Altos Elfos"
// (Games Workshop, 1997, by Andy Chambers, Jes Goodwin, Bill King, Tuomas
// Pirinen & Rick Priestley), the 5th-edition army book. Points, profiles,
// equipment costs and 0-1 limits are taken directly from the book's army list
// (pp. 69-94) and bestiary (pp. 62-68).
//
// NOTE: the book gives Movement in centimetres; values here are converted to
// the inches used elsewhere in the app (12cm→5", 15cm→6", 20cm→8", 22cm→9",
// 30cm→12", 5cm→2", 10cm→4").
// Stat columns in the book are M / HA(WS) / HP(BS) / F(S) / R(T) / H(W) / I / A / L(Ld).
// High Elf base statline (Guerrero Elfo, p.62): M12→5" WS4 BS4 S3 T3 W1 I6 A1 Ld8.

const elf = (over: Partial<StatLine> = {}): StatLine => ({
  M: 5, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 8, ...over,
})

// --- Army-specific equipment options (per-model costs, from the equipment list
//     p.71 and the per-unit option lines pp.75-78). ---

// Shields: +1pt/model for most units, +2pt for Silver Helms
const SHIELD_1: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 1 }
const SHIELD_2: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 2 }
// Heavy armour (Ithilmar): upgrade from light armour, +1pt or +2pt depending on unit
const HEAVY_ARMOUR_1: EquipmentOption = { id: 'heavy-armour', name: 'Heavy armour (Ithilmar)', pointsPerModel: 1 }
const HEAVY_ARMOUR_2: EquipmentOption = { id: 'heavy-armour', name: 'Heavy armour (Ithilmar)', pointsPerModel: 2 }
// Light armour: +2pt (for Shadow Warriors and Archers that don't start with it)
const LIGHT_ARMOUR_2: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 2 }
// Barded steeds: +4pt (for cavalry)
const BARDING_4: EquipmentOption = { id: 'barding', name: 'Barded Elven Steed', pointsPerModel: 4 }
// Bows: +4pt (for Reavers/Ellyrian)
const BOWS_4: EquipmentOption = { id: 'bows', name: 'Bows', pointsPerModel: 4 }
// Cavalry lance: +2pt (for Reavers)
const LANCE_2: EquipmentOption = { id: 'cav-lance', name: 'Cavalry lances', pointsPerModel: 2 }
// Long bow: +1pt upgrade from bow (for Archers, Shadow Warriors, Sea Guard)
const LONGBOW_1: EquipmentOption = { id: 'longbow', name: 'Longbows (upgrade from bows)', pointsPerModel: 1 }

// Tiranoc Chariot options (flat per-unit, but listed individually as per-model
// since a chariot is a single model)
const CHARIOT_SCYTHED: EquipmentOption = { id: 'scythed-wheels', name: 'Scythed wheels', pointsPerModel: 20, flat: true }
const CHARIOT_SHIELD: EquipmentOption = { id: 'chariot-shield', name: 'Shield (per crew)', pointsPerModel: 1 }
const CHARIOT_HEAVY_ARMOUR: EquipmentOption = { id: 'chariot-heavy-armour', name: 'Heavy armour (per crew)', pointsPerModel: 1 }
const CHARIOT_LANCE: EquipmentOption = { id: 'chariot-lance', name: 'Lance (per crew)', pointsPerModel: 1 }
const CHARIOT_LONGBOW: EquipmentOption = { id: 'chariot-longbow', name: 'Longbow (per crew)', pointsPerModel: 1 }
const CHARIOT_EXTRA_STEEDS: EquipmentOption = { id: 'extra-steeds', name: 'Extra 2 Elven Steeds', pointsPerModel: 6, flat: true }
const CHARIOT_BARDING: EquipmentOption = { id: 'chariot-barding', name: 'Barding (per steed)', pointsPerModel: 4 }

// Mage level upgrades — Mago 59pts → Paladín Mago 121pts → Mago Maestro 219pts
// → Gran Mago 328pts (p.74). Cumulative point deltas.
const HE_WIZARD_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Wizard Level 2 (Mage Champion / Paladín Mago)', pointsPerModel: 62, magicItemSlotsDelta: 1 },
  { id: 'wizard-l3', name: 'Wizard Level 3 (Master Mage / Mago Maestro)', pointsPerModel: 160, magicItemSlotsDelta: 2 },
  { id: 'wizard-l4', name: 'Wizard Level 4 (Great Mage / Gran Mago)', pointsPerModel: 269, magicItemSlotsDelta: 3 },
]

const units: UnitProfile[] = [
  // ===== Characters (0-50%) =====
  {
    id: 'he-general',
    name: 'High Elf General',
    nameEs: 'General Alto Elfo',
    role: 'character',
    pointsPerModel: 160,
    statLine: elf({ WS: 7, BS: 7, S: 4, T: 4, W: 3, I: 9, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    specialRules: [
      'Always strikes first',
      'May ride an Elven Steed (+3 pts), a monster, or a chariot',
      'Up to 3 magic items',
    ],
  },
  {
    id: 'he-battle-standard',
    name: 'Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla',
    role: 'character',
    pointsPerModel: 98,
    statLine: elf({ WS: 5, BS: 4, S: 4, T: 3, W: 1, I: 7, A: 2, Ld: 8 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeBSB: true,
    max: 1,
    specialRules: [
      'Army Battle Standard (0-1)',
      'Always strikes first',
      'May carry one magic standard (counts as magic item)',
      'May ride an Elven Steed (+3 pts), a monster, or a chariot',
    ],
  },
  {
    id: 'he-hero',
    name: 'High Elf Hero',
    nameEs: 'Héroe Alto Elfo',
    role: 'character',
    pointsPerModel: 104,
    statLine: elf({ WS: 6, BS: 4, S: 4, T: 4, W: 2, I: 8, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: true,
    specialRules: [
      'Always strikes first',
      'Up to 2 magic items',
      'May ride an Elven Steed (+3 pts), a monster, or a chariot',
    ],
  },
  {
    id: 'he-paladin',
    name: 'Paladin (Regiment Champion)',
    nameEs: 'Paladín (Campeón de Regimiento)',
    role: 'character',
    pointsPerModel: 48,
    statLine: elf({ WS: 5, BS: 4, S: 4, T: 3, W: 1, I: 7, A: 2, Ld: 8 }),
    isCharacter: true,
    characterRank: 'champion',
    specialRules: [
      'Always strikes first',
      'Equipped identically to the regiment; cavalry Paladins ride the same mount',
      'Up to 1 magic item',
    ],
  },
  {
    id: 'he-mage',
    name: 'Mage',
    nameEs: 'Mago',
    role: 'character',
    pointsPerModel: 59,
    statLine: elf({ T: 4, I: 7 }),
    isCharacter: true,
    characterRank: 'wizard1',
    canBeGeneral: false,
    options: HE_WIZARD_LEVELS,
    specialRules: [
      'Wizard (High Magic or Battle Magic)',
      'Sword only; may not wear armour or carry other weapons',
      'May ride an Elven Steed (+3 pts), a monster, or a chariot',
    ],
  },

  // ===== Special characters (0-1 each; fixed equipment & magic items) =====
  {
    id: 'he-alith-anar',
    name: 'Alith Anar, the Shadow King',
    nameEs: 'Alith Anar, el Rey Sombrío',
    role: 'character',
    pointsPerModel: 285,
    statLine: elf({ WS: 7, BS: 7, S: 4, T: 4, W: 3, I: 9, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character',
      'Requires at least one regiment of Shadow Warriors (Guerreros Sombríos)',
      'Hatred of Dark Elves and Chaos',
      'Fast cavalry (skirmish); special deployment after enemy deploys',
      'Fights on foot; light armour, shield, sword & Moonbow (Arco Lunar)',
      'Fixed magic items: Stone of Midnight (Piedra de Medianoche), Shadow Crown (Corona Sombría), Moonbow (Arco Lunar)',
    ],
  },
  {
    id: 'he-eltharion',
    name: 'Eltharion the Implacable, Warden of Tor Yvresse',
    nameEs: 'Eltharion el Implacable, Guardián de Tor Yvresse',
    role: 'character',
    pointsPerModel: 467,
    statLine: elf({ WS: 7, BS: 7, S: 4, T: 4, W: 3, I: 9, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character',
      'Hatred of Goblins',
      'Rides the Griffon Stormwing / Ala de Tormenta (M6" WS5 S6 T5 W5 I7 A4 Ld8)',
      'Heavy armour, cavalry lance, sword & longbow',
      'Fixed magic items: Fangsword of Eltharion (Espada Colmillo de Eltharion), Helm of Yvresse (Yelmo de Yvresse), Talisman of Hoeth (Talismán de Hoeth)',
    ],
  },
  {
    id: 'he-alarielle',
    name: 'Alarielle, the Everqueen of Avelorn',
    nameEs: 'Alarielle, la Reina Eterna de Avelorn',
    role: 'character',
    pointsPerModel: 475,
    statLine: elf({ WS: 10, BS: 10, S: 3, T: 4, W: 4, I: 10, A: 1, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character',
      'Great Mage (Wizard Level 4, High Magic or Battle Magic)',
      'Cannot be the army General',
      'Blessing of Isha (+1 to hit for a nearby unit)',
      'Scourge of Chaos (wounds nearby Chaos Daemons automatically on 4+)',
      'Touch of the Everqueen (disables enemy instead of wounding)',
      'No weapons or armour; fights on foot',
      'May include one unit of Handmaidens of the Everqueen (Doncellas de la Reina Eterna)',
      'Fixed magic items: Star of Avelorn (Estrella de Avelorn), Jewel Shield of Isha (Joya Escudo de Isha), Sceptre of Avelorn (Cetro de Avelorn)',
    ],
  },
  {
    id: 'he-maidens',
    name: 'Handmaidens of the Everqueen',
    nameEs: 'Doncellas de la Reina Eterna',
    role: 'regiment',
    pointsPerModel: 16,
    statLine: elf({ WS: 5, BS: 5, A: 1 }),
    minSize: 5,
    max: 1,
    specialRules: [
      '0-1; only if Alarielle is included',
      'Light armour, lance & longbow',
      'Always strikes first',
      'Immune to psychology while the Everqueen lives',
      'Citizen Levy — shoot and fight with an extra rank',
      'Must carry the Banner of Avelorn (Estandarte de Avelorn); musician may carry the Horn of Isha (Cuerno de Isha)',
    ],
  },
  {
    id: 'he-belannaer',
    name: 'Belannaer, Loremaster of Hoeth',
    nameEs: 'Belannaer, Señor del Saber de Hoeth',
    role: 'character',
    pointsPerModel: 555,
    statLine: elf({ WS: 6, BS: 4, S: 4, T: 4, W: 4, I: 9, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character',
      'Requires a regiment of Sword Masters of Hoeth (Maestros de la Espada de Hoeth)',
      'Great Mage (Wizard Level 4, High Magic or Battle Magic)',
      'Aura of Hoeth (confounds enemy charges — artillery dice, admirable sign = charge fails)',
      'Sword; fights on foot',
      'Fixed magic items: Cloak of Stars (Capa de Estrellas), Sword of Bel-Korhadris (Espada de Bel-Korhadris), Book of the Phoenix (Libro del Fénix), Staff of Cyeos (Báculo de Cyeos)',
    ],
  },
  {
    id: 'he-korhil',
    name: 'Korhil, Captain of the White Lions',
    nameEs: 'Korhil, Capitán Cazador de los Leones Blancos',
    role: 'character',
    pointsPerModel: 198,
    statLine: elf({ WS: 7, BS: 6, S: 5, T: 4, W: 2, I: 8, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'champion',
    max: 1,
    specialRules: [
      'Special character (Paladin of a White Lions regiment)',
      'Requires a regiment of White Lions (Leones Blancos)',
      'Always strikes first',
      'Woodsman (no movement penalty in woods)',
      'Bodyguard',
      'Fixed magic items: Chayal axe (Hacha Chayal), Pelt of Charandis (Piel de Charandis)',
    ],
  },
  {
    id: 'he-caradryan',
    name: 'Caradryan, Captain of the Phoenix Guard',
    nameEs: 'Caradryan, Capitán de la Guardia del Fénix',
    role: 'character',
    pointsPerModel: 73,
    statLine: elf({ WS: 5, BS: 5, S: 4, T: 3, W: 1, I: 7, A: 2, Ld: 9 }),
    isCharacter: true,
    characterRank: 'champion',
    max: 1,
    specialRules: [
      'Special character (Paladin of a Phoenix Guard regiment)',
      'Always strikes first',
      'Mark of Asuryan (slayer must pass Ld test or die)',
      'Heavy armour, sword & halberd; fights on foot',
      'No magic items',
    ],
  },
  {
    id: 'he-tyrion',
    name: 'Tyrion, High Elf Prince',
    nameEs: 'Tyrion, Príncipe Alto Elfo',
    role: 'character',
    pointsPerModel: 425,
    statLine: elf({ WS: 8, BS: 7, S: 4, T: 4, W: 3, I: 10, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character',
      'Always strikes first',
      'Rides Malhandir (M12" WS4 S4 T3 W1 I5 A2 Ld7) with Dragon Armour barding (2+ save)',
      'Immune to all fire attacks',
      'Fixed magic items: Sunfang / Colmillo Solar (runic sword), Dragon Armour of Aenarion (Armadura del Dragón de Aenarion), Heart of Avelorn (Corazón de Avelorn)',
    ],
  },
  {
    id: 'he-teclis',
    name: 'Teclis, High Elf Great Mage',
    nameEs: 'Teclis, Gran Mago Alto Elfo',
    role: 'character',
    pointsPerModel: 630,
    statLine: elf({ WS: 4, BS: 4, S: 4, T: 4, W: 4, I: 9, A: 3, Ld: 10 }),
    isCharacter: true,
    characterRank: 'wizard4',
    canBeGeneral: false,
    max: 1,
    specialRules: [
      'Special character (independent)',
      'Effective Wizard Level 5 via War Crown of Saphery (5 spells; chooses High Magic spells freely)',
      'Master of High Magic',
      'Sword of Teclis (all hits wound automatically); fights on foot',
      'Fixed magic items: Lunar Staff of Lileath (Báculo Lunar de Lileath), War Crown of Saphery (Corona de Guerra de Saphery), Sword of Teclis (Espada de Teclis), Scroll of Hoeth (Pergamino de Hoeth)',
    ],
  },
  {
    id: 'he-imrik',
    name: 'Imrik, Lord of Dragons',
    nameEs: 'Imrik, Señor de los Dragones',
    role: 'character',
    pointsPerModel: 275,
    statLine: elf({ WS: 8, BS: 7, S: 4, T: 4, W: 3, I: 10, A: 4, Ld: 10 }),
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    specialRules: [
      'Special character',
      'Always strikes first',
      'Must always ride a Dragon (+450), Great Dragon (+600) or Emperor Dragon (+750)',
      'Fixed magic items: Star Lance (Lanza Estelar), Armour of Caledor (Armadura de Caledor), Horn of the Dragon (Cuerno del Dragón)',
    ],
  },

  // ===== Regiments (25%+) =====
  {
    id: 'he-dragon-princes',
    name: 'Dragon Princes of Caledor',
    nameEs: 'Príncipes Dragoneros de Caledor',
    role: 'regiment',
    pointsPerModel: 43,
    statLine: elf({ WS: 5, I: 7 }),
    minSize: 5,
    max: 1,
    specialRules: [
      '0-1 regiment',
      'Always strikes first',
      'Heavy armour, shield & cavalry lance; barded Elven Steed (2+ save)',
      'Standard of Caledor — must always include a standard bearer (no extra cost; magic standard at half points)',
    ],
  },
  {
    id: 'he-silver-helms',
    name: 'Silver Helms',
    nameEs: 'Yelmos Plateados',
    role: 'regiment',
    pointsPerModel: 31,
    statLine: elf({ WS: 5, I: 7 }),
    minSize: 5,
    options: [SHIELD_2, HEAVY_ARMOUR_2, BARDING_4],
    specialRules: [
      'Always strikes first',
      'Light armour & cavalry lance; Elven Steed (5+ save base)',
    ],
  },
  {
    id: 'he-ellyrian-reavers',
    name: 'Ellyrian Reavers (Shadow Knights)',
    nameEs: 'Caballeros Segadores',
    role: 'regiment',
    pointsPerModel: 25,
    statLine: elf(),
    minSize: 5,
    options: [BOWS_4, LANCE_2],
    specialRules: [
      'Always strikes first',
      'Light armour & sword; Elven Steed (5+ save base)',
      'Fast cavalry — skirmish',
      'Special deployment (march after enemy deploys)',
      'Expert Riders — no -1 shooting penalty after moving',
      'Stand & Shoot then Flee',
    ],
  },
  {
    id: 'he-white-lions',
    name: 'White Lions of Chrace',
    nameEs: 'Leones Blancos de Cracia',
    role: 'regiment',
    pointsPerModel: 16,
    statLine: elf({ WS: 5, S: 4, I: 6 }),
    minSize: 5,
    max: 1,
    options: [SHIELD_1],
    specialRules: [
      '0-1 regiment',
      'Always strikes first',
      'Heavy armour + Lion Pelt (5+ save vs shooting, +1 in CC with shield → 4+)',
      'Two-handed Woodsman axe (great weapon); three special attack modes',
      'Woodsmen (no movement penalty in woods)',
      'Bodyguard when the General leads the regiment in person',
    ],
  },
  {
    id: 'he-phoenix-guard',
    name: 'Phoenix Guard',
    nameEs: 'Guardia del Fénix',
    role: 'regiment',
    pointsPerModel: 14,
    statLine: elf({ WS: 5, I: 7 }),
    minSize: 5,
    max: 1,
    options: [HEAVY_ARMOUR_1],
    specialRules: [
      '0-1 regiment',
      'Always strikes first',
      'Halberds & light armour (6+ save base; 5+ with heavy armour upgrade)',
      'Causes fear (silent guardians)',
    ],
  },
  {
    id: 'he-sword-masters',
    name: 'Sword Masters of Hoeth',
    nameEs: 'Maestros de la Espada de Hoeth',
    role: 'regiment',
    pointsPerModel: 16,
    statLine: elf({ WS: 5, I: 7 }),
    minSize: 5,
    max: 1,
    options: [SHIELD_1],
    specialRules: [
      '0-1 regiment',
      'Always strikes first',
      'Heavy armour & two-handed Great Sword of Hoeth; strikes in normal initiative order (ignores strike-last rule)',
      'Deflect Shots (-1 to hit vs shooting from front arc)',
      'Shield gives 4+ save vs shooting only',
    ],
  },
  {
    id: 'he-sea-guard',
    name: 'Lothern Sea Guard',
    nameEs: 'Guardia del Mar de Lothern',
    role: 'regiment',
    pointsPerModel: 14,
    statLine: elf(),
    minSize: 5,
    options: [HEAVY_ARMOUR_1, LONGBOW_1],
    specialRules: [
      'Always strikes first',
      'Light armour, shield, spear & bow (5+ save)',
      'Citizen Levy — fight with an extra rank of spears; shoot with two ranks of bows',
    ],
  },
  {
    id: 'he-spearmen',
    name: 'High Elf Spearmen (Lancers)',
    nameEs: 'Lanceros Elfos',
    role: 'regiment',
    pointsPerModel: 12,
    statLine: elf(),
    minSize: 5,
    options: [HEAVY_ARMOUR_1],
    specialRules: [
      'Always strikes first',
      'Light armour, shield & spear (5+ save)',
      'Citizen Levy — fight with an extra rank (two ranks moving, three when stationary)',
    ],
  },
  {
    id: 'he-shadow-warriors',
    name: 'Shadow Warriors',
    nameEs: 'Guerreros Sombríos',
    role: 'regiment',
    pointsPerModel: 12,
    statLine: elf(),
    minSize: 5,
    options: [LIGHT_ARMOUR_2, LONGBOW_1],
    specialRules: [
      'Always strikes first',
      'Bow, sword & shield (6+ save)',
      'Hatred of Dark Elves',
      'Fast cavalry (skirmish)',
      'Special deployment (after enemy deploys, anywhere outside enemy line of sight)',
      'Citizen Levy — shoot with two ranks of bows',
    ],
  },
  {
    id: 'he-archers',
    name: 'High Elf Archers',
    nameEs: 'Arqueros Altos Elfos',
    role: 'regiment',
    pointsPerModel: 10,
    statLine: elf(),
    minSize: 5,
    options: [LIGHT_ARMOUR_2, LONGBOW_1],
    specialRules: [
      'Always strikes first',
      'Bow & sword (no save)',
      'Citizen Levy — rear rank shoots over the front rank',
    ],
  },

  // ===== War machines (0-25%) =====
  {
    id: 'he-bolt-thrower',
    name: 'Repeater Bolt Thrower (Eagle Claw)',
    nameEs: 'Lanzavirotes de Repetición',
    role: 'warmachine',
    pointsPerModel: 100,
    statLine: elf({ A: 1 }),
    specialRules: [
      'Crew of 2 (hand weapon & light armour)',
      'Number limited to number of Archers/Lancers/Sea Guard regiments; minimum 2 allowed',
      'Single shot: 120cm/48", S5 (-1 per rank), 1D4 wounds; Volley: 4 bolts S4 (-1 per rank)',
    ],
  },
  {
    id: 'he-tiranoc-chariot',
    name: 'Tiranoc Chariot',
    nameEs: 'Auriga de Tiranoc',
    role: 'chariot',
    pointsPerModel: 84,
    statLine: elf({ WS: 5, BS: 4, S: 4, T: 3, W: 1, I: 7, A: 1, Ld: 8 }),
    specialRules: [
      'Chariot (T7 W3) drawn by 2 Elven Steeds (6+ save base)',
      'Crew: Auriga with light armour, sword & bow',
      'Always strikes first',
    ],
    options: [
      CHARIOT_SCYTHED, CHARIOT_SHIELD, CHARIOT_HEAVY_ARMOUR, CHARIOT_LANCE,
      CHARIOT_LONGBOW, CHARIOT_EXTRA_STEEDS, CHARIOT_BARDING,
    ],
  },

  // ===== Monsters (0-25%) =====
  {
    id: 'he-dragon',
    name: 'Dragon',
    nameEs: 'Dragón',
    role: 'monster',
    pointsPerModel: 450,
    statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 },
    specialRules: ['Flying', 'Causes terror', 'Large target', 'Dragon breath weapon'],
  },
  {
    id: 'he-great-dragon',
    name: 'Great Dragon',
    nameEs: 'Gran Dragón',
    role: 'monster',
    pointsPerModel: 600,
    statLine: { M: 6, WS: 7, BS: 0, S: 7, T: 7, W: 8, I: 7, A: 8, Ld: 8 },
    specialRules: ['Flying', 'Causes terror', 'Large target', 'Dragon breath weapon'],
  },
  {
    id: 'he-emperor-dragon',
    name: 'Emperor Dragon',
    nameEs: 'Dragón Emperador',
    role: 'monster',
    pointsPerModel: 750,
    statLine: { M: 6, WS: 8, BS: 0, S: 8, T: 8, W: 9, I: 6, A: 9, Ld: 9 },
    specialRules: ['Flying', 'Causes terror', 'Large target', 'Dragon breath weapon'],
  },
  {
    id: 'he-great-eagle',
    name: 'Great Eagle',
    nameEs: 'Águila Gigante',
    role: 'monster',
    pointsPerModel: 75,
    statLine: { M: 2, WS: 7, BS: 0, S: 5, T: 4, W: 3, I: 5, A: 2, Ld: 8 },
    specialRules: ['Flying'],
  },
  {
    id: 'he-basilisk',
    name: 'Basilisk',
    nameEs: 'Basilisco',
    role: 'monster',
    pointsPerModel: 150,
    statLine: { M: 4, WS: 3, BS: 0, S: 4, T: 4, W: 2, I: 4, A: 3, Ld: 6 },
    specialRules: ['Large target', 'Causes terror', 'Petrifying gaze'],
  },
  {
    id: 'he-griffon',
    name: 'Griffon',
    nameEs: 'Grifo',
    role: 'monster',
    pointsPerModel: 150,
    statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 4, Ld: 8 },
    specialRules: ['Flying', 'Large target', 'Causes terror'],
  },
  {
    id: 'he-hippogriff',
    name: 'Hippogriff',
    nameEs: 'Hipogrifo',
    role: 'monster',
    pointsPerModel: 145,
    statLine: { M: 8, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 6, A: 3, Ld: 8 },
    specialRules: ['Flying', 'Large target'],
  },
  {
    id: 'he-manticore',
    name: 'Manticore',
    nameEs: 'Mantícora',
    role: 'monster',
    pointsPerModel: 200,
    statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 },
    specialRules: ['Flying', 'Large target', 'Causes terror'],
  },
  {
    id: 'he-pegasus',
    name: 'Pegasus',
    nameEs: 'Pegaso',
    role: 'monster',
    pointsPerModel: 50,
    statLine: { M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 3 },
    specialRules: ['Flying', 'Character mount'],
  },
  {
    id: 'he-chimera',
    name: 'Chimera',
    nameEs: 'Quimera',
    role: 'monster',
    pointsPerModel: 250,
    statLine: { M: 6, WS: 4, BS: 0, S: 7, T: 6, W: 6, I: 4, A: 6, Ld: 8 },
    specialRules: ['Flying', 'Large target', 'Causes terror'],
  },
  {
    id: 'he-unicorn',
    name: 'Unicorn',
    nameEs: 'Unicornio',
    role: 'monster',
    pointsPerModel: 90,
    statLine: { M: 9, WS: 5, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 9 },
    specialRules: ['Character mount'],
  },
]

export const HIGH_ELVES: Army = {
  id: 'high-elves',
  name: 'High Elves',
  nameEs: 'Altos Elfos',
  composition: STANDARD_5E_COMPOSITION,
  units,
  magicItems: COMMON_MAGIC_ITEMS,
  selectionRules: {
    ratioCaps: [
      { unitId: 'he-bolt-thrower', perUnit: { ids: ['he-archers', 'he-spearmen', 'he-sea-guard'] }, floor: 2, labelEn: 'Repeater Bolt Throwers', labelEs: 'Lanzavirotes de Repetición' },
    ],
    dependencies: [
      { unitId: 'he-alith-anar', requiresAnyOf: ['he-shadow-warriors'], labelEn: 'Alith Anar, the Shadow King', labelEs: 'Alith Anar, el Rey Sombrío' },
      { unitId: 'he-belannaer', requiresAnyOf: ['he-sword-masters'], labelEn: 'Belannaer, Loremaster of Hoeth', labelEs: 'Belannaer, Señor del Saber de Hoeth' },
      { unitId: 'he-korhil', requiresAnyOf: ['he-white-lions'], labelEn: 'Korhil, Captain of the White Lions', labelEs: 'Korhil, Capitán Cazador de los Leones Blancos' },
    ],
  },
}
