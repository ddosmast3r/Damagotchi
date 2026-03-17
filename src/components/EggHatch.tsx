import { useState, useEffect, useRef } from 'react'
import './EggHatch.css'

interface EggHatchProps {
  onHatch: () => void
}

// Game Boy palette
const GAMEBOY_PALETTE = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']

// Pixel art egg (16x16)
const EGG_SPRITE = [
  [3,3,3,3,3,3,2,2,2,2,3,3,3,3,3,3],
  [3,3,3,3,3,2,1,1,1,1,2,3,3,3,3,3],
  [3,3,3,3,2,1,1,1,1,1,1,2,3,3,3,3],
  [3,3,3,2,1,1,1,1,1,1,1,1,2,3,3,3],
  [3,3,2,1,1,1,1,1,1,1,1,1,1,2,3,3],
  [3,3,2,1,1,0,1,1,1,1,0,1,1,2,3,3],
  [3,2,1,1,1,1,1,1,1,1,1,1,1,1,2,3],
  [3,2,1,1,1,1,1,1,1,1,1,1,1,1,2,3],
  [3,2,1,1,1,1,1,1,1,1,1,1,1,1,2,3],
  [3,2,1,0,1,1,1,1,1,1,1,1,0,1,2,3],
  [3,2,1,1,1,1,1,1,1,1,1,1,1,1,2,3],
  [3,3,2,1,1,1,1,1,1,1,1,1,1,2,3,3],
  [3,3,2,1,1,1,1,1,1,1,1,1,1,2,3,3],
  [3,3,3,2,1,1,1,1,1,1,1,1,2,3,3,3],
  [3,3,3,3,2,2,1,1,1,1,2,2,3,3,3,3],
  [3,3,3,3,3,3,2,2,2,2,3,3,3,3,3,3],
]

// Cracking egg stages
const EGG_CRACK_1 = [
  [3,3,3,3,3,3,2,2,2,2,3,3,3,3,3,3],
  [3,3,3,3,3,2,1,1,1,1,2,3,3,3,3,3],
  [3,3,3,3,2,1,1,1,1,1,1,2,3,3,3,3],
  [3,3,3,2,1,1,1,1,1,1,1,1,2,3,3,3],
  [3,3,2,1,1,1,1,1,1,1,1,1,1,2,3,3],
  [3,3,2,1,1,0,1,1,1,1,0,1,1,2,3,3],
  [3,2,1,1,1,1,1,1,1,1,1,1,1,1,2,3],
  [3,2,1,1,1,1,1,1,0,0,1,1,1,1,2,3],
  [3,2,1,1,1,1,1,0,1,1,0,1,1,1,2,3],
  [3,2,1,0,1,1,1,1,1,1,1,1,0,1,2,3],
  [3,2,1,1,1,1,1,1,1,1,1,1,1,1,2,3],
  [3,3,2,1,1,1,1,1,1,1,1,1,1,2,3,3],
  [3,3,2,1,1,1,1,1,1,1,1,1,1,2,3,3],
  [3,3,3,2,1,1,1,1,1,1,1,1,2,3,3,3],
  [3,3,3,3,2,2,1,1,1,1,2,2,3,3,3,3],
  [3,3,3,3,3,3,2,2,2,2,3,3,3,3,3,3],
]

