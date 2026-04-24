import { useState, useEffect, useCallback } from 'react'
import { Topbar }        from '../components/layout/Topbar'
import { Sidebar }       from '../components/layout/Sidebar'
import { GaugeCard }     from '../components/dashboard/GaugeCard'
import { TimeChart }     from '../components/dashboard/TimeChart'
import { ReadingsTable } from '../components/dashboard/ReadingsTable'
import { LoginModal }    from '../components/modals/LoginModal'
import { DeviceSetupModal } from '../components/modals/DeviceSetupModal'
import { useLiceos }     from '../hooks/useLiceos'
import { useDevices }    from '../hooks/useDevices'
import { updateDevice }  from '../hooks/useUpdateDevice'
import { useReadings }   from '../hooks/useReadings'
import { useAuth }       from '../hooks/useAuth'
import { supabase }      from '../lib/supabase'
import { SENSORS }       from '../types'
import type { Liceo, Device } from '../types'

const PERIOD_HOURS: Record<string, number> = { '24h': 24, '3d': 72, '7d': 168 }

function deviceOrderValue(d: Device) {
  const codeMatch = d.codigo?.match(/(\d+)$/)
  if (codeMatch) return Number(codeMatch[1])
  const nameMatch = d.nombre?.match(/(\d+)$/)
  if (nameMatch) return Number(nameMatch[1])
  return Number.MAX_SAFE_INTEGER
}

function sortDevicesNumeric(devices: Device[]) {
  return [...devices].sort((a, b) => {
    const nA = deviceOrderValue(a)
    const nB = deviceOrderValue(b)
    if (nA !== nB) return nA - nB
    return a.nombre.localeCompare(b.nombre)
  })
}

