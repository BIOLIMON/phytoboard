import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Reading } from '../types'

const NTP_SANITY_MS = new Date('2020-01-01').getTime()

// Si el timestamp del device es anterior a 2020, la ESP32 no sincronizó NTP.
// Usamos created_at (cuándo llegó el dato a Supabase) como timestamp efectivo.
function normalize(r: Reading): Reading {
  if (new Date(r.timestamp).getTime() < NTP_SANITY_MS) {
    return { ...r, timestamp: r.created_at }
  }
  return r
}

export function useReadings(deviceId: string | null, hours = 24) {
  const [history, setHistory] = useState<Reading[]>([])
  const [latest, setLatest] = useState<Reading | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!deviceId) return
    setLoading(true)
    const from = new Date(Date.now() - hours * 3_600_000).toISOString()
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('device_id', deviceId)
      .gte('created_at', from)
      .order('created_at', { ascending: true })
    if (error) {
      setError(error.message)
      setHistory([])
      setLatest(null)
      setLoading(false)
      return
    }
    setError(null)
    if (data?.length) {
      const normalized = data.map(normalize)
      setHistory(normalized)
      setLatest(normalized[normalized.length - 1])
    } else {
      setHistory([])
      setLatest(null)
    }
    setLoading(false)
  }, [deviceId, hours])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!deviceId) return
    const channel = supabase
      .channel(`readings-rt-${deviceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'readings', filter: `device_id=eq.${deviceId}` },
        ({ new: r }) => {
          const normalized = normalize(r as Reading)
          setHistory(prev => [...prev, normalized])
          setLatest(normalized)
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [deviceId])

  return { history, latest, loading, error, reload: load }
}
