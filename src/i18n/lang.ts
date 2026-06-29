import { useSyncExternalStore } from 'react'
import type { Army, MagicItem, MagicItemCategory, MountOption, ProfileBlock, StatLine, UnitProfile, UnitRole } from '../data/types'
import { RULE_PHRASE_ES } from './rulePhrases'

export type Lang = 'en' | 'es'

const KEY = 'wfb-lang'

function read(): Lang {
  try {
    return localStorage.getItem(KEY) === 'es' ? 'es' : 'en'
  } catch {
    return 'en'
  }
}

let current: Lang = read()
const listeners = new Set<() => void>()

export function setLang(lang: Lang): void {
  current = lang
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    // ignore — persistence is best-effort
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Reactive language hook. Returns the current language and a setter. */
export function useLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(subscribe, () => current, () => current)
  return [lang, setLang]
}

// --- Name resolvers (fall back to the English name when no translation) ---
export const unitName = (u: UnitProfile, lang: Lang): string =>
  lang === 'es' ? u.nameEs ?? u.name : u.name
export const armyName = (a: Army, lang: Lang): string =>
  lang === 'es' ? a.nameEs ?? a.name : a.name
export const mountName = (m: MountOption, lang: Lang): string =>
  lang === 'es' ? m.nameEs ?? m.name : m.name
export const profileName = (p: ProfileBlock, lang: Lang): string =>
  lang === 'es' ? p.nameEs ?? p.name : p.name

// --- Bilingual labels ---
export const ROLE_LABEL: Record<Lang, Record<UnitRole, string>> = {
  en: {
    character: 'Characters',
    regiment: 'Regiments',
    warmachine: 'War Machines',
    monster: 'Monsters',
    chariot: 'Chariots',
  },
  es: {
    character: 'Personajes',
    regiment: 'Regimientos',
    warmachine: 'Máquinas de Guerra',
    monster: 'Monstruos',
    chariot: 'Carros',
  },
}

/** Display order for unit groups in the picker. */
export const ROLE_ORDER: UnitRole[] = ['character', 'regiment', 'warmachine', 'monster', 'chariot']

/**
 * Stat-column headers. The KEY (M/WS/BS/…) is always the StatLine property used
 * for lookup; the displayed label is localized (Spanish uses M/HA/HP/F/R/H/I/A/L).
 */
export const STAT_LABEL: Record<Lang, Record<keyof StatLine, string>> = {
  en: { M: 'M', WS: 'WS', BS: 'BS', S: 'S', T: 'T', W: 'W', I: 'I', A: 'A', Ld: 'Ld' },
  es: { M: 'M', WS: 'HA', BS: 'HP', S: 'F', T: 'R', W: 'H', I: 'I', A: 'A', Ld: 'L' },
}

// --- Display groups (split named "special characters" into their own group) ---
export type DisplayGroup = UnitRole | 'specialCharacter'

const SPECIAL_CHAR_RE = /^special character/i

/** A model is a named special character if flagged, or (by convention) its
 * first/any special rule begins with "Special character". Display-only. */
export const isSpecialChar = (u: UnitProfile): boolean =>
  u.isSpecialCharacter ?? (u.specialRules?.some((r) => SPECIAL_CHAR_RE.test(r)) ?? false)

/** Which display group a unit belongs to (special characters split out). */
export const unitGroup = (u: UnitProfile): DisplayGroup =>
  isSpecialChar(u) ? 'specialCharacter' : u.role

/** Display order including the special-characters group. */
export const GROUP_ORDER: DisplayGroup[] = [
  'character',
  'specialCharacter',
  'regiment',
  'warmachine',
  'monster',
  'chariot',
]

export const GROUP_LABEL: Record<Lang, Record<DisplayGroup, string>> = {
  en: { ...ROLE_LABEL.en, specialCharacter: 'Special Characters' },
  es: { ...ROLE_LABEL.es, specialCharacter: 'Personajes Especiales' },
}

