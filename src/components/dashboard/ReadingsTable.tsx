import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { SENSORS } from '../../types'
import type { Reading } from '../../types'

interface ReadingsTableProps {
  data: Reading[]
  sensors?: typeof SENSORS
}

export function ReadingsTable({ data, sensors = SENSORS }: ReadingsTableProps) {
  const rows = [...data].reverse().slice(0, 15)

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-ph-text">Últimas lecturas</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-muted font-normal">Timestamp</th>
              {sensors.map(s => (
                <th key={s.key} className="px-3 py-2 text-right text-muted font-normal whitespace-nowrap">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={sensors.length + 1} className="px-3 py-4 text-center text-muted">
                  Sin lecturas
                </td>
              </tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-surface2 transition-colors">
                <td className="px-3 py-1.5 text-muted whitespace-nowrap">
                  {format(new Date(r.timestamp), 'dd/MM HH:mm:ss', { locale: es })}
                </td>
                {sensors.map(s => {
                  const v = r[s.key]
                  return (
                    <td key={s.key} className="px-3 py-1.5 text-right whitespace-nowrap">
                      {v != null
                        ? <span style={{ color: s.color }}>{v.toFixed(1)}</span>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
