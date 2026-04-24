interface LiceoCardProps {
  nombre: string
  region: string
  comuna: string
  instagram: string
  color: string
}

export function LiceoCard({ nombre, region, comuna, instagram, color }: LiceoCardProps) {
  return (
    <a
      href={instagram}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-surface border border-border rounded-2xl p-6 no-underline transition-all duration-300 hover:-translate-y-1"
      style={{ '--hover-color': color } as React.CSSProperties}
      onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
    >
      <p className="font-mono text-[0.6rem] text-muted tracking-[0.15em] uppercase mb-2">{region}</p>
      <h3 className="text-base font-bold text-ph-text mb-1 group-hover:text-white transition-colors">{nombre}</h3>
      <p className="text-muted text-sm">{comuna}</p>
      <p className="mt-4 font-mono text-xs transition-colors" style={{ color }}>
        Instagram →
      </p>
    </a>
  )
}
