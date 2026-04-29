import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Student } from '../types'

export function useStudents(liceoId?: string) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!liceoId) {
      setStudents([])
      return
    }

    const fetchStudents = async () => {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('students')
        .select('*')
        .eq('liceo_id', liceoId)
        .order('nombre', { ascending: true })

      if (err) {
        console.error('Error fetching students:', err)
        setError(err.message)
      } else {
        setStudents(data || [])
      }

      setLoading(false)
    }

    fetchStudents()
  }, [liceoId])

  return { students, loading, error }
}
