import { useCallback, useEffect, useRef } from 'react'

const BEEP_FREQUENCY = 880
const BEEP_MS = 200
const REPEAT_MS = 2000

export function useAlarmSound({ alarmActive, muted }) {
  const audioCtxRef = useRef(null)
  const timerRef = useRef(null)
  const activeRef = useRef({ alarmActive, muted })

  useEffect(() => {
    activeRef.current = { alarmActive, muted }
  }, [alarmActive, muted])

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return null
      audioCtxRef.current = new AudioCtx()
    }
    return audioCtxRef.current
  }, [])

  const playBeep = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx || ctx.state !== 'running') return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const now = ctx.currentTime
    const end = now + BEEP_MS / 1000

    osc.type = 'sine'
    osc.frequency.setValueAtTime(BEEP_FREQUENCY, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(end)
  }, [])

  const clearBeepTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startBeepTimer = useCallback(() => {
    clearBeepTimer()
    playBeep()
    timerRef.current = setInterval(() => {
      if (activeRef.current.alarmActive && !activeRef.current.muted) playBeep()
    }, REPEAT_MS)
  }, [clearBeepTimer, playBeep])

  const resumeAudio = useCallback(async ({ mutedOverride } = {}) => {
    const ctx = getAudioContext()
    if (!ctx) return false
    if (ctx.state === 'suspended') await ctx.resume()
    const isMuted = mutedOverride ?? activeRef.current.muted
    if (activeRef.current.alarmActive && !isMuted) startBeepTimer()
    return ctx.state === 'running'
  }, [getAudioContext, startBeepTimer])

  useEffect(() => {
    clearBeepTimer()
    if (!alarmActive || muted) return

    const ctx = audioCtxRef.current
    if (ctx?.state === 'running') startBeepTimer()

    return clearBeepTimer
  }, [alarmActive, muted, clearBeepTimer, startBeepTimer])

  useEffect(() => {
    return () => {
      clearBeepTimer()
      audioCtxRef.current?.close()
    }
  }, [clearBeepTimer])

  return { resumeAudio }
}
