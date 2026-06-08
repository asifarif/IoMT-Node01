import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export default function VitalsChart({ data }) {
  const chartData = (data || []).map((r) => ({
    time: new Date(r.recorded_at).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
    body_temp: Number(r.body_temp),
    heart_rate: Number(r.heart_rate),
  }))

  if (chartData.length === 0) return <p className="empty">Waiting for data…</p>

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2efef" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={28} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="body_temp" name="Body temp (°C)"
              stroke="#0e7c86" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="heart_rate" name="Heart rate (bpm)"
              stroke="#f4716b" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
