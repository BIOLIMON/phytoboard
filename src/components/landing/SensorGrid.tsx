import { SENSORS } from '../../types'

export function SensorGrid() {
  return (
    <section id="sensors" className="py-20 px-6 max-w-6xl mx-auto">
      <p className="font-mono text-xs text-muted tracking-[0.18em] uppercase mb-2">Variables monitoreadas</p>
      <h2
        className="font-bold text-ph-text mb-10"
        style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}
      >
        7 parámetros ambientales
      </h2>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {SENSORS.map(s => (
          <div key={s.key} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ph-text">{s.label}</h3>
              <span className="font-mono text-[0.6rem] text-muted">{s.unit}</span>
            </div>
            <div className="h-1 rounded-full bg-surface2 overflow-hidden">
              <div
                className="h-full rounded-full w-3/5"
                style={{ background: s.color, boxShadow: `0 0 6px ${s.color}88` }}
              />
            </div>
            <p className="text-muted text-xs">
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
