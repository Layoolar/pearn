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
	const wordsArray = input.split(/,|\s+/).map((word) => word.trim());
	return wordsArray;
};

/**
 * startsWithTag()
 * =================================
 *
 * @param {string[]} input - array of tags
 * @return {boolean} - True if all contains tags else false
 */
const startsWithTag = (input: string[]): boolean => {
	return input.every((item) => item.startsWith("#"));
};

/**
 * isValidTwitterUsername()
 * =================================
 *
 * @param {string} text - collects twitter username
 * @return {boolean} - if test is true or not
 */
const isValidTwitterUsername = (text: string): boolean => {
	return text.startsWith("@") && /^[a-zA-Z0-9_]+$/.test(text.substring(1));
};

export { extractId, extractUsername, collectWords, isValidTwitterUsername, startsWithTag };
