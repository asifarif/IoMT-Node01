import { VITAL_TYPES, nodeState, lastSeenLabel, fmt } from '../lib/vitals'

const CARD_VITAL_TYPES = VITAL_TYPES.filter(v => v.source === 'device')

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
                onClick={(e) => e.stopPropagation()} title="Drag to reorder">{'\u283F'}</span>
        )}
        <span className={`dot dot--${state}`} />
        <strong>{name}</strong>
        <span className="bed">{patient?.bed || ''}</span>
      </div>
      <div className="card-meta">{device_id}{patient?.mrn ? ` \u00B7 MRN ${patient.mrn}` : ''}</div>
      <div className="card-vitals">
        {CARD_VITAL_TYPES.map(vt => (
          <div className="vital" key={vt.key}>
            <span className="v" style={{ '--vital-color': vt.color }}>
              {fmt(latest?.[vt.key], vt.decimals)}
            </span>
            <span className="u">{vt.unit} {vt.cardLabel || vt.label}</span>
          </div>
        ))}
      </div>
      <div className="card-foot">
        {state === 'inactive'
          ? <span className="inactive-text">{`inactive \u00B7 ${lastSeenLabel(lastSeenMs)}`}</span>
          : state === 'alarm'
            ? <span className="alarm-text">{reasons.join(' \u00B7 ')}</span>
            : <span>stable</span>}
        <span className="seen">
          {state !== 'inactive' && latest ? new Date(latest.recorded_at).toLocaleTimeString() : ''}
        </span>
      </div>
    </div>
  )
}
