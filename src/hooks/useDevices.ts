import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Device } from '../types'

export function useDevices(liceoId?: string) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    let query = supabase.from('devices').select('*').order('nombre')
    if (liceoId) query = query.eq('liceo_id', liceoId)
    const { data, error } = await query
    if (error) {
      setError(error.message)
      setDevices([])
      setLoading(false)
      return
    }
    setError(null)
    setDevices(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [liceoId])

  return { devices, loading, error, reload: load }
}
