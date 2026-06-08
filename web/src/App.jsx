import { useEffect, useState, useMemo } from 'react'
import { supabase } from './lib/supabase'
import PatientCard from './components/PatientCard'
import VitalsChart from './components/VitalsChart'

const MAX_CHART_POINTS = 60

export default function App() {
  const [patients, setPatients] = useState([])
  const [readings, setReadings] = useState([])   // recent vitals, all devices
  const [selected, setSelected] = useState(null) // selected device_id

  useEffect(() => {
    let active = true

    async function load() {
      const { data: pats } = await supabase
        .from('patients').select('*').order('bed')
      const { data: vit } = await supabase
        .from('vitals').select('*')
        .order('recorded_at', { ascending: false })
        .limit(500)

      if (!active) return
      setPatients(pats || [])
      setReadings((vit || []).reverse())          // oldest -> newest for charting
      if (pats && pats.length) setSelected((s) => s || pats[0].device_id)
    }
    load()

    // Realtime: push every new vitals row into state as it arrives
    const channel = supabase
      .channel('vitals-stream')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vitals' },
        (payload) => {
          setReadings((prev) => [...prev, payload.new].slice(-2000))
        })
      .subscribe()

    return () => { active = false; supabase.removeChannel(channel) }
  }, [])

  // latest reading per device_id
  const latestByDevice = useMemo(() => {
    const map = {}
    for (const r of readings) map[r.device_id] = r
    return map
  }, [readings])

  const selectedSeries = useMemo(
    () => readings.filter((r) => r.device_id === selected).slice(-MAX_CHART_POINTS),
    [readings, selected]
  )

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>IoMT Telemedicine Dashboard</h1>
          <p className="sub">Live patient vitals · MVP3</p>
        </div>
        <span className="live">live</span>
      </header>

      <section className="cards">
        {patients.length === 0 && (
          <p className="empty">No patients yet — add one in Supabase, then power on a node.</p>
        )}
        {patients.map((p) => (
          <PatientCard
            key={p.device_id}
            patient={p}
            latest={latestByDevice[p.device_id]}
            active={selected === p.device_id}
            onSelect={() => setSelected(p.device_id)}
          />
        ))}
      </section>

      <section className="panel">
        <h2>{selected ? `Vitals — ${selected}` : 'Select a patient'}</h2>
        <VitalsChart data={selectedSeries} />
      </section>

      <footer className="foot">
        IoMT teaching prototype — not a medical device.
      </footer>
    </div>
  )
}
