import { useState, useMemo, useEffect } from 'react'
import { useIomt } from './hooks/useIomt'
import Dashboard from './components/Dashboard'
import NodeDetail from './components/NodeDetail'
import SearchBar from './components/SearchBar'

export default function App() {
  const iomt = useIomt()
  const { patients, readings, manual, nodeOrder, ready, saveOrder } = iomt
  const [query, setQuery] = useState('')
  const [openDevice, setOpenDevice] = useState(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const patientByDevice = useMemo(() => {
    const m = {}; patients.forEach(p => { if (p.device_id) m[p.device_id] = p }); return m
  }, [patients])
  const latestVitals = useMemo(() => {
    const m = {}; readings.forEach(r => { m[r.device_id] = r }); return m
  }, [readings])
  const latestManual = useMemo(() => {
    const m = {}; manual.forEach(e => { (m[e.device_id] ||= {})[e.kind] = e.value }); return m
  }, [manual])

  const deviceIds = useMemo(() => {
    const s = new Set()
    patients.forEach(p => p.device_id && s.add(p.device_id))
    readings.forEach(r => s.add(r.device_id))
    return [...s]
  }, [patients, readings])

  const nodes = useMemo(() => deviceIds.map(id => ({
    device_id: id,
    patient: patientByDevice[id] || null,
    latest: latestVitals[id] || null,
    manual: latestManual[id] || {},
  })), [deviceIds, patientByDevice, latestVitals, latestManual])

  const ordered = useMemo(() => {
    const idx = new Map(nodeOrder.map((id, i) => [id, i]))
    return [...nodes].sort((a, b) => {
      const ia = idx.has(a.device_id) ? idx.get(a.device_id) : 1e9
      const ib = idx.has(b.device_id) ? idx.get(b.device_id) : 1e9
      return ia - ib || a.device_id.localeCompare(b.device_id)
    })
  }, [nodes, nodeOrder])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ordered
    return ordered.filter(n =>
      n.device_id.toLowerCase().includes(q) ||
      (n.patient?.full_name || '').toLowerCase().includes(q) ||
      (n.patient?.mrn || '').toLowerCase().includes(q))
  }, [ordered, query])

  const canDrag = query.trim() === ''
  const openNode = openDevice ? nodes.find(n => n.device_id === openDevice) : null

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>IoMT Telemedicine Dashboard</h1>
          <p className="sub">{nodes.length} node{nodes.length !== 1 ? 's' : ''} · live</p>
        </div>
        <SearchBar value={query} onChange={setQuery} />
      </header>

      {!ready && <div className="warn">Supabase not configured — set <code>web/.env.local</code> and restart.</div>}

      {openNode ? (
        <NodeDetail node={openNode} readings={readings} manual={manual}
                    now={now} onBack={() => setOpenDevice(null)} iomt={iomt} />
      ) : (
        <Dashboard nodes={filtered} totalNodes={nodes.length} now={now}
                   canDrag={canDrag} onReorder={saveOrder}
                   onOpen={setOpenDevice} iomt={iomt} />
      )}

      <footer className="foot">IoMT teaching prototype — not a medical device.</footer>
    </div>
  )
}
