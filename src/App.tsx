import { useState, useCallback } from 'react'
import { CRTEffect } from './components/CRTEffect'
import { StartScreen } from './components/StartScreen'
import { BootScreen } from './components/BootScreen'
import { LogoScreen } from './components/LogoScreen'
import { GameScreen } from './components/GameScreen'
import {
  ShopItem,
  Job,
  GameEvent,
  INITIAL_GAME_STATE,
  GAME_CONFIG,
  RANDOM_EVENTS
} from './gameData'

export interface PetState {
  hunger: number
  happiness: number
  energy: number
  health: number
}

type GamePhase = 'start' | 'boot' | 'logo' | 'gameplay'

function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('start')
  const [coins, setCoins] = useState(INITIAL_GAME_STATE.coins)
  const [day, setDay] = useState(INITIAL_GAME_STATE.day)
  const [actionsLeft, setActionsLeft] = useState(INITIAL_GAME_STATE.actionsLeft)
  const [inventory, setInventory] = useState<{ [itemId: string]: number }>(INITIAL_GAME_STATE.inventory)
  const [pet, setPet] = useState<PetState>(INITIAL_GAME_STATE.petState)
  const [nextRentDay, setNextRentDay] = useState(INITIAL_GAME_STATE.nextRentDay)
  const [isGameOver, setIsGameOver] = useState(false)
  const [gameOverReason, setGameOverReason] = useState<string | null>(null)
  const [animation, setAnimation] = useState<string | null>(null)
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null)

  const triggerAnimation = (type: string) => {
    setAnimation(type)
    setTimeout(() => setAnimation(null), 500)
  }

  // Check for game over conditions
  const checkGameOver = useCallback((newPet: PetState, _newCoins: number, reason?: string) => {
    if (newPet.health <= 0) {
      setIsGameOver(true)
      setGameOverReason('Health reached zero. You burned out.')
      return true
    }
    if (reason) {
      setIsGameOver(true)
      setGameOverReason(reason)
      return true
    }
    return false
  }, [])

  // Apply stat changes with bounds
  const applyStatChanges = useCallback((changes: Partial<PetState>): PetState => {
    return {
      hunger: Math.min(100, Math.max(0, pet.hunger + (changes.hunger || 0))),
      happiness: Math.min(100, Math.max(0, pet.happiness + (changes.happiness || 0))),
      energy: Math.min(100, Math.max(0, pet.energy + (changes.energy || 0))),
      health: Math.min(100, Math.max(0, pet.health + (changes.health || 0))),
    }
  }, [pet])

  // Use item from inventory
  const handleUseItem = (item: ShopItem) => {
    const count = inventory[item.id] || 0
    if (count <= 0) return
    if (actionsLeft <= 0) return

    setInventory(prev => ({
      ...prev,
      [item.id]: prev[item.id] - 1
    }))

    const newPet = applyStatChanges(item.effects)
    setPet(newPet)
    setActionsLeft(prev => prev - 1)

    if (item.type === 'food' || item.type === 'drink') triggerAnimation('eat')
    else if (item.type === 'entertainment') triggerAnimation('play')
    else if (item.type === 'medicine') triggerAnimation('heal')

    checkGameOver(newPet, coins)
  }

  // Buy item
  const handleBuyItem = (item: ShopItem) => {
    if (coins < item.price) return
    if (actionsLeft <= 0) return

    setCoins(prev => prev - item.price)
    setInventory(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }))
    setActionsLeft(prev => prev - 1)
  }

  // Work complete
  const handleWorkComplete = (job: Job) => {
    const newCoins = coins + job.reward
    setCoins(newCoins)

    const newPet = applyStatChanges({
      energy: -job.energyCost,
      happiness: -job.happinessCost
    })
    setPet(newPet)
    setActionsLeft(prev => prev - 1)

    checkGameOver(newPet, newCoins)
  }

  // Roll for random event
  const rollRandomEvent = (): GameEvent | null => {
    for (const event of RANDOM_EVENTS) {
      if (Math.random() < event.chance) {
        return event
      }
    }
    return null
  }

  // Sleep - end day
  const handleSleep = () => {
    // Apply stat decay
    let newPet: PetState = {
      hunger: Math.max(0, pet.hunger - GAME_CONFIG.STAT_DECAY_PER_DAY.hunger),
      happiness: Math.max(0, pet.happiness - GAME_CONFIG.STAT_DECAY_PER_DAY.happiness),
      energy: Math.min(100, pet.energy + GAME_CONFIG.SLEEP_ENERGY_RESTORE),
      health: pet.health,
    }

    // Health decay if stats are critical
    if (newPet.hunger < GAME_CONFIG.CRITICAL_STAT_THRESHOLD) {
      newPet.health = Math.max(0, newPet.health - GAME_CONFIG.HEALTH_DECAY_WHEN_CRITICAL)
    }
    if (newPet.happiness < GAME_CONFIG.CRITICAL_STAT_THRESHOLD) {
      newPet.health = Math.max(0, newPet.health - GAME_CONFIG.HEALTH_DECAY_WHEN_CRITICAL)
    }

    const newDay = day + 1
    let newCoins = coins

    // Check rent
    if (newDay >= nextRentDay) {
      if (coins >= GAME_CONFIG.RENT_AMOUNT) {
        newCoins = coins - GAME_CONFIG.RENT_AMOUNT
        setNextRentDay(nextRentDay + GAME_CONFIG.RENT_INTERVAL_DAYS)
      } else {
        setIsGameOver(true)
        setGameOverReason('Could not pay rent. Evicted.')
        return
      }
    }

    // Roll for random event
    const event = rollRandomEvent()
    if (event) {
      // Apply event effects
      if (event.effects.coins) {
        newCoins = Math.max(0, newCoins + event.effects.coins)
      }
      newPet = {
        hunger: Math.min(100, Math.max(0, newPet.hunger + (event.effects.hunger || 0))),
        happiness: Math.min(100, Math.max(0, newPet.happiness + (event.effects.happiness || 0))),
        energy: Math.min(100, Math.max(0, newPet.energy + (event.effects.energy || 0))),
        health: Math.min(100, Math.max(0, newPet.health + (event.effects.health || 0))),
      }
      setCurrentEvent(event)
    }

    setPet(newPet)
    setCoins(newCoins)
    setDay(newDay)
    setActionsLeft(GAME_CONFIG.ACTIONS_PER_DAY)

    checkGameOver(newPet, newCoins)
  }

  // Dismiss event
  const handleDismissEvent = () => {
    setCurrentEvent(null)
  }

  // Restart game
  const handleRestart = () => {
    setCoins(INITIAL_GAME_STATE.coins)
    setDay(INITIAL_GAME_STATE.day)
    setActionsLeft(INITIAL_GAME_STATE.actionsLeft)
    setInventory({ ...INITIAL_GAME_STATE.inventory })
    setPet({ ...INITIAL_GAME_STATE.petState })
    setNextRentDay(INITIAL_GAME_STATE.nextRentDay)
    setIsGameOver(false)
    setGameOverReason(null)
    setCurrentEvent(null)
  }

  // Render current screen
  const renderScreen = () => {
    if (gamePhase === 'start') {
      return <StartScreen onStart={() => setGamePhase('boot')} />
    }

    if (gamePhase === 'boot') {
      return <BootScreen onBootComplete={() => setGamePhase('logo')} />
    }

    if (gamePhase === 'logo') {
      return <LogoScreen onComplete={() => setGamePhase('gameplay')} />
    }

    return (
      <GameScreen
        petState={pet}
        coins={coins}
        day={day}
        actionsLeft={actionsLeft}
        nextRentDay={nextRentDay}
        inventory={inventory}
        isGameOver={isGameOver}
        gameOverReason={gameOverReason}
        currentEvent={currentEvent}
        onUseItem={handleUseItem}
        onBuyItem={handleBuyItem}
        onWorkComplete={handleWorkComplete}
        onSleep={handleSleep}
        onDismissEvent={handleDismissEvent}
        onRestart={handleRestart}
        animation={animation}
      />
    )
  }

  return (
    <CRTEffect>
      {renderScreen()}
    </CRTEffect>
  )
}

export default App
