interface Props {
  /** Small uppercase label above the title (e.g. "Rule", "Magic Item"). */
  kicker: string
  title: string
  body: string
  onClose: () => void
}

/** Small popup explaining a rule or item when its ⓘ control is clicked. */
export function InfoDialog({ kicker, title, body, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-rule" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="rule-kicker">{kicker}</span>
            <h3>{title}</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="rule-body">{body}</p>
      </div>
    </div>
  )
}
