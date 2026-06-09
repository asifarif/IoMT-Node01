import { useState } from 'react'

export default function AddNodeForm({ onClose, onAdd }) {
  const [f, setF] = useState({ device_id: '', full_name: '', mrn: '', bed: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit() {
    if (!f.device_id.trim()) { window.alert('Node ID (device_id) is required'); return }
    await onAdd({
      device_id: f.device_id.trim(),
      full_name: f.full_name.trim() || 'New Patient',
      mrn: f.mrn.trim() || null,
      bed: f.bed.trim() || null,
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Add node / patient</h3>
        <label>Node ID (device_id)<input value={f.device_id} onChange={set('device_id')} placeholder="IoMT-G02" /></label>
        <label>Patient name<input value={f.full_name} onChange={set('full_name')} placeholder="Jane Doe" /></label>
        <label>MRN<input value={f.mrn} onChange={set('mrn')} placeholder="MRN-1024" /></label>
        <label>Bed<input value={f.bed} onChange={set('bed')} placeholder="Bed 2" /></label>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Add</button>
        </div>
      </div>
    </div>
  )
}
