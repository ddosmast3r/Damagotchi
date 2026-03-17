// Shared audio context - needs user interaction to unlock
let audioCtx: AudioContext | null = null
let isUnlocked = false

export const initAudio = () => {
  if (audioCtx) return audioCtx

  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    return audioCtx
  } catch (e) {
    return null
  }
}

export const unlockAudio = async () => {
  if (isUnlocked) return

  const ctx = initAudio()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  // Play silent buffer to unlock
  const buffer = ctx.createBuffer(1, 1, 22050)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start()

  isUnlocked = true
}

export const playBeep = (frequency: number, duration: number, delay: number = 0) => {
  setTimeout(() => {
    const ctx = initAudio()
    if (!ctx || ctx.state === 'suspended') return

    try {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'square'

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch (e) {}
  }, delay)
}
