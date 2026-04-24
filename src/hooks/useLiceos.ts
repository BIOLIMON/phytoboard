import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Liceo } from '../types'

export function useLiceos() {
  const [liceos, setLiceos] = useState<Liceo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('liceos')
      .select('*')
      .order('nombre')
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
          setLiceos([])
          setLoading(false)
          return
        }
        setError(null)
        setLiceos(data ?? [])
        setLoading(false)
      })
  }, [])

  return { liceos, loading, error }
}
