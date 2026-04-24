const INSTITUTIONS = [
  {
    name: 'PhytoLearning',
    logo: '/assets/logo-phytolearning.png',
    url:  'https://phytolearning.cl',
  },
  {
    name: 'ANID Milenio',
    logo: '/assets/logo-anid.png',
    url:  'https://anid.cl',
  },
]

export function Institutions() {
  return (
    <section id="instituciones" className="py-16 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-mono text-xs text-muted tracking-[0.18em] uppercase mb-8">Instituciones</p>
        <div className="flex flex-wrap items-center justify-center gap-10">
          {INSTITUTIONS.map(inst => (
            <a
              key={inst.name}
              href={inst.url}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <img src={inst.logo} alt={inst.name} className="h-24 object-contain" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
