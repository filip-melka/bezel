import { slotsFree } from '../../model/clamp'
import { ImportError, importScreenshot } from '../../persistence/assets'
import { appendSlidesWithScreenshots, setScreenshot } from '../../store/actions'
import { getProject } from '../../store/projectStore'
import { toast, useUiStore } from '../../store/uiStore'

function reportError(e: unknown): void {
  if (e instanceof ImportError) toast(e.message)
  else {
    console.error(e)
    toast('Import failed.')
  }
}

// Multi-file drop onto the filmstrip: one textTop slide per file, truncated
// at the slot cap with a toast (SPEC §9.2).
export async function importFilesAsSlides(files: File[]): Promise<void> {
  const project = getProject()
  if (!project) return
  const free = slotsFree(project.items)
  const accepted = files.slice(0, free)
  if (files.length > free) {
    toast(free === 0 ? 'The set is full.' : `Only the first ${free} screenshots were added, the set is full.`)
  }
  const refs = []
  for (const file of accepted) {
    try {
      refs.push(await importScreenshot(file, project.id))
    } catch (e) {
      reportError(e)
    }
  }
  if (refs.length) {
    appendSlidesWithScreenshots(refs)
    useUiStore.getState().bumpAssets()
  }
}

// Single file onto the selected item (stage drop, paste, Replace).
export async function importFileToItem(file: File, itemId: string): Promise<void> {
  const project = getProject()
  if (!project) return
  try {
    const ref = await importScreenshot(file, project.id)
    setScreenshot(itemId, ref)
    useUiStore.getState().bumpAssets()
  } catch (e) {
    reportError(e)
  }
}