const EGG_CRACK_2 = [
  [3,3,3,3,3,3,2,2,2,2,3,3,3,3,3,3],
  [3,3,3,3,3,2,1,1,1,1,2,3,3,3,3,3],
  [3,3,3,3,2,1,1,0,0,1,1,2,3,3,3,3],
  [3,3,3,2,1,1,0,1,1,0,1,1,2,3,3,3],
  [3,3,2,1,1,1,1,1,1,1,1,1,1,2,3,3],
  [3,3,2,1,1,0,1,1,1,1,0,1,1,2,3,3],
  [3,2,1,1,1,1,1,0,0,1,1,1,1,1,2,3],
  [3,2,1,1,1,1,0,1,1,0,1,1,1,1,2,3],
  [3,2,1,1,0,0,1,1,1,1,0,0,1,1,2,3],
  [3,2,1,0,1,1,1,1,1,1,1,1,0,1,2,3],
  [3,2,1,1,1,1,1,1,1,1,1,1,1,1,2,3],
  [3,3,2,1,1,0,1,1,1,1,0,1,1,2,3,3],
  [3,3,2,1,1,1,0,0,0,0,1,1,1,2,3,3],
  [3,3,3,2,1,1,1,1,1,1,1,1,2,3,3,3],
  [3,3,3,3,2,2,1,1,1,1,2,2,3,3,3,3],
  [3,3,3,3,3,3,2,2,2,2,3,3,3,3,3,3],
]

const EGG_CRACK_3 = [
  [3,3,3,3,3,3,2,3,3,2,3,3,3,3,3,3],
  [3,3,3,3,3,2,1,2,2,1,2,3,3,3,3,3],
  [3,3,3,3,2,1,0,1,1,0,1,2,3,3,3,3],
  [3,3,3,2,1,0,1,1,1,1,0,1,2,3,3,3],
  [3,3,2,1,1,1,1,1,1,1,1,1,1,2,3,3],
  [3,3,2,1,0,0,1,1,1,1,0,0,1,2,3,3],
  [3,2,1,0,1,1,1,0,0,1,1,1,0,1,2,3],
  [3,2,0,1,1,1,0,1,1,0,1,1,1,0,2,3],
  [3,2,1,1,0,0,1,1,1,1,0,0,1,1,2,3],
  [3,2,0,0,1,1,1,1,1,1,1,1,0,0,2,3],
  [3,2,1,1,1,1,1,1,1,1,1,1,1,1,2,3],
  [3,3,2,1,0,0,1,1,1,1,0,0,1,2,3,3],
  [3,3,2,0,1,1,0,0,0,0,1,1,0,2,3,3],
  [3,3,3,2,1,1,1,1,1,1,1,1,2,3,3,3],
  [3,3,3,3,2,2,1,1,1,1,2,2,3,3,3,3],
  [3,3,3,3,3,3,2,2,2,2,3,3,3,3,3,3],
]

// Hatching animation - egg breaks apart
const EGG_HATCHING = [
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,3,2,3,3,3,3,3,3,3,3,3,3,2,3,3],
  [3,2,1,2,3,3,3,3,3,3,3,3,2,1,2,3],
  [3,2,1,1,2,3,3,3,3,3,3,2,1,1,2,3],
  [3,3,2,1,1,2,3,3,3,3,2,1,1,2,3,3],
  [3,3,3,2,1,1,2,3,3,2,1,1,2,3,3,3],
  [3,3,3,3,2,1,1,2,2,1,1,2,3,3,3,3],
  [3,3,3,3,3,2,1,1,1,1,2,3,3,3,3,3],
  [3,3,3,3,3,3,2,1,1,2,3,3,3,3,3,3],
  [3,3,2,1,1,2,2,1,1,2,2,1,1,2,3,3],
  [3,2,1,1,1,1,1,1,1,1,1,1,1,1,2,3],
  [3,2,1,1,1,1,1,1,1,1,1,1,1,1,2,3],
  [3,3,2,2,2,2,1,1,1,1,2,2,2,2,3,3],
  [3,3,3,3,3,3,2,2,2,2,3,3,3,3,3,3],
]

const WARMTH_MESSAGES = [
  "tap to warm the egg...",
  "it's getting warmer!",
  "almost there...",
  "something is moving!",
  "it's hatching!"
]

