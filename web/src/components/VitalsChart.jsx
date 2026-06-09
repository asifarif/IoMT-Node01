import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { VITAL_TYPES } from '../lib/vitals'

export default function VitalsChart({ data, keys }) {
  const meta = Object.fromEntries(VITAL_TYPES.map(v => [v.key, v]))
  const chartData = (data || []).map(r => {
    const o = { time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
    keys.forEach(k => { o[k] = r[k] != null ? Number(r[k]) : null })
    return o
  })
  if (chartData.length === 0) return <p className="empty">Waiting for data\u2026</p>
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2efef" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={28} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {keys.map(k => (
          <Line key={k} type="monotone" dataKey={k} name={meta[k]?.label || k}
                stroke={meta[k]?.color || '#0e7c86'} strokeWidth={2} dot={false}
                connectNulls isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
