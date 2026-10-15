// Web mode (`{ web: true }`): every inline style key here must be reported.
export function BadWeb() {
  return (
    <div>
      <div style={{ color: 'var(--color-text)' }} /> {/* expect: collabo/ui-drift */}
      <div style={{ '--swatch': 'var(--color-primary)', padding: 0 }} /> {/* expect: collabo/ui-drift */}
    </div>
  )
}
