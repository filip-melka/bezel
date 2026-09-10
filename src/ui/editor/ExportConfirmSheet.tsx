import { numbersMissingScreenshots } from '../../export/exportSet'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { Button } from '../controls/Button'
import { Sheet } from '../controls/Sheet'
import { runExportAll } from './exportFlow'

export function ExportConfirmSheet() {
  const open = useUiStore((u) => u.sheet === 'exportConfirm')
  const close = useUiStore((u) => u.closeSheet)
  const project = useProjectStore((p) => p.project)
  const missing = project ? numbersMissingScreenshots(project) : []

  return (
    <Sheet open={open} onClose={close} title="Some slides have no screenshot">
      <p style={{ margin: '0 0 12px' }}>
        {missing.length === 1 ? 'Slide' : 'Slides'} {missing.join(', ')} will export with a solid black screen. Add screenshots first, or export anyway.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={close}>Go back</Button>
        <Button variant="primary" onClick={() => void runExportAll()}>
          Export anyway
        </Button>
      </div>
    </Sheet>
  )
}
