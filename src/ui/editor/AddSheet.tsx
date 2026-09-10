import { slotsFree } from '../../model/clamp'
import type { TemplateId } from '../../model/types'
import { ALL_TEMPLATE_IDS, TEMPLATES } from '../../templates/registry'
import { addItem } from '../../store/actions'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { Sheet } from '../controls/Sheet'
import s from './editor.module.css'

// Pure-geometry tiles: outlined device, filled text bars (DESIGN §5.2).
function TileArt({ id }: { id: TemplateId }) {
  const stroke = 'var(--label-3)'
  const bar = 'var(--label-2)'
  switch (id) {
    case 'textTop':
      return (
        <svg className={s.tileArt} viewBox="0 0 132 287" aria-hidden>
          <rect x="18" y="26" width="96" height="10" rx="3" fill={bar} />
          <rect x="34" y="44" width="64" height="7" rx="3" fill={bar} opacity="0.6" />
          <rect x="22" y="80" width="88" height="240" rx="16" fill="none" stroke={stroke} strokeWidth="4" />
        </svg>
      )
    case 'deviceOnly':
      return (
        <svg className={s.tileArt} viewBox="0 0 132 287" aria-hidden>
          <rect x="24" y="22" width="84" height="243" rx="16" fill="none" stroke={stroke} strokeWidth="4" />
        </svg>
      )
    case 'tilted':
      return (
        <svg className={s.tileArt} viewBox="0 0 132 287" aria-hidden>
          <rect x="14" y="26" width="72" height="10" rx="3" fill={bar} />
          <rect x="14" y="44" width="52" height="7" rx="3" fill={bar} opacity="0.6" />
          <g transform="rotate(-12 110 240)">
            <rect x="52" y="100" width="116" height="280" rx="16" fill="none" stroke={stroke} strokeWidth="4" />
          </g>
        </svg>
      )
    case 'panoLeftText':
      return (
        <svg className={s.tileArt} viewBox="0 0 264 287" aria-hidden>
          <line x1="132" y1="0" x2="132" y2="287" stroke={stroke} strokeDasharray="4 4" />
          <rect x="18" y="30" width="96" height="10" rx="3" fill={bar} />
          <rect x="18" y="48" width="72" height="7" rx="3" fill={bar} opacity="0.6" />
          <rect x="72" y="80" width="120" height="260" rx="18" fill="none" stroke={stroke} strokeWidth="4" />
        </svg>
      )
    case 'panoRightText':
      return (
        <svg className={s.tileArt} viewBox="0 0 264 287" aria-hidden>
          <line x1="132" y1="0" x2="132" y2="287" stroke={stroke} strokeDasharray="4 4" />
          <rect x="150" y="30" width="96" height="10" rx="3" fill={bar} />
          <rect x="150" y="48" width="72" height="7" rx="3" fill={bar} opacity="0.6" />
          <rect x="72" y="80" width="120" height="260" rx="18" fill="none" stroke={stroke} strokeWidth="4" />
        </svg>
      )
  }
}

export function AddSheet() {
  const open = useUiStore((u) => u.sheet === 'add')
  const close = useUiStore((u) => u.closeSheet)
  const items = useProjectStore((p) => p.project?.items ?? [])
  const free = slotsFree(items)

  return (
    <Sheet open={open} onClose={close} title="Add a slide">
      <div className={s.tiles}>
        {ALL_TEMPLATE_IDS.map((id) => {
          const def = TEMPLATES[id]
          const disabled = def.slots > free
          return (
            <button
              key={id}
              type="button"
              className={[s.tile, def.slots === 2 ? s.wide : ''].join(' ')}
              disabled={disabled}
              aria-describedby={disabled ? 'add-explain' : undefined}
              onClick={() => {
                if (addItem(id)) close()
              }}
            >
              <TileArt id={id} />
              <span className={s.tileName}>{def.name}</span>
              <span className={s.tileCost}>
                {def.description} · {def.slots === 1 ? '1 slot' : '2 slots'}
              </span>
            </button>
          )
        })}
      </div>
      {free < 2 ? (
        <div className={s.explain} id="add-explain" role="status">
          {free === 0
            ? 'The set is full. Delete a slide to make room.'
            : 'A panorama uses two of your ten. Delete a slide to make room.'}
        </div>
      ) : null}
    </Sheet>
  )
}
