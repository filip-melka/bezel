import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'

export const MIN_WIDTH = 1024

const query = () => (typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${MIN_WIDTH - 1}px)`) : null)

function subscribe(cb: () => void): () => void {
  const mq = query()
  if (!mq) return () => {}
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

// True when the window is narrower than the supported minimum (SPEC §2).
export function useTooNarrow(): boolean {
  return useSyncExternalStore(subscribe, () => query()?.matches ?? false, () => false)
}

export type Size = { w: number; h: number }

export function useElementSize<T extends HTMLElement>(ref: RefObject<T | null>): Size {
  const [size, setSize] = useState<Size>({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (r) setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    })
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [ref])
  return size
}
