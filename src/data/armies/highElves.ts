import type { Army, EquipmentOption, MountOption, ProfileBlock, StatLine, UnitProfile } from '../types'
import { STANDARD_5E_COMPOSITION } from '../types'
import { COMMON_MAGIC_ITEMS } from '../magicItems'

// High Elves — data transcribed from the official High Elves army list
// (1997, by Andy Chambers, Jes Goodwin, Bill King, Tuomas
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
// Barded steeds: +8pt/model (p.75: "Cualquier unidad puede equipar sus Corceles
// con bardas por un coste adicional de +8 puntos por miniatura").
const BARDING_8: EquipmentOption = { id: 'barding', name: 'Barded Elven Steed', pointsPerModel: 8 }
// Bows: +4pt (for Reavers/Ellyrian)
const BOWS_4: EquipmentOption = { id: 'bows', name: 'Bows', pointsPerModel: 4 }
// Cavalry lance: +2pt (for Reavers)
const LANCE_2: EquipmentOption = { id: 'cav-lance', name: 'Cavalry lances', pointsPerModel: 2 }
// Long bow: +1pt upgrade from bow (for Archers, Shadow Warriors, Sea Guard)
const LONGBOW_1: EquipmentOption = { id: 'longbow', name: 'Longbows (upgrade from bows)', pointsPerModel: 1 }

// Tiranoc Chariot options (p.79). EVERY one is `flat`: a chariot is a
// single-model entry to entryPoints (only role 'regiment' multiplies by size),
// so the book's per-Auriga and per-steed prices are stored already multiplied
// by the chariot's fixed crew of two Aurigas / team of two steeds. The book's
// own whole-chariot prices (scythed wheels, the extra pair of steeds) are flat
// at face value.
const CHARIOT_SCYTHED: EquipmentOption = { id: 'scythed-wheels', name: 'Scythed wheels', pointsPerModel: 20, flat: true }
const CHARIOT_SHIELD: EquipmentOption = {
  id: 'chariot-shield', name: 'Shields (both crew)', pointsPerModel: 2, flat: true,
  description: 'A shield for each Auriga: +1 pt per crewman x 2 crew (p.79).',
  descEs: 'Un escudo para cada Auriga: +1 pto por tripulante x 2 tripulantes (p.79).',
}
const CHARIOT_HEAVY_ARMOUR: EquipmentOption = {
  id: 'chariot-heavy-armour', name: 'Heavy armour (both crew)', pointsPerModel: 2, flat: true,
  description: 'Each Auriga swaps light armour for heavy armour: +1 pt per crewman x 2 crew (p.79).',
  descEs: 'Cada Auriga cambia su armadura ligera por una pesada: +1 pto por tripulante x 2 tripulantes (p.79).',
}
const CHARIOT_LANCE: EquipmentOption = {
  id: 'chariot-lance', name: 'Lances (both crew)', pointsPerModel: 2, flat: true,
  description: 'A lance for each Auriga: +1 pt per crewman x 2 crew (p.79).',
  descEs: 'Una lanza para cada Auriga: +1 pto por tripulante x 2 tripulantes (p.79).',
}
const CHARIOT_LONGBOW: EquipmentOption = {
  id: 'chariot-longbow', name: 'Longbows (both crew)', pointsPerModel: 2, flat: true,
  description: 'Each Auriga swaps his bow for a longbow: +1 pt per crewman x 2 crew (p.79).',
  descEs: 'Cada Auriga cambia su arco por un arco largo: +1 pto por tripulante x 2 tripulantes (p.79).',
}
const CHARIOT_EXTRA_STEEDS: EquipmentOption = {
  id: 'extra-steeds', name: 'Extra 2 Elven Steeds', pointsPerModel: 6, flat: true,
  description: 'Two more Elven Steeds, one either side of the first pair: +6 pts for the two (p.79).',
  descEs: 'Dos Corceles Élficos más, uno a cada lado de los dos primeros: +6 ptos los dos corceles (p.79).',
}
// "+4 puntos cada uno. Debe equiparse con barda a todos los Corceles, o a
// ninguno" (p.79) — all-or-none, so the only price a two-steed chariot can pay
// is 4 x 2 = 8. NOTE: a chariot that also buys CHARIOT_EXTRA_STEEDS has four
// steeds and the book would charge 4 x 4 = 16; an EquipmentOption has no way to
// make its cost depend on another selection, so that combination is charged 8.
const CHARIOT_BARDING: EquipmentOption = {
  id: 'chariot-barding', name: 'Barding (both Elven Steeds)', pointsPerModel: 8, flat: true,
  description: 'Barding for the chariot\'s steeds — all or none: +4 pts per steed x 2 steeds (p.79).',
  descEs: 'Barda para los corceles del carruaje — todos o ninguno: +4 ptos por corcel x 2 corceles (p.79).',
}

