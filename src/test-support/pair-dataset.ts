import { aCompany, aDataset, aPublication, aResearcher } from "./dataset-builders"

/* The dataset behind aBusinessCard() and aScholarCard(): quotes in those cards verify against it. */
export function aPairDataset() {
	return aDataset({
		companies: [aCompany({ challenges: [{ id: "C001-CH1", text: "Detect anomalies without labels.",
			detail: "We have no attack examples. Alerts must be explainable to a plant manager." }] })],
		researchers: [aResearcher({ id: "R0007", bio: "Her group learns baselines of normal traffic.", publications: ["SYN-PUB-00001"],
			open_to: ["joint projects with companies", "industrial PhD supervision"] })],
		publications: [aPublication({ id: "SYN-PUB-00001", abstract: "We learn a baseline of normal Modbus traffic.",
			authors: [{ name: "A", researcher_id: "R0007", affiliation: "UNS" }] })],
	})
}
