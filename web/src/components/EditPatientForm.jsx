import { useState } from 'react'
import { DEFAULT_THRESHOLDS } from '../lib/vitals'

export default function EditPatientForm({ patient, isNew, onClose, onSave }) {
  const [f, setF] = useState({
    full_name: patient.full_name || '',
    mrn: patient.mrn || '',
    bed: patient.bed || '',
    hr_min: patient.hr_min ?? DEFAULT_THRESHOLDS.hr_min,
    hr_max: patient.hr_max ?? DEFAULT_THRESHOLDS.hr_max,
    temp_min: patient.temp_min ?? DEFAULT_THRESHOLDS.temp_min,
    temp_max: patient.temp_max ?? DEFAULT_THRESHOLDS.temp_max,
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const num = (v) => (v === '' || v === null ? null : Number(v))

  async function submit() {
    await onSave({
      full_name: f.full_name.trim() || 'New Patient',
      mrn: f.mrn.trim() || null,
      bed: f.bed.trim() || null,
      hr_min: num(f.hr_min), hr_max: num(f.hr_max),
      temp_min: num(f.temp_min), temp_max: num(f.temp_max),
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{isNew ? 'Register node' : 'Edit patient & thresholds'}</h3>
        <label>Patient name<input value={f.full_name} onChange={set('full_name')} /></label>
        <label>MRN<input value={f.mrn} onChange={set('mrn')} /></label>
        <label>Bed<input value={f.bed} onChange={set('bed')} /></label>
        <p className="hint">Alarm thresholds (card flashes red when outside):</p>
        <div className="grid2">
          <label>HR min<input type="number" value={f.hr_min ?? ''} onChange={set('hr_min')} /></label>
          <label>HR max<input type="number" value={f.hr_max ?? ''} onChange={set('hr_max')} /></label>
          <label>Temp min<input type="number" step="0.1" value={f.temp_min ?? ''} onChange={set('temp_min')} /></label>
          <label>Temp max<input type="number" step="0.1" value={f.temp_max ?? ''} onChange={set('temp_max')} /></label>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Save</button>
        </div>
      </div>
    </div>
  )
}