/** Display order for grouping magic items in the editor. */
export const CATEGORY_ORDER: MagicItemCategory[] = [
  'weapon',
  'armour',
  'shield',
  'talisman',
  'ward',
  'arcane',
  'enchanted',
  'banner',
  'boundSpell',
  'other',
]

export const CATEGORY_LABEL: Record<Lang, Record<MagicItemCategory, string>> = {
  en: {
    weapon: 'Magic Weapon',
    armour: 'Magic Armour',
    shield: 'Magic Shield',
    ward: 'Talisman / Ward',
    banner: 'Magic Standard',
    boundSpell: 'Bound Spell',
    talisman: 'Talisman',
    enchanted: 'Enchanted Item',
    arcane: 'Arcane Item',
    other: 'Other',
  },
  es: {
    weapon: 'Arma Mágica',
    armour: 'Armadura Mágica',
    shield: 'Escudo Mágico',
    ward: 'Talismán / Salvación',
    banner: 'Estandarte Mágico',
    boundSpell: 'Hechizo Ligado',
    talisman: 'Talismán',
    enchanted: 'Objeto Encantado',
    arcane: 'Objeto Arcano',
    other: 'Otro',
  },
}

/** UI string dictionary. Keys are stable; values are looked up by language. */
const STRINGS = {
  appTitle: { en: 'Old Battle — 5th Edition', es: 'Old Battle — 5ª Edición' },
  appSub: { en: 'Army Builder', es: 'Creador de Ejércitos' },
  footer: {
    en: 'Unofficial fan-made tool · not affiliated with Games Workshop · 5th edition (1996) rules',
    es: 'Herramienta no oficial de aficionados · sin relación con Games Workshop · reglas de 5ª edición (1996)',
  },
  // Home
  yourLists: { en: 'Your Army Lists', es: 'Tus Listas de Ejército' },
  homeBlurb: {
    en: 'Build a 5th edition army and let the muster-sergeant check your composition.',
    es: 'Crea un ejército de 5ª edición y deja que el sargento de revista compruebe tu composición.',
  },
  newList: { en: '+ New Army List', es: '+ Nueva Lista de Ejército' },
  noLists: { en: 'No army lists yet.', es: 'Aún no hay listas de ejército.' },
  musterFirst: { en: 'Muster your first army', es: 'Recluta tu primer ejército' },
  units: { en: 'units', es: 'unidades' },
  deleteList: { en: 'Delete list', es: 'Eliminar lista' },
  delete: { en: 'Delete', es: 'Eliminar' },
  confirmDelete: { en: 'Delete', es: 'Eliminar' }, // used as `${confirmDelete} "name"?`
  // Support / donate
  supportTitle: { en: 'Support this project', es: 'Apoya este proyecto' },
  supportBlurb: {
    en: 'Old Battle is a free, ad-free fan project built in my spare time. If it helps you muster your armies, you can buy me a coffee — it keeps the project going.',
    es: 'Old Battle es un proyecto de aficionados gratuito y sin anuncios, hecho en mi tiempo libre. Si te ayuda a reclutar tus ejércitos, puedes invitarme a un café: así sigue adelante.',
  },
  donateKofi: { en: '☕ Ko-fi', es: '☕ Ko-fi' },
  donateCoffee: { en: '☕ Buy me a coffee', es: '☕ Invítame a un café' },
  // NewList
  newListTitle: { en: 'New Army List', es: 'Nueva Lista de Ejército' },
  army: { en: 'Army', es: 'Ejército' },
  listName: { en: 'List name', es: 'Nombre de la lista' },
  listNamePlaceholder: { en: 'e.g. The Reikland Vanguard', es: 'p. ej. La Vanguardia de Reikland' },
  pointsLimit: { en: 'Points limit', es: 'Límite de puntos' },
  cancel: { en: 'Cancel', es: 'Cancelar' },
  createEdit: { en: 'Create & Edit', es: 'Crear y Editar' },
  // Editor
  lists: { en: '← Lists', es: '← Listas' },
  backToLists: { en: '← Back to lists', es: '← Volver a las listas' },
  limit: { en: 'Limit', es: 'Límite' },
  export: { en: 'Export', es: 'Exportar' },
  yourArmy: { en: 'Your Army', es: 'Tu Ejército' },
  noUnitsYet: {
    en: 'No units yet — add some from the roster on the right.',
    es: 'Aún no hay unidades: añade algunas desde el listado de la derecha.',
  },
  addUnits: { en: 'Add Units', es: 'Añadir Unidades' },
  addUnit: { en: '+ Add unit', es: '+ Añadir unidad' },
  searchUnits: { en: 'Search units…', es: 'Buscar unidades…' },
  noUnitsMatch: { en: 'No units match your search.', es: 'Ninguna unidad coincide con la búsqueda.' },
  listNotFound: { en: 'This army list could not be found.', es: 'No se ha encontrado esta lista de ejército.' },
  unknownArmy: { en: 'Unknown army', es: 'Ejército desconocido' },
  // SummaryPanel
  left: { en: 'left', es: 'restantes' },
  over: { en: 'over', es: 'de más' },
  characters: { en: 'Characters', es: 'Personajes' },
  regiments: { en: 'Regiments', es: 'Regimientos' },
  warMachinesChariots: { en: 'War machines & chariots', es: 'Máquinas de guerra y carros' },
  monsters: { en: 'Monsters', es: 'Monstruos' },
  musterCheck: { en: 'Muster Check', es: 'Revista de Tropas' },
  allClear: { en: 'All clear', es: 'Todo en orden' },
  obeysRules: {
    en: 'This army obeys the 5th edition composition rules. March to war!',
    es: 'Este ejército cumple las reglas de composición de 5ª edición. ¡A la guerra!',
  },
  error: { en: 'error', es: 'error' },
  errors: { en: 'errors', es: 'errores' },
  warning: { en: 'warning', es: 'aviso' },
  warnings: { en: 'warnings', es: 'avisos' },
  // EntryRow
  general: { en: 'General', es: 'General' },
  makeGeneral: { en: '★ Make General', es: '★ Nombrar General' },
  specialAbilities: { en: 'Special Abilities', es: 'Habilidades Especiales' },
  models: { en: 'Models', es: 'Miniaturas' },
  min: { en: 'min', es: 'mín' },
  wizardLevel: { en: 'Wizard Level', es: 'Nivel de Hechicero' },
  level1: { en: 'Level 1', es: 'Nivel 1' },
  options: { en: 'Options', es: 'Opciones' },
  mount: { en: 'Mount', es: 'Montura' },
  onFoot: { en: 'On foot', es: 'A pie' },
  magicItems: { en: 'Magic Items', es: 'Objetos Mágicos' },
  searchItems: { en: 'Search items…', es: 'Buscar objetos…' },
  maxPts: { en: 'max pts', es: 'máx ptos' },
  noItemsMatch: { en: 'No items match the filter.', es: 'Ningún objeto coincide con el filtro.' },
  noOptions: { en: 'No options for this unit.', es: 'Esta unidad no tiene opciones.' },
  remove: { en: 'Remove', es: 'Quitar' },
  unknownUnit: { en: 'Unknown unit', es: 'Unidad desconocida' },
  perModel: { en: '/model', es: '/miniatura' },
  pts: { en: 'pts', es: 'ptos' },
  // ExportDialog
  exportTitle: { en: 'Export Army List', es: 'Exportar Lista de Ejército' },
  print: { en: 'Print', es: 'Imprimir' },
  copied: { en: 'Copied!', es: '¡Copiado!' },
  copyClipboard: { en: 'Copy to clipboard', es: 'Copiar al portapapeles' },
} as const

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang]
}

