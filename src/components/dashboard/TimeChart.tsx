import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { SENSORS } from '../../types'
import type { Reading, SensorMeta } from '../../types'

interface TimeChartProps {
  data: Reading[]
  sensors?: SensorMeta[]
}

export function TimeChart({ data, sensors = SENSORS }: TimeChartProps) {
  const [activeSensor, setActiveSensor] = useState<SensorMeta>(sensors[0])

  useEffect(() => {
    if (!sensors.some(sensor => sensor.key === activeSensor.key)) {
      setActiveSensor(sensors[0])
    }
  }, [sensors, activeSensor.key])

  const chartData = data.map(r => ({
    ts: new Date(r.timestamp).getTime(),
    value: r[activeSensor.key] ?? null,
  }))

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex flex-wrap gap-1 mb-4">
        {sensors.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSensor(s)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-all duration-150 cursor-pointer border ${
              activeSensor.key === s.key
                ? 'border-transparent text-bg font-bold'
                : 'border-border text-muted bg-transparent hover:text-ph-text'
            }`}
            style={activeSensor.key === s.key ? { background: s.color } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#111e2d', borderRadius: 8 }}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#1e3347" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="ts"
              type="number"
              domain={['dataMin', 'dataMax']}
              scale="time"
              tickFormatter={ts => format(new Date(ts), 'HH:mm', { locale: es })}
              tick={{ fill: '#5a7a96', fontSize: 10, fontFamily: 'Space Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#5a7a96', fontSize: 10, fontFamily: 'Space Mono' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{ background: '#172638', border: '1px solid #1e3347', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#5a7a96' }}
              itemStyle={{ color: activeSensor.color }}
              labelFormatter={ts => format(new Date(ts), 'dd/MM HH:mm', { locale: es })}
              formatter={(v) => [`${Number(v).toFixed(2)} ${activeSensor.unit}`, activeSensor.label]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={activeSensor.color}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
