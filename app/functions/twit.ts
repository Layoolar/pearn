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
		data.points += 1 * countHashtags.length;
		data.hashtags_found = countHashtags.length;
	}
	const countKeywords = keywords.filter((keyword) => tweet.full_text.toLowerCase().includes(keyword.toLowerCase()));
	if (countKeywords.length) {
		data.points += 1 * countKeywords.length;
		data.keywords_found = countKeywords.length;
	}

	if (data.points > 0) {
		data.points = Math.round((data.points / (data.total_hashtags + data.total_keywords)) * post_points);
	}

	return data;
};

export { fetchTweet, checkTweet };
