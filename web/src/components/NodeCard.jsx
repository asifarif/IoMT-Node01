import { nodeState, lastSeenLabel, fmt } from '../lib/vitals'

export default function NodeCard({
  node, now, onOpen, canDrag, dragging, over,
  onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  const { patient, latest, device_id } = node
  const { state, reasons, lastSeenMs } = nodeState(patient, latest, now)
  const name = patient?.full_name || 'Unregistered node'

  const cls = ['card',
    state === 'alarm' && 'card--alarm',
    state === 'inactive' && 'card--inactive',
    dragging && 'card--dragging',
    over && 'card--over',
  ].filter(Boolean).join(' ')

  function onKey(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }

  return (
    <div className={cls} role="button" tabIndex={0} onClick={onOpen} onKeyDown={onKey}
         onDragOver={onDragOver} onDrop={onDrop}>
      <div className="card-head">
        {canDrag && (
          <span className="grip" draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
                onClick={(e) => e.stopPropagation()} title="Drag to reorder">⠿</span>
        )}
        <span className={`dot dot--${state}`} />
        <strong>{name}</strong>
        <span className="bed">{patient?.bed || ''}</span>
      </div>
      <div className="card-meta">{device_id}{patient?.mrn ? ` · MRN ${patient.mrn}` : ''}</div>
      <div className="card-vitals">
        <div className="vital"><span className="v">{fmt(latest?.heart_rate, 0)}</span><span className="u">bpm HR</span></div>
        <div className="vital"><span className="v">{fmt(latest?.body_temp, 1)}</span><span className="u">°C temp</span></div>
        <div className="vital"><span className="v">{fmt(latest?.spo2, 0)}</span><span className="u">% SpO₂</span></div>
      </div>
      <div className="card-foot">
        {state === 'inactive'
          ? <span className="inactive-text">inactive · {lastSeenLabel(lastSeenMs)}</span>
          : state === 'alarm'
            ? <span className="alarm-text">{reasons.join(' · ')}</span>
            : <span>stable</span>}
        <span className="seen">
          {state !== 'inactive' && latest ? new Date(latest.recorded_at).toLocaleTimeString() : ''}
        </span>
      </div>
    </div>
  )
}
