import { useEffect, useState, useCallback } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'

// Alert event log + audit trail. Alerts are created server-side by a trigger
// on `vitals` (see supabase/migration_mvp4c.sql); here we only read them, watch
// for live changes, and record clinician acknowledgements.
export function useAlerts() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    if (!supabaseReady) return
    let active = true
    ;(async () => {
      const { data } = await supabase.from('alerts').select('*')
        .order('onset_at', { ascending: false }).limit(500)
      if (!active) return
      setAlerts(data || [])
    })()

    const ch = supabase.channel('alerts-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' },
        (p) => setAlerts(prev => [p.new, ...prev.filter(a => a.id !== p.new.id)]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'alerts' },
        (p) => setAlerts(prev => prev.map(a => a.id === p.new.id ? p.new : a)))
      .subscribe()

    return () => { active = false; supabase.removeChannel(ch) }
  }, [])

  // Acknowledge an alert: stamp who/when on the row and append an audit entry.
  // Alerts are never deleted.
  const acknowledgeAlert = useCallback(async (alertId, actorName) => {
    if (!supabaseReady) return
    const acknowledged_at = new Date().toISOString()
    const { data } = await supabase.from('alerts')
      .update({ acknowledged_at, acknowledged_by: actorName })
      .eq('id', alertId).select().maybeSingle()
    if (data) setAlerts(prev => prev.map(a => a.id === alertId ? data : a))
    await supabase.from('audit_log').insert({
      actor: actorName, action: 'acknowledge_alert',
      entity: 'alert', entity_id: String(alertId), details: {},
    })
  }, [])

  return { alerts, acknowledgeAlert, ready: supabaseReady }
}
