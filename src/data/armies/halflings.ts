import type { Army, EquipmentOption, MountOption, ProfileBlock, UnitProfile } from '../types'
import { STANDARD_5E_COMPOSITION } from '../types'
import { COMMON_MAGIC_ITEMS } from '../magicItems'

// Halflings — "The Hungry Horde", a Halfling army for Warhammer by Wayne Oldfield
// (Citadel Journal issue 36, "Black Library approved"), plus Lumpin Croop's
// Fighting Cocks by Rick Priestley (Regiment of Renown, White Dwarf / Dogs of War).
//
// NOTE: this source is in English and gives Movement already in inches, so the M
// values here are exactly as printed. Stat columns are M/WS/BS/S/T/W/I/A/Ld.
//
// The scan is legible but a few point values are cut off at the page edge; those
// are marked "approx." in comments and use period-consistent values (e.g. the
// hired Wizard uses the Empire Battle Wizard cost, as the article says Halflings
// hire "passing mercenary wizards").
//
// Composition (article, Characters/Regiments/War Machines/Monsters intros):
// standard 5th-edition percentages — 50% characters / 25%+ regiments /
// 25% war machines / 25% monsters. Regiments must be at least five models.

// --- Shared per-model equipment options (article costs; several are 1/2 pt). ---
const SHIELD_HALF: EquipmentOption = { id: 'shield', name: 'Shields', pointsPerModel: 0.5 }
const SPEARS_HALF: EquipmentOption = { id: 'spears', name: 'Spears', pointsPerModel: 0.5 }
const LIGHT_ARMOUR_1: EquipmentOption = { id: 'light-armour', name: 'Light armour', pointsPerModel: 1 }
const BOWS_1: EquipmentOption = { id: 'bows', name: 'Bows', pointsPerModel: 1 }
const SHORT_BOWS_HALF: EquipmentOption = { id: 'short-bows', name: 'Short bows', pointsPerModel: 0.5 }
const SLINGS_1: EquipmentOption = { id: 'slings', name: 'Slings', pointsPerModel: 1 }
const QUILTED_JACKETS_1: EquipmentOption = {
  id: 'quilted-jackets', name: 'Quilted jackets (count as light armour)', pointsPerModel: 1,
}

// --- Character mounts (bestiary: War Sheep 1, Goats 3, Battle Rams 5; monsters
//     from the Monsters list may also be ridden). ---
const WAR_SHEEP_STATS = { M: 8, WS: 0, BS: 0, S: 0, T: 0, W: 0, I: 0, A: 0, Ld: 0 } as const
const BATTLE_RAM_STATS = { M: 7, WS: 4, BS: 0, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 3 } as const
const GOAT_STATS = { M: 8, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 3 } as const

const MOUNT_BATTLE_RAM: MountOption = {
  id: 'mount-battle-ram', name: 'Battle Ram', nameEs: 'Carnero de Batalla',
  points: 5, statLine: { ...BATTLE_RAM_STATS },
  specialRules: ['Woolly Coat — counts as barding and adds +1 to the rider\'s save'],
}
const MOUNT_WAR_SHEEP: MountOption = {
  id: 'mount-war-sheep', name: 'War Sheep', nameEs: 'Oveja de Guerra',
  points: 1, statLine: { ...WAR_SHEEP_STATS },
  specialRules: ['Skittish — rider suffers -1 Leadership on Break tests'],
}
const MOUNT_GOAT: MountOption = {
  id: 'mount-goat', name: 'Goat', nameEs: 'Cabra',
  points: 3, statLine: { ...GOAT_STATS },
  specialRules: ['Sure Hoofed — no movement penalties for difficult terrain'],
}
const MOUNT_GIANT_SWAN: MountOption = {
  id: 'mount-giant-swan', name: 'Giant Swan', nameEs: 'Cisne Gigante',
  points: 16, statLine: { M: 2, WS: 4, BS: 0, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 6 },
  specialRules: ['Flies', 'Rider may move and shoot in the same turn with no penalty'],
}
const MOUNT_PEGASUS: MountOption = {
  id: 'mount-pegasus', name: 'Pegasus', nameEs: 'Pegaso',
  points: 50, statLine: { M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 5 },
  specialRules: ['Flies'],
}
const MOUNT_EAGLE: MountOption = {
  id: 'mount-eagle', name: 'Eagle', nameEs: 'Águila',
  points: 75, statLine: { M: 2, WS: 7, BS: 0, S: 5, T: 4, W: 3, I: 5, A: 2, Ld: 8 },
  specialRules: ['Flies'],
}
const MOUNT_BABY_DRAGON: MountOption = {
  id: 'mount-baby-dragon', name: 'Baby Dragon', nameEs: 'Dragón Bebé',
  points: 200, statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 5, Ld: 6 },
  specialRules: ['Flies', 'Soft scales — unmodified 6+ save', 'No breath attack yet'],
}
const HERO_MOUNTS: MountOption[] = [
  MOUNT_BATTLE_RAM, MOUNT_WAR_SHEEP, MOUNT_GOAT, MOUNT_GIANT_SWAN,
  MOUNT_PEGASUS, MOUNT_EAGLE, MOUNT_BABY_DRAGON,
]

