import configs from "@configs/config";
import Twit from "twit";

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
 * @param {string} link - link string
 * @return {boolean} true / false
 */
const checkLinkandExtractId = (link: string): string | null => {
	const twitterRegex = /^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?:\w+\/status\/(\d+))(?:\?.*)?$/i;
	const match = link.match(twitterRegex);
	return match ? match[1] : null;
};

/**
 *
 * @param {string} tweetId - link string
 * @return {Tweet | null} response or null
 */
const fetchTweet = async (tweetId: string): Promise<Tweet | null> => {
	try {
		const response = await twitterClient.get("statuses/show/:id", { id: tweetId, tweet_mode: "extended" });
		return response.data as Tweet;
	} catch (error) {
		// TODO Take care of response and send to user
		// console.error("Error fetching tweet:", error);
		return null;
	}
};

/**
 *
 * @param {Tweet} tweet - tweet param
 * @return {number} points
 */
const checkTweet = (tweet: Tweet | null): TweetCheckData => {
	const hashtags = ["nodejs", "react", "typescript"];
	const keywords = ["new", "project"];
	const data = {
		tweet_found: false,
		total_hashtags: hashtags.length,
		total_keywords: keywords.length,
		hashtags_found: 0,
		keywords_found: 0,
		points: 0,
	};

	if (!tweet) {
		return data;
	}
	data.tweet_found = true;

	const tagsArray = tweet.entities.hashtags.map((hashtag) => hashtag.text);
	const countHashtags = hashtags.filter((item) => tagsArray.indexOf(item) !== -1);
	if (countHashtags.length) {
		data.points += 1 * countHashtags.length;
		data.hashtags_found = countHashtags.length;
	}
	const countKeywords = keywords.filter((keyword) => tweet.full_text.includes(keyword));
	if (countKeywords.length) {
		data.points += 1 * countKeywords.length;
		data.keywords_found = countKeywords.length;
	}

	return data;
};

export { checkLinkandExtractId, fetchTweet, checkTweet };
