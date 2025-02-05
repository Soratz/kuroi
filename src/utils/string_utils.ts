export function decodeHtmlEntities(text: string): string {
	return text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&apos;/g, '\'');
}