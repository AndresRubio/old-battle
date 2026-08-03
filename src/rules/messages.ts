import type {
  EquipmentOption,
  MagicItem,
  MagicItemCategory,
  MountOption,
  RuleViolation,
  Severity,
  UnitProfile,
} from '../data/types'
import type { CapStatus } from './summary'
import {
  type Lang,
  unitName,
  mountName,
  optionText,
  magicItemName,
  CATEGORY_LABEL,
} from '../i18n/lang'

/**
 * The bilingual prose of every Muster Check violation, keyed by rule id.
 *
 * Rule logic (validate.ts, magicItems.ts) produces typed `Finding`s and never
 * sees the language; this table turns a finding into the user-facing sentence.
 * All EN/ES phrasing and all name resolution (units, mounts, items, category
 * labels) lives HERE — one naming path, one place to test the wording.
 */

/** Typed parameters each rule's message is built from. */
export interface RuleParams {
  'points-over': { total: number; limit: number }
  'no-general': Record<string, never>
  'multiple-generals': { count: number }
  'invalid-general': { unit: UnitProfile }
  'characters-over': { cap: CapStatus }
  'regiments-min': { cap: CapStatus }
  'warmachines-over': { cap: CapStatus }
  'monsters-over': { cap: CapStatus }
  'unit-max': { unit: UnitProfile; count: number }
  'unit-group-max': { labelEn: string; labelEs: string; max: number; count: number }
  'unit-ratio-max': { labelEn: string; labelEs: string; allowed: number; count: number }
  'unit-requires': {
    labelEn: string
    labelEs: string
    requiresLabelEn?: string
    requiresLabelEs?: string
    /** Fallback when no explicit requires-label: the prerequisite units (or raw ids). */
    fallbackUnits: (UnitProfile | string)[]
  }
  'unknown-unit': { unitId: string }
  'min-size': { unit: UnitProfile; size: number; minSize: number }
  'max-size': { unit: UnitProfile; size: number; maxSize: number }
  'magic-items-noncharacter': { unit: UnitProfile }
  'magic-items-count': { unit: UnitProfile; carried: number; allowance: number }
  'magic-items-category': { unit: UnitProfile; category: MagicItemCategory; count: number }
  'magic-items-exclusive-group': { unit: UnitProfile; group: 'crown' | 'helm'; count: number }
  'magic-items-banner-bsb': { unit: UnitProfile }
  'magic-standard-not-allowed': { unit: UnitProfile }
  'magic-standard-no-bearer': { unit: UnitProfile }
  'magic-standard-invalid-item': { unit: UnitProfile; item?: MagicItem; itemId: string }
  'options-exclusive-group': { unit: UnitProfile; group: string; count: number }
  'mount-options-stale': { unit: UnitProfile; mount: MountOption; options: EquipmentOption[] }
  'mount-requires-option': {
    unit: UnitProfile
    mount: MountOption
    requiredOption?: EquipmentOption
    requiredOptionId: string
  }
  'magic-items-unique': { item: MagicItem; count: number }
}

export type RuleId = keyof RuleParams

/** A violation before its message is rendered: rule id + typed params. */
export type Finding = {
  [K in RuleId]: { severity: Severity; rule: K; params: RuleParams[K]; entryId?: string }
}[RuleId]

type MessageBuilder<K extends RuleId> = (p: RuleParams[K], lang: Lang) => string

const un = (p: { unit: UnitProfile }, lang: Lang) => unitName(p.unit, lang)

