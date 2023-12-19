interface ExtractedData {
	tweet: string;
	keywords: string[];
	hashtags: string[];
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
 * `;
 *
 * const { tweet, keywords, hashtags } = parseSetPostCommand(text);
 * console.log('Tweet:', keywords); // Hey friends, just played a thrilling game of ball with a tiger in the backyard! 🐯🏀
 * console.log('Keywords:', keywords); // ['ball', 'tiger', 'friends']
 * console.log('Hashtags:', hashtags); // ['#nodejs', 'coding', '#wildlife', '#friends']
 */

function parseSetPostCommand(text: string): ExtractedData {
	// Regular expressions to match lines containing tweet, keywords and hashtags
	const setPostRegex = /# SetPost\s*Tweet:\s*"([^"]*)"\s*Keywords:\s*([^]*?)\s*Hashtags:\s*([^]*)/;

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

	// Returning an object with extracted keywords and hashtags
	return { tweet, keywords, hashtags };
}

export { parseSetPostCommand };
