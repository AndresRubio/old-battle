import { describe, it, expect } from 'vitest'
import { ruleMessage } from './messages'
import type { UnitProfile } from '../data/types'

const unit: UnitProfile = {
  id: 'emp-general',
  name: 'Empire General',
  nameEs: 'General Imperial',
  role: 'character',
  pointsPerModel: 100,
  isCharacter: true,
}

describe('ruleMessage', () => {
  it('renders both languages from one finding', () => {
    expect(ruleMessage('points-over', { total: 1100, limit: 1000 }, 'en')).toBe(
      'Army is 1100 pts, over the 1000 pt limit by 100.',
    )
    expect(ruleMessage('points-over', { total: 1100, limit: 1000 }, 'es')).toBe(
      'El ejército suma 1100 ptos, 100 por encima del límite de 1000 ptos.',
    )
  })

  it('resolves unit names through one path — Spanish name with English fallback', () => {
    expect(ruleMessage('magic-items-noncharacter', { unit }, 'en')).toContain('Empire General')
    expect(ruleMessage('magic-items-noncharacter', { unit }, 'es')).toContain('General Imperial')
    const noEs = { ...unit, nameEs: undefined }
    expect(ruleMessage('magic-items-noncharacter', { unit: noEs }, 'es')).toContain('Empire General')
  })

  it('uses the human category label in BOTH languages (no raw enum value)', () => {
    const en = ruleMessage('magic-items-category', { unit, category: 'boundSpell', count: 2 }, 'en')
    const es = ruleMessage('magic-items-category', { unit, category: 'boundSpell', count: 2 }, 'es')
    expect(en).toContain('Bound Spell')
    expect(en).not.toContain('boundSpell')
    expect(es).toContain('Hechizo Ligado')
  })

  it('unit-requires falls back to joined unit names when no explicit label', () => {
    const witch: UnitProfile = { ...unit, id: 'w', name: 'Witch Regiment', nameEs: 'Regimiento de Brujas' }
    const p = { labelEn: 'Cauldron', labelEs: 'Caldero', fallbackUnits: [witch, 'raw-id'] }
    expect(ruleMessage('unit-requires', p, 'en')).toBe('Cauldron: requires Witch Regiment / raw-id in the army.')
    expect(ruleMessage('unit-requires', p, 'es')).toBe('Caldero: requiere Regimiento de Brujas / raw-id en el ejército.')
  })

  it('labels the Mark of Chaos exclusive group; other groups fall back to the id', () => {
    expect(ruleMessage('options-exclusive-group', { unit, group: 'mark', count: 2 }, 'en')).toContain(
      'one Mark of Chaos',
    )
    expect(ruleMessage('options-exclusive-group', { unit, group: 'mark', count: 2 }, 'es')).toContain(
      'una Marca del Caos',
    )
    expect(ruleMessage('options-exclusive-group', { unit, group: 'other-grp', count: 2 }, 'en')).toContain(
      'other-grp',
    )
  })
})