// Tiranoc Chariot display profiles. Shared by the standalone chariot entry
// (he-tiranoc-chariot) and by the character mount (TIRANOC_CHARIOT_MOUNT), so
// the same chariot can never be printed two different ways.
// OLD-33 — printed p.79 = PDF 81: "Carruaje  -  -  -  7  7  3  1  -  -".
const TIRANOC_CHASSIS_STATS = { S: 7, T: 7, W: 3, I: 1 } as const
const ELVEN_STEED_STATS: StatLine = { M: 9, WS: 3, BS: 0, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 5 }
const TIRANOC_CHARIOT_PROFILES: ProfileBlock[] = [
  { name: 'Chariot', nameEs: 'Carro', statLine: TIRANOC_CHASSIS_STATS },
  { name: '2 Elven Steeds', nameEs: '2 Corceles Élficos', statLine: ELVEN_STEED_STATS },
]

// Mage level upgrades — Mago 59pts → Paladín Mago 121pts → Mago Maestro 219pts
// → Gran Mago 328pts (p.74). Cumulative point deltas.
//
// OLD-37 — each level has its OWN profile in the p.74 table (M in cm; 12cm → 5"):
//   Mago          12 4 4 3 4 1 7 1 8   (the unit's base statLine)
//   Paladín Mago  12 4 4 4 4 2 7 1 8
//   Mago Maestro  12 4 4 4 4 3 8 2 8
//   Gran Mago     12 4 4 4 4 4 9 3 9
const HE_WIZARD_LEVELS: EquipmentOption[] = [
  { id: 'wizard-l2', name: 'Wizard Level 2 (Mage Champion / Paladín Mago)', pointsPerModel: 62, magicItemSlotsDelta: 1, statLine: elf({ S: 4, T: 4, W: 2, I: 7 }) },
  { id: 'wizard-l3', name: 'Wizard Level 3 (Master Mage / Mago Maestro)', pointsPerModel: 160, magicItemSlotsDelta: 2, statLine: elf({ S: 4, T: 4, W: 3, I: 8, A: 2 }) },
  { id: 'wizard-l4', name: 'Wizard Level 4 (Great Mage / Gran Mago)', pointsPerModel: 269, magicItemSlotsDelta: 3, statLine: elf({ S: 4, T: 4, W: 4, I: 9, A: 3, Ld: 9 }) },
]

