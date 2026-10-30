// Web mode: an inline style may set CSS variables, nothing else.
export function GoodWeb({ progress }: { progress: number }) {
  return <div style={{ '--progress': String(progress), '--swatch': 'var(--color-primary)' }} />
}
