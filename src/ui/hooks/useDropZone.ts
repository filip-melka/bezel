import { useCallback, useRef, useState, type DragEvent } from 'react'

// Drag-and-drop file target. Only reacts to drags that carry files so that
// filmstrip reordering (dnd-kit, no dataTransfer files) is unaffected.
export function useDropZone(onFiles: (files: File[]) => void) {
  const [active, setActive] = useState(false)
  const depth = useRef(0)

  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')

  const onDragEnter = useCallback((e: DragEvent) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    depth.current += 1
    setActive(true)
  }, [])

  const onDragOver = useCallback((e: DragEvent) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDragLeave = useCallback((e: DragEvent) => {
    if (!hasFiles(e)) return
    depth.current = Math.max(0, depth.current - 1)
    if (depth.current === 0) setActive(false)
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth.current = 0
      setActive(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length) onFiles(files)
    },
    [onFiles],
  )

  return { active, handlers: { onDragEnter, onDragOver, onDragLeave, onDrop } }
}

export function pickFiles(multiple: boolean): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp'
    input.multiple = multiple
    input.style.display = 'none'
    input.onchange = () => {
      resolve(Array.from(input.files ?? []))
      input.remove()
    }
    input.oncancel = () => {
      resolve([])
      input.remove()
    }
    document.body.appendChild(input)
    input.click()
  })
}
