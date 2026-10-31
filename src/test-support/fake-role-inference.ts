import type { RoleInference, RoleInferenceRequest } from "../contracts/role-inference"

export class FakeRoleInference implements RoleInference {
	readonly requests: Array<RoleInferenceRequest<unknown>> = []

	constructor(private readonly scriptedOutputs: Array<unknown>) {}

	async infer<Output>(request: RoleInferenceRequest<Output>): Promise<Output> {
		this.requests.push(request)
		const scripted = this.scriptedOutputs.shift()
		if (scripted === undefined) {
			throw new Error(`FakeRoleInference: no scripted output left for ${request.role}`)
		}
		return request.output.schema.parse(scripted)
	}
}
