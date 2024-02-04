import { CommentDBData } from "@app/types/databases.type";
import { ReferencedTweetV2, TwitterApi } from "twitter-api-v2";
import { deleteComments, getComments, writePoint } from "@app/functions/databases";
import config from "@configs/config";

type CommentData = {
	user_id: number;
	post_id: string;
	comment_id: string;
	text: string;
	hashtags: string[] | null;
	points: number;
};

type PointsData = {
	total_hashtags: number;
	total_keywords: number;
	hashtags_found: number;
	keywords_found: number;
	points: number;
	total_points: number;
};

type ResponseObject<T> = {
	error: boolean;
	data: T;
};

type MyClassProps = {
	fetchSize?: number;
};

// Initialize the Twitter API client with your credentials
const twitterClient = new TwitterApi({
	appKey: config.twitter.consumer_key,
	appSecret: config.twitter.consumer_secret,
	accessToken: config.twitter.access_token,
	accessSecret: config.twitter.access_token_secret,
});

class AnalyzeComment {
	private postId: string;
	private fetchSize: number;

	constructor(postId: string, { fetchSize = 99 }: Partial<MyClassProps> = {}) {
		this.postId = postId;
		this.fetchSize = fetchSize;
	}

	async start(): Promise<void> {
		try {
			const collection: ResponseObject<unknown>[] = [];
			const desiredTimeInterval = 4000;
			let lastRequestTimestamp = Date.now();
			const comment_dbdata = getComments(this.postId);
			if (!comment_dbdata.length) {
				return;
			}
			const links = AnalyzeComment.chunkifyArray<CommentDBData>(comment_dbdata, this.fetchSize);

			for (const link of links) {
				const currentTimestamp = Date.now();
				const timeElapsed = currentTimestamp - lastRequestTimestamp;

				if (timeElapsed < desiredTimeInterval) {
					const delay = desiredTimeInterval - timeElapsed;
					await AnalyzeComment.wait(delay);
				}

				try {
					const result = await this.fetchBatchComments(link);
					collection.push(...result);
					// console.log("\u001b[38:5:82m", `Fetching comment from link: ${link}`, "\u001b[0m");
				} catch (error) {
					// console.error("\u001b[38:5:160m", `Error fetching comment for link: ${link}`, "\u001b[0m");
					continue; // Continue to the next link in case of error
				}

				lastRequestTimestamp = Date.now();
			}

			for (const { error, data } of collection) {
				if (!error) {
					if ((data as CommentData).user_id && (data as CommentData).points) {
						writePoint((data as CommentData).user_id, (data as CommentData).points);
					}
				}
			}
		} finally {
			this.destroy();
		}
	}

	private async fetchBatchComments(array: CommentDBData[]): Promise<ResponseObject<CommentData | unknown>[]> {
		const res = [];
		try {
			const response = await twitterClient.v2.tweets(
				array.map((commentData) => commentData.comment_id),
				{
					"tweet.fields": ["text", "entities", "referenced_tweets"],
				},
			);
			for (const { id, text, entities, referenced_tweets } of response.data) {
				const current = array.find((item) => item.comment_id === id);
				if (current && referenced_tweets && this.isDirectReply(referenced_tweets, this.postId)) {
					const ht = entities?.hashtags.map((hashtag) => hashtag.tag);
					const points_data = this.awardPointsForComment(text, ht);
					const respObj: ResponseObject<CommentData> = {
						error: false,
						data: {
							user_id: current.user_id,
							comment_id: id,
							post_id: this.postId || "",
							text: text,
							hashtags: ht || null,
							points: points_data.points,
						},
					};
					res.push(respObj);
				}
			}
		} catch (e) {
			const errors = TwitterApi.getErrors(e);
			console.log("\u001b[48:5:129m", "Twitter API spit out errors!!!!", e, "\u001b[0m");
			for (const err of errors) {
				console.log(err);
				const respObj: ResponseObject<unknown> = {
					error: true,
					data: err,
				};
				res.push(respObj);
			}
		}
		return res;
	}

	/**
	 * awardPointsForComment -
	 * @param {string} comment_text - comment_text
	 * @param {string[]} comment_hashtags - comment_hashtags
	 *
	 * @return {PointsData} points summary object
	 */
	private awardPointsForComment(comment_text = "", comment_hashtags: string[] = []): PointsData {
		// 	const {
		// 	entities: { hashtags, keywords },
		// } = getPost(config.group_info.);
		const hashtags: string[] = [];
		const keywords: string[] = [];
		const data = {
			total_hashtags: hashtags.length,
			total_keywords: keywords.length,
			hashtags_found: 0,
			keywords_found: 0,
			points: 0,
			total_points: hashtags.length + keywords.length,
		};

		if (!comment_text) {
			return data;
		}

		const tagsArray = comment_hashtags.map((hashtag) => hashtag.toLowerCase());
		const countHashtags = hashtags.filter((item) => {
			item = item.toLowerCase();
			if (item.startsWith("#")) {
				return tagsArray.indexOf(item.substring(1)) !== -1;
			}
			return tagsArray.indexOf(item) !== -1;
		});
		data.points += countHashtags.length;
		data.hashtags_found = countHashtags.length;

		const countKeywords = keywords.filter((keyword) => comment_text.toLowerCase().includes(keyword.toLowerCase()));
		data.points += countKeywords.length;
		data.keywords_found = countKeywords.length;

		return data;
	}

	/**
	 * chunkifyArray()
	 * =========================
	 *
	 * @param {T[]} array - the array to be chunkified
	 * @param {number} chunkSize - size of each chunkified array
	 * @return {T[][]} - The chunkified array of arrays
	 */
	static chunkifyArray<T>(array: T[], chunkSize: number): T[][] {
		const result: T[][] = [];
		for (let i = 0; i < array.length; i += chunkSize) {
			result.push(array.slice(i, i + chunkSize));
		}
		return result;
	}

	/**
	 * isDirectReply()
	 * =========================
	 * Function to check if a tweet is a direct reply to another tweet
	 *
	 * @param {ReferencedTweetV2[]} referenced_tweets - list of referenced tweet
	 * @param {string} referencedTweetId - Id of the main post
	 * @return {boolean} - true or false
	 */
	private isDirectReply(referenced_tweets: ReferencedTweetV2[], referencedTweetId: string): boolean {
		return referenced_tweets?.some(
			(refTweet: { type: string; id: string }) =>
				refTweet.id === referencedTweetId && refTweet.type === "replied_to",
		);
	}

	/**
	 * wait - delays a request
	 * Utility function to wait for the specified amount of time.
	 * @param {number} ms - The number of milliseconds to wait.
	 *
	 * @return {Promise<void>}
	 */
	static wait(ms: number): Promise<void> {
		console.log("\u001b[48:5:129m", "Request throttling...", "\u001b[0m");
		return new Promise<void>((resolve) => setTimeout(resolve, ms));
	}

	private destroy() {
		// cleanup
		deleteComments(this.postId);
		console.log("\u001b[48:5:129m", "Destroying class instance...", "\u001b[0m");
	}
}

export { AnalyzeComment };
