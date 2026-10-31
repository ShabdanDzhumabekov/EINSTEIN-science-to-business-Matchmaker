import type { TaskScreening } from "../contracts/task-screening"

/* Keeps stage 2 results between runs: screening a task against all researchers is the widest Jev step. */
export interface ScreeningStore {
	find(taskId: string): TaskScreening | undefined
	save(screening: TaskScreening): TaskScreening
}
