// ===== GAME DATA & TYPES =====

// Item types
type ItemType = 'food' | 'toy' | 'medicine' | 'accessory'

export interface ShopItem {
  id: string
  name: string
  type: ItemType
  price: number
  icon: string
  description: string
  // Effects when used
  effects: {
    hunger?: number
    happiness?: number
    energy?: number
    health?: number
  }
}

// Shop items catalog
export const SHOP_ITEMS: ShopItem[] = [
  // Food
  {
    id: 'bread',
    name: 'Bread',
    type: 'food',
    price: 5,
    icon: '🍞',
    description: 'Simple bread. +10 hunger',
    effects: { hunger: 10 }
  },
  {
    id: 'apple',
    name: 'Apple',
    type: 'food',
    price: 8,
    icon: '🍎',
    description: 'Fresh apple. +15 hunger, +5 health',
    effects: { hunger: 15, health: 5 }
  },
  {
    id: 'pizza',
    name: 'Pizza',
    type: 'food',
    price: 15,
    icon: '🍕',
    description: 'Tasty pizza! +25 hunger, +10 happiness',
    effects: { hunger: 25, happiness: 10 }
  },
  {
    id: 'cake',
    name: 'Cake',
    type: 'food',
    price: 25,
    icon: '🍰',
    description: 'Birthday cake! +20 hunger, +20 happiness',
    effects: { hunger: 20, happiness: 20 }
  },
  {
    id: 'energy_drink',
    name: 'Energy Drink',
    type: 'food',
    price: 20,
    icon: '🥤',
    description: 'BOOST! +30 energy, -5 health',
    effects: { energy: 30, health: -5 }
  },

  // Toys
  {
    id: 'ball',
    name: 'Ball',
    type: 'toy',
    price: 30,
    icon: '⚽',
    description: 'Play ball! +20 happiness, -10 energy',
    effects: { happiness: 20, energy: -10 }
  },
  {
    id: 'gameboy',
    name: 'Game Boy',
    type: 'toy',
    price: 50,
    icon: '🎮',
    description: 'Gaming time! +30 happiness, -15 energy',
    effects: { happiness: 30, energy: -15 }
  },
  {
    id: 'book',
    name: 'Book',
    type: 'toy',
    price: 20,
    icon: '📚',
    description: 'Reading is fun! +15 happiness, -5 energy',
    effects: { happiness: 15, energy: -5 }
  },

  // Medicine
  {
    id: 'bandage',
    name: 'Bandage',
    type: 'medicine',
    price: 10,
    icon: '🩹',
    description: 'First aid. +15 health',
    effects: { health: 15 }
  },
  {
    id: 'medicine',
    name: 'Medicine',
    type: 'medicine',
    price: 30,
    icon: '💊',
    description: 'Strong medicine. +30 health',
    effects: { health: 30 }
  },
  {
    id: 'vitamin',
    name: 'Vitamins',
    type: 'medicine',
    price: 40,
    icon: '💉',
    description: 'Full recovery! +50 health',
    effects: { health: 50 }
  },
]

// Work/Jobs for earning coins
export interface Job {
  id: string
  name: string
  icon: string
  description: string
  duration: number // seconds
  reward: number // coins
  energyCost: number
}

export const JOBS: Job[] = [
  {
    id: 'sweep',
    name: 'Sweep Floor',
    icon: '🧹',
    description: 'Easy work, small pay',
    duration: 5,
    reward: 10,
    energyCost: 5
  },
  {
    id: 'dishes',
    name: 'Wash Dishes',
    icon: '🍽️',
    description: 'Medium work',
    duration: 8,
    reward: 20,
    energyCost: 10
  },
  {
    id: 'garden',
    name: 'Garden Work',
    icon: '🌱',
    description: 'Hard but rewarding',
    duration: 12,
    reward: 35,
    energyCost: 20
  },
  {
    id: 'code',
    name: 'Write Code',
    icon: '💻',
    description: 'Brain power!',
    duration: 15,
    reward: 50,
    energyCost: 25
  },
]

// Game state
interface GameState {
  coins: number
  inventory: { [itemId: string]: number }
  petState: {
    hunger: number
    happiness: number
    energy: number
    health: number
  }
}

// Initial game state
export const INITIAL_GAME_STATE: GameState = {
  coins: 50,
  inventory: {},
  petState: {
    hunger: 80,
    happiness: 70,
    energy: 90,
    health: 100,
  },
}
