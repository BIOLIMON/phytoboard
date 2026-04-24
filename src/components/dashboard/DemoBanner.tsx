interface DemoBannerProps {
  title?: string
  message?: string
  actionLabel?: string
  onConnect: () => void
}

export function DemoBanner({
  onConnect,
  title = 'Modo demostración — datos simulados en tiempo real',
  message = 'Se activó el fallback local porque la conexión a Supabase no respondió correctamente.',
  actionLabel = 'Conectar Supabase',
}: DemoBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-yellow/10 border border-yellow/30 rounded-xl">
      <div className="min-w-0">
        <p className="text-yellow text-xs font-medium">⚠️ {title}</p>
        <p className="text-muted text-[0.7rem] mt-0.5">{message}</p>
      </div>
      <button
        onClick={onConnect}
        className="flex-shrink-0 text-xs font-medium text-bg bg-yellow rounded px-2.5 py-1 hover:opacity-90 transition-opacity cursor-pointer border-none"
      >
        {actionLabel}
      </button>
    </div>
  )
}
