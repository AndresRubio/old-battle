import { describe, it, expect } from 'vitest'
import { ARMIES } from '../data/armies/index'
import { RULE_PHRASE_ES } from './rulePhrases'
import { ruleText } from './lang'

/**
 * OLD-44 — a special-rule tag is its OWN translation key. `ruleText` falls back
 * to the English value when the key is missing, so a gap never throws and never
 * leaves a hole: it just prints an English line in the middle of a Spanish card.
 * That is why 49 of them sat unnoticed, and why editing a tag's English text —
 * even a correct edit, like OLD-38's `(T5 W3)` → `(T7 W3)` or OLD-43's `5D6"` →
 * `5D6cm` — silently orphans its Spanish and quietly reverts the line to English.
 *
 * The two tests below close that loop from both ends. Nothing else in the suite
 * does, which is exactly how the coverage was allowed to drift.
 */
function everyTag(): Map<string, Set<string>> {
  const tags = new Map<string, Set<string>>()
  const add = (tag: string, armyId: string) => {
    if (!tags.has(tag)) tags.set(tag, new Set())
    tags.get(tag)!.add(armyId)
  }
  for (const army of ARMIES) {
    for (const unit of army.units) {
      for (const tag of unit.specialRules ?? []) add(tag, army.id)
      for (const p of unit.profiles ?? []) for (const tag of p.specialRules ?? []) add(tag, army.id)
      for (const mount of unit.mounts ?? []) {
        for (const tag of mount.specialRules ?? []) add(tag, army.id)
        for (const p of mount.profiles ?? []) for (const tag of p.specialRules ?? []) add(tag, army.id)
      }
    }
  }
  return tags
}

describe('OLD-44 — the Spanish rule phrases cover every tag, and only real tags', () => {
  it('every special-rule tag in every army has a Spanish phrase', () => {
    // Mounts and extra profiles count: they render through `ruleText` too, via
    // RuleTags in EntryRow. The original audit only counted unit tags and so
    // missed 18 of the 49.
    const missing = [...everyTag()]
      .filter(([tag]) => !RULE_PHRASE_ES[tag])
      .map(([tag, armies]) => `[${[...armies].sort().join(' ')}] ${tag}`)
      .sort()
    expect(missing, `${missing.length} tag(s) would render in English:\n${missing.join('\n')}`).toEqual([])
  })

  it('no Spanish phrase is orphaned by a tag that no longer exists', () => {
    // The other half of the trap. An orphan is dead weight AND evidence that a
    // tag was renamed without its translation — the renamed tag is then in the
    // list above. OLD-43 left one behind (`Move 5D6"…` → `Move 5D6cm…`).
    const live = everyTag()
    const orphans = Object.keys(RULE_PHRASE_ES).filter((key) => !live.has(key)).sort()
    expect(
      orphans,
      `${orphans.length} phrase(s) translate a tag no army uses — did a tag's English text change?\n${orphans.join('\n')}`,
    ).toEqual([])
  })

  it('ruleText returns the Spanish phrase in ES and the tag itself in EN', () => {
    const tag = 'Chariot (T7 W3) — drawn by 2 Chaos Steeds, crew of 2 Chaos Warriors'
    expect(ruleText(tag, 'en')).toBe(tag)
    expect(ruleText(tag, 'es')).toBe(
      'Carro (R7 H3) — tirado por 2 Corceles del Caos, dotación de 2 Guerreros del Caos',
    )
  })

  it('translated stat columns use the Spanish letters, and inches stay inches', () => {
    // M/WS/BS/S/T/W/I/A/Ld → M/HA/HP/F/R/H/I/A/L. Movement already converted in
    // the data is NOT reconverted: a tag that prints 5D6cm keeps cm, one that
    // prints inches keeps inches.
    expect(RULE_PHRASE_ES['Chariot (T7 W3) — drawn by 2 Tuskgors, crew of 2 Gor Beastmen']).toContain('R7 H3')
    expect(RULE_PHRASE_ES['Move 5D6cm (random each turn); S5 ball & chain; D6 wounds per model hit']).toContain(
      'Movimiento 5D6cm',
    )
    expect(RULE_PHRASE_ES['Dragon Armour barding (2+ save)']).not.toContain('save')
  })
})
