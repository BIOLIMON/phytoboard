import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError(err.message); return }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Acceso Admin">
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs text-muted mb-1 font-mono">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@phytolink.cl"
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-ph-text font-mono focus:outline-none focus:border-border2"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1 font-mono">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-ph-text font-mono focus:outline-none focus:border-border2"
          />
        </div>
        {error && <p className="text-red text-xs font-mono">{error}</p>}
        <Button variant="primary" onClick={handleLogin} disabled={loading} className="w-full justify-center mt-1">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </div>
    </Modal>
  )
}
