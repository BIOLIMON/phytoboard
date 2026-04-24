import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../ui/Modal'
import type { Liceo, Device } from '../../types'

interface SidebarProps {
  liceos: Liceo[]
  selectedLiceo: Liceo | null
  devices: Device[]
  selectedDevice: Device | null
  isAdmin: boolean
  onSelectLiceo: (l: Liceo) => void
  onSelectDevice: (d: Device) => void
  onConfigureDevice: (d: Device) => void
}

const LICEO_COLORS: Record<string, string> = {}
const PALETTE = ['#4ade80', '#38bdf8', '#a78bfa', '#fb923c']

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

function liceoColor(id: string, liceos: Liceo[]) {
  if (!LICEO_COLORS[id]) {
    const idx = liceos.findIndex(l => l.id === id)
    LICEO_COLORS[id] = PALETTE[idx % PALETTE.length]
  }
  return LICEO_COLORS[id]
}

function computePassword(device: Device, liceos: Liceo[]): string {
  const num = device.codigo.match(/(\d+)$/)?.[1] ?? '1'
  const liceo = liceos.find(l => l.id === device.liceo_id)
  if (liceo?.codigo === 'menesianos') return `menesianoculipran_${num}`
  if (liceo?.codigo === 'carmen')     return `elcarmen_${num}`
  return `phytoboard_${num}`
}

export function Sidebar({ liceos, selectedLiceo, devices, selectedDevice, isAdmin, onSelectLiceo, onSelectDevice, onConfigureDevice }: SidebarProps) {
  const [pendingDevice, setPendingDevice] = useState<Device | null>(null)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const visibleDevices = sortDevicesNumeric(
    selectedLiceo
      ? devices.filter(d => d.liceo_id === selectedLiceo.id)
      : devices,
  )

  const handleConfigClick = (d: Device) => {
    if (isAdmin) { onConfigureDevice(d); return }
    setPendingDevice(d)
    setPwInput('')
    setPwError(false)
    setShowPw(false)
  }

  const handlePasswordSubmit = () => {
    if (!pendingDevice) return
    if (pwInput === computePassword(pendingDevice, liceos)) {
      setPendingDevice(null)
      onConfigureDevice(pendingDevice)
    } else {
      setPwError(true)
    }
  }

  return (
    <aside className="flex flex-col bg-surface border-r border-border overflow-hidden">
      {/* Liceos */}
      <p className="px-4 pt-2.5 pb-1 font-mono text-[0.6rem] text-muted tracking-[0.12em] uppercase">Liceos</p>
      <div className="flex flex-col gap-0.5 px-3 pb-2 border-b border-border">
        {liceos.map(l => {
          const color = liceoColor(l.id, liceos)
          const active = selectedLiceo?.id === l.id
          const count = devices.filter(d => d.liceo_id === l.id).length
          return (
            <button
              key={l.id}
              onClick={() => onSelectLiceo(l)}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm w-full transition-all duration-200 cursor-pointer border-none
                ${active
                  ? 'text-ph-text bg-surface2'
                  : 'text-muted bg-transparent hover:bg-surface2 hover:text-ph-text'}`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: active ? color : '#5a7a96' }}
              />
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate">{l.nombre}</span>
                <span className="font-mono text-[0.6rem] text-muted flex-shrink-0">{count}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Dispositivos */}
      <p className="px-4 pt-2.5 pb-1 font-mono text-[0.6rem] text-muted tracking-[0.12em] uppercase">Dispositivos</p>
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {visibleDevices.length === 0 && (
          <p className="text-muted text-xs px-2 py-2">Sin dispositivos</p>
        )}
        {visibleDevices.map(d => {
          const active = selectedDevice?.id === d.id
          return (
            <div
              key={d.id}
              className={`grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-center w-full px-2.5 py-1.5 rounded-lg text-sm mb-0.5 transition-all duration-200 border-none
                ${active
                  ? 'bg-surface2 text-ph-text'
                  : 'bg-transparent text-muted hover:bg-surface2 hover:text-ph-text'}`}
            >
              <button
                type="button"
                onClick={() => onSelectDevice(d)}
                className="min-w-0 text-left border-none bg-transparent p-0 cursor-pointer"
              >
                <span className="flex min-w-0 flex-col items-start leading-tight">
                  <span className="truncate max-w-full">{d.nombre}</span>
                  <span className="text-[0.6rem] font-mono text-muted truncate max-w-full">{d.codigo}</span>
                </span>
              </button>

              <span className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[0.6rem] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                  d.activo ? 'bg-green/10 text-green' : 'bg-muted/10 text-muted'
                }`}>
                  {d.activo ? 'ON' : 'OFF'}
                </span>
                {(!d.activo || isAdmin) && (
                  <button
                    type="button"
                    onClick={() => handleConfigClick(d)}
                    className="text-[0.6rem] font-mono px-1.5 py-0.5 rounded border border-border text-muted hover:text-ph-text hover:border-border2"
                  >
                    Config
                  </button>
                )}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex flex-col gap-1">
        <Link to="/" className="text-muted hover:text-ph-text text-xs transition-colors no-underline">
          ← Landing
        </Link>
      </div>

      {/* Modal de clave de dispositivo */}
      <Modal
        open={!!pendingDevice}
        onClose={() => setPendingDevice(null)}
        title="Clave del grupo"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted font-mono">
            Ingresa la clave para configurar{' '}
            <span className="text-ph-text">{pendingDevice?.nombre}</span>
          </p>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false) }}
              onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="••••••••••••"
              autoFocus
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 pr-8 text-sm text-ph-text font-mono focus:outline-none focus:border-border2"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ph-text bg-transparent border-none cursor-pointer p-0 text-sm leading-none"
            >
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
          {pwError && (
            <p className="text-xs text-red font-mono">Clave incorrecta</p>
          )}
          <button
            type="button"
            onClick={handlePasswordSubmit}
            className="w-full py-2 rounded-lg bg-green text-bg font-mono text-sm font-bold cursor-pointer border-none hover:opacity-90 transition-opacity"
          >
            Continuar
          </button>
        </div>
      </Modal>
    </aside>
  )
}
