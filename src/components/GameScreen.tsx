import { useState, useEffect } from 'react'
import { PetState } from '../App'
import { SHOP_ITEMS, JOBS, ShopItem, Job, GameEvent, GAME_CONFIG } from '../gameData'
import './GameScreen.css'

type ScreenMode = 'status' | 'inventory' | 'shop' | 'work' | 'sleep'

interface GameScreenProps {
  petState: PetState
  coins: number
  day: number
  actionsLeft: number
  nextRentDay: number
  inventory: { [itemId: string]: number }
  isGameOver: boolean
  gameOverReason: string | null
  currentEvent: GameEvent | null
  onUseItem: (item: ShopItem) => void
  onBuyItem: (item: ShopItem) => void
  onWorkComplete: (job: Job) => void
  onSleep: () => void
  onDismissEvent: () => void
  onRestart: () => void
  animation: string | null
}

// Simple ASCII pet
const PET_FRAMES = [
  [
    '  ___  ',
    ' (o o) ',
    ' ( > ) ',
    ' /| |\\ ',
    '  | |  ',
  ],
  [
    '  ___  ',
    ' (- -) ',
    ' ( < ) ',
    ' /| |\\ ',
    '  | |  ',
  ],
]

export function GameScreen({
  petState,
  coins,
  day,
  actionsLeft,
  nextRentDay,
  inventory,
  isGameOver,
  gameOverReason,
  currentEvent,
  onUseItem,
  onBuyItem,
  onWorkComplete,
  onSleep,
  onDismissEvent,
  onRestart,
  animation
}: GameScreenProps) {
  const [mode, setMode] = useState<ScreenMode>('status')
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
    }, 800)
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
          onWorkComplete(activeJob)
          showMessage(`+$${activeJob.reward}`)
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

  // Get items for current mode
  const getListItems = () => {
    if (mode === 'inventory') {
      return SHOP_ITEMS.filter(item => (inventory[item.id] || 0) > 0)
    }
    if (mode === 'shop') {
      return SHOP_ITEMS
    }
    if (mode === 'work') {
      return JOBS
    }
    return []
  }

  const listItems = getListItems()

  // Reset selection when mode changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [mode])

  // Handle A button (select/confirm)
  const handleSelect = () => {
    if (mode === 'status') return
    if (actionsLeft <= 0 && mode !== 'sleep') {
      showMessage('No actions left!')
      return
    }

    if (mode === 'inventory' && listItems.length > 0) {
      const item = listItems[selectedIndex] as ShopItem
      onUseItem(item)
      showMessage('Used!')
    }

    if (mode === 'shop' && listItems.length > 0) {
      const item = listItems[selectedIndex] as ShopItem
      if (coins >= item.price) {
        onBuyItem(item)
        showMessage('Bought!')
      } else {
        showMessage('No money!')
      }
    }

    if (mode === 'work' && !isWorking) {
      const job = listItems[selectedIndex] as Job
      if (petState.energy >= job.energyCost) {
        setActiveJob(job)
        setWorkProgress(0)
        setIsWorking(true)
      } else {
        showMessage('Too tired!')
      }
    }

    if (mode === 'sleep') {
      onSleep()
    }
  }

  // Navigation
  const handleUp = () => {
    if (listItems.length > 0) {
      setSelectedIndex(i => (i - 1 + listItems.length) % listItems.length)
    }
  }

  const handleDown = () => {
    if (listItems.length > 0) {
      setSelectedIndex(i => (i + 1) % listItems.length)
    }
  }

  // B button - back to status
  const handleBack = () => {
    if (!isWorking) {
      setMode('status')
    }
  }

  // Change mode
  const setModeIfAllowed = (newMode: ScreenMode) => {
    if (isWorking && newMode !== 'work') return
    setMode(newMode)
  }

  // Stat bar renderer
  const renderBar = (value: number, critical: boolean = false) => {
    const filled = Math.floor(value / 10)
    const bar = '[' + '#'.repeat(filled) + '-'.repeat(10 - filled) + ']'
    return <span className={critical && value < 20 ? 'critical' : ''}>{bar}</span>
  }

  // Render status screen - detailed stats
  const renderStatus = () => (
    <div className="stats-detail">
      <div className="stat-detail-row">
        <span className="stat-label">HUNGER</span>
        <span className="stat-bar">{renderBar(petState.hunger, true)}</span>
        <span className="stat-value">{Math.floor(petState.hunger)}%</span>
      </div>
      <div className="stat-detail-row">
        <span className="stat-label">HAPPY</span>
        <span className="stat-bar">{renderBar(petState.happiness, true)}</span>
        <span className="stat-value">{Math.floor(petState.happiness)}%</span>
      </div>
      <div className="stat-detail-row">
        <span className="stat-label">ENERGY</span>
        <span className="stat-bar">{renderBar(petState.energy, false)}</span>
        <span className="stat-value">{Math.floor(petState.energy)}%</span>
      </div>
      <div className="stat-detail-row">
        <span className="stat-label">HEALTH</span>
        <span className="stat-bar">{renderBar(petState.health, true)}</span>
        <span className="stat-value">{Math.floor(petState.health)}%</span>
      </div>
    </div>
  )

  // Render inventory
  const renderInventory = () => {
    const items = SHOP_ITEMS.filter(item => (inventory[item.id] || 0) > 0)
    if (items.length === 0) {
      return <div className="empty-state">INVENTORY EMPTY</div>
    }
    return (
      <div className="list-view">
        {items.map((item, idx) => (
          <div key={item.id} className={`list-item ${idx === selectedIndex ? 'selected' : ''}`}>
            <span>{item.name}</span>
            <span>x{inventory[item.id]}</span>
          </div>
        ))}
      </div>
    )
  }

  // Render shop
  const renderShop = () => (
    <div className="list-view">
      {SHOP_ITEMS.map((item, idx) => (
        <div
          key={item.id}
          className={`list-item ${idx === selectedIndex ? 'selected' : ''} ${coins < item.price ? 'disabled' : ''}`}
        >
          <span>{item.name}</span>
          <span>${item.price}</span>
        </div>
      ))}
    </div>
  )

  // Render work
  const renderWork = () => {
    if (isWorking && activeJob) {
      const progressBar = '[' + '='.repeat(Math.floor(workProgress / 10)) +
                          '-'.repeat(10 - Math.floor(workProgress / 10)) + ']'
      return (
        <div className="work-progress">
          <div className="work-title">{activeJob.name}</div>
          <div className="progress-bar">{progressBar}</div>
          <div className="progress-percent">{Math.floor(workProgress)}%</div>
        </div>
      )
    }
    return (
      <div className="list-view">
        {JOBS.map((job, idx) => (
          <div
            key={job.id}
            className={`list-item ${idx === selectedIndex ? 'selected' : ''} ${petState.energy < job.energyCost ? 'disabled' : ''}`}
          >
            <span>{job.name}</span>
            <span>+${job.reward}</span>
          </div>
        ))}
      </div>
    )
  }

  // Render sleep confirmation
  const renderSleep = () => {
    const daysUntilRent = nextRentDay - day
    return (
      <div className="sleep-screen">
        <div className="sleep-title">END DAY {day}?</div>
        <div className="sleep-info">
          <div>Energy will restore</div>
          <div>Stats will decay</div>
          {daysUntilRent <= 2 && (
            <div className="rent-warning">RENT DUE IN {daysUntilRent} DAYS!</div>
          )}
        </div>
        <div className="sleep-hint">Press A to sleep</div>
      </div>
    )
  }

  // Render content based on mode
  const renderContent = () => {
    switch (mode) {
      case 'status': return renderStatus()
      case 'inventory': return renderInventory()
      case 'shop': return renderShop()
      case 'work': return renderWork()
      case 'sleep': return renderSleep()
    }
  }

  // Render game over
  if (isGameOver) {
    return (
      <div className="game-fullscreen">
        <div className="lcd-screen">
          <div className="game-over">
            <div className="game-over-title">GAME OVER</div>
            <div className="game-over-reason">{gameOverReason}</div>
            <div className="game-over-stats">
              <div>Survived {day} days</div>
            </div>
            <button className="restart-btn" onClick={onRestart}>
              TRY AGAIN
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render event popup
  if (currentEvent) {
    return (
      <div className="game-fullscreen">
        <div className="lcd-screen">
          <div className="event-popup">
            <div className="event-title">{currentEvent.title}</div>
            <div className="event-desc">{currentEvent.description}</div>
            <div className="event-effects">
              {currentEvent.effects.coins && (
                <div className={currentEvent.effects.coins > 0 ? 'positive' : 'negative'}>
                  {currentEvent.effects.coins > 0 ? '+' : ''}{currentEvent.effects.coins} coins
                </div>
              )}
              {currentEvent.effects.health && (
                <div className={currentEvent.effects.health > 0 ? 'positive' : 'negative'}>
                  {currentEvent.effects.health > 0 ? '+' : ''}{currentEvent.effects.health} health
                </div>
              )}
              {currentEvent.effects.energy && (
                <div className={currentEvent.effects.energy > 0 ? 'positive' : 'negative'}>
                  {currentEvent.effects.energy > 0 ? '+' : ''}{currentEvent.effects.energy} energy
                </div>
              )}
            </div>
            <button className="event-btn" onClick={onDismissEvent}>OK</button>
          </div>
        </div>
      </div>
    )
  }

  const daysUntilRent = nextRentDay - day

  // Get mood based on stats
  const getMood = () => {
    const avg = (petState.hunger + petState.happiness + petState.health) / 3
    if (avg < 30) return 'bad'
    if (avg < 60) return 'ok'
    return 'good'
  }

  return (
    <div className="game-fullscreen">
      {/* Top screen - Pet display */}
      <div className="pet-screen">
        <div className="pet-header">
          <span>DAY {day}</span>
          <span>${coins}</span>
        </div>
        <div className="pet-display">
          <pre className={`pet-ascii ${animation || ''} mood-${getMood()}`}>
            {PET_FRAMES[frame].join('\n')}
          </pre>
        </div>
        <div className="pet-status-bar">
          <div className="mini-stat">
            <span>HNG</span>
            <div className="mini-bar">
              <div className="mini-fill" style={{width: `${petState.hunger}%`}}></div>
            </div>
          </div>
          <div className="mini-stat">
            <span>HPY</span>
            <div className="mini-bar">
              <div className="mini-fill" style={{width: `${petState.happiness}%`}}></div>
            </div>
          </div>
          <div className="mini-stat">
            <span>NRG</span>
            <div className="mini-bar">
              <div className="mini-fill" style={{width: `${petState.energy}%`}}></div>
            </div>
          </div>
          <div className="mini-stat">
            <span>HP</span>
            <div className="mini-bar">
              <div className="mini-fill" style={{width: `${petState.health}%`}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom screen - Menu/Actions */}
      <div className="menu-screen">
        {/* Rent warning */}
        {daysUntilRent <= 3 && (
          <div className="rent-bar">
            RENT ${GAME_CONFIG.RENT_AMOUNT} in {daysUntilRent}d
          </div>
        )}

        {/* Mode tabs */}
        <div className="mode-tabs">
          <button
            className={`tab ${mode === 'status' ? 'active' : ''}`}
            onClick={() => setModeIfAllowed('status')}
          >
            STATS
          </button>
          <button
            className={`tab ${mode === 'inventory' ? 'active' : ''}`}
            onClick={() => setModeIfAllowed('inventory')}
          >
            USE
          </button>
          <button
            className={`tab ${mode === 'shop' ? 'active' : ''}`}
            onClick={() => setModeIfAllowed('shop')}
          >
            BUY
          </button>
          <button
            className={`tab ${mode === 'work' ? 'active' : ''}`}
            onClick={() => setModeIfAllowed('work')}
          >
            WORK
          </button>
          <button
            className={`tab ${mode === 'sleep' ? 'active' : ''}`}
            onClick={() => setModeIfAllowed('sleep')}
          >
            SLEEP
          </button>
        </div>

        {/* Menu content */}
        <div className="menu-content">
          {renderContent()}
        </div>

        {/* Actions left indicator */}
        <div className="actions-bar">
          <span>ACTIONS: {actionsLeft}/{GAME_CONFIG.ACTIONS_PER_DAY}</span>
        </div>

        {/* Message */}
        {message && <div className="lcd-message">{message}</div>}
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="gamepad">
          <div className="dpad">
            <button className="dpad-btn dpad-up" onClick={handleUp}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h16z"/></svg>
            </button>
            <button className="dpad-btn dpad-left" onClick={handleUp}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 12l8-8v16z"/></svg>
            </button>
            <div className="dpad-center"></div>
            <button className="dpad-btn dpad-right" onClick={handleDown}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 12l-8 8V4z"/></svg>
            </button>
            <button className="dpad-btn dpad-down" onClick={handleDown}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8H4z"/></svg>
            </button>
          </div>

          <div className="action-btns">
            <button className="action-btn btn-b" onClick={handleBack}>B</button>
            <button className="action-btn btn-a" onClick={handleSelect}>A</button>
          </div>
        </div>
      </div>
    </div>
  )
}
