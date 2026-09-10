import { create } from 'zustand'
import type { RenderReport } from '../render/renderItem'

export type ToastAction = { label: string; onClick: () => void }
export type Toast = { id: number; message: string; action?: ToastAction }
export type SheetKind = 'add' | 'exportConfirm' | null
export type InspectorTab = 'slide' | 'theme'
export type ExportProgress = { done: number; total: number }

export type UiState = {
  selectedId: string | null
  inspectorTab: InspectorTab
  sheet: SheetKind
  toast: Toast | null
  memoryOnly: boolean
  saveFlashAt: number
  exportProgress: ExportProgress | null
  exportDoneAt: number
  dragging: boolean
  // Incremented whenever a screenshot or bezel image becomes available so
  // canvases re-render without the project itself changing.
  assetsVersion: number
  // Last full-res preview render report for the selected item.
  previewReport: RenderReport | null
  // Full-screen App Store preview mode.
  storePreview: boolean

  select: (id: string | null) => void
  setStorePreview: (v: boolean) => void
  bumpAssets: () => void
  setPreviewReport: (r: RenderReport | null) => void
  setTab: (tab: InspectorTab) => void
  openSheet: (sheet: Exclude<SheetKind, null>) => void
  closeSheet: () => void
  showToast: (message: string, action?: ToastAction) => void
  dismissToast: () => void
  setMemoryOnly: (v: boolean) => void
  flashSave: () => void
  setExportProgress: (p: ExportProgress | null) => void
  markExportDone: () => void
  setDragging: (v: boolean) => void
}

let toastSeq = 0
let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useUiStore = create<UiState>()((set) => ({
  selectedId: null,
  inspectorTab: 'slide',
  sheet: null,
  toast: null,
  memoryOnly: false,
  saveFlashAt: 0,
  exportProgress: null,
  exportDoneAt: 0,
  dragging: false,
  assetsVersion: 0,
  previewReport: null,
  storePreview: false,

  select: (id) => set({ selectedId: id }),
  setStorePreview: (v) => set({ storePreview: v }),
  bumpAssets: () => set((s) => ({ assetsVersion: s.assetsVersion + 1 })),
  setPreviewReport: (r) => set({ previewReport: r }),
  setTab: (tab) => set({ inspectorTab: tab }),
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),
  showToast: (message, action) => {
    const id = ++toastSeq
    set({ toast: { id, message, action } })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      set((s) => (s.toast?.id === id ? { toast: null } : {}))
    }, 5000)
  },
  dismissToast: () => set({ toast: null }),
  setMemoryOnly: (v) => set({ memoryOnly: v }),
  flashSave: () => set({ saveFlashAt: Date.now() }),
  setExportProgress: (p) => set({ exportProgress: p }),
  markExportDone: () => set({ exportDoneAt: Date.now(), exportProgress: null }),
  setDragging: (v) => set({ dragging: v }),
}))

export function toast(message: string, action?: ToastAction): void {
  useUiStore.getState().showToast(message, action)
}
