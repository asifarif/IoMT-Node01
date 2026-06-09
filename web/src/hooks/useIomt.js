import { useEffect, useState, useCallback } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'

export function useIomt() {
  const [patients, setPatients] = useState([])
  const [readings, setReadings] = useState([])
  const [manual, setManual]     = useState([])
  const [nodeOrder, setNodeOrder] = useState([])   // device_ids in display order
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
  const fetchOrder = useCallback(async () => {
    const { data } = await supabase.from('dashboard_state').select('node_order').eq('id', 1).maybeSingle()
    setNodeOrder(Array.isArray(data?.node_order) ? data.node_order : [])
  }, [])

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return }
    let active = true
    ;(async () => {
      const { data: vit } = await supabase.from('vitals').select('*')
        .order('recorded_at', { ascending: false }).limit(2000)
      if (!active) return
      setReadings((vit || []).reverse())
      await fetchPatients(); await fetchManual(); await fetchOrder()
      setLoading(false)
    })()

    const ch = supabase.channel('iomt-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vitals' },
        (p) => setReadings(prev => [...prev, p.new].slice(-4000)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'manual_entries' },
        (p) => setManual(prev => [...prev, p.new].slice(-1500)))
      .subscribe()

    return () => { active = false; supabase.removeChannel(ch) }
  }, [fetchPatients, fetchManual, fetchOrder])

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

  // Save the dragged triage order (optimistic + persisted, shared across screens).
  const saveOrder = useCallback(async (ids) => {
    setNodeOrder(ids)
    if (!supabaseReady) return
    await supabase.from('dashboard_state')
      .update({ node_order: ids, updated_at: new Date().toISOString() }).eq('id', 1)
  }, [])

  return { patients, readings, manual, nodeOrder, loading, ready: supabaseReady,
           addPatient, updatePatient, deleteNode, addManual, saveOrder }
}
