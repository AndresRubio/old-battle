# CODING_STANDARDS.md

Rules for reviewing a diff in this repo. The reviewer reads this file; the implementer follows
`AGENTS.md`. Mechanical rules live in code instead (`npm run check`, `armies/integrity.ts`,
`rulePhrases.test.ts`), so everything here is a judgement call a check can't make. Each rule
that fails is a finding.

## Provenance of game values

No test can tell a book value from a wrong one: `armies.test.ts` checks structure, not whether a
Gran Shaman has I 4 or I 5. Provenance is the reviewer's job.

- Every changed game value has a printed page. A stat, points cost, unit limit, item allowance
  or rule text that the diff changes carries its page in a code comment and in a `CITATIONS.md`
  entry under the army's subsection. A value whose page you can't find in the brief, the issue or
  the findings file is invented until shown otherwise.
- A shared stat block moves every unit that copies it. When the diff changes a constant other
  profiles spread or reference (`NIGHTMARE_STATS`, `CHAOS_STEED_STATS`, `GIANT_WOLF_STATS`, ...),
  grep its name and list every user. Each user needs its own page printing the new row. A user
  whose book prints no row of its own goes to the owner before its values move. (OLD-73: the
  Vampire Counts Hellsteed spread `NIGHTMARE_STATS` and changed with the Nightmare, although no
  book prints a Hellsteed; the owner was only asked afterwards.)
- Book contradictions are the owner's call. When two pages disagree (a bestiary against a
  list, a character page against a unit page), the diff applies a decision recorded on the Linear
  issue, and the code comment names both pages. Picking one page silently is a finding.
- English editions print inches. Spanish books print cm, converted through `MOVEMENT_CM`.
  Bretonnia, Lizardmen, Dogs of War, Norsca and Halflings are English: their M is already inches.

## Saved rosters

Rosters live in users' `localStorage` and are keyed by ids.

- Ids stay fixed. A rename touches `name`, `nameEs` and tags; the `id` of a unit, option,
  mount or item keeps its old value, so a saved roster keeps its price.
- A new roster field is optional and `storage.ts` accepts its absence. An old roster loads and
  prices as before, except where a book value changed on purpose.

## Tests

- An existing expectation changes only for a stated reason: a book page or an owner decision
  named in the brief. A loosened assertion (`toBeGreaterThan` where `toBe` stood, a removed case)
  without one is a finding.
- Each new test fails without its feature. Ask which production line the test pins; if
  deleting that line leaves the suite green, the test is decoration.
- Snapshot diffs contain only the strings the task changed.

## Bilingual text

- Every user-facing string has `en` and `es`. A new `specialRules` tag has its `RULE_PHRASE_ES`
  key (the test checks presence; you check the Spanish reads like the book's wording).
- A new or reworded tag gets its ⓘ from `findRule` by substring match on the English text. Check
  the tag doesn't inherit an unrelated glossary entry.

## Records

- `PROGRESS.md`: one short Spanish line per change, ending with the test count and "tsc limpio".
- `CITATIONS.md` states what was done and where it came from. A sentence the diff makes false
  (an earlier "not shown until the owner decides") is updated in the same diff.
- Commit prose has no em or en dashes and ends with `Refs OLD-NN` or `Closes OLD-NN`, then the
  `Co-Authored-By` trailer.
