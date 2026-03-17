import { useState, useEffect, useCallback } from 'react'
import { PetState } from '../App'
import { SHOP_ITEMS, JOBS, ShopItem, Job } from '../gameData'
import './GameScreen.css'

type ScreenMode = 'pet' | 'shop' | 'bag' | 'work' | 'game'
type MiniGame = 'select' | 'reaction' | 'leftright' | 'simon'
type GamePhase = 'ready' | 'playing' | 'result'

interface GameScreenProps {
  petState: PetState
  coins: number
  inventory: { [itemId: string]: number }
  onBuyItem: (item: ShopItem) => void
  onUseItem: (item: ShopItem) => void
  onWorkComplete: (reward: number, energyCost: number) => void
  onGameReward: (reward: number) => void
  animation: string | null
}

// Simple pet sprites
const SPRITES = {
  idle1: [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,0,1,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,1,1,1,1,0,1,0],
    [0,0,1,1,0,0,1,1,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,0,0,0,0,1,1,0],
    [0,1,0,0,0,0,0,0,1,0],
  ],
  idle2: [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,0,1,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,1,1,1,1,0,1,0],
    [0,0,1,1,0,0,1,1,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,1,0,0,0,0,1,0,0],
    [0,0,0,0,0,0,0,0,0,0],
  ],
}

const MINI_GAMES = [
  { id: 'reaction', name: 'Reaction', icon: '⚡', desc: 'Test reflexes!' },
  { id: 'leftright', name: 'Guess', icon: '🎯', desc: 'Left or right?' },
  { id: 'simon', name: 'Simon', icon: '🧠', desc: 'Remember!' },
]

// ASCII Animations
const SPINNER_FRAMES = ['|', '/', '-', '\\']
const DOTS_FRAMES = ['.  ', '.. ', '...', '   ']
const WAVE_FRAMES = ['~', '≈', '~', '≋']
const ZZZ_FRAMES = ['z', 'zZ', 'zZz', 'zZzZ']
const HEART_FRAMES = ['♡', '♥', '♡', '♥']