// --- Data-string resolvers (special rules, options, magic items) ---

/** Translate a unit special-ability tag. Falls back to the English text. */
export const ruleText = (phrase: string, lang: Lang): string =>
  lang === 'es' ? RULE_PHRASE_ES[phrase] ?? phrase : phrase

/** Spanish names for the common (English-named) equipment options. */
const OPTION_ES: Record<string, string> = {
  Shield: 'Escudo',
  Shields: 'Escudos',
  'Shield (per crew)': 'Escudo (por dotación)',
  'Light armour': 'Armadura ligera',
  'Crew light armour': 'Armadura ligera (dotación)',
  'Heavy armour': 'Armadura pesada',
  'Heavy armour (per crew)': 'Armadura pesada (por dotación)',
  'Heavy armour (Ithilmar)': 'Armadura pesada (Ithilmar)',
  Spear: 'Lanza',
  Spears: 'Lanzas',
  Halberd: 'Alabarda',
  Halberds: 'Alabardas',
  'Great weapon': 'Arma a dos manos',
  'Two-handed weapon': 'Arma a dos manos',
  'Two-handed weapons': 'Armas a dos manos',
  'Weapons with two hands': 'Armas a dos manos',
  'Double-handed sword or axe': 'Espada o hacha a dos manos',
  'Additional hand weapon': 'Arma de mano adicional',
  'Additional Skink crewman': 'Sirviente Skink adicional',
  Bow: 'Arco',
  Bows: 'Arcos',
  'Bow (Long bow)': 'Arco (arco largo)',
  Longbows: 'Arcos largos',
  'Longbows (upgrade from bows)': 'Arcos largos (mejora de arcos)',
  'Longbow (per crew)': 'Arco largo (por dotación)',
  'Short bow': 'Arco corto',
  'Short bows': 'Arcos cortos',
  Crossbow: 'Ballesta',
  'Crossbow (instead of Bow)': 'Ballesta (en vez de arco)',
  'Repeater Crossbows': 'Ballestas de repetición',
  Slings: 'Hondas',
  Javelins: 'Jabalinas',
  'Throwing stars': 'Estrellas arrojadizas',
  Nets: 'Redes',
  Pistol: 'Pistola',
  Lance: 'Lanza',
  'Lance (mounted Knight)': 'Lanza (caballero montado)',
  'Lance (per crew)': 'Lanza (por dotación)',
  'Cavalry lance': 'Lanza de caballería',
  'Cavalry lances': 'Lanzas de caballería',
  'Scythed wheels': 'Ruedas con cuchillas',
  Champion: 'Campeón',
  'Standard Bearer': 'Portaestandarte',
  Musician: 'Músico',
  'Barding for warhorse': 'Barda para caballo de guerra',
  'Barding (steeds)': 'Barda (corceles)',
  'Barding (per steed)': 'Barda (por corcel)',
  'Nightmare barding': 'Barda de pesadilla',
  'Nightmare mount': 'Montura pesadilla',
  'Bretonnian Warhorse': 'Caballo de guerra bretoniano',
  'Barded Elven Steed': 'Corcel élfico con barda',
  'Extra 2 Elven Steeds': '2 corceles élficos adicionales',
  'Rune of Stone (Paladin)': 'Runa de Piedra (Paladín)',
  'Poisoned arrows / javelins (S4)': 'Flechas / jabalinas envenenadas (F4)',
  'Poisoned arrows / javelin tips (S4)': 'Puntas de flecha / jabalina envenenadas (F4)',
  'Giant bow (range 36", S5, crewed by 2 Skinks)': 'Arco gigante (alcance 36", F5, dotación de 2 Skinks)',
}

/** Translate an equipment option label. Falls back to the stored name. */
export const optionText = (name: string, lang: Lang): string =>
  lang === 'es' ? OPTION_ES[name] ?? name : name

/** Resolve an option's localized description (e.g. Marks of Chaos). */
export const optionDesc = (
  opt: { description?: string; descEs?: string },
  lang: Lang,
): string | undefined => (lang === 'es' ? opt.descEs ?? opt.description : opt.description)

/** Resolve a magic item's localized name / description. */
export const magicItemName = (item: MagicItem, lang: Lang): string =>
  lang === 'es' ? item.nameEs ?? item.name : item.name
export const magicItemDesc = (item: MagicItem, lang: Lang): string | undefined =>
  lang === 'es' ? item.descEs ?? item.description : item.description
