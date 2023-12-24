interface ExtractedData {
	tweet: string;
	keywords: string[];
	hashtags: string[];
	points: number;
}

/**
 * Extracts tweet, hashtags and keywords from a text that follows a specific format.
 *
 * The text should contain lines in the following format:
 * # SetPost
 * Tweet: "Hey friends, just played a thrilling game of ball with a tiger in the backyard! 🐯🏀"
 * Keywords: ball, tiger, friends
 * Hashtags: #nodejs, #coding, #wildlife, #friends

 *
 * @param {string} text - The input text containing keywords and hashtags.
 * @returns {Object} - An object containing arrays of extracted keywords and hashtags.
 * @throws {Error} - Throws an error if the input text is not in the expected format.
 *
 * @example
 * const text = `
 * # SetPost
 * Tweet: "Hey friends, just played a thrilling game of ball with a tiger in the backyard! 🐯🏀"
 * Keywords: ball, tiger, friends
 * Hashtags: #nodejs, #coding, #wildlife, #friends
 * Points: 10
 * `;
 *
 * const { tweet, keywords, hashtags, points } = parseSetPostCommand(text);
 * console.log('Tweet:', keywords); // Hey friends, just played a thrilling game of ball with a tiger in the backyard! 🐯🏀
 * console.log('Keywords:', keywords); // ['ball', 'tiger', 'friends']
 * console.log('Hashtags:', hashtags); // ['#nodejs', 'coding', '#wildlife', '#friends']
 * console.log('Points:', points); // 10
 */

function parseSetPostCommand(text: string): ExtractedData {
	// Regular expressions to match lines containing tweet, keywords and hashtags
	const setPostRegex = /# SetPost\s*Tweet:\s*"([^"]*)"\s*Keywords:\s*([^]*?)\s*Hashtags:\s*([^]*)\s*Points:\s*(\d+)/;

	// Extracting matches from the text
	const match = text.match(setPostRegex);

	// Throw an error if the input text is not in the expected format
	if (!match) {
		throw new Error("Input text does not match the expected format. See example in /format");
	}

	// Extracting and trimming tweet, keywords and hashtags
	const tweet = match[1];
	const keywords = match[2].split(",").map((keyword) => keyword.trim());
	const hashtags = match[3].split(",").map((hashtag) => hashtag.trim());
	const points = match[4];

	// Returning an object with extracted keywords and hashtags
	return { tweet, keywords, hashtags, points: Number(points) };
}

/**
 * getPostIdentifier()
 * ==========================
 *
 * @param {string} text - post text
 * @return {string | null} - match or null
 */
function getPostIdentifier(text: string): number | null {
	const idRegex = /Post ID (\d+) - .+/;

	const match = text.match(idRegex);
	return match ? Number(match[1]) : null;
}

/**
 * extractId()
 * ===========================
 *
 * @param {string} link - link string
 * @return {boolean} true / false
 */
const extractId = (link: string): string | null => {
	const twitterRegex = /^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?:\w+\/status\/(\d+))(?:\?.*)?$/i;
	const match = link.match(twitterRegex);
	return match ? match[1] : null;
};

/**
 * checkLinkandExtractUsername()
 * =================================
 *
 * @param {string} link - link string
 * @return {string | null} - match or null
 */
function extractUsername(link: string): string | null {
	const twitterRegex = /^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?:(\w+)\/status\/\d+)(?:\?.*)?$/i;
	const match = link.match(twitterRegex);
	return match ? match[1] : null;
}

export { parseSetPostCommand, getPostIdentifier, extractId, extractUsername };
