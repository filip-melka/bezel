// Bezel mark: three stacked rounded rectangles, back to front, light grey →
// mid grey → tint blue, bottoms aligned, each one taller and further right.
// The same geometry is used for the favicon (public/favicon.svg, tile variant).

type MarkProps = { size?: number; onDark?: boolean; className?: string }

export function LogoMark({ size = 20, onDark = false, className }: MarkProps) {
  const back = onDark ? '#48484a' : '#d1d1d6'
  const mid = '#8e8e93'
  return (
    <svg width={size} height={size} viewBox="0 0 66 66" className={className} aria-hidden focusable="false">
      <rect x="0" y="10" width="31" height="56" rx="8" fill={back} />
      <rect x="15" y="5" width="31" height="61" rx="8" fill={mid} />
      <rect x="31" y="0" width="35" height="66" rx="9" fill="var(--tint, #0a7aff)" />
    </svg>
  )
}

export function LogoTile({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden focusable="false">
      <rect width="96" height="96" rx="22" fill="#1c1c1e" />
      <g transform="translate(25 25) scale(0.697)">
        <rect x="0" y="10" width="31" height="56" rx="8" fill="#48484a" />
        <rect x="15" y="5" width="31" height="61" rx="8" fill="#8e8e93" />
        <rect x="31" y="0" width="35" height="66" rx="9" fill="#0a7aff" />
      </g>
    </svg>
  )
}

export function Lockup({ size = 20 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.45) }}>
      <LogoMark size={size} />
      <span style={{ fontSize: Math.round(size * 0.8), fontWeight: 700, letterSpacing: '-0.01em' }}>Bezel</span>
    </span>
  )
}
