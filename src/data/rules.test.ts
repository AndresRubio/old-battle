import { describe, it, expect } from 'vitest'
import { RULES, findRule } from './rules'

describe('findRule', () => {
  it('matches an ability tag by word, case-insensitively', () => {
    expect(findRule('Causes fear')?.id).toBe('fear')
    expect(findRule('CAUSES TERROR')?.id).toBe('terror')
  })

  it('matches Spanish aliases too', () => {
    expect(findRule('Causa miedo')?.id).toBe('fear')
  })

  it('returns undefined for an unknown tag', () => {
    expect(findRule('totally made-up ability')).toBeUndefined()
  })

  it('prefers the longer alias when two start at the same word', () => {
    // 'immune to psychology' and 'immune to fear...' both begin at character 0;
    // the longer, more specific alias takes the tag.
    expect(findRule('Immune to psychology')?.id).toBe('immune-psychology')
  })

  it('every rule stays reachable through at least one of its own aliases', () => {
    // A new alias that starts earlier in a tag can take that tag from another
    // rule. This pins that no rule ends up unreachable for ALL of its aliases.
    for (const rule of RULES) {
      const reachable = rule.aliases.some((a) => findRule(a)?.id === rule.id)
      expect(reachable, `rule '${rule.id}' is shadowed for all of its aliases`).toBe(true)
    }
  })
})
