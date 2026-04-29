import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface SurveyQuestion {
  id: number
  tipo: 'likert' | 'binaria' | 'abierta'
  pregunta: string
  escala?: number[]
  opciones?: string[]
  categoria: string
}

export interface SurveyTemplate {
  id: string
  nombre: string
  descripcion?: string
  preguntas: SurveyQuestion[]
  tipo: string
}

export interface SurveyWithStudent {
  id: string
  student_id: string
  liceo_id: string
  completed: boolean
  completed_at?: string
  respuestas?: Record<string, unknown>
  template_id?: string
  template?: SurveyTemplate
  student?: {
    nombre: string
  }
}

export function useSurveys(liceoId?: string) {
  const [surveys, setSurveys] = useState<SurveyWithStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!liceoId) {
      setSurveys([])
      return
    }

    const fetchSurveys = async () => {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('surveys')
        .select(`
          id,
          student_id,
          liceo_id,
          completed,
          completed_at,
          respuestas,
          template_id,
          survey_templates:template_id(id, nombre, descripcion, preguntas, tipo),
          students:student_id(nombre)
        `)
        .eq('liceo_id', liceoId)
        .order('completed', { ascending: true })
        .order('completed_at', { ascending: false })

      if (err) {
        console.error('Error fetching surveys:', err)
        setError(err.message)
      } else {
        // Flatten the data
        const flattened = (data || []).map((survey: any) => {
          const studentArray = Array.isArray(survey.students) ? survey.students[0] : survey.students
          const templateArray = Array.isArray(survey.survey_templates) 
            ? survey.survey_templates[0] 
            : survey.survey_templates

          return {
            ...survey,
            student: studentArray as { nombre: string } | undefined,
            template: templateArray ? {
              ...templateArray,
              preguntas: Array.isArray(templateArray.preguntas) 
                ? templateArray.preguntas 
                : JSON.parse(templateArray.preguntas || '[]')
            } : undefined,
          }
        })
        setSurveys(flattened)
      }

      setLoading(false)
    }

    fetchSurveys()
  }, [liceoId])

  const submitSurvey = async (
    surveyId: string,
    updates: { 
      completed?: boolean
      completed_at?: string
      respuestas?: Record<string, unknown>
    }
  ) => {
    try {
      const { data, error: err } = await supabase.rpc('submit_survey_responses', {
        p_survey_id: surveyId,
        p_respuestas: updates.respuestas ?? {},
      })

      if (err) {
        console.error('Error submitting survey:', err)
        setError(err.message)
        return false
      }

      if (data) {
        setSurveys(surveys.map(s => (s.id === surveyId ? { ...s, ...data } : s)))
      }
      return true
    } catch (e) {
      console.error('Unexpected error:', e)
      return false
    }
  }

  const resetSurvey = async (surveyId: string) => {
    try {
      const { data, error: err } = await supabase.rpc('reset_survey_response', {
        p_survey_id: surveyId,
      })

      if (err) {
        console.error('Error resetting survey:', err)
        setError(err.message)
        return false
      }

      if (data) {
        setSurveys(surveys.map(s => (s.id === surveyId ? { ...s, ...data } : s)))
      }

      return true
    } catch (e) {
      console.error('Unexpected error:', e)
      return false
    }
  }

  return { surveys, loading, error, submitSurvey, resetSurvey }
}
