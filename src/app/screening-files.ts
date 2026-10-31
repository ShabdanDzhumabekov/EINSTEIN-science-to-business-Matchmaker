import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CompanyScreening } from '../contracts/company-screening'
import { TaskScreening } from '../contracts/task-screening'
import type { ScreeningStore } from '../screening/screening-store'

export class ScreeningFiles implements ScreeningStore {
  constructor(private readonly directory: string, private readonly now: () => Date = () => new Date()) {
    mkdirSync(directory, { recursive: true })
  }
  find(taskId: string, prefilterThreshold?: number): TaskScreening | undefined {
    const path = join(this.directory, taskFile(taskId, prefilterThreshold))
    if (!existsSync(path)) return undefined
    const screening = TaskScreening.parse(JSON.parse(readFileSync(path, 'utf8')))
    /* Files written before provenance existed are dated by their modification time. */
    const screenedAt = screening.provenance?.screenedAt ?? statSync(path).mtime.toISOString()
    return { ...screening, provenance: { screenedAt, isFromCache: true } }
  }
  save(screening: TaskScreening): TaskScreening {
    const stamped = { ...screening, provenance: { screenedAt: this.now().toISOString(), isFromCache: false } }
    writeFileSync(join(this.directory, taskFile(screening.taskId, screening.prefilter?.threshold)), JSON.stringify(stamped, null, 2))
    return stamped
  }
  findCompany(companyId: string): CompanyScreening | undefined {
    const path = join(this.directory, `company-${companyId}.json`)
    if (!existsSync(path)) return undefined
    const screening = CompanyScreening.parse(JSON.parse(readFileSync(path, 'utf8')))
    return { ...screening, provenance: { screenedAt: screening.provenance?.screenedAt ?? statSync(path).mtime.toISOString(), isFromCache: true } }
  }
  saveCompany(screening: CompanyScreening): CompanyScreening {
    const stamped = { ...screening, provenance: { screenedAt: this.now().toISOString(), isFromCache: false } }
    writeFileSync(join(this.directory, `company-${screening.companyId}.json`), JSON.stringify(stamped, null, 2))
    return stamped
  }
}

function taskFile(taskId: string, prefilterThreshold: number | undefined): string {
  return prefilterThreshold === undefined ? `${taskId}.json` : `${taskId}.prefilter-${prefilterThreshold}.json`
}