export function Dashboard() {
  const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY

  const { isAdmin } = useAuth()
  const { liceos, error: liceosError } = useLiceos()
  const [selectedLiceo,  setSelectedLiceo]  = useState<Liceo | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [period,         setPeriod]         = useState('24h')
  const [loginOpen,      setLoginOpen]      = useState(false)
  const [deviceSetupOpen, setDeviceSetupOpen] = useState(false)

  const { devices, error: devicesError, reload: reloadDevices } = useDevices()

  const hours = PERIOD_HOURS[period] ?? 24
  const { history: liveHistory, latest: liveLatest, error: readingsError, reload } = useReadings(
    selectedDevice?.id ?? null,
    hours,
  )

  const supabaseError = !hasSupabase
    ? 'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local'
    : (liceosError ?? devicesError ?? readingsError)
  const isAuthError = !!supabaseError && /401|unauthorized|jwt|permission denied/i.test(supabaseError)

  const visibleSensors = selectedDevice?.sensores_habilitados?.length
    ? SENSORS.filter(sensor => selectedDevice.sensores_habilitados?.includes(sensor.key))
    : SENSORS

  // Persist selection
  useEffect(() => {
    const savedLiceoId  = localStorage.getItem('ph_liceo')
    const savedDeviceId = localStorage.getItem('ph_device')
    if (liceos.length && !selectedLiceo) {
      const found = liceos.find(l => l.id === savedLiceoId) ?? liceos[0]
      setSelectedLiceo(found)
    }
    if (!selectedLiceo) return

    const devicesForSelectedLiceo = sortDevicesNumeric(
      devices.filter(d => d.liceo_id === selectedLiceo.id),
    )
    const selectedDeviceIsValid = selectedDevice
      ? devicesForSelectedLiceo.some(d => d.id === selectedDevice.id)
      : false

    if (devicesForSelectedLiceo.length && !selectedDeviceIsValid) {
      const found = devicesForSelectedLiceo.find(d => d.id === savedDeviceId) ?? devicesForSelectedLiceo[0]
      setSelectedDevice(found)
    }
  }, [liceos, devices, selectedLiceo, selectedDevice])

  // Reset device when liceo changes
  const handleSelectLiceo = useCallback((l: Liceo) => {
    localStorage.setItem('ph_liceo', l.id)
    setSelectedLiceo(l)
    setSelectedDevice(null)
  }, [])

  const handleSelectDevice = useCallback((d: Device) => {
    localStorage.setItem('ph_device', d.id)
    setSelectedDevice(d)
  }, [])

  const history = liveHistory
  const latest = liveLatest
  const status = latest ? 'live' : 'offline'

  return (
    <div className="grid h-screen overflow-hidden" style={{ gridTemplateRows: '52px 1fr', gridTemplateColumns: '240px 1fr' }}>
      {/* Topbar */}
      <Topbar
        status={status}
        isAdmin={isAdmin}
        onAdminClick={() => isAdmin ? supabase.auth.signOut() : setLoginOpen(true)}
      />

      {/* Sidebar */}
      <Sidebar
        liceos={liceos}
        selectedLiceo={selectedLiceo}
        devices={devices}
        selectedDevice={selectedDevice}
        isAdmin={isAdmin}
        onSelectLiceo={handleSelectLiceo}
        onSelectDevice={handleSelectDevice}
        onConfigureDevice={d => {
          setSelectedDevice(d)
          setDeviceSetupOpen(true)
        }}
      />

      {/* Main */}
      <main className="overflow-y-auto p-5 flex flex-col gap-4">
        {supabaseError && (
          <div className="px-4 py-2.5 bg-red/10 border border-red/30 rounded-xl">
            <p className="text-red text-xs font-medium">
              Error de conexión con Supabase
            </p>
            <p className="text-muted text-[0.72rem] mt-0.5">
              {isAuthError
                ? 'La anon key no tiene permisos o es inválida. Revisa VITE_SUPABASE_ANON_KEY en .env.local y las políticas RLS.'
                : supabaseError}
            </p>
          </div>
        )}

        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ph-text">{selectedDevice?.nombre ?? 'Sin dispositivo'}</h2>
            <h3 className="text-muted text-sm mt-0.5">
              {selectedDevice?.codigo ?? ''}{selectedDevice?.ubicacion ? ' · ' + selectedDevice.ubicacion : ''}{selectedDevice && selectedLiceo ? ' · ' : ''}{selectedLiceo?.nombre ?? ''}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedDevice && (!selectedDevice.activo || isAdmin) && (
              <button
                onClick={() => setDeviceSetupOpen(true)}
                className="px-3 py-1 rounded-lg font-mono text-xs cursor-pointer border border-border text-muted bg-transparent hover:text-ph-text"
              >
                Configurar dispositivo
              </button>
            )}
            {Object.keys(PERIOD_HOURS).map(p => (
              <button
                key={p}
                onClick={() => { setPeriod(p); reload() }}
                className={`px-3 py-1 rounded-lg font-mono text-xs cursor-pointer border transition-all duration-150 ${
                  period === p
                    ? 'border-transparent text-bg font-bold bg-green'
                    : 'border-border text-muted bg-transparent hover:text-ph-text'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={reload}
              className="px-2.5 py-1 rounded-lg border border-border text-muted text-xs hover:text-ph-text transition-colors cursor-pointer bg-transparent"
              title="Recargar"
            >
              ↺
            </button>
          </div>
        </div>

        {/* Gauges */}
        {visibleSensors.length > 0 ? (
          <>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {visibleSensors.map(s => (
                <GaugeCard key={s.key} meta={s} value={latest?.[s.key]} />
              ))}
            </div>

            {/* Chart */}
            <TimeChart data={history} sensors={visibleSensors} />

            {/* Table */}
            <ReadingsTable data={history} sensors={visibleSensors} />
          </>
        ) : (
          <div className="bg-surface rounded-xl border border-border p-6 text-sm text-muted">
            Este dispositivo todavía no tiene sensores habilitados. Abre <span className="text-ph-text">Configurar dispositivo</span> para activarlo.
          </div>
        )}
      </main>

      {/* Modales */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <DeviceSetupModal
        open={deviceSetupOpen}
        device={selectedDevice}
        liceo={selectedLiceo}
        isAdmin={isAdmin}
        onClose={() => setDeviceSetupOpen(false)}
        onSave={async payload => {
          if (!selectedDevice) return
          const updated = await updateDevice(selectedDevice.id, payload)
          await reloadDevices()
          setSelectedDevice(updated)
        }}
        onReset={async () => {
          if (!selectedDevice) return
          await supabase.from('readings').delete().eq('device_id', selectedDevice.id)
          const updated = await updateDevice(selectedDevice.id, {
            nombre: selectedDevice.codigo,
            ubicacion: '',
            sensores_habilitados: [],
            prompt_configuracion: '',
            activo: false,
          })
          await reloadDevices()
          setSelectedDevice(updated)
        }}
      />
    </div>
  )
}
