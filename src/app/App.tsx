import { useEffect } from 'react'
import { getDb, isMemoryOnly } from '../persistence/db'
import { sweepOrphanAssets } from '../persistence/gc'
import { loadAllBezels } from '../render/bezel'
import { fontsReady } from '../assets/fonts/fonts'
import { useUiStore } from '../store/uiStore'
import { ToastHost } from '../ui/controls/Toast'
import { Editor } from '../ui/editor/Editor'
import { useTooNarrow } from '../ui/hooks/useViewportGuard'
import { ProjectsScreen } from '../ui/projects/ProjectsScreen'
import { useRoute } from './router'
import s from '../ui/editor/editor.module.css'

export function App() {
  const route = useRoute()
  const tooNarrow = useTooNarrow()

  useEffect(() => {
    void (async () => {
      await getDb()
      useUiStore.getState().setMemoryOnly(isMemoryOnly())
      await sweepOrphanAssets()
    })()
    void Promise.all([loadAllBezels(), fontsReady()]).then(() => useUiStore.getState().bumpAssets())
  }, [])

  // A face that arrives after fontsReady's 1 s race would otherwise leave the
  // preview drawn in the fallback until the next edit.
  useEffect(() => {
    if (typeof document === 'undefined' || !('fonts' in document)) return
    const onDone = () => useUiStore.getState().bumpAssets()
    document.fonts.addEventListener('loadingdone', onDone)
    return () => document.fonts.removeEventListener('loadingdone', onDone)
  }, [])

  if (tooNarrow) {
    return (
      <div className={s.notice}>
        <div className="t-title" style={{ fontSize: 17 }}>
          Bezel needs a wider window.
        </div>
        <p className="t-caption">Make the window at least 1024 px wide to continue.</p>
      </div>
    )
  }

  return (
    <>
      {route.name === 'editor' ? <Editor id={route.id} /> : <ProjectsScreen />}
      <ToastHost />
    </>
  )
}
