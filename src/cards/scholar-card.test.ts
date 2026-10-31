import { expect, it } from "vitest"
import { aDataset, aPublication, aResearcher } from "../test-support/dataset-builders"
import { scholarCard } from "./scholar-card"

function aProfiledDataset() {
	return aDataset({
		researchers: [aResearcher({ id: "R0007", bio: "Her group learns baselines of normal traffic.", publications: ["SYN-PUB-00001", "SYN-PUB-00002", "SYN-PUB-00003"],
			open_to: ["joint projects with companies", "industrial PhD supervision"], notes: "" })],
		publications: [
			aPublication({ id: "SYN-PUB-00001", title: "Baselines for Modbus", abstract: "We learn a baseline of normal Modbus traffic.",
				authors: [{ name: "A", researcher_id: "R0007", affiliation: "UNS" }] }),
			aPublication({ id: "SYN-PUB-00002", abstract: "Deep learning for crop disease detection.", authors: [] }),
			aPublication({ id: "SYN-PUB-00003", title: "Title only", abstract: "", authors: [{ name: "A", researcher_id: "R0007", affiliation: "UNS" }] }),
		],
	})
}

it("lists only works with confirmed authorship and a body to quote", () => {
	const card = scholarCard(aProfiledDataset(), "R0007", [])

	expect(card.works).toEqual([{ recordId: "SYN-PUB-00001", kind: "publication", title: "Baselines for Modbus",
		body: { recordId: "SYN-PUB-00001", field: "abstract", text: "We learn a baseline of normal Modbus traffic." } }])
})

it("carries the bio as a passage of the researcher record", () => {
	const card = scholarCard(aProfiledDataset(), "R0007", [])

	expect(card.bio).toEqual({ recordId: "R0007", field: "bio", text: "Her group learns baselines of normal traffic." })
})

it("reads willingness for both formats from open_to with the item as source", () => {
	const card = scholarCard(aProfiledDataset(), "R0007", [])

	expect([card.participation.industrialPhdSupervision, card.participation.jointProject]).toEqual([
		{ status: "open", sources: [{ recordId: "R0007", field: "open_to", quote: "industrial PhD supervision", datasetVersion: "test-dataset@1" }] },
		{ status: "open", sources: [{ recordId: "R0007", field: "open_to", quote: "joint projects with companies", datasetVersion: "test-dataset@1" }] },
	])
})

it("leaves willingness unknown when open_to says nothing about the format", () => {
	const dataset = aDataset({ researchers: [aResearcher({ id: "R0007", open_to: ["student internships"] })] })

	const card = scholarCard(dataset, "R0007", [])

	expect([card.participation.industrialPhdSupervision.status, card.participation.jointProject.status]).toEqual(["unknown", "unknown"])
})

it("records a PhD supervision refusal stated in the notes, quoting the sentence", async () => {
	const dataset = aDataset({ researchers: [aResearcher({ id: "R0007", open_to: ["industrial PhD supervision"],
		notes: "Early-career researcher. He cannot independently supervise PhD students. Open to joint work." })] })

	const card = scholarCard(dataset, "R0007", [])

	expect(card.participation.industrialPhdSupervision).toEqual({ status: "declined",
		sources: [{ recordId: "R0007", field: "notes", quote: "He cannot independently supervise PhD students.", datasetVersion: "test-dataset@1" }] })
})

it("does not read availability statements as a refusal", async () => {
	const dataset = aDataset({ researchers: [aResearcher({ id: "R0007", open_to: [], notes: "He is not currently on sabbatical and supervises two doctoral students." })] })

	const card = scholarCard(dataset, "R0007", [])

	expect(card.participation.industrialPhdSupervision.status).toBe("unknown")
})

it("marks a researcher unavailable only when the notes refuse collaboration in general, quoting the sentence", () => {
	const dataset = aDataset({ researchers: [aResearcher({ id: "R0007", notes: "Supervised twelve theses. Retired in 2024 and not available for new collaborations." })] })

	const card = scholarCard(dataset, "R0007", [])

	expect(card.participation.availability).toEqual({ status: "unavailable",
		sources: [{ recordId: "R0007", field: "notes", quote: "Retired in 2024 and not available for new collaborations.", datasetVersion: "test-dataset@1" }] })
})

it("stamps the quality flags computed by code", () => {
	const card = scholarCard(aProfiledDataset(), "R0007", ["authorship_conflict"])

	expect([card.researcherId, card.qualityFlags]).toEqual(["R0007", ["authorship_conflict"]])
})

it("rejects an unknown researcher", () => {
	expect(() => scholarCard(aProfiledDataset(), "R9999", [])).toThrow(/R9999/)
})

