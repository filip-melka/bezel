import { slotsFree } from '../../model/clamp'
import type { TemplateId } from '../../model/types'
import { ALL_TEMPLATE_IDS, TEMPLATES } from '../../templates/registry'
import { addItem } from '../../store/actions'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { Button } from '../controls/Button'
import { Sheet } from '../controls/Sheet'
import s from './editor.module.css'

const STROKE = 'var(--label-3)'
const BAR = 'var(--label-2)'

const Bars = ({ x, y, w = 96 }: { x: number; y: number; w?: number }) => (
  <>
    <rect x={x} y={y} width={w} height="10" rx="3" fill={BAR} />
    <rect x={x} y={y + 18} width={w * 0.7} height="7" rx="3" fill={BAR} opacity="0.6" />
  </>
)
const Device = (p: { x: number; y: number; w: number; h: number }) => (
  <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="16" fill="none" stroke={STROKE} strokeWidth="4" />
)
const Seam = () => <line x1="132" y1="0" x2="132" y2="287" stroke={STROKE} strokeDasharray="4 4" />

// Pure-geometry tiles: outlined device, filled text bars (DESIGN §5.2).
function TileArt({ id }: { id: TemplateId }) {
  switch (id) {
    case 'textTop':
      return (
        <svg className={s.tileArt} viewBox="0 0 132 287" aria-hidden>
          <Bars x={18} y={26} />
          <Device x={22} y={80} w={88} h={240} />
        </svg>
      )
    case 'textBottom':
      return (
        <svg className={s.tileArt} viewBox="0 0 132 287" aria-hidden>
          <Device x={22} y={-40} w={88} h={240} />
          <Bars x={18} y={228} />
        </svg>
      )
    case 'deviceOnly':
      return (
        <svg className={s.tileArt} viewBox="0 0 132 287" aria-hidden>
          <Device x={24} y={22} w={84} h={243} />
        </svg>
      )
    case 'tilted':
      return (
        <svg className={s.tileArt} viewBox="0 0 132 287" aria-hidden>
          <Bars x={14} y={26} w={72} />
          <g transform="rotate(-12 110 240)">
            <Device x={52} y={100} w={116} h={280} />
          </g>
        </svg>
      )
    case 'lockActivity':
      return (
        <svg className={s.tileArt} viewBox="0 0 132 287" aria-hidden>
          <Bars x={18} y={26} />
          <Device x={26} y={70} w={80} h={230} />
          <rect x={10} y={210} width={112} height={44} rx="10" fill="var(--tint)" opacity="0.85" />
        </svg>
      )
    case 'island':
      return (
        <svg className={s.tileArt} viewBox="0 0 132 287" aria-hidden>
          <Bars x={18} y={26} />
          <Device x={26} y={90} w={80} h={230} />
          <rect x={16} y={72} width={100} height={36} rx="18" fill="var(--tint)" opacity="0.85" />
          <rect x={44} y={104} width={44} height={12} rx="6" fill="none" stroke={STROKE} strokeDasharray="3 3" />
        </svg>
      )
    case 'panorama':
      return (
        <svg className={s.tileArt} viewBox="0 0 264 287" aria-hidden>
          <Seam />
          <Bars x={18} y={30} />
          <Bars x={150} y={30} />
          <Device x={72} y={80} w={120} h={260} />
        </svg>
      )
    case 'panoTilted':
      return (
        <svg className={s.tileArt} viewBox="0 0 264 287" aria-hidden>
          <Seam />
          <Bars x={18} y={30} />
          <Bars x={150} y={30} />
          <g transform="rotate(-12 132 260)">
            <Device x={66} y={110} w={132} h={300} />
          </g>
        </svg>
      )
    case 'panoTiltedRight':
      return (
        <svg className={s.tileArt} viewBox="0 0 264 287" aria-hidden>
          <Seam />
          <Bars x={18} y={30} />
          <Bars x={150} y={30} />
          <g transform="rotate(12 132 260)">
            <Device x={66} y={110} w={132} h={300} />
          </g>
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
    <Sheet open={open} onClose={close} title="Add a slide" width={760}>
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
          {free === 0 ? 'The set is full. Delete a slide to make room.' : 'A panorama uses two of your ten. Delete a slide to make room.'}
        </div>
      ) : null}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <Button onClick={close}>Cancel</Button>
      </div>
    </Sheet>
  )
}
