import { VITAL_TYPES, nodeState, lastSeenLabel, fmt } from '../lib/vitals'

const CARD_VITAL_TYPES = VITAL_TYPES.filter(v => v.source === 'device')

export default function NodeCard({
  node, now, onOpen, canDrag, dragging, over,
  onDragStart, onDragOver, onDrop, onDragEnd,
  muted, onToggleMute,
}) {
  const { patient, latest, device_id } = node
  const { state, breaches, lastSeenMs } = nodeState(patient, latest, now)
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
                onClick={(e) => e.stopPropagation()} title="Drag to reorder">{'⠿'}</span>
        )}
        <span className={`dot dot--${state}`} />
        <strong>{name}</strong>
        <span className="bed">{patient?.bed || ''}</span>
        {state === 'alarm' && onToggleMute && (
          <button
            type="button"
            className={['card-bell', muted && 'card-bell--muted'].filter(Boolean).join(' ')}
            onClick={(e) => { e.stopPropagation(); onToggleMute(device_id) }}
            title={muted ? 'Unmute this node (audio only)' : 'Mute this node (audio only)'}
            aria-label={muted ? 'Unmute this node audio' : 'Mute this node audio'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
              {muted && <path d="M4 4l16 16" />}
            </svg>
          </button>
        )}
      </div>
      <div className="card-meta">{device_id}{patient?.mrn ? ` · MRN ${patient.mrn}` : ''}</div>
      <div className="card-vitals">
        {CARD_VITAL_TYPES.map(vt => {
          const breach = breaches[vt.key]
          return (
            <div className="vital" key={vt.key}>
              <span className="vital-val">
                <span className={['v', breach && 'v--alarm'].filter(Boolean).join(' ')}
                      style={{ '--vital-color': vt.color }}>
                  {fmt(latest?.[vt.key], vt.decimals)}
                </span>
                {breach && <span className={`vchip vchip--${breach}`}>{breach.toUpperCase()}</span>}
              </span>
              <span className="u">{vt.unit} {vt.cardLabel || vt.label}</span>
            </div>
          )
        })}
      </div>
      <div className="card-foot">
        {state === 'inactive'
          ? <span className="inactive-text">{`inactive · ${lastSeenLabel(lastSeenMs)}`}</span>
          : state === 'ok'
            ? <span>stable</span>
            : <span />}
        <span className="seen">
          {state !== 'inactive' && latest ? new Date(latest.recorded_at).toLocaleTimeString() : ''}
        </span>
      </div>
    </div>
  )
}
