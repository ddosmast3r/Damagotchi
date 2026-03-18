// ===== GAME DATA & TYPES =====

// Item types
type ItemType = 'food' | 'drink' | 'entertainment' | 'medicine'

export interface ShopItem {
  id: string
  name: string
  type: ItemType
  price: number
  description: string
  effects: {
    hunger?: number
    happiness?: number
    energy?: number
    health?: number
  }
}

// Shop items - adult life themed
export const SHOP_ITEMS: ShopItem[] = [
  // Food
  {
    id: 'ramen',
    name: 'Instant Ramen',
    type: 'food',
    price: 5,
    description: 'Cheap and sad. +10 hunger',
    effects: { hunger: 10 }
  },
  {
    id: 'sandwich',
    name: 'Sandwich',
    type: 'food',
    price: 12,
    description: 'Quick lunch. +20 hunger',
    effects: { hunger: 20 }
  },
  {
    id: 'pizza',
    name: 'Pizza',
    type: 'food',
    price: 20,
    description: 'Comfort food. +25 hunger, +10 happiness',
    effects: { hunger: 25, happiness: 10 }
  },
  {
    id: 'steak',
    name: 'Steak Dinner',
    type: 'food',
    price: 50,
    description: 'Treat yourself. +40 hunger, +15 happiness',
    effects: { hunger: 40, happiness: 15 }
  },

  // Drinks
  {
    id: 'coffee',
    name: 'Coffee',
    type: 'drink',
    price: 8,
    description: 'Morning fuel. +20 energy, -5 health',
    effects: { energy: 20, health: -5 }
  },
  {
    id: 'energy_drink',
    name: 'Energy Drink',
    type: 'drink',
    price: 15,
    description: 'Heart attack in a can. +35 energy, -10 health',
    effects: { energy: 35, health: -10 }
  },
  {
    id: 'beer',
    name: 'Beer',
    type: 'drink',
    price: 10,
    description: 'Liquid therapy. +15 happiness, -10 energy',
    effects: { happiness: 15, energy: -10 }
  },

  // Entertainment
  {
    id: 'netflix',
    name: 'Netflix',
    type: 'entertainment',
    price: 15,
    description: 'Binge watching. +20 happiness, -10 energy',
    effects: { happiness: 20, energy: -10 }
  },
  {
    id: 'game',
    name: 'Video Game',
    type: 'entertainment',
    price: 25,
    description: 'Escape reality. +30 happiness, -15 energy',
    effects: { happiness: 30, energy: -15 }
  },
  {
    id: 'gym',
    name: 'Gym Session',
    type: 'entertainment',
    price: 20,
    description: 'Pain is gain. +10 happiness, +15 health, -20 energy',
    effects: { happiness: 10, health: 15, energy: -20 }
  },

  // Medicine
  {
    id: 'aspirin',
    name: 'Aspirin',
    type: 'medicine',
    price: 10,
    description: 'For the headache. +15 health',
    effects: { health: 15 }
  },
  {
    id: 'vitamins',
    name: 'Vitamins',
    type: 'medicine',
    price: 25,
    description: 'Daily health. +25 health',
    effects: { health: 25 }
  },
  {
    id: 'therapy',
    name: 'Therapy Session',
    type: 'medicine',
    price: 100,
    description: 'Mental health matters. +30 health, +20 happiness',
    effects: { health: 30, happiness: 20 }
  },
]

// Jobs
export interface Job {
  id: string
  name: string
  description: string
  duration: number // seconds to complete
  reward: number
  energyCost: number
  happinessCost: number
}

export const JOBS: Job[] = [
  {
    id: 'gig',
    name: 'Gig Work',
    description: 'Deliver food. Flexible but unstable.',
    duration: 3,
    reward: 15,
    energyCost: 10,
    happinessCost: 5
  },
  {
    id: 'freelance',
    name: 'Freelance',
    description: 'Work from home. Decent pay.',
    duration: 5,
    reward: 30,
    energyCost: 15,
    happinessCost: 10
  },
  {
    id: 'office',
    name: 'Office Job',
    description: 'Cubicle life. Stable income.',
    duration: 8,
    reward: 50,
    energyCost: 25,
    happinessCost: 15
  },
  {
    id: 'overtime',
    name: 'Overtime',
    description: 'Extra hours. Draining but pays well.',
    duration: 10,
    reward: 80,
    energyCost: 40,
    happinessCost: 25
  },
]

// Random events
export interface GameEvent {
  id: string
  title: string
  description: string
  effects: {
    coins?: number
    hunger?: number
    happiness?: number
    energy?: number
    health?: number
  }
  chance: number // 0-1 probability per day
}

export const RANDOM_EVENTS: GameEvent[] = [
  // Bad events
  {
    id: 'car_broke',
    title: 'Car Trouble',
    description: 'Your car broke down. Repair costs.',
    effects: { coins: -50 },
    chance: 0.1
  },
  {
    id: 'sick',
    title: 'Got Sick',
    description: 'Caught a cold. Feel terrible.',
    effects: { health: -20, energy: -15 },
    chance: 0.1
  },
  {
    id: 'tax',
    title: 'Surprise Tax',
    description: 'Tax season. Pay up.',
    effects: { coins: -30 },
    chance: 0.08
  },
  {
    id: 'insomnia',
    title: 'Insomnia',
    description: 'Could not sleep well.',
    effects: { energy: -20 },
    chance: 0.12
  },
  // Good events
  {
    id: 'bonus',
    title: 'Work Bonus',
    description: 'Got a small bonus at work!',
    effects: { coins: 40 },
    chance: 0.08
  },
  {
    id: 'found_money',
    title: 'Lucky Day',
    description: 'Found money on the street.',
    effects: { coins: 20, happiness: 10 },
    chance: 0.05
  },
  {
    id: 'good_sleep',
    title: 'Great Sleep',
    description: 'Slept like a baby.',
    effects: { energy: 20, health: 10 },
    chance: 0.1
  },
]

// Game constants
export const GAME_CONFIG = {
  RENT_AMOUNT: 100,
  RENT_INTERVAL_DAYS: 7,
  ACTIONS_PER_DAY: 5,
  SLEEP_ENERGY_RESTORE: 60,
  STAT_DECAY_PER_DAY: {
    hunger: 15,
    happiness: 10,
    energy: 0, // handled by sleep
    health: 0, // depends on other stats
  },
  CRITICAL_STAT_THRESHOLD: 20,
  HEALTH_DECAY_WHEN_CRITICAL: 10,
}

// Game state
export interface GameState {
  coins: number
  day: number
  actionsLeft: number
  inventory: { [itemId: string]: number }
  petState: {
    hunger: number
    happiness: number
    energy: number
    health: number
  }
  nextRentDay: number
  isGameOver: boolean
  gameOverReason: string | null
}

// Initial game state
export const INITIAL_GAME_STATE: GameState = {
  coins: 100,
  day: 1,
  actionsLeft: 5,
  inventory: {
    'ramen': 2,
    'coffee': 2,
  },
  petState: {
    hunger: 70,
    happiness: 60,
    energy: 80,
    health: 100,
  },
  nextRentDay: 7,
  isGameOver: false,
  gameOverReason: null,
}
