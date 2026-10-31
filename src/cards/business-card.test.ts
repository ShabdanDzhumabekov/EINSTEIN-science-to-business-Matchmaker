import { expect, it } from "vitest"
import { aCompany, aDataset } from "../test-support/dataset-builders"
import { businessCard } from "./business-card"

it("carries the challenge text and detail as passages of the challenge record", () => {
	const dataset = aDataset({ companies: [aCompany({ challenges: [{ id: "C001-CH1", text: "Detect anomalies without labels.", detail: "We have no attack examples." }] })] })

	const card = businessCard(dataset, "C001-CH1")

	expect(card.challenge).toEqual({
		text: { recordId: "C001-CH1", field: "text", text: "Detect anomalies without labels." },
		detail: { recordId: "C001-CH1", field: "detail", text: "We have no attack examples." },
	})
})

it("carries company prose fields and list items as passages of the company record", () => {
	const dataset = aDataset({ companies: [aCompany({ about: "We build network security hardware.", products: ["NetGuard-OT appliance"], tech: ["Embedded Linux"] })] })

	const card = businessCard(dataset, "C001-CH1")

	expect([card.company.about, card.company.products, card.company.tech]).toEqual([
		{ recordId: "C001", field: "about", text: "We build network security hardware." },
		[{ recordId: "C001", field: "products", text: "NetGuard-OT appliance" }],
		[{ recordId: "C001", field: "tech", text: "Embedded Linux" }],
	])
})

it("identifies the task and its company", () => {
	const card = businessCard(aDataset({ companies: [aCompany()] }), "C001-CH1")

	expect([card.taskId, card.companyId, card.companyName, card.sector]).toEqual(["C001-CH1", "C001", "ArmaturaSec d.o.o.", "Cybersecurity"])
})

it("rejects an unknown task", () => {
	expect(() => businessCard(aDataset({ companies: [aCompany()] }), "C999-CH1")).toThrow(/C999-CH1/)
})
