type SectionCurveProps = {
  edge?: 'top' | 'bottom'
  className?: string
}

export default function SectionCurve({ edge = 'bottom', className = '' }: SectionCurveProps) {
  return <div className={`section-curve section-curve--${edge} ${className}`} aria-hidden="true">
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" focusable="false">
      <path opacity=".1" d="M0 32C340 111 890-18 1440 40V120H0Z" />
      <path opacity=".18" d="M0 48C360 124 940 4 1440 54V120H0Z" />
      <path d="M0 66C390 140 940 25 1440 73V120H0Z" />
    </svg>
  </div>
}
