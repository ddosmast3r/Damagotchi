import { useState, useEffect } from 'react'
import { CRTEffect } from './components/CRTEffect'
import { StartScreen } from './components/StartScreen'
import { BootScreen } from './components/BootScreen'
import { LogoScreen } from './components/LogoScreen'
import { GameScreen } from './components/GameScreen'
import { ShopItem, INITIAL_GAME_STATE } from './gameData'

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
        energy: Math.min(100, prev.energy + 0.3),
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

  // Use item from inventory
  const handleUseItem = (item: ShopItem) => {
    const count = inventory[item.id] || 0
    if (count <= 0) return

    setInventory(prev => ({
      ...prev,
      [item.id]: prev[item.id] - 1
    }))

    setPet(prev => ({
      hunger: Math.min(100, Math.max(0, prev.hunger + (item.effects.hunger || 0))),
      happiness: Math.min(100, Math.max(0, prev.happiness + (item.effects.happiness || 0))),
      energy: Math.min(100, Math.max(0, prev.energy + (item.effects.energy || 0))),
      health: Math.min(100, Math.max(0, prev.health + (item.effects.health || 0))),
    }))

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
        inventory={inventory}
        onUseItem={handleUseItem}
        onWorkComplete={handleWorkComplete}
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
