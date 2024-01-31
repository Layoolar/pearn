const fetchComment = async (link?: string): Promise<void> => {
	if (link) {
		return new Promise((resolve) => resolve());
	}
	return new Promise((_, reject) => reject());
};

/**
 * Fetch comments from the provided links, respecting a minimum time interval between requests.
 * @param {string[]} links - An array of comment links to fetch.
 */
const fetchComments = async (links: string[]): Promise<void> => {
	const desiredTimeInterval = 4000;
	let lastRequestTimestamp = Date.now();

	for (const link of links) {
		const currentTimestamp = Date.now();
		const timeElapsed = currentTimestamp - lastRequestTimestamp;

		if (timeElapsed < desiredTimeInterval) {
			const delay = desiredTimeInterval - timeElapsed;
			await wait(delay);
		}

		try {
			await fetchComment(link);
			// console.log("\u001b[38:5:82m", `Fetching comment from link: ${link}`, "\u001b[0m");
		} catch (error) {
			// console.error("\u001b[38:5:160m", `Error fetching comment for link: ${link}`, "\u001b[0m");
			continue; // Continue to the next link in case of error
		}

		lastRequestTimestamp = Date.now();
	}
};

/**
 * wait - delays a request
 * Utility function to wait for the specified amount of time.
 * @param {number} ms - The number of milliseconds to wait.
 *
 * @return {Promise<void>}
 */
const wait = (ms: number): Promise<void> => {
	// console.log("\u001b[48:5:129m", "Request throttling...", "\u001b[0m");
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
};

export { fetchComments };
