import { useState } from 'react'
import { MANUAL_KINDS } from '../lib/vitals'

export default function ManualEntryForm({ deviceId, onAdd, disabled }) {
  const [kind, setKind] = useState(MANUAL_KINDS[0].key)
  const [value, setValue] = useState('')
  const [msg, setMsg] = useState('')

  async function submit() {
    const v = Number(value)
    if (value === '' || Number.isNaN(v)) { setMsg('Enter a number'); return }
    await onAdd(deviceId, kind, v)
    setValue(''); setMsg('Saved \u2713'); setTimeout(() => setMsg(''), 1500)
  }

  return (
    <div className="manual">
      <select value={kind} onChange={e => setKind(e.target.value)} disabled={disabled}>
        {MANUAL_KINDS.map(k => <option key={k.key} value={k.key}>{k.label} ({k.unit})</option>)}
      </select>
      <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="value" disabled={disabled} />
      <button className="btn btn-primary" onClick={submit} disabled={disabled}>Add</button>
      {msg && <span className="manual-msg">{msg}</span>}
    </div>
  )
}
