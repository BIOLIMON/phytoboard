const STEPS = [
  { icon: '🌱', label: 'Campo' },
  { icon: '📡', label: 'Sensores' },
  { icon: '🔌', label: 'ESP32' },
  { icon: '☁️', label: 'Supabase' },
  { icon: '📊', label: 'PhytoBoard' },
]

export function Pipeline() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-xs text-muted tracking-[0.18em] uppercase text-center mb-8">
          Pipeline tecnológico
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-2 bg-surface border border-border rounded-xl px-5 py-4 min-w-[80px]">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs text-muted font-mono">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <span className="text-border2 text-lg font-mono">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
