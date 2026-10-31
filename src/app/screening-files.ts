import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { TaskScreening } from '../contracts/task-screening'
import type { ScreeningStore } from '../screening/screening-store'

export class ScreeningFiles implements ScreeningStore {
  constructor(private readonly directory: string, private readonly now: () => Date = () => new Date()) {
    mkdirSync(directory, { recursive: true })
  }
  find(taskId: string): TaskScreening | undefined {
    const path = join(this.directory, `${taskId}.json`)
    if (!existsSync(path)) return undefined
    const screening = TaskScreening.parse(JSON.parse(readFileSync(path, 'utf8')))
    /* Files written before provenance existed are dated by their modification time. */
    const screenedAt = screening.provenance?.screenedAt ?? statSync(path).mtime.toISOString()
    return { ...screening, provenance: { screenedAt, isFromCache: true } }
  }
  save(screening: TaskScreening): TaskScreening {
    const stamped = { ...screening, provenance: { screenedAt: this.now().toISOString(), isFromCache: false } }
    writeFileSync(join(this.directory, `${screening.taskId}.json`), JSON.stringify(stamped, null, 2))
    return stamped
  }
}
