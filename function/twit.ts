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

// /**
//  * @param commentId
//  */
// const fetchComment = async (commentId: string): void => {
// 	const tweetLink = "https://x.com/MailafiyaRache3/status/1679842261805195264?s=20";
// 	// const tweetLink = "https://x.com/OdufaPeter/status/1679770684132671488?s=20";

// 	// TODO fetch tweetId from database
// 	const tweetId = "";

// 	twitterClient.get("search/tweets", (err, data, response) => {
// 		if (err) {
// 			return;
// 		}
// 		console.log(data);
// 		console.log(response);
// 	});

// const tweet = tweetDetails[0];
// const conversationId = tweet.conversation_id;

// // Fetch conversation thread using conversation ID
// const { data: conversation } = await twitterClient.get("tweets/search/recent", {
// 	query: `conversation_id:${conversationId}`,
// 	tweet_fields: "created_at,author_id",
// 	expansions: "author_id",
// });

// // Find the comment in the conversation
// const comment = conversation.data.find((tweet: any) => tweet.id !== tweetId);
// if (!comment) {
// 	console.error("Comment not found in the conversation");
// 	return;
// }

// // Construct and return the tweet comment object
// const tweetComment: TweetComment = {
// 	text: comment.text,
// 	author: comment.author_id,
// 	createdAt: comment.created_at,
// };
// };

export { fetchTweet, fetchComments, checkTweet };
