import { Context } from "telegraf";
import config from "@configs/config";

class MockFetch {
	private comments: string[];

	constructor() {
		this.comments = [
			"https://twitter.com/example_tweet/status/1234567890/comment/9876543210",
			"https://twitter.com/example_tweet/status/1234567890/comment/9876543211",
			"",
			"https://twitter.com/example_tweet/status/1234567890/comment/9876543212",
			"https://twitter.com/example_tweet/status/1234567890/comment/9876543213",
			"",
			"",
			"https://twitter.com/example_tweet/status/1234567890/comment/9876543214",
			"",
			"https://twitter.com/example_tweet/status/1234567890/comment/9876543215",
			"",
			"https://twitter.com/example_tweet/status/1234567890/comment/9876543216",
		];
	}

	public start(ctx: Context): void {
		this.fetchComments(this.comments)
			.then(() => {
				ctx.telegram.sendMessage(config.group_info.creator_id, "All your links have been checked");
			})
			.catch();
	}

	private fetchComment = async (link?: string): Promise<void> => {
		if (link) {
			return new Promise((resolve) => resolve());
		}
		return new Promise((_, reject) => reject());
	};

	private fetchComments = async (links: string[]): Promise<void> => {
		const desiredTimeInterval = 4000;
		let lastRequestTimestamp = Date.now();
		const { log, error } = console;

		for (const link of links) {
			const currentTimestamp = Date.now();
			const timeElapsed = currentTimestamp - lastRequestTimestamp;

			if (timeElapsed < desiredTimeInterval) {
				const delay = desiredTimeInterval - timeElapsed;
				await this.wait(delay);
			}

			try {
				await this.fetchComment(link);
				log("\u001b[38:5:82m", `Fetched comment from link: ${link} successfully`, "\u001b[0m");
			} catch (e) {
				error("\u001b[38:5:160m", `Error fetching comment for link: ${link}`, "\u001b[0m");
				continue;
			}

			lastRequestTimestamp = Date.now();
		}
	};

	private wait = (ms: number): Promise<void> => {
		const { log } = console;
		log("\u001b[48:5:129m", "Request throttling...", "\u001b[0m");
		return new Promise<void>((resolve) => setTimeout(resolve, ms));
	};
}

export { MockFetch };