export function EggHatch({ onHatch }: EggHatchProps) {
  const [warmth, setWarmth] = useState(0)
  const [wobble, setWobble] = useState(false)
  const [crackStage, setCrackStage] = useState(0)
  const [isHatching, setIsHatching] = useState(false)
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparkleId = useRef(0)

  const WARMTH_NEEDED = 100

  // Get current egg sprite based on crack stage
  const getEggSprite = () => {
    if (isHatching) return EGG_HATCHING
    if (crackStage >= 3) return EGG_CRACK_3
    if (crackStage >= 2) return EGG_CRACK_2
    if (crackStage >= 1) return EGG_CRACK_1
    return EGG_SPRITE
  }

  // Draw egg on canvas
  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const sprite = getEggSprite()
    const scale = 8

    ctx.fillStyle = GAMEBOY_PALETTE[3]
    ctx.fillRect(0, 0, 16 * scale, 16 * scale)

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const colorIndex = sprite[y][x]
        if (colorIndex !== 3) {
          ctx.fillStyle = GAMEBOY_PALETTE[colorIndex]
          ctx.fillRect(x * scale, y * scale, scale, scale)
        }
      }
    }
  }, [crackStage, isHatching])

  // Handle tap on egg
  const handleTap = () => {
    if (isHatching) return

    // Add warmth
    const newWarmth = Math.min(WARMTH_NEEDED, warmth + 5)
    setWarmth(newWarmth)

    // Wobble animation
    setWobble(true)
    setTimeout(() => setWobble(false), 200)

    // Add sparkle effect
    const sparkle = {
      id: sparkleId.current++,
      x: 30 + Math.random() * 60,
      y: 20 + Math.random() * 40
    }
    setSparkles(prev => [...prev, sparkle])
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== sparkle.id))
    }, 500)

    // Update crack stage based on warmth
    const progress = newWarmth / WARMTH_NEEDED
    if (progress >= 0.75) setCrackStage(3)
    else if (progress >= 0.5) setCrackStage(2)
    else if (progress >= 0.25) setCrackStage(1)

    // Check if hatching
    if (newWarmth >= WARMTH_NEEDED) {
      setIsHatching(true)
      setTimeout(() => {
        onHatch()
      }, 1500)
    }
  }

  // Auto wobble when near hatching
  useEffect(() => {
    if (warmth > 80 && !isHatching) {
      const interval = setInterval(() => {
        setWobble(true)
        setTimeout(() => setWobble(false), 200)
      }, 800)
      return () => clearInterval(interval)
    }
  }, [warmth, isHatching])

  // Get message based on warmth
  const getMessage = () => {
    if (isHatching) return WARMTH_MESSAGES[4]
    const index = Math.min(3, Math.floor((warmth / WARMTH_NEEDED) * 4))
    return WARMTH_MESSAGES[index]
  }

  // Calculate warmth bar segments (5 LEDs like the main game)
  const warmthLeds = Array.from({ length: 5 }, (_, i) => {
    const threshold = (i + 1) * 20
    return warmth >= threshold
  })

  return (
    <div className="egg-hatch-container">
      <div className="device-body">
        <div className="device-screen gameboy-screen">
          <div className="egg-area" onClick={handleTap}>
            {/* Sparkle effects */}
            {sparkles.map(sparkle => (
              <div
                key={sparkle.id}
                className="sparkle"
                style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
              >
                *
              </div>
            ))}

            {/* Egg canvas */}
            <canvas
              ref={canvasRef}
              width={128}
              height={128}
              className={`egg-canvas ${wobble ? 'wobble' : ''} ${isHatching ? 'hatching' : ''}`}
            />

            {/* Message */}
            <div className="egg-message">{getMessage()}</div>

            {/* Hatching effect */}
            {isHatching && (
              <div className="hatch-flash" />
            )}
          </div>
        </div>

        {/* Warmth indicator */}
        <div className="led-panel">
          <div className="led-labels">
            <span className="led-label">WARM</span>
          </div>
          <div className="led-columns">
            <div className="led-indicators">
              {warmthLeds.map((on, i) => (
                <div
                  key={i}
                  className={`led ${on ? 'on' : 'off'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tap hint */}
      {warmth < 10 && (
        <div className="tap-hint">
          tap the egg!
        </div>
      )}
    </div>
  )
}
