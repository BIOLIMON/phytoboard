interface StudentWithSurvey {
  id: string
  nombre: string
  surveyCompleted: boolean
}

interface StudentSurveyListProps {
  students: StudentWithSurvey[]
  liceoNombre: string
  onBack: () => void
  onAdminClick: () => void
  onSelectStudent: (surveyId: string) => void
}

export function StudentSurveyList({ students, liceoNombre, onBack, onAdminClick, onSelectStudent }: StudentSurveyListProps) {
  const completedCount = students.filter(s => s.surveyCompleted).length
  const completionPercentage = students.length > 0
    ? Math.round((completedCount / students.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-gray-700 font-medium text-sm"
          >
            ← Volver
          </button>

          <button
            onClick={onAdminClick}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-slate-900 text-white hover:bg-slate-800 transition font-medium text-sm"
          >
            Admin
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{liceoNombre}</h1>
          <p className="text-gray-600">Gestión de encuestas de alumnos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Total de Alumnos</p>
            <p className="text-4xl font-bold text-gray-900">{students.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Encuestas Completadas</p>
            <p className="text-4xl font-bold text-green-600">{completedCount}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Tasa de Completación</p>
            <p className="text-4xl font-bold text-blue-600">{completionPercentage}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Progreso General</h2>
            <span className="text-sm text-gray-600">{completedCount}/{students.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Alumnos</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {students.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No hay alumnos registrados
              </div>
            ) : (
              students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => onSelectStudent(student.id)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{student.nombre}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {student.surveyCompleted ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <span className="text-xl">✓</span>
                        <span className="text-sm font-medium">Completada</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <span className="text-xl">⏱</span>
                        <span className="text-sm font-medium">Pendiente</span>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