export function GameScreen({
  petState,
  coins,
  inventory,
  onBuyItem,
  onUseItem,
  onWorkComplete,
  onGameReward,
  animation
}: GameScreenProps) {
  const [mode, setMode] = useState<ScreenMode>('pet')
  const [frame, setFrame] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isWorking, setIsWorking] = useState(false)
  const [workProgress, setWorkProgress] = useState(0)
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Mini-game state
  const [currentGame, setCurrentGame] = useState<MiniGame>('select')
  const [gamePhase, setGamePhase] = useState<GamePhase>('ready')
  const [gameScore, setGameScore] = useState(0)
  const [gameRound, setGameRound] = useState(0)

  // Reaction game
  const [reactionStart, setReactionStart] = useState(0)
  const [reactionShow, setReactionShow] = useState(false)
  const [reactionTimes, setReactionTimes] = useState<number[]>([])

  // Left/Right game
  const [hiddenSide, setHiddenSide] = useState<'left' | 'right'>('left')
  const [playerGuess, setPlayerGuess] = useState<'left' | 'right' | null>(null)
  const [guessResult, setGuessResult] = useState<boolean | null>(null)

  // Simon game
  const [simonSequence, setSimonSequence] = useState<number[]>([])
  const [simonInput, setSimonInput] = useState<number[]>([])
  const [simonShowIndex, setSimonShowIndex] = useState(-1)
  const [simonHighlight, setSimonHighlight] = useState<number | null>(null)

  // ASCII animation frame
  const [asciiFrame, setAsciiFrame] = useState(0)

  // Animation frames (pet + ASCII)
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 2)
      setAsciiFrame(f => (f + 1) % 4)
    }, 150)
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
          showMessage(`+$${activeJob.reward}!`)
          setActiveJob(null)
          return 0
        }
        return newProgress
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isWorking, activeJob, onWorkComplete])

  // Message timeout
  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 1500)
  }

  // Reset game state
  const resetGame = () => {
    setGamePhase('ready')
    setGameScore(0)
    setGameRound(0)
    setReactionTimes([])
    setSimonSequence([])
    setSimonInput([])
    setPlayerGuess(null)
    setGuessResult(null)
  }

  // ============ REACTION GAME ============
  const startReactionRound = useCallback(() => {
    setReactionShow(false)
    setGamePhase('playing')

    // Random delay 1-3 seconds
    const delay = 1000 + Math.random() * 2000
    setTimeout(() => {
      setReactionStart(Date.now())
      setReactionShow(true)
    }, delay)
  }, [])

  const handleReactionTap = () => {
    if (!reactionShow) {
      // Too early!
      showMessage('Too early!')
      return
    }

    const reactionTime = Date.now() - reactionStart
    const newTimes = [...reactionTimes, reactionTime]
    setReactionTimes(newTimes)
    setReactionShow(false)

    if (newTimes.length >= 5) {
      // Game over - calculate score
      const avgTime = newTimes.reduce((a, b) => a + b, 0) / newTimes.length
      let reward = 0
      if (avgTime < 300) reward = 30
      else if (avgTime < 400) reward = 20
      else if (avgTime < 500) reward = 15
      else reward = 10

      setGameScore(reward)
      setGamePhase('result')
      onGameReward(reward)
    } else {
      setGameRound(newTimes.length)
      setTimeout(startReactionRound, 500)
    }
  }

  // ============ LEFT/RIGHT GAME ============
  const startLeftRightRound = useCallback(() => {
    setHiddenSide(Math.random() > 0.5 ? 'left' : 'right')
    setPlayerGuess(null)
    setGuessResult(null)
    setGamePhase('playing')
  }, [])

  const handleGuess = (guess: 'left' | 'right') => {
    if (playerGuess !== null) return

    setPlayerGuess(guess)
    const correct = guess === hiddenSide
    setGuessResult(correct)

    const newScore = correct ? gameScore + 1 : gameScore
    setGameScore(newScore)
    setGameRound(gameRound + 1)

    setTimeout(() => {
      if (gameRound + 1 >= 5) {
        // Game over
        const reward = newScore * 5
        setGameScore(reward)
        setGamePhase('result')
        onGameReward(reward)
      } else {
        startLeftRightRound()
      }
    }, 1000)
  }

  // ============ SIMON GAME ============
  const startSimonRound = useCallback(() => {
    const newSeq = [...simonSequence, Math.floor(Math.random() * 4)]
    setSimonSequence(newSeq)
    setSimonInput([])
    setGamePhase('playing')

    // Show sequence
    let i = 0
    setSimonShowIndex(0)
    const showInterval = setInterval(() => {
      if (i < newSeq.length) {
        setSimonHighlight(newSeq[i])
        setTimeout(() => setSimonHighlight(null), 300)
        i++
        setSimonShowIndex(i)
      } else {
        clearInterval(showInterval)
        setSimonShowIndex(-1)
      }
    }, 600)
  }, [simonSequence])

  const handleSimonInput = (btn: number) => {
    if (simonShowIndex !== -1) return // Still showing sequence

    const newInput = [...simonInput, btn]
    setSimonInput(newInput)
    setSimonHighlight(btn)
    setTimeout(() => setSimonHighlight(null), 150)

    // Check if correct so far
    const idx = newInput.length - 1
    if (newInput[idx] !== simonSequence[idx]) {
      // Wrong! Game over
      const reward = Math.max(0, (simonSequence.length - 1) * 8)
      setGameScore(reward)
      setGamePhase('result')
      if (reward > 0) onGameReward(reward)
      return
    }

    // Completed sequence?
    if (newInput.length === simonSequence.length) {
      setGameRound(simonSequence.length)
      setTimeout(() => startSimonRound(), 800)
    }
  }

  // Start mini-game
  const startMiniGame = (gameId: string) => {
    resetGame()
    setCurrentGame(gameId as MiniGame)

    if (gameId === 'reaction') {
      setTimeout(startReactionRound, 500)
    } else if (gameId === 'leftright') {
      setTimeout(startLeftRightRound, 500)
    } else if (gameId === 'simon') {
      setTimeout(startSimonRound, 500)
    }
  }

  // Get items for current mode
  const getItems = () => {
    if (mode === 'shop') return SHOP_ITEMS
    if (mode === 'bag') return SHOP_ITEMS.filter(item => (inventory[item.id] || 0) > 0)
    if (mode === 'work') return JOBS
    if (mode === 'game' && currentGame === 'select') return MINI_GAMES
    return []
  }

  const items = getItems()

  // Handle action button
  const handleAction = () => {
    if (mode === 'pet') return

    if (mode === 'game') {
      if (currentGame === 'select') {
        startMiniGame(MINI_GAMES[selectedIndex].id)
      } else if (currentGame === 'reaction' && reactionShow) {
        handleReactionTap()
      } else if (gamePhase === 'result') {
        setCurrentGame('select')
        resetGame()
      }
      return
    }

    if (mode === 'shop') {
      const item = SHOP_ITEMS[selectedIndex]
      if (item && coins >= item.price) {
        onBuyItem(item)
        showMessage(`Bought ${item.icon}!`)
      } else {
        showMessage('No money!')
      }
    }

    if (mode === 'bag') {
      const ownedItems = SHOP_ITEMS.filter(item => (inventory[item.id] || 0) > 0)
      const item = ownedItems[selectedIndex]
      if (item) {
        onUseItem(item)
        showMessage(`Used ${item.icon}!`)
      }
    }

    if (mode === 'work' && !isWorking) {
      const job = JOBS[selectedIndex]
      if (job && petState.energy >= job.energyCost) {
        setActiveJob(job)
        setWorkProgress(0)
        setIsWorking(true)
      } else {
        showMessage('Too tired!')
      }
    }
  }

  // Navigate items
  const handleUp = () => {
    if (mode === 'pet') return
    if (mode === 'game' && currentGame === 'leftright' && gamePhase === 'playing') {
      handleGuess('left')
      return
    }
    if (mode === 'game' && currentGame === 'simon' && simonShowIndex === -1) {
      handleSimonInput(0) // Up = 0
      return
    }
    setSelectedIndex(i => Math.max(0, i - 1))
  }

  const handleDown = () => {
    if (mode === 'pet') return
    if (mode === 'game' && currentGame === 'leftright' && gamePhase === 'playing') {
      handleGuess('right')
      return
    }
    if (mode === 'game' && currentGame === 'simon' && simonShowIndex === -1) {
      handleSimonInput(1) // Down = 1
      return
    }
    setSelectedIndex(i => Math.min(items.length - 1, i + 1))
  }

  // Cycle through modes
  const cycleMode = () => {
    if (isWorking) return
    if (mode === 'game' && currentGame !== 'select' && gamePhase !== 'result') {
      // Exit current game
      setCurrentGame('select')
      resetGame()
      return
    }
    const modes: ScreenMode[] = ['pet', 'bag', 'shop', 'work', 'game']
    const currentIndex = modes.indexOf(mode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setMode(nextMode)
    setSelectedIndex(0)
    if (nextMode === 'game') {
      setCurrentGame('select')
      resetGame()
    }
  }

  // Render pet view
  const renderPet = () => {
    const sprite = frame === 0 ? SPRITES.idle1 : SPRITES.idle2
    const pixelSize = 10

    // Choose ASCII decoration based on pet state
    const isHappy = petState.happiness > 70
    const isTired = petState.energy < 30
    const isHungry = petState.hunger < 30

    return (
      <div className="pet-view">
        {/* ASCII decorations */}
        <div className="ascii-decor">
          {isHappy && <span className="decor-left">{HEART_FRAMES[asciiFrame]}</span>}
          {isTired && <span className="decor-right">{ZZZ_FRAMES[asciiFrame]}</span>}
          {isHungry && <span className="decor-bottom">hungry{DOTS_FRAMES[asciiFrame]}</span>}
        </div>

        <div
          className={`sprite ${animation || ''}`}
          style={{ width: sprite[0].length * pixelSize, height: sprite.length * pixelSize }}
        >
          {sprite.map((row, y) =>
            row.map((pixel, x) =>
              pixel ? (
                <div
                  key={`${x}-${y}`}
                  className="pixel"
                  style={{
                    left: x * pixelSize,
                    top: y * pixelSize,
                    width: pixelSize,
                    height: pixelSize,
                  }}
                />
              ) : null
            )
          )}
        </div>
        {animation === 'eat' && <div className="effect">nom!</div>}
        {animation === 'play' && <div className="effect">yay!</div>}
        {animation === 'heal' && <div className="effect">+hp</div>}
      </div>
    )
  }

  // Render mini-game
  const renderMiniGame = () => {
    // Game selection
    if (currentGame === 'select') {
      return (
        <div className="item-list">
          {MINI_GAMES.map((game, idx) => (
            <div
              key={game.id}
              className={`list-item ${idx === selectedIndex ? 'selected' : ''}`}
            >
              <span className="item-icon">{game.icon}</span>
              <span className="item-name">{game.name}</span>
              <span className="item-desc-small">{game.desc}</span>
            </div>
          ))}
        </div>
      )
    }

    // Result screen
    if (gamePhase === 'result') {
      return (
        <div className="game-result">
          <div className="result-title">DONE!</div>
          <div className="result-score">+${gameScore}</div>
          <div className="result-hint">Press OK</div>
        </div>
      )
    }

    // REACTION GAME
    if (currentGame === 'reaction') {
      return (
        <div className="minigame-area">
          <div className="game-info">Round {reactionTimes.length + 1}/5</div>
          <div className={`reaction-circle ${reactionShow ? 'show' : ''}`}>
            {reactionShow ? '!' : SPINNER_FRAMES[asciiFrame]}
          </div>
          <div className="game-hint">
            {reactionShow ? '>>> TAP OK! <<<' : `Wait${DOTS_FRAMES[asciiFrame]}`}
          </div>
        </div>
      )
    }

    // LEFT/RIGHT GAME
    if (currentGame === 'leftright') {
      return (
        <div className="minigame-area">
          <div className="game-info">Round {gameRound + 1}/5 | Score: {gameScore}</div>
          <div className="hands-container">
            <div className={`hand left ${playerGuess === 'left' ? (guessResult ? 'correct' : 'wrong') : ''}`}>
              {playerGuess !== null && hiddenSide === 'left' ? '🪙' : '✊'}
            </div>
            <div className={`hand right ${playerGuess === 'right' ? (guessResult ? 'correct' : 'wrong') : ''}`}>
              {playerGuess !== null && hiddenSide === 'right' ? '🪙' : '✊'}
            </div>
          </div>
          <div className="game-hint">
            {playerGuess === null ? '▲ Left  |  ▼ Right' : (guessResult ? 'Correct!' : 'Wrong!')}
          </div>
        </div>
      )
    }

    // SIMON GAME
    if (currentGame === 'simon') {
      const buttons = ['▲', '▼', '◀', '▶']
      return (
        <div className="minigame-area">
          <div className="game-info">Length: {simonSequence.length}</div>
          <div className="simon-grid">
            {buttons.map((btn, idx) => (
              <div
                key={idx}
                className={`simon-btn ${simonHighlight === idx ? 'highlight' : ''}`}
              >
                {btn}
              </div>
            ))}
          </div>
          <div className="game-hint">
            {simonShowIndex !== -1
              ? `${WAVE_FRAMES[asciiFrame]} Watch ${WAVE_FRAMES[asciiFrame]}`
              : 'Repeat! ▲▼ then OK'}
          </div>
        </div>
      )
    }

    return null
  }

  // Render list view (shop/bag/work)
  const renderList = () => {
    if (mode === 'game') {
      return renderMiniGame()
    }

    if (isWorking && activeJob) {
      return (
        <div className="work-progress">
          <div className="work-spinner">{SPINNER_FRAMES[asciiFrame]}</div>
          <div className="work-icon">{activeJob.icon}</div>
          <div className="work-bar">
            <div className="work-fill" style={{ width: `${workProgress}%` }} />
          </div>
          <div className="work-status">
            <span className="work-percent">{Math.floor(workProgress)}%</span>
            <span className="work-dots">{DOTS_FRAMES[asciiFrame]}</span>
          </div>
        </div>
      )
    }

    const displayItems = mode === 'bag'
      ? SHOP_ITEMS.filter(item => (inventory[item.id] || 0) > 0)
      : mode === 'work'
        ? JOBS
        : SHOP_ITEMS

    if (displayItems.length === 0) {
      return <div className="empty-list">Empty!</div>
    }

    // Show 4 items at a time with scroll
    const startIndex = Math.max(0, Math.min(selectedIndex - 1, displayItems.length - 4))
    const visibleItems = displayItems.slice(startIndex, startIndex + 4)

    return (
      <div className="item-list">
        {visibleItems.map((item, idx) => {
          const actualIndex = startIndex + idx
          const isSelected = actualIndex === selectedIndex

          if (mode === 'work') {
            const job = item as Job
            const canWork = petState.energy >= job.energyCost
            return (
              <div key={job.id} className={`list-item ${isSelected ? 'selected' : ''} ${!canWork ? 'disabled' : ''}`}>
                <span className="item-icon">{job.icon}</span>
                <span className="item-name">{job.name}</span>
                <span className="item-price">+${job.reward}</span>
              </div>
            )
          }

          const shopItem = item as ShopItem
          const count = inventory[shopItem.id] || 0
          const canAfford = mode === 'shop' ? coins >= shopItem.price : count > 0

          return (
            <div key={shopItem.id} className={`list-item ${isSelected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`}>
              <span className="item-icon">{shopItem.icon}</span>
              <span className="item-name">{shopItem.name}</span>
              {mode === 'shop' && <span className="item-price">${shopItem.price}</span>}
              {mode === 'bag' && <span className="item-count">x{count}</span>}
            </div>
          )
        })}
      </div>
    )
  }

  // Handle Simon extra buttons via OK
  const handleOkForSimon = () => {
    if (currentGame === 'simon' && simonShowIndex === -1 && gamePhase === 'playing') {
      // Use OK as additional input (alternates between 2 and 3)
      handleSimonInput(simonInput.length % 2 === 0 ? 2 : 3)
      return true
    }
    return false
  }

  const wrappedHandleAction = () => {
    if (handleOkForSimon()) return
    handleAction()
  }

  return (
    <div className="game-screen-container">
      <div className="game-device">
        {/* Screen */}
        <div className="game-display">
          {/* Header */}
          <div className="screen-header">
            <span className="header-mode">
              {mode === 'game' && currentGame !== 'select'
                ? currentGame.toUpperCase()
                : mode.toUpperCase()}
            </span>
            <span className="header-coins">${coins}</span>
          </div>

          {/* Content */}
          <div className="screen-content">
            {mode === 'pet' ? renderPet() : renderList()}
          </div>

          {/* Message overlay */}
          {message && <div className="screen-message">{message}</div>}
        </div>

        {/* Controls */}
        <div className="game-controls">
          <button className="ctrl-btn" onClick={cycleMode} disabled={isWorking}>
            {mode === 'game' && currentGame !== 'select' ? 'BACK' : 'MODE'}
          </button>
          <div className="ctrl-arrows">
            <button className="ctrl-btn small" onClick={handleUp}>▲</button>
            <button className="ctrl-btn small" onClick={handleDown}>▼</button>
          </div>
          <button className="ctrl-btn" onClick={wrappedHandleAction} disabled={isWorking}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
