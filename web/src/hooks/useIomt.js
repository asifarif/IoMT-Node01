import { useEffect, useState, useCallback } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'

// Central data hook: fetches patients/vitals/manual, streams realtime inserts,
// and exposes mutations for node management.
export function useIomt() {
  const [patients, setPatients] = useState([])
  const [readings, setReadings] = useState([])   // ascending by recorded_at
  const [manual, setManual]     = useState([])   // ascending by recorded_at
  const [loading, setLoading]   = useState(true)

  const fetchPatients = useCallback(async () => {
    const { data } = await supabase.from('patients').select('*').order('bed', { nullsFirst: true })
    setPatients(data || [])
  }, [])

  const fetchManual = useCallback(async () => {
    const { data } = await supabase.from('manual_entries').select('*')
      .order('recorded_at', { ascending: false }).limit(800)
    setManual((data || []).reverse())
  }, [])

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return }
    let active = true
    ;(async () => {
      const { data: vit } = await supabase.from('vitals').select('*')
        .order('recorded_at', { ascending: false }).limit(2000)
      if (!active) return
      setReadings((vit || []).reverse())
      await fetchPatients()
      await fetchManual()
      setLoading(false)
    })()

    const ch = supabase.channel('iomt-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vitals' },
        (p) => setReadings(prev => [...prev, p.new].slice(-4000)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'manual_entries' },
        (p) => setManual(prev => [...prev, p.new].slice(-1500)))
      .subscribe()

    return () => { active = false; supabase.removeChannel(ch) }
  }, [fetchPatients, fetchManual])

  const addPatient = useCallback(async (fields) => {
    await supabase.from('patients').insert(fields); await fetchPatients()
  }, [fetchPatients])

  const updatePatient = useCallback(async (id, fields) => {
    await supabase.from('patients').update(fields).eq('id', id); await fetchPatients()
  }, [fetchPatients])

  const deleteNode = useCallback(async (deviceId) => {
    await supabase.from('manual_entries').delete().eq('device_id', deviceId)
    await supabase.from('vitals').delete().eq('device_id', deviceId)
    await supabase.from('patients').delete().eq('device_id', deviceId)
    await fetchPatients()
    setReadings(prev => prev.filter(r => r.device_id !== deviceId))
    setManual(prev => prev.filter(m => m.device_id !== deviceId))
  }, [fetchPatients])

  const addManual = useCallback(async (deviceId, kind, value) => {
    await supabase.from('manual_entries').insert({ device_id: deviceId, kind, value })
    await fetchManual()
  }, [fetchManual])

  return { patients, readings, manual, loading, ready: supabaseReady,
           addPatient, updatePatient, deleteNode, addManual }
}
