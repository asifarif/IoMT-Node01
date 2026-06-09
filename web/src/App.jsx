import { useState, useMemo } from 'react'
import { useIomt } from './hooks/useIomt'
import Dashboard from './components/Dashboard'
import NodeDetail from './components/NodeDetail'
import SearchBar from './components/SearchBar'

export default function App() {
  const iomt = useIomt()
  const { patients, readings, manual, ready } = iomt
  const [query, setQuery] = useState('')
  const [openDevice, setOpenDevice] = useState(null)

  const patientByDevice = useMemo(() => {
    const m = {}; patients.forEach(p => { if (p.device_id) m[p.device_id] = p }); return m
  }, [patients])

  const latestVitals = useMemo(() => {
    const m = {}; readings.forEach(r => { m[r.device_id] = r }); return m
  }, [readings])

  const latestManual = useMemo(() => {
    const m = {}; manual.forEach(e => { (m[e.device_id] ||= {})[e.kind] = e.value }); return m
  }, [manual])

  // AUTO-DISCOVERY: a node exists if it appears in patients OR has sent any vitals.
  const deviceIds = useMemo(() => {
    const s = new Set()
    patients.forEach(p => p.device_id && s.add(p.device_id))
    readings.forEach(r => s.add(r.device_id))
    return [...s].sort()
  }, [patients, readings])

  const nodes = useMemo(() => deviceIds.map(id => ({
    device_id: id,
    patient: patientByDevice[id] || null,
    latest: latestVitals[id] || null,
    manual: latestManual[id] || {},
  })), [deviceIds, patientByDevice, latestVitals, latestManual])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return nodes
    return nodes.filter(n =>
      n.device_id.toLowerCase().includes(q) ||
      (n.patient?.full_name || '').toLowerCase().includes(q) ||
      (n.patient?.mrn || '').toLowerCase().includes(q))
  }, [nodes, query])

  const openNode = openDevice ? nodes.find(n => n.device_id === openDevice) : null

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>IoMT Telemedicine Dashboard</h1>
          <p className="sub">{nodes.length} node{nodes.length !== 1 ? 's' : ''} \u00B7 live</p>
        </div>
        <SearchBar value={query} onChange={setQuery} />
      </header>

      {!ready && <div className="warn">Supabase not configured \u2014 set <code>web/.env.local</code> and restart.</div>}

      {openNode ? (
        <NodeDetail node={openNode} readings={readings} manual={manual}
                    onBack={() => setOpenDevice(null)} iomt={iomt} />
      ) : (
        <Dashboard nodes={filtered} totalNodes={nodes.length}
                   onOpen={setOpenDevice} iomt={iomt} />
      )}

      <footer className="foot">IoMT teaching prototype \u2014 not a medical device.</footer>
    </div>
  )
}
