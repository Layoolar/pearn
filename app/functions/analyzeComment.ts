import { CommentDBData, Post } from "@app/types/databases.type";
import { ReferencedTweetV2, TwitterApi } from "twitter-api-v2";
import { getPost, deleteComments, getComments, writePoint } from "@app/functions/databases";
import config from "@configs/config";
import writeLog from "./logger";

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
			writeLog("comments_fetch.log", `${new Date().toLocaleString()}: CAMPAIGN ENDED, FETCHING STARTED\n`);
			const collection: ResponseObject<unknown>[] = [];
			const desiredTimeInterval = 60000;
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
				} catch (error) {
					continue;
				}

				lastRequestTimestamp = Date.now();
			}

			for (const dt of collection) {
				const { error, data } = dt;
				if (!error) {
					writeLog("comments_fetch.log", `${new Date().toLocaleString()}: ${dt}\n`);
					if ((data as CommentData).user_id && (data as CommentData).points) {
						writePoint((data as CommentData).user_id, (data as CommentData).points);
					}
				} else {
					writeLog("unfetched_comments.log", `${new Date().toLocaleString()}: ${dt}\n`);
				}
			}
		} catch (error) {
			writeLog("fetch_error.log", `${new Date().toLocaleString()}: ${error}\n`);
		} finally {
			deleteComments(this.postId);
			writeLog("comments_fetch.log", `${new Date().toLocaleString()}: FETCHING ENDED\n`);
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
					const ht = entities?.hashtags?.map((hashtag) => hashtag.tag);
					const points_data = this.awardPointsForComment(text, ht);
					const respObj: ResponseObject<CommentData> = {
						error: false,
						data: {
							user_id: current.user_id,
							comment_id: id,
							post_id: this.postId || "",
							text: text,
							hashtags: ht || null,
							points: points_data?.points || 0,
						},
					};
					res.push(respObj);
				}
			}
		} catch (e) {
			const errors = TwitterApi.getErrors(e);
			for (const err of errors) {
				writeLog("fetch_error.log", `${new Date().toLocaleString()}: ${err}\n`);
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
	private awardPointsForComment(comment_text = "", comment_hashtags: string[] = []): PointsData | null {
		const post: Post | null = getPost(this.postId);
		if (!post) {
			return null;
		}
		const {
			entities: { hashtags, keywords },
		} = post;
		const data = {
			total_hashtags: hashtags.length,
			total_keywords: keywords.length,
			hashtags_found: 0,
			keywords_found: 0,
			points: 0,
			total_points: (hashtags.length + keywords.length) * 10,
		};

		if (!comment_text.length) {
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
		data.points *= 10;
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
		return new Promise<void>((resolve) => setTimeout(resolve, ms));
	}
}

export { AnalyzeComment };
