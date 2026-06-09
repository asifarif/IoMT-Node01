// Single source of truth for vital types. Add a new vital here and it
// flows through the readout + charts automatically (clean expansion hook).
export const VITAL_TYPES = [
  { key: 'heart_rate', label: 'Heart rate',   unit: 'bpm',   source: 'device', decimals: 0, color: '#f4716b' },
  { key: 'body_temp',  label: 'Body temp',    unit: '°C',    source: 'device', decimals: 1, color: '#0e7c86' },
  { key: 'spo2',       label: 'SpO2',         unit: '%',     source: 'device', decimals: 0, color: '#3fb8ae' },
  { key: 'bp_sys',     label: 'BP systolic',  unit: 'mmHg',  source: 'manual', decimals: 0, color: '#9467bd' },
  { key: 'bp_dia',     label: 'BP diastolic', unit: 'mmHg',  source: 'manual', decimals: 0, color: '#8c564b' },
  { key: 'glucose',    label: 'Glucose',      unit: 'mg/dL', source: 'manual', decimals: 0, color: '#f4a340' },
  { key: 'weight',     label: 'Weight',       unit: 'kg',    source: 'manual', decimals: 1, color: '#5e777e' },
]

export const MANUAL_KINDS = VITAL_TYPES.filter(v => v.source === 'manual')

export const DEFAULT_THRESHOLDS = { hr_min: 50, hr_max: 120, temp_min: 35, temp_max: 38 }

export function fmt(v, d = 1) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '\u2014'
  return Number(v).toFixed(d)
}

// Returns { alarm, reasons[] } by comparing latest HR/temp to the patient's thresholds.
export function checkAlarm(patient, latest) {
  if (!latest) return { alarm: false, reasons: [] }
  const t = patient || {}
  const hrMin = t.hr_min ?? DEFAULT_THRESHOLDS.hr_min
  const hrMax = t.hr_max ?? DEFAULT_THRESHOLDS.hr_max
  const tMin  = t.temp_min ?? DEFAULT_THRESHOLDS.temp_min
  const tMax  = t.temp_max ?? DEFAULT_THRESHOLDS.temp_max
  const reasons = []
  const hr = Number(latest.heart_rate)
  const tp = Number(latest.body_temp)
  if (!Number.isNaN(hr) && (hr < hrMin || hr > hrMax)) reasons.push(`HR ${hr} (limit ${hrMin}\u2013${hrMax})`)
  if (!Number.isNaN(tp) && (tp < tMin || tp > tMax)) reasons.push(`Temp ${tp} (limit ${tMin}\u2013${tMax})`)
  return { alarm: reasons.length > 0, reasons }
}
