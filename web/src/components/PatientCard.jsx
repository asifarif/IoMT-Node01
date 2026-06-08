function statusFor(latest) {
  if (!latest) return { label: 'no data', color: '#9aa5a8' }
  const t = Number(latest.body_temp)
  if (t >= 38) return { label: 'fever', color: '#f4716b' }
  if (t >= 37.5) return { label: 'watch', color: '#f4a340' }
  return { label: 'stable', color: '#3fb8ae' }
}

export default function PatientCard({ patient, latest, active, onSelect }) {
  const s = statusFor(latest)
  const seen = latest ? new Date(latest.recorded_at).toLocaleTimeString() : '—'

  return (
    <button className={`card ${active ? 'card--active' : ''}`} onClick={onSelect}>
      <div className="card-head">
        <span className="dot" style={{ background: s.color }} />
        <strong>{patient.full_name}</strong>
        <span className="bed">{patient.bed}</span>
      </div>
      <div className="card-vitals">
        <div className="vital">
          <span className="v">{latest ? Number(latest.body_temp).toFixed(1) : '—'}</span>
          <span className="u">°C body temp</span>
        </div>
        <div className="vital">
          <span className="v">{latest ? Number(latest.heart_rate).toFixed(0) : '—'}</span>
          <span className="u">bpm heart rate</span>
        </div>
      </div>
      <div className="card-foot">{s.label} · {seen}</div>
    </button>
  )
}
