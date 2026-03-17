import { useState, useEffect } from 'react'
import { PetState } from '../App'
import { SHOP_ITEMS, JOBS, ShopItem, Job } from '../gameData'
import './GameScreen.css'

type ScreenMode = 'pet' | 'stats' | 'feed' | 'work'

interface GameScreenProps {
  petState: PetState
  coins: number
  inventory: { [itemId: string]: number }
  onUseItem: (item: ShopItem) => void
  onWorkComplete: (reward: number, energyCost: number) => void
  animation: string | null
}

// Larger pet sprite (16x16)
const PET_SPRITE = {
  idle1: [
    '                ',
    '     ####       ',
    '   ########     ',
    '  ##########    ',
    '  ##  ##  ##    ',
    '  ##########    ',
    '  ##  ##  ##    ',
    '   ########     ',
    '    ######      ',
    '   ########     ',
    '  ##########    ',
    '  ##  ##  ##    ',
    '  ##      ##    ',
    '  ##      ##    ',
    '                ',
    '                ',
  ],
  idle2: [
    '                ',
    '     ####       ',
    '   ########     ',
    '  ##########    ',
    '  ##  ##  ##    ',
    '  ##########    ',
    '  ##  ##  ##    ',
    '   ########     ',
    '    ######      ',
    '   ########     ',
    '  ##########    ',
    '   ##    ##     ',
    '   ##    ##     ',
    '                ',
    '                ',
    '                ',
  ],
}