function participationOf(overrides: { open_to?: string[]; notes?: string; title?: string }) {
	const dataset = aDataset({ researchers: [aResearcher({ id: "R0007", open_to: [], notes: "", ...overrides })] })
	return scholarCard(dataset, "R0007", []).participation
}

it.each([
	["Ph.D. spelling", "co-supervision of industrial Ph.D. students working on certified toolchains"],
	["doctoral wording", "co-supervision of doctoral students in fintech"],
	["Serbian Cyrillic", "менторство индустријских докторских студената"],
	["Serbian Latin", "Mentorstvo studenata u okviru master i doktorskih teza"],
])("reads PhD supervision willingness written with %s", (_case: string, item: string) => {
	expect(participationOf({ open_to: [item] }).industrialPhdSupervision.status).toBe("open")
})

it.each([
	["Serbian Cyrillic contract research", "уговорна истраживања за прехрамбену индустрију"],
	["Serbian Latin contract research", "Ugovorena istraživanja sa kompanijama koje razvijaju fasade"],
])("reads joint project willingness written as %s", (_case: string, item: string) => {
	expect(participationOf({ open_to: [item] }).jointProject.status).toBe("open")
})

it("reads a refusal to supervise PhD students from the notes, quoting the sentence", () => {
	const participation = participationOf({ notes: "He is completing his thesis and is not available to supervise PhD students. He likes discrete geometry." })

	expect(participation.industrialPhdSupervision).toEqual({ status: "declined",
		sources: [{ recordId: "R0007", field: "notes", quote: "He is completing his thesis and is not available to supervise PhD students.", datasetVersion: "test-dataset@1" }] })
})

it.each([
	["will not join", "Professor Paunović is retired and explicitly limits his external engagement to consulting; he will not join grant project teams or take on student supervision."],
	["not for project participation", "Retired since 2017; available only for consulting, not for active project participation or supervision."],
])("reads a refusal of project work from the notes (%s)", (_case: string, notes: string) => {
	expect(participationOf({ notes }).jointProject.status).toBe("declined")
})

it("does not infer unavailability from an emeritus title alone", () => {
	expect(participationOf({ title: "Professor Emeritus", notes: "Professor Emeritus." }).availability.status).toBe("unknown")
})

it("reads limited availability when a retired researcher says they are still available on a limited basis", () => {
	const participation = participationOf({ notes: "Retired since 2017; available for consulting engagements on a limited basis, particularly in dosimetry." })

	expect(participation.availability.status).toBe("limited")
})

it("leaves availability unknown when a researcher only reports leaving the university (R0068)", () => {
	expect(participationOf({ open_to: ["joint projects"], notes: "Left the University of Novi Sad in March 2026; now a postdoctoral researcher at a university in Austria." }).availability.status).toBe("unknown")
})

it("reads a refusal of project coordination with consulting allowed as limited (R0215)", () => {
	const notes = "Professor Ninkov is retired and explicitly limits engagement to consulting; he is not available for project coordination or grant writing."

	expect(participationOf({ open_to: ["consulting"], notes }).availability.status).toBe("limited")
})

it("keeps a retired researcher's PhD refusal to that role (R1000)", () => {
	const participation = participationOf({ open_to: ["consulting"], notes: "Retired; no longer supervises PhD students." })

	expect([participation.industrialPhdSupervision.status, participation.availability.status]).toEqual(["declined", "unknown"])
})

it("quotes only the stated limit, not the retirement sentence (R0996)", () => {
	const participation = participationOf({ open_to: ["consulting"], notes: "Fully retired from teaching and project coordination. Available exclusively for consulting engagements on a limited basis. Prefers written briefs." })

	expect(participation.availability).toEqual({ status: "limited", sources: [
		{ recordId: "R0007", field: "notes", quote: "Available exclusively for consulting engagements on a limited basis.", datasetVersion: "test-dataset@1" },
	] })
})

it("reads a conditional limit stated by an active researcher as limited, quoting it (R0646)", () => {
	const participation = participationOf({ open_to: ["joint projects"], notes: "Her lab runs a pilot line. She is not available for projects requiring more than 20% travel commitment during the academic semester." })

	expect(participation.availability).toEqual({ status: "limited", sources: [
		{ recordId: "R0007", field: "notes", quote: "She is not available for projects requiring more than 20% travel commitment during the academic semester.", datasetVersion: "test-dataset@1" },
	] })
})

it("keeps a refusal of one role out of availability (R0563)", () => {
	expect(participationOf({ open_to: ["joint projects"], notes: "Not available for student supervision." }).availability.status).toBe("unknown")
})
