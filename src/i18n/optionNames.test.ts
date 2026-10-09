import { describe, it, expect } from 'vitest'
import { ARMIES, getArmy } from '../data/armies/index'
import { isWizardLevelId } from '../data/unitOptions'
import { optionText } from './lang'

/**
 * An equipment option has no `nameEs`: its `name` is English and doubles as the
 * key into `OPTION_ES`, which `optionText` falls back from. A name typed in
 * Spanish therefore has no entry, so it shows untranslated in BOTH languages.
 * Chaos shipped that way: in EN a Marauder Horsemen entry read
 * "Mangual (+2/model)" and "Escudos (+2/model)". An English name with no entry
 * fails the same way in ES. Either mistake trips the test below.
 *
 * Wizard levels are exempt: they always render through `wizardLevelLabel`
 * ("Level 3" / "Nivel 3"), never through their `name`.
 */
function everyOptionName(): Map<string, Set<string>> {
  const names = new Map<string, Set<string>>()
  const add = (name: string, armyId: string) => {
    if (!names.has(name)) names.set(name, new Set())
    names.get(name)!.add(armyId)
  }
  // Options live on a unit and on each of its mounts (a chariot's crew,
  // shields, scythed wheels). ARMIES is post-assembly, so the generated
  // command-group options are walked too.
  for (const army of ARMIES) {
    for (const unit of army.units) {
      for (const o of unit.options ?? []) if (!isWizardLevelId(o.id)) add(o.name, army.id)
      for (const mount of unit.mounts ?? []) for (const o of mount.options ?? []) add(o.name, army.id)
    }
  }
  return names
}

describe('every equipment option name is English with a Spanish translation', () => {
  it('every option name in every army has an OPTION_ES entry', () => {
    const missing = [...everyOptionName()]
      .filter(([name]) => optionText(name, 'es') === name)
      .map(([name, armies]) => `[${[...armies].sort().join(' ')}] ${name}`)
      .sort()
    expect(missing, `${missing.length} option name(s) would render the same in EN and ES:\n${missing.join('\n')}`).toEqual([])
  })

  it('Chaos options read in English in EN and in Spanish in ES', () => {
    const horsemen = getArmy('chaos')!.units.find((u) => u.id === 'ch-marauder-horsemen')!
    const label = (lang: 'en' | 'es') =>
      horsemen.options!.filter((o) => o.id === 'flail' || o.id === 'shield').map((o) => optionText(o.name, lang))
    expect(label('en')).toEqual(['Flail', 'Shields'])
    expect(label('es')).toEqual(['Mangual', 'Escudos'])
  })
})
