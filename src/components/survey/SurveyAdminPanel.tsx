interface SurveyAdminRow {
  id: string
  nombre: string
  completed: boolean
}

interface SurveyAdminPanelProps {
  students: SurveyAdminRow[]
  liceoNombre: string
  onBack: () => void
  onResetSurvey: (surveyId: string) => Promise<void>
}

export function SurveyAdminPanel({ students, liceoNombre, onBack, onResetSurvey }: SurveyAdminPanelProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <button
              onClick={onBack}
              className="mb-4 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition text-white text-sm"
            >
              ← Volver a alumnos
            </button>
            <h1 className="text-3xl font-bold mb-2">Administración de encuestas</h1>
            <p className="text-white/70">{liceoNombre}</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="font-semibold">Reiniciar encuestas</h2>
            <p className="text-sm text-white/60">Solo reinicia encuestas completadas para permitir que el alumno la responda de nuevo.</p>
          </div>

          <div className="divide-y divide-white/10">
            {students.length === 0 ? (
              <div className="px-6 py-12 text-center text-white/60">No hay alumnos disponibles</div>
            ) : (
              students.map((student) => (
                <div key={student.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{student.nombre}</p>
                    <p className="text-sm text-white/60">Estado: {student.completed ? 'Completada' : 'Pendiente'}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onResetSurvey(student.id)}
                    disabled={!student.completed}
                    className="px-4 py-2 rounded-lg font-semibold transition border border-cyan-400/30 bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/40 disabled:border-white/10"
                  >
                    Reiniciar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