// --- Chuck Wagon crew/beast display profiles (Characters section). ---
const CHUCK_WAGON_PROFILES: ProfileBlock[] = [
  { name: 'Chef', nameEs: 'Chef', statLine: { M: 4, WS: 4, BS: 4, S: 4, T: 2, W: 1, I: 6, A: 2, Ld: 8 } },
  { name: 'Cook (x2)', nameEs: 'Cocinero (x2)', statLine: { M: 4, WS: 3, BS: 3, S: 3, T: 2, W: 1, I: 5, A: 1, Ld: 8 } },
  { name: 'Aurochs', nameEs: 'Uro', statLine: { M: 6, WS: 3, BS: 0, S: 5, T: 5, W: 3, I: 2, A: 3, Ld: 5 } },
]

// Hired Wizard levels (article: "restricted to 1st and 2nd level Wizards only";
// costs cut off in the scan — approx. from the Empire Battle Wizard, 56 → +62).
const HF_WIZARD_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Wizard Champion (Level 2)', pointsPerModel: 62, magicItemSlotsDelta: 1 },
]

const units: UnitProfile[] = [
  // ===== Characters (0-50%) =====
  {
    id: 'hf-general',
    name: 'Moot General',
    nameEs: 'General del Concejo',
    role: 'character',
    pointsPerModel: 90,
    statLine: { M: 4, WS: 5, BS: 7, S: 3, T: 3, W: 3, I: 7, A: 4, Ld: 10 },
    isCharacter: true,
    characterRank: 'lord',
    canBeGeneral: true,
    max: 1,
    mounts: HERO_MOUNTS,
    specialRules: [
      'Sword and picnic basket — any Halfling will follow the chap with the picnic basket',
      'May be armed with any combination of weapons/armour from the equipment list',
      'Up to 3 magic items: one may be the Ring of Concealment; one must be the magic sword Glammyding (its points are included in the General\'s cost)',
      'Woodsmen — no movement penalty in woods (all Halfling infantry)',
    ],
  },
  {
    id: 'hf-chuck-wagon',
    name: 'Chuck Wagon (Battle Standard)',
    nameEs: 'Carromato de Cocina (Estandarte de Batalla)',
    role: 'character',
    pointsPerModel: 80,
    statLine: { M: 6, WS: 3, BS: 0, S: 5, T: 5, W: 3, I: 2, A: 3, Ld: 5 },
    isCharacter: true,
    characterRank: 'champion',
    isBSB: true,
    max: 1,
    profiles: CHUCK_WAGON_PROFILES,
    specialRules: [
      "0-1 — the army's Battle Standard: carries the Halflings' rations for the day",
      'Pulled by a gigantic Aurochs; crewed by two Cooks and one Chef (light armour, hand weapons)',
      'If the Chuck Wagon is captured the entire army is subject to Hatred against the unit which captured it',
      'The Chef may carry a single magic item (may be a magic standard)',
    ],
  },
  {
    id: 'hf-hero',
    name: 'Halfling Hero',
    nameEs: 'Héroe Mediano',
    role: 'character',
    pointsPerModel: 39,
    statLine: { M: 4, WS: 4, BS: 6, S: 3, T: 3, W: 2, I: 6, A: 3, Ld: 9 },
    isCharacter: true,
    characterRank: 'hero',
    mounts: HERO_MOUNTS,
    specialRules: [
      'May be armed with any combination of weapons/armour from the equipment list',
      'May ride a Battle Ram, War Sheep, Goat or a monster',
      'Up to 2 magic items',
    ],
  },
  {
    id: 'hf-master-chef',
    name: 'Halfling Master Chef',
    nameEs: 'Maestro Cocinero Mediano',
    role: 'character',
    pointsPerModel: 40,
    statLine: { M: 4, WS: 5, BS: 5, S: 4, T: 3, W: 2, I: 7, A: 3, Ld: 10 },
    isCharacter: true,
    characterRank: 'hero',
    mounts: HERO_MOUNTS,
    specialRules: [
      'Hero — may lead a unit of Cooks (Pantry Guards)',
      'Up to 2 magic items',
    ],
  },
  {
    id: 'hf-housewife-lady',
    name: 'Housewife Lady',
    nameEs: 'Dama Ama de Casa',
    role: 'character',
    pointsPerModel: 44,
    statLine: { M: 4, WS: 5, BS: 4, S: 3, T: 4, W: 2, I: 8, A: 3, Ld: 8 },
    isCharacter: true,
    characterRank: 'hero',
    mounts: HERO_MOUNTS,
    specialRules: [
      'Hero — may lead the unit of Housewives',
      "Women's Wrath — subject to Frenzy if any male Halflings die within 8\"",
      'Up to 2 magic items',
    ],
  },
  {
    id: 'hf-champion',
    name: 'Halfling Champion',
    nameEs: 'Campeón Mediano',
    role: 'character',
    pointsPerModel: 18,
    statLine: { M: 4, WS: 3, BS: 5, S: 3, T: 2, W: 1, I: 5, A: 2, Ld: 8 },
    isCharacter: true,
    characterRank: 'champion',
    mounts: [MOUNT_BATTLE_RAM, MOUNT_GOAT, MOUNT_WAR_SHEEP],
    specialRules: [
      'Any regiment may include a single Champion, armed and equipped as the rest of the unit',
      'Up to 1 magic item',
    ],
  },
  {
    id: 'hf-chef-champion',
    name: 'Halfling Chef (Champion)',
    nameEs: 'Chef Mediano (Campeón)',
    role: 'character',
    pointsPerModel: 19,
    statLine: { M: 4, WS: 4, BS: 4, S: 4, T: 2, W: 1, I: 6, A: 2, Ld: 8 },
    isCharacter: true,
    characterRank: 'champion',
    specialRules: [
      'Cooks (Pantry Guards) may include a single Halfling Chef',
      'Up to 1 magic item',
    ],
  },
  {
    id: 'hf-housewife-matron',
    name: 'Housewife Matron (Champion)',
    nameEs: 'Matrona Ama de Casa (Campeona)',
    role: 'character',
    pointsPerModel: 20,
    statLine: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 7, A: 2, Ld: 8 },
    isCharacter: true,
    characterRank: 'champion',
    specialRules: [
      'Housewives may include a single Housewife Matron',
      "Women's Wrath — subject to Frenzy if any male Halflings die within 8\"",
      'Up to 1 magic item',
    ],
  },
  {
    id: 'hf-thief',
    name: 'Thief',
    nameEs: 'Ladrón',
    role: 'character',
    pointsPerModel: 15,
    statLine: { M: 5, WS: 3, BS: 4, S: 2, T: 2, W: 1, I: 10, A: 1, Ld: 8 },
    isCharacter: true,
    characterRank: 'champion',
    max: 3,
    specialRules: [
      '0-3 — hidden in Halfling infantry units (they prefer to be called Scouts)',
      "Teefin' — when his unit is in base contact with the enemy, roll a D6: on 4+ he steals a magic item from the enemy unit (6: an item of his choice; 1: caught and killed)",
      'Stolen items may be passed to any character in the unit',
      'Up to 1 magic item',
    ],
  },
  {
    id: 'hf-sheep-dog',
    name: 'Sheep Dog',
    nameEs: 'Perro Pastor',
    role: 'character',
    pointsPerModel: 5,
    statLine: { M: 7, WS: 2, BS: 0, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 3 },
    isCharacter: true,
    max: 1,
    specialRules: [
      '0-1 — considered a Familiar to a chosen character model, who becomes the dog\'s master',
      'Shepherding — a fleeing War Sheep or Battle Ram unit it contacts is automatically rallied',
      'Must remain within 12" of its master and may take Leadership tests on his Ld',
    ],
  },
  {
    id: 'hf-wizard',
    name: 'Hired Wizard',
    nameEs: 'Mago Contratado',
    role: 'character',
    pointsPerModel: 56, // approx. — cost cut off in the scan; Empire Battle Wizard value
    statLine: { M: 4, WS: 2, BS: 4, S: 2, T: 3, W: 1, I: 5, A: 1, Ld: 7 },
    isCharacter: true,
    characterRank: 'wizard1',
    lores: ['battle'],
    options: HF_WIZARD_LEVELS,
    mounts: [MOUNT_BATTLE_RAM],
    specialRules: [
      'Halflings hire "passing" mercenary wizards — restricted to 1st and 2nd level Wizards only',
      'May take a single Battle Magic spell per level; 1 magic item per magic level',
      'May ride a Battle Ram or a monster',
    ],
  },

  // --- Special characters (The Comradeship, 0-1 each) ---
  {
    id: 'hf-olorin',
    name: 'Olorin the Grey Wizard',
    nameEs: 'Olorin el Mago Gris',
    role: 'character',
    pointsPerModel: 290,
    statLine: { M: 4, WS: 3, BS: 3, S: 4, T: 4, W: 4, I: 6, A: 3, Ld: 8 },
    isCharacter: true,
    characterRank: 'wizard4',
    lores: ['battle', 'grey'],
    max: 1,
    specialRules: [
      'Special character — an itinerant wanderer much admired in the Moot (member of The Comradeship)',
      'Wizard Lord — may use four Battle magic or Grey magic spells',
      'Armed with a sword; up to 4 magic items',
    ],
  },
  {
    id: 'hf-aragand',
    name: 'Aragand the Layabout',
    nameEs: 'Aragand el Holgazán',
    role: 'character',
    pointsPerModel: 150,
    statLine: { M: 4, WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 9 },
    isCharacter: true,
    characterRank: 'lord',
    max: 1,
    specialRules: [
      'Special character — claims to be a king in waiting of a far off land (member of The Comradeship)',
      'Light armour and a double-handed sword',
      'Up to 3 magic items, one of which must always be a sword (still counts as double-handed)',
    ],
  },
  {
    id: 'hf-giblit',
    name: 'Giblit the Dwarf',
    nameEs: 'Giblit el Enano',
    role: 'character',
    pointsPerModel: 30, // as printed — a joke bargain balanced by Ld 5 and Stupidity without Legles
    statLine: { M: 3, WS: 6, BS: 5, S: 4, T: 5, W: 2, I: 4, A: 2, Ld: 5 },
    isCharacter: true,
    characterRank: 'hero',
    max: 1,
    specialRules: [
      'Special character — a failed Slayer sent out to befriend an Elf (member of The Comradeship)',
      'Unarmoured, armed with a massive axe; may never wear armour',
      'Technically a Dragon Slayer — up to 2 magic items and may use Dwarf Rune items',
      'Immune to Psychology while with Legles; subject to Stupidity if separated from him',
    ],
  },
  {
    id: 'hf-legles',
    name: 'Legles the Elf',
    nameEs: 'Legles el Elfo',
    role: 'character',
    pointsPerModel: 104,
    statLine: { M: 5, WS: 6, BS: 6, S: 4, T: 4, W: 2, I: 8, A: 3, Ld: 9 },
    isCharacter: true,
    characterRank: 'hero',
    max: 1,
    specialRules: [
      'Special character — steers the failed Slayer Giblit into trouble whenever possible (member of The Comradeship)',
      'Good Elven Longbow, sword and light armour',
      'Up to 2 magic items',
    ],
  },

  // ===== Regiments (25%+; minimum five models per unit) =====
  {
    id: 'hf-militia',
    name: 'Halfling Militia',
    nameEs: 'Milicia Mediana',
    role: 'regiment',
    pointsPerModel: 3.5,
    statLine: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
    minSize: 5,
    options: [SPEARS_HALF, SHORT_BOWS_HALF, SHIELD_HALF, SLINGS_1],
    specialRules: [
      'Hand weapon; no save',
      'Woodsmen — no movement penalty for moving through woods',
    ],
  },
  {
    id: 'hf-gatherers',
    name: 'Gatherers',
    nameEs: 'Recolectores',
    role: 'regiment',
    pointsPerModel: 3.5,
    statLine: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
    minSize: 5,
    options: [SPEARS_HALF, LIGHT_ARMOUR_1, SHIELD_HALF],
    specialRules: [
      'Itinerant farm labourers pressed into service; hand weapon, no save',
      "When riding 'piggy back', the second rank can also fight",
      'Woodsmen — no movement penalty for moving through woods',
    ],
  },
  {
    id: 'hf-poachers',
    name: 'Poachers',
    nameEs: 'Furtivos',
    role: 'regiment',
    pointsPerModel: 4.5,
    statLine: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
    minSize: 5,
    options: [SHIELD_HALF, LIGHT_ARMOUR_1],
    specialRules: [
      'Excellent archers — hand weapon and bow; any number of Poacher units',
      'May Skirmish',
      'Woodsmen — no movement penalty for moving through woods',
    ],
  },
  {
    id: 'hf-archers',
    name: 'Archers',
    nameEs: 'Arqueros',
    role: 'regiment',
    pointsPerModel: 4.5,
    statLine: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
    minSize: 5,
    // Bow is included in the per-model cost. The equipment/options line is cut
    // off at the page edge in the scan; light armour (+1) and shields (+1/2) are
    // the standard Halfling missile-infantry options (as Poachers), used here.
    options: [LIGHT_ARMOUR_1, SHIELD_HALF],
    specialRules: [
      'Excellent archers — hand weapon and bow; any number of Archer units may be included',
      'Woodsmen — no movement penalty for moving through woods',
    ],
  },
  {
    id: 'hf-lords-of-the-harvest',
    name: 'Lords of the Harvest',
    nameEs: 'Señores de la Cosecha',
    role: 'regiment',
    pointsPerModel: 4,
    statLine: { M: 4, WS: 3, BS: 4, S: 2, T: 2, W: 1, I: 6, A: 1, Ld: 8 },
    minSize: 5,
    max: 1,
    options: [LIGHT_ARMOUR_1, SHIELD_HALF],
    specialRules: [
      '0-1 — the leaders of gangs of farm labourers; armed with swords',
      "When riding 'piggy back', the second rank can also fight",
      'May carry a Magic Standard',
      'Woodsmen — no movement penalty for moving through woods',
    ],
  },
  {
    id: 'hf-pantry-guards',
    name: 'Pantry Guards',
    nameEs: 'Guardias de la Despensa',
    role: 'regiment',
    pointsPerModel: 5,
    statLine: { M: 4, WS: 3, BS: 3, S: 3, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
    minSize: 5,
    max: 1,
    options: [
      QUILTED_JACKETS_1,
      { id: 'cleavers', name: 'Cleavers (double-handed weapons)', pointsPerModel: 1 },
    ],
    specialRules: [
      '0-1 — Cooks with more than a reputation for their culinary skills; hand weapons, no save',
      'May serve as bodyguard for the Chuck Wagon (+1 combat resolution bonus)',
      'May carry a Magic Standard',
      'The unit may include up to three Crazed Cooks (separate entry)',
    ],
  },
  {
    id: 'hf-crazed-cooks',
    name: 'Crazed Cooks',
    nameEs: 'Cocineros Enloquecidos',
    role: 'regiment',
    pointsPerModel: 30,
    statLine: { M: 6, WS: 0, BS: 0, S: 5, T: 2, W: 1, I: 0, A: 6, Ld: 0 }, // M 2D6, Sp WS, A D6 — see rules
    minSize: 1,
    maxSize: 3,
    max: 1,
    noCommand: true,
    specialRules: [
      'Up to three Crazed Cooks hidden in the Pantry Guard unit',
      'Profile: M 2D6 / WS special / S 5 / T 2 / W 1 / A D6 — armed with a Cook Pot, no save',
      'Hide in their regiment; immune to psychology; jump out when an enemy moves within 8" and move 2D6" towards the nearest enemy unit, thereafter 2D6" in a random direction',
      'Do not fight hand to hand but can be shot at',
    ],
  },
  {
    id: 'hf-housewives',
    name: 'Housewives',
    nameEs: 'Amas de Casa',
    role: 'regiment',
    pointsPerModel: 5,
    statLine: { M: 4, WS: 3, BS: 2, S: 2, T: 3, W: 1, I: 5, A: 1, Ld: 8 },
    minSize: 5,
    max: 1,
    options: [
      { id: 'corsets', name: 'Corsets (count as light armour)', pointsPerModel: 1 },
      { id: 'extra-hand-weapon', name: 'Additional hand weapon (+1 Attack)', pointsPerModel: 2 },
      { id: 'double-handed', name: 'Double-handed weapons', pointsPerModel: 1 },
    ],
    specialRules: [
      '0-1 — only one unit of Housewives is allowed, as any more may provoke jealousy!',
      'Brooms, barrels, cudgels and rolling pins (all count as hand weapons); no save',
      "Women's Wrath — immediately subject to Frenzy if any male Halflings die within 8\"",
      "May take The Washing Line banner (see the army's magic items)",
    ],
  },
  {
    id: 'hf-war-sheep-riders',
    name: 'War Sheep Riders',
    nameEs: 'Jinetes de Ovejas de Guerra',
    role: 'regiment',
    pointsPerModel: 9,
    statLine: { M: 8, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
    minSize: 5,
    options: [BOWS_1, SHIELD_HALF],
    mount: { name: 'War Sheep', nameEs: 'Oveja de Guerra', statLine: { M: 8 }, specialRules: ['Skittish — riders take Break tests at -1 Ld'] },
    specialRules: [
      'Any number of units; hand weapon, spear and light armour; save 5+',
      'Skittish — the riders suffer -1 Leadership when taking Break Tests',
    ],
  },
  {
    id: 'hf-battle-ram-riders',
    name: 'Battle Ram Riders',
    nameEs: 'Jinetes de Carneros de Batalla',
    role: 'regiment',
    pointsPerModel: 15,
    statLine: { M: 4, WS: 3, BS: 4, S: 3, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
    minSize: 5,
    max: 1,
    options: [SHIELD_HALF],
    mount: { name: 'Battle Ram', nameEs: 'Carnero de Batalla', statLine: { ...BATTLE_RAM_STATS }, specialRules: ['Woolly Coat — as barding, +1 save'] },
    specialRules: [
      '0-1 — the Halfling heavy cavalry; hand weapons, spears and light armour; save 4+',
      'May carry a Magic Standard',
    ],
  },
  {
    id: 'hf-goat-riders',
    name: 'Goat Riders',
    nameEs: 'Jinetes de Cabras',
    role: 'regiment',
    pointsPerModel: 8,
    statLine: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
    minSize: 5,
    options: [SHIELD_HALF, BOWS_1, { id: 'spears', name: 'Spears', pointsPerModel: 1 }],
    mount: { name: 'Goat', nameEs: 'Cabra', statLine: { ...GOAT_STATS }, specialRules: ['Sure Hoofed'] },
    specialRules: [
      'Any number of units; light armour and sword; save 5+',
      'Sure Hoofed — no penalties for moving over difficult terrain; may Skirmish',
    ],
  },
  {
    id: 'hf-swan-riders',
    name: 'Swan Riders',
    nameEs: 'Jinetes de Cisnes',
    role: 'regiment',
    pointsPerModel: 20,
    statLine: { M: 4, WS: 2, BS: 5, S: 2, T: 2, W: 1, I: 6, A: 1, Ld: 8 },
    minSize: 5,
    max: 1,
    options: [SPEARS_HALF, SHIELD_HALF],
    mount: { name: 'Giant Swan', nameEs: 'Cisne Gigante', statLine: { M: 2, WS: 4, BS: 0, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 6 }, specialRules: ['Flies'] },
    specialRules: [
      '0-1 — bows and hand weapons, padded jackets (act as light armour); save 6+',
      "Fly in a 'V' formation — the best of the Moot's bowmen can shoot on the wing",
      'May move and shoot in the same turn with no penalty; -1 to hit other high flyers',
    ],
  },
  {
    id: 'hf-eagle-riders',
    name: 'Great Eagle Riders',
    nameEs: 'Jinetes de Grandes Águilas',
    role: 'regiment',
    pointsPerModel: 85,
    statLine: { M: 4, WS: 3, BS: 4, S: 3, T: 2, W: 1, I: 6, A: 1, Ld: 8 },
    minSize: 5,
    max: 1,
    options: [
      { id: 'quilted-jackets', name: 'Quilted jackets (count as light armour)', pointsPerModel: 1 },
      SPEARS_HALF,
      SHIELD_HALF,
    ],
    mount: { name: 'Great Eagle', nameEs: 'Gran Águila', statLine: { M: 2, WS: 7, BS: 0, S: 5, T: 4, W: 3, I: 5, A: 2, Ld: 8 }, specialRules: ['Flies'] },
    specialRules: [
      '0-1 — when the Halflings are in trouble, in flying come the Lords of the Air',
      'Two Halflings may ride and fight on each Eagle; hand weapons, no save',
    ],
  },
  {
    id: 'hf-lumpin-croop',
    name: "Lumpin Croop's Fighting Cocks",
    nameEs: 'Los Gallos de Pelea de Lumpin Croop',
    role: 'regiment',
    // 15/model = the book's 150 pts at the 10-model minimum. The book charges
    // only +9 per additional Halfling above ten — models above the minimum are
    // slightly overcosted here (per-model pricing cannot express a flat base).
    pointsPerModel: 15,
    statLine: { M: 4, WS: 3, BS: 5, S: 2, T: 2, W: 1, I: 6, A: 1, Ld: 8 },
    minSize: 10,
    max: 1,
    noCommand: true,
    specialRules: [
      'Regiment of Renown (0-1) — Lumpin Croop and nine Halflings including Ned Hamfist (standard bearer) and a horn blower = 150 pts minimum; additional Halflings +9 pts each',
      'Sword, bow, light armoured jackets and shields; save 5+',
      'Skirmish — expert trackers and woodsmen',
      'Avoid Traps — Wood Elf Waywatcher traps do not affect them',
      'Lumpin Croop (M4 WS3 BS5 S3 T3 W2 I6 A3 Ld9); Ned Hamfist (M4 WS3 BS5 S3 T2 W1 I6 A2 Ld8)',
      'Motto: Short, Fat and Dangerous to Know',
    ],
  },
  // ===== War Machines (0-25%) =====
  {
    id: 'hf-hot-pot',
    name: 'Soup Tank',
    nameEs: 'Tanque de Sopa',
    role: 'warmachine',
    pointsPerModel: 50,
    statLine: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 },
    noCommand: true,
    profiles: [{ name: 'Soup Tank', nameEs: 'Tanque de Sopa', statLine: { S: 7, T: 3 } }],
    specialRules: [
      'Stone-thrower-style catapult hurling boiling stew (full rules: Empire Army Book p.24)',
      'Maximum range 36"; centre model hit at Strength 5, others under the template at Strength 3 on a 4+; no armour saves',
      'Misfire chart: 1-2 destroyed, 3-4 cannot fire this or next turn, 5-6 may not fire this turn',
      'Crew have hand weapons and no save',
    ],
  },
  {
    id: 'hf-shearer',
    name: 'The Shearer (Small Farm Machine)',
    nameEs: 'La Esquiladora (Máquina Agrícola Pequeña)',
    role: 'warmachine',
    pointsPerModel: 70,
    statLine: { M: 8, WS: 0, BS: 0, S: 6, T: 6, W: 3, I: 0, A: 0, Ld: 0 },
    noCommand: true,
    options: [
      { id: 'crew-bows', name: 'Bows for the crew', pointsPerModel: 1, flat: true },
      { id: 'crew-shields', name: 'Shields for the crew', pointsPerModel: 0.5, flat: true },
    ],
    profiles: [{ name: 'Halfling crew (x2)', nameEs: 'Dotación Mediana (x2)', statLine: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 } }],
    specialRules: [
      'Farming machinery equally at home cutting off heads — pushed by war sheep, crew of two Halflings',
      'Moves and fights exactly as a chariot; 2D6 damage on the charge (whirling blades); attacks 2D6',
      'One Farm Machine in the army can carry a Magic Banner',
      'Crew carry hand weapons and wear light armour',
    ],
  },
  {
    id: 'hf-reaper',
    name: 'The Reaper (Large Farm Machine)',
    nameEs: 'La Segadora (Máquina Agrícola Grande)',
    role: 'warmachine',
    pointsPerModel: 90,
    statLine: { M: 7, WS: 0, BS: 0, S: 7, T: 7, W: 4, I: 0, A: 0, Ld: 0 },
    noCommand: true,
    options: [
      // Each option toggle buys ONE extra animal (book allows up to four in total).
      { id: 'extra-crew', name: 'Additional Halfling crewman', pointsPerModel: 3.5, flat: true },
      { id: 'extra-sheep', name: 'Extra War Sheep to push', pointsPerModel: 4, flat: true },
      { id: 'extra-ram', name: 'Extra Battle Ram to push', pointsPerModel: 5, flat: true }, // approx. — cost cut off in the scan; bestiary Battle Ram value
      { id: 'crew-bows', name: 'Bows for the crew', pointsPerModel: 1, flat: true },
      { id: 'crew-shields', name: 'Shields for the crew', pointsPerModel: 0.5, flat: true },
    ],
    profiles: [
      { name: 'Halfling crew', nameEs: 'Dotación Mediana', statLine: { M: 4, WS: 2, BS: 4, S: 2, T: 2, W: 1, I: 5, A: 1, Ld: 8 } },
      { name: 'Battle Ram (x2)', nameEs: 'Carnero de Batalla (x2)', statLine: { ...BATTLE_RAM_STATS } },
    ],
    specialRules: [
      'The heavier machine, pushed by two or more Battle Rams; crew carry hand weapons and wear light armour',
      'Moves and fights exactly as a chariot; 2D6 damage on the charge (whirling blades); attacks 2D6',
      'Extra animals may be added to push the machine, to a maximum of four',
      'One Farm Machine in the army can carry a Magic Banner',
    ],
  },

  // ===== Monsters (0-25%) =====
  {
    id: 'hf-treeman',
    name: 'Treeman',
    nameEs: 'Hombre Árbol',
    role: 'monster',
    pointsPerModel: 280,
    statLine: { M: 6, WS: 8, BS: 3, S: 6, T: 7, W: 6, I: 2, A: 4, Ld: 9 },
    noCommand: true,
    specialRules: [
      'One Treeman for every 1,000 points of the army',
      'Will allow two Halflings to ride upon his shoulders (branches?)',
      'Full Treeman rules as per the Battle book',
    ],
  },
  {
    id: 'hf-baby-dragon',
    name: 'Baby Dragon',
    nameEs: 'Dragón Bebé',
    role: 'monster',
    pointsPerModel: 200,
    statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 5, Ld: 6 },
    noCommand: true,
    specialRules: [
      "Baby Dragons are only 'ickle' — softer scales give an unmodified save of 6+",
      'Has yet to develop its breath weapon, so has no breath attack',
      'Flies',
    ],
  },
  {
    id: 'hf-pegasus',
    name: 'Pegasus',
    nameEs: 'Pegaso',
    role: 'monster',
    pointsPerModel: 50,
    statLine: { M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 5 },
    noCommand: true,
    specialRules: ['Flies'],
  },
  {
    id: 'hf-eagle',
    name: 'Eagle',
    nameEs: 'Águila',
    role: 'monster',
    pointsPerModel: 75,
    statLine: { M: 2, WS: 7, BS: 0, S: 5, T: 4, W: 3, I: 5, A: 2, Ld: 8 },
    noCommand: true,
    specialRules: ['Flies'],
  },
  {
    id: 'hf-giant-swan',
    name: 'Giant Swan',
    nameEs: 'Cisne Gigante',
    role: 'monster',
    pointsPerModel: 16,
    statLine: { M: 2, WS: 4, BS: 0, S: 3, T: 3, W: 1, I: 5, A: 1, Ld: 6 },
    noCommand: true,
    specialRules: ['Flies', 'Aggressive — kills with its powerful wings'],
  },
  {
    id: 'hf-poultry-swarm',
    name: 'Poultry Swarm',
    nameEs: 'Enjambre de Aves de Corral',
    role: 'monster',
    pointsPerModel: 50,
    statLine: { M: 5, WS: 3, BS: 0, S: 2, T: 2, W: 5, I: 1, A: 5, Ld: 10 },
    noCommand: true,
    specialRules: [
      'Chickens, geese, turkeys and ducks driven, enraged, into battle',
      'Fights as a swarm, as described in the Rule Book',
    ],
  },
]

export const HALFLINGS: Army = {
  id: 'halflings',
  name: 'Halflings',
  nameEs: 'Medianos',
  composition: { ...STANDARD_5E_COMPOSITION },
  units,
  magicItems: COMMON_MAGIC_ITEMS,
  selectionRules: {
    ratioCaps: [
      {
        unitId: 'hf-treeman',
        labelEn: 'One Treeman per 1,000 points of the army',
        labelEs: 'Un Hombre Árbol por cada 1.000 puntos del ejército',
        perPoints: 1000,
      },
    ],
    dependencies: [
      {
        unitId: 'hf-crazed-cooks',
        requiresAnyOf: ['hf-pantry-guards'],
        labelEn: 'Crazed Cooks hide in the Pantry Guard unit',
        labelEs: 'Los Cocineros Enloquecidos se ocultan en la unidad de Guardias de la Despensa',
      },
    ],
  },
}
