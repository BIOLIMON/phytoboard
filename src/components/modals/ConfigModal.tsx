import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface ConfigModalProps {
  open: boolean
  onClose: () => void
  onConnect: (url: string, key: string) => void
}

export function ConfigModal({ open, onClose, onConnect }: ConfigModalProps) {
  const [url, setUrl]   = useState(() => localStorage.getItem('sb_url') ?? '')
  const [key, setKey]   = useState(() => localStorage.getItem('sb_key') ?? '')

  const handleConnect = () => {
    if (!url || !key) return
    localStorage.setItem('sb_url', url)
    localStorage.setItem('sb_key', key)
    onConnect(url, key)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Conectar Supabase">
      <div className="flex justify-center mb-5">
        <img src="/assets/logo-phytolearning.png" alt="PhytoLearning" className="h-12" />
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs text-muted mb-1 font-mono">Project URL</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://xxxx.supabase.co"
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-ph-text font-mono focus:outline-none focus:border-border2"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1 font-mono">Anon Key</label>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="eyJhbGci..."
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-ph-text font-mono focus:outline-none focus:border-border2"
          />
        </div>
        <Button variant="primary" onClick={handleConnect} className="w-full justify-center mt-1">
          Conectar
        </Button>
      </div>
    </Modal>
  )
}
