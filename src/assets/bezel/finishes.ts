import type { BezelFinish } from '../../model/types'

export type FinishColors = { body: string; edge: string; highlight: string; label: string }

export const FINISHES: Record<BezelFinish, FinishColors> = {
  black: { body: '#1f1f22', edge: '#0a0a0c', highlight: '#5a5a60', label: 'Black Titanium' },
  white: { body: '#e9e7e2', edge: '#b9b6ae', highlight: '#ffffff', label: 'White Titanium' },
  blue: { body: '#2f4a6d', edge: '#1a2b42', highlight: '#7e9bc2', label: 'Deep Blue' },
  orange: { body: '#d9682a', edge: '#8f3f12', highlight: '#f5a86e', label: 'Cosmic Orange' },
}

export const FINISH_IDS: BezelFinish[] = ['black', 'white', 'blue', 'orange']