// --- Character mounts (p.71: "may ride an Elven Steed, a monster or a chariot").
//     Monster mounts reuse the bestiary statlines defined in the units list below;
//     the generic Elven Steed uses the standard bestiary profile. Costs from the
//     army list / monster points. ---
const ELVEN_STEED_MOUNT: MountOption = {
  id: 'mount-elven-steed', name: 'Elven Steed', nameEs: 'Corcel Élfico',
  points: 3, statLine: ELVEN_STEED_STATS,
}
const GREAT_EAGLE_MOUNT: MountOption = {
  id: 'mount-great-eagle', name: 'Great Eagle', nameEs: 'Águila Gigante',
  points: 75, statLine: { M: 2, WS: 7, BS: 0, S: 5, T: 4, W: 3, I: 5, A: 2, Ld: 8 },
  specialRules: ['Flying'],
}
const GRIFFON_MOUNT: MountOption = {
  id: 'mount-griffon', name: 'Griffon', nameEs: 'Grifo',
  points: 150, statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 4, Ld: 8 },
  specialRules: ['Flying', 'Large target', 'Causes terror'],
}
const HIPPOGRIFF_MOUNT: MountOption = {
  id: 'mount-hippogriff', name: 'Hippogriff', nameEs: 'Hipogrifo',
  points: 145, statLine: { M: 8, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 6, A: 3, Ld: 8 },
  specialRules: ['Flying', 'Large target'],
}
const MANTICORE_MOUNT: MountOption = {
  id: 'mount-manticore', name: 'Manticore', nameEs: 'Mantícora',
  points: 200, statLine: { M: 6, WS: 6, BS: 0, S: 7, T: 7, W: 5, I: 4, A: 4, Ld: 8 },
  specialRules: ['Flying', 'Large target', 'Causes terror'],
}
const PEGASUS_MOUNT: MountOption = {
  id: 'mount-pegasus', name: 'Pegasus', nameEs: 'Pegaso',
  points: 50, statLine: { M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 3 },
  specialRules: ['Flying'],
}
const UNICORN_MOUNT: MountOption = {
  id: 'mount-unicorn', name: 'Unicorn', nameEs: 'Unicornio',
  points: 90, statLine: { M: 9, WS: 5, BS: 0, S: 4, T: 4, W: 3, I: 4, A: 2, Ld: 9 },
}
const DRAGON_MOUNT: MountOption = {
  id: 'mount-dragon', name: 'Dragon', nameEs: 'Dragón',
  points: 450, statLine: { M: 6, WS: 6, BS: 0, S: 6, T: 6, W: 7, I: 8, A: 7, Ld: 7 },
  specialRules: ['Flying', 'Causes terror', 'Large target', 'Dragon breath weapon'],
}
const GREAT_DRAGON_MOUNT: MountOption = {
  id: 'mount-great-dragon', name: 'Great Dragon', nameEs: 'Gran Dragón',
  points: 600, statLine: { M: 6, WS: 7, BS: 0, S: 7, T: 7, W: 8, I: 7, A: 8, Ld: 8 },
  specialRules: ['Flying', 'Causes terror', 'Large target', 'Dragon breath weapon'],
}
const EMPEROR_DRAGON_MOUNT: MountOption = {
  id: 'mount-emperor-dragon', name: 'Emperor Dragon', nameEs: 'Dragón Emperador',
  points: 750, statLine: { M: 6, WS: 8, BS: 0, S: 8, T: 8, W: 9, I: 6, A: 9, Ld: 9 },
  specialRules: ['Flying', 'Causes terror', 'Large target', 'Dragon breath weapon'],
}

// --- The Tiranoc Chariot as a character mount (OLD-34) ---------------------
// Printed p.79 = PDF 81, closing paragraph of AURIGAS DE TIRANOC: "Los
// personajes pueden montar en un Carruaje, en cuyo caso el personaje sustituye
// a uno de los tripulantes. El valor en puntos del carruaje no varía por ello:
// el personaje debe gastar, por ejemplo, +84 puntos para montar en el carruaje
// básico (ver la página 74)." — the same 84 points the standalone entry costs.
// The General, Battle Standard Bearer, Hero and Mage each carry that permission
// under their own entry (printed pp.73-74); the Paladin's is conditional on his
// regiment being one of Tiranoc chariots (see his rule line below).
//
// The points cap this counts against (printed p.69 and p.71): "Si un personaje
// monta en un Carruaje de Guerra su valor en puntos debe sumarse al del
// personaje, y por tanto se contabilizará contra la proporción de puntos que
// pueden invertirse en personajes" / "Este límite de puntos no incluye el coste
// de un carruaje montado por un personaje". A MountOption already does exactly
// that: its points land on the character's entry, and pointsByRole buckets an
// entry by its UNIT's role — so the ridden chariot leaves the 0-25% war-machine
// cap and enters the 0-50% character one. Pinned by armies.test.ts.
//
// DELIBERATELY OMITTED: the four crew-kit options the standalone entry carries
// (CHARIOT_SHIELD / CHARIOT_HEAVY_ARMOUR / CHARIOT_LANCE / CHARIOT_LONGBOW).
// Each is priced "+1 punto por Auriga" and stored already multiplied by the
// chariot's crew of two. A character REPLACES one Auriga, but the book states
// neither the resulting crew count nor a per-crew basis for those upgrades on a
// ridden chariot, so any number here would be invented rather than transcribed.
// Only the upgrades the book prices per CHARIOT are offered: scythed wheels
// (+20), the extra pair of steeds (+6) and barding (+8 for the two steeds).
// Same spirit as the CHARIOT_BARDING note above — record the limitation, don't
// paper over it. For the same reason the mount declares no `baseCrew`: it has
// no `perCrewman`/`addsCrewman` option that would need one, and the ridden
// chariot's crew count is precisely what the book does not say.
const TIRANOC_CHARIOT_MOUNT: MountOption = {
  id: 'mount-tiranoc-chariot', name: 'Tiranoc Chariot', nameEs: 'Auriga de Tiranoc',
  points: 84,
  profiles: TIRANOC_CHARIOT_PROFILES,
  options: [
    {
      ...CHARIOT_SCYTHED, id: 'mount-tiranoc-chariot-scythes',
      description: 'Blades on the chariot\'s wheels: +20 pts per chariot (p.79).',
      descEs: 'Cuchillas en las ruedas del carruaje: +20 ptos por carruaje (p.79).',
    },
    { ...CHARIOT_EXTRA_STEEDS, id: 'mount-tiranoc-chariot-extra-steeds' },
    { ...CHARIOT_BARDING, id: 'mount-tiranoc-chariot-barding' },
  ],
}

