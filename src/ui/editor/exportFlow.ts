import { exportItem, exportSet, numbersMissingScreenshots } from '../../export/exportSet'
import { ExportError } from '../../export/png'
import { lookupAsset } from '../../persistence/assets'
import { getProject } from '../../store/projectStore'
import { toast, useUiStore } from '../../store/uiStore'

function fail(e: unknown): void {
  console.error(e)
  toast(e instanceof ExportError ? e.message : 'Export failed, try a smaller set')
}

// Entry point for "Download all" and ⌘E: confirm first if any item lacks a
// screenshot (SPEC §9.6), otherwise render straight away.
export function startExportAll(): void {
  const project = getProject()
  if (!project || project.items.length === 0) return
  if (useUiStore.getState().exportProgress) return
  if (numbersMissingScreenshots(project).length > 0) {
    useUiStore.getState().openSheet('exportConfirm')
    return
  }
  void runExportAll()
}

export async function runExportAll(): Promise<void> {
  const project = getProject()
  if (!project) return
  const ui = useUiStore.getState()
  ui.closeSheet()
  try {
    await exportSet(project, lookupAsset, (done, total) => ui.setExportProgress({ done, total }))
    ui.markExportDone()
  } catch (e) {
    ui.setExportProgress(null)
    fail(e)
  }
}

export async function exportSelected(): Promise<void> {
  const project = getProject()
  const id = useUiStore.getState().selectedId
  const item = project?.items.find((it) => it.id === id)
  if (!project || !item) return
  try {
    await exportItem(project, item, lookupAsset)
    useUiStore.getState().markExportDone()
  } catch (e) {
    fail(e)
  }
}