export function GameScreen({
  petState,
  coins,
  inventory,
  onUseItem,
  onWorkComplete,
  animation
}: GameScreenProps) {
  const [mode, setMode] = useState<ScreenMode>('pet')
  const [frame, setFrame] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isWorking, setIsWorking] = useState(false)
  const [workProgress, setWorkProgress] = useState(0)
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Animation tick
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 2)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Work progress
  useEffect(() => {
    if (!isWorking || !activeJob) return

    const interval = setInterval(() => {
      setWorkProgress(prev => {
        const newProgress = prev + (100 / activeJob.duration)
        if (newProgress >= 100) {
          setIsWorking(false)
          onWorkComplete(activeJob.reward, activeJob.energyCost)
          showMessage(`+${activeJob.reward} coins!`)
          setActiveJob(null)
          return 0
        }
        return newProgress
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isWorking, activeJob, onWorkComplete])

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 1500)
  }

  // Get current list items
  const getItems = (): (ShopItem | Job)[] => {
    if (mode === 'feed') {
      // Show owned food items
      return SHOP_ITEMS.filter(item =>
        item.type === 'food' && (inventory[item.id] || 0) > 0
      )
    }
    if (mode === 'work') return JOBS
    return []
  }

  const items = getItems()

  // Handle select/action
  const handleSelect = () => {
    if (mode === 'pet' || mode === 'stats') return

    if (mode === 'feed' && items.length > 0) {
      const item = items[selectedIndex] as ShopItem
      if (item) {
        onUseItem(item)
        showMessage('nom nom!')
        // Check if item is now empty
        if ((inventory[item.id] || 0) <= 1) {
          setSelectedIndex(Math.max(0, selectedIndex - 1))
        }
      }
    }

    if (mode === 'work' && !isWorking) {
      const job = items[selectedIndex] as Job
      if (job && petState.energy >= job.energyCost) {
        setActiveJob(job)
        setWorkProgress(0)
        setIsWorking(true)
      } else {
        showMessage('too tired!')
      }
    }
  }

  // Navigation
  const handleUp = () => {
    if (items.length > 0) {
      setSelectedIndex(i => (i - 1 + items.length) % items.length)
    }
  }

  const handleDown = () => {
    if (items.length > 0) {
      setSelectedIndex(i => (i + 1) % items.length)
    }
  }

  // Mode buttons
  const setModeAndReset = (newMode: ScreenMode) => {
    if (isWorking && newMode !== 'work') return
    setMode(newMode)
    setSelectedIndex(0)
  }

  // Render ASCII pet
  const renderPet = () => {
    const sprite = frame === 0 ? PET_SPRITE.idle1 : PET_SPRITE.idle2

    return (
      <div className="pet-area">
        <pre className={`pet-sprite ${animation || ''}`}>
          {sprite.join('\n')}
        </pre>
        {animation && (
          <div className="pet-action">
            {animation === 'eat' && '* nom *'}
            {animation === 'play' && '* yay *'}
            {animation === 'heal' && '* +hp *'}
          </div>
        )}
      </div>
    )
  }

  // Render stats
  const renderStats = () => {
    const bar = (value: number) => {
      const filled = Math.floor(value / 10)
      return '[' + '#'.repeat(filled) + '-'.repeat(10 - filled) + ']'
    }

    return (
      <div className="stats-area">
        <div className="stat-row">
          <span className="stat-label">HUNGER</span>
          <span className="stat-bar">{bar(petState.hunger)}</span>
          <span className="stat-value">{Math.floor(petState.hunger)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">HAPPY</span>
          <span className="stat-bar">{bar(petState.happiness)}</span>
          <span className="stat-value">{Math.floor(petState.happiness)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">ENERGY</span>
          <span className="stat-bar">{bar(petState.energy)}</span>
          <span className="stat-value">{Math.floor(petState.energy)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">HEALTH</span>
          <span className="stat-bar">{bar(petState.health)}</span>
          <span className="stat-value">{Math.floor(petState.health)}</span>
        </div>
        <div className="stat-coins">
          COINS: {coins}
        </div>
      </div>
    )
  }

  // Render feed menu
  const renderFeed = () => {
    const foodItems = SHOP_ITEMS.filter(item =>
      item.type === 'food' && (inventory[item.id] || 0) > 0
    )

    if (foodItems.length === 0) {
      return (
        <div className="empty-message">
          NO FOOD!
          <div className="empty-hint">buy at shop</div>
        </div>
      )
    }

    return (
      <div className="menu-list">
        {foodItems.map((item, idx) => (
          <div
            key={item.id}
            className={`menu-item ${idx === selectedIndex ? 'selected' : ''}`}
          >
            <span className="menu-name">{item.name.toUpperCase()}</span>
            <span className="menu-count">x{inventory[item.id]}</span>
          </div>
        ))}
      </div>
    )
  }

  // Render work menu
  const renderWork = () => {
    if (isWorking && activeJob) {
      const progressBar = '[' + '='.repeat(Math.floor(workProgress / 10)) +
                          '-'.repeat(10 - Math.floor(workProgress / 10)) + ']'
      return (
        <div className="work-area">
          <div className="work-title">{activeJob.name.toUpperCase()}</div>
          <div className="work-progress-bar">{progressBar}</div>
          <div className="work-percent">{Math.floor(workProgress)}%</div>
          <div className="work-reward">REWARD: +{activeJob.reward}</div>
        </div>
      )
    }

    return (
      <div className="menu-list">
        {JOBS.map((job, idx) => {
          const canWork = petState.energy >= job.energyCost
          return (
            <div
              key={job.id}
              className={`menu-item ${idx === selectedIndex ? 'selected' : ''} ${!canWork ? 'disabled' : ''}`}
            >
              <span className="menu-name">{job.name.toUpperCase()}</span>
              <span className="menu-info">+{job.reward} / -{job.energyCost}E</span>
            </div>
          )
        })}
      </div>
    )
  }

  // Render main content based on mode
  const renderContent = () => {
    switch (mode) {
      case 'pet': return renderPet()
      case 'stats': return renderStats()
      case 'feed': return renderFeed()
      case 'work': return renderWork()
    }
  }

  return (
    <div className="game-fullscreen">
      {/* Main LCD Screen */}
      <div className="lcd-screen">
        {/* Header */}
        <div className="lcd-header">
          <span className="header-title">DAMAGOTCHI</span>
          <span className="header-coins">${coins}</span>
        </div>

        {/* Content */}
        <div className="lcd-content">
          {renderContent()}
        </div>

        {/* Message */}
        {message && <div className="lcd-message">{message}</div>}
      </div>

      {/* Controls - Gamepad style */}
      <div className="controls">
        {/* Top row: Menu icons */}
        <div className="menu-icons">
          <button
            className={`menu-icon ${mode === 'pet' ? 'active' : ''}`}
            onClick={() => setModeAndReset('pet')}
            disabled={isWorking && mode !== 'pet'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="8" r="5"/>
              <path d="M12 14c-5 0-9 2-9 5v2h18v-2c0-3-4-5-9-5z"/>
            </svg>
          </button>
          <button
            className={`menu-icon ${mode === 'stats' ? 'active' : ''}`}
            onClick={() => setModeAndReset('stats')}
            disabled={isWorking && mode !== 'stats'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="12" width="4" height="9"/>
              <rect x="10" y="6" width="4" height="15"/>
              <rect x="17" y="3" width="4" height="18"/>
            </svg>
          </button>
          <button
            className={`menu-icon ${mode === 'feed' ? 'active' : ''}`}
            onClick={() => setModeAndReset('feed')}
            disabled={isWorking && mode !== 'feed'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <ellipse cx="12" cy="15" rx="8" ry="6"/>
              <path d="M8 9c0-3 2-6 4-6s4 3 4 6"/>
            </svg>
          </button>
          <button
            className={`menu-icon ${mode === 'work' ? 'active' : ''}`}
            onClick={() => setModeAndReset('work')}
            disabled={isWorking && mode !== 'work'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>

        {/* Bottom row: D-pad + Action buttons */}
        <div className="gamepad">
          {/* D-Pad */}
          <div className="dpad">
            <button className="dpad-btn dpad-up" onClick={handleUp}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-8 8h16z"/>
              </svg>
            </button>
            <button className="dpad-btn dpad-left" onClick={handleUp}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 12l8-8v16z"/>
              </svg>
            </button>
            <div className="dpad-center"></div>
            <button className="dpad-btn dpad-right" onClick={handleDown}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 12l-8 8V4z"/>
              </svg>
            </button>
            <button className="dpad-btn dpad-down" onClick={handleDown}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 20l8-8H4z"/>
              </svg>
            </button>
          </div>

          {/* Action buttons */}
          <div className="action-btns">
            <button className="action-btn btn-b" onClick={() => setModeAndReset('pet')}>
              B
            </button>
            <button className="action-btn btn-a" onClick={handleSelect}>
              A
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
