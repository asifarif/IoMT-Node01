import { useMemo, useState } from 'react'
import { VITAL_TYPES } from '../lib/vitals'
import SearchBar from './SearchBar'

const STATUSES = ['All', 'Active', 'Acknowledged', 'Resolved']

function statusOf(a) {
  if (a.resolved_at) return 'Resolved'
  if (a.acknowledged_at) return 'Acknowledged'
  return 'Active'
}
function paramLabel(p) {
  return VITAL_TYPES.find(v => v.key === p)?.label || p
}
function fmtTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
}

export default function AlertLog({ alerts, patientByDevice, onAcknowledge }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')

  const patientName = (deviceId) => patientByDevice[deviceId]?.full_name || deviceId

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return alerts.filter(a => {
      if (status !== 'All' && statusOf(a) !== status) return false
      if (!q) return true
      const p = patientByDevice[a.device_id]
      return a.device_id.toLowerCase().includes(q) ||
        (p?.full_name || '').toLowerCase().includes(q) ||
        (p?.mrn || '').toLowerCase().includes(q)
    })
  }, [alerts, query, status, patientByDevice])

  function exportCsv() {
    const header = ['Time', 'Patient', 'Node', 'Parameter', 'Value', 'Limit',
                    'Direction', 'Status', 'Acknowledged by', 'Acknowledged at']
    const body = rows.map(a => [
      fmtTime(a.onset_at), patientName(a.device_id), a.device_id,
      paramLabel(a.parameter), a.value,
      `${a.limit_min ?? ''}–${a.limit_max ?? ''}`,
      a.direction, statusOf(a),
      a.acknowledged_by || '', a.acknowledged_at ? fmtTime(a.acknowledged_at) : '',
    ])
    const csv = [header, ...body]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `alert-log-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleAck(alert) {
    const name = window.prompt('Clinician name to acknowledge this alert:')
    if (name && name.trim()) onAcknowledge(alert.id, name.trim())
  }

  return (
    <section className="alertlog">
      <div className="alertlog-controls">
        <SearchBar value={query} onChange={setQuery} />
        <select className="search alertlog-status" value={status}
                onChange={e => setStatus(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn" onClick={exportCsv} disabled={rows.length === 0}>Export CSV</button>
      </div>
      <div className="table-wrap">
        <table className="log-table">
          <thead>
            <tr>
              <th>Time</th><th>Patient</th><th>Node</th><th>Parameter</th>
              <th>Value</th><th>Limit</th><th>Direction</th><th>Status</th>
              <th>Acknowledged</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={10} className="empty">No alerts match.</td></tr>
            )}
            {rows.map(a => {
              const st = statusOf(a)
              return (
                <tr key={a.id}>
                  <td>{fmtTime(a.onset_at)}</td>
                  <td>{patientName(a.device_id)}</td>
                  <td className="mono">{a.device_id}</td>
                  <td>{paramLabel(a.parameter)}</td>
                  <td>{a.value}</td>
                  <td>{(a.limit_min ?? '—')}–{(a.limit_max ?? '—')}</td>
                  <td><span className="badge badge--dir">{a.direction?.toUpperCase()}</span></td>
                  <td><span className={`badge badge--status badge--${st.toLowerCase()}`}>{st}</span></td>
                  <td>{a.acknowledged_by ? `${a.acknowledged_by} · ${fmtTime(a.acknowledged_at)}` : '—'}</td>
                  <td>
                    {st === 'Active' && !a.acknowledged_at && (
                      <button className="btn" onClick={() => handleAck(a)}>Acknowledge</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
