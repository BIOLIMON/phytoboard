import { supabase } from '../lib/supabase'
import type { Device } from '../types'

export interface DeviceUpdateInput {
  nombre: string
  ubicacion: string
  sensores_habilitados: string[]
  activo: boolean
  prompt_configuracion: string | null
}

export async function updateDevice(deviceId: string, input: DeviceUpdateInput) {
  const { data, error } = await supabase
    .from('devices')
    .update({
      nombre: input.nombre,
      ubicacion: input.ubicacion || null,
      sensores_habilitados: input.sensores_habilitados,
      activo: input.activo,
      prompt_configuracion: input.prompt_configuracion || null,
    })
    .eq('id', deviceId)
    .select('*')
    .single<Device>()

  if (error) throw error
  return data
}