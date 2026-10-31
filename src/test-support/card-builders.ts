import type { BusinessCard } from "../contracts/business-card"
import type { ScholarCard } from "../contracts/scholar-card"
import { aSourceRef } from "./pair-builders"

export function aBusinessCard(overrides: Partial<BusinessCard> = {}): BusinessCard {
	return {
		taskId: "C001-CH1",
		companyId: "C001",
		companyName: "ArmaturaSec d.o.o.",
		sector: "Cybersecurity",
		location: "Zrenjanin",
		challenge: {
			text: { recordId: "C001-CH1", field: "text", text: "Detect anomalies without labels." },
			detail: { recordId: "C001-CH1", field: "detail", text: "We have no attack examples. Alerts must be explainable to a plant manager." },
		},
		company: {
			about: { recordId: "C001", field: "about", text: "We build network security hardware." },
			products: [{ recordId: "C001", field: "products", text: "NetGuard-OT appliance" }],
			tech: [{ recordId: "C001", field: "tech", text: "Embedded Linux" }],
			plans: { recordId: "C001", field: "plans", text: "" },
			rdCapacity: { recordId: "C001", field: "rd_capacity", text: "One engineer part-time." },
			pastCollaborations: { recordId: "C001", field: "past_collaborations", text: "" },
		},
		...overrides,
	}
}

export function aScholarCard(overrides: Partial<ScholarCard> = {}): ScholarCard {
	return {
		researcherId: "R0007",
		name: "Milica Jović",
		faculty: "Faculty of Technical Sciences",
		department: "Computing and Control",
		fields: ["Machine Learning"],
		keywords: ["Modbus", "traffic baselines"],
		openTo: ["joint projects with companies", "industrial PhD supervision"],
		bio: { recordId: "R0007", field: "bio", text: "Her group learns baselines of normal traffic." },
		industryExperience: { recordId: "R0007", field: "industry_experience", text: "" },
		notes: { recordId: "R0007", field: "notes", text: "" },
		works: [{ recordId: "SYN-PUB-00001", kind: "publication", title: "Baselines for Modbus",
			body: { recordId: "SYN-PUB-00001", field: "abstract", text: "We learn a baseline of normal Modbus traffic." } }],
		participation: {
			industrialPhdSupervision: { status: "open", sources: [aSourceRef("R0007", "open_to", "industrial PhD supervision")] },
			jointProject: { status: "open", sources: [aSourceRef("R0007", "open_to", "joint projects with companies")] },
			availability: { status: "unknown", sources: [] },
		},
		qualityFlags: [],
		...overrides,
	}
}
