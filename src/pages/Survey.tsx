import { useEffect, useState } from 'react'
import { LiceoSelectionModal } from '../components/survey/LiceoSelectionModal'
import { SurveyAdminPanel } from '../components/survey/SurveyAdminPanel'
import { StudentSurveyList } from '../components/survey/StudentSurveyList'
import { SurveyForm } from '../components/survey/SurveyForm'
import { LoginModal } from '../components/modals/LoginModal'
import { useLiceos } from '../hooks/useLiceos'
import { useSurveys } from '../hooks/useSurveys'
import { useAuth } from '../hooks/useAuth'

interface StudentWithSurvey {
  id: string
  nombre: string
  surveyCompleted: boolean
}

const LICEO_CODES: Record<string, string> = {
  menesiano: 'MENESIANO',
  carmen: 'ELCARMEN',
}

const LICEOS: Record<string, { nombre: string }> = {
  menesiano: { nombre: 'Liceo Menesiano Culipran' },
  carmen: { nombre: 'El Carmen' },
}

export function Survey() {
  const [selectedLiceo, setSelectedLiceo] = useState<string | null>(null)
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [adminMode, setAdminMode] = useState(false)
  const [adminLoginOpen, setAdminLoginOpen] = useState(false)
  const { liceos, loading: loadingLiceos, error: liceosError } = useLiceos()
  const { isAdmin } = useAuth()

  const selectedCode = selectedLiceo ? LICEO_CODES[selectedLiceo] : undefined
  const matchedLiceo = selectedLiceo
    ? liceos.find(liceo => {
        const byCode = selectedCode && liceo.codigo?.toUpperCase() === selectedCode
        const byName = selectedLiceo === 'menesiano'
          ? liceo.nombre.toLowerCase().includes('menesiano')
          : liceo.nombre.toLowerCase().includes('carmen')
        return Boolean(byCode || byName)
      })
    : undefined

  const liceoId = matchedLiceo?.id
  const { surveys, loading, error, submitSurvey, resetSurvey } = useSurveys(liceoId)

  const students: StudentWithSurvey[] = surveys.map(survey => ({
    id: survey.id,
    nombre: survey.student?.nombre || 'N/A',
    surveyCompleted: survey.completed,
  }))

  const adminRows = surveys.map(survey => ({
    id: survey.id,
    nombre: survey.student?.nombre || 'N/A',
    completed: survey.completed,
  }))

  const selectedSurvey = selectedSurveyId
    ? surveys.find(survey => survey.id === selectedSurveyId)
    : undefined

  const handleSubmitSurvey = async (surveyId: string, answers: Record<string, string | number>) => {
    const ok = await submitSurvey(surveyId, {
      completed: true,
      completed_at: new Date().toISOString(),
      respuestas: answers,
    })

    if (!ok) {
      throw new Error('No se pudo guardar')
    }

    setSelectedSurveyId(null)
  }

  const handleResetSurvey = async (surveyId: string) => {
    if (!isAdmin) {
      setAdminLoginOpen(true)
      return
    }

    const confirmed = window.confirm('¿Reiniciar esta encuesta? El alumno podrá responderla nuevamente.')
    if (!confirmed) {
      return
    }

    const ok = await resetSurvey(surveyId)
    if (!ok) {
      return
    }

    setAdminMode(false)
  }

  const handleAdminClick = () => {
    if (isAdmin) {
      setAdminMode(true)
      return
    }

    setAdminLoginOpen(true)
  }

  useEffect(() => {
    if (isAdmin && adminLoginOpen) {
      setAdminLoginOpen(false)
      setAdminMode(true)
    }
  }, [isAdmin, adminLoginOpen])

  if (!selectedLiceo) {
    return <LiceoSelectionModal onSelect={setSelectedLiceo} />
  }

  if (loadingLiceos || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Cargando alumnos...</p>
        </div>
      </div>
    )
  }

  if (liceosError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-semibold mb-2">No se pudo cargar la lista de liceos</p>
          <p className="text-sm text-gray-600">{liceosError}</p>
          <button
            onClick={() => setSelectedLiceo(null)}
            className="mt-4 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-gray-700"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (selectedLiceo && !matchedLiceo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-700 font-semibold mb-2">No se encontro el liceo en base de datos</p>
          <p className="text-sm text-gray-600">Verifica el campo codigo/nombre del liceo en Supabase.</p>
          <button
            onClick={() => setSelectedLiceo(null)}
            className="mt-4 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-gray-700"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-semibold mb-2">No se pudo cargar la encuesta</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button
            onClick={() => setSelectedLiceo(null)}
            className="mt-4 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-gray-700"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (selectedSurvey) {
    return (
      <SurveyForm
        survey={selectedSurvey}
        onBack={() => setSelectedSurveyId(null)}
        onSubmit={handleSubmitSurvey}
      />
    )
  }

  if (adminMode) {
    return (
      <>
        <SurveyAdminPanel
          students={adminRows}
          liceoNombre={LICEOS[selectedLiceo]?.nombre || 'Liceo'}
          onBack={() => setAdminMode(false)}
          onResetSurvey={handleResetSurvey}
        />
        <LoginModal
          open={adminLoginOpen}
          onClose={() => setAdminLoginOpen(false)}
        />
      </>
    )
  }

  return (
    <>
      <StudentSurveyList
        students={students}
        liceoNombre={LICEOS[selectedLiceo]?.nombre || 'Liceo'}
        onBack={() => {
          setSelectedSurveyId(null)
          setSelectedLiceo(null)
        }}
        onAdminClick={handleAdminClick}
        onSelectStudent={setSelectedSurveyId}
      />
      <LoginModal
        open={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
      />
    </>
  )
}
