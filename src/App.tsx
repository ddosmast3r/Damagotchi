import { useState, useEffect } from 'react'
import { Logo } from './components/Logo'
import { EggHatch } from './components/EggHatch'
import { GameScreen } from './components/GameScreen'
import { ShopItem, INITIAL_GAME_STATE } from './gameData'

export interface PetState {
  hunger: number
  happiness: number
  energy: number
  health: number
}

type GamePhase = 'egg' | 'newborn' | 'gameplay'

function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('egg')
  const [coins, setCoins] = useState(INITIAL_GAME_STATE.coins)
  const [inventory, setInventory] = useState<{ [itemId: string]: number }>(INITIAL_GAME_STATE.inventory)
  const [pet, setPet] = useState<PetState>(INITIAL_GAME_STATE.petState)
  const [animation, setAnimation] = useState<string | null>(null)

  // Degradation over time
  useEffect(() => {
    if (gamePhase !== 'gameplay') return

    const interval = setInterval(() => {
      setPet(prev => ({
        hunger: Math.max(0, prev.hunger - 1),
        happiness: Math.max(0, prev.happiness - 0.5),
        energy: Math.min(100, prev.energy + 0.3), // Energy slowly recovers
        health: prev.hunger < 20 || prev.happiness < 20
          ? Math.max(0, prev.health - 1)
          : Math.min(100, prev.health + 0.1),
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [gamePhase])

  const triggerAnimation = (type: string) => {
    setAnimation(type)
    setTimeout(() => setAnimation(null), 500)
  }

  // Buy item from shop
  const handleBuy = (item: ShopItem) => {
    if (coins < item.price) return

    setCoins(prev => prev - item.price)
    setInventory(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }))
  }

  // Use item from inventory
  const handleUseItem = (item: ShopItem) => {
    const count = inventory[item.id] || 0
    if (count <= 0) return

    // Remove from inventory
    setInventory(prev => ({
      ...prev,
      [item.id]: prev[item.id] - 1
    }))

    // Apply effects
    setPet(prev => ({
      hunger: Math.min(100, Math.max(0, prev.hunger + (item.effects.hunger || 0))),
      happiness: Math.min(100, Math.max(0, prev.happiness + (item.effects.happiness || 0))),
      energy: Math.min(100, Math.max(0, prev.energy + (item.effects.energy || 0))),
      health: Math.min(100, Math.max(0, prev.health + (item.effects.health || 0))),
    }))

    // Trigger animation based on item type
    if (item.type === 'food') triggerAnimation('eat')
    else if (item.type === 'toy') triggerAnimation('play')
    else if (item.type === 'medicine') triggerAnimation('heal')
  }

  // Work complete
  const handleWorkComplete = (reward: number, energyCost: number) => {
    setCoins(prev => prev + reward)
    setPet(prev => ({
      ...prev,
      energy: Math.max(0, prev.energy - energyCost)
    }))
  }

  // Game reward
  const handleGameReward = (reward: number) => {
    setCoins(prev => prev + reward)
    // Playing games makes pet happier!
    setPet(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 5)
    }))
  }

  // Egg hatched
  const handleHatch = () => {
    setGamePhase('newborn')
    setTimeout(() => {
      setGamePhase('gameplay')
    }, 2000)
  }

  // Egg phase
  if (gamePhase === 'egg') {
    return (
      <div className="app">
        <Logo />
        <EggHatch onHatch={handleHatch} />
      </div>
    )
  }

  // Newborn phase
  if (gamePhase === 'newborn') {
    return (
      <div className="app">
        <Logo />
        <div className="newborn-celebration">
          <div className="device-body">
            <div className="device-screen gameboy-screen">
              <div className="newborn-message">
                <div className="congrats-text">CONGRATULATIONS!</div>
                <div className="pet-born-text">your pet was born!</div>
                <div className="stars-decoration">* * *</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main gameplay - single unified screen
  return (
    <div className="app">
      <Logo />
      <GameScreen
        petState={pet}
        coins={coins}
        inventory={inventory}
        onBuyItem={handleBuy}
        onUseItem={handleUseItem}
        onWorkComplete={handleWorkComplete}
        onGameReward={handleGameReward}
        animation={animation}
      />
    </div>
  )
}

export default App
