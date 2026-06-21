import { describe, it, expect } from 'vitest'

// Smoke test: proves the Vitest harness runs. Real rules-engine tests land in Phase 3.
describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
