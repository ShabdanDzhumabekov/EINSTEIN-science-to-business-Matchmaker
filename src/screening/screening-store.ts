import type { CompanyScreening } from "../contracts/company-screening"
import type { TaskScreening } from "../contracts/task-screening"

/* Keeps stage 2 results between runs: screening a task against all researchers is the widest Jev step.
   A task screening made with a company pre-filter is a different result from one made without, so the threshold is part of the key. */
export interface ScreeningStore {
	find(taskId: string, prefilterThreshold?: number): TaskScreening | undefined
	save(screening: TaskScreening): TaskScreening
	findCompany(companyId: string): CompanyScreening | undefined
	saveCompany(screening: CompanyScreening): CompanyScreening
}
