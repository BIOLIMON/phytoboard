import { useState } from 'react'

interface LiceoSelectionModalProps {
  onSelect: (liceoId: string) => void
}

export function LiceoSelectionModal({ onSelect }: LiceoSelectionModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const LICEOS = [
    { id: 'menesiano', nombre: 'Liceo Menesiano Culipran', password: 'menesianoculipran', enabled: true },
    { id: 'carmen', nombre: 'El Carmen', password: 'elcarmen', enabled: false },
  ]

  const handleSelect = async (liceoId: string) => {
    const liceo = LICEOS.find(l => l.id === liceoId)

    if (!liceo) {
      setError('Liceo no encontrado')
      return
    }

    if (!liceo.enabled) {
      setError('Este liceo aún no está disponible')
      return
    }

    if (!password.trim()) {
      setError('Ingresa la contraseña para continuar')
      return
    }

    if (password !== liceo.password) {
      setError('Contraseña incorrecta')
      return
    }

    setError('')
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      onSelect(liceoId)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Encuesta de Escuelas</h1>
          <p className="text-gray-600 text-center mb-8">Selecciona tu institución para acceder</p>

          <div className="space-y-4 mb-8">
            {LICEOS.map((liceo) => (
              <div key={liceo.id}>
                <button
                  onClick={() => {
                    setPassword('')
                    setError('')
                  }}
                  disabled={!liceo.enabled}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    liceo.enabled
                      ? 'border-green-200 hover:border-green-400 hover:bg-green-50 cursor-pointer'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span className={`font-semibold ${liceo.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                    {liceo.nombre}
                  </span>
                  {!liceo.enabled && (
                    <p className="text-sm text-gray-400 mt-1">Próximamente disponible</p>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Ingresa la contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && password) {
                  handleSelect('menesiano')
                }
              }}
              autoComplete="current-password"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={() => handleSelect('menesiano')}
              disabled={loading}
              className="w-full min-h-[52px] font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-80"
              style={{
                backgroundColor: loading ? '#0f766e' : '#15803d',
                border: '1px solid #14532d',
                color: '#ffffff',
              }}
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Accediendo...
                </>
              ) : (
                'Acceder'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
