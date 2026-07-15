import { describe, it, expect } from 'vitest'
import { MAGIC_LORES, getLore } from './lores'

describe('magic lores', () => {
  const lores = Object.values(MAGIC_LORES)

  it('has at least the Battle Magic lore', () => {
    expect(getLore('battle')).toBeDefined()
    expect(getLore('battle')!.spells.length).toBeGreaterThan(0)
  })

  it('every lore id matches its object key and is unique', () => {
    for (const [key, lore] of Object.entries(MAGIC_LORES)) {
      expect(lore.id).toBe(key)
    }
  })

  it('every spell has a non-empty name and description', () => {
    for (const lore of lores) {
      expect(lore.spells.length).toBeGreaterThan(0)
      for (const s of lore.spells) {
        expect(s.name.trim().length).toBeGreaterThan(0)
        expect(s.description.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('getLore returns undefined for unknown ids', () => {
    expect(getLore('nope')).toBeUndefined()
  })
})
