const CARDS = [
  { title: 'Bloque I',        desc: 'Fundamentos de sensórica, electricidad y programación con ESP32 en MicroPython.' },
  { title: 'Bloque II',       desc: 'Construcción de kits de sensores para monitoreo de suelo, temperatura y NPK.' },
  { title: 'PhytoBoard',      desc: 'Dashboard de visualización en tiempo real con datos almacenados en Supabase.' },
  { title: 'Transferencia',   desc: 'Publicación de resultados y apertura de datos a la comunidad científica.' },
]

export function About() {
  return (
    <section id="about" className="py-20 px-6 max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div>
          <h2
            className="font-bold text-ph-text mb-4"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}
          >
            Ciencia de datos para la agricultura
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            Phytolearning es un Núcleo Milenio que conecta la investigación en resiliencia vegetal con la educación técnica.
            En este contexto, PhytoLink corresponde al PME (proyecto de vinculación con el medio) que se desarrolla dentro del núcleo.
            Estudiantes de 16–18 años de dos liceos agrícolas aprenden a construir y programar sus propios sistemas de monitoreo ambiental.
          </p>
          <p className="text-muted leading-relaxed">
            Los datos capturados desde el campo alimentan PhytoBoard, una plataforma de visualización que hace accesibles
            los patrones de humedad, temperatura y nutrientes del suelo en tiempo real.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CARDS.map(c => (
            <div key={c.title} className="bg-surface border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-green mb-2">{c.title}</h3>
              <p className="text-muted text-xs leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
