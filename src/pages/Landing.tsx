import { Link } from 'react-router-dom'
import { Hero }         from '../components/landing/Hero'
import { About }        from '../components/landing/About'
import { Pipeline }     from '../components/landing/Pipeline'
import { LiceoCard }    from '../components/landing/LiceoCard'
import { SensorGrid }   from '../components/landing/SensorGrid'
import { Institutions } from '../components/landing/Institutions'
import { Footer }       from '../components/layout/Footer'

const LICEOS = [
  {
    nombre:    'Liceo Menesianos',
    region:    'Región Metropolitana',
    comuna:    'Melipilla',
    instagram: 'https://instagram.com/',
    color:     '#4ade80',
  },
  {
    nombre:    'Liceo El Carmen',
    region:    "Región O'Higgins",
    comuna:    'San Fernando',
    instagram: 'https://instagram.com/',
    color:     '#38bdf8',
  },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-bg text-ph-text">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-bg/80 border-b border-border backdrop-blur-[12px]">
        <a href="#home" className="flex items-center gap-2 no-underline text-inherit">
          <img src="/assets/logo-phytolearning.png" alt="PhytoLearning" className="h-7" />
          <span className="font-mono text-xs text-muted hidden sm:block">PhytoBoard</span>
        </a>
        <div className="flex items-center gap-4 text-sm">
          <a href="#about"        className="text-muted hover:text-ph-text transition-colors no-underline hidden md:block">Sobre</a>
          <a href="#liceos"       className="text-muted hover:text-ph-text transition-colors no-underline hidden md:block">Liceos</a>
          <a href="#sensors"      className="text-muted hover:text-ph-text transition-colors no-underline hidden md:block">Sensores</a>
          <a href="#instituciones" className="text-muted hover:text-ph-text transition-colors no-underline hidden md:block">Instituciones</a>
          <Link
            to="/dashboard"
            className="px-4 py-1.5 rounded-lg font-medium text-bg no-underline text-sm transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #4ade80, #38bdf8)' }}
          >
            Ver Dashboard
          </Link>
        </div>
      </nav>

      {/* Sections */}
      <main className="pt-14">
        <Hero />
        <About />
        <Pipeline />

        {/* Liceos */}
        <section id="liceos" className="py-20 px-6 max-w-4xl mx-auto">
          <p className="font-mono text-xs text-muted tracking-[0.18em] uppercase mb-2">Liceos participantes</p>
          <h2
            className="font-bold text-ph-text mb-8"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}
          >
            Dos liceos, un campo
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {LICEOS.map(l => <LiceoCard key={l.nombre} {...l} />)}
          </div>
        </section>

        <SensorGrid />
        <Institutions />

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-xl mx-auto text-center bg-surface border border-border rounded-3xl p-10">
            <h2 className="text-xl font-bold text-ph-text mb-3">Ver datos en tiempo real</h2>
            <p className="text-muted text-sm mb-6">
              Accede al dashboard de monitoreo ambiental con lecturas en vivo desde los sensores ESP32.
            </p>
            <Link
              to="/dashboard"
              className="px-8 py-3 rounded-xl font-bold text-sm text-bg no-underline inline-block transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #4ade80, #38bdf8)',
                boxShadow: '0 0 30px oklch(74% 0.22 142 / 0.35)',
              }}
            >
              Abrir PhytoBoard →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
