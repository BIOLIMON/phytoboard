import { StatusPill } from '../ui/StatusPill'
import { Button } from '../ui/Button'

type Status = 'live' | 'demo' | 'offline'

interface TopbarProps {
  status: Status
  isAdmin: boolean
  onAdminClick: () => void
}

export function Topbar({ status, isAdmin, onAdminClick }: TopbarProps) {
  return (
    <header className="col-span-2 flex items-center gap-3.5 px-5 bg-surface border-b border-border z-10">
      <a href="/" className="flex items-center gap-2 no-underline text-inherit flex-shrink-0">
        <img src="/assets/logo-phytolearning.png" alt="PhytoLearning" className="h-7" />
        <span className="font-mono text-[0.72rem] text-muted">PhytoBoard</span>
      </a>
      <div className="w-px h-5 bg-border flex-shrink-0" />
      <StatusPill status={status} />
      <div className="flex-1" />
      <Button variant="ghost" onClick={onAdminClick} className="text-xs">
        {isAdmin ? '🔓 Cerrar sesión' : '🔒 Admin'}
      </Button>
    </header>
  )
}
