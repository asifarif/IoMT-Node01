import { useMemo, useState } from 'react'
import VitalsChart from './VitalsChart'
import EditPatientForm from './EditPatientForm'
import ManualEntryForm from './ManualEntryForm'
import { VITAL_TYPES, fmt, checkAlarm, getThresholds } from '../lib/vitals'

export default function NodeDetail({ node, readings, manual, now, onBack, iomt }) {
  const { device_id, patient, latest } = node
  const [editing, setEditing] = useState(false)

  const series = useMemo(
    () => readings.filter(r => r.device_id === device_id).slice(-120),
    [readings, device_id]
  )
  const latestManual = useMemo(() => {
    const m = {}
    manual.filter(e => e.device_id === device_id).forEach(e => { m[e.kind] = e.value })
    return m
  }, [manual, device_id])

  const { alarm, breaches } = checkAlarm(patient, latest)
  const thr = getThresholds(patient)
  const breachText = Object.entries(breaches)
    .map(([k, dir]) => `${VITAL_TYPES.find(v => v.key === k)?.label || k} ${dir.toUpperCase()}`)
    .join(' · ')
  const title = patient?.full_name ? `${patient.full_name} (${device_id})` : device_id

  async function handleDelete() {
    if (window.confirm(`Delete node ${device_id} and ALL its data? This cannot be undone.`)) {
      await iomt.deleteNode(device_id)
      onBack()
    }
  }

  return (
    <div className="detail">
      <div className="detail-top">
        <button className="btn" onClick={onBack}>← Back</button>
        <h2>Vitals — {title}</h2>
        <div className="detail-actions">
          <button className="btn" onClick={() => setEditing(true)} disabled={!iomt.ready}>
            {patient ? 'Edit / thresholds' : 'Register node'}
          </button>
          {patient && (
            <button className="btn btn-danger" onClick={handleDelete} disabled={!iomt.ready}>Delete node</button>
          )}
        </div>
      </div>

      {alarm && <div className="alarm-banner">⚠ {breachText}</div>}

      <div className="detail-grid">
        <section className="panel panel-wide">
          <h3>Device vitals (live)</h3>
          <VitalsChart data={series} keys={['heart_rate', 'body_temp', 'spo2']} />
        </section>

        <section className="panel">
          <h3>Current readings</h3>
          <div className="readout">
            {VITAL_TYPES.map(vt => {
              const val = vt.source === 'device' ? latest?.[vt.key] : latestManual[vt.key]
              return (
                <div className="ro" key={vt.key}>
                  <span className="ro-v" style={{ color: vt.color }}>{fmt(val, vt.decimals)}</span>
                  <span className="ro-l">{vt.label} <em>{vt.unit}</em></span>
                </div>
              )
            })}
          </div>
          <p className="hint">
            Alarm limits — HR {thr.hr_min}–{thr.hr_max} bpm · Temp {thr.temp_min}–{thr.temp_max} °C
          </p>
        </section>

        <section className="panel">
          <h3>Manual entry</h3>
          <ManualEntryForm deviceId={device_id} onAdd={iomt.addManual} disabled={!iomt.ready} />
          <p className="hint">BP, glucose and weight are entered here; they appear in Current readings.</p>
        </section>
      </div>

      {editing && (
        <EditPatientForm
          patient={patient || { device_id }}
          isNew={!patient}
          onClose={() => setEditing(false)}
          onSave={(fields) =>
            patient ? iomt.updatePatient(patient.id, fields)
                    : iomt.addPatient({ device_id, ...fields })}
        />
      )}
    </div>
  )
}
