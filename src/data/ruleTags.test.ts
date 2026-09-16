import { describe, it, expect } from 'vitest'
import { ARMIES } from './armies/index'
import { RULES, findRule, TAG_RULE_OVERRIDES } from './rules'

/**
 * OLD-42 — the ⓘ next to a unit's ability tag is chosen by `findRule`, a
 * heuristic over the tag's English prose. Nothing used to check WHICH article it
 * opened, so two wrong ones shipped and were found by accident, months apart
 * (OLD-16, then OLD-36: the Repeater Bolt Thrower's list-composition tag opened
 * the Cavalry Lance article, because "lance" is inside "Lancers").
 *
 * This file is the missing check. The snapshot below pins every tag that gets a
 * ⓘ to the article it opens, so editing a tag, adding an alias or adding a
 * glossary entry shows up as a reviewable diff instead of silently re-pointing
 * someone's ⓘ. Run `npx vitest -u` to accept a change you meant to make — and
 * read the diff before you do.
 */
function resolvedTags(): string {
  const tags = new Map<string, Set<string>>()
  for (const army of ARMIES) {
    for (const unit of army.units) {
      for (const tag of unit.specialRules ?? []) {
        if (!tags.has(tag)) tags.set(tag, new Set())
        tags.get(tag)!.add(army.id)
      }
    }
  }
  const lines: string[] = []
  for (const [tag, armies] of [...tags].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const rule = findRule(tag)
    if (rule) lines.push(`${rule.id}\t${tag}\t[${[...armies].sort().join(' ')}]`)
  }
  return lines.join('\n') + '\n'
}

describe('OLD-42 — every ⓘ is pinned to the article it opens', () => {
  it('matches the recorded tag → glossary mapping', async () => {
    await expect(resolvedTags()).toMatchFileSnapshot('./__snapshots__/rule-tags.txt')
  })

  it('the reported bug: a list-composition tag mentioning Lancers gets no ⓘ', () => {
    // The tag that started OLD-42. "lance" sits inside "Lancers"; under the old
    // substring match this opened the Cavalry Lance article.
    expect(
      findRule('Number limited to number of Archers/Lancers/Sea Guard regiments; minimum 2 allowed'),
    ).toBeUndefined()
    // …while a tag that really carries a lance still resolves to it.
    expect(findRule('Sword & cavalry lance')?.id).toBe('lance')
  })

  it('an alias glued inside a longer word does not match', () => {
    expect(findRule('Up to 2 per regiment of 10+ Warriors/Spearmen/Crossbowmen/City Guard/Corsairs')).toBeUndefined()
    expect(findRule('Fearfrost magic sword (+100 pts) — fixed magic item')?.id).toBe('magic-items')
    expect(findRule('Spearmen')).toBeUndefined()
    expect(findRule('Lancers')).toBeUndefined()
  })

  it('an ordinary plural still matches', () => {
    // The flip side: matching must stay loose enough for prose. These would all
    // break under a naive whole-word rule.
    expect(findRule('Spears')?.id).toBe('spear')
    expect(findRule('Armed with hand weapons and shields')?.id).toBe('shield')
    expect(findRule('Up to 3 magic items')?.id).toBe('magic-items')
    expect(findRule('Scouts')?.id).toBe('scouts')
    expect(findRule('Skirmishers')?.id).toBe('skirmish')
    expect(findRule('May accompany Stormvermin/Clanrat regiments, or form skirmisher units')?.id).toBe('skirmish')
  })

  it('the earliest rule word in the tag wins, not the array order', () => {
    // These tags name two rules. The one the tag LEADS with is its subject —
    // that is what the ⓘ should explain. Under the old array-order match the
    // answer depended on where an entry happened to sit in RULES.
    expect(findRule('Terror (also causes fear)')?.id).toBe('terror')
    expect(findRule('Causes fear (immune to fear; treats terror as fear)')?.id).toBe('fear')
    expect(findRule('Fast cavalry (skirmish)')?.id).toBe('fast-cavalry')
    expect(findRule('Stupidity (when not in combat); Frenzy in combat (double attacks)')?.id).toBe('stupidity')
    expect(findRule('Army Battle Standard (an Undead Knight)')?.id).toBe('battle-standard')
  })

  it('every override is still needed and still points somewhere real', () => {
    // An override keyed on a tag nobody uses any more is dead weight that hides
    // a renamed tag — the same silent-orphan trap RULE_PHRASE_ES has.
    const live = new Set<string>()
    for (const army of ARMIES) for (const u of army.units) for (const t of u.specialRules ?? []) live.add(t)
    for (const [tag, id] of Object.entries(TAG_RULE_OVERRIDES)) {
      expect(live.has(tag), `override for a tag no army uses: "${tag}"`).toBe(true)
      if (id !== null) {
        expect(RULES.some((r) => r.id === id), `override points at unknown rule '${id}'`).toBe(true)
      }
    }
  })

  it('a tag that denies a rule does not open that rule', () => {
    expect(findRule('Living — not Undead; does not cause fear')).toBeUndefined()
    expect(findRule('Living — not Undead; subject to psychology')).toBeUndefined()
    expect(findRule('Has yet to develop its breath weapon, so has no breath attack')).toBeUndefined()
  })

  it('a rule word inside a proper name does not open that rule', () => {
    // The Bretonnian lance FORMATION is not the cavalry lance; the Storm Daemon
    // is a halberd; a Daemon Slayer is a Dwarf.
    expect(findRule('Lance formation')).toBeUndefined()
    expect(findRule('The Storm Daemon (Tormenta Demoníaca) halberd: S6, casts Warp Lightning (1D6 hits)')).toBeUndefined()
    expect(findRule('May include any number of Slayer Paladins (Giant/Dragon/Daemon Slayers)')).toBeUndefined()
    expect(findRule('Cloud of Flies (-1 to hit them)')).toBeUndefined()
  })
})
