import type { NoulQuestion, QuestionText } from "../contracts/decision"

export function questionText({ instructions, whenTrue, whenFalse }: NoulQuestion): QuestionText {
	return { instructions, whenTrue, whenFalse }
}
