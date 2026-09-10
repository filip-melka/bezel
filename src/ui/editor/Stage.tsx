import { useCallback, useEffect, useRef } from 'react'
import { exportNumbers, rangeLabel } from '../../model/clamp'
import { addItem } from '../../store/actions'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { Button } from '../controls/Button'
import { useDropZone } from '../hooks/useDropZone'
import { useRenderPreview } from '../hooks/useRenderPreview'
import { useElementSize } from '../hooks/useViewportGuard'
import { isTextField } from '../hooks/useShortcuts'
import { importFileToItem } from './importFiles'
import s from './editor.module.css'

export function Stage() {
  const project = useProjectStore((p) => p.project)
  const selectedId = useUiStore((u) => u.selectedId)
  const setPreviewReport = useUiStore((u) => u.setPreviewReport)
  const item = project?.items.find((it) => it.id === selectedId) ?? null
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useElementSize(containerRef)
  const report = useRenderPreview(canvasRef, item, project?.theme ?? null, size)

  useEffect(() => {
    setPreviewReport(report)
  }, [report, setPreviewReport])

  const onFiles = useCallback(
    (files: File[]) => {
      const file = files[0]
      if (file && item) void importFileToItem(file, item.id)
    },
    [item],
  )
  const drop = useDropZone(onFiles)

  // ⌘V with an image on the clipboard acts like a drop onto the selected item.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isTextField(e.target)) return
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'))
      if (file && item) {
        e.preventDefault()
        void importFileToItem(file, item.id)
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [item])

  const range = project && item ? exportNumbers(project.items).get(item.id) : undefined
  const caption = range ? (item?.kind === 'pair' ? `${rangeLabel(range)} · pair` : rangeLabel(range)) : ''

  return (
    <main className={s.stage} ref={containerRef} {...drop.handlers}>
      {item ? (
        <>
          <div className={s.stageCanvasWrap}>
            <canvas ref={canvasRef} className={s.stageCanvas} aria-label={`Preview of slide ${caption}`} />
            {item.kind === 'pair' ? <div className={s.stageSeam} aria-hidden /> : null}
          </div>
          <div className={s.caption} tabIndex={0} aria-live="polite">
            <span>{caption}</span>
            <span style={{ opacity: 0.7 }}>{item.kind === 'pair' ? '2640 × 2868' : '1320 × 2868'}</span>
          </div>
        </>
      ) : (
        <div className={s.stageEmpty}>
          <div className={s.stageSilhouette} aria-hidden />
          <div>No slides yet.</div>
          <Button variant="primary" onClick={() => addItem('textTop')}>
            Add slide
          </Button>
        </div>
      )}
      {drop.active && item ? <div className={s.stageDrop} aria-hidden /> : null}
    </main>
  )
}
