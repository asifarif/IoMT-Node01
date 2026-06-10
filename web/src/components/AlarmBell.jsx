export default function AlarmBell({ alarmCount, muted, onToggleMute }) {
  const hasAlarm = alarmCount > 0
  const label = muted ? 'Alarm audio muted' : 'Alarm audio on'

  return (
    <button
      type="button"
      className={[
        'alarm-bell',
        hasAlarm && 'alarm-bell--active',
        muted && 'alarm-bell--muted',
      ].filter(Boolean).join(' ')}
      onClick={onToggleMute}
      aria-label={`${label}${hasAlarm ? `, ${alarmCount} active alarm${alarmCount === 1 ? '' : 's'}` : ''}`}
      title={muted ? 'Unmute alarm audio' : 'Mute alarm audio'}
    >
      <span className="alarm-bell__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="img">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
          {muted && <path className="alarm-bell__slash" d="M4 4l16 16" />}
        </svg>
      </span>
      {muted && <span className="alarm-bell__muted">Muted</span>}
      {hasAlarm && <span className="alarm-bell__badge">{alarmCount}</span>}
    </button>
  )
}
