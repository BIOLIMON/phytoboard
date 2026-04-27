import { Link } from 'react-router-dom'

export function Hero() {
  return (
    <section id="home" className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden">
      {/* Grid radial fade bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#1e3347 1px, transparent 1px), linear-gradient(90deg, #1e3347 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 80%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl">
        {/* Logo */}
        <img
          src="/assets/logo-phytolearning.png"
          alt="PhytoLearning"
          className="w-24 h-24 object-contain animate-float"
        />

        {/* Tag */}
        <span className="font-mono text-xs text-muted tracking-[0.18em] uppercase border border-border px-3 py-1 rounded-full">
          Núcleo Milenio Phytolearning
        </span>

        {/* Heading */}
        <h1
          className="font-bold leading-tight"
          style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #4ade80 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PhytoBoard
          </span>
        </h1>

        <p className="text-muted text-base max-w-xl leading-relaxed">
          Sistema de monitoreo ambiental en tiempo real para estudiantes de liceos agrícolas.
          Datos de sensores ESP32 visualizados desde el campo.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-xl font-bold text-sm text-bg no-underline transition-all duration-200 hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #4ade80, #38bdf8)',
              boxShadow: '0 0 30px oklch(74% 0.22 142 / 0.35)',
            }}
          >
            Ver Dashboard →
          </Link>
          <a
            href="#about"
            className="px-6 py-3 rounded-xl font-medium text-sm text-muted no-underline border border-border hover:border-border2 hover:text-ph-text transition-all duration-200 bg-surface"
          >
            Conocer más
          </a>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mt-4">
          {[
            { value: '+60', label: 'Estudiantes' },
            { value: '2',   label: 'Liceos' },
            { value: '18',  label: 'Kits ESP32' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-mono text-2xl font-bold text-green">{s.value}</p>
              <p className="text-muted text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
