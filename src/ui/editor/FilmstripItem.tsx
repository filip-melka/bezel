import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { canAdd, rangeLabel, slotCost, type ExportRange } from '../../model/clamp'
import type { SlideItem, Theme } from '../../model/types'
import { duplicateItem, removeItem } from '../../store/actions'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { useThumbnail } from '../hooks/useThumbnail'
import s from './editor.module.css'

const THUMB_W = 64

type Props = { item: SlideItem; theme: Theme; range: ExportRange }

export function FilmstripItem({ item, theme, range }: Props) {
  const selected = useUiStore((u) => u.selectedId === item.id)
  const select = useUiStore((u) => u.select)
  const items = useProjectStore((p) => p.project?.items ?? [])
  const isPair = item.kind === 'pair'
  const width = isPair ? THUMB_W * 2 : THUMB_W
  const thumb = useThumbnail(item, theme, width)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const warn = !!thumb.report && (thumb.report.textShrunk || thumb.report.screenshotAspectMismatch)
  const canDuplicate = canAdd(items, slotCost(item))
  const label = rangeLabel(range)
  const aria = isPair ? `Slides ${range.start} to ${range.end}, panoramic pair` : `Slide ${range.start}`

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="option"
      aria-selected={selected}
      aria-label={aria + (warn ? ', has warnings' : '')}
      tabIndex={selected ? 0 : -1}
      className={s.thumbItem}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 5 : undefined,
        boxShadow: isDragging ? 'var(--shadow-floating)' : undefined,
        alignItems: isPair ? 'stretch' : undefined,
      }}
      onClick={() => select(item.id)}
    >
      <div className={s.thumbFrame} style={{ width: thumb.cssWidth, height: thumb.cssHeight }}>
        <canvas ref={thumb.ref} className={s.thumbCanvas} style={{ width: thumb.cssWidth, height: thumb.cssHeight }} />
        {isPair ? <div className={s.seam} aria-hidden /> : null}
        <span className={s.chip} aria-hidden>
          {label}
        </span>
        {warn ? <span className={s.badge} title="This slide has warnings" /> : null}
      </div>
      <div className={s.thumbLabel}>
        <span>{isPair ? `${label} · pair` : label}</span>
        <span className={s.thumbActions}>
          <button
            type="button"
            className={s.iconBtn}
            aria-label={`Duplicate ${aria}`}
            title={canDuplicate ? 'Duplicate' : 'Not enough free slots'}
            disabled={!canDuplicate}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              duplicateItem(item.id)
            }}
          >
            ⧉
          </button>
          <button
            type="button"
            className={s.iconBtn}
            aria-label={`Delete ${aria}`}
            title="Delete"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              removeItem(item.id)
            }}
          >
            ✕
          </button>
        </span>
      </div>
    </li>
  )
}
