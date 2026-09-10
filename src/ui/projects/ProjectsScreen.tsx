import { useCallback, useEffect, useState } from 'react'
import { navigateToEditor } from '../../app/router'
import { newSlide } from '../../model/defaults'
import type { Project } from '../../model/types'
import { ImportError, importScreenshot, releaseAllAssets } from '../../persistence/assets'
import { listProjects, writeProject } from '../../persistence/db'
import { createProject, deleteProject, duplicateProject, renameProjectRecord } from '../../persistence/projects'
import { SLOT_CAP } from '../../model/types'
import { toast } from '../../store/uiStore'
import { Button } from '../controls/Button'
import { Sheet } from '../controls/Sheet'
import { useDropZone } from '../hooks/useDropZone'
import { ProjectCard } from './ProjectCard'
import s from './projects.module.css'

export function ProjectsScreen() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null)

  const refresh = useCallback(async () => setProjects(await listProjects()), [])
  useEffect(() => {
    void refresh()
  }, [refresh])

  const onNew = async () => {
    const p = await createProject()
    navigateToEditor(p.id)
  }

  // Dropping n images creates a project with n textTop slides (DESIGN §5.1).
  const onFiles = useCallback(async (files: File[]) => {
    const project = await createProject()
    project.items = []
    const accepted = files.slice(0, SLOT_CAP)
    if (files.length > SLOT_CAP) toast(`Only the first ${SLOT_CAP} screenshots were added, the set is full.`)
    for (const file of accepted) {
      try {
        const ref = await importScreenshot(file, project.id)
        const slide = newSlide('textTop')
        slide.screenshot = ref
        project.items.push(slide)
      } catch (e) {
        toast(e instanceof ImportError ? e.message : 'Import failed.')
      }
    }
    if (project.items.length === 0) project.items.push(newSlide('textTop'))
    releaseAllAssets()
    await writeProject(project)
    navigateToEditor(project.id)
  }, [])
  const drop = useDropZone((files) => void onFiles(files))

  const confirmDelete = async () => {
    if (!pendingDelete) return
    await deleteProject(pendingDelete.id)
    setPendingDelete(null)
    await refresh()
  }

  return (
    <div className={[s.root, drop.active ? s.dropActive : ''].join(' ')} {...drop.handlers}>
      <header className={s.header}>
        <div className={s.brand}>
          <span aria-hidden>▮</span> Bezel
        </div>
        <Button variant="primary" onClick={() => void onNew()}>
          New project
        </Button>
      </header>

      {projects === null ? null : projects.length === 0 ? (
        <div className={s.empty}>
          <div className="t-title" style={{ fontSize: 17 }}>
            App Store screenshots, without the design work.
          </div>
          <p>Drop your raw iPhone screenshots anywhere on this page. Pick a layout per slide, write a headline, export a numbered set at 6.9".</p>
          <p>Everything stays in this browser. Nothing is uploaded.</p>
          <Button variant="primary" onClick={() => void onNew()}>
            New project
          </Button>
        </div>
      ) : (
        <div className={s.grid}>
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onOpen={() => navigateToEditor(p.id)}
              onRename={(name) => void renameProjectRecord(p, name).then(refresh)}
              onDuplicate={() => void duplicateProject(p).then(refresh)}
              onDelete={() => setPendingDelete(p)}
            />
          ))}
        </div>
      )}

      <Sheet open={pendingDelete !== null} onClose={() => setPendingDelete(null)} title="Delete project?">
        <p style={{ margin: '0 0 12px' }}>
          “{pendingDelete?.name}” and its screenshots will be removed from this browser. This cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button variant="primary" onClick={() => void confirmDelete()}>
            Delete
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
