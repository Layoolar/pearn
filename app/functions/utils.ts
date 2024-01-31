/**
 * extractId()
 * ===========================
 *
 * @param {string} link - link string
 * @return {boolean} true / false
 */
const extractId = (link: string): string | null => {
	const regexPattern = /twitter\.com\/([^/]+)\/status\/(\d+)/;
	const match = link.match(regexPattern);
	if (match && match.length === 3) {
		return match[2]; // Extracted tweet ID
	} else {
		return null;
	}
};

/**
 * checkLinkandExtractUsername()
 * =================================
 *
 * @param {string} link - link string
 * @return {string | null} - match or null
 */
const extractUsername = (link: string): string | null => {
	const regexPattern = /twitter\.com\/([^/]+)\/status\/(\d+)/;
	const match = link.match(regexPattern);
	if (match && match.length === 3) {
		return match[1]; // Extracted username
	} else {
		return null;
	}
};

/**
 * collectWords()
 * ===============================
 *
 * @param {string} input - collects words in string into array
 * @return {string[]} - array of words
 */
const collectWords = (input: string): string[] => {
	const wordsArray = input.split(",").map((word) => word.trim());
	return wordsArray;
};
export { extractId, extractUsername, collectWords };
