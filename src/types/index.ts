export interface Liceo {
  id: string
  codigo: string
  nombre: string
  region: string
  comuna: string
  latitud: number
  longitud: number
  created_at: string
}

export interface Device {
  id: string
  liceo_id: string
  nombre: string
  codigo: string
  ubicacion?: string
  activo: boolean
  sensores_habilitados?: string[]
  prompt_configuracion?: string | null
  created_at: string
  liceo?: Liceo
}

export interface Reading {
  id: number
  device_id: string
  timestamp: string
  created_at: string
  humedad_suelo?: number
  tension_hidrica?: number
  temperatura?: number
  humedad_aire?: number
  nitrogeno?: number
  fosforo?: number
  potasio?: number
}

export interface SensorMeta {
  key: keyof Omit<Reading, 'id' | 'device_id' | 'timestamp' | 'created_at'>
  label: string
  unit: string
  min: number
  max: number
  optimal: [number, number]
  color: string
  invert?: boolean
  description: string
}

export const SENSORS: SensorMeta[] = [
  { key: 'humedad_suelo',   label: 'Humedad Suelo',   unit: '%',    min: 0,   max: 100,  optimal: [40, 70],   color: '#38bdf8', description: 'Retención de agua en el suelo' },
  { key: 'tension_hidrica', label: 'Tensión Hídrica',  unit: 'kPa',  min: 0,   max: 200,  optimal: [0, 80],    color: '#60a5fa', invert: true, description: 'Disponibilidad de agua para las plantas' },
  { key: 'temperatura',     label: 'Temperatura',      unit: '°C',   min: -10, max: 60,   optimal: [15, 35],   color: '#f87171', description: 'Condición térmica del ambiente' },
  { key: 'humedad_aire',    label: 'Humedad Aire',     unit: '%',    min: 0,   max: 100,  optimal: [40, 80],   color: '#a78bfa', description: 'Humedad relativa del aire' },
  { key: 'nitrogeno',       label: 'Nitrógeno',        unit: 'mg/kg',min: 0,   max: 200,  optimal: [60, 140],  color: '#4ade80', description: 'Nutriente esencial para el crecimiento' },
  { key: 'fosforo',         label: 'Fósforo',          unit: 'mg/kg',min: 0,   max: 100,  optimal: [20, 60],   color: '#fde047', description: 'Nutriente para energía y raíces' },
  { key: 'potasio',         label: 'Potasio',          unit: 'mg/kg',min: 0,   max: 400,  optimal: [100, 250], color: '#fb923c', description: 'Nutriente para resistencia y calidad' },
]
