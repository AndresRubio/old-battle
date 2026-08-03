import { describe, it, expect } from 'vitest'
import { RULES, findRule } from './rules'

describe('findRule', () => {
  it('matches an ability tag by substring, case-insensitively', () => {
    expect(findRule('Causes fear')?.id).toBe('fear')
    expect(findRule('CAUSES TERROR')?.id).toBe('terror')
  })

  it('matches Spanish aliases too', () => {
    expect(findRule('Causa miedo')?.id).toBe('fear')
  })

  it('returns undefined for an unknown tag', () => {
    expect(findRule('totally made-up ability')).toBeUndefined()
  })

  it('prefers the specific rule over the generic one (declaration order)', () => {
    // 'Immune to psychology' is listed before 'fear'/'terror' precisely so a
    // compound tag resolves to the specific rule, not a generic substring hit.
    expect(findRule('Immune to psychology')?.id).toBe('immune-psychology')
  })

  it('every rule stays reachable through at least one of its own aliases', () => {
    // findRule is first-match-wins over an ordered list, so a reordering (or a
    // new generic alias) can silently shadow a later rule. This pins that no
    // rule is unreachable: each one wins the lookup for at least one alias.
    for (const rule of RULES) {
      const reachable = rule.aliases.some((a) => findRule(a)?.id === rule.id)
      expect(reachable, `rule '${rule.id}' is shadowed for all of its aliases`).toBe(true)
    }
  })
})
