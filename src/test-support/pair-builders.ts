import type { PairAssessment } from "../contracts/pair-assessment"
import type { Proposal } from "../contracts/proposal"
import type { SourceRef } from "../contracts/source-ref"
import { TEST_DATASET_VERSION } from "./dataset-builders"

export function aSourceRef(recordId: string, field: string, quote: string): SourceRef {
	return { recordId, field, quote, datasetVersion: TEST_DATASET_VERSION }
}

type ProposedPair = Extract<PairAssessment, { outcome: "pair" }>

export function aPairAssessment(overrides: Partial<ProposedPair> = {}): ProposedPair {
	return {
		outcome: "pair",
		taskId: "C001-CH1",
		researcherId: "R0007",
		format: "joint_project",
		jointProblem: "Learn a site baseline of Modbus traffic and flag drift.",
		rationale: [{ text: "R0007 learns baselines of normal traffic.", sources: [aSourceRef("SYN-PUB-00001", "abstract", "baseline of normal Modbus traffic")] }],
		constraints: [{ text: "No attack labels.", sources: [aSourceRef("C001-CH1", "detail", "We have no attack examples.")] }],
		risks: [],
		questions: [],
		inputs: [{ artifactId: "task-C001-CH1", version: 1 }],
		...overrides,
	}
}

export function aProposal(overrides: Partial<Proposal> = {}): Proposal {
	return {
		taskId: "C001-CH1",
		researcherId: "R0007",
		format: "joint_project",
		isConditional: false,
		title: "Site baselines for Modbus anomaly detection",
		markdown: "# Site baselines\nThe company has no attack examples.",
		facts: [{ text: "No attack labels.", sources: [aSourceRef("C001-CH1", "detail", "We have no attack examples.")] },
			{ text: "R0007 learns baselines of normal Modbus traffic.", sources: [aSourceRef("SYN-PUB-00001", "abstract", "We learn a baseline of normal Modbus traffic.")] }],
		inferences: [],
		proposedActions: [],
		questions: [],
		benefits: { company: "A detector tuned to its own sites.", researcher: "A test of baseline calibration on new traffic." },
		inputs: [{ artifactId: "pair-C001-CH1-R0007", version: 1 }],
		...overrides,
	}
}