const MESSAGES: { [K in RuleId]: MessageBuilder<K> } = {
  'points-over': (p, lang) =>
    lang === 'es'
      ? `El ejército suma ${p.total} ptos, ${p.total - p.limit} por encima del límite de ${p.limit} ptos.`
      : `Army is ${p.total} pts, over the ${p.limit} pt limit by ${p.total - p.limit}.`,
  'no-general': (_p, lang) =>
    lang === 'es'
      ? 'Todo ejército debe tener un General. Nombra General a un personaje.'
      : 'Every army must have a General. Nominate one character as the General.',
  'multiple-generals': (p, lang) =>
    lang === 'es'
      ? `Sólo se permite un General (hay ${p.count}).`
      : `Only one General is allowed (found ${p.count}).`,
  'invalid-general': (p, lang) =>
    lang === 'es'
      ? `${un(p, lang)} no puede ser el General del ejército.`
      : `${un(p, lang)} cannot be the army General.`,
  'characters-over': ({ cap }, lang) =>
    lang === 'es'
      ? `Los personajes usan ${cap.points} ptos, superando el tope del ${cap.capPct}% (${cap.capPoints} ptos).`
      : `Characters use ${cap.points} pts, over the ${cap.capPct}% cap (${cap.capPoints} pts).`,
  'regiments-min': ({ cap }, lang) =>
    lang === 'es'
      ? `Los regimientos sólo suman ${cap.points} ptos; se requiere al menos el ${cap.capPct}% (${cap.capPoints} ptos).`
      : `Regiments are only ${cap.points} pts; at least ${cap.capPct}% (${cap.capPoints} pts) is required.`,
  'warmachines-over': ({ cap }, lang) =>
    lang === 'es'
      ? `Las máquinas de guerra y carros usan ${cap.points} ptos, superando el tope del ${cap.capPct}% (${cap.capPoints} ptos).`
      : `War machines & chariots use ${cap.points} pts, over the ${cap.capPct}% cap (${cap.capPoints} pts).`,
  'monsters-over': ({ cap }, lang) =>
    lang === 'es'
      ? `Los monstruos usan ${cap.points} ptos, superando el tope del ${cap.capPct}% (${cap.capPoints} ptos).`
      : `Monsters use ${cap.points} pts, over the ${cap.capPct}% cap (${cap.capPoints} pts).`,
  'unit-max': (p, lang) =>
    lang === 'es'
      ? `${un(p, lang)}: sólo se permiten ${p.unit.max}, pero hay ${p.count} en la lista.`
      : `${un(p, lang)}: only ${p.unit.max} allowed, but ${p.count} are in the list.`,
  'unit-group-max': (p, lang) =>
    lang === 'es'
      ? `${p.labelEs}: sólo se permiten ${p.max} en el ejército, pero hay ${p.count} en la lista.`
      : `${p.labelEn}: only ${p.max} allowed in the army, but ${p.count} are in the list.`,
  'unit-ratio-max': (p, lang) =>
    lang === 'es'
      ? `${p.labelEs}: sólo se permiten ${p.allowed} (hay ${p.count} en la lista).`
      : `${p.labelEn}: only ${p.allowed} allowed (${p.count} in the list).`,
  'unit-requires': (p, lang) => {
    const explicit = lang === 'es' ? p.requiresLabelEs ?? p.requiresLabelEn : p.requiresLabelEn
    const reqText =
      explicit ??
      p.fallbackUnits.map((u) => (typeof u === 'string' ? u : unitName(u, lang))).join(' / ')
    return lang === 'es'
      ? `${p.labelEs}: requiere ${reqText} en el ejército.`
      : `${p.labelEn}: requires ${reqText} in the army.`
  },
  'unknown-unit': (p, lang) =>
    lang === 'es'
      ? `Unidad desconocida "${p.unitId}" en la lista.`
      : `Unknown unit "${p.unitId}" in roster.`,
  'min-size': (p, lang) =>
    lang === 'es'
      ? `${un(p, lang)}: la unidad tiene ${p.size} miniaturas, por debajo del mínimo de ${p.minSize}.`
      : `${un(p, lang)}: unit has ${p.size} models, below the minimum of ${p.minSize}.`,
  'max-size': (p, lang) =>
    lang === 'es'
      ? `${un(p, lang)}: la unidad tiene ${p.size} miniaturas, por encima del máximo de ${p.maxSize}.`
      : `${un(p, lang)}: unit has ${p.size} models, above the maximum of ${p.maxSize}.`,
  'magic-items-noncharacter': (p, lang) =>
    lang === 'es'
      ? `${un(p, lang)}: sólo los personajes pueden portar objetos mágicos.`
      : `${un(p, lang)}: only characters may carry magic items.`,
  'magic-items-count': (p, lang) =>
    lang === 'es'
      ? `${un(p, lang)}: porta ${p.carried} objetos mágicos pero sólo puede llevar ${p.allowance}.`
      : `${un(p, lang)}: carries ${p.carried} magic items but may carry only ${p.allowance}.`,
  'magic-items-category': (p, lang) =>
    lang === 'es'
      ? `${un(p, lang)}: tiene ${p.count} objetos de tipo "${CATEGORY_LABEL.es[p.category]}" pero sólo puede llevar uno.`
      : `${un(p, lang)}: has ${p.count} "${CATEGORY_LABEL.en[p.category]}" items but may have only one.`,
  'magic-items-exclusive-group': (p, lang) =>
    lang === 'es'
      ? `${un(p, lang)}: un personaje sólo puede llevar ${p.group === 'crown' ? 'una corona' : 'un yelmo'}.`
      : `${un(p, lang)}: a character may carry only one ${p.group}.`,
  'magic-items-banner-bsb': (p, lang) =>
    lang === 'es'
      ? `${un(p, lang)}: sólo el Portaestandarte de Batalla puede portar un estandarte mágico.`
      : `${un(p, lang)}: only a Battle Standard Bearer may carry a magic standard.`,
  'magic-standard-not-allowed': (p, lang) =>
    lang === 'es'
      ? `${un(p, lang)}: esta unidad no puede llevar un estandarte mágico.`
      : `${un(p, lang)}: this unit may not carry a magic standard.`,
  'magic-standard-no-bearer': (p, lang) =>
    lang === 'es'
      ? `${un(p, lang)}: un estandarte mágico requiere que la unidad lleve un portaestandarte.`
      : `${un(p, lang)}: a magic standard requires a standard bearer in the unit.`,
  'magic-standard-invalid-item': (p, lang) => {
    const itemNm = p.item ? magicItemName(p.item, lang) : p.itemId
    return lang === 'es'
      ? `${un(p, lang)}: "${itemNm}" no es un estandarte mágico válido para esta unidad.`
      : `${un(p, lang)}: "${itemNm}" is not a valid magic standard for this unit.`
  },
  'options-exclusive-group': (p, lang) => {
    // The only exclusive option group so far is the four Marks of Chaos; other
    // groups fall back to their raw group id until they earn a label.
    const what =
      p.group === 'mark' ? (lang === 'es' ? 'una Marca del Caos' : 'one Mark of Chaos') : p.group
    return lang === 'es'
      ? `${un(p, lang)}: una miniatura sólo puede portar ${what} (lleva ${p.count}).`
      : `${un(p, lang)}: a model may carry only ${what} (carries ${p.count}).`
  },
  'mount-options-stale': (p, lang) => {
    const optNames = p.options.map((o) => optionText(o.name, lang)).join(', ')
    return lang === 'es'
      ? `${un(p, lang)}: las opciones "${optNames}" pertenecen a ${mountName(p.mount, lang)}, que no es su montura actual.`
      : `${un(p, lang)}: the options "${optNames}" belong to ${mountName(p.mount, lang)}, which is not its current mount.`
  },
  'mount-requires-option': (p, lang) => {
    const reqName = p.requiredOption ? optionText(p.requiredOption.name, lang) : p.requiredOptionId
    return lang === 'es'
      ? `${un(p, lang)}: ${mountName(p.mount, lang)} requiere ${reqName}.`
      : `${un(p, lang)}: ${mountName(p.mount, lang)} requires ${reqName}.`
  },
  'magic-items-unique': (p, lang) =>
    lang === 'es'
      ? `${magicItemName(p.item, lang)}: objeto mágico duplicado — cada objeto mágico es único y sólo puede incluirse una vez en el ejército (lo llevan ${p.count} personajes).`
      : `${magicItemName(p.item, lang)}: duplicate magic item — each magic item is unique and may appear only once per army (carried by ${p.count} characters).`,
}

/** Render one finding's message in the given language. */
export function ruleMessage<K extends RuleId>(rule: K, params: RuleParams[K], lang: Lang): string {
  return MESSAGES[rule](params, lang)
}

/** Turn a typed finding into the user-facing RuleViolation. */
export function toViolation(finding: Finding, lang: Lang): RuleViolation {
  return {
    severity: finding.severity,
    rule: finding.rule,
    message: ruleMessage(finding.rule, finding.params, lang),
    ...(finding.entryId !== undefined ? { entryId: finding.entryId } : {}),
  }
}
