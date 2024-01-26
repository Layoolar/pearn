import configs from "@configs/config";
import Twit from "twit";
import { Post } from "./databases";

/**
 *
 */
type TweetCheckData = {
	tweet_found: boolean;
	total_hashtags: number;
	total_keywords: number;
	hashtags_found: number;
	keywords_found: number;
	points: number;
	total_points: number;
};

/**
 *
 */
type Tweet = {
	id_str: string;
	full_text: string;
	user: {
		screen_name: string;
		name: string;
	};
	entities: {
		hashtags: Array<{ text: string }>;
	};
};

const twitterClient = new Twit({
	consumer_key: configs.twitter.consumer_key,
	consumer_secret: configs.twitter.consumer_secret,
	access_token: configs.twitter.access_token,
	access_token_secret: configs.twitter.access_token_secret,
});

/**
 *
 * @param {string} tweetId - link string
 * @return {Tweet | null} response or null
 */
const fetchTweet = (tweetId: string): Promise<Tweet | null> => {
	return new Promise((resolve, reject) => {
		twitterClient
			.get("statuses/show/:id", { id: tweetId, tweet_mode: "extended" })
			.then((response) => resolve(response.data as Tweet))
			.catch((error) => {
				reject(error);
			});
	});
};

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
			console.log("\u001b[38:5:82m", `Fetching comment from link: ${link}`, "\u001b[0m");
		} catch (error) {
			console.error("\u001b[38:5:160m", `Error fetching comment for link: ${link}`, "\u001b[0m");
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
	console.log("\u001b[48:5:129m", "Request throttling...", "\u001b[0m");
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
};

/**
 *
 */
// const fetchComment = (): void => {
// 	const tweetLink = "https://twitter.com/user/status/1234567890123456789?comment_id=1234567890123456789";

// 	const [, tweetId, commentId] = tweetLink.match(/status\/(\d+)\?comment_id=(\d+)/) || [];

// 	twitterClient.get("statuses/show", { id: tweetId }, (err, tweetData, response) => {
// 		if (err) {
// 			console.error("Error fetching tweet:", err);
// 			return;
// 		}

// 		// Fetch replies to the original tweet
// 		twitterClient.get(
// 			"search/tweets",
// 			{ q: `to:${tweetData.user.screen_name}`, since_id: tweetId, count: 100 },
// 			(err, searchData, response) => {
// 				if (err) {
// 					console.error("Error fetching replies:", err);
// 					return;
// 				}

// 				// Find the specific comment
// 				const replies = searchData.statuses;
// 				const comment = replies.find(
// 					(reply) => reply.in_reply_to_status_id_str === tweetId && reply.id_str === commentId,
// 				);

// 				if (comment) {
// 					console.log("Comment:", comment.text);
// 					// Process and send the comment to your Telegraf bot users
// 				} else {
// 					console.log("Comment not found.");
// 				}
// 			},
// 		);
// 	});
// };

/**
 *
 * @param {Tweet} tweet - tweet param
 * @param {Post} post - tweet param
 * @return {number} points
 */
const checkTweet = (tweet: Tweet | null, post: Post): TweetCheckData => {
	const {
		post_points,
		entities: { hashtags, keywords },
	} = post;
	const data = {
		tweet_found: false,
		total_hashtags: hashtags.length,
		total_keywords: keywords.length,
		hashtags_found: 0,
		keywords_found: 0,
		points: 0,
		total_points: post_points,
	};

	if (!tweet) {
		return data;
	}
	data.tweet_found = true;

	const tagsArray = tweet.entities.hashtags.map((hashtag) => hashtag.text.toLowerCase());
	const countHashtags = hashtags.filter((item) => {
		item = item.toLowerCase();
		if (item.startsWith("#")) {
			return tagsArray.indexOf(item.substring(1)) !== -1;
		}
		return tagsArray.indexOf(item) !== -1;
	});
	if (countHashtags.length) {
		data.points += (post_points / (data.total_hashtags + data.total_keywords)) * countHashtags.length;
		data.hashtags_found = countHashtags.length;
	}
	const countKeywords = keywords.filter((keyword) => tweet.full_text.toLowerCase().includes(keyword.toLowerCase()));
	if (countKeywords.length) {
		data.points += (post_points / (data.total_hashtags + data.total_keywords)) * countKeywords.length;
		data.keywords_found = countKeywords.length;
	}

	return data;
};

export { fetchTweet, fetchComments, checkTweet };
