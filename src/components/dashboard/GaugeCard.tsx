import type { SensorMeta } from '../../types'

interface GaugeProps {
  meta: SensorMeta
  value: number | null | undefined
}

function Gauge({ meta, value }: GaugeProps) {
  const R = 42
  const circumference = 2 * Math.PI * R
  const TOTAL_DEG = 270
  const arcLen = circumference * (TOTAL_DEG / 360)

  let fill = 0
  if (value != null) {
    const clamped = Math.max(meta.min, Math.min(meta.max, value))
    fill = ((clamped - meta.min) / (meta.max - meta.min)) * arcLen
    if (meta.invert) fill = arcLen - fill
  }

  // rotate so arc starts at 135°
  const startAngle = 135
  const strokeDash = `${fill} ${circumference}`
  const rotation = `rotate(${startAngle}, 50, 50)`

  // Status dot
  let dotColor = '#5a7a96'
  if (value != null) {
    const [lo, hi] = meta.optimal
    dotColor = value >= lo && value <= hi ? '#4ade80' : '#fb923c'
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Track */}
      <circle
        cx="50" cy="50" r={R}
        fill="none"
        stroke="#1e3347"
        strokeWidth="8"
        strokeDasharray={`${arcLen} ${circumference}`}
        strokeLinecap="round"
        transform={rotation}
      />
      {/* Fill */}
      <circle
        cx="50" cy="50" r={R}
        fill="none"
        stroke={meta.color}
        strokeWidth="8"
        strokeDasharray={strokeDash}
        strokeLinecap="round"
        transform={rotation}
        style={{ filter: `drop-shadow(0 0 6px ${meta.color}88)`, transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* Status dot */}
      <circle cx="50" cy="85" r="3.5" fill={dotColor} />
    </svg>
  )
}

export function GaugeCard({ meta, value }: GaugeProps) {
  const display = value != null ? value.toFixed(1) : '—'

  return (
    <div className="bg-surface rounded-xl p-3 flex flex-col items-center gap-1 border border-border">
      <div className="w-24 h-24">
        <Gauge meta={meta} value={value} />
      </div>
      <p className="font-mono text-xl font-bold text-ph-text leading-none">{display}</p>
      <p className="font-mono text-[0.6rem] text-muted">{meta.unit}</p>
      <p className="text-xs text-muted text-center leading-tight">{meta.label}</p>
    </div>
  )
}
