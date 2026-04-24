type Status = 'live' | 'demo' | 'offline'

interface StatusPillProps { status: Status }

const config: Record<Status, { dot: string; label: string; text: string }> = {
  live:    { dot: 'bg-green animate-pulse_dot', label: 'LIVE',    text: 'text-green' },
  demo:    { dot: 'bg-muted',                   label: 'DEMO',    text: 'text-muted' },
  offline: { dot: 'bg-red',                     label: 'OFFLINE', text: 'text-red'   },
}

export function StatusPill({ status }: StatusPillProps) {
  const { dot, label, text } = config[status]
  return (
    <div className={`flex items-center gap-1.5 font-mono text-[0.67rem] ${text}`}>
      <span className={`w-[7px] h-[7px] rounded-full ${dot}`} />
      {label}
    </div>
  )
}
