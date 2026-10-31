const SERBIAN_CYRILLIC_TO_LATIN: Readonly<Record<string, string>> = {
	а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "dj", е: "e", ж: "z", з: "z", и: "i", ј: "j", к: "k", л: "l",
	љ: "lj", м: "m", н: "n", њ: "nj", о: "o", п: "p", р: "r", с: "s", т: "t", ћ: "c", у: "u", ф: "f", х: "h",
	ц: "c", ч: "c", џ: "dz", ш: "s",
}

/* Search-only form: never used for quotes, which are checked against the original text. */
export function searchableText(text: string): string {
	return [...text.toLocaleLowerCase().normalize("NFC")]
		.map((character) => SERBIAN_CYRILLIC_TO_LATIN[character] ?? character)
		.join("")
		.replace(/đ/g, "dj")
		.normalize("NFD")
		.replace(/\p{Mn}/gu, "")
}
