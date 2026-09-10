import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useCallback } from 'react'
import { SLOT_CAP } from '../../model/types'
import { exportNumbers, slotsUsed } from '../../model/clamp'
import { reorderItems } from '../../store/actions'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { Button } from '../controls/Button'
import { useDropZone } from '../hooks/useDropZone'
import { FilmstripItem } from './FilmstripItem'
import { importFilesAsSlides } from './importFiles'
import s from './editor.module.css'

export function Filmstrip() {
  const project = useProjectStore((p) => p.project)
  const openSheet = useUiStore((u) => u.openSheet)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onFiles = useCallback((files: File[]) => void importFilesAsSlides(files), [])
  const drop = useDropZone(onFiles)

  if (!project) return <aside className={s.filmstrip} />
  const items = project.items
  const used = slotsUsed(items)
  const numbers = exportNumbers(items)

  const onDragEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) reorderItems(String(e.active.id), String(e.over.id))
  }

  return (
    <aside className={[s.filmstrip, drop.active ? s.dropActive : ''].join(' ')} {...drop.handlers}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
          <ul className={s.filmstripList} role="listbox" aria-label="Slides" aria-orientation="vertical">
            {items.map((item) => (
              <FilmstripItem key={item.id} item={item} theme={project.theme} range={numbers.get(item.id)!} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <div className={s.filmstripFooter}>
        <span className="t-numeric" aria-label={`${used} of ${SLOT_CAP} slots used`}>
          {used} / {SLOT_CAP}
        </span>
        <Button variant="tinted" size="sm" onClick={() => openSheet('add')} disabled={used >= SLOT_CAP} title={used >= SLOT_CAP ? 'The set is full' : undefined}>
          + Add
        </Button>
      </div>
    </aside>
  )
}
