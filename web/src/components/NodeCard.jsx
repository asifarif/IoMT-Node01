import { checkAlarm, fmt } from '../lib/vitals'

export default function NodeCard({ node, onOpen }) {
  const { patient, latest, device_id } = node
  const { alarm, reasons } = checkAlarm(patient, latest)
  const name = patient?.full_name || 'Unregistered node'
  const seen = latest ? new Date(latest.recorded_at).toLocaleTimeString() : 'no data'

  return (
    <button className={`card ${alarm ? 'card--alarm' : ''}`} onClick={onOpen}>
      <div className="card-head">
        <span className={`dot ${alarm ? 'dot--alarm' : 'dot--ok'}`} />
        <strong>{name}</strong>
        <span className="bed">{patient?.bed || ''}</span>
      </div>
      <div className="card-meta">{device_id}{patient?.mrn ? ` \u00B7 MRN ${patient.mrn}` : ''}</div>
      <div className="card-vitals">
        <div className="vital"><span className="v">{fmt(latest?.heart_rate, 0)}</span><span className="u">bpm HR</span></div>
        <div className="vital"><span className="v">{fmt(latest?.body_temp, 1)}</span><span className="u">\u00B0C temp</span></div>
        <div className="vital"><span className="v">{fmt(latest?.spo2, 0)}</span><span className="u">% SpO\u2082</span></div>
      </div>
      <div className="card-foot">
        {alarm ? <span className="alarm-text">{reasons.join(' \u00B7 ')}</span> : <span>stable</span>}
        <span className="seen">{seen}</span>
      </div>
    </button>
  )
}
