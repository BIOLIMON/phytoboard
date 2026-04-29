import { useMemo, useState } from 'react'
import type { SurveyWithStudent } from '../../hooks/useSurveys'

type Answers = Record<string, string | number>

interface SurveyFormProps {
  survey: SurveyWithStudent
  onBack: () => void
  onSubmit: (surveyId: string, answers: Answers) => Promise<void>
}

export function SurveyForm({ survey, onBack, onSubmit }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Answers>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const questions = useMemo(() => survey.template?.preguntas ?? [], [survey.template])

  const isCompleted = survey.completed

  const isValid = useMemo(() => {
    if (isCompleted) return false
    if (questions.length === 0) return false

    return questions.every((question) => {
      const key = `pregunta_${question.id}`
      const value = answers[key]

      if (question.tipo === 'abierta') {
        return typeof value === 'string' && value.trim().length > 0
      }

      return value !== undefined && value !== ''
    })
  }, [answers, isCompleted, questions])

  const setAnswer = (questionId: number, value: string | number) => {
    const key = `pregunta_${questionId}`
    setAnswers(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  const handleSubmit = async () => {
    if (!isValid || isCompleted) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      await onSubmit(survey.id, answers)
    } catch {
      setError('No se pudo guardar la encuesta. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-gray-700 font-medium text-sm"
          >
            ← Volver a alumnos
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Encuesta de Línea Base</h1>
          <p className="text-gray-600">Alumno: {survey.student?.nombre ?? 'Alumno'}</p>

          {isCompleted && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Esta encuesta ya fue completada y no se puede editar nuevamente.
            </div>
          )}
        </div>

        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-gray-900 mb-2">
                {question.id}. {question.pregunta}
              </p>
              <p className="text-xs text-gray-500 mb-4">Categoría: {question.categoria}</p>

              {question.tipo === 'likert' && (
                <div className="flex flex-wrap gap-2">
                  {(question.escala ?? [1, 2, 3, 4, 5]).map((value) => {
                    const selected = answers[`pregunta_${question.id}`] === value
                    return (
                      <button
                        key={`${question.id}-${value}`}
                        type="button"
                        disabled={isCompleted}
                        onClick={() => setAnswer(question.id, value)}
                        className={`h-10 w-10 rounded-lg border text-sm font-semibold transition ${
                          selected
                            ? 'border-green-700 bg-green-600 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        } ${isCompleted ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {value}
                      </button>
                    )
                  })}
                </div>
              )}

              {question.tipo === 'binaria' && (
                <div className="flex flex-wrap gap-3">
                  {(question.opciones ?? ['Sí', 'No']).map((option) => {
                    const selected = answers[`pregunta_${question.id}`] === option
                    return (
                      <button
                        key={`${question.id}-${option}`}
                        type="button"
                        disabled={isCompleted}
                        onClick={() => setAnswer(question.id, option)}
                        className={`px-4 py-2 rounded-lg border text-sm font-semibold transition ${
                          selected
                            ? 'border-blue-700 bg-blue-600 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        } ${isCompleted ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              )}

              {question.tipo === 'abierta' && (
                <textarea
                  rows={4}
                  disabled={isCompleted}
                  value={String(answers[`pregunta_${question.id}`] ?? '')}
                  onChange={(event) => setAnswer(question.id, event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  placeholder="Escribe tu respuesta"
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || saving || isCompleted}
            className="px-6 py-3 rounded-lg font-semibold transition bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-600"
          >
            {saving ? 'Guardando...' : 'Enviar encuesta'}
          </button>
        </div>
      </div>
    </div>
  )
}