/**
 * Mount list for High Elf princes/heroes — "an Elven Steed, a monster or a
 * chariot" (p.71, and each character entry pp.73-74).
 */
const PRINCE_MOUNTS: MountOption[] = [
  ELVEN_STEED_MOUNT, GREAT_EAGLE_MOUNT, GRIFFON_MOUNT, HIPPOGRIFF_MOUNT, MANTICORE_MOUNT,
  PEGASUS_MOUNT, UNICORN_MOUNT, DRAGON_MOUNT, GREAT_DRAGON_MOUNT, EMPEROR_DRAGON_MOUNT,
  TIRANOC_CHARIOT_MOUNT,
]

/** Imrik must ride one of the three dragons (p.86). */
const IMRIK_MOUNTS: MountOption[] = [DRAGON_MOUNT, GREAT_DRAGON_MOUNT, EMPEROR_DRAGON_MOUNT]

// --- Fixed (non-selectable) mounts parsed from the special-character rule text.
//     Display-only: the cost is already baked into the model's points. ---
const STORMWING_PROFILE: ProfileBlock = {
  name: 'Stormwing (Griffon)', nameEs: 'Ala de Tormenta (Grifo)',
  statLine: { M: 6, WS: 5, BS: 0, S: 6, T: 5, W: 5, I: 7, A: 4, Ld: 8 },
  specialRules: ['Flying', 'Large target', 'Causes terror'],
}
const MALHANDIR_PROFILE: ProfileBlock = {
  name: 'Malhandir (Elven Steed)', nameEs: 'Malhandir (Corcel Élfico)',
  statLine: { M: 12, WS: 4, BS: 0, S: 4, T: 3, W: 1, I: 5, A: 2, Ld: 7 },
  specialRules: ['Dragon Armour barding (2+ save)'],
}

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
    mounts: PRINCE_MOUNTS,
    specialRules: [
      'Always strikes first',
      'May ride an Elven Steed (+3 pts), a monster, or a Tiranoc Chariot (+84 pts), replacing one of its Aurigas',
      'Up to 3 magic items',
    ],
  },
  {
    id: 'he-battle-standard',
    name: 'Battle Standard Bearer',
    nameEs: 'Portaestandarte de Batalla',
    role: 'character',
    pointsPerModel: 98,
    statLine: elf({ WS: 5, BS: 5, S: 4, T: 3, W: 1, I: 7, A: 2, Ld: 8 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeBSB: true,
    isBSB: true,
    max: 1,
    mounts: PRINCE_MOUNTS,
    specialRules: [
      'Army Battle Standard (0-1)',
      'Always strikes first',
      'May carry one magic standard (counts as magic item)',
      'May ride an Elven Steed (+3 pts), a monster, or a Tiranoc Chariot (+84 pts), replacing one of its Aurigas',
    ],
  },
  {
    id: 'he-hero',
    name: 'High Elf Hero',
    nameEs: 'Héroe Alto Elfo',
    role: 'character',
    pointsPerModel: 104,
    statLine: elf({ WS: 6, BS: 6, S: 4, T: 4, W: 2, I: 8, A: 3, Ld: 9 }),
    isCharacter: true,
    characterRank: 'hero',
    canBeGeneral: true,
    mounts: PRINCE_MOUNTS,
    specialRules: [
      'Always strikes first',
      'Up to 2 magic items',
      'May ride an Elven Steed (+3 pts), a monster, or a Tiranoc Chariot (+84 pts), replacing one of its Aurigas',
    ],
  },
  {
    id: 'he-paladin',
    name: 'Paladin (Regiment Champion)',
    nameEs: 'Paladín (Campeón de Regimiento)',
    role: 'character',
    pointsPerModel: 48,
    statLine: elf({ WS: 5, BS: 5, S: 4, T: 3, W: 1, I: 7, A: 2, Ld: 8 }),
    isCharacter: true,
    characterRank: 'champion',
    // Printed p.74 = PDF 76, Reglas Especiales: "Si forma parte de un regimiento
    // de Carruajes de Guerra de Tiranoc, el Paladín también monta en un carruaje
    // […] sustituirá a un tripulante y el coste del carruaje se sumará al suyo."
    // The chariot is his ONLY buyable mount (a cavalry Paladin's steed is the
    // regiment's, already paid for in the regiment's points). The app cannot
    // enforce "only as part of a chariot regiment" — offering the option and
    // stating the condition in the rule line beats silently dropping a legal
    // choice or silently blessing an illegal one.
    mounts: [TIRANOC_CHARIOT_MOUNT],
    specialRules: [
      'Always strikes first',
      'Equipped identically to the regiment; cavalry Paladins ride the same mount',
      'If part of a Tiranoc Chariot regiment, he rides a chariot (+84 pts), replacing one of its Aurigas',
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
    lores: ['high', 'battle'],
    canBeGeneral: false,
    options: HE_WIZARD_LEVELS,
    mounts: PRINCE_MOUNTS,
    specialRules: [
      'Wizard (High Magic or Battle Magic)',
      'Sword only; may not wear armour or carry other weapons',
      'May ride an Elven Steed (+3 pts), a monster, or a Tiranoc Chariot (+84 pts), replacing one of its Aurigas',
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
    profiles: [STORMWING_PROFILE],
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
    lores: ['high', 'battle'],
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
    lores: ['high', 'battle'],
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
    profiles: [MALHANDIR_PROFILE],
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
    lores: ['high'],
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
    mounts: IMRIK_MOUNTS,
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
    mount: { name: 'Barded Elven Steed', nameEs: 'Corcel Élfico con Barda', statLine: ELVEN_STEED_MOUNT.statLine! },
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
    mount: { name: 'Elven Steed', nameEs: 'Corcel Élfico', statLine: ELVEN_STEED_MOUNT.statLine! },
    minSize: 5,
    options: [SHIELD_2, HEAVY_ARMOUR_2, BARDING_8],
    specialRules: [
      'Always strikes first',
      'Light armour & cavalry lance; Elven Steed (5+ save base)',
      'May carry a magic standard',
    ],
  },
  {
    id: 'he-ellyrian-reavers',
    name: 'Ellyrian Reavers (Shadow Knights)',
    nameEs: 'Caballeros Segadores',
    role: 'regiment',
    pointsPerModel: 25,
    statLine: elf(),
    mount: { name: 'Elven Steed', nameEs: 'Corcel Élfico', statLine: ELVEN_STEED_MOUNT.statLine! },
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
      'Standard bearer & musician cost the same as an ordinary White Lion, not double',
      'May carry a magic standard (at its normal points cost)',
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
      'May carry a magic standard',
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
      'May carry a magic standard',
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
      'May carry a magic standard',
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
      'May carry a magic standard',
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
    statLine: elf({ WS: 5, BS: 4, S: 3, T: 3, W: 1, I: 7, A: 1, Ld: 8 }),
    // OLD-33 chassis + steeds, shared with TIRANOC_CHARIOT_MOUNT (OLD-34) so the
    // ridden chariot and the standalone one can never print different profiles.
    profiles: TIRANOC_CHARIOT_PROFILES,
    specialRules: [
      'Chariot (T7 W3) drawn by 2 Elven Steeds (6+ save base)',
      'Crew: 2 Aurigas with light armour, sword & bow',
      'Always strikes first',
      'May carry a magic standard',
      'Its decorative banners are not regimental standards — no combat-resolution bonus',
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
    id: 'he-chimera',
    name: 'Chimera',
    nameEs: 'Quimera',
    role: 'monster',
    pointsPerModel: 250,
    statLine: { M: 6, WS: 4, BS: 0, S: 7, T: 6, W: 6, I: 4, A: 6, Ld: 8 },
    specialRules: ['Flying', 'Large target', 'Causes terror'],
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
