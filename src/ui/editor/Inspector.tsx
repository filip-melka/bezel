import { exportNumbers, rangeLabel } from '../../model/clamp'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore, type InspectorTab } from '../../store/uiStore'
import { Segmented } from '../controls/Segmented'
import { SlideTab } from './inspector/SlideTab'
import { ThemeTab } from './inspector/ThemeTab'
import s from './editor.module.css'

export function Inspector() {
  const project = useProjectStore((p) => p.project)
  const selectedId = useUiStore((u) => u.selectedId)
  const tab = useUiStore((u) => u.inspectorTab)
  const setTab = useUiStore((u) => u.setTab)
  const item = project?.items.find((it) => it.id === selectedId) ?? null
  const range = project && item ? exportNumbers(project.items).get(item.id) : undefined
  const title = item && range ? (item.kind === 'pair' ? `Slides ${rangeLabel(range)}` : `Slide ${rangeLabel(range)}`) : 'No slide selected'

  return (
    <aside className={s.inspector} aria-label="Inspector">
      <div className={s.inspectorHeader}>
        <span className="t-title">{tab === 'slide' ? title : 'Set theme'}</span>
        <Segmented<InspectorTab>
          ariaLabel="Inspector section"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'slide', label: 'Slide' },
            { value: 'theme', label: 'Set theme' },
          ]}
        />
      </div>
      <div className={s.inspectorBody}>
        {project ? tab === 'slide' ? item ? <SlideTab item={item} theme={project.theme} /> : <p className={s.hint}>Select a slide in the filmstrip.</p> : <ThemeTab theme={project.theme} /> : null}
      </div>
    </aside>
  )
}
