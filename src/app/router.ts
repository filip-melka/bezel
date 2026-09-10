import { useSyncExternalStore } from 'react'

export type Route = { name: 'projects' } | { name: 'editor'; id: string }

function parse(hash: string): Route {
  const m = /^#\/p\/([^/]+)$/.exec(hash)
  if (m && m[1]) return { name: 'editor', id: decodeURIComponent(m[1]) }
  return { name: 'projects' }
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

function snapshot(): string {
  return window.location.hash
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, snapshot, () => '')
  return parse(hash)
}

export function navigateToProjects(): void {
  window.location.hash = '#/'
}

export function navigateToEditor(id: string): void {
  window.location.hash = `#/p/${encodeURIComponent(id)}`
}
