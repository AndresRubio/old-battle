import { describe, it, expect } from 'vitest'
import {
  STANDARD_BEARER_ID,
  MUSICIAN_ID,
  isWizardLevelId,
  wizardLevelOf,
  WIZARD_LEVELS,
  commandOptions,
} from './unitOptions'

describe('option-identity conventions', () => {
  it('recognises wizard-level option ids and extracts the level', () => {
    for (const o of WIZARD_LEVELS) {
      expect(isWizardLevelId(o.id)).toBe(true)
    }
    expect(wizardLevelOf('wizard-l2')).toBe(2)
    expect(wizardLevelOf('wizard-l4')).toBe(4)
  })

  it('does not match unrelated option ids', () => {
    for (const id of [STANDARD_BEARER_ID, MUSICIAN_ID, 'bsb', 'shield', 'wizard']) {
      expect(isWizardLevelId(id)).toBe(false)
      expect(wizardLevelOf(id)).toBeUndefined()
    }
  })

  it('command options are declared with the owned ids', () => {
    expect(commandOptions(5).map((o) => o.id)).toEqual([STANDARD_BEARER_ID, MUSICIAN_ID])
  })
})
