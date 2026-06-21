import type { RuleDef } from '../data/rules'
import type { Lang } from '../i18n/lang'
import { InfoDialog } from './InfoDialog'

interface Props {
  rule: RuleDef
  lang: Lang
  onClose: () => void
}

/** Small popup explaining a special rule when its tag is clicked. */
export function RuleDialog({ rule, lang, onClose }: Props) {
  return (
    <InfoDialog
      kicker={lang === 'es' ? 'Regla' : 'Rule'}
      title={lang === 'es' ? rule.titleEs : rule.titleEn}
      body={lang === 'es' ? rule.es : rule.en}
      onClose={onClose}
    />
  )
}
