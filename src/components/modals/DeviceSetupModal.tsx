import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { SENSORS } from '../../types'
import type { Device, Liceo } from '../../types'

interface DeviceSetupModalProps {
  open: boolean
  device: Device | null
  liceo: Liceo | null
  isAdmin?: boolean
  onClose: () => void
  onSave: (payload: {
    nombre: string
    ubicacion: string
    sensores_habilitados: string[]
    prompt_configuracion: string
    activo: boolean
  }) => Promise<void>
  onReset?: () => Promise<void>
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function buildPrompt(params: {
  liceoName: string
  deviceCode: string
  deviceName: string
  ubicacion: string
  wifiSsid: string
  wifiPassword: string
  sensores: string[]
}) {
  const sensorsText = params.sensores.length ? params.sensores.join(', ') : 'sin sensores asignados'

  const wifiBlock = params.wifiSsid
    ? `WIFI_SSID = "${params.wifiSsid}"\nWIFI_PASSWORD = "${params.wifiPassword || ''}"`
    : 'WIFI_SSID = ""  # el alumno debe completarlo\nWIFI_PASSWORD = ""'

  return `# Contexto del dispositivo
# =========================
# Plataforma: MicroPython (ESP32)
# Liceo: ${params.liceoName}
# Dispositivo: ${params.deviceName}
# Codigo fijo (inmutable): ${params.deviceCode}
# Ubicacion: ${params.ubicacion || 'sin definir'}
# Sensores fisicamente presentes: ${sensorsText}

# Tarea
# =====
# Implementar la capa de envio de datos desde una ESP32 con MicroPython a Supabase.
# Trabaja sobre el sistema de captura ya existente; no reemplaces la logica de
# lectura de sensores, solo agrega la capa de conexion y envio.

# Credenciales (hardcodear en el script)
# =======================================
SUPABASE_URL = "${SUPABASE_URL}"
SUPABASE_ANON_KEY = "${SUPABASE_ANON_KEY}"
DEVICE_CODE = "${params.deviceCode}"  # inmutable, no cambiar
${wifiBlock}

# Librerias necesarias (MicroPython)
# ====================================
# - network     : gestion WiFi y modo AP (incluida en MicroPython)
# - ntptime     : sincronizacion NTP (incluida en MicroPython)
# - urequests   : HTTP client (instalar con mip o upip si no esta disponible)
# - usocket     : servidor TCP para el dashboard AP (incluida en MicroPython)
# - ujson       : serializacion JSON (incluida en MicroPython)
# - utime / time: manejo de tiempo (incluida en MicroPython)

# Conexion WiFi
# =============
import network, utime

def conectar_wifi(ssid, password, intentos=3, timeout=15):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(ssid, password)
    for _ in range(timeout):
        if wlan.isconnected():
            return True
        utime.sleep(1)
    return False

# Hora: NTP para Chile/Santiago
# ==============================
# Intentar servidores NTP en orden: cl.pool.ntp.org primero (servidor chileno),
# luego south-america.pool.ntp.org y pool.ntp.org como fallback.
# MicroPython usa ntptime que sincroniza el RTC interno con UTC.
# Offset Chile/Santiago: UTC-4 (horario de verano, octubre-marzo)
#                        UTC-3 (horario de invierno, abril-septiembre)
# Para simplicidad usar offset fijo de -4 horas y ajustar si es necesario.

import ntptime

CHILE_OFFSET_SEC = -4 * 3600  # UTC-4 horario de verano

NTP_SERVERS = ["cl.pool.ntp.org", "south-america.pool.ntp.org", "pool.ntp.org"]

def sincronizar_ntp():
    for server in NTP_SERVERS:
        try:
            ntptime.host = server
            ntptime.settime()  # sincroniza RTC con UTC
            break
        except:
            continue

def validar_anno():
    """Retorna False si el RTC no esta sincronizado (año < 2026)."""
    t = utime.localtime()
    return t[0] >= 2026

def timestamp_utc_iso():
    """Formato ISO 8601 UTC para enviar a Supabase."""
    t = utime.gmtime()
    return "{:04d}-{:02d}-{:02d}T{:02d}:{:02d}:{:02d}Z".format(*t[:6])

def timestamp_local_chile():
    """Hora local Chile (UTC-4) para mostrar en dashboard AP."""
    epoch = utime.time() + CHILE_OFFSET_SEC
    t = utime.localtime(epoch)
    return "{:02d}/{:02d}/{:04d} {:02d}:{:02d}:{:02d}".format(t[2],t[1],t[0],t[3],t[4],t[5])

# Protocolo de envio ESP32 → Supabase
# =====================================
# Endpoint RPC que resuelve el device_id a partir del device_code.
# Usar urequests.post() con HTTPS (puerto 443).
# Sensores ausentes fisicamente: enviar como None (se serializa como null en JSON).
# Todos los campos deben estar presentes en cada payload.

import urequests, ujson

HEADERS = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": "Bearer " + SUPABASE_ANON_KEY,
}

def enviar_lectura(humedad_suelo=None, tension_hidrica=None, temperatura=None,
                   humedad_aire=None, nitrogeno=None, fosforo=None, potasio=None):
    if not validar_anno():
        print("NTP no sincronizado, esperando...")
        return False
    payload = {
        "p_device_code": DEVICE_CODE,
        "p_timestamp": timestamp_utc_iso(),
        "p_humedad_suelo": humedad_suelo,
        "p_tension_hidrica": tension_hidrica,
        "p_temperatura": temperatura,
        "p_humedad_aire": humedad_aire,
        "p_nitrogeno": nitrogeno,
        "p_fosforo": fosforo,
        "p_potasio": potasio,
    }
    try:
        r = urequests.post(
            SUPABASE_URL + "/rest/v1/rpc/insert_reading_by_device_code",
            headers=HEADERS,
            data=ujson.dumps(payload)
        )
        ok = r.status_code == 200
        r.close()
        return ok
    except Exception as e:
        print("Error envio:", e)
        return False

# Modo AP (fallback sin WiFi)
# ============================
# Si no hay conexion WiFi, levantar un Access Point con un dashboard local
# que muestre las ultimas lecturas en tiempo real.
# Al recuperar WiFi, reconectar y retomar el envio a Supabase.

import usocket

AP_SSID = "PhytoBoard-${params.deviceCode}"
AP_PASSWORD = "phytolink"

ultima_lectura = {}

def html_dashboard():
    sensores_html = "".join(
        "<tr><td>{}</td><td>{}</td></tr>".format(k, v if v is not None else "—")
        for k, v in ultima_lectura.items() if k not in ("timestamp",)
    )
    return """<!DOCTYPE html><html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="10">
<title>PhytoBoard</title>
<style>body{{background:#0d1117;color:#e6edf3;font-family:monospace;padding:20px}}
h2{{color:#4ade80}}table{{width:100%;border-collapse:collapse}}
td{{padding:8px;border-bottom:1px solid #30363d}}
.offline{{color:#f87171;font-size:.8rem}}</style></head>
<body><h2>PhytoBoard — {device}</h2>
<p><code>{code}</code></p>
<p class="offline">● Sin conexion a internet</p>
<p>Ultima lectura: {ts}</p>
<table>{rows}</table></body></html>""".format(
        device="${params.deviceName}",
        code="${params.deviceCode}",
        ts=ultima_lectura.get("timestamp", "—"),
        rows=sensores_html
    )

def iniciar_ap():
    ap = network.WLAN(network.AP_IF)
    ap.active(True)
    ap.config(essid=AP_SSID, password=AP_PASSWORD)
    servidor = usocket.socket()
    servidor.bind(("", 80))
    servidor.listen(1)
    servidor.settimeout(1)
    return ap, servidor

def atender_peticion(servidor):
    try:
        conn, _ = servidor.accept()
        conn.recv(1024)
        body = html_dashboard()
        conn.send("HTTP/1.1 200 OK\\r\\nContent-Type: text/html\\r\\n\\r\\n" + body)
        conn.close()
    except OSError:
        pass

# Reglas fijas
# ============
# - DEVICE_CODE es inmutable: no lo leer de archivo ni hacerlo configurable.
# - No usar datos demo ni mocks.
# - Todos los campos de readings presentes en cada payload (None para ausentes).
# - Intervalo de envio recomendado: cada 10 minutos (utime.sleep(600)).`
}

export function DeviceSetupModal({ open, device, liceo, isAdmin, onClose, onSave, onReset }: DeviceSetupModalProps) {
  const [nombre, setNombre] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [wifiSsid, setWifiSsid] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedSensors, setSelectedSensors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    if (!device) return
    setNombre(device.nombre ?? '')
    setUbicacion(device.ubicacion ?? '')
    setSelectedSensors(device.sensores_habilitados ?? [])
    setConfirmReset(false)
  }, [device])

  const handleReset = async () => {
    if (!onReset) return
    setResetting(true)
    try {
      await onReset()
      setConfirmReset(false)
      onClose()
    } finally {
      setResetting(false)
    }
  }

  const prompt = useMemo(() => {
    return buildPrompt({
      liceoName: liceo?.nombre ?? 'Liceo',
      deviceCode: device?.codigo ?? '',
      deviceName: nombre,
      ubicacion,
      wifiSsid,
      wifiPassword,
      sensores: selectedSensors,
    })
  }, [liceo?.nombre, device?.codigo, nombre, ubicacion, wifiSsid, wifiPassword, selectedSensors])

  if (!device) return null

  const NPK_KEYS = ['nitrogeno', 'fosforo', 'potasio']
  const npkChecked = NPK_KEYS.every(k => selectedSensors.includes(k))

  const toggleSensor = (sensorKey: string) => {
    setSelectedSensors(prev => (
      prev.includes(sensorKey)
        ? prev.filter(item => item !== sensorKey)
        : [...prev, sensorKey]
    ))
  }

  const toggleNpk = () => {
    if (npkChecked) {
      setSelectedSensors(prev => prev.filter(k => !NPK_KEYS.includes(k)))
    } else {
      setSelectedSensors(prev => [...new Set([...prev, ...NPK_KEYS])])
    }
  }

  const handleSave = async () => {
    if (!nombre.trim()) return
    setSaving(true)
    try {
      await onSave({
        nombre: nombre.trim(),
        ubicacion: ubicacion.trim(),
        sensores_habilitados: selectedSensors,
        prompt_configuracion: prompt,
        activo: true,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Configurar dispositivo">
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-surface2 p-3 text-xs text-muted">
          <p className="text-ph-text font-medium">{liceo?.nombre ?? 'Liceo'}</p>
          <p className="mt-1">Completa los datos del holder y selecciona solo los sensores presentes en esta placa.</p>
        </div>

        <div className="grid gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted font-mono">Codigo fijo del equipo</span>
            <input value={device?.codigo ?? ''} readOnly className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-muted font-mono cursor-not-allowed" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted font-mono">Nombre</span>
            <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-ph-text font-mono focus:outline-none focus:border-border2" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted font-mono">Ubicacion</span>
            <input value={ubicacion} onChange={e => setUbicacion(e.target.value)} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-ph-text font-mono focus:outline-none focus:border-border2" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted font-mono">Red WiFi (SSID)</span>
              <input value={wifiSsid} onChange={e => setWifiSsid(e.target.value)} placeholder="MiRedWifi" className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-ph-text font-mono focus:outline-none focus:border-border2" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted font-mono">Contraseña WiFi</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={wifiPassword}
                  onChange={e => setWifiPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 pr-8 text-sm text-ph-text font-mono focus:outline-none focus:border-border2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ph-text bg-transparent border-none cursor-pointer p-0 text-sm leading-none"
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </label>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted font-mono mb-2">Sensores habilitados</p>
          <div className="grid grid-cols-2 gap-2">
            {SENSORS.filter(s => !NPK_KEYS.includes(s.key)).map(sensor => (
              <label key={sensor.key} className="flex items-center gap-2 rounded-lg border border-border bg-surface2 px-3 py-2 text-xs text-ph-text">
                <input type="checkbox" checked={selectedSensors.includes(sensor.key)} onChange={() => toggleSensor(sensor.key)} />
                <span>{sensor.label}</span>
              </label>
            ))}
            <label className="col-span-2 flex items-center gap-2 rounded-lg border border-border bg-surface2 px-3 py-2 text-xs text-ph-text">
              <input type="checkbox" checked={npkChecked} onChange={toggleNpk} />
              <span>NPK <span className="text-muted">(Nitrógeno · Fósforo · Potasio)</span></span>
            </label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted font-mono">Prompt de provisioning</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(prompt)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="text-xs font-mono px-2 py-0.5 rounded border border-border text-muted hover:text-ph-text hover:border-border2 bg-transparent cursor-pointer transition-colors"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <textarea readOnly value={prompt} className="w-full min-h-40 bg-bg border border-border rounded-lg px-3 py-2 text-xs text-muted font-mono resize-none" />
        </div>

        {isAdmin && device?.activo && (
          <div className="border-t border-border pt-3">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-xs font-mono text-red/70 hover:text-red transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                Resetear dispositivo
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3 bg-red/5 border border-red/20 rounded-lg px-3 py-2">
                <p className="text-xs text-red/80 font-mono">¿Confirmar reset? Se perderá la configuración actual.</p>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="text-xs font-mono text-muted hover:text-ph-text bg-transparent border-none cursor-pointer p-0"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={resetting}
                    className="text-xs font-mono text-red hover:text-red/80 bg-transparent border-none cursor-pointer p-0 disabled:opacity-50"
                  >
                    {resetting ? 'Reseteando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !nombre.trim()}>
            {saving ? 'Guardando...' : 'Activar dispositivo'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}